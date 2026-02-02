"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { Search, Menu, Plus, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ConversationWithDetails, UserProfile } from "@/lib/types/api";
import { ConversationItem } from "./conversation-item";
import { UserSearchItem } from "./user-search-item";
import { getAuthToken, clearAuthToken } from "@/lib/utils/auth";
import { getDisplayName } from "@/lib/utils/conversation";
import { searchUsers, createConversation } from "@/lib/utils/api";
import {
  disconnectSocket,
  connectSocket,
  onPresenceOnline,
  onPresenceOffline,
  onPresenceList,
} from "@/lib/socket";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  activeConversationId: number | null;
  onConversationSelect: (conversationId: number) => void;
  onConversationCreated: (conversation: ConversationWithDetails) => void;
  isHidden?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onConversationSelect,
  onConversationCreated,
  isHidden = false,
}: ConversationListProps): JSX.Element {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"conversations" | "users">("conversations");
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState<boolean>(false);
  const [localConversations, setLocalConversations] = useState<ConversationWithDetails[]>(conversations);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Sync local state with incoming props (important for router.refresh())
  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  // Subscribe to presence events
  useEffect(() => {
    try {
      connectSocket();
    } catch (error) {
      console.error('Failed to connect socket for presence:', error);
      return;
    }

    const unsubscribeList = onPresenceList((event) => {
      setOnlineUsers(new Set(event.onlineUserIds));
    });

    const unsubscribeOnline = onPresenceOnline((event) => {
      setOnlineUsers((prev) => new Set(prev).add(event.userId));
    });

    const unsubscribeOffline = onPresenceOffline((event) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(event.userId);
        return next;
      });
    });

    return () => {
      unsubscribeList();
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const filteredConversations = localConversations.filter((conv) => {
    const displayName = getDisplayName(conv);
    const query = searchQuery.toLowerCase();

    return displayName.toLowerCase().includes(query);
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
        const response = await createConversation(user.id, token);

        if (response.conversation) {
          onConversationCreated(response.conversation); // Use callback instead of local state
        }

        setSearchMode("conversations");
        setSearchQuery("");
        setUserResults([]);

        router.refresh();
      } catch (error) {
        console.error("Error creating conversation:", error);
        alert("Failed to start conversation. Please try again.");
      } finally {
        setIsCreatingConversation(false);
      }
    },
    [router, onConversationCreated]
  );

  const showingConversations = searchMode === "conversations";
  const showingUsers = searchMode === "users";

  const handleLogout = (): void => {
    disconnectSocket();
    clearAuthToken();
    router.push("/login");
  };

  return (
    <aside className={`relative w-full md:w-80 md:min-w-65 md:max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
      isHidden ? "hidden md:flex" : "flex"
    }`}>
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          aria-label="Open Menu"
          className="p-2 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <Menu className="w-6 h-6 text-blue-400" />
        </button>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="p-2 rounded-md hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-600 transition-colors"
          title="Log out"
        >
          <LogOut className="w-5 h-5 text-red-400" />
        </button>
      </div>

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
                {filteredConversations.map((conversation) => {
                  // Check if the other participant is online
                  const otherUserId = conversation.participants[0]?.user.id;
                  const isOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

                  return (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onSelect={() => onConversationSelect(conversation.id)}
                      isOnline={isOnline}
                    />
                  );
                })}
              </ul>
            )}
          </>
        )}
        {showingUsers && (
          <>
            {isSearching ? (
              <div className="px-2 space-y-2">
                {/* Skeleton loading for user search */}
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-slate-700 rounded"></div>
                      <div className="h-3 w-32 bg-slate-700/70 rounded"></div>
                    </div>
                  </div>
                ))}
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
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    onSelect={handleUserSelect}
                    disabled={isCreatingConversation}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
