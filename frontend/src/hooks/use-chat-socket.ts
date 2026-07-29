"use client";

import { useState, useEffect, useCallback } from "react";
import type { LocalMessage } from "@/components/chat";
import {
  connectSocket,
  joinConversation,
  leaveConversation,
  onNewMessage,
  onTypingStart,
  onTypingStop,
  onMessagesRead,
  markConversationRead,
  SocketMessage,
  TypingEvent,
  MessagesReadEvent,
} from "@/lib/socket";

interface UseChatSocketOptions {
  conversationId: number | null;
  currentUserId: number | null;
  setMessages: React.Dispatch<React.SetStateAction<LocalMessage[]>>;
  onScrollToBottom: () => void;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

interface UseChatSocketReturn {
  typingUsers: Set<number>;
  isTyping: boolean;
}

/**
 * Hook to manage Socket.IO subscriptions for chat
 * Handles real-time messages, typing indicators, and read receipts
 */
export function useChatSocket({
  conversationId,
  currentUserId,
  setMessages,
  onScrollToBottom,
  typingTimeoutRef,
}: UseChatSocketOptions): UseChatSocketReturn {
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // Process incoming socket message
  const processIncomingMessage = useCallback(
    (newMsg: SocketMessage): void => {
      if (newMsg.conversation_id !== conversationId) return;

      const processedMessage: LocalMessage = {
        id: newMsg.id.toString(),
        content: newMsg.content ?? "",
        created_at: newMsg.created_at,
        sender_id: newMsg.sender_id,
        sender: newMsg.sender ?? {
          id: newMsg.sender_id,
          name: null,
          avatar_url: null,
        },
        status: "sent",
        isLocal: false,
        is_read: false,
      };

      setMessages((prev) => {
        // Check for exact ID match first (prevent duplicates)
        const existsById = prev.some((msg) => msg.id === processedMessage.id);
        if (existsById) return prev;

        // Check for local message that matches (optimistic update replacement)
        const localMessageIndex = prev.findIndex(
          (msg) =>
            msg.isLocal &&
            msg.sender_id === processedMessage.sender_id &&
            msg.content === processedMessage.content &&
            msg.status === "sending"
        );

        if (localMessageIndex !== -1) {
          const updated = [...prev];
          updated[localMessageIndex] = processedMessage;
          return updated;
        }

        // New message from someone else
        return [...prev, processedMessage];
      });

      // Clear typing indicator when message received
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(newMsg.sender_id);
        return next;
      });

      onScrollToBottom();
    },
    [conversationId, setMessages, onScrollToBottom]
  );

  // Socket connection and subscriptions
  useEffect(() => {
    if (!conversationId || currentUserId === null) return;

    // Connect to socket and join conversation room
    try {
      connectSocket();
      joinConversation(conversationId);
      markConversationRead(conversationId);
    } catch (error) {
      console.error("Failed to connect socket:", error);
      return;
    }

    // Subscribe to new messages
    const unsubscribe = onNewMessage(processIncomingMessage);

    // Subscribe to typing indicators
    const unsubscribeTypingStart = onTypingStart((event: TypingEvent) => {
      if (event.conversationId !== conversationId) return;
      if (event.userId === currentUserId) return;
      setTypingUsers((prev) => new Set(prev).add(event.userId));
    });

    const unsubscribeTypingStop = onTypingStop((event: TypingEvent) => {
      if (event.conversationId !== conversationId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(event.userId);
        return next;
      });
    });

    // Subscribe to messages read events
    const unsubscribeMessagesRead = onMessagesRead((event: MessagesReadEvent) => {
      if (event.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === currentUserId ? { ...msg, is_read: true } : msg
        )
      );
    });

    // Cleanup on unmount or conversation change
    return () => {
      unsubscribe();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeMessagesRead();
      leaveConversation(conversationId);
      setTypingUsers(new Set());

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [
    conversationId,
    currentUserId,
    processIncomingMessage,
    setMessages,
    typingTimeoutRef,
  ]);

  return {
    typingUsers,
    isTyping: typingUsers.size > 0,
  };
}
