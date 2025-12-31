/**
 * Password strength utilities
 */
export function getPasswordStrength(pass: string): number {
  if (!pass) return 0;
  let strength = 0;
  if (pass.length >= 8) strength += 1;
  if (/[A-Z]/.test(pass)) strength += 1;
  if (/[0-9]/.test(pass)) strength += 1;
  if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
  return strength;
}

export function getStrengthText(pass: string): string {
  const strength = getPasswordStrength(pass);
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
}

export function getStrengthColor(pass: string): string {
  const strength = getPasswordStrength(pass);
  if (strength === 0) return "bg-slate-700";
  if (strength === 1) return "bg-red-500";
  if (strength === 2) return "bg-yellow-500";
  if (strength === 3) return "bg-blue-500";
  return "bg-green-500";
}
