import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardClient } from "@/components/common/dashboard-client";
import type { ConversationsResponse } from "@/lib/types/api";
import type { JSX } from "react";

class AuthError extends Error {};

async function fetchConversations(token: string): Promise<ConversationsResponse> {
  const response = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthError("Unauthorized");
  }

    if (!response.ok) {
    // Do NOT redirect here — this is a server/infra problem, not an auth problem.
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }

  return response.json();
}

export default async function Dashboard(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Middleware already protects this route, so token should always exist here
  if (!token) {
    redirect("/login");
  }

  try {
    const data = await fetchConversations(token);
    return <DashboardClient initialConversations={data.conversations} />;
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error; // let error.tsx / global-error.tsx handle it
  }
}
