import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./utils/auth";
import type { ConversationWithDetails } from "./types/api";

export interface SocketMessage {
  id: number;
  content: string | null;
  created_at: string;
  sender_id: number;
  conversation_id: number;
  sender: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  reply_to?: { content: string | null; sender: { name: string | null } } | null;
  reply_to_id?: number | null;
}

export interface TypingEvent {
  conversationId: number;
  userId: number;
}

export interface PresenceEvent {
  userId: number;
}

export interface PresenceListEvent {
  onlineUserIds: number[];
}

/**
 * Payload emitted by the server on `conversation:update`.
 * Widen lastMessage so the conversation list can render richer previews
 * (id, sender name, reply). If your server sends a narrower shape, drop
 * the extra fields here and the client still compiles — TS will just
 * not complain because we only read what we use.
 */
export interface ConversationUpdateEvent {
  conversationId: number;
  lastMessage: {
    id?: number;
    content: string | null;
    created_at: string;
    sender_id: number;
    sender?: {
      id: number;
      name: string | null;
      avatar_url: string | null;
    };
    reply_to?: { content: string | null; sender: { name: string | null } } | null;
  };
}

export interface MessagesReadEvent {
  conversationId: number;
  readBy: number;
}

let socket: Socket | null = null;

/**
 * Rooms the client is logically subscribed to. Kept in a Set so that
 * after a reconnect (which drops all room memberships server-side),
 * we can re-join them automatically.
 */
const joinedRooms = new Set<number>();

/** Attached once, not per-socket-instance. */
let globalListenersAttached = false;

const SOCKET_URL =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3000";

const isDev = process.env.NODE_ENV !== "production";

function log(...args: unknown[]): void {
  if (isDev) console.log(...args);
}

function warn(...args: unknown[]): void {
  if (isDev) console.warn(...args);
}

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Idempotent: returns the existing socket if connected, reconnects it
 * if disconnected, creates it otherwise. Throws only if no token exists.
 */
export function connectSocket(): Socket {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No auth token available for socket connection");
  }

  // Already connected — keep the instance, refresh auth in case the
  // token rotated (e.g. after login refresh).
  if (socket?.connected) {
    socket.auth = { token };
    return socket;
  }

  // Exists but disconnected — update auth and reconnect the same instance.
  // Listeners registered against this instance remain valid.
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  // First-time creation.
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    withCredentials: true,
  });

  if (isDev) {
    socket.onAny((event, ...args) => console.debug("[socket in]", event, args));
  }

  socket.on("connect", () => {
    log("Socket connected:", socket?.id);

    // Re-join every room we think we're in. First connect is a no-op
    // for this loop because joinedRooms is only populated by
    // joinConversation(), which is called after mount.
    for (const conversationId of joinedRooms) {
      socket?.emit("join:conversation", { conversationId });
      log(`Re-joining conversation room: ${conversationId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  attachGlobalRecoveryListeners();

  return socket;
}

/**
 * Reconnect on tab focus / network recovery. Socket.IO handles
 * reconnection on its own, but if the browser has suspended the tab
 * (mobile Safari, laptop sleep), the backoff timer can be very stale.
 */
function attachGlobalRecoveryListeners(): void {
  if (globalListenersAttached) return;
  if (typeof window === "undefined") return;
  globalListenersAttached = true;

  window.addEventListener("online", () => {
    if (!socket?.connected) {
      log("Network online — forcing socket reconnect");
      socket?.connect();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      socket &&
      !socket.connected
    ) {
      log("Tab visible — forcing socket reconnect");
      socket.connect();
    }
  });
}

export function disconnectSocket(): void {
  if (!socket) return;
  // Remove listeners first so any in-flight cleanup closures that
  // captured this instance are no-ops, then disconnect.
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  joinedRooms.clear();
}

/**
 * Join a conversation room. Safe to call before the socket is connected:
 * the id is recorded and the actual emit happens on `connect`.
 *
 * Note: this is fire-and-forget. If you need to know the server has
 * acked the join, extend this to accept a callback and add an ack
 * handler on the server.
 */
export function joinConversation(conversationId: number): void {
  joinedRooms.add(conversationId);

  if (!socket) {
    // connectSocket hasn't run yet; the id will be joined on connect.
    return;
  }

  if (socket.connected) {
    socket.emit("join:conversation", { conversationId });
    log(`Joining conversation room: ${conversationId}`);
  }
  // If not connected, the 'connect' handler will flush joinedRooms.
}

export function leaveConversation(conversationId: number): void {
  joinedRooms.delete(conversationId);
  if (!socket?.connected) return;
  socket.emit("leave:conversation", { conversationId });
}

/*
 * Every `on*` function captures the current socket instance in a local
 * `s` and returns a cleanup that `off`s on that same instance.
 */

export function onNewMessage(
  callback: (message: SocketMessage) => void,
): () => void {
  const s = socket;
  if (!s) {
    warn("Socket not initialized for onNewMessage");
    return () => {};
  }
  s.on("message:new", callback);
  return () => {
    s.off("message:new", callback);
  };
}

export function onTypingStart(
  callback: (event: TypingEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("typing:start", callback);
  return () => {
    s.off("typing:start", callback);
  };
}

export function onTypingStop(
  callback: (event: TypingEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("typing:stop", callback);
  return () => {
    s.off("typing:stop", callback);
  };
}

export function emitTypingStart(conversationId: number): void {
  if (!socket?.connected) return;
  socket.emit("typing:start", { conversationId });
}

export function emitTypingStop(conversationId: number): void {
  if (!socket?.connected) return;
  socket.emit("typing:stop", { conversationId });
}

export function onConversationUpdate(
  callback: (event: ConversationUpdateEvent) => void,
): () => void {
  const s = socket;
  if (!s) {
    warn("Socket not initialized for onConversationUpdate");
    return () => {};
  }
  s.on("conversation:update", callback);
  return () => {
    s.off("conversation:update", callback);
  };
}

export function onNewConversation(
  callback: (conversation: ConversationWithDetails) => void,
): () => void {
  const s = socket;
  if (!s) {
    warn("Socket not initialized for onNewConversation");
    return () => {};
  }
  s.on("conversation:new", callback);
  return () => {
    s.off("conversation:new", callback);
  };
}

export function onPresenceOnline(
  callback: (event: PresenceEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("presence:online", callback);
  return () => {
    s.off("presence:online", callback);
  };
}

export function onPresenceOffline(
  callback: (event: PresenceEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("presence:offline", callback);
  return () => {
    s.off("presence:offline", callback);
  };
}

export function onPresenceList(
  callback: (event: PresenceListEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("presence:list", callback);
  return () => {
    s.off("presence:list", callback);
  };
}

export function markConversationRead(conversationId: number): void {
  if (!socket?.connected) return;
  socket.emit("conversation:markRead", { conversationId });
}

export function onMessagesRead(
  callback: (event: MessagesReadEvent) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("messages:read", callback);
  return () => {
    s.off("messages:read", callback);
  };
}

export function onMessageUpdated(
  callback: (message: SocketMessage) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("message:update", callback);
  return () => {
    s.off("message:update", callback);
  };
}

export function onMessageDeleted(
  callback: (data: { id: number }) => void,
): () => void {
  const s = socket;
  if (!s) return () => {};
  s.on("message:delete", callback);
  return () => {
    s.off("message:delete", callback);
  };
}