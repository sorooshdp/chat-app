"use client";

import AnimatedBackground from "@/components/ui/animatedBackground";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Persistent Animated Background */}
      <AnimatedBackground />
      
      {/* Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
