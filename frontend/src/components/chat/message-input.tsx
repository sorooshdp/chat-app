"use client";

import type { JSX } from "react";
import { FormEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: MessageInputProps): JSX.Element {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        maxLength={5000}
        className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-6 h-6" />
      </button>
    </form>
  );
}
