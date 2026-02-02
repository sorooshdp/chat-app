"use client";

import { JSX } from "react";
import Image from "next/image";
import type { UserProfile } from '@/lib/types/api';

interface UserSearchItemProps {
  user: UserProfile;
  onSelect: (user: UserProfile) => Promise<void>;
  disabled?: boolean;
}

export function UserSearchItem({ user, onSelect, disabled = false }: UserSearchItemProps): JSX.Element {
  const displayName = user.name || user.email;

  const handleClick = async (): Promise<void> => {
    await onSelect(user);
  };

  return (
    <li>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-full flex items-center py-3 px-2 rounded-lg transition group ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-900/50"
        }`}
        aria-label={`Start conversation with ${displayName}`}
      >
        <div className="relative w-10 h-10 mr-3 shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={displayName}
              fill
              sizes="40px"
              className="rounded-full object-cover border-2 border-blue-700"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-700 border-2 border-blue-700 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-start min-w-0">
          <span className="font-semibold text-white group-hover:text-blue-400 truncate w-full">{displayName}</span>
          <span className="text-slate-400 text-xs truncate w-full">{user.email}</span>
        </div>
      </button>
    </li>
  );
}
