import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create the RPC function directly
    const { error } = await supabase.rpc('exec', {
      sql: `
        -- Create RPC function for creating direct conversations
        CREATE OR REPLACE FUNCTION create_direct_conversation(p_user_id UUID)
        RETURNS JSON
        SECURITY DEFINER
        SET search_path = public, pg_temp
        LANGUAGE plpgsql
        AS $$
        DECLARE
            v_conversation_id UUID;
            v_current_user_id UUID;
            v_result JSON;
        BEGIN
            -- Get current user
            v_current_user_id := auth.uid();
            
            -- Check if user is authenticated
            IF v_current_user_id IS NULL THEN
                RETURN JSON_BUILD_OBJECT(
                    'error', 'Not authenticated',
                    'code', 'UNAUTHENTICATED'
                );
            END IF;
            
            -- Check if trying to create conversation with self
            IF v_current_user_id = p_user_id THEN
                RETURN JSON_BUILD_OBJECT(
                    'error', 'Cannot create conversation with yourself',
                    'code', 'INVALID_USER'
                );
            END IF;
            
            -- Check if conversation already exists
            SELECT c.id INTO v_conversation_id
            FROM chat_conversations c
            JOIN chat_participants p1 ON c.id = p1.conversation_id
            JOIN chat_participants p2 ON c.id = p2.conversation_id
            WHERE c.conversation_type = 'direct'
              AND p1.user_id = v_current_user_id
              AND p2.user_id = p_user_id
              AND p1.is_active = true
              AND p2.is_active = true
            LIMIT 1;
            
            -- If conversation exists, return it
            IF v_conversation_id IS NOT NULL THEN
                SELECT JSON_BUILD_OBJECT(
                    'id', c.id,
                    'conversation_type', c.conversation_type,
                    'created_by', c.created_by,
                    'created_at', c.created_at,
                    'is_active', c.is_active,
                    'existing', true
                ) INTO v_result
                FROM chat_conversations c
                WHERE c.id = v_conversation_id;
                
                RETURN v_result;
            END IF;
            
            -- Create new conversation
            INSERT INTO chat_conversations (
                conversation_type,
                created_by,
                is_active
            ) VALUES (
                'direct',
                v_current_user_id,
                true
            ) RETURNING id INTO v_conversation_id;
            
            -- Add both participants
            INSERT INTO chat_participants (conversation_id, user_id, role, is_active)
            VALUES 
                (v_conversation_id, v_current_user_id, 'member', true),
                (v_conversation_id, p_user_id, 'member', true);
            
            -- Return the created conversation
            SELECT JSON_BUILD_OBJECT(
                'id', c.id,
                'conversation_type', c.conversation_type,
                'created_by', c.created_by,
                'created_at', c.created_at,
                'is_active', c.is_active,
                'existing', false
            ) INTO v_result
            FROM chat_conversations c
            WHERE c.id = v_conversation_id;
            
            RETURN v_result;
            
        EXCEPTION
            WHEN OTHERS THEN
                RETURN JSON_BUILD_OBJECT(
                    'error', SQLERRM,
                    'code', SQLSTATE
                );
        END;
        $$;

        -- Grant execute permission
        GRANT EXECUTE ON FUNCTION create_direct_conversation(UUID) TO authenticated;
      `
    });

    if (error) {
      console.error('Error creating RPC function:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RPC function created successfully' 
    });

  } catch (error) {
    console.error('Error in setup:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    );
  }
}