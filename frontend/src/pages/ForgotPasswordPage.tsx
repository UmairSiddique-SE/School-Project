import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success("If that email exists, a reset link has been sent.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not request a reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h1 className="text-2xl font-black">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email and we will send you a secure reset link.
        </p>

        {sent ? (
          <p className="mt-6 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-600">
            Check your inbox for the reset link. The link expires in one hour.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="you@school.edu.pk"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <Link to="/school-login" className="mt-6 inline-block text-sm font-bold text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
