"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { Search, Menu, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ConversationWithDetails, UserProfile } from '@/lib/types/api';
import { ConversationItem } from "./conversation-item";
import { UserSearchItem } from "./user-search-item";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
}

function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  if (conversation.participants.length === 1 && conversation.participants[0].user.name) {
    return conversation.participants[0].user.name;
  }

  const names = conversation.participants.map((p) => p.user.name).filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(", ") : "Unknown";
}

async function searchUsers(query: string, token: string): Promise<UserProfile[]> {
  if (query.trim().length < 2) return [];

  const response = await fetch(`http://localhost:8080/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("User search failed");
  }

  const data = await response.json();
  return data.users;
}

async function createConversation(participantId: number, token: string): Promise<number> {
  const response = await fetch("http://localhost:8080/api/conversations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participantIds: [participantId],
      type: "dm",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  const data = await response.json();
  return data.conversationId;
}

function getAuthToken(): string {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    throw new Error("No authentication token");
  }

  return token;
}

export function ConversationList({ conversations }: ConversationListProps): JSX.Element {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"conversations" | "users">("conversations");
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState<boolean>(false);
  const [localConversations, setLocalConversations] = useState<ConversationWithDetails[]>(conversations);

  const filteredConversations = localConversations.filter((conv) => {
    const displayName = getDisplayName(conv);
    const lastMessageContent = conv.last_message?.content || "";
    const query = searchQuery.toLowerCase();

    return displayName.toLowerCase().includes(query) || lastMessageContent.toLowerCase().includes(query);
  });

  const debouncedUserSearch = useCallback(
    async (query: string) => {
      if (searchMode !== "users" || query.trim().length < 2) {
        setUserResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = getAuthToken();
        const results = await searchUsers(query, token);
        setUserResults(results);
      } catch (error) {
        console.error("User search error:", error);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchMode]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUserSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedUserSearch]);

  const handleUserSelect = useCallback(
    async (user: UserProfile): Promise<void> => {
      setIsCreatingConversation(true);
      try {
        const token = getAuthToken();
        const conversationId = await createConversation(user.id, token);

        // Refresh the page to fetch updated conversation list from server
        router.refresh();

        // Switch back to conversations mode and clear search
        setSearchMode("conversations");
        setSearchQuery("");
        setUserResults([]);
      } catch (error) {
        console.error("Error creating conversation:", error);
        alert("Failed to start conversation. Please try again.");
      } finally {
        setIsCreatingConversation(false);
      }
    },
    [router]
  );

  const showingConversations = searchMode === "conversations";
  const showingUsers = searchMode === "users";

  return (
    <aside className="relative w-80 min-w-[260px] max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out">
      <button
        aria-label="Open Menu"
        className="absolute top-4 left-4 z-20 p-2 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <Menu className="w-6 h-6 text-blue-400" />
      </button>

      <div className="p-4 pt-16 bg-slate-900 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchMode("conversations")}
            disabled={isCreatingConversation}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              searchMode === "conversations"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setSearchMode("users")}
            disabled={isCreatingConversation}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              searchMode === "users" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New
          </button>
        </div>

        <label htmlFor="chat-search" className="sr-only">
          {showingConversations ? "Search conversations" : "Search users"}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="chat-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={showingConversations ? "Search chats" : "Search users"}
            className="w-full rounded-xl py-2 pl-10 pr-4 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            autoComplete="off"
            disabled={isCreatingConversation}
          />
        </div>
      </div>

      {isCreatingConversation && (
        <div className="px-4 py-2 bg-blue-900/30 border-b border-blue-800">
          <p className="text-sm text-blue-300 text-center">Creating conversation...</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto">
        {showingConversations && (
          <>
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <p className="text-slate-400 text-sm">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
              </div>
            ) : (
              <ul className="px-2">
                {filteredConversations.map((conversation) => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </ul>
            )}
          </>
        )}

        {showingUsers && (
          <>
            {isSearching ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : userResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <p className="text-slate-400 text-sm">
                  {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No users found"}
                </p>
              </div>
            ) : (
              <ul className="px-2">
                {userResults.map((user) => (
                  <UserSearchItem key={user.id} user={user} onSelect={handleUserSelect} disabled={isCreatingConversation} />
                ))}
              </ul>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
