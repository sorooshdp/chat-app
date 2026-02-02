"use client";

import { useState, useEffect } from "react";
import { getCurrentUserId } from "@/lib/utils/auth";

/**
 * Hook to get the current authenticated user's ID
 * Returns null while loading or if not authenticated
 */
export function useCurrentUser(): number | null {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error("Failed to get current user ID:", error);
      setCurrentUserId(null);
    }
  }, []);

  return currentUserId;
}
