"use client";

import Image from "next/image";
import type { ConversationWithDetails } from "@/lib/types/api";
import { JSX } from "react/jsx-dev-runtime";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
}

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const now = Date.now();
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (abs < 60) {
    value = seconds;
    unit = "second";
  } else if (abs < 3600) {
    value = Math.round(seconds / 60);
    unit = "minute";
  } else if (abs < 86400) {
    value = Math.round(seconds / 3600);
    unit = "hour";
  } else if (abs < 2629800) {
    value = Math.round(seconds / 86400);
    unit = "day";
  } else if (abs < 31557600) {
    value = Math.round(seconds / 2629800);
    unit = "month";
  } else {
    value = Math.round(seconds / 31557600);
    unit = "year";
  }

  const formatted = rtf.format(value, unit);

  // date-fns uses addSuffix to include "ago" / "in", Intl already includes that.
  // if addSuffix is explicitly false, strip common English prefixes/suffixes.
  if (options?.addSuffix === false) {
    return formatted.replace(/^in\s+/i, "").replace(/\s+ago$/i, "");
  }

  return formatted;
}

function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  if (conversation.participants.length === 1 && conversation.participants[0]!.user.name) {
    return conversation.participants[0]!.user.name;
  }

  const names = conversation.participants.map((p) => p.user.name).filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(", ") : "Unknown";
}

function formatTimestamp(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function ConversationItem({ conversation }: ConversationItemProps): JSX.Element {
  const displayName = getDisplayName(conversation);
  const avatarUrl = conversation.participants[0]?.user.avatar_url;

  const timestamp = conversation.last_message?.created_at ? formatTimestamp(conversation.last_message.created_at) : "";

  const lastMessagePreview = conversation.last_message?.content
    ? conversation.last_message.content.substring(0, 50) + (conversation.last_message.content.length > 50 ? "..." : "")
    : "No messages yet";

  return (
    <li>
      <button
        className="w-full flex items-center py-3 px-2 rounded-lg hover:bg-blue-900 transition group"
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
