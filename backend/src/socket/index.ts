import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import supabase from '../supabaseClient';

// Validate JWT_SECRET at module load time - fail fast if not configured
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
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

// Store io instance for access from controllers
let io: SocketIOServer | null = null;

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map<number, Set<string>>();

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Check if a user is online
 */
export function isUserOnline(userId: number): boolean {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}

/**
 * Get all online user IDs
 */
export function getOnlineUserIds(): number[] {
  return Array.from(onlineUsers.keys()).filter(userId => isUserOnline(userId));
}

// Get allowed origins for CORS
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(origin => origin.trim());

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    // Track user as online
    if (socket.user) {
      const userId = socket.user.id;
      
      // Add socket to user's set
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Join user to their personal room for direct notifications
      socket.join(`user:${userId}`);

      // Broadcast presence to all connected clients
      io!.emit('presence:online', { userId });

      // Update last_seen in database (fire-and-forget with error handling)
      void (async () => {
        const { error } = await supabase
          .from('users')
          .update({ status: 'online', last_seen: new Date().toISOString() })
          .eq('id', userId);
        if (error) {
          console.error(`Failed to mark user ${userId} online:`, error);
        } else {
          console.log(`User ${userId} marked online`);
        }
      })();

      // Send current online users list to newly connected user
      socket.emit('presence:list', { onlineUserIds: getOnlineUserIds() });
    }

    // Join a conversation room (with authorization check)
    socket.on('join:conversation', async (payload: JoinConversationPayload) => {
      if (!socket.user) return;

      // Verify user is a participant of this conversation
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', payload.conversationId)
        .eq('user_id', socket.user.id)
        .single();

      if (!participant) {
        socket.emit('error', { message: 'Not authorized to join this conversation' });
        return;
      }

      const roomName = `conversation:${payload.conversationId}`;
      socket.join(roomName);
      console.log(`User ${socket.user.id} joined ${roomName}`);
    });

    // Leave a conversation room
    socket.on('leave:conversation', (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user?.id} left ${roomName}`);
    });

    // Mark conversation as read - update is_read on messages
    socket.on('conversation:markRead', async (payload: JoinConversationPayload) => {
      if (!socket.user) return;
      
      try {
        // Mark all unread messages in this conversation as read
        // (only messages not sent by the current user)
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', payload.conversationId)
          .neq('sender_id', socket.user.id)
          .eq('is_read', false);

        if (error) {
          console.error('Error marking messages as read:', error);
          return;
        }
        
        console.log(`User ${socket.user.id} marked conversation ${payload.conversationId} as read`);

        // Notify other users in the conversation that messages were read
        socket.to(`conversation:${payload.conversationId}`).emit('messages:read', {
          conversationId: payload.conversationId,
          readBy: socket.user.id,
        });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    });

    // Handle typing indicators (optional feature)
    socket.on('typing:start', (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.to(roomName).emit('typing:start', {
        conversationId: payload.conversationId,
        userId: socket.user?.id,
      });
    });

    socket.on('typing:stop', (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.to(roomName).emit('typing:stop', {
        conversationId: payload.conversationId,
        userId: socket.user?.id,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.id}`);
      
      if (socket.user) {
        const userId = socket.user.id;
        
        // Remove socket from user's set
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          
          // If no more sockets, user is offline
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            
            // Broadcast offline status
            io!.emit('presence:offline', { userId });
            
            // Update last_seen in database (fire-and-forget with error handling)
            void (async () => {
              const { error } = await supabase
                .from('users')
                .update({ status: 'offline', last_seen: new Date().toISOString() })
                .eq('id', userId);
              if (error) {
                console.error(`Failed to mark user ${userId} offline:`, error);
              } else {
                console.log(`User ${userId} marked offline`);
              }
            })();
          }
        }
      }
    });
  });

  console.log('Socket.IO initialized');
  return io;
}

// Emit a new message to all participants in a conversation
export function emitNewMessage(
  conversationId: number,
  message: {
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
  }
): void {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit message');
    return;
  }

  const roomName = `conversation:${conversationId}`;
  io.to(roomName).emit('message:new', message);
  console.log(`Emitted message to ${roomName}`);
}

// Emit conversation list update to specific users (for updating their sidebar)
export function emitConversationListUpdate(
  userIds: number[],
  conversationId: number,
  lastMessage: {
    content: string | null;
    created_at: string;
    sender_id: number;
  }
): void {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit conversation update');
    return;
  }

  userIds.forEach(userId => {
    io!.to(`user:${userId}`).emit('conversation:update', {
      conversationId,
      lastMessage,
    });
    console.log(`Emitted conversation:update to user:${userId}`);
  });
}

// Emit new conversation notification to a user
export function emitNewConversation(userId: number, conversation: {
  id: number;
  created_at: string;
  type: string | null;
  name: string | null;
  participants: Array<{ user: { id: number; name: string | null; avatar_url: string | null; status: string | null; last_seen: string | null } }>;
  last_message: { content: string | null; created_at: string; sender_id: number } | null;
  unread_count: number;
}): void {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit new conversation');
    return;
  }

  io.to(`user:${userId}`).emit('conversation:new', conversation);
  console.log(`Emitted conversation:new to user:${userId}`);
}
