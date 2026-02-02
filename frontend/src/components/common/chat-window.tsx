"use client";

import { useEffect, useRef, useCallback } from "react";
import type { JSX } from "react";
import type { ConversationWithDetails } from "@/lib/types/api";
import { getDisplayName } from "@/lib/utils/conversation";
import {
  ChatHeader,
  MessageList,
  MessageInput,
} from "@/components/chat";
import {
  useCurrentUser,
  useChatMessages,
  useChatSocket,
} from "@/hooks";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onClose: () => void;
  isOtherUserOnline?: boolean;
}

/**
 * ChatWindow component - Main chat interface
 * Uses custom hooks for logic organization:
 * - useCurrentUser: Gets authenticated user ID
 * - useChatMessages: Manages message state and operations
 * - useChatSocket: Handles real-time socket subscriptions
 */
export function ChatWindow({
  conversation,
  onClose,
  isOtherUserOnline = false,
}: ChatWindowProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = useCurrentUser();

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Message state and operations
  const {
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
  } = useChatMessages({
    conversation,
    currentUserId,
    onScrollToBottom: scrollToBottom,
  });

  // Socket subscriptions (typing, new messages, read receipts)
  const { isTyping } = useChatSocket({
    conversationId: conversation?.id ?? null,
    currentUserId,
    setMessages,
    onScrollToBottom: scrollToBottom,
    typingTimeoutRef,
  });

  // Load messages when conversation changes
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Empty state when no conversation selected
  if (!conversation) {
    return (
      <main className="flex-1 hidden md:flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-blue-950">
        <div className="text-center">
          <p className="text-slate-400 text-lg">
            Select a conversation to start chatting
          </p>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(conversation);
  const avatarUrl = conversation.participants[0]?.user.avatar_url ?? null;

  return (
    <main className="flex-1 flex flex-col h-screen md:h-screen bg-linear-to-br from-black via-slate-900 to-blue-950 overflow-hidden">
      <ChatHeader
        displayName={displayName}
        avatarUrl={avatarUrl}
        isOnline={isOtherUserOnline}
        onBack={onClose}
      />

      <MessageList
        ref={messagesEndRef}
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isLoadingMore}
        isTyping={isTyping}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
        onDelete={handleDeleteFailed}
      />

      <MessageInput
        value={messageInput}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
      />
    </main>
  );
}
