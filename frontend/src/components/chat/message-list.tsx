"use client";

import type { JSX } from "react";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { MessageBubble, MessageStatus } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

export interface LocalMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: number;
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  status: MessageStatus;
  isLocal: boolean;
  is_read: boolean;
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to?: { content: string | null; sender: { name: string | null } } | null;
}

interface MessageListProps {
  messages: LocalMessage[];
  currentUserId: number | null;
  isLoading: boolean;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  isTyping: boolean;
  onLoadMore: () => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onReply?: (id: string, senderName: string | null, content: string) => void;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  {
    messages,
    currentUserId,
    isLoading,
    hasMoreMessages,
    isLoadingMore,
    isTyping,
    onLoadMore,
    onRetry,
    onDelete,
    onEdit,
    onReply,
  },
  ref,
): JSX.Element {
  if (isLoading) {
    return (
      <section className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="flex flex-col gap-4">
          {/* Skeleton loading */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className={`rounded-2xl px-4 py-3 ${i % 2 === 0 ? "bg-slate-800" : "bg-blue-600/50"} animate-pulse`}>
                <div className="h-4 w-32 bg-slate-600 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (messages.length === 0) {
    return (
      <section className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-400 text-center">No messages yet. Start the conversation!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
      <div className="space-y-4">
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-500 flex items-center gap-2 transition"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </button>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = currentUserId !== null && message.sender_id === currentUserId;

          return (
            <MessageBubble
              key={message.id}
              id={message.id}
              content={message.content}
              createdAt={message.created_at}
              senderName={message.sender.name}
              isOwnMessage={isOwnMessage}
              status={message.status}
              isRead={message.is_read}
              isEdited={message.is_edited ?? false}
              isDeleted={message.is_deleted ?? false}
              replyTo={
                message.reply_to
                  ? { senderName: message.reply_to.sender.name, content: message.reply_to.content || "" }
                  : null
              }
              onRetry={onRetry}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
            />
          );
        })}
        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={ref} />
      </div>
    </section>
  );
});
