import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, LockKeyhole, Loader2, ArrowRight, GraduationCap } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: identifier.trim().toLowerCase(),
        password,
      });
      const { user, accessToken, refreshToken } = res.data;
      login(accessToken, user, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      const destination =
        user.role === "SUPER_ADMIN"
          ? "/super-admin"
          : user.role === "STUDENT"
            ? `/${user.schoolSlug || urlSchoolSlug || "edusphere"}/student-portal`
            : `/${user.schoolSlug || urlSchoolSlug || "edusphere"}/dashboard`;
      navigate(destination, { replace: true });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Invalid Login ID or password. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030817] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-violet-500/30">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-3xl font-black mb-4 shadow-xl shadow-violet-600/30">E</div>
          <h1 className="text-3xl font-black text-white tracking-tight">EduSphere <span className="text-violet-400">ERP</span></h1>
          <p className="text-slate-400 mt-1 text-sm">{urlSchoolSlug ? `Sign in to ${urlSchoolSlug.replace(/-/g, " ").toUpperCase()}` : "School Management System"}</p>
        </div>
        <div className="bg-[#090e24]/90 border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(124,58,237,0.2)] overflow-hidden backdrop-blur-2xl">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-purple-950/40 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold text-slate-300">Secure School Access</span></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Email / Student Login ID</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail size={16} /></div><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus autoComplete="username" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="admin@school.pk or ali150@student.school.pk" /></div>
              <div className="flex items-start gap-2 px-1 pt-1 text-[11px] text-slate-500 leading-relaxed"><GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /><span>Students use their school-issued Login ID, e.g. <strong className="text-slate-400">ali150@student.school.pk</strong>. Admins and teachers use their registered email.</span></div>
            </div>
            <div className="space-y-1.5"><label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><LockKeyhole size={16} /></div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="Enter your password" /></div></div>
            <button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] disabled:opacity-70">{loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}<span>{loading ? "Signing in..." : "Sign In"}</span></button>
          </form>
          <div className="px-6 pb-5 text-center text-xs text-slate-400 border-t border-white/5 pt-4"><p>Secure access for School Admin, Teachers &amp; Students.</p></div>
        </div>
      </motion.div>
    </div>
  );
}
