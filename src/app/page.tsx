import { Check, MessageSquare, Sparkle, Zap, Shield, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TypeAnimation from "@/components/ui/typeAnimation";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div>
        {/* Header */}
        <header className="container mx-auto py-6 px-14 flex justify-between items-centerr">
          <div className="flex items-center gap-2 px-4">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-amber-50">Nexus</span>
          </div>
          <nav className="md:flex gap-8 justify-center items-center">
            <Link href="/features" className="text-amber-50 hover:text-blue-500 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-amber-50 hover:text-blue-500 transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-amber-50 hover:text-blue-500 transition-colors">
              About
            </Link>
          </nav>
          <div className="flex gap-4">
            <Button variant="ghost" className=" text-amber-50 hover:bg-amber-50 hover:text-blue-400">
              <Link href="/login">Log in</Link>
            </Button>
            <Button className=" text-amber-50 bg-blue-600 hover:bg-blue-500">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </header>

        {/*divider */}
        <div className="bg-[radial-gradient(circle,rgba(255,255,255,1)_1%,rgba(255,255,255,0.05)_100%)] mx-auto h-0.5 opacity-50 "></div>

        
        <main>
          {/* Hero */}
          <div className="container mx-auto px-4 py-20 max-h-80">
            <TypeAnimation speed={50} />
          </div>
          
          {/* Features */}
          <section className="h-min-[20rem] py-24 flex flex-col items-center justify-center text-amber-50">
            <div className="flex flex-col items-center gap-4 mb-16">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Sparkle className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-amber-50 font-bold text-4xl text-center mb-4">
                Features That Don&apos;t Actually Work
              </h1>
              <p className="text-slate-500 text-center max-w-2xl">Like your relationships</p>
            </div>

            {/*feature items */}
            <div className=" grid md:grid-cols-2 gap-12 mb-20 text-amber-50 px-16">

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-blue-500/50 transition-colors group">
                <div className="bg-blue-500/20 rounded-full w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap  className="h-7 w-7 text-blue-400"/>
                </div>
                <h3 className=" text-2xl font-bold mb-3">Ridiculously Fast Messaging</h3>
                <p className="text-slate-400 mb-4">So fast your friends will think you&apos;re psychic. Or that you have no life and just stare at your phone all day.</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Messages arrive faster than your pizza delivery</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Works even on your grandma&apos;s dial-up internet</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Typing indicators that induce anxiety in real-time</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-green-400/50 transition-colors group">
                <div className="bg-green-500/20 rounded-full w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-green-400" />
                </div>
                <h3 className=" text-2xl font-bold mb-3">Paranoia-Level Security</h3>
                <p className="text-slate-400 mb-4">So secure, even your FBI agent will need to ask permission to read your messages.</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">End-to-end encryption that would make hackers cry</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Two-factor authentication that&apos;s more protective than your mom</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-purple-500/50 transition-colors group">
                <div className="bg-purple-500/20 rounded-full w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className=" text-2xl font-bold mb-3">Group Chats That Don&apos;t Suck</h3>
                <p className="text-slate-400 mb-4">Finally, a way to organize your friends that&apos;s easier than herding cats on cocaine.</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Thread organization that makes sense (unlike your love life)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Mute button for that one friend who never shuts up</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Polls that settle arguments without passive-aggressive texts</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 hover:border-yellow-500/50 transition-colors group">
                <div className="bg-yellow-500/20 rounded-full w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-7 w-7 text-yellow-400" />
                </div>
                <h3 className=" text-2xl font-bold mb-3">Funny AI to make your crush laugh</h3>
                <p className="text-slate-400 mb-4"></p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Smart replies that are actually smart (and occasionally sassy)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Translates your drunk texts into coherent messages</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5"/>
                    <span className="text-slate-300">Detects when you&apos;re about to send an angry message and asks &quot;You sure about that?&quot;</span>
                  </li>
                </ul>
              </div>

            </div>
          </section>
        </main>

        <footer className="text-amber-50 border-slate-700 border-t py-10">
          <div className="container mx-auto gap-4 text-center text-slate-400">
            <div className="flex justify-center gap-6 mb-6">
              <Link href="" className="hover:text-amber-50 transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-amber-50 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-amber-50 transition-colors">
                Contact
              </Link>
            </div>
            <p>© 2025 All rights not reserved 🤭.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
