import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolPublicData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  isActive: boolean;
  subscription?: {
    plan: string;
    status: string;
    endDate?: string;
  };
  adminContact?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export default function SchoolPublicLanding() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [school, setSchool] = useState<SchoolPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolSlug) return;
    setLoading(true);
    apiClient
      .get(`/public/tenant/slug/${encodeURIComponent(schoolSlug)}`)
      .then((res) => {
        setSchool(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load school portal:", err);
        setError("School portal not found or inactive.");
      })
      .finally(() => setLoading(false));
  }, [schoolSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040d1a] flex flex-col items-center justify-center text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-2 border-cyan-400 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <School className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-5 text-sm font-bold text-slate-400 tracking-wider uppercase">
          Connecting to School Portal...
        </p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-[#040d1a] flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full text-center p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
            <School size={30} />
          </div>
          <h2 className="text-2xl font-black text-white">School Not Found</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error || "The requested school domain could not be resolved."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/school-login"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              School Directory
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-xs transition"
            >
              Platform Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const campusLocation = [school.address, school.city, school.country || "Pakistan"]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* ── Top Header Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/10 bg-[#071526]/80 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-11 h-11 rounded-xl object-cover border border-white/10 bg-white/5"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">
                  {school.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 size={10} /> Verified Campus
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <MapPin size={11} className="text-cyan-400" />
                <span>{school.city || "Official Campus"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/${school.slug}/login`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <Lock size={13} />
              <span>Staff & Student Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-xs font-bold mb-6 backdrop-blur-md"
          >
            <Sparkles size={13} />
            <span>Official Institutional Web Portal</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]"
          >
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300">
              {school.name}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Excellence in education, character building, and digital campus
            governance. Empowering students, educators, and parents through our
            integrated cloud campus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to={`/${school.slug}/login`}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm shadow-xl shadow-cyan-500/25 hover:brightness-110 transition cursor-pointer"
            >
              <span>Access Campus Portal</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#about"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] font-bold text-sm transition"
            >
              <span>About Institution</span>
              <ChevronRight size={15} />
            </a>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <GraduationCap size={20} />
              </div>
              <p className="text-2xl font-black text-white">Holistic</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Academics & Sports
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Users size={20} />
              </div>
              <p className="text-2xl font-black text-white">Qualified</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Faculty & Mentors
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <Award size={20} />
              </div>
              <p className="text-2xl font-black text-white">Digital</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                LMS & Fee Automation
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <p className="text-2xl font-black text-white">Secure</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Real-Time Attendance
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Campus Info & Portals ── */}
      <section id="about" className="py-20 px-4 border-t border-white/10 bg-[#061222]/60">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Institution Overview
            </span>
            <h3 className="text-3xl font-black text-white mt-2 leading-tight">
              Modern Campus Infrastructure & Academic Excellence
            </h3>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              At {school.name}, we nurture intellectual curiosity and moral
              leadership. Our modern curriculum combines rigorous scientific inquiry
              with cultural grounding, supported by state-of-the-art classrooms and
              interactive student development programs.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Smart class tracking and digital attendance monitoring",
                "Direct parents communication and automated SMS notifications",
                "Instant electronic fee receipts with transparent vouchers",
                "Comprehensive examination reports and digital report cards",
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-sm font-semibold text-slate-300">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1e35] to-[#040e1b] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <h4 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <School size={18} className="text-cyan-400" />
              <span>Campus Contact Directory</span>
            </h4>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white">Campus Address</p>
                  <p className="text-slate-400 text-xs mt-0.5">{campusLocation}</p>
                </div>
              </div>

              {school.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={17} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Helpdesk / Administration</p>
                    <p className="text-slate-400 text-xs mt-0.5">{school.phone}</p>
                  </div>
                </div>
              )}

              {school.email && (
                <div className="flex items-start gap-3">
                  <Mail size={17} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Official Email</p>
                    <p className="text-slate-400 text-xs mt-0.5">{school.email}</p>
                  </div>
                </div>
              )}

              {school.website && (
                <div className="flex items-start gap-3">
                  <Globe size={17} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">School Website</p>
                    <a
                      href={
                        school.website.startsWith("http")
                          ? school.website
                          : `https://${school.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline text-xs mt-0.5 flex items-center gap-1"
                    >
                      {school.website} <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/${school.slug}/login`}
                className="w-full text-center py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition"
              >
                Sign In to Campus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10 px-4 bg-[#030913] text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {school.name}. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-cyan-400 hover:underline">
              Powered by EduSphere Pro ERP
            </Link>
            <Link to="/school-login" className="hover:text-slate-300">
              Browse Schools
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

