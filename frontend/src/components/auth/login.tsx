"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setAuthToken } from "@/lib/utils/auth";
import { AuthStatus } from "./auth-status";
import { LoginForm } from "./login-form";
import { LoginPromo } from "./login-promo";
import { SocialLoginButtons } from "./social-login-buttons";

export default function LogIn() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass: password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setAuthToken(data.token);
      setSuccess("Login successful. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white md:flex-row">
      <div className="flex min-h-screen w-full flex-col justify-center p-8 md:h-screen md:w-1/2 md:px-20">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/nexus.png" alt="Nexus Logo" width={30} height={30} className="mr-1" />
            <span className="text-[20px] font-bold">Nexus</span>
          </Link>
          <Link href="/signup" className="text-[16px] text-blue-500 hover:text-blue-700">
            Create account
          </Link>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold text-white">Log In</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <AuthStatus error={error} success={success} />
            <LoginForm
              email={email}
              password={password}
              showPassword={showPassword}
              isLoading={isLoading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword((visible) => !visible)}
              onSubmit={handleLogin}
            />
            <SocialLoginButtons />
          </CardContent>
        </Card>
      </div>

      <LoginPromo />
    </div>
  );
}
