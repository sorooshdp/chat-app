"use client";

import type { JSX } from "react";
import { FormEvent } from "react";
import { Send, X, Pencil, Reply, Check } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  replyingTo?: { senderName: string | null; content: string } | null;
  editingMessage?: { id: string; content: string } | null;
  onCancelAction?: () => void;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  replyingTo,
  editingMessage,
  onCancelAction,
}: MessageInputProps): JSX.Element {
  return (
    <div className="flex flex-col border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
      {/* Contextual Action Banner */}
      {(replyingTo || editingMessage) && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 text-sm border-b border-slate-700/50">
          <div className="flex items-center gap-2 text-blue-400">
            {editingMessage ? <Pencil className="w-4 h-4" /> : <Reply className="w-4 h-4" />}
            <span className="font-medium">
              {editingMessage ? "Editing message" : `Replying to ${replyingTo?.senderName || "Unknown"}`}
            </span>
          </div>
          <button
            onClick={onCancelAction}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 p-4">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
          maxLength={5000}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
