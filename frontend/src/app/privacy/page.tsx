import { Metadata } from "next";
import Privacy from "@/components/landing/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy - Nexus",
  description: "Read our privacy policy to understand how Nexus protects your data and privacy.",
  keywords: "privacy, policy, data protection, security",
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "description": "Privacy policy for Nexus chat application",
    "url": "https://chat-app-two-olive.vercel.app/privacy",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Privacy />
    </>
  );
}

