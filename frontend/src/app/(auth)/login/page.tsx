import { Metadata } from "next";
import LogIn from "@/components/auth/login";

export const metadata: Metadata = {
  title: "Login - Nexus",
  description: "Log in to your Nexus account to access your messages and conversations.",
  robots: "noindex, nofollow",
};

export default function LoginPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Nexus Login",
    "description": "Login page for Nexus chat application",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LogIn />
    </>
  );
}
