"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setAuthToken } from "@/lib/utils/auth";
import { AuthStatus } from "./auth-status";
import { SignupEmailStep } from "./signup-email-step";
import { SignupPasswordStep } from "./signup-password-step";
import { SignupPromo } from "./signup-promo";
import { SocialLoginButtons } from "./social-login-buttons";

type Step = "EMAIL" | "PASSWORD";

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, pass: password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setAuthToken(data.token);
      setSuccess("Account created successfully. Redirecting...");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white md:flex-row">
      <SignupPromo />

      <div className="flex min-h-screen w-full flex-col justify-center p-8 md:w-1/2 md:px-20">
        <div className="mb-10 flex w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <Image src="/nexus.png" alt="Nexus Logo" width={30} height={30} className="mr-1" />
            <span className="text-[20px] font-bold">Nexus</span>
          </Link>
          <Link href="/login" className="text-[16px] text-blue-500 hover:text-blue-700">
            Log In
          </Link>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">Join the next generation of communication</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-0">
            <AuthStatus error={error} success={success} />

            {step === "EMAIL" ? (
              <SignupEmailStep
                name={name}
                email={email}
                onNameChange={setName}
                onEmailChange={setEmail}
                onContinue={() => setStep("PASSWORD")}
              />
            ) : (
              <SignupPasswordStep
                password={password}
                showPassword={showPassword}
                isLoading={isLoading}
                onPasswordChange={setPassword}
                onTogglePassword={() => setShowPassword((visible) => !visible)}
                onBack={() => setStep("EMAIL")}
                onSubmit={handleSignup}
              />
            )}

            <SocialLoginButtons />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
