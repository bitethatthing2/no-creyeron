import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Create/update the toggle_post_like RPC function with proper column references
    const createRpcFunction = `
      -- Drop the existing function if it exists
      DROP FUNCTION IF EXISTS toggle_post_like(text);
      DROP FUNCTION IF EXISTS toggle_post_like(uuid);
      DROP FUNCTION IF EXISTS toggle_post_like(uuid, uuid);

      -- Create the corrected toggle_post_like function
      CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id uuid)
      RETURNS json
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $$
      DECLARE
          v_user_id uuid;
          v_interaction_exists boolean := false;
          v_has_liked boolean := false;
          v_new_likes_count integer;
      BEGIN
          -- Get the authenticated user ID
          v_user_id := auth.uid();
          
          -- Check if user is authenticated
          IF v_user_id IS NULL THEN
              RETURN json_build_object(
                  'error', 'Not authenticated',
                  'code', 'UNAUTHENTICATED'
              );
          END IF;

          -- Check if interaction exists
          SELECT EXISTS(
              SELECT 1 FROM user_post_interactions 
              WHERE user_post_interactions.user_id = v_user_id 
              AND user_post_interactions.post_id = p_post_id
          ) INTO v_interaction_exists;

          -- Get current like status if interaction exists
          IF v_interaction_exists THEN
              SELECT COALESCE(user_post_interactions.has_liked, false) INTO v_has_liked
              FROM user_post_interactions 
              WHERE user_post_interactions.user_id = v_user_id 
              AND user_post_interactions.post_id = p_post_id;
          END IF;

          -- Toggle the like status
          IF v_interaction_exists THEN
              -- Update existing interaction
              UPDATE user_post_interactions 
              SET 
                  has_liked = NOT COALESCE(user_post_interactions.has_liked, false),
                  updated_at = NOW()
              WHERE user_post_interactions.user_id = v_user_id 
              AND user_post_interactions.post_id = p_post_id;
              
              v_has_liked := NOT v_has_liked;
          ELSE
              -- Create new interaction
              INSERT INTO user_post_interactions (user_id, post_id, has_liked, created_at, updated_at)
              VALUES (v_user_id, p_post_id, true, NOW(), NOW());
              
              v_has_liked := true;
          END IF;

          -- Update the likes count in content_posts
          UPDATE content_posts 
          SET likes_count = (
              SELECT COUNT(*) 
              FROM user_post_interactions 
              WHERE user_post_interactions.post_id = p_post_id 
              AND user_post_interactions.has_liked = true
          )
          WHERE content_posts.id = p_post_id;

          -- Get the new likes count
          SELECT COALESCE(content_posts.likes_count, 0) INTO v_new_likes_count
          FROM content_posts 
          WHERE content_posts.id = p_post_id;

          -- Return the result
          RETURN json_build_object(
              'liked', v_has_liked,
              'likes_count', v_new_likes_count,
              'success', true
          );

      EXCEPTION
          WHEN OTHERS THEN
              RETURN json_build_object(
                  'error', SQLERRM,
                  'code', SQLSTATE,
                  'success', false
              );
      END;
      $$;

      -- Grant execute permission to authenticated users
      GRANT EXECUTE ON FUNCTION toggle_post_like(uuid) TO authenticated;
    `;

    // Execute the RPC function creation
    const { error: rpcError } = await supabase.rpc('exec', { sql: createRpcFunction });

    if (rpcError) {
      console.error('Error creating RPC function:', rpcError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create RPC function',
        details: rpcError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'toggle_post_like RPC function created successfully'
    });

  } catch (error) {
    console.error('Error updating like RPC function:', error);
    return NextResponse.json(
      { error: 'Failed to update like RPC function', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test the function by getting current user and calling it
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user for testing'
      });
    }

    // Get a sample post to test with
    const { data: samplePost } = await supabase
      .from('content_posts')
      .select('id')
      .limit(1)
      .single();

    if (!samplePost) {
      return NextResponse.json({
        success: false,
        error: 'No posts available for testing'
      });
    }

    // Test the function
    const { data: testResult, error: testError } = await supabase
      .rpc('toggle_post_like', { p_post_id: samplePost.id });

    return NextResponse.json({
      success: true,
      message: 'RPC function test completed',
      testResult,
      testError: testError?.message
    });

  } catch (error) {
    console.error('Error testing like RPC function:', error);
    return NextResponse.json(
      { error: 'Failed to test like RPC function', details: String(error) },
      { status: 500 }
    );
  }
}