import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
// TODO: Migrate notification service to consolidated wolfpack service
// import WolfpackNotificationService from "@/lib/services/wolfpack-notification.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, videoId, userId, targetUserId, content, parentId } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: action, userId" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();

    switch (action) {
      case "like":
        return await handleLikeAction(supabase, videoId, userId);
      case "unlike":
        return await handleUnlikeAction(supabase, videoId, userId);
      case "comment":
        return await handleCommentAction(
          supabase,
          videoId,
          userId,
          content,
          parentId,
        );
      case "follow":
        return await handleFollowAction(supabase, userId, targetUserId);
      case "unfollow":
        return await handleUnfollowAction(
          supabase,
          userId,
          targetUserId,
        );
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in Wolfpack action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleLikeAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  videoId: string,
  userId: string,
) {
  try {
    // Check if like already exists
    const { data: existingLike } = await supabase
      .from("content_reactions")
      .select("id")
      .eq("content_id", videoId)
      .eq("content_type", "video")
      .eq("reaction_type", "like")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLike) {
      return NextResponse.json(
        { error: "Video already liked" },
        { status: 400 },
      );
    }

    // Add like
    const { error: likeError } = await supabase
      .from("content_reactions")
      .insert({
        content_id: videoId,
        content_type: "video",
        reaction_type: "like",
        user_id: userId,
      });

    if (likeError) throw likeError;

    // Update like count using RPC function
    const { error: updateError } = await supabase.rpc("increment_like_count", {
      video_id: videoId,
    });

    if (updateError) console.warn("Failed to update like count:", updateError);

    // Get video owner for notification
    const { data: video } = await supabase
      .from("content_posts")
      .select("user_id")
      .eq("id", videoId)
      .single();

    if (video && video.user_id !== userId) {
      // TODO: Add notification when notification service is migrated to consolidated service
      // WolfpackNotificationService.notifyVideoLiked(
      //   videoId,
      //   video.user_id,
      //   userId,
      // ).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: "Video liked successfully",
    });
  } catch (error) {
    console.error("Error handling like action:", error);
    return NextResponse.json(
      { error: "Failed to like video" },
      { status: 500 },
    );
  }
}

async function handleUnlikeAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  videoId: string,
  userId: string,
) {
  try {
    // Remove like
    const { error: unlikeError } = await supabase
      .from("content_reactions")
      .delete()
      .eq("content_id", videoId)
      .eq("content_type", "video")
      .eq("reaction_type", "like")
      .eq("user_id", userId);

    if (unlikeError) throw unlikeError;

    // Update like count using RPC function
    const { error: updateError } = await supabase.rpc("decrement_like_count", {
      video_id: videoId,
    });

    if (updateError) console.warn("Failed to update like count:", updateError);

    return NextResponse.json({
      success: true,
      message: "Video unliked successfully",
    });
  } catch (error) {
    console.error("Error handling unlike action:", error);
    return NextResponse.json(
      { error: "Failed to unlike video" },
      { status: 500 },
    );
  }
}

async function handleCommentAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  videoId: string,
  userId: string,
  content: string,
  parentId?: string,
) {
  try {
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("content_comments")
      .insert({
        video_id: videoId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentId || null,
      })
      .select(`
        id,
        content,
        created_at,
        user:user_id (
          id,
          first_name,
          last_name,
          display_name,
          username,
          avatar_url
        )
      `)
      .single();

    if (commentError) throw commentError;

    // Update comment count using RPC function
    const { error: updateError } = await supabase.rpc(
      "increment_comment_count",
      {
        video_id: videoId,
      },
    );

    if (updateError) {
      console.warn("Failed to update comment count:", updateError);
    }

    // Get video owner for notification
    const { data: video } = await supabase
      .from("content_posts")
      .select("user_id")
      .eq("id", videoId)
      .single();

    if (video && video.user_id !== userId) {
      // TODO: Add notification when notification service is migrated to consolidated service
      // WolfpackNotificationService.notifyVideoCommented(
      //   videoId,
      //   video.user_id,
      //   userId,
      //   content.trim(),
      // ).catch(console.error);
    }

    // TODO: Add mention notifications when notification service is migrated
    // Check for mentions in the comment
    // const mentions = WolfpackNotificationService.extractMentions(content);
    // if (mentions.length > 0) {
    //   // Resolve usernames to user IDs and send mention notifications
    //   WolfpackNotificationService.resolveUsernames(mentions)
    //     .then((mentionedUserIds: string[]) => {
    //       if (mentionedUserIds.length > 0) {
    //         return WolfpackNotificationService.notifyMentionedUsers(
    //           videoId,
    //           userId,
    //           content.trim(),
    //           mentionedUserIds,
    //         );
    //       }
    //     })
    //     .catch(console.error);
    // }

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error handling comment action:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 },
    );
  }
}

async function handleFollowAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  followerId: string,
  targetUserId: string,
) {
  try {
    if (followerId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("social_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 },
      );
    }

    // Add follow relationship
    const { error: followError } = await supabase
      .from("social_follows")
      .insert({
        follower_id: followerId,
        following_id: targetUserId,
      });

    if (followError) throw followError;

    // TODO: Add notification when notification service is migrated to consolidated service
    // WolfpackNotificationService.notifyUserFollowed(
    //   targetUserId,
    //   followerId,
    // ).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    console.error("Error handling follow action:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 },
    );
  }
}

async function handleUnfollowAction(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  followerId: string,
  targetUserId: string,
) {
  try {
    // Remove follow relationship
    const { error: unfollowError } = await supabase
      .from("social_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId);

    if (unfollowError) throw unfollowError;

    return NextResponse.json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    console.error("Error handling unfollow action:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 },
    );
  }
}
