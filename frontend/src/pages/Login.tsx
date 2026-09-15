import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, LockKeyhole, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

export default function LoginPage() {
  const { schoolSlug: urlSchoolSlug } = useParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const schoolName = urlSchoolSlug ? urlSchoolSlug.replace(/-/g, " ") : "your school";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email: identifier.trim().toLowerCase(), password });
      const { user, accessToken, refreshToken } = res.data;
      if (!["SCHOOL_ADMIN", "TEACHER", "STUDENT"].includes(user.role)) {
        toast.error("This account does not have school portal access.");
        return;
      }
      login(accessToken, user, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      const slug = user.schoolSlug || urlSchoolSlug || "edusphere";
      if (user.role === "STUDENT") {
        navigate(`/${slug}/student-portal`, { replace: true });
      } else if (user.activationStatus === "ACTIVE") {
        navigate(`/${slug}/dashboard`, { replace: true });
      } else {
        toast.info("Your school portal is locked until approval. You can continue from onboarding.");
        navigate("/onboarding", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid Login ID or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-400/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 backdrop-blur-xl transition hover:border-cyan-400/30 hover:bg-white/[.07]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black shadow-lg shadow-cyan-500/20">E</span>
          <span className="hidden text-sm font-black sm:block">EduSphere <span className="text-cyan-300">ERP</span></span>
        </Link>
        <Link to="/school-login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:text-white">
          <ArrowLeft size={15} /> Back to Schools
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-86px)] w-full max-w-6xl items-center justify-center px-5 pb-10 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black shadow-2xl shadow-cyan-500/20">E</div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">
              <ShieldCheck size={13} /> Secure school portal
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm capitalize text-slate-400">Sign in to {schoolName}</p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300"><GraduationCap size={20} /></div>
                <div><p className="text-sm font-black text-white">School account</p><p className="text-[11px] text-slate-500">Your role is detected automatically.</p></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[.14em] text-slate-300">Login ID / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus autoComplete="username" placeholder="admin@school.pk or student Login ID" className="w-full rounded-2xl border border-white/10 bg-white/[.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[.06] focus:ring-4 focus:ring-cyan-400/10" />
                </div>
                <p className="text-[11px] leading-5 text-slate-500">School Admin and Teachers use their registered email. Students use their school-issued Login ID.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[.14em] text-slate-300">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-2xl border border-white/10 bg-white/[.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[.06] focus:ring-4 focus:ring-cyan-400/10" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/15 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? "Signing in..." : "Sign In to School Portal"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-600">EduSphere ERP · Secure multi-school access</p>
        </motion.div>
      </main>
    </div>
  );
}
