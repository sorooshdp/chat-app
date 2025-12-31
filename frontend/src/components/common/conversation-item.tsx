"use client";

import Image from "next/image";
import type { ConversationWithDetails } from "@/lib/types/api";
import { JSX } from "react/jsx-dev-runtime";
import { getDisplayName } from "@/lib/utils/conversation";
import { formatTimestamp } from "@/lib/utils/date";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  isActive?: boolean;
  onSelect?: () => void;
}

export function ConversationItem({ conversation, isActive = false, onSelect }: ConversationItemProps): JSX.Element {
  const displayName = getDisplayName(conversation);
  const avatarUrl = conversation.participants[0]?.user.avatar_url;

  const timestamp = conversation.last_message?.created_at ? formatTimestamp(conversation.last_message.created_at) : "";

  const lastMessagePreview = conversation.last_message?.content
    ? conversation.last_message.content.substring(0, 50) + (conversation.last_message.content.length > 50 ? "..." : "")
    : "No messages yet";

  return (
    <li>
      <button
        onClick={onSelect}
        className={`w-full flex items-center py-3 px-2 rounded-lg transition group ${
          isActive ? "bg-blue-900" : "hover:bg-blue-900/50"
        }`}
        aria-label={`Open conversation with ${displayName}`}
      >
        <div className="relative w-10 h-10 mr-3 flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="40px"
              className="rounded-full object-cover border-2 border-blue-700"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-700 border-2 border-blue-700 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-start min-w-0">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-semibold text-white group-hover:text-blue-400 truncate">{displayName}</span>
            {conversation.unread_count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs rounded-full flex-shrink-0">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs truncate w-full">{lastMessagePreview}</p>
        </div>

        {timestamp && <span className="text-xs text-blue-400 ml-2 flex-shrink-0">{timestamp}</span>}
      </button>
    </li>
  );
}
