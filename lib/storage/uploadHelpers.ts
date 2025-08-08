import { supabase } from "@/lib/supabase";

// Type definitions for upload progress callback
type ProgressCallback = (progress: number) => void;

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage(
  file: File | Blob,
  bucket:
    | "images"
    | "wolfpack-images"
    | "wolfpack-thumbnails"
    | "user-avatars" = "wolfpack-images",
  progressCallback?: ProgressCallback,
): Promise<string> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Generate unique filename with full user ID as required by RLS policies
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file instanceof File
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Call progress callback if provided
    if (progressCallback) {
      progressCallback(100);
    }

    return publicUrl;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

/**
 * Upload a video to Supabase storage with better error handling
 */
export async function uploadVideo(
  file: File,
  progressCallback?: ProgressCallback,
): Promise<string> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Generate unique filename with full user ID as required by RLS policies
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`;

    // Report initial progress
    if (progressCallback) {
      progressCallback(10);
    }

    // Use the API endpoint for video uploads to avoid client-side timeout issues
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "wolfpack-wolfpack_videos");
    formData.append("fileName", fileName);
    formData.append("contentType", file.type);

    // Get auth token for API request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No active session");
    }

    if (progressCallback) {
      progressCallback(20);
    }

    // Upload via API endpoint with longer timeout
    const uploadResponse = await fetch("/api/upload/video", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(
        `Video upload failed: ${errorData.error || "Unknown error"}`,
      );
    }

    if (progressCallback) {
      progressCallback(90);
    }

    const { publicUrl } = await uploadResponse.json();

    // Call progress callback if provided
    if (progressCallback) {
      progressCallback(100);
    }

    return publicUrl;
  } catch (error) {
    console.error("Video upload error:", error);
    throw error;
  }
}

/**
 * Generate a thumbnail from a video file
 */
export function generateVideoThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    video.onloadedmetadata = () => {
      // Seek to 25% of video duration for thumbnail
      video.currentTime = video.duration * 0.25;
    };

    video.onseeked = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File object from the blob
            const thumbnailFile = new File([blob], "thumbnail.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            reject(new Error("Failed to generate thumbnail blob"));
          }
        },
        "image/jpeg",
        0.8,
      );
    };

    video.onerror = (e) => {
      reject(new Error("Video loading error"));
    };

    video.onabort = () => {
      reject(new Error("Video loading aborted"));
    };

    // Load video file
    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Upload file using the API endpoint (fallback method)
 */
export async function uploadFileViaAPI(
  file: File,
  itemId?: string,
  imageType: string = "wolfpack",
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("imageType", imageType);
    if (itemId) {
      formData.append("itemId", itemId);
    }

    const response = await fetch("/api/upload/images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();
    return data.image_url;
  } catch (error) {
    console.error("API upload error:", error);
    throw error;
  }
}
