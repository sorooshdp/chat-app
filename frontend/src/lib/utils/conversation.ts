import type { ConversationWithDetails } from "@/lib/types/api";

/**
 * Get display name for a conversation
 * - For group chats: returns the group name
 * - For DMs: returns the other participant's name(s)
 */
export function getDisplayName(conversation: ConversationWithDetails): string {
  if (conversation.type === "group" && conversation.name) {
    return conversation.name;
  }

  const firstParticipant = conversation.participants[0];
  if (conversation.participants.length === 1 && firstParticipant?.user.name) {
    return firstParticipant.user.name;
  }

  const names = conversation.participants
    .map((p) => p.user.name)
    .filter((name): name is string => name !== null);

  return names.length > 0 ? names.join(", ") : "Unknown";
}
