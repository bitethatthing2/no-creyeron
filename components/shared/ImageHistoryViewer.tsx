'use client';

import React, { useRef } from 'react';
import { AvatarWithFallback } from './ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/storage/uploadHelpers';
import { supabase } from '@/lib/supabase/client';

interface ProfileImageUploaderProps {
  userId: string;
  currentImageUrl?: string;
  displayName?: string;
  emoji?: string;
  onSuccess?: (newImageUrl: string) => void;
  className?: string;
}

export function ProfileImageUploader({ 
  userId, 
  currentImageUrl, 
  displayName,
  emoji,
  onSuccess,
  className 
}: ProfileImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File too large. Please select a file under 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setUploading(true);
    
    try {
      // Use existing upload helper with user-avatars bucket
      const publicUrl = await uploadImage(file, 'user-avatars', (progress) => {
        // Could show progress here if needed
      });

      // Update user's profile image in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: publicUrl,
          avatar_url: publicUrl 
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onSuccess?.(publicUrl);
      toast.success('Profile image updated successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative group">
        <AvatarWithFallback
          src={currentImageUrl}
          name={displayName || 'User'}
          emoji={emoji}
          size="xl"
          className="h-24 w-24"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded flex items-center gap-1">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="h-3 w-3" />
                  <span>Change Photo</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs"
      >
        <Upload className="h-3 w-3 mr-1" />
        Upload New
      </Button>
    </div>
  );
}