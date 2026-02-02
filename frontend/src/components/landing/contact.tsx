"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Mail, User, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import AnimatedBackground from "@/components/ui/animatedBackground";
import Image from "next/image";

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission or link to backend API here
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      setFormState({
        name: "",
        email: "",
        subject: "general",
        message: "",
      });
    }, 1500);
  };

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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-white text-center">Connect with Soroosh</h1>
            <p className="text-slate-400 text-center mb-8">
              I&apos;m Soroosh (@sorooshdp), building this site to showcase my frontend development skills. Feel free to
              reach out!
            </p>

            {isSubmitted ? (
              <div className="bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border border-green-500/50 rounded-2xl p-8 text-center shadow-xl shadow-green-500/10">
                <div className="w-16 h-16 bg-linear-to-br from-green-500/30 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
                <p className="text-slate-300 mb-6">
                  Thanks for reaching out! I&apos;ll get back to you as soon as I can.
                </p>
                <Button className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/30 transition-all duration-300">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-5">
                    <div className="group">
                      <Label htmlFor="name" className="text-slate-200 font-semibold text-sm mb-2 block">
                        Your Name
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10">
                          <User className="h-5 w-5" />
                        </div>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 pl-11 text-white placeholder:text-slate-500 h-12 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="group">
                      <Label htmlFor="email" className="text-slate-200 font-semibold text-sm mb-2 block">
                        Email Address
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10">
                          <Mail className="h-5 w-5" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formState.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 pl-11 text-white placeholder:text-slate-500 h-12 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="group">
                      <Label htmlFor="message" className="text-slate-200 font-semibold text-sm mb-2 block">
                        Message
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <Textarea
                          id="message"
                          name="message"
                          value={formState.message}
                          onChange={handleChange}
                          placeholder="Write your message..."
                          className="bg-slate-900/50 border-slate-700/50 focus:border-blue-500/50 pl-11 pt-3 min-h-37.5 text-white placeholder:text-slate-500 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 resize-none"
                          rows={5}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:ring-4 focus:ring-blue-500/30 font-semibold rounded-lg h-12 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-white rounded-full"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </div>
                    )}
                  </Button>

                  <p className="text-sm text-slate-400 text-center">
                    I won&apos;t send you spam — promise.
                  </p>
                </form>
              </div>
            )}

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <Card className="flex flex-col items-center justify-center bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border-slate-700/50 p-6 text-center rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-blue-500/20 to-blue-600/10 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
                  <Mail className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Email Me</h3>
                <p className="text-slate-400 text-sm">soroosh.dadaship@gmail.com</p>
              </Card>

              <Card className="flex flex-col items-center justify-center bg-linear-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md border-slate-700/50 p-6 text-center rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-green-500/20 to-green-600/10 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-green-500/10">
                  <User className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="font-bold text-white mb-2">Social Media</h3>
                <p className="text-slate-400 text-sm">@sorooshdp on all platforms</p>
              </Card>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/10 py-8 bg-white/5 backdrop-blur-md">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>© 2025 Soroosh — Frontend Developer Portfolio</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
