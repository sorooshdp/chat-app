import { CheckCircle } from "lucide-react";

type AuthStatusProps = Readonly<{
  error: string | null;
  success: string | null;
}>;

export function AuthStatus({ error, success }: AuthStatusProps) {
  return (
    <>
      {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}
    </>
  );
}
