// import { redirect } from "next/navigation";
// import { cookies } from "next/headers";
// import { ConversationList } from "@/components/common/conversation-list";
// import { ChatWindow } from "@/components/common/chat-window";
// import { JSX } from "react";

// async function fetchConversations(token: string): Promise<ConversationsResponse> {
//   const response = await fetch("http://localhost:8080/api/conversations", {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     cache: "no-store",
//   });

//   if (!response.ok) {
//     const log = response;
//     console.log(log);
//     throw new Error("Failed to fetch conversations");
//   }

//   return response.json();
// }

// export default async function DashboardPage(): Promise<JSX.Element> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   if (!token) {
//     redirect("/login");
//   }

//   const data = await fetchConversations(token);

//   return (
//     <div className="flex min-h-screen bg-black text-white">
//       <ConversationList conversations={data.conversations} />
//       <ChatWindow />
//     </div>
//   );
// }

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardClient } from "@/components/common/dashboard-client";
import type { ConversationsResponse } from "@/lib/types/api";
import { JSX } from "react";

async function fetchConversations(token: string): Promise<ConversationsResponse> {
  const response = await fetch("http://localhost:8080/api/conversations", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export default async function Dashboard(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const data = await fetchConversations(token);

  return <DashboardClient initialConversations={data.conversations} />;
}
