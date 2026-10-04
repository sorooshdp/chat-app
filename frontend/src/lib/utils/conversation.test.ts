import { describe, it, expect } from "vitest";
import { getDisplayName } from "@/lib/utils/conversation";
import type { ConversationWithDetails } from "@/lib/types/api";

function makeConversation(
  overrides: Partial<ConversationWithDetails> & {
    names: Array<string | null>;
    type?: "dm" | "group";
  }
): ConversationWithDetails {
  const { names, type = "dm", ...rest } = overrides;

  return {
    id: 1,
    name: null,
    type,
    participants: names.map((name, index) => ({
      user: { id: index + 1, name, avatar_url: null },
      joined_at: "2025-01-01T00:00:00.000Z",
    })),
    last_message: null,
    ...rest,
  } as ConversationWithDetails;
}

describe("getDisplayName", () => {
  it("returns the group name for a group chat", () => {
    const conversation = makeConversation({
      names: ["Alice", "Bob"],
      type: "group",
      name: "Study Group",
    });

    expect(getDisplayName(conversation)).toBe("Study Group");
  });

  it("returns the single participant name for a 1:1 DM", () => {
    const conversation = makeConversation({ names: ["Alice"] });
    expect(getDisplayName(conversation)).toBe("Alice");
  });

  it("joins participant names for a multi-participant conversation", () => {
    const conversation = makeConversation({
      names: ["Alice", "Bob", "Carol"],
      type: "group",
    });

    expect(getDisplayName(conversation)).toBe("Alice, Bob, Carol");
  });

  it("skips participants with a null name", () => {
    const conversation = makeConversation({ names: ["Alice", null] });
    expect(getDisplayName(conversation)).toBe("Alice");
  });

  it("falls back to Unknown when no name is available", () => {
    const conversation = makeConversation({ names: [null, null] });
    expect(getDisplayName(conversation)).toBe("Unknown");
  });

  it("falls back to Unknown for an empty participant list", () => {
    const conversation = makeConversation({ names: [] });
    expect(getDisplayName(conversation)).toBe("Unknown");
  });
});
