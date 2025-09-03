import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // First, let's try to insert a test post to see what the exact error is
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({
        error: 'No authenticated user',
        details: userError.message
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 401 });
    }

    // Try to create a test post to diagnose the RLS issue
    const testPostData = {
      user_id: user.id,
      caption: 'RLS Test Post',
      video_url: 'https://test.com/test.mp4',
      visibility: 'public',
      is_active: true,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('content_posts')
      .insert([testPostData])
      .select();

    if (insertError) {
      // Try to get current policies
      const { data: policies, error: policyError } = await supabase
        .rpc('get_policies', { table_name: 'content_posts' })
        .select();

      return NextResponse.json({
        success: false,
        insertError: insertError.message,
        insertCode: insertError.code,
        insertHint: insertError.hint,
        insertDetails: insertError.details,
        user: { id: user.id, email: user.email },
        policies: policies || 'Unable to fetch policies',
        policyError: policyError?.message
      });
    }

    // If successful, clean up the test post
    if (insertData && insertData.length > 0) {
      await supabase
        .from('content_posts')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies are working correctly',
      insertData
    });

  } catch (error) {
    console.error('Error testing RLS policies:', error);
    return NextResponse.json(
      { error: 'Failed to test RLS policies', details: String(error) },
      { status: 500 }
    );
  }
}