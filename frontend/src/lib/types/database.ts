/**
 * Core database entities
 * These mirror the exact Supabase schema
 */

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

export interface Conversation {
  id: number;
  created_at: string;
  type: "dm" | "group" | null;
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
