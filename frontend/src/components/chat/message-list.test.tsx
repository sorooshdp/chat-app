import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageList, type LocalMessage } from "./message-list";

describe("MessageList", () => {
  const mockMessages: LocalMessage[] = [
    {
      id: "1",
      content: "First message",
      created_at: "2026-10-04T09:00:00Z",
      sender_id: 2,
      sender: { id: 2, name: "Bob", avatar_url: null },
      status: "sent",
      isLocal: false,
      is_read: true,
    }
  ];

  const defaultProps = {
    messages: mockMessages,
    currentUserId: 1,
    isLoading: false,
    hasMoreMessages: false,
    isLoadingMore: false,
    isTyping: false,
    onLoadMore: vi.fn(),
    onRetry: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders a loading skeleton when isLoading is true", () => {
    const { container } = render(<MessageList {...defaultProps} isLoading={true} />);
    // Check for the pulse animation class used in the skeleton
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("First message")).not.toBeInTheDocument();
  });

  it("renders an empty state when there are no messages", () => {
    render(<MessageList {...defaultProps} messages={[]} />);
    expect(screen.getByText("No messages yet. Start the conversation!")).toBeInTheDocument();
  });

  it("renders messages when provided", () => {
    render(<MessageList {...defaultProps} />);
    expect(screen.getByText("First message")).toBeInTheDocument();
  });

  it("shows the 'Load older messages' button when hasMoreMessages is true", () => {
    const onLoadMore = vi.fn();
    render(<MessageList {...defaultProps} hasMoreMessages={true} onLoadMore={onLoadMore} />);
    
    const loadBtn = screen.getByText("Load older messages");
    expect(loadBtn).toBeInTheDocument();
    
    fireEvent.click(loadBtn);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("disables the load more button and shows loading state when isLoadingMore is true", () => {
    render(<MessageList {...defaultProps} hasMoreMessages={true} isLoadingMore={true} />);
    
    const loadBtn = screen.getByRole("button", { name: /loading/i });
    expect(loadBtn).toBeDisabled();
  });
});