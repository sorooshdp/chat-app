"use client";

import { JSX, useState, useEffect, useRef, FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Send, AlertCircle, Check, Loader2 } from "lucide-react";
import type {
  ConversationWithDetails,
  MessageWithSender,
} from "@/lib/types/api";
import { getCurrentUserId, getAuthToken } from "@/lib/utils/auth";
import { getDisplayName } from "@/lib/utils/conversation";
import { fetchMessages, sendMessage } from "@/lib/utils/api";
import { formatTimestamp } from "@/lib/utils/date";
import {
  connectSocket,
  joinConversation,
  leaveConversation,
  onNewMessage,
  SocketMessage,
} from "@/lib/socket";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onClose: () => void;
}

type MessageStatus = "sending" | "sent" | "failed";

interface LocalMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: number;
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  status: MessageStatus;
  isLocal: boolean;
}

function toLocalMessage(msg: MessageWithSender): LocalMessage {
  return {
    id: msg.id.toString(),
    content: msg.content ?? "",
    created_at: msg.created_at,
    sender_id: msg.sender_id,
    sender: msg.sender,
    status: "sent",
    isLocal: false,
  };
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps): JSX.Element {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
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
        setMessages(fetchedMessages.map(toLocalMessage));
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation]);

  // Socket.IO connection and message subscription
  useEffect(() => {
    if (!conversation || currentUserId === null) return;

    // Connect to socket and join conversation room
    try {
      connectSocket();
      joinConversation(conversation.id);
    } catch (error) {
      console.error('Failed to connect socket:', error);
      return;
    }

    // Subscribe to new messages
    const unsubscribe = onNewMessage((newMsg: SocketMessage) => {
      console.log('New message received via Socket.IO:', newMsg);

      // Find sender info from conversation participants (already loaded)
      const senderParticipant = conversation.participants.find(
        (p) => p.user.id === newMsg.sender_id
      );

      const processedMessage: LocalMessage = {
        id: newMsg.id.toString(),
        content: newMsg.content ?? "",
        created_at: newMsg.created_at,
        sender_id: newMsg.sender_id,
        sender: senderParticipant?.user ?? {
          id: newMsg.sender_id,
          name: newMsg.sender.name,
          avatar_url: newMsg.sender.avatar_url,
        },
        status: "sent",
        isLocal: false,
      };

      // Check if message already exists (prevent duplicates from optimistic updates)
      setMessages((prev) => {
        // Check for exact ID match first
        const existsById = prev.some((msg) => msg.id === processedMessage.id);
        if (existsById) return prev;

        // Check for local message that matches this one (same sender, similar timing)
        const localMessageIndex = prev.findIndex(
          (msg) =>
            msg.isLocal &&
            msg.sender_id === processedMessage.sender_id &&
            msg.content === processedMessage.content
        );

        if (localMessageIndex !== -1) {
          // Replace local message with server message
          const updated = [...prev];
          updated[localMessageIndex] = processedMessage;
          return updated;
        }

        return [...prev, processedMessage];
      });

      scrollToBottom();
    });

    // Cleanup subscription on unmount or conversation change
    return () => {
      unsubscribe();
      leaveConversation(conversation.id);
    };
  }, [conversation, currentUserId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!conversation || !messageInput.trim() || currentUserId === null) return;

    const content = messageInput.trim();
    const tempId = `temp-${Date.now()}`;

    // Find current user's info from participants
    const currentUserParticipant = conversation.participants.find(
      (p) => p.user.id === currentUserId
    );

    // Create local message with "sending" status
    const localMessage: LocalMessage = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: {
        id: currentUserId,
        name: currentUserParticipant?.user.name || null,
        avatar_url: currentUserParticipant?.user.avatar_url || null,
      },
      status: "sending",
      isLocal: true,
    };

    // Clear input and add message immediately
    setMessageInput("");
    setMessages((prev) => [...prev, localMessage]);

    try {
      const token = getAuthToken();
      const sentMessage = await sendMessage(conversation.id, content, token);

      // Update message to "sent" status with real ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...toLocalMessage(sentMessage), isLocal: true }
            : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);

      // Update message to "failed" status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "failed" as const } : msg
        )
      );
    }
  };

  const handleRetry = async (messageId: string): Promise<void> => {
    const failedMessage = messages.find((msg) => msg.id === messageId && msg.status === "failed");
    if (!failedMessage || !conversation) return;

    // Update to sending status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "sending" as const } : msg
      )
    );

    try {
      const token = getAuthToken();
      const sentMessage = await sendMessage(conversation.id, failedMessage.content, token);

      // Replace with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...toLocalMessage(sentMessage), isLocal: true }
            : msg
        )
      );
    } catch (error) {
      console.error("Error retrying message:", error);

      // Revert to failed status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "failed" as const } : msg
        )
      );
    }
  };

  const handleDeleteFailed = (messageId: string): void => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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
    <main className="flex-1 flex flex-col h-screen md:h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 overflow-hidden">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
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
      <header className="hidden md:flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
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
      <section className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
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
              const timestamp = formatTimestamp(message.created_at);
              const isSending = message.status === "sending";
              const isSent = message.status === "sent";
              const isFailed = message.status === "failed";

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
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
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className={`text-xs ${isOwnMessage ? "text-blue-200" : "text-slate-400"}`}>
                          {timestamp}
                        </span>
                        {isOwnMessage && isSending && (
                          <Loader2 className="w-3 h-3 text-blue-300 animate-spin" />
                        )}
                        {isOwnMessage && isSent && (
                          <Check className="w-3 h-3 text-blue-300" />
                        )}
                      </div>
                    </div>

                    {isFailed && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed to send</span>
                        <button
                          onClick={() => handleRetry(message.id)}
                          className="text-blue-400 hover:underline"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleDeleteFailed(message.id)}
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
        className="flex items-center gap-2 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0"
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
