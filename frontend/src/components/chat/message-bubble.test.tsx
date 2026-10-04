import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageBubble } from "./message-bubble";

describe("MessageBubble", () => {
  const defaultProps = {
    id: "msg-1",
    content: "Hello world",
    createdAt: "2026-10-04T09:00:00Z",
    senderName: "Alice",
    isOwnMessage: false,
    status: "sent" as const,
    isRead: false,
  };

  it("renders the message content and sender name for incoming messages", () => {
    render(<MessageBubble {...defaultProps} />);
    
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not render the sender name for own messages", () => {
    render(<MessageBubble {...defaultProps} isOwnMessage={true} />);
    
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("displays retry and delete buttons when status is failed", () => {
    const onRetry = vi.fn();
    const onDelete = vi.fn();
    
    render(
      <MessageBubble 
        {...defaultProps} 
        isOwnMessage={true} 
        status="failed" 
        onRetry={onRetry} 
        onDelete={onDelete} 
      />
    );
    
    expect(screen.getByText("Failed to send")).toBeInTheDocument();
    
    const retryBtn = screen.getByText("Retry");
    const deleteBtn = screen.getByText("Delete");
    
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledWith("msg-1");
    
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("msg-1");
  });
});