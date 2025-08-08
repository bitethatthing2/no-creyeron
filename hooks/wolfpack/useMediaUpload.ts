import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface UseMediaUploadReturn {
  posting: boolean;
  uploadToSupabase: (
    file: Blob,
    fileName: string,
    recordingMode: "photo" | "video",
  ) => Promise<string>;
  createPost: (params: CreatePostParams) => Promise<any>;
}

interface CreatePostParams {
  capturedMedia: Blob;
  caption: string;
  recordingMode: "photo" | "video";
  recordingTime?: number;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const { user } = useAuth();
  const [posting, setPosting] = useState(false);

  // Helper function to get current public user
  const getCurrentPublicUser = useCallback(async () => {
    // First try to use the user from context
    if (user?.id) {
      return user;
    }

    // Fallback to getting auth user and finding their public profile
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      throw new Error("User not authenticated");
    }

    // Get the public user profile using the auth ID
    const { data: publicUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    if (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    if (!publicUser) {
      throw new Error("No public user profile found");
    }

    return publicUser;
  }, [user]);

  const uploadToSupabase = useCallback(
    async (file: Blob, fileName: string, recordingMode: "photo" | "video") => {
      const publicUser = await getCurrentPublicUser();

      console.log("🔍 PUBLIC USER FOR UPLOAD:", {
        id: publicUser.id,
        auth_id: publicUser.auth_id,
        email: publicUser.email,
      });

      // Debug blob info
      console.log("🎬 UPLOADING BLOB:", {
        type: file.type,
        size: file.size,
        fileName,
        recordingMode,
        publicUserId: publicUser.id,
      });

      // TEMPORARY: Use simple upload path like before while debugging
      console.log("⚡ Using simple upload (bypassing validation for now)");
      const simplePath = `${publicUser.id}/${Date.now()}-${fileName}`;
      console.log("📁 UPLOAD PATH:", simplePath);

      try {
        // Upload directly to simple path
        const { data, error } = await supabase.storage
          .from("wolfpack-media")
          .upload(simplePath, file);

        if (error) {
          console.error("Storage error:", error);
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("wolfpack-media")
          .getPublicUrl(data.path);

        console.log("✅ Upload successful:", publicUrl);
        return publicUrl;
      } catch (error) {
        console.log("❌ Simple upload failed, trying with validation...");

        // Handle missing or invalid MIME type for video recordings
        let actualMimeType = file.type;
        if (
          (recordingMode === "video" || fileName.includes("video")) &&
          (!file.type || !file.type.startsWith("video/"))
        ) {
          // Default to webm if no type is set for video recordings
          actualMimeType = "video/webm";
          console.log(
            "🔧 Corrected MIME type from",
            file.type,
            "to:",
            actualMimeType,
          );
        }

        // Determine file type
        const fileType = actualMimeType.startsWith("video/")
          ? "video"
          : "image";

        // Try validation approach
        const { data: validation, error: validationError } = await supabase.rpc(
          "validate_file_upload",
          {
            p_user_id: publicUser.id,
            p_file_type: fileType,
            p_file_size: file.size,
            p_mime_type: actualMimeType,
          },
        );

        if (validationError) {
          throw new Error(`Validation failed: ${validationError.message}`);
        }

        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Generate proper storage path
        const { data: storagePath, error: pathError } = await supabase.rpc(
          "generate_storage_path",
          {
            p_user_id: publicUser.id,
            p_file_type: fileType,
            p_filename: fileName,
          },
        );

        if (pathError) {
          throw new Error(`Path generation failed: ${pathError.message}`);
        }

        // Upload to the generated path
        const { data: validatedData, error: validatedError } = await supabase
          .storage
          .from("wolfpack-media")
          .upload(storagePath, file);

        if (validatedError) throw validatedError;

        const { data: { publicUrl } } = supabase.storage
          .from("wolfpack-media")
          .getPublicUrl(validatedData.path);

        return publicUrl;
      }
    },
    [getCurrentPublicUser],
  );

  const createPost = useCallback(
    async (
      { capturedMedia, caption, recordingMode, recordingTime = 0 }:
        CreatePostParams,
    ) => {
      if (!capturedMedia) {
        toast({
          title: "Error",
          description: "No media captured",
          variant: "destructive",
        });
        return;
      }

      try {
        setPosting(true);

        // Get the public user (this handles auth ID to public ID mapping)
        const publicUser = await getCurrentPublicUser();

        // Upload media to Supabase storage
        const fileName = recordingMode === "photo" ? "photo.jpg" : "video.mp4";
        const mediaUrl = await uploadToSupabase(
          capturedMedia,
          fileName,
          recordingMode,
        );

        // Create post in database
        const { data: postData, error: postError } = await supabase
          .from("wolfpack_videos")
          .insert({
            user_id: publicUser.id, // Use the correct public user ID
            caption: caption.trim() || "New post from Wolf Pack!",
            video_url: recordingMode === "video" ? mediaUrl : null,
            thumbnail_url: recordingMode === "photo" ? mediaUrl : null,
            duration: recordingMode === "video" ? recordingTime : null,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
          })
          .select()
          .single();

        if (postError) throw postError;

        toast({
          title: "Post created!",
          description: "Your post has been shared to the Wolf Pack feed",
        });

        return postData;
      } catch (error) {
        console.error("Error creating post:", error);

        // Show specific error message if available
        const errorMessage = error instanceof Error
          ? error.message
          : "Failed to create post. Please try again.";

        toast({
          title: "Post failed",
          description: errorMessage.includes("quota")
            ? "Storage quota exceeded. Please delete some files or upgrade your plan."
            : errorMessage.includes("File too large")
            ? "File is too large. Please try a smaller file."
            : errorMessage.includes("Invalid file type")
            ? "Invalid file type. Please upload a supported video or image format."
            : errorMessage,
          variant: "destructive",
        });

        throw error;
      } finally {
        setPosting(false);
      }
    },
    [getCurrentPublicUser, uploadToSupabase],
  );

  return {
    posting,
    uploadToSupabase,
    createPost,
  };
}
