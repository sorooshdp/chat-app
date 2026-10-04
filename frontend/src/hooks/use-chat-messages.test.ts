import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { fetchMessages, sendMessage } from "@/lib/utils/api";
import { getAuthToken } from "@/lib/utils/auth";
import { emitTypingStart, emitTypingStop } from "@/lib/socket";
import type { MessageWithSender } from "@/lib/types/api";

vi.mock("@/lib/utils/api", () => ({
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/lib/utils/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("@/lib/socket", () => ({
  emitTypingStart: vi.fn(),
  emitTypingStop: vi.fn(),
}));

const mockedFetch = vi.mocked(fetchMessages);
const mockedSend = vi.mocked(sendMessage);
const mockedGetToken = vi.mocked(getAuthToken);
const mockedTypingStart = vi.mocked(emitTypingStart);
const mockedTypingStop = vi.mocked(emitTypingStop);

function serverMessage(overrides: Partial<MessageWithSender> = {}): MessageWithSender {
  return {
    id: 1,
    content: "hello",
    created_at: "2025-01-01T00:00:00.000Z",
    sender_id: 2,
    is_read: false,
    sender: { id: 2, name: "Alice", avatar_url: null },
    ...overrides,
  } as MessageWithSender;
}

function renderUseChatMessages(overrides: Partial<Parameters<typeof useChatMessages>[0]> = {}) {
  const onScrollToBottom = vi.fn();

  const view = renderHook(() =>
    useChatMessages({
      conversationId: 10,
      currentUserId: 1,
      onScrollToBottom,
      ...overrides,
    })
  );

  return { ...view, onScrollToBottom };
}

beforeEach(() => {
  mockedGetToken.mockReturnValue("test-token");
  mockedFetch.mockResolvedValue({ messages: [], hasMore: false });
  mockedSend.mockResolvedValue(serverMessage());
  mockedTypingStart.mockImplementation(() => {});
  mockedTypingStop.mockImplementation(() => {});
});

describe("loadInitialMessages", () => {
  it("clears state when there is no conversation", async () => {
    mockedFetch.mockResolvedValue({ messages: [serverMessage()], hasMore: true });

    const { result } = renderUseChatMessages({ conversationId: null });
    await act(async () => {
      await result.current.loadInitialMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMoreMessages).toBe(false);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("maps fetched messages into local messages", async () => {
    mockedFetch.mockResolvedValue({ messages: [serverMessage()], hasMore: true });

    const { result } = renderUseChatMessages();
    await act(async () => {
      await result.current.loadInitialMessages();
    });

    expect(mockedFetch).toHaveBeenCalledWith(10, "test-token", 50);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.id).toBe("1");
    expect(result.current.messages[0]?.isLocal).toBe(false);
    expect(result.current.hasMoreMessages).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("does not call the API when there is no auth token", async () => {
    mockedGetToken.mockReturnValue(null);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    await act(async () => {
      await result.current.loadInitialMessages();
    });

    expect(mockedFetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("No auth token found");
  });

  it("keeps isLoading false after a fetch failure", async () => {
    mockedFetch.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    await act(async () => {
      await result.current.loadInitialMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});

describe("handleInputChange", () => {
  it("stores the value", () => {
    const { result } = renderUseChatMessages();

    act(() => {
      result.current.handleInputChange("hey there");
    });

    expect(result.current.messageInput).toBe("hey there");
  });

  it("emits typing start once for consecutive non-empty input", () => {
    vi.useFakeTimers();
    const { result } = renderUseChatMessages();

    act(() => result.current.handleInputChange("h"));
    act(() => result.current.handleInputChange("he"));
    act(() => result.current.handleInputChange("hey"));

    expect(mockedTypingStart).toHaveBeenCalledTimes(1);
    expect(mockedTypingStop).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("emits typing stop after the 2s idle timeout", () => {
    vi.useFakeTimers();
    const { result } = renderUseChatMessages();

    act(() => result.current.handleInputChange("hey"));
    expect(mockedTypingStart).toHaveBeenCalledWith(10);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockedTypingStop).toHaveBeenCalledWith(10);
    vi.useRealTimers();
  });

  it("emits typing stop immediately when input is cleared", () => {
    const { result } = renderUseChatMessages();

    act(() => result.current.handleInputChange("hey"));
    act(() => result.current.handleInputChange("   "));

    expect(mockedTypingStop).toHaveBeenCalledWith(10);
  });

  it("does not emit typing events without a conversation", () => {
    const { result } = renderUseChatMessages({ conversationId: null });

    act(() => result.current.handleInputChange("hey"));

    expect(result.current.messageInput).toBe("hey");
    expect(mockedTypingStart).not.toHaveBeenCalled();
  });
});

describe("handleSendMessage", () => {
  function submitEvent() {
    return { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
  }

  it("ignores empty input", async () => {
    const { result } = renderUseChatMessages();

    act(() => result.current.handleInputChange("   "));
    await act(async () => {
      await result.current.handleSendMessage(submitEvent());
    });

    expect(mockedSend).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it("adds an optimistic message then replaces it with the server one", async () => {
    mockedSend.mockResolvedValue(serverMessage({ id: 99, content: "hi" }));
    const { result } = renderUseChatMessages();

    act(() => result.current.handleInputChange("hi"));
    await act(async () => {
      await result.current.handleSendMessage(submitEvent());
    });

    expect(mockedSend).toHaveBeenCalledWith(10, "hi", "test-token");
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.id).toBe("99");
    expect(result.current.messages[0]?.isLocal).toBe(true);
    expect(result.current.messageInput).toBe("");
  });

  it("clears the input immediately on send", async () => {
    let resolveSend: (value: MessageWithSender) => void = () => {};
    mockedSend.mockReturnValue(
      new Promise<MessageWithSender>((resolve) => {
        resolveSend = resolve;
      })
    );

    const { result } = renderUseChatMessages();
    act(() => result.current.handleInputChange("hi"));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.handleSendMessage(submitEvent());
    });

    expect(result.current.messageInput).toBe("");
    expect(result.current.messages[0]?.status).toBe("sending");

    await act(async () => {
      resolveSend(serverMessage({ id: 5 }));
      await pending;
    });
  });

  it("marks the message as failed when sending throws", async () => {
    mockedSend.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    act(() => result.current.handleInputChange("hi"));
    await act(async () => {
      await result.current.handleSendMessage(submitEvent());
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.status).toBe("failed");
  });

  it("marks the message as failed when there is no auth token", async () => {
    mockedGetToken.mockReturnValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    act(() => result.current.handleInputChange("hi"));
    await act(async () => {
      await result.current.handleSendMessage(submitEvent());
    });

    expect(mockedSend).not.toHaveBeenCalled();
    expect(result.current.messages[0]?.status).toBe("failed");
  });
});

describe("handleRetry", () => {
  it("resends a failed message and replaces it", async () => {
    mockedSend.mockRejectedValueOnce(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    act(() => result.current.handleInputChange("retry me"));
    await act(async () => {
      await result.current.handleSendMessage({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    const failedId = result.current.messages[0]!.id;
    expect(result.current.messages[0]?.status).toBe("failed");

    mockedSend.mockResolvedValue(serverMessage({ id: 77, content: "retry me" }));
    await act(async () => {
      await result.current.handleRetry(failedId);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.id).toBe("77");
  });

  it("ignores a message that is not in the failed state", async () => {
    const { result } = renderUseChatMessages();
    mockedFetch.mockResolvedValue({ messages: [serverMessage()], hasMore: false });

    await act(async () => {
      await result.current.loadInitialMessages();
    });

    await act(async () => {
      await result.current.handleRetry("1");
    });

    expect(mockedSend).not.toHaveBeenCalled();
  });
});

describe("handleDeleteFailed", () => {
  it("removes the message from state", async () => {
    mockedSend.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderUseChatMessages();
    act(() => result.current.handleInputChange("delete me"));
    await act(async () => {
      await result.current.handleSendMessage({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    const failedId = result.current.messages[0]!.id;
    act(() => {
      result.current.handleDeleteFailed(failedId);
    });

    expect(result.current.messages).toEqual([]);
  });
});

describe("handleLoadMore", () => {
  it("does nothing when there are no messages yet", async () => {
    const { result } = renderUseChatMessages();

    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("prepends older messages and passes the oldest id as the cursor", async () => {
    mockedFetch.mockResolvedValue({
      messages: [serverMessage({ id: 5 })],
      hasMore: false,
    });
    const { result } = renderUseChatMessages();
    await act(async () => {
      await result.current.loadInitialMessages();
    });
    expect(result.current.messages).toHaveLength(1);

    mockedFetch.mockResolvedValue({
      messages: [serverMessage({ id: 4, content: "older" })],
      hasMore: false,
    });
    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(mockedFetch).toHaveBeenLastCalledWith(10, "test-token", 50, "5");
    expect(result.current.messages.map((m) => m.id)).toEqual(["4", "5"]);
    expect(result.current.hasMoreMessages).toBe(false);
  });

  it("sets hasMoreMessages to false when the older page is empty", async () => {
    mockedFetch.mockResolvedValue({ messages: [serverMessage()], hasMore: true });
    const { result } = renderUseChatMessages();
    await act(async () => {
      await result.current.loadInitialMessages();
    });
    expect(result.current.hasMoreMessages).toBe(true);

    mockedFetch.mockResolvedValue({ messages: [], hasMore: true });
    await act(async () => {
      await result.current.handleLoadMore();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.hasMoreMessages).toBe(false);
  });
});
