import {
  ArrowRight,
  Brain,
  Coffee,
  Laugh,
  MessageSquare,
  Rocket,
  Shield,
  Skull,
  Sparkle,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TypeAnimation from "@/components/ui/typeAnimation";
import Header from "./header";
import { AboutSection } from "./about-section";
import { FeatureCard } from "./feature-card";
import { PricingCard } from "./pricing-card";

const FEATURES = [
  {
    icon: Zap,
    iconClassName: "text-blue-400",
    iconBackgroundClassName: "bg-blue-500/20",
    hoverBorderClassName: "hover:border-blue-500/50",
    title: "Ridiculously Fast Messaging",
    description: "So fast your friends will think you're psychic. Or that you have no life and just stare at your phone all day.",
    benefits: [
      "Messages arrive faster than your pizza delivery",
      "Works even on your grandma's dial-up internet",
      "Typing indicators that induce anxiety in real-time",
    ],
  },
  {
    icon: Shield,
    iconClassName: "text-green-400",
    iconBackgroundClassName: "bg-green-500/20",
    hoverBorderClassName: "hover:border-green-400/50",
    title: "Paranoia-Level Security",
    description: "So secure, even your FBI agent will need to ask permission to read your messages.",
    benefits: [
      "End-to-end encryption that would make hackers cry",
      "Two-factor authentication that's more protective than your mom",
    ],
  },
  {
    icon: Users,
    iconClassName: "text-purple-400",
    iconBackgroundClassName: "bg-purple-500/20",
    hoverBorderClassName: "hover:border-purple-500/50",
    title: "Group Chats That Don't Suck",
    description: "Finally, a way to organize your friends that's easier than herding cats on cocaine.",
    benefits: [
      "Thread organization that makes sense (unlike your love life)",
      "Mute button for that one friend who never shuts up",
      "Polls that settle arguments without passive-aggressive texts",
    ],
  },
  {
    icon: Brain,
    iconClassName: "text-yellow-400",
    iconBackgroundClassName: "bg-yellow-500/20",
    hoverBorderClassName: "hover:border-yellow-500/50",
    title: "Funny AI to make your crush laugh",
    benefits: [
      "Smart replies that are actually smart (and occasionally sassy)",
      "Translates your drunk texts into coherent messages",
      "Detects when you're about to send an angry message and asks \"You sure about that?\"",
    ],
  },
];

const PRICING_PLANS = [
  {
    icon: Users,
    iconClassName: "text-blue-400",
    iconBackgroundClassName: "bg-blue-500/20",
    borderClassName: "border-slate-800 hover:border-blue-500/50",
    name: "Cheapskate",
    price: "$0",
    interval: "Forever",
    description: "For broke students and \"exposure\" paying clients",
    actionLabel: "Get Started",
    features: [
      { label: "5 chats (we know you don't have more friends anyway)", included: true },
      { label: "Basic messaging (text only, like it's 1999)", included: true },
      { label: "1GB storage (approximately 3 selfies in 2025)", included: true },
      { label: "Ads for things you just talked about (spooky!)", included: false },
      { label: "Support (you're on your own, buddy)", included: false },
    ],
  },
  {
    icon: Rocket,
    iconClassName: "text-blue-400",
    iconBackgroundClassName: "bg-blue-500/20",
    borderClassName: "border-blue-600 shadow-lg shadow-blue-500",
    name: "Actually Good",
    price: "$9.99",
    interval: "Month",
    description: "For people with standards and disposable income",
    actionLabel: "Become Awesome",
    features: [
      { label: "Unlimited chats (go wild, social butterfly!)", included: true },
      { label: "All messaging features (GIFs, voice, video, the works)", included: true },
      { label: "50GB storage (hoard those memes like a digital dragon)", included: true },
      { label: "No ads (we respect you too much to spy on you)", included: true },
      { label: "Priority support (we'll pretend to care)", included: true },
    ],
  },
  {
    icon: Laugh,
    iconClassName: "text-purple-400",
    iconBackgroundClassName: "bg-purple-500/20",
    borderClassName: "border-slate-800 hover:border-purple-500/50",
    name: "Showoff",
    price: "$24.99",
    interval: "Month",
    description: "For people who buy gold-plated toothbrushes",
    actionLabel: "Flex On Friends",
    features: [
      { label: "Everything in Actually Good, plus bragging rights", included: true },
      { label: "Custom emoji maker (for your weird inside jokes)", included: true },
      { label: "500GB storage (digital hoarding enabler)", included: true },
      { label: "VIP support (we'll actually care about your problems)", included: true },
      { label: "A digital trophy that does absolutely nothing", included: true },
    ],
  },
];

const STORIES = [
  {
    icon: Rocket,
    iconClassName: "text-blue-400",
    iconBackgroundClassName: "bg-blue-500/20",
    title: "Out origin story",
    description: "Nexus began when our founder tried to text his crush and accidentally sent it to his boss instead. After getting fired, he decided to build a chat app with an \"unsend\" button. The crush never called back, but at least we got a company out of it.",
  },
  {
    icon: MessageSquare,
    iconClassName: "text-purple-400",
    iconBackgroundClassName: "bg-purple-500/20",
    title: "Our Mission",
    description: "Our mission is to create a chat app so good that people will actually put down their phones and talk to each other in person... Wait, that's not right. Our mission is to keep you glued to your screen 24/7 while making you think you're being social. Much better!",
  },
  {
    icon: Users,
    iconClassName: "text-green-400",
    iconBackgroundClassName: "bg-green-500/20",
    title: "The Dream Team",
    description: "Our team consists of insomniacs, coffee addicts, and people who think \"debugging\" means removing insects from their keyboards. We've got former rocket scientists working alongside people who still can't figure out how to use the office microwave. Diversity is our strength.",
  },
];

const TEAM = [
  {
    initial: "J",
    avatarClassName: "bg-gradient-to-br from-blue-500 to-purple-500",
    name: "Jake R.",
    role: "CEO & Chief Meme Officer",
    quote: "I started this company because I was tired of explaining to my parents how to use other chat apps. If they can use NexusChat, anyone can.",
    previous: "Failed Startup #1, Failed Startup #2",
  },
  {
    initial: "B",
    avatarClassName: "bg-gradient-to-br from-purple-500 to-pink-500",
    name: "Saeed K.",
    role: "CTO & Bug Creator",
    quote: "I write code like I make coffee - strong, occasionally bitter, and guaranteed to keep you up all night wondering what went wrong..",
    previous: "NASA, Google, My Parent's Basement",
  },
  {
    initial: "M",
    avatarClassName: "bg-gradient-to-br from-green-500 to-teal-500",
    name: "Miguel L.",
    role: "Design Wizard & Coffee Consumer",
    quote: "I design interfaces so intuitive that even your technophobic uncle could use them. That's not saying much though, he still prints his emails.",
    previous: "Apple, Pixar, Kindergarten Crayon Artist",
  },
];

export default function Landing() {
  return (
    <div>
      <Header />
      <div className="mx-auto h-0.5 bg-[radial-gradient(circle,rgba(255,255,255,1)_1%,rgba(255,255,255,0.05)_100%)] opacity-50" />

      <main>
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-20">
          <TypeAnimation speed={50} />
        </div>

        <section id="features" className="flex flex-col items-center justify-center py-24 text-amber-50">
          <div className="mb-16 flex flex-col items-center gap-4">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Sparkle className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mb-4 text-center text-4xl font-bold">Features That Don&apos;t Actually Work</h1>
            <p className="max-w-2xl text-center text-slate-500">Like your relationships</p>
          </div>
          <div className="grid gap-12 px-16 text-amber-50 md:grid-cols-2">
            {FEATURES.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
          </div>
          <div className="mt-10 text-center">
            <Button className="bg-blue-600 px-8 py-6 text-lg text-amber-50 hover:bg-blue-500">
              <Link href="/signup" className="flex items-center justify-center">
                Try These Features <ArrowRight className="ml-5 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="pricing" className="px-2 py-24 text-amber-50">
          <div className="container mx-auto px-4">
            <div className="mb-16 flex flex-col items-center gap-4">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pink-600/20">
                <Skull className="h-8 w-8 text-pink-400" />
              </div>
              <h2 className="mb-4 text-center text-4xl font-bold">The fairest prices in the world</h2>
              <p className="mb-4 max-w-2xl text-center text-slate-500">I&apos;m not actually going to charge you all of the features are jokes</p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-7 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => <PricingCard key={plan.name} {...plan} />)}
            </div>
            <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-6">
                <Coffee className="mr-2 h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-bold text-amber-50">Money-Back Guarantee</h3>
              </div>
              <p className="text-slate-400">If you&apos;re not satisfied within 30 days, we&apos;ll give you a full refund. No questions asked. Okay, maybe one question: &quot;Why are you asking for money back on a free product??&quot;</p>
            </div>
          </div>
        </section>

        <AboutSection stories={STORIES} team={TEAM} />
      </main>

      <footer className="border-t border-white/10 bg-white/5 py-10 text-amber-50 backdrop-blur-md">
        <div className="container mx-auto gap-4 text-center text-slate-400">
          <div className="mb-6 flex justify-center gap-6">
            <Link href="/terms" className="transition-colors hover:text-amber-50">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-amber-50">Privacy</Link>
            <Link href="/contact" className="transition-colors hover:text-amber-50">Contact</Link>
          </div>
          <p>© 2025 All rights not reserved 🤭.</p>
        </div>
      </footer>
    </div>
  );
}
