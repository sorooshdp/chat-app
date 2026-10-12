import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getPasswordStrength, getStrengthColor, getStrengthText } from "@/lib/utils/password";
import { PasswordField } from "./password-field";

type PasswordRequirementsProps = Readonly<{
  text: string;
  met: boolean;
}>;

type SignupPasswordStepProps = Readonly<{
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}>;

function PasswordRequirements({ text, met }: PasswordRequirementsProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`shrink-0 rounded-full p-1 ${met ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
        <Check className="h-4 w-4" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

export function SignupPasswordStep({
  password,
  showPassword,
  isLoading,
  onPasswordChange,
  onTogglePassword,
  onBack,
  onSubmit,
}: SignupPasswordStepProps) {
  const strength = getPasswordStrength(password);

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <PasswordField
        id="password"
        label="Create Password"
        password={password}
        showPassword={showPassword}
        disabled={isLoading}
        onPasswordChange={onPasswordChange}
        onTogglePassword={onTogglePassword}
      />

      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Password strength</span>
            <span className={`text-sm ${strength < 2 ? "text-red-500" : strength < 3 ? "text-yellow-500" : strength < 4 ? "text-blue-500" : "text-green-500"}`}>
              {getStrengthText(password)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(password)}`} style={{ width: `${strength * 25}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PasswordRequirements text="At least 8 characters" met={password.length >= 8} />
            <PasswordRequirements text="At least 1 uppercase letter" met={/[A-Z]/.test(password)} />
            <PasswordRequirements text="At least 1 number" met={/[0-9]/.test(password)} />
            <PasswordRequirements text="At least 1 special character" met={/[^A-Za-z0-9]/.test(password)} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          className="group h-12 w-[20%] rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
        <Button
          type="submit"
          className="group h-12 flex-1 rounded-xl bg-blue-600 transition-all hover:bg-blue-500 disabled:opacity-50"
          disabled={strength < 3 || isLoading}
        >
          {isLoading ? "Creating account..." : "Sign Up"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Button>
      </div>
    </form>
  );
}
