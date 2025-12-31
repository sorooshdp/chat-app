import { formatDistanceToNow as fnsFormatDistanceToNow } from "date-fns";

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return fnsFormatDistanceToNow(date, { addSuffix: true });
}
