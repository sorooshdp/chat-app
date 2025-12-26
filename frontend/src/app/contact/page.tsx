import { Metadata } from "next";
import Contact from "@/components/landing/contact";

export const metadata: Metadata = {
  title: "Contact Us - Nexus",
  description: "Get in touch with the Nexus team. We'd love to hear from you about feedback, questions, or support.",
  keywords: "contact, support, feedback, help",
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Nexus",
    "description": "Contact the Nexus support team",
    "url": "https://chat-app-two-olive.vercel.app/contact",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Contact />
    </>
  );
}
