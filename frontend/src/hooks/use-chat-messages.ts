"use client";

import { useState, useCallback, useRef } from "react";
import type { MessageWithSender } from "@/lib/types/api";
import type { LocalMessage } from "@/components/chat";
import { getAuthToken } from "@/lib/utils/auth";
import { deleteMessage, editMessage, fetchMessages, sendMessage } from "@/lib/utils/api";
import { emitTypingStart, emitTypingStop } from "@/lib/socket";

/** Messages with an id starting with this prefix are local-only (not yet confirmed). */
const TEMP_ID_PREFIX = "temp-";

function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
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
    is_read: msg.is_read,
    is_edited: msg.is_edited ?? false,
    is_deleted: msg.is_deleted ?? false,
    reply_to: msg.reply_to ?? null,
    reply_to_id: msg.reply_to_id != null ? msg.reply_to_id.toString() : null,
  };
}

interface UseChatMessagesOptions {
  conversationId: number | null;
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
  editingMessage: { id: string; content: string } | null;
  replyingTo: { id: string; senderName: string | null; content: string } | null;
  handleEditInit: (id: string, content: string) => void;
  handleReplyInit: (id: string, senderName: string | null, content: string) => void;
  handleCancelAction: () => void;
  handleDeleteMessage: (id: string) => Promise<void>;
}

export function useChatMessages({
  conversationId,
  currentUserId,
  onScrollToBottom,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(!!conversationId);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    senderName: string | null;
    content: string;
  } | null>(null);

  const handleEditInit = useCallback((id: string, content: string) => {
    setEditingMessage({ id, content });
    setReplyingTo(null);
    setMessageInput(content);
  }, []);

  const handleReplyInit = useCallback((id: string, senderName: string | null, content: string) => {
    setReplyingTo({ id, senderName, content });
    setEditingMessage(null);
  }, []);

  const handleCancelAction = useCallback(() => {
    setEditingMessage(null);
    setReplyingTo(null);
    setMessageInput("");
  }, []);

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

      const { messages: fetchedMessages, hasMore } = await fetchMessages(conversationId, token, MESSAGE_LIMIT);
      const mapped = fetchedMessages.map(toLocalMessage);

      setMessages((prev) => {
        const fetchedIds = new Set(mapped.map((m) => m.id));
        const concurrent = prev.filter((m) => !fetchedIds.has(m.id));
        return [...mapped, ...concurrent];
      });
      setHasMoreMessages(hasMore);
      requestAnimationFrame(() => onScrollToBottom());
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onScrollToBottom]);

  const handleInputChange = useCallback(
    (value: string): void => {
      setMessageInput(value);

      if (conversationId === null) return;

      if (value.trim() && !isTypingRef.current) {
        isTypingRef.current = true;
        emitTypingStart(conversationId);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
    [conversationId],
  );

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
      const { messages: olderMessages, hasMore } = await fetchMessages(conversationId, token, 50, oldestMessage?.id);

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

  const handleSendMessage = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      if (conversationId === null || !messageInput.trim() || currentUserId === null) return;

      const content = messageInput.trim();
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }

      if (editingMessage) {
        try {
          const updated = await editMessage(conversationId, editingMessage.id, content, token);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === editingMessage.id ? { ...toLocalMessage(updated) } : msg)),
          );
          handleCancelAction();
        } catch (error) {
          console.error("Edit failed", error);
        }
        return;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitTypingStop(conversationId);
      }

      const tempId = `${TEMP_ID_PREFIX}${Date.now()}`;

      // Resolve parent id up-front and refuse temp ids.
      const parentId = replyingTo && !isTempId(replyingTo.id) ? replyingTo.id : undefined;

      const localMessage: LocalMessage = {
        id: tempId,
        content,
        created_at: new Date().toISOString(),
        sender_id: currentUserId,
        sender: { id: currentUserId, name: null, avatar_url: null },
        status: "sending",
        isLocal: true,
        is_read: false,
        reply_to: replyingTo ? { content: replyingTo.content, sender: { name: replyingTo.senderName } } : null,
        reply_to_id: parentId ?? null,
      };

      setMessageInput("");
      setMessages((prev) => [...prev, localMessage]);

      try {
        const sentMessage = await sendMessage(conversationId, content, token, parentId);

        // Replace ONLY the temp message. If the socket already inserted the
        // real one, we let the socket handler own it (see note in the review).
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== tempId) return msg;
            return {
              ...toLocalMessage(sentMessage),
              isLocal: true,
              // Preserve reply metadata if the server response omitted it.
              reply_to: sentMessage.reply_to ?? msg.reply_to ?? null,
              reply_to_id:
                sentMessage.reply_to_id != null ? sentMessage.reply_to_id.toString() : (msg.reply_to_id ?? null),
            };
          }),
        );

        handleCancelAction();
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, status: "failed" as const } : msg)));
        // Keep replyingTo so the retry path can still send the parent id.
      }
    },
    [conversationId, messageInput, currentUserId, editingMessage, handleCancelAction, replyingTo],
  );

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      if (isTempId(id)) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
        return;
      }
      if (!conversationId) return;
      try {
        const token = getAuthToken();
        if (!token) throw new Error("No auth token found");
        await deleteMessage(conversationId, id, token);
        setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, is_deleted: true, content: "" } : msg)));
      } catch (error) {
        console.error("Delete failed", error);
      }
    },
    [conversationId],
  );

  const handleRetry = useCallback(
    async (messageId: string): Promise<void> => {
      const failedMessage = messages.find((msg) => msg.id === messageId && msg.status === "failed");
      if (!failedMessage || conversationId === null) return;

      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, status: "sending" as const } : msg)));

      try {
        const sentMessage = await sendMessage(
          conversationId,
          failedMessage.content,
          token,
          failedMessage.reply_to_id ?? undefined,
        );
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            return {
              ...toLocalMessage(sentMessage),
              isLocal: true,
              reply_to: sentMessage.reply_to ?? msg.reply_to ?? null,
              reply_to_id:
                sentMessage.reply_to_id != null ? sentMessage.reply_to_id.toString() : (msg.reply_to_id ?? null),
            };
          }),
        );
      } catch (error) {
        console.error("Error retrying message:", error);
        setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, status: "failed" as const } : msg)));
      }
    },
    [conversationId, messages],
  );

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
    editingMessage,
    replyingTo,
    handleEditInit,
    handleReplyInit,
    handleCancelAction,
    handleDeleteMessage,
  };
}
