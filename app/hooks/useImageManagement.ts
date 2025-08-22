// app/hooks/useImageManagement.ts
"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface ImageHistoryItem {
    id: string;
    user_id: string;
    type: "profile" | "chat" | "banner" | "other";
    old_url: string;
    new_url: string;
    replaced_at: string;
    deletion_status: "pending" | "deleted" | "failed" | "kept";
    metadata?: any;
}

interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export function useImageManagement() {
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Using imported supabase client

    // Get image history for a user
    const getImageHistory = useCallback(async (
        userId: string,
        type?: "profile" | "chat" | "banner" | "other",
    ): Promise<ImageHistoryItem[]> => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("image_history")
                .select("*")
                .eq("user_id", userId)
                .order("replaced_at", { ascending: false });

            if (type) {
                query = query.eq("type", type);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            return data || [];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Upload new image
    const uploadImage = useCallback(async (
        userId: string,
        file: File,
        type: "profile" | "chat" | "banner" | "other" = "profile",
        options?: {
            deleteOld?: boolean;
            keepHistory?: number;
        },
    ): Promise<UploadResult> => {
        setUploading(true);
        setError(null);

        try {
            // Validate file
            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
            ];
            if (!validTypes.includes(file.type)) {
                throw new Error(
                    "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
                );
            }

            // Check file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error("File too large. Maximum size is 5MB.");
            }

            // Get current user data
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("profile_image_url, avatar_url")
                .eq("id", userId)
                .single();

            if (userError) throw userError;

            // Generate unique filename
            const fileExt = file.name.split(".").pop();
            const fileName = `${userId}/${type}/${uuidv4()}.${fileExt}`;
            const storagePath = `public/${fileName}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from("images")
                .upload(storagePath, file, {
                    contentType: file.type,
                    upsert: false,
                    cacheControl: "3600",
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("images")
                .getPublicUrl(storagePath);

            // Save to images table
            const { error: imageError } = await supabase
                .from("images")
                .insert({
                    name: file.name,
                    url: publicUrl,
                    size: file.size,
                    mime_type: file.type,
                    uploaded_by: userId,
                    storage_path: storagePath,
                    image_type: type,
                });

            if (imageError) {
                // Rollback: delete uploaded file
                await supabase.storage.from("images").remove([storagePath]);
                throw imageError;
            }

            // Get old image URL
            const oldImageUrl = type === "profile"
                ? userData.profile_image_url
                : userData.avatar_url;

            // Save to history if there was an old image
            if (oldImageUrl && !oldImageUrl.includes("wolf-icon")) {
                await supabase
                    .from("image_history")
                    .insert({
                        user_id: userId,
                        type: type,
                        old_url: oldImageUrl,
                        new_url: publicUrl,
                        deletion_status: options?.deleteOld
                            ? "pending"
                            : "kept",
                        metadata: {
                            file_name: file.name,
                            file_size: file.size,
                            mime_type: file.type,
                        },
                    });

                // Clean up old history entries
                if (options?.keepHistory && options.keepHistory > 0) {
                    const { data: historyEntries } = await supabase
                        .from("image_history")
                        .select("id, old_url")
                        .eq("user_id", userId)
                        .eq("type", type)
                        .order("replaced_at", { ascending: false })
                        .range(options.keepHistory, 1000);

                    if (historyEntries && historyEntries.length > 0) {
                        // Delete old history entries
                        const idsToDelete = historyEntries.map((entry) =>
                            entry.id
                        );
                        await supabase
                            .from("image_history")
                            .delete()
                            .in("id", idsToDelete);

                        // Delete old images from storage if they're pending deletion
                        for (const entry of historyEntries) {
                            if (entry.old_url.includes("supabase")) {
                                const urlParts = entry.old_url.split(
                                    "/storage/v1/object/public/images/",
                                );
                                if (urlParts[1]) {
                                    await supabase.storage
                                        .from("images")
                                        .remove([`public/${urlParts[1]}`]);
                                }
                            }
                        }
                    }
                }

                // Delete old image if requested
                if (options?.deleteOld && oldImageUrl.includes("supabase")) {
                    const urlParts = oldImageUrl.split(
                        "/storage/v1/object/public/images/",
                    );
                    if (urlParts[1]) {
                        supabase.storage
                            .from("images")
                            .remove([`public/${urlParts[1]}`])
                            .then(() => {
                                supabase
                                    .from("image_history")
                                    .update({
                                        deletion_status: "deleted",
                                        deletion_attempted_at: new Date()
                                            .toISOString(),
                                    })
                                    .eq("user_id", userId)
                                    .eq("old_url", oldImageUrl);
                            })
                            .catch((error) => {
                                console.error(
                                    "Failed to delete old image:",
                                    error,
                                );
                                supabase
                                    .from("image_history")
                                    .update({
                                        deletion_status: "failed",
                                        deletion_attempted_at: new Date()
                                            .toISOString(),
                                        deletion_error: error.message,
                                    })
                                    .eq("user_id", userId)
                                    .eq("old_url", oldImageUrl);
                            });
                    }
                }
            }

            // Update user profile with new image URL
            const updateField = type === "profile"
                ? "profile_image_url"
                : "avatar_url";
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    [updateField]: publicUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

            if (updateError) throw updateError;

            return { success: true, url: publicUrl };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setUploading(false);
        }
    }, [supabase]);

    // Revert to a previous image
    const revertImage = useCallback(async (
        userId: string,
        historyItem: ImageHistoryItem,
    ): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        setError(null);

        try {
            // Update user profile with old image URL
            const updateField = historyItem.type === "profile"
                ? "profile_image_url"
                : "avatar_url";

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    [updateField]: historyItem.old_url,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

            if (updateError) throw updateError;

            // Create new history entry for the revert
            await supabase
                .from("image_history")
                .insert({
                    user_id: userId,
                    type: historyItem.type,
                    old_url: historyItem.new_url,
                    new_url: historyItem.old_url,
                    deletion_status: "kept",
                    metadata: {
                        action: "reverted",
                        reverted_from_id: historyItem.id,
                    },
                });

            return { success: true };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        uploading,
        loading,
        error,
        uploadImage,
        getImageHistory,
        revertImage,
        clearError,
    };
}