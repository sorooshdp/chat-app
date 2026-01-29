import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './utils/auth';

// Socket instance singleton
let socket: Socket | null = null;

// Get the backend URL from environment variable
const SOCKET_URL = process.env["NEXT_PUBLIC_API_URL"] || 'http://localhost:3000';

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
}

export interface TypingEvent {
  conversationId: number;
  userId: number;
}

/**
 * Initialize or get the socket connection
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Connect to the Socket.IO server with JWT authentication
 */
export function connectSocket(): Socket {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No auth token available for socket connection');
  }

  // If socket exists and is connected, return it
  if (socket?.connected) {
    return socket;
  }

  // If socket exists but disconnected, reconnect with same instance
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  // Create new socket connection with auth
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a conversation room to receive messages
 * Waits for connection if not yet connected
 */
export function joinConversation(conversationId: number): void {
  if (!socket) {
    console.warn('Socket not initialized, cannot join conversation');
    return;
  }

  const doJoin = () => {
    socket?.emit('join:conversation', { conversationId });
    console.log(`Joining conversation room: ${conversationId}`);
  };

  if (socket.connected) {
    doJoin();
  } else {
    // Wait for connection before joining
    socket.once('connect', doJoin);
  }
}

/**
 * Leave a conversation room
 */
export function leaveConversation(conversationId: number): void {
  if (!socket?.connected) {
    return;
  }
  socket.emit('leave:conversation', { conversationId });
}

/**
 * Subscribe to new messages in the current conversation
 */
export function onNewMessage(callback: (message: SocketMessage) => void): () => void {
  if (!socket) {
    console.warn('Socket not initialized');
    return () => {};
  }

  socket.on('message:new', callback);

  // Return cleanup function
  return () => {
    socket?.off('message:new', callback);
  };
}

/**
 * Subscribe to typing start events
 */
export function onTypingStart(callback: (event: TypingEvent) => void): () => void {
  if (!socket) {
    return () => {};
  }

  socket.on('typing:start', callback);

  return () => {
    socket?.off('typing:start', callback);
  };
}

/**
 * Subscribe to typing stop events
 */
export function onTypingStop(callback: (event: TypingEvent) => void): () => void {
  if (!socket) {
    return () => {};
  }

  socket.on('typing:stop', callback);

  return () => {
    socket?.off('typing:stop', callback);
  };
}

/**
 * Emit typing start event
 */
export function emitTypingStart(conversationId: number): void {
  if (!socket?.connected) {
    return;
  }
  socket.emit('typing:start', { conversationId });
}

/**
 * Emit typing stop event
 */
export function emitTypingStop(conversationId: number): void {
  if (!socket?.connected) {
    return;
  }
  socket.emit('typing:stop', { conversationId });
}

export interface ConversationUpdateEvent {
  conversationId: number;
  lastMessage: {
    content: string | null;
    created_at: string;
    sender_id: number;
  };
}

/**
 * Subscribe to conversation list updates (new messages in any conversation)
 */
export function onConversationUpdate(callback: (event: ConversationUpdateEvent) => void): () => void {
  if (!socket) {
    console.warn('Socket not initialized');
    return () => {};
  }

  socket.on('conversation:update', callback);

  return () => {
    socket?.off('conversation:update', callback);
  };
}

/**
 * Subscribe to new conversation events (when someone creates a conversation with you)
 */
export function onNewConversation(callback: (conversation: unknown) => void): () => void {
  if (!socket) {
    console.warn('Socket not initialized');
    return () => {};
  }

  socket.on('conversation:new', callback);

  return () => {
    socket?.off('conversation:new', callback);
  };
}
