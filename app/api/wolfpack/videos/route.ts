import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import WolfpackNotificationService from "@/lib/services/wolfpack-notification.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      description,
      video_url,
      thumbnail_url,
      duration,
      view_count,
      like_count,
    } = body;

    // Validate file types and sizes for security
    if (video_url && !isValidVideoUrl(video_url)) {
      return NextResponse.json(
        { error: "Invalid video format" },
        { status: 400 },
      );
    }

    if (thumbnail_url && !isValidImageUrl(thumbnail_url)) {
      return NextResponse.json(
        { error: "Invalid thumbnail format" },
        { status: 400 },
      );
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("wolfpack_videos")
      .insert({
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        view_count: view_count || 0,
        like_count: like_count || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating video post:", error);
      return NextResponse.json(
        { error: "Failed to create video post" },
        { status: 500 },
      );
    }

    // Send notifications to followers asynchronously (don't wait for it)
    if (data && data.id) {
      WolfpackNotificationService.notifyFollowersOfNewVideo(
        data.id,
        user_id,
      ).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error in video post creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function isValidVideoUrl(url: string): boolean {
  const validExtensions = [".mp4", ".webm", ".mov", ".avi"];
  const validDomains = ["supabase.co", "cloudinary.com", "amazonaws.com"];

  try {
    const urlObj = new URL(url);
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );
    const hasValidDomain = validDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    return hasValidExtension && hasValidDomain;
  } catch {
    return false;
  }
}

function isValidImageUrl(url: string): boolean {
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  const validDomains = ["supabase.co", "cloudinary.com", "amazonaws.com"];

  try {
    const urlObj = new URL(url);
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );
    const hasValidDomain = validDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    return hasValidExtension && hasValidDomain;
  } catch {
    return false;
  }
}
