import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/ui/animatedBackground";
import Image from "next/image";

export default function Terms() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        <header className="container mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src={"/nexus.png"} alt="Logo" width={40} height={40} />
            <span className="font-bold text-xl text-amber-50">Nexus</span>
          </div>
          <Button variant="ghost" className="text-white hover:text-blue-400">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">Terms of Service</h1>
            <div className="prose prose-invert prose-blue max-w-none">
              <p className="text-slate-300">
                Welcome to the Nexus Terms of Service, the document that lawyers forced us to write but nobody
                actually reads.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">1. Acceptance of Terms</h2>
              <p className="text-slate-300">
                By using Nexus, you agree to these Terms of Service. If you don&apos;t agree, well, there&apos;s always
                carrier pigeons or smoke signals as alternatives.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">2. Privacy Policy</h2>
              <p className="text-slate-300">
                We value your privacy almost as much as we value those 5-star reviews you&apos;re definitely going to leave
                us. Please see our Privacy Policy for details on how we protect your data and occasionally peek at your
                embarrassing emoji usage statistics.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">3. User Conduct</h2>
              <p className="text-slate-300">
                You agree not to use NexusChat for anything illegal, harmful, or that would make your grandmother
                disappointed in you. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
                <li>Sending spam (unless it&apos;s the canned meat variety, in which case, send us some too)</li>
                <li>Harassing other users (even if they deserve it for that thing they said in 2018)</li>
                <li>Impersonating others (yes, even if your celebrity impression is &quot;spot on&quot;)</li>
                <li>Distributing malware (our servers have enough problems without your help)</li>
                <li>Using the platform to plan heists (unless they&apos;re really cool ones, then maybe)</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">4. Content Ownership</h2>
              <p className="text-slate-300">
                You own your content, but you grant us a license to display it. This means your witty messages and
                questionable selfies remain yours, but we can show them to the people you send them to. Revolutionary
                concept, we know.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">5. Service Modifications</h2>
              <p className="text-slate-300">
                We can terminate your account if you violate these terms or if your dad works at a competing chat app.
                You can terminate your account anytime, but we&apos;ll secretly hope you come back. are really calling
                our names.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">6. Termination</h2>
              <p className="text-slate-300">
                We can terminate your account if you violate these terms or if your dad works at a competing chat app.
                You can terminate your account anytime, but we&apos;ll secretly hope you come back.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">7. Disclaimer of Warranties</h2>
              <p className="text-slate-300">
                Nexus is provided &quot;as is&quot; without warranties. Sometimes it works great, sometimes it
                doesn&apos;t. Kind of like that toaster you&apos;ve had since college.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">8. Limitation of Liability</h2>
              <p className="text-slate-300">
                We&apos;re not liable for any damages arising from your use of Nexus, including but not limited to:
                broken friendships due to misinterpreted texts, embarrassment from accidentally sending a message to the
                wrong person, or carpal tunnel from typing too many lols.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">9. Changes to Terms</h2>
              <p className="text-slate-300">
                WWe may update these terms occasionally. We&apos;ll notify you, but let&apos;s be honest, you&apos;ll
                probably just click &quot;accept&quot; without reading them anyway.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">10. Contact Information</h2>
              <p className="text-slate-300">
                Questions about these terms? Contact us at legal@nexuschat.example.com. But please note, our legal team
                consists of one lawyer and his cat, so responses may take time.
              </p>

              <p className="text-slate-300 mt-8 italic">Last updated: April 1, 2025 (yes, that&apos;s intentional)</p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800 py-8">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>© 2025 Nexus. All rights reserved. Terms written by humans, not lawyers (can you tell?).</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
