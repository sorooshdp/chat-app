"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import type { JSX } from "react";
import type { ConversationWithDetails } from "@/lib/types/api";
import { getDisplayName } from "@/lib/utils/conversation";
import { ChatHeader, MessageList, MessageInput } from "@/components/chat";
import { useCurrentUser, useChatMessages, useChatSocket } from "@/hooks";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onClose: () => void;
  isOtherUserOnline?: boolean;
}

/** Distance from bottom (px) within which we consider the user "at bottom". */
// const NEAR_BOTTOM_THRESHOLD = 120;

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

  /**
   * Tracks whether the user is currently near the bottom of the message
   * list. Used to decide whether an incoming message should auto-scroll.
   * Reserved for future use once MessageList emits scroll events.
   */
  const isNearBottomRef = useRef(true);

  const currentUserId = useCurrentUser();

  // Extract conversation ID to use as stable dependency.
  const conversationId = conversation?.id ?? null;

  const scrollToBottom = useCallback((force = false): void => {
    if (!force && !isNearBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Message state and operations.
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
    handleDeleteMessage,
    loadInitialMessages,
    typingTimeoutRef,
    editingMessage,
    replyingTo,
    handleEditInit,
    handleReplyInit,
    handleCancelAction,
  } = useChatMessages({
    conversationId,
    currentUserId,
    onScrollToBottom: scrollToBottom,
  });

  // Socket subscriptions (typing, new messages, read receipts).
  const { isTyping } = useChatSocket({
    conversationId,
    currentUserId,
    setMessages,
    onScrollToBottom: scrollToBottom,
    typingTimeoutRef,
  });

  // Load messages only when conversation ID changes.
  useEffect(() => {
    if (conversationId === null) return;
    // New conversation: allow the first auto-scroll.
    isNearBottomRef.current = true;
    loadInitialMessages();
  }, [conversationId, loadInitialMessages]);

  // Auto-scroll on new messages. Currently always fires because
  // MessageList does not yet report scroll position. When it does,
  // `isNearBottomRef` will gate this so users reading history aren't
  // yanked to the bottom.
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // Force scroll when the user switches conversations.
  // Restructured so every code path returns a value (tsconfig has
  // `noImplicitReturns: true`).
  useEffect(() => {
    if (conversationId === null) {
      return undefined;
    }
    const id = requestAnimationFrame(() => scrollToBottom(true));
    return () => cancelAnimationFrame(id);
  }, [conversationId, scrollToBottom]);

  /**
   * Derive the other participant. For DMs this is the user whose
   * name/avatar should be shown in the header. For groups we return
   * null and the header falls back to the group name.
   */
  const otherParticipant = useMemo(() => {
    if (!conversation) return null;
    if (conversation.type === "group") return null;
    if (currentUserId === null) return conversation.participants[0] ?? null;
    return (
      conversation.participants.find((p) => p.user.id !== currentUserId) ??
      conversation.participants[0] ??
      null
    );
  }, [conversation, currentUserId]);

  // Empty state when no conversation selected.
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
  const avatarUrl = otherParticipant?.user.avatar_url ?? null;

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
        onDelete={handleDeleteMessage}
        onEdit={handleEditInit}
        onReply={handleReplyInit}
      />

      <MessageInput
        value={messageInput}
        onChange={handleInputChange}
        onSubmit={handleSendMessage}
        editingMessage={editingMessage}
        replyingTo={replyingTo}
        onCancelAction={handleCancelAction}
      />
    </main>
  );
}