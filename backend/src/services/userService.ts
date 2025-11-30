import supabase from "../supabaseClient";


export interface UserSearchResult {
  id: number;
  name: string | null;
  email: string;
  avatar_url: string | null;
  status: string | null;
}

export class UserService {
  /**
   * Search users by name or email, excluding current user
   * @param query - Search term
   * @param currentUserId - ID of user performing search
   * @param limit - Maximum results to return
   */
  static async searchUsers(
    query: string,
    currentUserId: number,
    limit: number = 20
  ): Promise<UserSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, status')
      .neq('id', currentUserId)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(limit);

    if (error) {
      throw new Error(`User search failed: ${error.message}`);
    }

    return users || [];
  }

  /**
   * Check if a conversation exists between two users
   */
  static async findExistingConversation(
    userId1: number,
    userId2: number
  ): Promise<number | null> {

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [userId1, userId2]);

    if (!participants) return null;

    const conversationCounts = participants.reduce((acc, item) => {
      acc[item.conversation_id] = (acc[item.conversation_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const existingConversationId = Object.entries(conversationCounts).find(
      ([, count]) => count === 2
    )?.[0];

    return existingConversationId ? parseInt(existingConversationId) : null;
  }
}
