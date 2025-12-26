import { Metadata } from "next";
import Dashboard from "@/components/common/dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Nexus",
  description: "Access your Nexus dashboard to manage conversations and connect with friends.",
  robots: "noindex, nofollow",
};

export default function DashboardPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Nexus Dashboard",
    "description": "User dashboard for managing conversations and connections",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Dashboard />
    </>
  );
}
