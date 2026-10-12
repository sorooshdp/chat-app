import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = Readonly<{
  id: string;
  label: string;
  password: string;
  showPassword: boolean;
  disabled?: boolean;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  footer?: React.ReactNode;
}>;

export function PasswordField({
  id,
  label,
  password,
  showPassword,
  disabled = false,
  onPasswordChange,
  onTogglePassword,
  footer,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="font-semibold text-slate-300">
          {label}
        </Label>
        {footer}
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
          className="h-12 rounded-xl border-slate-800 bg-slate-900 pl-10 pr-10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
