"use client";

import { JSX, useState, useEffect, useRef, FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  ConversationWithDetails,
  MessageWithSender,
  MessagesResponse,
  SendMessageResponse,
} from "@/lib/types/api";
import { getCurrentUserId, getAuthToken } from "@/lib/utils/auth";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onClose: () => void;
}

// Optimistic message type
interface OptimisticMessage {
  tempId: string;
  content: string;
  created_at: string;
  sender_id: number;
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  status: "sending" | "failed";
}

type DisplayMessage = MessageWithSender | OptimisticMessage;

function isOptimistic(message: DisplayMessage): message is OptimisticMessage {
  return "tempId" in message;
}

function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  const firstParticipant = conversation.participants[0];
  if (conversation.participants.length === 1 && firstParticipant?.user.name) {
    return firstParticipant.user.name;
  }

  const names = conversation.participants.map((p) => p.user.name).filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(", ") : "Unknown";
}

async function fetchMessages(conversationId: number, token: string): Promise<MessageWithSender[]> {
  const response = await fetch(`http://localhost:8080/api/messages/${conversationId}`, {
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

async function sendMessage(conversationId: number, content: string, token: string): Promise<MessageWithSender> {
  const response = await fetch(`http://localhost:8080/api/messages/${conversationId}`, {
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

export function ChatWindow({ conversation, onClose }: ChatWindowProps): JSX.Element {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get current user ID on mount
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);

      // Try to get user name from cookie or local storage (optional)
      // For now, we'll leave it null - the backend includes it in sender info
    } catch (error) {
      console.error("Failed to get current user ID:", error);
    }
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        const fetchedMessages = await fetchMessages(conversation.id, token);
        setMessages(fetchedMessages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!conversation || !messageInput.trim() || currentUserId === null) return;

    const content = messageInput.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: {
        id: currentUserId,
        name: null,
        avatar_url: null,
      },
      status: "sending",
    };

    // Clear input immediately
    setMessageInput("");

    // Add optimistic message to UI
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const token = getAuthToken();
      const sentMessage = await sendMessage(conversation.id, content, token);

      // Replace optimistic message with real one
      setMessages((prev) => prev.map((msg) => (isOptimistic(msg) && msg.tempId === tempId ? sentMessage : msg)));
    } catch (error) {
      console.error("Error sending message:", error);

      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) => (isOptimistic(msg) && msg.tempId === tempId ? { ...msg, status: "failed" as const } : msg))
      );
    }
  };

  const handleRetry = async (tempId: string): Promise<void> => {
    const failedMessage = messages.find((msg) => isOptimistic(msg) && msg.tempId === tempId);

    if (!failedMessage || !isOptimistic(failedMessage) || !conversation) return;

    // Mark as sending again
    setMessages((prev) =>
      prev.map((msg) => (isOptimistic(msg) && msg.tempId === tempId ? { ...msg, status: "sending" as const } : msg))
    );

    try {
      const token = getAuthToken();
      const sentMessage = await sendMessage(conversation.id, failedMessage.content, token);

      // Replace with real message
      setMessages((prev) => prev.map((msg) => (isOptimistic(msg) && msg.tempId === tempId ? sentMessage : msg)));
    } catch (error) {
      console.error("Error retrying message:", error);

      // Mark as failed again
      setMessages((prev) =>
        prev.map((msg) => (isOptimistic(msg) && msg.tempId === tempId ? { ...msg, status: "failed" as const } : msg))
      );
    }
  };

  const handleDeleteFailed = (tempId: string): void => {
    setMessages((prev) => prev.filter((msg) => !isOptimistic(msg) || msg.tempId !== tempId));
  };

  // Empty state when no conversation selected
  if (!conversation) {
    return (
      <main className="flex-1 hidden md:flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-blue-950">
        <div className="text-center">
          <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(conversation);
  const avatarUrl = conversation.participants[0]?.user.avatar_url;

  return (
    <main className="flex-1 flex flex-col bg-gradient-to-br from-black via-slate-900 to-blue-950">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/90">
        <button
          onClick={onClose}
          className="p-2 mr-3 rounded hover:bg-blue-800 text-slate-400 transition"
          aria-label="Back to contacts"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-white text-lg">{displayName}</span>
      </div>

      {/* Desktop header */}
      <header className="hidden md:flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full mr-3 border-2 border-blue-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-blue-700 flex items-center justify-center mr-3">
            <span className="text-sm font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex flex-col flex-1">
          <span className="font-bold text-white text-lg">{displayName}</span>
          <span className="text-slate-400 text-xs">{conversation.participants[0]?.user.status || "offline"}</span>
        </div>
      </header>

      {/* Messages section */}
      <section className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = currentUserId !== null && message.sender_id === currentUserId;
              const messageId = isOptimistic(message) ? message.tempId : message.id.toString();
              const timestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
              const isFailed = isOptimistic(message) && message.status === "failed";
              const isSending = isOptimistic(message) && message.status === "sending";

              return (
                <div key={messageId} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[70%]">
                    <div
                      className={`rounded-2xl px-4 py-2 shadow-lg ${
                        isFailed
                          ? "bg-red-900/50 text-white border border-red-600"
                          : isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-white"
                      } ${isSending ? "opacity-70" : ""}`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs text-slate-400 mb-1">{message.sender.name || "Unknown"}</p>
                      )}
                      <p className="break-words">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${isOwnMessage ? "text-blue-200" : "text-slate-400"}`}>
                          {timestamp}
                        </span>
                        {isSending && <span className="text-xs text-blue-300 ml-2">Sending...</span>}
                      </div>
                    </div>

                    {isFailed && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed to send</span>
                        <button
                          onClick={() => isOptimistic(message) && handleRetry(message.tempId)}
                          className="text-blue-400 hover:underline"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => isOptimistic(message) && handleDeleteFailed(message.tempId)}
                          className="text-slate-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md"
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          maxLength={5000}
          className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </main>
  );
}
