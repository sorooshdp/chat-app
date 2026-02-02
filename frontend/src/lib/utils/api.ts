import type {
  UserProfile,
  CreateConversationResponse,
  SendMessageResponse,
  MessageWithSender,
  ConversationWithDetails,
} from "@/lib/types/api";

interface FetchMessagesResult {
  messages: MessageWithSender[];
  hasMore: boolean;
}

const API_URL = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3000";

/**
 * Search users by query string
 */
export async function searchUsers(query: string, token: string): Promise<UserProfile[]> {
  if (query.trim().length < 2) return [];

  const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("User search failed");

  const data = await response.json();
  return data.users;
}

/**
 * Create a new conversation with participants
 */
export async function createConversation(
  participantId: number,
  token: string
): Promise<CreateConversationResponse> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participantIds: [participantId],
      type: "dm",
    }),
  });

  if (!response.ok) throw new Error("Failed to create conversation");
  return response.json();
}

/**
 * Fetch messages for a conversation with pagination support
 */
export async function fetchMessages(
  conversationId: number,
  token: string,
  limit: number = 50,
  beforeId?: string
): Promise<FetchMessagesResult> {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  if (beforeId) {
    params.set("before", beforeId);
  }

  const response = await fetch(
    `${API_URL}/api/messages/${conversationId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data = await response.json();
  return {
    messages: data.messages,
    hasMore: data.hasMore ?? false,
  };
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  token: string
): Promise<MessageWithSender> {
  const response = await fetch(`${API_URL}/api/messages/${conversationId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  const data: SendMessageResponse = await response.json();
  return data.message;
}

/**
 * Fetch a single conversation by ID
 */
export async function fetchConversation(
  conversationId: number,
  token: string
): Promise<ConversationWithDetails | null> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch conversation");
  }

  const data = await response.json();
  return data.conversation;
}
