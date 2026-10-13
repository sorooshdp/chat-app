import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import supabase from "../supabaseClient";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

interface AuthenticatedSocket extends Socket {
  user?: { id: number; email: string };
}

interface JoinConversationPayload {
  conversationId: number;
}

interface ReplyPreview {
  content: string | null;
  sender: { name: string | null };
}

/** Full payload the client expects on `message:new`. Mirrors MessageWithSender. */
export interface OutgoingMessage {
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
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: number | null;
  reply_to: ReplyPreview | null;
}

/** Payload for `conversation:update`. */
export interface OutgoingConversationUpdate {
  conversationId: number;
  lastMessage: {
    id?: number;
    content: string | null;
    created_at: string;
    sender_id: number;
    reply_to?: ReplyPreview | null;
  };
}

let io: SocketIOServer | null = null;

const onlineUsers = new Map<number, Set<string>>();

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function isUserOnline(userId: number): boolean {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}

export function getOnlineUserIds(): number[] {
  return Array.from(onlineUsers.keys()).filter((userId) => isUserOnline(userId));
}

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim());

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email: string;
      };
      socket.user = decoded;
      next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    if (socket.user) {
      const userId = socket.user.id;

      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);

      io!.emit("presence:online", { userId });

      void (async () => {
        const { error } = await supabase
          .from("users")
          .update({ status: "online", last_seen: new Date().toISOString() })
          .eq("id", userId);
        if (error) console.error(`Failed to mark user ${userId} online:`, error);
        else console.log(`User ${userId} marked online`);
      })();

      socket.emit("presence:list", { onlineUserIds: getOnlineUserIds() });
    }

    socket.on("join:conversation", async (payload: JoinConversationPayload) => {
      if (!socket.user) return;

      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", payload.conversationId)
        .eq("user_id", socket.user.id)
        .single();

      if (!participant) {
        socket.emit("error", {
          message: "Not authorized to join this conversation",
        });
        return;
      }

      const roomName = `conversation:${payload.conversationId}`;
      socket.join(roomName);
      console.log(`User ${socket.user.id} joined ${roomName}`);
    });

    socket.on("leave:conversation", (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user?.id} left ${roomName}`);
    });

    socket.on("conversation:markRead", async (payload: JoinConversationPayload) => {
      if (!socket.user) return;

      try {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", payload.conversationId)
          .neq("sender_id", socket.user.id)
          .eq("is_read", false);

        if (error) {
          console.error("Error marking messages as read:", error);
          return;
        }

        socket.to(`conversation:${payload.conversationId}`).emit("messages:read", {
          conversationId: payload.conversationId,
          readBy: socket.user.id,
        });
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    });

    socket.on("typing:start", (payload: JoinConversationPayload) => {
      socket.to(`conversation:${payload.conversationId}`).emit("typing:start", {
        conversationId: payload.conversationId,
        userId: socket.user?.id,
      });
    });

    socket.on("typing:stop", (payload: JoinConversationPayload) => {
      socket.to(`conversation:${payload.conversationId}`).emit("typing:stop", {
        conversationId: payload.conversationId,
        userId: socket.user?.id,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.id}`);

      if (socket.user) {
        const userId = socket.user.id;
        const userSockets = onlineUsers.get(userId);

        if (userSockets) {
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            io!.emit("presence:offline", { userId });

            void (async () => {
              const { error } = await supabase
                .from("users")
                .update({
                  status: "offline",
                  last_seen: new Date().toISOString(),
                })
                .eq("id", userId);
              if (error) console.error(`Failed to mark user ${userId} offline:`, error);
              else console.log(`User ${userId} marked offline`);
            })();
          }
        }
      }
    });
  });

  console.log("Socket.IO initialized");
  return io;
}

export function emitNewMessage(conversationId: number, message: OutgoingMessage): void {
  if (!io) {
    console.warn("Socket.IO not initialized, cannot emit message");
    return;
  }

  console.log(
    "[emitNewMessage] payload:",
    JSON.stringify({
      id: message.id,
      reply_to_id: message.reply_to_id,
      reply_to: message.reply_to,
    }),
  );

  const roomName = `conversation:${conversationId}`;
  io.to(roomName).emit("message:new", message);

  const size = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
  console.log(`Emitted message:new to ${roomName} (${size} sockets)`);
}

export function emitConversationListUpdate(
  userIds: number[],
  conversationId: number,
  lastMessage: OutgoingConversationUpdate["lastMessage"],
): void {
  if (!io) {
    console.warn("Socket.IO not initialized, cannot emit conversation update");
    return;
  }

  userIds.forEach((userId) => {
    io!.to(`user:${userId}`).emit("conversation:update", {
      conversationId,
      lastMessage,
    });
  });
}

export function emitNewConversation(
  userId: number,
  conversation: {
    id: number;
    created_at: string;
    type: string | null;
    name: string | null;
    participants: Array<{
      user: {
        id: number;
        name: string | null;
        avatar_url: string | null;
        status: string | null;
        last_seen: string | null;
      };
    }>;
    last_message: {
      content: string | null;
      created_at: string;
      sender_id: number;
    } | null;
    unread_count: number;
  },
): void {
  if (!io) {
    console.warn("Socket.IO not initialized, cannot emit new conversation");
    return;
  }

  io.to(`user:${userId}`).emit("conversation:new", conversation);
  console.log(`Emitted conversation:new to user:${userId}`);
}

export function emitMessageUpdated(conversationId: number, message: OutgoingMessage): void {
  if (!io) {
    console.warn("Socket.IO not initialized, cannot emit message update");
    return;
  }
  io.to(`conversation:${conversationId}`).emit("message:update", message);
}

export function emitMessageDeleted(conversationId: number, messageId: number): void {
  if (!io) {
    console.warn("Socket.IO not initialized, cannot emit message delete");
    return;
  }
  io.to(`conversation:${conversationId}`).emit("message:delete", {
    id: messageId,
  });
}
