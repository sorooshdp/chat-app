"use client";

import type { JSX } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
  onBack: () => void;
}

export function ChatHeader({
  displayName,
  avatarUrl,
  isOnline,
  onBack,
}: ChatHeaderProps): JSX.Element {
  return (
    <>
      {/* Mobile back button */}
      <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
        <button
          onClick={onBack}
          className="p-2 mr-3 rounded hover:bg-blue-800 text-slate-400 transition"
          aria-label="Back to contacts"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-white text-lg">{displayName}</span>
      </div>

      {/* Desktop header */}
      <header className="hidden md:flex items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full mr-3 border-2 border-blue-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-blue-700 flex items-center justify-center mr-3">
            <span className="text-sm font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex flex-col flex-1">
          <span className="font-bold text-white text-lg">{displayName}</span>
          <span
            className={`text-xs flex items-center gap-1 ${
              isOnline ? "text-green-400" : "text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-slate-500"
              }`}
            />
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </header>
    </>
  );
}
