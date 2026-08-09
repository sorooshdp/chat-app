"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ConversationUpdateEvent,
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

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const isOtherUserOnline = useMemo(
    () => activeConversation
      ? onlineUsers.has(activeConversation.participants[0]?.user.id ?? -1)
      : false,
    [activeConversation, onlineUsers]
  );

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

    try {
      connectSocket();
    } catch (error) {
      console.error('Failed to connect socket:', error);
      return;
    }

    // Listen for conversation updates (new messages)
    const unsubscribeUpdate = onConversationUpdate(async (event: ConversationUpdateEvent) => {
      console.log('Conversation update received:', event);

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === event.conversationId);

        if (existingIndex !== -1) {
          // Update only the affected conversation, preserving others
          const updated = [...prev];
          const conversation = { ...updated[existingIndex]! };
          
          conversation.last_message = {
            content: event.lastMessage.content,
            created_at: event.lastMessage.created_at,
            sender_id: event.lastMessage.sender_id,
          };
          
          // Only increment unread count if:
          // 1. Message is from someone else
          // 2. User is NOT currently viewing this conversation
          if (event.lastMessage.sender_id !== currentUserId && 
              event.conversationId !== activeConversationId) {
            conversation.unread_count = (conversation.unread_count || 0) + 1;
          }
          
          // Remove from current position and add to top
          updated.splice(existingIndex, 1);
          return [conversation, ...updated];
        }
        
        // If conversation doesn't exist, fetch it asynchronously
        (async () => {
          try {
            const token = getAuthToken();
            
            if (!token) {
              console.error("No auth token available to fetch new conversation");
              return;
            }
            const newConversation = await fetchConversation(event.conversationId, token);
            if (newConversation) {
              setConversations((current) => {
                if (current.some((c) => c.id === event.conversationId)) {
                  return current;
                }
                return [newConversation, ...current];
              });
            }
          } catch (error) {
            console.error('Failed to fetch new conversation:', error);
          }
        })();
        
        return prev;
      });
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
  }, [currentUserId, activeConversationId]); // Added activeConversationId to deps

  const handleConversationSelect = useCallback((conversationId: number): void => {
    setActiveConversationId(conversationId);
    // Clear unread count when selecting conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );
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
        conversation={activeConversation}
        onClose={() => setActiveConversationId(null)}
        isOtherUserOnline={isOtherUserOnline}
      />
    </div>
  );
}
