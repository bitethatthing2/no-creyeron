import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const itemId = formData.get("itemId") as string;
    const imageType = formData.get("imageType") as string || "menu_item";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type - support both images and wolfpack_videos
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/webm",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, WebP images and WebM, MP4 wolfpack_videos are allowed.",
        },
        { status: 400 },
      );
    }

    // Validate file size (max 50MB for wolfpack_videos, 5MB for images)
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for wolfpack_videos, 5MB for images
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File size too large. Maximum size is ${
            isVideo ? "50MB" : "5MB"
          }.`,
        },
        { status: 400 },
      );
    }

    // Check user authentication first
    const userClient = await createServerClient();
    const { data: { user }, error: userError } = await userClient.auth
      .getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Use admin client for file operations
    const supabase = createAdminClient();

    // Handle profile image upload - use direct storage upload
    if (imageType === "profile") {
      try {
        // Generate unique filename for profile images
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const userFolder = user.id.substring(0, 8);
        const fileName =
          `profile/${userFolder}/${timestamp}-${randomString}.${fileExt}`;

        // Upload to the 'images' bucket using standard Supabase upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            {
              error: `Failed to upload file to storage: ${uploadError.message}`,
            },
            { status: 500 },
          );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("images")
          .getPublicUrl(fileName);

        // Create image record in database
        const { data: imageData, error: imageRecordError } = await supabase.rpc(
          "create_image_record",
          {
            p_name: file.name,
            p_url: publicUrl,
            p_size: file.size,
            p_type: "profile",
          },
        );

        if (imageRecordError) {
          console.error("Error creating image record:", imageRecordError);
          // Don't fail the whole operation, but log the error
        }

        let imageId: string | null = null;
        if (imageData && typeof imageData === "object" && "id" in imageData) {
          const rawId = imageData.id;
          imageId = typeof rawId === "string" ? rawId : String(rawId);
        }

        // Update user profile with the new image URL
        const { error: updateError } = await supabase
          .from("users")
          .update({
            profile_pic_url: publicUrl,
            profile_image_url: publicUrl,
            custom_avatar_id: imageId,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Profile update error:", updateError);
          // Don't fail the whole operation if profile update fails
        }

        return NextResponse.json({
          success: true,
          image_id: imageId,
          image_url: publicUrl,
          message: "Profile image uploaded successfully",
        });
      } catch (error) {
        console.error("Profile upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload profile image" },
          { status: 500 },
        );
      }
    }

    // For menu item images, use simplified direct upload
    try {
      // Generate unique filename for menu item images
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const userFolder = user.id.substring(0, 8);
      const fileName =
        `${imageType}/${userFolder}/${timestamp}-${randomString}.${fileExt}`;

      // Upload to the 'images' bucket using standard Supabase upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload file to storage: ${uploadError.message}` },
          { status: 500 },
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      // Create image record in database
      const { data: imageData, error: imageRecordError } = await supabase.rpc(
        "create_image_record",
        {
          p_name: file.name,
          p_url: publicUrl,
          p_size: file.size,
          p_type: imageType,
        },
      );

      if (imageRecordError) {
        console.error("Error creating image record:", imageRecordError);
        // Don't fail the whole operation, but log the error
      }

      let imageId: string | null = null;
      if (imageData && typeof imageData === "object" && "id" in imageData) {
        const rawId = imageData.id;
        imageId = typeof rawId === "string" ? rawId : String(rawId);
      }

      // If itemId is provided and this is a menu item image, update the item
      if (itemId && imageType === "menu_item") {
        try {
          // Validate itemId is a valid UUID
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(itemId)) {
            console.error("Invalid itemId format:", itemId);
            return NextResponse.json(
              { error: "Invalid item ID format" },
              { status: 400 },
            );
          }

          const { error: updateError } = await supabase.rpc(
            "admin_update_item_image",
            {
              p_item_id: itemId,
              p_image_url: publicUrl,
            },
          );

          if (updateError) {
            console.error("Error linking image to menu item:", updateError);
            // Don't fail the upload, just log the error
          }
        } catch (linkError) {
          console.error("Exception linking image to menu item:", linkError);
          // Don't fail the upload, just log the error
        }
      }

      return NextResponse.json({
        success: true,
        image_id: imageId,
        image_url: publicUrl,
        message: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Menu item upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload menu item image" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in image upload:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack available",
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
        stack: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 },
    );
  }
}

// Keep your existing GET endpoint with minor improvements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageType = searchParams.get("imageType");
    const itemId = searchParams.get("itemId");

    const supabaseClient = await createClient();

    let query = supabaseClient
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });

    if (imageType) {
      query = query.eq("image_type", imageType);
    }

    if (itemId) {
      // Validate itemId is a valid UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(itemId)) {
        return NextResponse.json(
          { error: "Invalid item ID format" },
          { status: 400 },
        );
      }

      // Get image for specific menu item
      const { data: itemData, error: itemError } = await supabaseClient
        .from("food_drink_items")
        .select("image_id")
        .eq("id", itemId)
        .single();

      if (itemError) {
        return NextResponse.json(
          { error: "Menu item not found" },
          { status: 404 },
        );
      }

      if (itemData.image_id) {
        query = query.eq("id", itemData.image_id);
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json(
        { error: "Failed to fetch images" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error in image fetch:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 },
    );
  }
}
