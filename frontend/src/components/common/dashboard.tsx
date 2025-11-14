// import Image from "next/image";

// export default function Dashboard() {
//   return (
//     <div className="flex min-h-screen bg-black text-white">
//       {/* Sidebar: Chat list & menu */}
//       <aside className="relative w-80 min-w-[260px] max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out">
//         {/* Hamburger Menu Button */}
//         <button
//           aria-label="Open Menu"
//           className="absolute top-4 left-4 z-20 p-2 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
//         >
//           <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-blue-400">
//             <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//           </svg>
//         </button>
//         {/* Search Bar */}
//         <div className="p-4 pt-16 bg-slate-900">
//           <label htmlFor="chat-search" className="sr-only">
//             Search chats
//           </label>
//           <input
//             id="chat-search"
//             type="text"
//             placeholder="Search"
//             className="w-full rounded-xl py-2 px-4 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
//             autoComplete="off"
//           />
//         </div>
//         {/* Chats List */}
//         <nav className="flex-1 overflow-y-auto">
//           <ul className="px-2">
//             {/* Example chat item */}
//             <li>
//               <button className="w-full flex items-center py-3 px-2 rounded-lg hover:bg-blue-900 transition group">
//                 <img
//                   src="/avatars/user1.png"
//                   alt="User 1"
//                   className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-blue-700"
//                 />
//                 <div className="flex-1 flex flex-col items-start">
//                   <span className="font-semibold text-white group-hover:text-blue-400">User 1</span>
//                   <span className="text-slate-400 text-xs truncate w-40">Last message preview...</span>
//                 </div>
//                 <span className="text-xs text-blue-400 ml-2">10:52</span>
//               </button>
//             </li>
//           </ul>
//         </nav>
//       </aside>

//       {/* Main Chat Section */}
//       <main className="flex-1 flex flex-col bg-gradient-to-br from-black via-slate-900 to-blue-950">
//         {/* Chat Header */}
//         <header className="flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
//           <img
//             src="/avatars/user1.png"
//             alt="Active User"
//             className="w-10 h-10 rounded-full mr-3 border-2 border-blue-700"
//           />
//           <div className="flex flex-col flex-1">
//             <span className="font-bold text-white text-lg">User 1</span>
//             <span className="text-slate-400 text-xs">online</span>
//           </div>
//           <button className="ml-auto p-2 rounded hover:bg-blue-800 text-slate-400 transition" aria-label="More options">
//             <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
//               <circle cx="10" cy="4" r="2" />
//               <circle cx="10" cy="10" r="2" />
//               <circle cx="10" cy="16" r="2" />
//             </svg>
//           </button>
//         </header>
//         {/* Chat Messages */}
//         <section className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
//           {/* Example message (sent) */}
//           <div className="flex justify-end">
//             <div className="rounded-xl bg-blue-600 text-white px-4 py-2 max-w-[60%] shadow">
//               Hello, how are you?
//               <span className="block text-xs text-blue-200 mt-1 text-right">10:52</span>
//             </div>
//           </div>
//           {/* Example message (received) */}
//           <div className="flex justify-start">
//             <div className="rounded-xl bg-slate-800 text-white px-4 py-2 max-w-[60%] shadow">
//               Im good! How about you?
//               <span className="block text-xs text-slate-400 mt-1">10:53</span>
//             </div>
//           </div>
//           {/* More messages ... */}
//         </section>
//         {/* Message Input */}
//         <form className="flex items-center gap-2 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
//           <input
//             type="text"
//             placeholder="Type your message..."
//             className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
//             autoComplete="off"
//           />
//           <button
//             type="submit"
//             className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center transition"
//           >
//             <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
//               <path d="M2 21l21-9-21-9v7l15 2-15 2v7z" fill="currentColor" />
//             </svg>
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ConversationList } from "@/components/common/conversation-list";
import { ChatWindow } from "@/components/common/chat-window";
import type { ConversationsResponse } from "@/lib/types/conversations";
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
    const log = response;
    console.log(log);
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const data = await fetchConversations(token);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <ConversationList conversations={data.conversations} />
      <ChatWindow />
    </div>
  );
}
