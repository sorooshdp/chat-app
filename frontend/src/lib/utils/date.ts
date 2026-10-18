import { format } from "date-fns";

export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return format(date, "HH:mm");
}
