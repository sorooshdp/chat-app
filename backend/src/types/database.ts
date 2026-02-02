export interface User {
  id: number;
  created_at: string;
  name: string | null;
  email: string;
  pass: string;
  avatar_url: string | null;
  last_seen: string | null;
  status: string | null;
}

export type Users = ReadonlyArray<User>;

export interface Conversation {
  id: number;
  created_at: string;
  type: string | null;
  name: string | null;
}

export interface ConversationParticipant {
  id: number;
  created_at: string;
  conversation_id: number;
  user_id: number;
  joined_at: string | null;
}

export interface Message {
  id: number;
  created_at: string;
  sender_id: number;
  content: string | null;
  conversation_id: number;
  is_read: boolean;
}

export interface ConversationWithDetails {
  id: number;
  created_at: string;
  type: string | null;
  name: string | null;
  participants: Array<{
    user: Pick<User, 'id' | 'name' | 'avatar_url' | 'status'>;
  }>;
  last_message: Pick<Message, 'content' | 'created_at' | 'sender_id'> | null;
  unread_count: number;
}
