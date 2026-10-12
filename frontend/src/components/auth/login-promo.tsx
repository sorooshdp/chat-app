"use client";

import Image from "next/image";

function HexagonGrid() {
  return (
    <div className="grid grid-cols-6 gap-4 opacity-30">
      {Array.from({ length: 60 }).map((_, index) => (
        <div
          key={index}
          className="relative aspect-square"
          style={{ animation: `pulse ${3 + (index % 4)}s infinite alternate ${(index % 3) * 0.5}s` }}
        >
          <div
            className="absolute inset-0 rotate-45 transform bg-blue-500/30"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          />
        </div>
      ))}
    </div>
  );
}

export function LoginPromo() {
  return (
    <div className="relative hidden w-full overflow-hidden md:block md:w-1/2">
      <div className="absolute inset-0 bg-linear-to-br from-blue-900 to-black">
        <div className="absolute inset-0 opacity-30">
          <HexagonGrid />
        </div>
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-12">
        <div className="mb-8">
          <Image src="/nexus.png" alt="nexus logo" width={40} height={40} />
        </div>
        <h1 className="mb-4 text-4xl font-bold">Welcome Back</h1>
        <p className="max-w-md text-center text-xl text-blue-200">
          Log in to continue your journey with the next generation of communication.
        </p>
      </div>
    </div>
  );
}
