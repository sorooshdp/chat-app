export interface User {
  id: number;
  name: string | null;
  avatar_url: string | null;
  status: string | null;
}

export interface LastMessage {
  content: string | null;
  created_at: string;
  sender_id: number;
}

export interface ConversationParticipant {
  user: User;
}

export interface ConversationWithDetails {
  id: number;
  created_at: string;
  type: string | null;
  name: string | null;
  participants: ConversationParticipant[];
  last_message: LastMessage | null;
  unread_count: number;
}

export interface ConversationsResponse {
  conversations: ConversationWithDetails[];
}
