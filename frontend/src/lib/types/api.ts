import type { User, Conversation, Message } from "./database";

export type UserProfile = Pick<User, "id" | "name" | "email" | "avatar_url" | "status" | "last_seen">;

export type MessagePreview = Pick<Message, "content" | "created_at" | "sender_id">;

export interface ConversationParticipantWithUser {
  user: Omit<UserProfile, "email">;
}

export interface ConversationWithDetails extends Pick<Conversation, "id" | "created_at" | "type" | "name"> {
  participants: ConversationParticipantWithUser[];
  last_message: MessagePreview | null;
  unread_count: number;
}

export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
}

export interface UserSearchResponse {
  users: UserProfile[];
}

export interface CreateConversationResponse {
  conversationId: number;
  conversation?: ConversationWithDetails;
}

export interface MessageWithSender extends Message {
  sender: Pick<User, "id" | "name" | "avatar_url">;
  reply_to?: { content: string | null; sender: { name: string | null } } | null;
}
