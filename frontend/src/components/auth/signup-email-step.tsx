import { ArrowRight, Mail, User } from "lucide-react";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupEmailStepProps = Readonly<{
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
}>;

export function SignupEmailStep({
  name,
  email,
  onNameChange,
  onEmailChange,
  onContinue,
}: SignupEmailStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name" className="font-semibold text-slate-300">
          Full name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="John Wick"
            className="h-12 rounded-xl border-slate-800 bg-slate-900 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold text-slate-300">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            id="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-12 rounded-xl border-slate-800 bg-slate-900 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            required
          />
        </div>
      </div>

      <Button type="submit" className="group h-12 w-full rounded-xl bg-blue-600 transition-all hover:bg-blue-500">
        Continue
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </form>
  );
}
