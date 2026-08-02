import supabase from "../supabaseClient";

export interface MessageWithSender {
  id: number;
  content: string | null;
  created_at: string;
  sender_id: number;
  conversation_id: number;
  is_read: boolean;
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
    limit: number = 50,
    before?: number,
  ): Promise<MessageWithSender[]> {
    // Verify user is participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participant) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    // Build query with optional cursor
    let query = supabase
      .from("messages")
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        conversation_id,
        is_read,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply cursor if provided (get messages before this id)
    if (before) {
      query = query.lt("id", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Supabase error fetching messages:", error);
      throw new Error("Failed to fetch messages");
    }

    // Reverse to get chronological order (oldest first)
    const orderedMessages = (messages || []).reverse();

    return orderedMessages.map((msg) => {
      const senderData = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      return {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        conversation_id: msg.conversation_id,
        is_read: msg.is_read,
        sender: senderData ?? { id: msg.sender_id, name: null, avatar_url: null },
      };
    });
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(conversationId: number, senderId: number, content: string): Promise<MessageWithSender> {
    // Verify user is participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", senderId)
      .single();

    if (!participant) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        conversation_id,
        is_read,
        sender:users!sender_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      console.error("Supabase error sending message:", error);
      throw new Error("Failed to send message");
    }

    const senderData = Array.isArray(message.sender) ? message.sender[0] : message.sender;
    return {
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      sender_id: message.sender_id,
      conversation_id: message.conversation_id,
      is_read: message.is_read,
      sender: senderData ?? { id: message.sender_id, name: null, avatar_url: null },
    };
  }

  /**
   * Get all participant user IDs for a conversation
   */
  static async getConversationParticipantIds(conversationId: number): Promise<number[]> {
    const { data: participants, error } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Failed to get participants:", error);
      return [];
    }

    return participants?.map((p) => p.user_id) || [];
  }
}
