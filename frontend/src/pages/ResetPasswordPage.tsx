import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/apiClient";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setDone(true);
      toast.success("Password updated. Please sign in again.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h1 className="text-2xl font-black">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters.</p>

        {done ? (
          <Link to="/school-login" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
            Continue to login
          </Link>
        ) : !token ? (
          <p className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            This reset link is missing its token. Request a new one.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider">
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
