import { 
  Check, 
  MessageSquare, 
  Sparkle, 
  Zap, 
  Shield, 
  Users, 
  Brain, 
  ArrowRight, 
  Skull, 
  X, 
  Laugh, 
  Rocket, 
  Coffee} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TypeAnimation from "@/components/ui/typeAnimation";
import AnimatedBackground from "@/components/ui/animatedBackground";

export default function Home() {
  return (
  <div className="relative min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />
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
          <section id="features" className="h-min-[20rem] py-24 flex flex-col items-center justify-center text-amber-50">
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
            
            <div className="text-center mt-10">
              <Button className="bg-blue-600 hover:bg-blue-500 text-amber-50 px-8 py-6 text-lg">
                <Link href="/signup" className="flex items-center justify-center">
                  Try These Features <ArrowRight className="h-5 w-5 ml-5" />
                </Link>
              </Button>
            </div>
          </section>

          {/**pricing */}
          <section id="pricing" className="py-24 text-amber-50">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center gap-4 mb-16">
                <div className="bg-pink-600/20 rounded-full w-16 h-16 flex justify-center items-center mb-3"><Skull className="h-8 w-8 text-pink-400"></Skull></div>
                <h2 className="text-4xl font-bold text-center mb-4">The fairest prices in the world</h2>
                <p className="text-slate-500 mb-4 text-center max-w-2xl">I&apos;m not actually going to charge you all of the features are jokes</p>
              </div>

              <div className="grid md:grid-cols-3 mx-auto gap-7 max-w-5xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center border-2 border-slate-800 hover:border-blue-500/50 transition-all hover:-translate-y-1 duration-300">
                  <div className="text-center flex flex-col items-center justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-50 mb-2">Cheapskate</h3>
                    <div className="text-3xl font-bold text-amber-50 mb-2">
                      $0<span className="text-lg font-normal  text-slate-500">/Forever</span>
                    </div>
                    <p className="text-slate-500">For broke students and &quot;exposure&quot; paying clients</p>
                  </div> 

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">5 chats (we know you don&apos;t have more friends anyway)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Basic messaging (text only, like it&apos;s 1999)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">1GB storage (approximately 3 selfies in 2025)</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Ads for things you just talked about (spooky!)</span>
                    </li>
                    <li className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Support (you&apos;re on your own, buddy)</span>
                    </li>
                  </ul>
                  <Button className="w-full border-slate-700 bg-blue-600 hover:bg-blue-500 text-amber-50 px-8 py-6">
                    <Link href="/signup" className="flex items-center justify-center">
                      Get Started
                    </Link>
                  </Button>
                </div>


                <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center border-2 border-blue-600 shadow-lg shadow-blue-500 transition-all hover:-translate-y-1 duration-300">
                  <div className="text-center flex flex-col items-center justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
                      <Rocket className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-50 mb-2">Actually Good</h3>
                    <div className="text-3xl font-bold text-amber-50 mb-2">
                      $9.99<span className="text-lg font-normal  text-slate-500">/Month</span>
                    </div>
                    <p className="text-slate-500">For people with standards and disposable income</p>
                  </div> 

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Unlimited chats (go wild, social butterfly!)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">All messaging features (GIFs, voice, video, the works)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">50GB storage (hoard those memes like a digital dragon)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">No ads (we respect you too much to spy on you)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Priority support (we&apos;ll pretend to care)</span>
                    </li>
                  </ul>
                  <Button className="w-full border-slate-700 bg-blue-600 hover:bg-blue-500 text-amber-50 px-8 py-6">
                    <Link href="/signup" className="flex items-center justify-center">
                      Become Awesome
                    </Link>
                  </Button>
                </div>


                <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center border-2 border-slate-800 hover:border-purple-500/50 transition-all hover:-translate-y-1 duration-300">
                  <div className="text-center flex flex-col items-center justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                      <Laugh className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-50 mb-2">Showoff</h3>
                    <div className="text-3xl font-bold text-amber-50 mb-2">
                      $24.99<span className="text-lg font-normal  text-slate-500">/Month</span>
                    </div>
                    <p className="text-slate-500">For people who buy gold-plated toothbrushes</p>
                  </div> 

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Everything in Actually Good, plus bragging rights</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">Custom emoji maker (for your weird inside jokes)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">500GB storage (digital hoarding enabler)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">VIP support (we&apos;ll actually care about your problems)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">A digital trophy that does absolutely nothing</span>
                    </li>
                  </ul>
                  <Button className="w-full border-slate-700 bg-blue-600 hover:bg-blue-500 text-amber-50 px-8 py-6">
                    <Link href="/signup" className="flex items-center justify-center">
                      Flex On Friends
                    </Link>
                  </Button>
                </div>

              </div>
            </div>
            <div className=" mt-16 bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center gab-6 mb-2">
                <Coffee className="w-6 h-6 text-amber-400 mr-2"/>
                <h3 className="font-bold text-amber-50 text-lg">Money-Back Guarantee</h3>
              </div>
              <p className="text-slate-400">If you&apos;re not satisfied within 30 days, wel&apos;l give you a full refund. No questions asked. Okay, maybe
                one question: &quot;Why are you asking for money back on a free product??&quot;</p>
            </div>
          </section>

          {/**about section */}
          <section id="about" >

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
