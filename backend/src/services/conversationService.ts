import db from "../db";
import type { ConversationWithDetails, Message, User } from "../types/database";

interface RawConversationRow {
  id: number;
  created_at: string | Date;
  type: string | null;
  name: string | null;
  participants: Array<{
    user: Pick<User, "id" | "name" | "avatar_url" | "status">;
  }> | null;
  last_message: Pick<Message, "content" | "created_at" | "sender_id"> | null;
  unread_count: number;
}

const CONVERSATION_DETAILS_QUERY = `
  SELECT
    c.id,
    c.created_at,
    c.type,
    c.name,
    COALESCE(p.participants, '[]'::json) AS participants,
    lm.last_message,
    COALESCE(uc.unread_count, 0)::int AS unread_count
  FROM conversation c
  INNER JOIN conversation_participants my_cp
    ON my_cp.conversation_id = c.id AND my_cp.user_id = $1
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'user', json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url,
          'status', u.status,
          'last_seen', u.last_seen
        )
      )
    ) AS participants
    FROM conversation_participants cp
    INNER JOIN users u ON u.id = cp.user_id
    WHERE cp.conversation_id = c.id AND cp.user_id <> $1
  ) p ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_build_object(
      'content', m.content,
      'created_at', m.created_at,
      'sender_id', m.sender_id
    ) AS last_message
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS unread_count
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.is_read = FALSE
      AND m.is_deleted = FALSE
      AND m.sender_id <> $1
  ) uc ON TRUE
`;

export class ConversationService {
  /**
   * Get conversations for a user with authorization check
   */
  static async getUserConversations(userId: number): Promise<ConversationWithDetails[]> {
    try {
      const { rows } = await db.query<RawConversationRow>(
        `${CONVERSATION_DETAILS_QUERY}
         ORDER BY COALESCE(
           (lm.last_message->>'created_at')::timestamptz,
           c.created_at
         ) DESC`,
        [userId],
      );

      return rows.map((row) => this.formatConversation(row));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Database error: ${message}`);
    }
  }

  /**
   * Create a new conversation with participants (transactional)
   */
  static async createConversation(
    creatorId: number,
    participantIds: Array<number>,
    type: "dm" | "group",
    name?: string,
  ): Promise<number> {
    const uniqueOtherIds = Array.from(new Set(participantIds)).filter(
      (id) => typeof id === "number" && Number.isInteger(id) && id !== creatorId,
    );

    if (type === "dm" && uniqueOtherIds.length !== 1) {
      throw new Error("DM conversations must have exactly one other participant");
    }

    if (type === "dm") {
      const existingDM = await this.findExistingDM(creatorId, uniqueOtherIds[0]!);
      if (existingDM) return existingDM;
    }

    const allParticipants = [creatorId, ...uniqueOtherIds];
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const { rows: convRows } = await client.query<{ id: number }>(
        `INSERT INTO conversation (type, name)
         VALUES ($1, $2)
         RETURNING id`,
        [type, name ?? null],
      );

      const conversationId = convRows[0]?.id;
      if (!conversationId) {
        throw new Error("Failed to create conversation");
      }

      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         SELECT $1, UNNEST($2::int[])`,
        [conversationId, allParticipants],
      );

      await client.query("COMMIT");
      return conversationId;
    } catch (error) {
      await client.query("ROLLBACK");
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create conversation: ${message}`);
    } finally {
      client.release();
    }
  }

  private static async findExistingDM(user1: number, user2: number): Promise<number | null> {
    const { rows } = await db.query<{ conversation_id: number }>(
      `SELECT cp.conversation_id
       FROM conversation_participants cp
       INNER JOIN conversation c ON c.id = cp.conversation_id
       WHERE c.type = 'dm'
         AND cp.user_id IN ($1, $2)
       GROUP BY cp.conversation_id
       HAVING COUNT(DISTINCT cp.user_id) = 2
       LIMIT 1`,
      [user1, user2],
    );

    return rows[0]?.conversation_id ?? null;
  }

  /**
   * Get a single conversation by ID with authorization check
   */
  static async getConversationById(
    conversationId: number,
    userId: number,
  ): Promise<ConversationWithDetails | null> {
    try {
      const { rows } = await db.query<RawConversationRow>(
        `${CONVERSATION_DETAILS_QUERY}
         WHERE c.id = $2
         LIMIT 1`,
        [userId, conversationId],
      );

      const row = rows[0];
      return row ? this.formatConversation(row) : null;
    } catch {
      return null;
    }
  }

  private static formatConversation(row: RawConversationRow): ConversationWithDetails {
    const createdAt =
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;

    return {
      id: row.id,
      created_at: createdAt,
      type: row.type,
      name: row.name,
      participants: row.participants ?? [],
      last_message: row.last_message ?? null,
      unread_count: Number(row.unread_count ?? 0),
    };
  }
}