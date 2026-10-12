"use client";

import { Check } from "lucide-react";
import Image from "next/image";

type FeaturePointProps = Readonly<{
  title: string;
  description: string;
}>;

function FeaturePoint({ title, description }: FeaturePointProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="shrink-0 rounded-full bg-blue-500/20 p-1 text-blue-400">
        <Check className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function Orbs() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div className="absolute left-10 top-20 h-72 w-72 animate-pulse-slow rounded-full bg-blue-500 opacity-30 blur-3xl" />
      <div className="absolute left-1/3 top-60 h-56 w-56 animate-pulse-slower rounded-full bg-blue-400 opacity-20 blur-2xl" />
      <div className="absolute left-2/3 top-1/4 h-80 w-80 animate-pulse rounded-full bg-blue-600 opacity-25 blur-3xl" />
      <div className="absolute bottom-1/4 right-20 h-48 w-48 animate-pulse-slower rounded-full bg-blue-500 opacity-15 blur-xl" />
      <div className="absolute bottom-20 right-40 h-64 w-64 animate-pulse rounded-full bg-blue-400 opacity-20 blur-2xl" />
    </div>
  );
}

const FEATURE_POINTS: ReadonlyArray<FeaturePointProps> = [
  {
    title: "Secure Messaging",
    description: "End-to-end encryption keeps your conversations private and secure.",
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time, no matter where you are.",
  },
  {
    title: "Smart Integrations",
    description: "Connect with your favorite tools and services seamlessly.",
  },
];

export function SignupPromo() {
  return (
    <div className="relative w-full overflow-hidden md:w-1/2">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-tl from-blue-900 to-black">
          <div className="absolute inset-0">
            <Orbs />
          </div>
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-12">
          <div className="mb-8">
            <Image src="/nexus.png" alt="nexus logo" width={40} height={40} />
          </div>
          <h1 className="mb-4 text-4xl font-bold">Join Nexus</h1>
          <p className="max-w-md text-center text-xl text-blue-200">
            Experience the future of communication with our next-generation platform.
          </p>
          <div className="mt-12 space-y-6">
            {FEATURE_POINTS.map((feature) => (
              <FeaturePoint key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
