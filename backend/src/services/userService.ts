import supabase from "../supabaseClient";
import type { User } from "../types/database";

export class UserService {
  static async searchUsers(
    query: string,
    currentUserId: number,
    limit: number = 20
  ): Promise<Array<Pick<User, "id" | "name" | "email" | "avatar_url" | "status">>> {
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
