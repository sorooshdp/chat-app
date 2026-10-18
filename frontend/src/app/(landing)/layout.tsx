"use client";

import AnimatedBackground from "@/components/ui/animatedBackground";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
