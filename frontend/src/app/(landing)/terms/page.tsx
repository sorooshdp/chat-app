import { Metadata } from "next";
import Terms from "@/components/landing/terms";

export const metadata: Metadata = {
  title: "Terms of Service - Nexus",
  description: "Review the terms of service for using Nexus. Understand our policies and user agreements.",
  keywords: "terms, service, agreement, policy",
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service",
    "description": "Terms of service for Nexus chat application",
    "url": "https://chat-app-two-olive.vercel.app/terms",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Terms />
    </>
  );
}
