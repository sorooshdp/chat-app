"use client";

import { useState, useCallback, useRef } from "react";
import type { ConversationWithDetails, MessageWithSender } from "@/lib/types/api";
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
  conversation: ConversationWithDetails | null;
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
  conversation,
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
    if (!conversation) {
      setMessages([]);
      setHasMoreMessages(false);
      return;
    }

    const MESSAGE_LIMIT = 50;
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const { messages: fetchedMessages, hasMore } = await fetchMessages(
        conversation.id,
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
  }, [conversation, onScrollToBottom]);

  // Handle typing indicator emission
  const handleInputChange = useCallback(
    (value: string): void => {
      setMessageInput(value);

      if (!conversation) return;

      if (value.trim() && !isTypingRef.current) {
        isTypingRef.current = true;
        emitTypingStart(conversation.id);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (conversation && isTypingRef.current) {
          isTypingRef.current = false;
          emitTypingStop(conversation.id);
        }
      }, 2000);

      if (!value.trim() && isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop(conversation.id);
      }
    },
    [conversation]
  );

  // Load more (older) messages
  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (!conversation || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const token = getAuthToken();
      const oldestMessage = messages[0];
      const { messages: olderMessages, hasMore } = await fetchMessages(
        conversation.id,
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
  }, [conversation, isLoadingMore, messages]);

  // Send a new message
  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      if (!conversation || !messageInput.trim() || currentUserId === null) return;

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop(conversation.id);
      }

      const content = messageInput.trim();
      const tempId = `temp-${Date.now()}`;

      const currentUserParticipant = conversation.participants.find(
        (p) => p.user.id === currentUserId
      );

      // Optimistic update
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
        is_read: false,
      };

      setMessageInput("");
      setMessages((prev) => [...prev, localMessage]);

      try {
        const token = getAuthToken();
        const sentMessage = await sendMessage(conversation.id, content, token);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...toLocalMessage(sentMessage), isLocal: true }
              : msg
          )
        );
      } catch (error) {
        console.error("Error sending message:", error);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" as const } : msg
          )
        );
      }
    },
    [conversation, messageInput, currentUserId]
  );

  // Retry sending a failed message
  const handleRetry = useCallback(
    async (messageId: string): Promise<void> => {
      const failedMessage = messages.find(
        (msg) => msg.id === messageId && msg.status === "failed"
      );
      if (!failedMessage || !conversation) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "sending" as const } : msg
        )
      );

      try {
        const token = getAuthToken();
        const sentMessage = await sendMessage(
          conversation.id,
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
    [conversation, messages]
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
