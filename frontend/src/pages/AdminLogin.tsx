import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Loader2,
  ArrowRight,
  Server,
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("superadmin@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your Super Admin email and password.");
      return;
    }
    setLoading(true);

    try {
      const res = await apiClient.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const { user, accessToken } = res.data;

      if (user.role !== "SUPER_ADMIN" && user.role !== "SCHOOL_ADMIN") {
        toast.error("Access denied. Super Administrator account required.");
        setLoading(false);
        return;
      }

      login(accessToken, user);
      toast.success(`Welcome, ${user.name}!`);

      if (user.role === "SUPER_ADMIN") {
        navigate("/super-admin", { replace: true });
      } else {
        navigate(`/${user.schoolSlug || "edusphere"}/dashboard`, {
          replace: true,
        });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        "No account found for this email. Please check and try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-rose-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            System Level 0
          </span>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0b0f19]/90 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.12)] overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/10 bg-gradient-to-r from-rose-950/30 via-slate-900/50 to-indigo-950/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                <ShieldCheck size={26} />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              Master Admin <span className="text-rose-400">Portal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Super Administrator & System Governance Console — Secure access
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  placeholder="superadmin@edusphere.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LockKeyhole size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 transition-all shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
              <span>
                {loading ? "Signing in..." : "Enter Super Admin Panel"}
              </span>
            </button>
          </form>

          {/* Footer note */}
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Server size={14} className="text-emerald-400" />
              <span>Database Active</span>
            </span>
            <Link
              to="/school-login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Campus Login →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
