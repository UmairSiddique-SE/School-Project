import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, LockKeyhole, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

export default function LoginPage() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        ...(schoolSlug ? { schoolSlug } : {}),
      });
      const { user, accessToken } = res.data;
      if (!user || !accessToken) throw new Error("Invalid authentication response");
      if (schoolSlug && user.role !== "SUPER_ADMIN" && user.schoolSlug !== schoolSlug) {
        throw new Error("This account does not belong to the selected school.");
      }
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "SUPER_ADMIN" ? "/super-admin" : `/${user.schoolSlug}/dashboard`, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030817] flex items-center justify-center p-4 text-white">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-3xl font-black mb-4">E</div>
          <h1 className="text-3xl font-black">EduSphere <span className="text-violet-400">ERP</span></h1>
          <p className="text-slate-400 mt-1 text-sm">
            {schoolSlug ? `Sign in to ${schoolSlug.replace(/-/g, " ")}` : "School Management System"}
          </p>
        </div>
        <div className="bg-[#090e24]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 text-xs font-bold text-slate-300">Secure account access</div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Email / Login ID</label>
              <div className="relative mt-1.5"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white text-sm focus:outline-none focus:border-violet-400" placeholder="name@school.edu" /></div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
              <div className="relative mt-1.5"><LockKeyhole className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white text-sm focus:outline-none focus:border-violet-400" placeholder="Enter your password" /></div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="px-6 pb-5 text-center text-xs text-slate-400">Use the credentials created by your school administrator.</div>
        </div>
      </motion.div>
    </div>
  );
}
