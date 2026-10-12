"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { JSX } from "react";
import { ConversationList } from "@/components/common/conversation-list";
import { ChatWindow } from "@/components/common/chat-window";
import type { ConversationWithDetails } from "@/lib/types/api";
import {
  connectSocket,
  onConversationUpdate,
  onPresenceOnline,
  onPresenceOffline,
  onPresenceList,
  // ConversationUpdateEvent,
} from "@/lib/socket";
import { getAuthToken, getCurrentUserId } from "@/lib/utils/auth";
import { fetchConversation } from "@/lib/utils/api";

interface DashboardClientProps {
  initialConversations: ConversationWithDetails[];
}

export function DashboardClient({ initialConversations }: DashboardClientProps): JSX.Element {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const activeConversationIdRef = useRef<number | null>(null);
  const conversationsRef = useRef(conversations);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const isOtherUserOnline = useMemo(
    () => (activeConversation ? onlineUsers.has(activeConversation.participants[0]?.user.id ?? -1) : false),
    [activeConversation, onlineUsers],
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Get current user ID on mount
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error("Failed to get current user ID:", error);
    }
  }, []);

  // Sync local state with incoming props
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Socket connection and subscriptions
  useEffect(() => {
    if (currentUserId === null) return;

    connectSocket();

    const unsubscribeUpdate = onConversationUpdate(async (event) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === event.conversationId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const conversation = { ...updated[idx]! };
        conversation.last_message = {
          content: event.lastMessage.content,
          created_at: event.lastMessage.created_at,
          sender_id: event.lastMessage.sender_id,
        };

        const isSelf = event.lastMessage.sender_id === currentUserId;
        const isViewing = event.conversationId === activeConversationIdRef.current;
        if (!isSelf && !isViewing) {
          conversation.unread_count = (conversation.unread_count ?? 0) + 1;
        }

        updated.splice(idx, 1);
        return [conversation, ...updated];
      });

      if (!conversationsRef.current.some((c) => c.id === event.conversationId)) {
        // move async fetch OUT of the state updater
        try {
          const token = getAuthToken();
          if (!token) return;
          const newConversation = await fetchConversation(event.conversationId, token);
          if (!newConversation) return;
          setConversations((current) =>
            current.some((c) => c.id === event.conversationId) ? current : [newConversation, ...current],
          );
        } catch (err) {
          console.error("Failed to fetch new conversation:", err);
        }
      }
    });

    // Subscribe to presence events
    const unsubscribeList = onPresenceList((event) => {
      setOnlineUsers(new Set(event.onlineUserIds));
    });

    const unsubscribeOnline = onPresenceOnline((event) => {
      setOnlineUsers((prev) => new Set(prev).add(event.userId));
    });

    const unsubscribeOffline = onPresenceOffline((event) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(event.userId);
        return next;
      });
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeList();
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [currentUserId]);

  const handleConversationSelect = useCallback((conversationId: number): void => {
    setActiveConversationId(conversationId);
    // Clear unread count when selecting conversation
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)));
  }, []);

  const handleConversationCreated = useCallback((newConversation: ConversationWithDetails): void => {
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onConversationCreated={handleConversationCreated}
        isHidden={activeConversationId !== null}
      />
      <ChatWindow
        key={activeConversationId || "empty-chat"}
        conversation={activeConversation}
        onClose={() => setActiveConversationId(null)}
        isOtherUserOnline={isOtherUserOnline}
      />
    </div>
  );
}
