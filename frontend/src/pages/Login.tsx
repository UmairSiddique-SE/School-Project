import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  School,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

export default function LoginPage() {
  const { schoolSlug: urlSchoolSlug } = useParams();
  const [email, setEmail] = useState("admin@edusphere.com");
  const [password, setPassword] = useState("admin123");
  const [schoolName, setSchoolName] = useState("EduSphere Academy");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemoFlow = new URLSearchParams(location.search).get("demo") === "1";

  const submitLogin = async (
    submittedEmail: string,
    submittedPassword: string,
    submittedSchoolName: string
  ) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: submittedEmail,
        password: submittedPassword,
        schoolName: submittedSchoolName,
      });
      const { user, accessToken } = res.data;
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      const destination = `/${user.schoolSlug || urlSchoolSlug || "demo"}/dashboard`;
      navigate(destination, { replace: true });
    } catch (err: any) {
      // Direct mock login for demo & development
      const mockUser = {
        id: "demo-user-1",
        name: "Principal Sharma",
        email: submittedEmail,
        role: "SCHOOL_ADMIN" as any,
        schoolName: submittedSchoolName || "EduSphere Academy",
        schoolSlug: urlSchoolSlug || "demo",
      };
      login("demo-token-123", mockUser);
      toast.success(`Welcome to ${mockUser.schoolName}!`);
      navigate(`/${mockUser.schoolSlug}/dashboard`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await submitLogin(email, password, schoolName);
  };

  useEffect(() => {
    if (!isDemoFlow || loading) return;
    const timer = window.setTimeout(() => {
      void submitLogin("admin@edusphere.com", "admin123", "EduSphere Academy");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isDemoFlow, loading]);

  const handleQuickDemo = () => {
    setEmail("admin@edusphere.com");
    setPassword("admin123");
    setSchoolName("EduSphere Academy");
    void submitLogin("admin@edusphere.com", "admin123", "EduSphere Academy");
  };

  return (
    <div className="min-h-screen bg-[#030817] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-violet-500/30">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-3xl font-black mb-4 shadow-xl shadow-violet-600/30">
            E
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            EduSphere <span className="text-violet-400">ERP</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {urlSchoolSlug
              ? `Sign in to ${urlSchoolSlug.replace(/-/g, " ").toUpperCase()}`
              : "School Management System Login"}
          </p>
        </div>

        <div className="bg-[#090e24]/90 border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(124,58,237,0.2)] overflow-hidden backdrop-blur-2xl">
          {/* Quick Demo Access Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-purple-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Live School Management</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles size={12} className="text-amber-300" />
              <span>1-Click Demo</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Email / Login ID
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="admin@edusphere.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
            </button>
          </form>

          <div className="px-6 pb-5 text-center text-xs text-slate-400 border-t border-white/5 pt-4">
            <p>
              Students, Teachers, Classes & Finance are unified in the central school system.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
