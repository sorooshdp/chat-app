import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/* Hoisted mock state                                                 */
/* ------------------------------------------------------------------ */

const mocks = vi.hoisted(() => {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  const anyHandlers: ((event: string, ...args: unknown[]) => void)[] = [];

  const socketInstance = {
    id: "fake-socket-id",
    connected: false,
    auth: {} as Record<string, unknown>,

    on(event: string, cb: (...args: unknown[]) => void) {
      (handlers[event] ??= []).push(cb);
      return socketInstance;
    },
    once(event: string, cb: (...args: unknown[]) => void) {
      (handlers[event] ??= []).push(cb);
      return socketInstance;
    },
    off(event: string, cb?: (...args: unknown[]) => void) {
      if (!handlers[event]) return socketInstance;
      if (!cb) {
        delete handlers[event];
      } else {
        handlers[event] = handlers[event].filter((h) => h !== cb);
      }
      return socketInstance;
    },
    onAny(cb: (event: string, ...args: unknown[]) => void) {
      anyHandlers.push(cb);
      return socketInstance;
    },
    emit: vi.fn(),
    connect: vi.fn(() => {
      socketInstance.connected = true;
    }),
    disconnect: vi.fn(() => {
      socketInstance.connected = false;
    }),
    removeAllListeners: vi.fn(() => {
      for (const k of Object.keys(handlers)) delete handlers[k];
      anyHandlers.length = 0;
    }),

    /* test helpers — not part of the real API */
    __fire(event: string, ...args: unknown[]) {
      for (const cb of handlers[event] ?? []) cb(...args);
    },
    __fireAny(event: string, ...args: unknown[]) {
      for (const cb of anyHandlers) cb(event, ...args);
    },
    __reset() {
      for (const k of Object.keys(handlers)) delete handlers[k];
      anyHandlers.length = 0;
      socketInstance.connected = false;
      socketInstance.auth = {};
      socketInstance.emit.mockClear();
      socketInstance.connect.mockClear();
      socketInstance.disconnect.mockClear();
      socketInstance.removeAllListeners.mockClear();
    },
  };

  return { socketInstance, ioMock: vi.fn(() => socketInstance) };
});

vi.mock("socket.io-client", () => ({
  io: mocks.ioMock,
}));

vi.mock("./utils/auth", () => ({
  getAuthToken: () => "fake.jwt.token",
}));

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe("socket", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.socketInstance.__reset();
    mocks.ioMock.mockClear();
  });

  it("joins a room immediately when already connected", async () => {
    const { connectSocket, joinConversation } = await import("./socket");
    connectSocket();
    mocks.socketInstance.connected = true;

    joinConversation(42);

    expect(mocks.socketInstance.emit).toHaveBeenCalledWith(
      "join:conversation",
      { conversationId: 42 },
    );
  });

  it("defers join until connect when not yet connected", async () => {
    const { connectSocket, joinConversation } = await import("./socket");
    connectSocket();
    mocks.socketInstance.connected = false;

    joinConversation(7);
    // No emit yet — the socket isn't connected.
    expect(mocks.socketInstance.emit).not.toHaveBeenCalledWith(
      "join:conversation",
      { conversationId: 7 },
    );

    // Simulate the socket connecting.
    mocks.socketInstance.connected = true;
    mocks.socketInstance.__fire("connect");

    expect(mocks.socketInstance.emit).toHaveBeenCalledWith(
      "join:conversation",
      { conversationId: 7 },
    );
  });

  it("re-joins all rooms on reconnect", async () => {
    const { connectSocket, joinConversation } = await import("./socket");
    connectSocket();
    mocks.socketInstance.connected = true;

    joinConversation(1);
    joinConversation(2);

    mocks.socketInstance.emit.mockClear();

    // Simulate a reconnect cycle: disconnect then connect.
    mocks.socketInstance.connected = false;
    mocks.socketInstance.__fire("disconnect", "transport close");
    mocks.socketInstance.connected = true;
    mocks.socketInstance.__fire("connect");

    const joinEmits = mocks.socketInstance.emit.mock.calls.filter(
      (c) => c[0] === "join:conversation",
    );
    const ids = joinEmits.map(
      (c) => (c[1] as { conversationId: number }).conversationId,
    );
    expect(ids.sort()).toEqual([1, 2]);
  });

  it("cleanup removes the exact listener that was registered", async () => {
    const { connectSocket, onNewMessage } = await import("./socket");
    connectSocket();

    const cb = vi.fn();
    const cleanup = onNewMessage(cb);

    // Fire the event once — handler should be called.
    mocks.socketInstance.__fire("message:new", { id: 1 });
    expect(cb).toHaveBeenCalledTimes(1);

    cleanup();
    mocks.socketInstance.__fire("message:new", { id: 2 });
    expect(cb).toHaveBeenCalledTimes(1); // no further calls
  });

  it("leaveConversation removes the room and emits leave", async () => {
    const { connectSocket, joinConversation, leaveConversation } =
      await import("./socket");
    connectSocket();
    mocks.socketInstance.connected = true;

    joinConversation(3);
    mocks.socketInstance.emit.mockClear();

    leaveConversation(3);

    expect(mocks.socketInstance.emit).toHaveBeenCalledWith(
      "leave:conversation",
      { conversationId: 3 },
    );

    // After leaving, a reconnect must NOT re-join room 3.
    mocks.socketInstance.emit.mockClear();
    mocks.socketInstance.__fire("connect");
    const ids = mocks.socketInstance.emit.mock.calls
      .filter((c) => c[0] === "join:conversation")
      .map((c) => (c[1] as { conversationId: number }).conversationId);
    expect(ids).not.toContain(3);
  });

  it("disconnectSocket removes listeners before nulling", async () => {
    const { connectSocket, disconnectSocket } = await import("./socket");
    connectSocket();
    disconnectSocket();

    expect(mocks.socketInstance.removeAllListeners).toHaveBeenCalledOnce();
    expect(mocks.socketInstance.disconnect).toHaveBeenCalledOnce();
  });
});