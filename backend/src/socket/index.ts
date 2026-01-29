import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  user?: { id: number; email: string };
}

interface JoinConversationPayload {
  conversationId: number;
}

// Store io instance for access from controllers
let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string };
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    // Join user to their personal room for direct notifications
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join a conversation room
    socket.on('join:conversation', (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.join(roomName);
      console.log(`User ${socket.user?.id} joined ${roomName}`);
    });

    // Leave a conversation room
    socket.on('leave:conversation', (payload: JoinConversationPayload) => {
      const roomName = `conversation:${payload.conversationId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user?.id} left ${roomName}`);
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
export function emitNewConversation(userId: number, conversation: object): void {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit new conversation');
    return;
  }

  io.to(`user:${userId}`).emit('conversation:new', conversation);
  console.log(`Emitted conversation:new to user:${userId}`);
}
