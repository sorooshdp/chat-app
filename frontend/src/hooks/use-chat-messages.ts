"use client";

import { useState, useCallback, useRef } from "react";
import type { MessageWithSender } from "@/lib/types/api";
import type { LocalMessage } from "@/components/chat";
import { getAuthToken } from "@/lib/utils/auth";
import { fetchMessages, sendMessage } from "@/lib/utils/api";
import { emitTypingStart, emitTypingStop } from "@/lib/socket";

function toLocalMessage(msg: MessageWithSender): LocalMessage {
  return {
    id: msg.id.toString(),
    content: msg.content ?? "",
    created_at: msg.created_at,
    sender_id: msg.sender_id,
    sender: msg.sender,
    status: "sent",
    isLocal: false,
    is_read: msg.is_read,
  };
}

interface UseChatMessagesOptions {
  conversationId: number | null; // Changed from conversation object to ID
  currentUserId: number | null;
  onScrollToBottom: () => void;
}

interface UseChatMessagesReturn {
  messages: LocalMessage[];
  setMessages: React.Dispatch<React.SetStateAction<LocalMessage[]>>;
  messageInput: string;
  isLoading: boolean;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  handleInputChange: (value: string) => void;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleLoadMore: () => Promise<void>;
  handleRetry: (messageId: string) => Promise<void>;
  handleDeleteFailed: (messageId: string) => void;
  loadInitialMessages: () => Promise<void>;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isTypingRef: React.MutableRefObject<boolean>;
}

/**
 * Hook to manage chat messages state and operations
 * Handles fetching, sending, retrying, and deleting messages
 */
export function useChatMessages({
  conversationId,
  currentUserId,
  onScrollToBottom,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Load initial messages for a conversation
  const loadInitialMessages = useCallback(async (): Promise<void> => {
    if (conversationId === null) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    const MESSAGE_LIMIT = 50;
    setIsLoading(true);

    try {
      const token = getAuthToken();

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const { messages: fetchedMessages, hasMore } = await fetchMessages(
        conversationId,
        token,
        MESSAGE_LIMIT
      );
      setMessages(fetchedMessages.map(toLocalMessage));
      setHasMoreMessages(hasMore);
      setTimeout(onScrollToBottom, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onScrollToBottom]);

  // Handle typing indicator emission
  const handleInputChange = useCallback(
    (value: string): void => {
      setMessageInput(value);

      if (conversationId === null) return;

      if (value.trim() && !isTypingRef.current) {
        isTypingRef.current = true;
        emitTypingStart(conversationId);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (conversationId !== null && isTypingRef.current) {
          isTypingRef.current = false;
          emitTypingStop(conversationId);
        }
      }, 2000);

      if (!value.trim() && isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop(conversationId);
      }
    },
    [conversationId]
  );

  // Load more (older) messages
  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (conversationId === null || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }
      const oldestMessage = messages[0];
      const { messages: olderMessages, hasMore } = await fetchMessages(
        conversationId,
        token,
        50,
        oldestMessage?.id
      );

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages.map(toLocalMessage), ...prev]);
        setHasMoreMessages(hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, messages]);

  // Send a new message
  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      if (conversationId === null || !messageInput.trim() || currentUserId === null) return;

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop(conversationId);
      }

      const content = messageInput.trim();
      const tempId = `temp-${Date.now()}`;

      // Optimistic update - create placeholder message
      const localMessage: LocalMessage = {
        id: tempId,
        content,
        created_at: new Date().toISOString(),
        sender_id: currentUserId,
        sender: {
          id: currentUserId,
          name: null, // Will be filled by socket event
          avatar_url: null,
        },
        status: "sending",
        isLocal: true,
        is_read: false,
      };

      setMessageInput("");
      setMessages((prev) => [...prev, localMessage]);

      try {
        const token = getAuthToken();

        if (!token) {
          throw new Error("No auth token found");
        }

        const sentMessage = await sendMessage(conversationId, content, token);

        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...toLocalMessage(sentMessage), isLocal: true }
              : msg
          )
        );
      } catch (error) {
        console.error("Error sending message:", error);

        // Mark as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" as const } : msg
          )
        );
      }
    },
    [conversationId, messageInput, currentUserId]
  );

  // Retry sending a failed message
  const handleRetry = useCallback(
    async (messageId: string): Promise<void> => {
      const failedMessage = messages.find(
        (msg) => msg.id === messageId && msg.status === "failed"
      );
      if (!failedMessage || conversationId === null) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "sending" as const } : msg
        )
      );

      try {
        const token = getAuthToken();

        if (!token) {
          throw new Error("No auth token found");
        }

        const sentMessage = await sendMessage(
          conversationId,
          failedMessage.content,
          token
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...toLocalMessage(sentMessage), isLocal: true }
              : msg
          )
        );
      } catch (error) {
        console.error("Error retrying message:", error);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "failed" as const } : msg
          )
        );
      }
    },
    [conversationId, messages]
  );

  // Delete a failed message
  const handleDeleteFailed = useCallback((messageId: string): void => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  return {
    messages,
    setMessages,
    messageInput,
    isLoading,
    hasMoreMessages,
    isLoadingMore,
    handleInputChange,
    handleSendMessage,
    handleLoadMore,
    handleRetry,
    handleDeleteFailed,
    loadInitialMessages,
    typingTimeoutRef,
    isTypingRef,
  };
}
