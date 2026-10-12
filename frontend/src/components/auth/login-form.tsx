import { ArrowRight, Mail } from "lucide-react";
import { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "./password-field";

type LoginFormProps = Readonly<{
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>;

export function LoginForm({
  email,
  password,
  showPassword,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label htmlFor="email" className="font-semibold text-slate-300">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl border-slate-800 bg-slate-900 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            autoComplete="email"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <PasswordField
        id="password"
        label="Password"
        password={password}
        showPassword={showPassword}
        disabled={isLoading}
        onPasswordChange={onPasswordChange}
        onTogglePassword={onTogglePassword}
        footer={
          <Link href="/reset" className="text-sm text-blue-500 hover:text-blue-700">
            Forgot password?
          </Link>
        }
      />

      <Button
        type="submit"
        disabled={isLoading}
        className="group h-12 w-full rounded-xl bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Logging in..." : "Log In"}
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
      </Button>
    </form>
  );
}
