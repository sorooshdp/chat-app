import type {
  UserProfile,
  CreateConversationResponse,
  MessagesResponse,
  SendMessageResponse,
  MessageWithSender,
} from "@/lib/types/api";

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
 * Fetch messages for a conversation
 */
export async function fetchMessages(
  conversationId: number,
  token: string
): Promise<MessageWithSender[]> {
  const response = await fetch(`${API_URL}/api/messages/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data: MessagesResponse = await response.json();
  return data.messages;
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
