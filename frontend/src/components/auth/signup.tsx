"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Step = "EMAIL" | "PASSWORD";

export default function SignUp() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("EMAIL");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [pass, setPass] = useState<string>("");

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, pass }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const token = data.token;
      document.cookie = `token=${token}; SameSite=Strict; Expires=${new Date(Date.now() + 60 * 60 * 1000).toUTCString()}`;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strengthText = () => {
    const strength = passwordStrength();
    switch (strength) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Strong";
      case 4:
        return "Very Strong";
      default:
        return "";
    }
  };

  const strengthColor = () => {
    const strength = passwordStrength();
    if (strength === 0) return "bg-slate-700";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-black text-white md:flex md:flex-row flex flex-col">
      {/* Animated section */}
      <div className="w-full md:w-1/2 relative overflow-hidden">
        <div className="md:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900 to-black">
            <div className="absolute inset-0">
              <Orbs />
            </div>
          </div>
          <div className="relative z-10 min-h-screen flex flex-col justify-center items-center p-12">
            <div className="mb-8">
              <Image src="/nexus.png" alt="nexus logo" width={40} height={40} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Join Nexus</h1>
            <p className="text-xl text-blue-200 max-w-md text-center">
              Experience the future of communication with our next-generation platform.
            </p>
            <div className="mt-12 space-y-6">
              <FeaturePoint
                title="Secure Messaging"
                description="End-to-end encryption keeps your conversations private and secure."
              />
              <FeaturePoint
                title="Real-time Collaboration"
                description="Work together with your team in real-time, no matter where you are."
              />
              <FeaturePoint
                title="Smart Integrations"
                description="Connect with your favorite tools and services seamlessly."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sign up section */}
      <div className="w-full min-h-screen md:w-1/2 flex flex-col justify-center p-8 md:px-20">
        <div className="flex justify-between items-center w-full mb-10">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/nexus.png" alt="Nexus Logo" width={30} height={30} className="mr-1" />
            <span className="font-bold text-[20px]">Nexus</span>
          </Link>
          <Link href="/login" className="text-blue-500 hover:text-blue-700 text-[16px]">
            Log In
          </Link>
        </div>

        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Join the next generation of communication
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {step === "EMAIL" ? (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep("PASSWORD");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300 font-semibold">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Wick"
                      className="bg-slate-900 border-slate-800 pl-10 h-12 rounded-xl text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 font-semibold">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="email"
                      id="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-900 border-slate-800 pl-10 h-12 rounded-xl text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 transition-all rounded-xl group"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-semibold">
                    Create Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="bg-slate-900 border-slate-800 pl-10 pr-10 h-12 rounded-xl text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {pass && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Password strength</span>
                      <span
                        className={`text-sm ${
                          passwordStrength() < 2
                            ? "text-red-500"
                            : passwordStrength() < 3
                              ? "text-yellow-500"
                              : passwordStrength() < 4
                                ? "text-blue-500"
                                : "text-green-500"
                        }`}
                      >
                        {strengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full">
                      <div
                        className={`h-full ${strengthColor()} rounded-full transition-all duration-300`}
                        style={{ width: `${passwordStrength() * 25}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <PasswordRequirements text="At least 8 characters" met={pass.length >= 8} />
                      <PasswordRequirements text="At least 1 uppercase letter" met={/[A-Z]/.test(pass)} />
                      <PasswordRequirements text="At least 1 number" met={/[0-9]/.test(pass)} />
                      <PasswordRequirements text="At least 1 special character" met={/[^A-Za-z0-9]/.test(pass)} />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center gap-3">
                  <Button
                    type="button"
                    className="w-[20%] h-12 rounded-xl bg-slate-900 border-slate-800 hover:bg-slate-800 group"
                    onClick={() => setStep("EMAIL")}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 transition-all rounded-xl group disabled:opacity-50"
                    disabled={passwordStrength() < 3 || isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </Button>
                </div>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800 h-12">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              </Button>
              <Button variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800 h-12">
                <svg className="h-5 w-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </Button>
              <Button variant="outline" className="bg-slate-900 border-slate-800 hover:bg-slate-800 h-12">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PasswordRequirements({ text, met }: { text: string; met: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`flex-shrink-0 rounded-full p-1 ${met ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}
      >
        <Check className="h-4 w-4" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function FeaturePoint({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 rounded-full p-1 bg-blue-500/20 text-blue-400">
        <Check className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function Orbs() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute rounded-full bg-blue-500 opacity-30 blur-3xl animate-pulse-slow w-72 h-72 top-20 left-10" />
      <div className="absolute rounded-full bg-blue-400 opacity-20 blur-2xl animate-pulse-slower w-56 h-56 top-60 left-1/3" />
      <div className="absolute rounded-full bg-blue-600 opacity-25 blur-3xl animate-pulse w-80 h-80 top-1/4 left-2/3" />
      <div className="absolute rounded-full bg-blue-500 opacity-15 blur-xl animate-pulse-slower w-48 h-48 bottom-1/4 right-20" />
      <div className="absolute rounded-full bg-blue-400 opacity-20 blur-2xl animate-pulse w-64 h-64 bottom-20 right-40" />
    </div>
  );
}
