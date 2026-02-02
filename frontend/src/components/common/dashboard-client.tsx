"use client";

import { useState, useEffect, useCallback } from "react";
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

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  
  // Check if the other user in the active conversation is online
  const isOtherUserOnline = activeConversation
    ? onlineUsers.has(activeConversation.participants[0]?.user.id ?? -1)
    : false;

  // Get current user ID on mount
  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error("Failed to get current user ID:", error);
    }
  }, []);

  // Connect to socket and listen for conversation updates
  useEffect(() => {
    if (currentUserId === null) return;

    try {
      connectSocket();
    } catch (error) {
      console.error('Failed to connect socket:', error);
      return;
    }

    // Listen for conversation updates (new messages in any conversation)
    const unsubscribeUpdate = onConversationUpdate(async (event: ConversationUpdateEvent) => {
      console.log('Conversation update received:', event);

      // Use functional update to check current state without needing conversations in deps
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === event.conversationId);

        if (existingIndex !== -1) {
          // Update existing conversation's last message, unread count, and move to top
          const updated = [...prev];
          const conversation = { ...updated[existingIndex]! };
          conversation.last_message = {
            content: event.lastMessage.content,
            created_at: event.lastMessage.created_at,
            sender_id: event.lastMessage.sender_id,
          };
          // Increment unread count if message is from someone else
          if (event.lastMessage.sender_id !== currentUserId) {
            conversation.unread_count = (conversation.unread_count || 0) + 1;
          }
          updated.splice(existingIndex, 1);
          return [conversation, ...updated];
        }
        
        // Return prev unchanged - we'll fetch the new conversation separately
        return prev;
      });

      // Check if we need to fetch a new conversation (outside the setState callback)
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === event.conversationId);
        if (!exists) {
          // Fetch new conversation async
          (async () => {
            try {
              const token = getAuthToken();
              const newConversation = await fetchConversation(event.conversationId, token);
              if (newConversation) {
                setConversations((current) => {
                  // Double-check it wasn't added while fetching
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
        }
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
  }, [currentUserId]);

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
