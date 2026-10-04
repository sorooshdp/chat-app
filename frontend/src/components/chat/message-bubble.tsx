"use client";

import type { JSX } from "react";
import { Check, CheckCheck, Loader2, AlertCircle, Pencil, Trash2, Reply } from "lucide-react";
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
  isEdited?: boolean | undefined;
  isDeleted?: boolean | undefined;
  replyTo?: { senderName: string | null; content: string } | null | undefined;
  onRetry?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
  onEdit?: ((id: string, currentContent: string) => void) | undefined;
  onReply?: ((id: string, senderName: string | null, content: string) => void) | undefined;
}

export function MessageBubble({
  id,
  content,
  createdAt,
  senderName,
  isOwnMessage,
  status,
  isRead,
  isEdited = false,
  isDeleted = false,
  replyTo,
  onRetry,
  onDelete,
  onEdit,
  onReply,
}: MessageBubbleProps): JSX.Element {
const timestamp = formatTimestamp(createdAt);
  const isSending = status === "sending";
  const isSent = status === "sent";
  const isFailed = status === "failed";

  // Extracted Action Bar using safe flexbox rendering instead of absolute positioning
  const actionBar = !isDeleted && isSent && (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 shrink-0">
      <button
        onClick={() => onReply?.(id, senderName, content)}
        className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
        title="Reply"
      >
        <Reply className="w-4 h-4" />
      </button>

      {isOwnMessage && (
        <>
          <button
            onClick={() => onEdit?.(id, content)}
            className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(id)}
            className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className={`flex group w-full mb-2 items-center ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      
      {/* Show actions on the LEFT for own messages */}
      {isOwnMessage && actionBar}

      <div className="flex flex-col max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-2 shadow-lg ${
            isDeleted 
              ? "bg-slate-800/50 border border-slate-700/50"
              : isFailed
                ? "bg-red-900/50 text-white border border-red-600"
                : isOwnMessage
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-white"
          } ${isSending ? "opacity-70" : ""}`}
        >
          {!isOwnMessage && !isDeleted && (
            <p className="text-xs text-slate-400 mb-1 font-medium">{senderName || "Unknown"}</p>
          )}

          {/* Quoted Reply UI */}
          {replyTo && !isDeleted && (
            <div className={`mb-2 pl-3 border-l-2 rounded-r-md py-1 text-sm ${isOwnMessage ? "border-blue-300 bg-blue-700/50" : "border-slate-500 bg-slate-700/50"}`}>
              <span className={`text-xs font-semibold ${isOwnMessage ? "text-blue-200" : "text-slate-300"}`}>
                {replyTo.senderName || "Unknown"}
              </span>
              <p className="truncate opacity-80">{replyTo.content}</p>
            </div>
          )}

          {/* Main Content */}
          {isDeleted ? (
            <p className="italic text-slate-400 text-sm flex items-center gap-2">
              This message was deleted
            </p>
          ) : (
            <p className="wrap-break-word">{content}</p>
          )}

          <div className="flex items-center justify-end gap-1.5 mt-1">
            {isEdited && !isDeleted && (
              <span className={`text-[10px] ${isOwnMessage ? "text-blue-200/70" : "text-slate-500"}`}>
                (edited)
              </span>
            )}
            <span className={`text-[10px] ${isOwnMessage && !isDeleted ? "text-blue-200" : "text-slate-500"}`}>
              {timestamp}
            </span>
            {isOwnMessage && isSending && <Loader2 className="w-3 h-3 text-blue-300 animate-spin" />}
            {isOwnMessage && isSent && !isRead && !isDeleted && <Check className="w-3 h-3 text-blue-300" />}
            {isOwnMessage && isSent && isRead && !isDeleted && <CheckCheck className="w-3 h-3 text-blue-300" />}
          </div>
        </div>

        {isFailed && (
          <div className="flex items-center gap-2 mt-1 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>Failed to send</span>
            {onRetry && (
              <button onClick={() => onRetry(id)} className="text-blue-400 hover:underline">
                Retry
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(id)} className="text-slate-400 hover:underline">
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Show actions on the RIGHT for other messages */}
      {!isOwnMessage && actionBar}

    </div>
  );
}