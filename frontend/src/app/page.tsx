import { Metadata } from "next";
import Landing from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "Nexus - Future of Communication",
  description: "Nexus is a modern chat application designed for seamless and secure communication. Connect, collaborate, and communicate effortlessly.",
  keywords: "chat, messaging, communication, real-time, secure",
  openGraph: {
    title: "Nexus - Future of Communication",
    description: "A modern chat application for seamless communication",
    type: "website",
    url: "https://chat-app-two-olive.vercel.app/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus - Future of Communication",
    description: "A modern chat application for seamless communication",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Nexus",
    "description": "A modern chat application for seamless communication",
    "url": "https://chat-app-two-olive.vercel.app/",
    "applicationCategory": "CommunicationApplication",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Landing />
    </>
  );
}
