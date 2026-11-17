import type { User } from "../types/database";
import db from "../db";

export class UserService {
  static async searchUsers(
    query: string,
    currentUserId: number,
    limit: number = 20,
  ): Promise<Array<Pick<User, "id" | "name" | "email" | "avatar_url" | "status">>> {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    // Escape SQL LIKE wildcards (%, _, \)
    const escaped = trimmed.replace(/[%_\\]/g, "\\$&");
    const searchTerm = `%${escaped}%`;

    try {
      const { rows } = await db.query<Pick<User, "id" | "name" | "email" | "avatar_url" | "status">>(
        `SELECT id, name, email, avatar_url, status
         FROM users
         WHERE id <> $1
           AND (name ILIKE $2 ESCAPE '\\' OR email ILIKE $2 ESCAPE '\\')
         LIMIT $3`,
        [currentUserId, searchTerm, limit],
      );

      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`User search failed: ${message}`);
    }
  }
}
