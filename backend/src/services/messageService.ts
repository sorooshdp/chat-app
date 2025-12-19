import supabase from '../supabaseClient';

export interface MessageWithSender {
  id: number;
  content: string | null;
  created_at: string;
  sender_id: number;
  conversation_id: number;
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
}

export class MessageService {
  /**
   * Fetch messages for a conversation with sender details
   */
  static async getConversationMessages(
    conversationId: number,
    userId: number,
    limit: number = 100
  ): Promise<MessageWithSender[]> {

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    // Fetch messages with sender info
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        conversation_id,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (messages || []).map((msg) => {
      const senderData = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      return {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        conversation_id: msg.conversation_id,
        sender: senderData ?? { id: msg.sender_id, name: null, avatar_url: null },
      };
    });
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(
    conversationId: number,
    senderId: number,
    content: string
  ): Promise<MessageWithSender> {

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    if (!participant) {
      throw new Error('Unauthorized: Not a participant of this conversation');
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        conversation_id,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    const senderData = Array.isArray(message.sender) ? message.sender[0] : message.sender;
    return {
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      sender_id: message.sender_id,
      conversation_id: message.conversation_id,
      sender: senderData ?? { id: message.sender_id, name: null, avatar_url: null },
    };
  }
}
