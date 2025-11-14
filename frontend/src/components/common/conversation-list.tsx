'use client';

import { JSX, useState } from 'react';
import { Search, Menu } from 'lucide-react';
import type { ConversationWithDetails } from '@/lib/types/conversations';
import { ConversationItem } from './conversation-item';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
}

function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === 'group' && conversation.name) {
    return conversation.name;
  }

  if (conversation.participants.length === 1 && conversation.participants[0].user.name) {
    return conversation.participants[0].user.name;
  }

  const names = conversation.participants
    .map(p => p.user.name)
    .filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(', ') : 'Unknown';
}

export function ConversationList({ conversations }: ConversationListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredConversations = conversations.filter((conv) => {
    const displayName = getDisplayName(conv);
    const lastMessageContent = conv.last_message?.content || '';
    const query = searchQuery.toLowerCase();

    return (
      displayName.toLowerCase().includes(query) ||
      lastMessageContent.toLowerCase().includes(query)
    );
  });

  return (
    <aside className="relative w-80 min-w-[260px] max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out">
      <button
        aria-label="Open Menu"
        className="absolute top-4 left-4 z-20 p-2 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <Menu className="w-6 h-6 text-blue-400" />
      </button>

      <div className="p-4 pt-16 bg-slate-900">
        <label htmlFor="chat-search" className="sr-only">
          Search conversations
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="chat-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl py-2 pl-10 pr-4 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            autoComplete="off"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <ul className="px-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
