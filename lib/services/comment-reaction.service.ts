// Fixed Comment Reaction Service
export class CommentReactionService {
  constructor(private supabase: any) {}

  /**
   * Toggle reaction using the database function
   */
  async toggleReaction(commentId: string, reactionType: string) {
    try {
      const { data, error } = await this.supabase.rpc('toggle_comment_reaction', {
        p_comment_id: commentId,
        p_reaction_type: reactionType
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  }

  /**
   * Check if current user has reacted to a comment
   */
  async hasUserReacted(commentId: string, reactionType: string) {
    try {
      const { data } = await this.supabase
        .from('my_comment_reactions') // Use the view
        .select('id')
        .eq('comment_id', commentId)
        .eq('reaction_type', reactionType)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get reactions for a comment
   */
  async getCommentReactions(commentId: string) {
    try {
      const { data, error } = await this.supabase
        .from('wolfpack_comment_reactions')
        .select(`
          id,
          reaction_type,
          user:users!user_id (
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('comment_id', commentId);

      if (error) throw error;

      // Group by reaction type
      const grouped = data?.reduce((acc, reaction) => {
        if (!acc[reaction.reaction_type]) {
          acc[reaction.reaction_type] = [];
        }
        acc[reaction.reaction_type].push(reaction);
        return acc;
      }, {}) || {};

      return grouped;
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return {};
    }
  }

  /**
   * Get reaction counts for a comment
   */
  async getReactionCounts(commentId: string) {
    try {
      const { data, error } = await this.supabase
        .from('wolfpack_comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId);

      if (error) throw error;

      // Count by reaction type
      const counts = data?.reduce((acc, reaction) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
        return acc;
      }, {}) || {};

      return counts;
    } catch (error) {
      console.error('Error fetching reaction counts:', error);
      return {};
    }
  }
}