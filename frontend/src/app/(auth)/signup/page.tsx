import { Metadata } from "next";
import SignUp from "@/components/auth/signup";

export const metadata: Metadata = {
  title: "Sign Up - Nexus",
  description: "Create a new Nexus account to start chatting with friends and connecting with others.",
  robots: "noindex, nofollow",
};

export default function SignUpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Nexus Sign Up",
    "description": "Sign up page for creating a new Nexus account",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SignUp />
    </>
  );
}
