import { format } from "date-fns";

/**
 * Format a timestamp as time (e.g., "14:32" or "2:32 PM")
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return format(date, "HH:mm");
}
