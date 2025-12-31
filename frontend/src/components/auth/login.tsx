"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/utils/auth";

export default function LogIn() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [pass, setPass] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          pass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const token = data.token;
      setAuthToken(token);
      setSuccess("Login successful. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Login section */}
      <div className="w-full md:w-[50%] md:h-screen p-8 md:px-20 flex flex-col justify-center">
        <div className="flex flex-row justify-between items-center mb-10">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/nexus.png" alt="Nexus Logo" width={30} height={30} className="mr-1" />
            <span className="font-bold text-[20px]">Nexus</span>
          </Link>
          <Link href="/signup" className="text-blue-500 hover:text-blue-700 text-[16px]">
            Create account
          </Link>
        </div>

        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold text-white">Log In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{success}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-slate-900 border-slate-800 pl-10 h-12 rounded-xl text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-300 font-semibold">
                    Password
                  </Label>
                  <Link href="/reset" className="text-sm text-blue-500 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white rounded-xl w-full h-12 transition-all hover:bg-blue-600 group disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Log In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
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

      {/* Animated section */}
      <div className="w-full md:w-1/2 relative overflow-hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black">
          <div className="absolute inset-0 opacity-30">
            <HexagonGrid />
          </div>
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center p-12">
          <div className="mb-8">
            <Image src="/nexus.png" alt="nexus logo" width={40} height={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-xl text-blue-200 max-w-md text-center">
            Log in to continue your journey with the next generation of communication.
          </p>
        </div>
      </div>
    </div>
  );
}

function HexagonGrid() {
  return (
    <div className="grid grid-cols-6 gap-4 opacity-30">
      {Array.from({ length: 60 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square relative"
          style={{
            animation: `pulse ${3 + Math.random() * 4}s infinite alternate ${Math.random() * 2}s`,
          }}
        >
          <div
            className="absolute inset-0 bg-blue-500/30 rotate-45 transform"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          />
        </div>
      ))}
    </div>
  );
}
