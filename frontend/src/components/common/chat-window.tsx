import { JSX } from 'react';

export function ChatWindow(): JSX.Element {
  return (
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="text-center">
        <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
      </div>
    </main>
  );
}
