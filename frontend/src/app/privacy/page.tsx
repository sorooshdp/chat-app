import Link from "next/link"
import {  ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import AnimatedBackground from "@/components/ui/animatedBackground"
import Image from "next/image"

export default function PrivacyPage() {
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
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-green-500" />
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            </div>

            <div className="prose prose-invert prose-blue max-w-none">
              <p className="text-slate-300">
                At NexusChat, we take your privacy seriously. Almost as seriously as we take our coffee orders. Here&apos;s
                how we handle your data:
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">1. Information We Collect</h2>
              <p className="text-slate-300">We collect various types of information, including:</p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
                <li>
                  Account information (email, name, profile picture where your&apos;e trying way too hard to look casual)
                </li>
                <li>Messages (yes, even those embarrassing ones you sent at 2 AM)</li>
                <li>Usage data (we know exactly how many times you&apos;ve typed and deleted a message before sending)</li>
                <li>Device information (so we can judge your choice in technology)</li>
                <li>Your deepest, darkest secrets (just kidding... or are we?)</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">2. How We Use Your Information</h2>
              <p className="text-slate-300">We use your information to:</p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
                <li>Provide and improve our services (and occasionally laugh at your autocorrect fails)</li>
                <li>Personalize your experience (because everyone deserves to feel special)</li>
                <li>Communicate with you (but we promise not to slide into your DMs uninvited)</li>
                <li>Ensure security (we&apos;re like the overprotective parent of your data)</li>
                <li>Comply with legal obligations (because prison jumpsuits aren&apos;t our style)</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">3. Data Security</h2>
              <p className="text-slate-300">
                We protect your data using state-of-the-art encryption, multiple security layers, and a very
                intimidating guard dog named Pixel. While no method of transmission over the Internet is 100% secure
                (shocking, we know), we strive to protect your personal information like it&apos;s the last slice of pizza.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">4. Data Sharing</h2>
              <p className="text-slate-300">
                We don&apos;t sell your data. We&apos;re not that desperate for money (yet). We may share data with:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
                <li>Service providers (who are contractually obligated to be as paranoid about your data as we are)</li>
                <li>Legal authorities (if you&apos;re doing something you shouldn&apos;t be, tsk tsk)</li>
                <li>Business partners (but only the cool ones we trust)</li>
                <li>Your mom (if she asks really nicely)</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">5. Your Rights</h2>
              <p className="text-slate-300">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2 mt-4">
                <li>Access your data (yes, even those messages you sent to your ex)</li>
                <li>Correct inaccurate data (no, we won&apos;t change your message history to make you sound wittier)</li>
                <li>Delete your data (also known as the &quote;digital witness protection program&quote;)</li>
                <li>Restrict processing (fancy way of saying &quote;stop using my data for that thing&quote;)</li>
                <li>Data portability (in case you want to take your chat history to a desert island)</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">6. Cookies Policy</h2>
              <p className="text-slate-300">
                We use cookies, but not the delicious kind. These digital cookies help us remember your preferences and
                analyze traffic. You can control cookies through your browser settings, but disabling them might make
                parts of NexusChat act as temperamental as a printer with low ink.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">7. Children&apos;s Privacy</h2>
              <p className="text-slate-300">
                NexusChat is not intended for children under 13. If you&apos;re under 13, please go play outside or
                something. If we discover that a child under 13 has provided us with personal information, we will
                delete it faster than a teenager deletes their browser history when their parent walks in.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">8. Changes to This Policy</h2>
              <p className="text-slate-300">
                We may update this policy occasionally. When we do, we&apos;ll notify you by changing the &apos;Last Updated&apos; date
                below, sending a notification, or possibly hiring a skywriter if we&apos;re feeling fancy.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-white">9. Contact Us</h2>
              <p className="text-slate-300">
                Questions about this policy? Contact us at privacy@nexuschat.example.com. Our privacy team consists of
                people who actually read terms and conditions for fun, so they&apos;ll be thrilled to hear from you.
              </p>

              <p className="text-slate-300 mt-8 italic">
                Last updated: April 1, 2025 (we&apos;re not joking about privacy though, that part is serious)
              </p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800 py-8">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>© 2025 NexusChat. All rights reserved. We protect your data like it&apos;s our secret cookie recipe.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

