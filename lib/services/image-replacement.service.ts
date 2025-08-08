// Complete Image Replacement System for Frontend
// This handles profile images, chat images, and provides history tracking

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface ImageReplacementResult {
  success: boolean;
  replacementId?: string;
  oldImageUrl?: string;
  oldStoragePath?: string;
  newImageUrl?: string;
  message?: string;
  error?: string;
  deletionScheduled?: boolean;
}

interface ImageHistoryItem {
  id: string;
  type: 'profile' | 'chat' | 'banner' | 'other';
  old_url: string;
  new_url: string;
  replaced_at: string;
  deletion_status: 'pending' | 'deleted' | 'failed' | 'kept';
}

// ============================================
// PROFILE IMAGE REPLACEMENT
// ============================================

export class ProfileImageManager {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Replace user's profile image with proper cleanup
   */
  async replaceProfileImage(
    userId: string,
    file: File,
    options: {
      deleteOld?: boolean;
      keepHistory?: number;
    } = {}
  ): Promise<ImageReplacementResult> {
    const { deleteOld = true, keepHistory = 3 } = options;

    try {
      // 1. Validate file
      this.validateImageFile(file);

      // 2. Generate storage path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const storagePath = `profile/${userId}/${fileName}`;

      // 3. Upload new image
      console.log('📤 Uploading new profile image...');
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 4. Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('images')
        .getPublicUrl(storagePath);

      // 5. Call the replacement function
      console.log('🔄 Replacing profile image in database...');
      const { data, error } = await this.supabase.rpc('replace_user_profile_image', {
        new_image_url_param: publicUrl,
        new_image_id_param: null
      });

      if (error) {
        // Clean up uploaded file if database update fails
        await this.supabase.storage.from('images').remove([storagePath]);
        throw new Error(`Profile update failed: ${error.message}`);
      }

      // 6. Clean up old images beyond history limit
      if (keepHistory > 0) {
        await this.cleanupOldProfileImages(userId, keepHistory);
      }

      console.log('✅ Profile image replaced successfully!');
      return data;

    } catch (error) {
      console.error('❌ Profile image replacement failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Clean up old profile images keeping only the most recent N
   */
  private async cleanupOldProfileImages(userId: string, keepCount: number): Promise<void> {
    try {
      // List all profile images for the user
      const { data: files, error } = await this.supabase.storage
        .from('images')
        .list(`profile/${userId}`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error || !files) return;

      // Delete files beyond the keep limit
      const filesToDelete = files
        .slice(keepCount)
        .map((file: any) => `profile/${userId}/${file.name}`);

      if (filesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${filesToDelete.length} old profile images...`);
        await this.supabase.storage
          .from('images')
          .remove(filesToDelete);
      }
    } catch (error) {
      console.warn('⚠️ Old image cleanup failed:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Validate image file before upload
   */
  private validateImageFile(file: File): void {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }
  }
}

// ============================================
// CHAT IMAGE REPLACEMENT
// ============================================

export class ChatImageManager {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Replace an image in a chat message
   */
  async replaceChatImage(
    messageId: string,
    userId: string,
    file: File
  ): Promise<ImageReplacementResult> {
    try {
      // 1. Validate and upload new image
      const manager = new ProfileImageManager();
      manager['validateImageFile'](file);

      // 2. Generate storage path for chat images
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const storagePath = `chat/${userId}/${fileName}`;

      // 3. Upload new image
      console.log('📤 Uploading new chat image...');
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('chat-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 4. Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('chat-images')
        .getPublicUrl(storagePath);

      // 5. Replace the chat message image
      const { data, error } = await this.supabase.rpc('replace_chat_message_image', {
        p_message_id: messageId,
        p_new_image_url: publicUrl,
        p_user_id: userId
      });

      if (error) {
        // Clean up uploaded file if update fails
        await this.supabase.storage.from('chat-images').remove([storagePath]);
        throw new Error(`Chat image update failed: ${error.message}`);
      }

      console.log('✅ Chat image replaced successfully!');
      return data;

    } catch (error) {
      console.error('❌ Chat image replacement failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ============================================
// IMAGE HISTORY MANAGEMENT
// ============================================

export class ImageHistoryManager {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get user's image replacement history
   */
  async getUserImageHistory(
    userId: string,
    imageType?: 'profile' | 'chat' | 'banner' | 'other'
  ): Promise<ImageHistoryItem[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_image_history', {
        p_user_id: userId,
        p_image_type: imageType
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch image history:', error);
      return [];
    }
  }

  /**
   * Revert to a previous image from history
   */
  async revertToPreviousImage(
    userId: string,
    historyItem: ImageHistoryItem
  ): Promise<ImageReplacementResult> {
    try {
      if (historyItem.type === 'profile') {
        // For profile images, just update the URLs
        const { error } = await this.supabase
          .from('users')
          .update({
            avatar_url: historyItem.old_url,
            profile_image_url: historyItem.old_url,
            profile_pic_url: historyItem.old_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) throw error;

        return {
          success: true,
          message: 'Reverted to previous profile image'
        };
      }

      // For other types, implement as needed
      return {
        success: false,
        error: 'Revert not implemented for this image type'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revert failed'
      };
    }
  }
}

// ============================================
// ENHANCED IMAGE UPLOADER HOOK
// ============================================

import { useState, useCallback } from 'react';

export function useImageReplacement() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const profileManager = new ProfileImageManager();
  const chatManager = new ChatImageManager();
  const historyManager = new ImageHistoryManager();

  const replaceProfileImage = useCallback(async (
    userId: string,
    file: File,
    options?: { deleteOld?: boolean; keepHistory?: number }
  ) => {
    setUploading(true);
    setError('');

    const result = await profileManager.replaceProfileImage(userId, file, options);
    
    if (!result.success) {
      setError(result.error || 'Upload failed');
    }

    setUploading(false);
    return result;
  }, [profileManager]);

  const replaceChatImage = useCallback(async (
    messageId: string,
    userId: string,
    file: File
  ) => {
    setUploading(true);
    setError('');

    const result = await chatManager.replaceChatImage(messageId, userId, file);
    
    if (!result.success) {
      setError(result.error || 'Upload failed');
    }

    setUploading(false);
    return result;
  }, [chatManager]);

  const getImageHistory = useCallback(async (
    userId: string,
    imageType?: 'profile' | 'chat' | 'banner' | 'other'
  ) => {
    return historyManager.getUserImageHistory(userId, imageType);
  }, [historyManager]);

  const revertImage = useCallback(async (
    userId: string,
    historyItem: ImageHistoryItem
  ) => {
    setUploading(true);
    setError('');

    const result = await historyManager.revertToPreviousImage(userId, historyItem);
    
    if (!result.success) {
      setError(result.error || 'Revert failed');
    }

    setUploading(false);
    return result;
  }, [historyManager]);

  return {
    uploading,
    error,
    replaceProfileImage,
    replaceChatImage,
    getImageHistory,
    revertImage,
    clearError: () => setError('')
  };
}