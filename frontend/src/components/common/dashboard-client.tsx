"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/common/conversation-list";
import { ChatWindow } from "@/components/common/chat-window";
import type { ConversationWithDetails } from "@/lib/types/api";
import {
  connectSocket,
  onConversationUpdate,
  ConversationUpdateEvent,
} from "@/lib/socket";
import { getAuthToken, getCurrentUserId } from "@/lib/utils/auth";

interface DashboardClientProps {
  initialConversations: ConversationWithDetails[];
}

export function DashboardClient({ initialConversations }: DashboardClientProps): JSX.Element {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

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
    const unsubscribeUpdate = onConversationUpdate((event: ConversationUpdateEvent) => {
      console.log('Conversation update received:', event);

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === event.conversationId);

        if (existingIndex !== -1) {
          // Update existing conversation's last message and move to top
          const updated = [...prev];
          const conversation = { ...updated[existingIndex]! };
          conversation.last_message = {
            content: event.lastMessage.content,
            created_at: event.lastMessage.created_at,
            sender_id: event.lastMessage.sender_id,
          };
          updated.splice(existingIndex, 1);
          return [conversation, ...updated];
        } else {
          // New conversation - refresh to get full details
          router.refresh();
          return prev;
        }
      });
    });

    return () => {
      unsubscribeUpdate();
    };
  }, [currentUserId, router]);

  const handleConversationSelect = (conversationId: number): void => {
    setActiveConversationId(conversationId);
  };

  const handleConversationCreated = (newConversation: ConversationWithDetails): void => {
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onConversationCreated={handleConversationCreated}
        isHidden={activeConversationId !== null}
      />
      <ChatWindow conversation={activeConversation} onClose={() => setActiveConversationId(null)} />
    </div>
  );
}
