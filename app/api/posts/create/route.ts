import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const postData = await request.json();
    
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure the post belongs to the authenticated user
    const finalPostData = {
      ...postData,
      user_id: user.id, // Override with authenticated user ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the post into the database
    const { data: insertedPost, error: insertError } = await supabase
      .from('content_posts')
      .insert([finalPostData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { 
          error: "Failed to create post",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: insertedPost,
      message: "Post created successfully"
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}