import db from "../db";
import { MessageWithSender } from "../types/database";

interface RawMessageRow {
  id: number;
  content: string | null;
  created_at: string | Date;
  sender_id: number;
  conversation_id: number;
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: number | null;
  sender_name: string | null;
  sender_avatar_url: string | null;
  reply_content: string | null;
  reply_sender_name: string | null;
}

const MESSAGE_WITH_JOINS_SELECT = `
  SELECT
    m.id,
    m.content,
    m.created_at,
    m.sender_id,
    m.conversation_id,
    m.is_read,
    m.is_edited,
    m.is_deleted,
    m.reply_to_id,
    u.name AS sender_name,
    u.avatar_url AS sender_avatar_url,
    rm.content AS reply_content,
    ru.name AS reply_sender_name
  FROM messages m
  LEFT JOIN users u ON u.id = m.sender_id
  LEFT JOIN messages rm ON rm.id = m.reply_to_id
  LEFT JOIN users ru ON ru.id = rm.sender_id
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
    const { rows: participantRows } = await db.query<{ id: number }>(
      `SELECT id FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2
       LIMIT 1`,
      [conversationId, userId],
    );

    if (participantRows.length === 0) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    try {
      const params: unknown[] = [conversationId];
      let whereClause = "WHERE m.conversation_id = $1";

      if (before !== undefined) {
        params.push(before);
        whereClause += ` AND m.id < $${params.length}`;
      }

      params.push(limit);

      const { rows } = await db.query<RawMessageRow>(
        `${MESSAGE_WITH_JOINS_SELECT}
         ${whereClause}
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT $${params.length}`,
        params,
      );

      return rows.reverse().map((row) => this.formatMessage(row));
    } catch {
      throw new Error("Failed to fetch messages");
    }
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    replyToId?: number,
  ): Promise<MessageWithSender> {
    const { rows: participantRows } = await db.query<{ id: number }>(
      `SELECT id FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2
       LIMIT 1`,
      [conversationId, senderId],
    );

    if (participantRows.length === 0) {
      throw new Error("Unauthorized: Not a participant of this conversation");
    }

    if (replyToId != null) {
      const { rows: parentRows } = await db.query<{ id: number }>(
        `SELECT id FROM messages
         WHERE id = $1 AND conversation_id = $2
         LIMIT 1`,
        [replyToId, conversationId],
      );

      if (parentRows.length === 0) {
        throw new Error("Invalid replyToId: parent message not found in this conversation");
      }
    }

    try {
      const { rows } = await db.query<RawMessageRow>(
        `WITH inserted AS (
           INSERT INTO messages (conversation_id, sender_id, content, reply_to_id)
           VALUES ($1, $2, $3, $4)
           RETURNING *
         )
         SELECT
           m.id,
           m.content,
           m.created_at,
           m.sender_id,
           m.conversation_id,
           m.is_read,
           m.is_edited,
           m.is_deleted,
           m.reply_to_id,
           u.name AS sender_name,
           u.avatar_url AS sender_avatar_url,
           rm.content AS reply_content,
           ru.name AS reply_sender_name
         FROM inserted m
         LEFT JOIN users u ON u.id = m.sender_id
         LEFT JOIN messages rm ON rm.id = m.reply_to_id
         LEFT JOIN users ru ON ru.id = rm.sender_id`,
        [conversationId, senderId, content, replyToId ?? null],
      );

      const message = rows[0];
      if (!message) {
        throw new Error("Failed to send message");
      }

      return this.formatMessage(message);
    } catch (error) {
      console.error("Database error sending message:", error);
      throw new Error("Failed to send message");
    }
  }

  /**
   * Get all participant user IDs for a conversation
   */
  static async getConversationParticipantIds(conversationId: number): Promise<number[]> {
    try {
      const { rows } = await db.query<{ user_id: number }>(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = $1`,
        [conversationId],
      );
      return rows.map((p) => p.user_id);
    } catch (error) {
      console.error("Failed to get participants:", error);
      return [];
    }
  }

  static async editMessage(
    conversationId: number,
    messageId: number,
    senderId: number,
    content: string,
  ): Promise<MessageWithSender> {
    const { rows } = await db.query<RawMessageRow>(
      `WITH updated AS (
         UPDATE messages
         SET content = $1, is_edited = TRUE
         WHERE id = $2
           AND conversation_id = $3
           AND sender_id = $4
           AND is_deleted = FALSE
         RETURNING *
       )
       SELECT
         m.id,
         m.content,
         m.created_at,
         m.sender_id,
         m.conversation_id,
         m.is_read,
         m.is_edited,
         m.is_deleted,
         m.reply_to_id,
         u.name AS sender_name,
         u.avatar_url AS sender_avatar_url,
         rm.content AS reply_content,
         ru.name AS reply_sender_name
       FROM updated m
       LEFT JOIN users u ON u.id = m.sender_id
       LEFT JOIN messages rm ON rm.id = m.reply_to_id
       LEFT JOIN users ru ON ru.id = rm.sender_id`,
      [content, messageId, conversationId, senderId],
    );

    const message = rows[0];
    if (!message) {
      throw new Error("Failed to edit message or unauthorized");
    }

    return this.formatMessage(message);
  }

  static async deleteMessage(
    conversationId: number,
    messageId: number,
    senderId: number,
  ): Promise<number> {
    const { rows } = await db.query<{ id: number }>(
      `UPDATE messages
       SET content = NULL, is_deleted = TRUE
       WHERE id = $1
         AND conversation_id = $2
         AND sender_id = $3
         AND is_deleted = FALSE
       RETURNING id`,
      [messageId, conversationId, senderId],
    );

    const deleted = rows[0];
    if (!deleted) {
      throw new Error("Failed to delete message or unauthorized");
    }

    return deleted.id;
  }

  private static formatMessage(row: RawMessageRow): MessageWithSender {
    const createdAt =
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;

    return {
      id: row.id,
      content: row.content,
      created_at: createdAt,
      sender_id: row.sender_id,
      conversation_id: row.conversation_id,
      is_read: row.is_read,
      is_edited: row.is_edited,
      is_deleted: row.is_deleted,
      reply_to_id: row.reply_to_id,
      sender: {
        id: row.sender_id,
        name: row.sender_name ?? null,
        avatar_url: row.sender_avatar_url ?? null,
      },
      reply_to:
        row.reply_to_id != null
          ? {
              content: row.reply_content ?? null,
              sender: { name: row.reply_sender_name ?? null },
            }
          : null,
    };
  }
}