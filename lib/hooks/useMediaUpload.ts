'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error';

interface UploadState {
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadedUrl: string | null;
  errorMessage: string;
}

interface CreatePostData {
  capturedMedia: Blob;
  caption: string;
  isVideo?: boolean;
}

export function useMediaUpload() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<UploadState>({
    uploadStatus: 'idle',
    uploadProgress: 0,
    uploadedUrl: null,
    errorMessage: ''
  });

  const uploadMedia = useCallback(async (file: Blob): Promise<string | null> => {
    if (!currentUser) {
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: 'User not authenticated'
      }));
      return null;
    }

    try {
      setState(prev => ({
        ...prev,
        uploadStatus: 'uploading',
        uploadProgress: 0,
        errorMessage: ''
      }));

      // Determine file extension based on type
      const fileExtension = file.type.includes('video') ? 'webm' : 'jpg';
      const fileName = `${Date.now()}_${currentUser.id}.${fileExtension}`;
      const filePath = `content/${currentUser.id}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('content-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('content-media')
        .getPublicUrl(filePath);

      setState(prev => ({
        ...prev,
        uploadStatus: 'completed',
        uploadProgress: 100,
        uploadedUrl: publicUrlData.publicUrl
      }));

      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Error uploading media:', error);
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadProgress: 0,
        errorMessage: error instanceof Error ? error.message : 'Upload failed'
      }));
      return null;
    }
  }, [currentUser]);

  const createPost = useCallback(async ({ capturedMedia, caption, isVideo = true }: CreatePostData) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a post',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setState(prev => ({
        ...prev,
        uploadStatus: 'uploading',
        uploadProgress: 0,
        errorMessage: ''
      }));

      // Upload media first
      const mediaUrl = await uploadMedia(capturedMedia);
      
      if (!mediaUrl) {
        return false;
      }

      // Create the post record
      const postData = {
        user_id: currentUser.id,
        caption: caption || '',
        [isVideo ? 'video_url' : 'thumbnail_url']: mediaUrl,
        content_type: isVideo ? 'video' : 'image',
        status: 'published' as const,
        is_public: true,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('content_posts')
        .insert([postData]);

      if (insertError) {
        throw insertError;
      }

      setState(prev => ({
        ...prev,
        uploadStatus: 'completed',
        uploadProgress: 100
      }));

      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      return true;

    } catch (error) {
      console.error('Error creating post:', error);
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to create post'
      }));

      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive'
      });

      return false;
    }
  }, [currentUser, uploadMedia]);

  const reset = useCallback(() => {
    setState({
      uploadStatus: 'idle',
      uploadProgress: 0,
      uploadedUrl: null,
      errorMessage: ''
    });
  }, []);

  return {
    ...state,
    uploadMedia,
    createPost,
    reset
  };
}