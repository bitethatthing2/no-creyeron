
// Fallback handlers for missing RPC functions after schema migration
import { supabase } from '@/lib/supabase';

const supabase = createClient();

export class RPCFallbacks {
  // Fallback for check_user_membership
  static async checkUserMembership(userId: string, locationId?: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, is_wolfpack_member')
        .eq('id', userId)
        .single();
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          is_member: data.is_wolfpack_member || false,
          membership_user_id: data.id,
          status: data.is_wolfpack_member ? 'active' : 'inactive',
          joined_at: null // Could be enhanced with actual join date
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Fallback for join_wolfpack
  static async joinWolfpack(userId: string, data: any) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_wolfpack_member: true,
          display_name: data.displayName,
          wolf_emoji: data.emoji || '🐺'
        })
        .eq('id', userId);
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          success: true,
          membership_user_id: userId,
          message: 'Successfully joined wolfpack'
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Fallback for leave_wolfpack
  static async leaveWolfpack(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_wolfpack_member: false })
        .eq('id', userId);
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          success: true,
          message: 'Successfully left wolfpack'
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
