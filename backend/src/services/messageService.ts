import supabase from "../supabaseClient";

export interface MessageWithSender {
  id: number;
  content: string | null;
  created_at: string;
  sender_id: number;
  conversation_id: number;
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: number | null;
  sender: { id: number; name: string | null; avatar_url: string | null };
  reply_to?: { content: string | null; sender: { name: string | null } } | null;
}

const MESSAGE_SELECT = `
  id, content, created_at, sender_id, conversation_id, is_read, is_edited, is_deleted, reply_to_id,
  sender:users!messages_sender_id_fkey (id, name, avatar_url),
  reply_to:messages!messages_reply_to_id_fkey (
    content,
    sender:users!messages_sender_id_fkey (name)
  )
`;

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

    let query = supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply cursor if provided (get messages before this id)
    if (before) {
      query = query.lt("id", before);
    }

    const { data: messages, error } = await query;
    if (error) throw new Error("Failed to fetch messages");

    return (messages || []).reverse().map(this.formatMessage);
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

    return this.formatMessage(message);
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

  static async editMessage(messageId: number, senderId: number, content: string): Promise<MessageWithSender> {
    const { data: message, error } = await supabase
      .from("messages")
      .update({ content, is_edited: true })
      .eq("id", messageId)
      .eq("sender_id", senderId) // Security: Only sender can edit
      .eq("is_deleted", false)
      .select(MESSAGE_SELECT)
      .single();

    if (error || !message) throw new Error("Failed to edit message or unauthorized");
    return this.formatMessage(message);
  }

  static async deleteMessage(messageId: number, senderId: number): Promise<number> {
    const { error } = await supabase
      .from("messages")
      .update({ content: null, is_deleted: true }) // Soft delete
      .eq("id", messageId)
      .eq("sender_id", senderId);

    if (error) throw new Error("Failed to delete message or unauthorized");
    return messageId;
  }

  private static formatMessage(msg: any): MessageWithSender {
    const senderData = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
    const replyData = Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to;
    const replySender = replyData ? (Array.isArray(replyData.sender) ? replyData.sender[0] : replyData.sender) : null;

    return {
      ...msg,
      sender: senderData ?? { id: msg.sender_id, name: null, avatar_url: null },
      reply_to: replyData ? { content: replyData.content, sender: { name: replySender?.name || null } } : null,
    };
  }
}
