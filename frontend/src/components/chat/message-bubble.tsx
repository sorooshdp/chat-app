"use client";

import type { JSX } from "react";
import { Check, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import { formatTimestamp } from "@/lib/utils/date";

export type MessageStatus = "sending" | "sent" | "failed";

export interface MessageBubbleProps {
  id: string;
  content: string;
  createdAt: string;
  senderName: string | null;
  isOwnMessage: boolean;
  status: MessageStatus;
  isRead: boolean;
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MessageBubble({
  id,
  content,
  createdAt,
  senderName,
  isOwnMessage,
  status,
  isRead,
  onRetry,
  onDelete,
}: MessageBubbleProps): JSX.Element {
  const timestamp = formatTimestamp(createdAt);
  const isSending = status === "sending";
  const isSent = status === "sent";
  const isFailed = status === "failed";

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 shadow-lg ${
            isFailed
              ? "bg-red-900/50 text-white border border-red-600"
              : isOwnMessage
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-white"
          } ${isSending ? "opacity-70" : ""}`}
        >
          {!isOwnMessage && (
            <p className="text-xs text-slate-400 mb-1">{senderName || "Unknown"}</p>
          )}
          <p className="wrap-break-word">{content}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={`text-xs ${isOwnMessage ? "text-blue-200" : "text-slate-400"}`}>
              {timestamp}
            </span>
            {isOwnMessage && isSending && (
              <Loader2 className="w-3 h-3 text-blue-300 animate-spin" />
            )}
            {isOwnMessage && isSent && !isRead && (
              <Check className="w-3 h-3 text-blue-300" />
            )}
            {isOwnMessage && isSent && isRead && (
              <CheckCheck className="w-3 h-3 text-blue-300" />
            )}
          </div>
        </div>

        {isFailed && (
          <div className="flex items-center gap-2 mt-1 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>Failed to send</span>
            {onRetry && (
              <button
                onClick={() => onRetry(id)}
                className="text-blue-400 hover:underline"
              >
                Retry
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="text-slate-400 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
