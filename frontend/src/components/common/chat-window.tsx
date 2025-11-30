"use client";

import { JSX, useState, FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Send } from "lucide-react";
import type { ConversationWithDetails } from "@/lib/types/api";

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onClose: () => void;
}

function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  const firstParticipant = conversation.participants[0];
  if (conversation.participants.length === 1 && firstParticipant?.user.name) {
    return firstParticipant.user.name;
  }

  const names = conversation.participants.map((p) => p.user.name).filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(", ") : "Unknown";
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps): JSX.Element {
  const [messageInput, setMessageInput] = useState<string>("");

  const handleSendMessage = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // TODO: Will implement sending in next step
    console.log("Sending message:", messageInput);
    setMessageInput("");
  };

  // Empty state when no conversation selected
  if (!conversation) {
    return (
      <main className="flex-1 hidden md:flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-blue-950">
        <div className="text-center">
          <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(conversation);
  const avatarUrl = conversation.participants[0]?.user.avatar_url;

  return (
    <main className="flex-1 flex flex-col bg-gradient-to-br from-black via-slate-900 to-blue-950">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/90">
        <button
          onClick={onClose}
          className="p-2 mr-3 rounded hover:bg-blue-800 text-slate-400 transition"
          aria-label="Back to contacts"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-white text-lg">{displayName}</span>
      </div>

      {/* Desktop header */}
      <header className="hidden md:flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full mr-3 border-2 border-blue-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-blue-700 flex items-center justify-center mr-3">
            <span className="text-sm font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex flex-col flex-1">
          <span className="font-bold text-white text-lg">{displayName}</span>
          <span className="text-slate-400 text-xs">{conversation.participants[0]?.user.status || "offline"}</span>
        </div>
      </header>

      {/* Messages section - empty for now */}
      <section className="flex-1 overflow-y-auto px-6 py-6 flex items-center justify-center">
        <p className="text-slate-400 text-center">No messages yet. Start the conversation!</p>
      </section>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md"
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!messageInput.trim()}
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </main>
  );
}
