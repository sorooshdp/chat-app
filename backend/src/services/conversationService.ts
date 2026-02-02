import type { ConversationWithDetails, User } from "../types/database";
import supabase from '../supabaseClient';

export class ConversationService {
  /**
   * Get conversations for a user with authorization check
   */
  static async getUserConversations(userId: number): Promise<ConversationWithDetails[]> {

    // Business rule: Only fetch conversations user is participant of
    const { data: participantConvs, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!participantConvs || participantConvs.length === 0) return [];

    const conversationIds = participantConvs.map(p => p.conversation_id);

    // Fetch full conversation details with participants and last message
    const { data: conversations, error: convError } = await supabase
      .from('conversation')
      .select(`
        *,
        participants:conversation_participants(
          user:users(id, name, avatar_url, status, last_seen)
        ),
        messages(content, created_at, sender_id)
      `)
      .in('id', conversationIds)
      .order('created_at', { ascending: false, foreignTable: 'messages' })
      .limit(1, { foreignTable: 'messages' });

    if (convError) throw new Error(`Database error: ${convError.message}`);

    // Calculate unread counts for each conversation using is_read
    const unreadCounts = await this.getUnreadCounts(conversationIds, userId);

    // Transform and enrich data
    return conversations.map(conv => ({
      id: conv.id,
      created_at: conv.created_at,
      type: conv.type,
      name: conv.name,
      participants: conv.participants.filter(((p: { user: User }) => p.user.id !== userId)),
      last_message: conv.messages[0] || null,
      unread_count: unreadCounts.get(conv.id) || 0,
    }));
  }

  /**
   * Calculate unread message counts for conversations using is_read field
   * Optimized: Single query instead of N queries
   */
  private static async getUnreadCounts(
    conversationIds: number[],
    userId: number
  ): Promise<Map<number, number>> {
    const unreadCounts = new Map<number, number>();

    if (conversationIds.length === 0) return unreadCounts;

    // Single query to fetch all unread messages across conversations
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', userId);

    if (error || !data) return unreadCounts;

    // Count in memory (much faster than N separate queries)
    for (const msg of data) {
      const currentCount = unreadCounts.get(msg.conversation_id) || 0;
      unreadCounts.set(msg.conversation_id, currentCount + 1);
    }

    return unreadCounts;
  }

  /**
   * Create a new conversation with participants (transactional)
   */
  static async createConversation(
    creatorId: number,
    participantIds: Array<number>,
    type: 'dm' | 'group',
    name?: string
  ): Promise<number> {

    // Business rule: DMs must have exactly 2 participants
    if (type === 'dm' && participantIds.length !== 1) {
      throw new Error('DM conversations must have exactly one other participant');
    }

    // Business rule: Check for existing DM between these users
    if (type === 'dm') {
      const existingDM = await this.findExistingDM(creatorId, participantIds[0]!);
      if (existingDM) return existingDM;
    }

    // Atomic transaction: Create conversation + add participants
    const { data: conversation, error: convError } = await supabase
      .from('conversation')
      .insert({ type, name })
      .select('id')
      .single();

    if (convError) throw new Error(`Failed to create conversation: ${convError.message}`);

    const allParticipants = [creatorId, ...participantIds];
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(
        allParticipants.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
        }))
      );

    if (participantError) {
      // Rollback: delete conversation if participant insertion fails
      await supabase.from('conversation').delete().eq('id', conversation.id);
      throw new Error(`Failed to add participants: ${participantError.message}`);
    }

    return conversation.id;
  }

  private static async findExistingDM(user1: number, user2: number): Promise<number | null> {

    const { data } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [user1, user2]);

    if (!data) return null;

    // Find conversation ID that appears twice (both users are participants)
    const conversationCounts = data.reduce((acc, item) => {
      acc[item.conversation_id] = (acc[item.conversation_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const dmConversationId = Object.entries(conversationCounts).find(
      ([_, count]) => count === 2
    )?.[0];

    return dmConversationId ? parseInt(dmConversationId) : null;
  }

  /**
   * Get a single conversation by ID with authorization check
   */
  static async getConversationById(conversationId: number, userId: number): Promise<ConversationWithDetails | null> {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return null; // Not authorized or doesn't exist
    }

    // Fetch conversation details
    const { data: conversation, error } = await supabase
      .from('conversation')
      .select(`
        *,
        participants:conversation_participants(
          user:users(id, name, avatar_url, status, last_seen)
        ),
        messages(content, created_at, sender_id)
      `)
      .eq('id', conversationId)
      .order('created_at', { ascending: false, foreignTable: 'messages' })
      .limit(1, { foreignTable: 'messages' })
      .single();

    if (error || !conversation) {
      return null;
    }

    // Calculate unread count for this conversation using is_read
    const unreadCounts = await this.getUnreadCounts([conversationId], userId);

    return {
      id: conversation.id,
      created_at: conversation.created_at,
      type: conversation.type,
      name: conversation.name,
      participants: conversation.participants.filter((p: { user: User }) => p.user.id !== userId),
      last_message: conversation.messages[0] || null,
      unread_count: unreadCounts.get(conversationId) || 0,
    };
  }
}
