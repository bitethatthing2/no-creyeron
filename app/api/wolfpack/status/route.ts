// app/api/wolfpack/status/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
// Helper function to get database user ID from auth user ID
async function getUserId(authId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.id;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_ERROR" },
        { status: 401 },
      );
    }

    // Get database user ID
    const databaseUserId = await getUserId(user.id);
    if (!databaseUserId) {
      return NextResponse.json({
        success: true,
        isMember: false,
        membership: null,
        location: null,
        databaseUserId: null,
        userProfile: null,
      });
    }

    // Get user profile with wolfpack status
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        avatar_url,
        profile_image_url,
        wolfpack_status,
        is_wolfpack_member,
        wolfpack_tier,
        wolfpack_tier,
        permanent_member_since,
        wolfpack_joined_at,
        location_id,
        last_activity,
        status
      `)
      .eq("id", databaseUserId)
      .single();

    if (userError) {
      console.error("User profile error:", userError);
      return NextResponse.json(
        { error: "Failed to get user profile", code: "USER_ERROR" },
        { status: 500 },
      );
    }

    // Check if user has an active wolfpack membership
    const { data: activeMembership, error: membershipError } = await supabase
      .from("wolf_pack_members")
      .select(`
        id,
        user_id,
        location_id,
        status,
        last_activity,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address,
          city,
          state,
          latitude,
          longitude,
          is_active
        )
      `)
      .eq("user_id", databaseUserId)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Membership error:", membershipError);
      return NextResponse.json(
        { error: "Failed to check membership", code: "MEMBERSHIP_ERROR" },
        { status: 500 },
      );
    }

    // Determine if user is currently a wolfpack member
    const isMember = !!(
      activeMembership ||
      userProfile?.is_wolfpack_member ||
      userProfile?.wolfpack_status === "active" ||
      userProfile?.wolfpack_tier
    );

    // Get location info (from membership or user profile)
    let locationInfo = null;
    if (activeMembership?.locations) {
      locationInfo = activeMembership.locations;
    } else if (userProfile?.location_id) {
      // Fallback: get location from user profile
      const { data: location } = await supabase
        .from("locations")
        .select(`
          id,
          name,
          address,
          city,
          state,
          latitude,
          longitude,
          is_active
        `)
        .eq("id", userProfile.location_id)
        .single();
      locationInfo = location;
    }

    // Calculate membership duration if applicable
    let membershipDuration = null;
    if (userProfile?.wolfpack_joined_at) {
      const joinedDate = new Date(userProfile.wolfpack_joined_at);
      const now = new Date();
      membershipDuration = Math.floor(
        (now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24),
      ); // days
    }

    return NextResponse.json({
      success: true,
      isMember,
      membership: activeMembership || null,
      location: locationInfo,
      databaseUserId,
      userProfile: {
        id: userProfile.id,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        displayName: userProfile.display_name,
        avatarUrl: userProfile.avatar_url || userProfile.profile_image_url,
        wolfpackStatus: userProfile.wolfpack_status,
        isWolfpackMember: userProfile.is_wolfpack_member,
        wolfpackTier: userProfile.wolfpack_tier,
        isPermanentMember: userProfile.wolfpack_tier,
        permanentMemberSince: userProfile.permanent_member_since,
        wolfpackJoinedAt: userProfile.wolfpack_joined_at,
        lastActivity: userProfile.last_activity,
        status: userProfile.status,
        membershipDuration,
      },
    });
  } catch (error) {
    console.error("Get wolfpack status error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "SERVER_ERROR",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 },
    );
  }
}
