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
  onMessageUpdated,
  onMessageDeleted,
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

export function useChatSocket({
  conversationId,
  currentUserId,
  setMessages,
  onScrollToBottom,
  typingTimeoutRef,
}: UseChatSocketOptions): UseChatSocketReturn {
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

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
        is_edited: false,
        is_deleted: false,
        reply_to: newMsg.reply_to ?? null,
        reply_to_id: newMsg.reply_to_id != null ? newMsg.reply_to_id.toString() : null,
      };

      setMessages((prev) => {
        // Idempotency: if the real message is already in the list, do nothing.
        const existsById = prev.some((msg) => msg.id === processedMessage.id);
        if (existsById) return prev;

        // FALLBACK: if the socket did not carry reply_to but carries
        // reply_to_id, resolve the parent from the already-loaded messages.
        // This makes the receiver render the reply preview even when the
        // server emits a stripped payload.
        let replyTo = processedMessage.reply_to;
        if (!replyTo && processedMessage.reply_to_id) {
          const parent = prev.find((m) => m.id === processedMessage.reply_to_id);
          if (parent) {
            replyTo = {
              content: parent.content,
              sender: { name: parent.sender.name },
            };
          }
        }

        const withReply: LocalMessage = {
          ...processedMessage,
          reply_to: replyTo ?? null,
        };

        // Replace the optimistic message if one matches.
        const localMessageIndex = prev.findIndex(
          (msg) =>
            msg.isLocal &&
            msg.sender_id === withReply.sender_id &&
            msg.content === withReply.content &&
            msg.status === "sending",
        );

        if (localMessageIndex !== -1) {
          const updated = [...prev];
          const optimistic = updated[localMessageIndex]!;
          updated[localMessageIndex] = {
            ...withReply,
            reply_to: withReply.reply_to ?? optimistic.reply_to ?? null,
            reply_to_id: withReply.reply_to_id ?? optimistic.reply_to_id ?? null,
          };
          return updated;
        }

        return [...prev, withReply];
      });

      if (newMsg.sender_id !== currentUserId) {
        markConversationRead(newMsg.conversation_id);
      }

      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(newMsg.sender_id);
        return next;
      });

      onScrollToBottom();
    },
    [conversationId, setMessages, onScrollToBottom, currentUserId],
  );

  useEffect(() => {
    if (!conversationId || currentUserId === null) return;

    // ---- ORDER MATTERS ----
    // connectSocket() must run before any on*() subscription, otherwise
    // those subscriptions attach to a null socket and silently no-op.
    try {
      connectSocket();
      joinConversation(conversationId);
      markConversationRead(conversationId);
    } catch (error) {
      console.error("Failed to connect socket:", error);
      return;
    }

    // ---- Subscriptions (socket now exists) ----
    const unsubscribeUpdate = onMessageUpdated((updatedMsg: SocketMessage) => {
      if (updatedMsg.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMsg.id.toString()
            ? {
                ...msg,
                content: updatedMsg.content ?? "",
                is_edited: true,
              }
            : msg,
        ),
      );
    });

    const unsubscribeDelete = onMessageDeleted((data: { id: string | number }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.id.toString() ? { ...msg, content: "", is_deleted: true } : msg)),
      );
    });

    const unsubscribe = onNewMessage(processIncomingMessage);

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

    const unsubscribeMessagesRead = onMessagesRead((event: MessagesReadEvent) => {
      if (event.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((msg) => (msg.sender_id === currentUserId ? { ...msg, is_read: true } : msg)));
    });

    return () => {
      unsubscribe();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeMessagesRead();
      unsubscribeUpdate();
      unsubscribeDelete();
      leaveConversation(conversationId);
      setTypingUsers(new Set());

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [conversationId, currentUserId, processIncomingMessage, setMessages, typingTimeoutRef]);

  return {
    typingUsers,
    isTyping: typingUsers.size > 0,
  };
}
