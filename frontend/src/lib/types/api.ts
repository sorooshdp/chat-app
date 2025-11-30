import type { User, Conversation, Message } from "./database";

/**
 * Public user profile - omits sensitive fields
 * Used in search results and participant lists
 */
export type UserProfile = Pick<User, "id" | "name" | "email" | "avatar_url" | "status">;

/**
 * Minimal user info for UI display
 * Used when only name/avatar needed
 */
export type UserDisplay = Pick<User, "id" | "name" | "avatar_url" | "status">;

/**
 * Message preview for conversation lists
 */
export type MessagePreview = Pick<Message, "content" | "created_at" | "sender_id">;

/**
 * Participant with enriched user data
 */
export interface ConversationParticipantWithUser {
  user: UserDisplay;
}

/**
 * Enriched conversation with participants and last message
 * Used in conversation lists and detail views
 */
export interface ConversationWithDetails extends Pick<Conversation, "id" | "created_at" | "type" | "name"> {
  participants: ConversationParticipantWithUser[];
  last_message: MessagePreview | null;
  unread_count: number;
}

/**
 * API response for conversation list endpoint
 */
export interface CreateConversationResponse {
  conversationId: number;
  conversation?: ConversationWithDetails; // Optional in case backend doesn't return it
}

/**
 * API response for user search endpoint
 */
export interface UserSearchResponse {
  users: UserProfile[];
}

/**
 * API request for creating a conversation
 */
export interface CreateConversationRequest {
  participantIds: number[];
  type: "dm" | "group";
  name?: string;
}

/**
 * API response for creating a conversation
 */
export interface CreateConversationResponse {
  conversationId: number;
  conversation?: ConversationWithDetails;
}
