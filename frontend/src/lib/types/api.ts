import type { User, Conversation, Message } from "./database";

/**
 * Public user profile - omits sensitive fields
 * Used in search results and participant lists
 */
export type UserProfile = Pick<User, "id" | "name" | "email" | "avatar_url" | "status" | "last_seen">;

/**
 * Minimal user info for UI display
 * Used when only name/avatar needed
 */
export type UserDisplay = Pick<User, "id" | "name" | "avatar_url" | "status" | "last_seen">;

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

export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
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

/**
 * Message with sender details for chat display
 */
export interface MessageWithSender extends Message {
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
}

/**
 * API response for fetching messages
 */
export interface MessagesResponse {
  messages: MessageWithSender[];
}

/**
 * API request for sending a message
 */
export interface SendMessageRequest {
  content: string;
}

/**
 * API response for sending a message
 */
export interface SendMessageResponse {
  message: MessageWithSender;
}
