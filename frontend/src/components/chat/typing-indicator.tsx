"use client";

import type { JSX } from "react";

export function TypingIndicator(): JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-1">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
