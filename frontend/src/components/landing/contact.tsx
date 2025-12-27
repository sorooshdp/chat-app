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
              <div className="bg-slate-900/50 backdrop-blur-sm border border-green-500 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
                <p className="text-slate-300 mb-6">
                  Thanks for reaching out! I&apos;ll get back to you as soon as I can.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-500">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-slate-300 font-semibold">
                        Your Name
                      </Label>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none z-10">
                          <User className="h-5 w-5" />
                        </div>
                        <Input
                          id="name"
                          name="name"
                          value={formState.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="bg-slate-900 border-slate-700 pl-10 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-slate-300 font-semibold">
                        Email Address
                      </Label>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none z-10">
                          <Mail className="h-5 w-5" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formState.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="bg-slate-900 border-slate-700 pl-10 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-slate-300 font-semibold">
                        Message
                      </Label>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none z-10">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <Textarea
                          id="message"
                          name="message"
                          value={formState.message}
                          onChange={handleChange}
                          placeholder="Write your message..."
                          className="bg-slate-900 border-slate-700 pl-10 min-h-[150px] text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 font-semibold rounded-lg py-3 transition-colors"
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

                  <p className="text text-slate-400 text-center">
                    I won&apos;t send you spam — promise.
                  </p>
                </form>
              </div>
            )}

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <Card className="flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 text-center">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">Email Me</h3>
                <p className="text-slate-400">soroosh.dadaship@gmail.com</p>
              </Card>

              <Card className="flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 text-center">
                <User className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">Social Media</h3>
                <p className="text-slate-400">@sorooshdp on all platforms</p>
              </Card>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800 py-8">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>© 2025 Soroosh — Frontend Developer Portfolio</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
