'use client';

import { JSX, useState } from 'react';
import { ConversationList } from "@/components/common/conversation-list";
import { ChatWindow } from "@/components/common/chat-window";
import type { ConversationWithDetails } from '@/lib/types/api';

interface DashboardClientProps {
  initialConversations: ConversationWithDetails[];
}

export function DashboardClient({ initialConversations }: DashboardClientProps): JSX.Element {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const handleConversationSelect = (conversationId: number): void => {
    setActiveConversationId(conversationId);
  };

  const handleConversationCreated = (newConversation: ConversationWithDetails): void => {
    setConversations(prev => [newConversation, ...prev]);
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
      <ChatWindow
        conversation={activeConversation}
        onClose={() => setActiveConversationId(null)}
      />
    </div>
  );
}
