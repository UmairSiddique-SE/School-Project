import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  School,
  Search,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users,
  WalletCards,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Globe,
  Star,
  Zap,
  Menu,
  X,
  Building2,
  Lock,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import SchoolSearchModal from "@/component/SchoolSearchModal";

interface RegisteredSchool {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schools, setSchools] = useState<RegisteredSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  // Fetch real registered schools from backend
  useEffect(() => {
    apiClient
      .get<RegisteredSchool[]>("/public/schools")
      .then((res) => setSchools(res.data || []))
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      {/* ── Dynamic Ambient Mesh Gradients ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-gradient-to-br from-indigo-600/25 via-purple-600/20 to-pink-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] -right-40 w-[700px] h-[700px] bg-gradient-to-bl from-cyan-500/20 via-blue-600/20 to-violet-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-blue-700/15 via-teal-500/15 to-emerald-500/10 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── 1. Floating Glowing Glass Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-3xl border border-white/10 bg-[#070e1e]/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070e1e] rounded-[14px] flex items-center justify-center">
                <img src="/logo.svg" alt="EduSphere" className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  EduSphere
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300">
                  PRO ERP
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                School Operating System
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#registered-schools" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <School size={14} className="text-cyan-400" />
              <span>Registered Campuses</span>
            </a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-cyan-400 transition-colors">Operations</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </div>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <Search size={14} className="text-cyan-400" />
              <span>Find School</span>
            </button>

            <Link
              to="/school-login"
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition"
            >
              School Login
            </Link>

            <Link
              to="/register-school/plans"
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl font-black text-xs text-white transition cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 group-hover:scale-105 transition-transform" />
              <div className="relative flex items-center gap-1.5">
                <span>Register School</span>
                <ArrowRight size={13} />
              </div>
            </Link>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-white/10 text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-5 rounded-3xl border border-white/10 bg-[#070e1e]/95 backdrop-blur-2xl shadow-2xl lg:hidden flex flex-col gap-3"
            >
              <a onClick={() => setMobileMenuOpen(false)} href="#registered-schools" className="p-2 text-sm font-bold text-cyan-300">Registered Campuses</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="p-2 text-sm font-bold text-slate-300">Features</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="p-2 text-sm font-bold text-slate-300">Pricing</a>
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <Link
                  to="/school-login"
                  className="py-3 rounded-xl border border-white/10 bg-white/5 text-center text-xs font-bold text-white"
                >
                  School Login
                </Link>
                <Link
                  to="/register-school/plans"
                  className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-center text-xs font-black text-white"
                >
                  Register School
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── 2. Master Hero Section with Real Dynamic Aesthetics ── */}
      <section className="relative min-h-[95vh] pt-36 pb-20 px-4 sm:px-8 flex items-center z-10">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 text-cyan-300 text-xs font-bold mb-8 shadow-inner backdrop-blur-xl">
              <Sparkles size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Next-Gen Enterprise Cloud ERP for Schools</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
              Run Your School.{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">
                Not the Paperwork.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              One unified digital command center for student admissions, daily attendance, automated fee challans, exam grading, and teacher operations — with a custom public website for every registered school.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 items-center">
              <Link
                to="/register-school/plans"
                className="relative group overflow-hidden px-8 py-4 rounded-2xl font-black text-sm text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 group-hover:scale-105 transition-transform" />
                <div className="relative flex items-center gap-2">
                  <span>Register Your School</span>
                  <ArrowRight size={17} />
                </div>
              </Link>

              <Link
                to="/school-login"
                className="px-8 py-4 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl font-bold text-sm text-white transition flex items-center gap-2"
              >
                <School size={17} className="text-cyan-400" />
                <span>School Login Portal</span>
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-8 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cyan-400" />
                <span>Dedicated Public School Web</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Automated Fee Vouchers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-400" />
                <span>100% PWA Installable</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero: Layered Futuristic Glass UI Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            {/* Glowing Accent Ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-[38px] blur-xl opacity-40 animate-pulse pointer-events-none" />

            <div className="relative rounded-[36px] border border-white/15 bg-[#081226]/90 p-7 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">
                    edusphere / institutional-control-plane
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE SYNCED
                </span>
              </div>

              {/* Real Metrics Stream */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
                    <p className="text-2xl font-black text-white mt-1">100%</p>
                    <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">Cloud Database</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attendance</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">Real-Time</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Absentee Tracking</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fee Ledgers</p>
                    <p className="text-2xl font-black text-purple-400 mt-1">3-Copy</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Bank Challans</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-2 text-white">
                      <Globe size={14} className="text-cyan-400" />
                      Dynamic Public School Website System
                    </span>
                    <span className="text-cyan-300">Active</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every school gets its own verified live URL (<code className="text-cyan-300 font-mono">/school/:slug</code>) with customized logo, address, academics and admissions enquiry.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 3. REAL REGISTERED SCHOOLS SHOWCASE SECTION ── */}
      <section id="registered-schools" className="py-24 px-4 sm:px-8 relative z-10 border-t border-white/10 bg-[#050b18]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-3">
                <School size={12} />
                <span>Verified Educational Institutions</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Active Campuses Powered by EduSphere
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl">
                Every school listed here has an active, dedicated public website and authenticated cloud operations portal.
              </p>
            </div>

            <Link
              to="/school-login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition self-start md:self-auto"
            >
              <span>Explore All Campuses</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loadingSchools ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              Loading verified schools directory...
            </div>
          ) : schools.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-white/[0.02] text-center text-slate-400">
              No registered schools currently active. Be the first to register your campus!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <motion.div
                  key={school.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a152e] to-[#060e20] p-7 shadow-xl hover:border-cyan-400/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3.5">
                        {school.logoUrl ? (
                          <img
                            src={school.logoUrl}
                            alt={school.name}
                            className="w-13 h-13 rounded-2xl object-cover border border-white/10 bg-white/5"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
                            {school.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-black text-lg text-white group-hover:text-cyan-400 transition-colors">
                            {school.name}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-cyan-400" />
                            <span>{school.city || "Pakistan"}</span>
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        Verified
                      </span>
                    </div>

                    {/* School Full Information */}
                    <div className="space-y-2 text-xs text-slate-300 py-4 border-y border-white/10">
                      {school.address && (
                        <p className="text-slate-400 flex items-start gap-2">
                          <strong className="text-white shrink-0">Address:</strong>
                          <span className="truncate">{school.address}</span>
                        </p>
                      )}
                      {school.phone && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <strong className="text-white shrink-0">Contact:</strong>
                          <span>{school.phone}</span>
                        </p>
                      )}
                      {school.email && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <strong className="text-white shrink-0">Email:</strong>
                          <span className="truncate">{school.email}</span>
                        </p>
                      )}
                      <p className="text-slate-400 flex items-center gap-2">
                        <strong className="text-white shrink-0">Dedicated Web:</strong>
                        <span className="text-cyan-300 font-mono text-[11px]">/school/{school.slug}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-2 flex items-center gap-3">
                    <Link
                      to={`/school/${school.slug}`}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs text-center shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Visit School Website</span>
                      <ExternalLink size={13} />
                    </Link>

                    <Link
                      to={`/${school.slug}/login`}
                      className="py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 transition"
                      title="Staff & Student Login"
                    >
                      Login
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Core Features Showcase ── */}
      <section id="features" className="py-24 px-4 sm:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-400">
              Complete Operational Suite
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-3">
              Built for Every Everyday School Need
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Powerful, reliable modules that streamline your staff, students, and administration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Student Lifecycle",
                desc: "Admission registry, roll numbers, guardian linkages, and full academic history.",
                grad: "from-cyan-500 to-blue-600",
              },
              {
                icon: Users,
                title: "Teacher & Staff",
                desc: "Faculty allocation, section class teachers, credentials, and staff records.",
                grad: "from-blue-600 to-indigo-600",
              },
              {
                icon: Activity,
                title: "Digital Attendance",
                desc: "Morning section roll calls, instant percentage tallies, and absentee tracking.",
                grad: "from-indigo-600 to-purple-600",
              },
              {
                icon: WalletCards,
                title: "Fees & Challans",
                desc: "Automated monthly tuition vouchers, 3-copy printable bank slips, and defaulter logs.",
                grad: "from-purple-600 to-pink-600",
              },
              {
                icon: Award,
                title: "Examinations & DMC",
                desc: "Subject-wise marks entry, automated grading, and printable detailed marks cards.",
                grad: "from-pink-600 to-rose-600",
              },
              {
                icon: Layers,
                title: "Classes & Sections",
                desc: "Organized grades, section capacities, student distribution, and timetable sync.",
                grad: "from-teal-500 to-emerald-600",
              },
              {
                icon: Globe,
                title: "Public School Website",
                desc: "Every school automatically gets a verified web page with admissions enquiry.",
                grad: "from-emerald-500 to-cyan-500",
              },
              {
                icon: ShieldCheck,
                title: "Super Admin Control",
                desc: "Multi-tenant governance, subscription approvals, audit logs, and cloud security.",
                grad: "from-amber-500 to-orange-600",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1630] to-[#050b18] hover:border-cyan-400/40 transition-all group shadow-xl"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${f.grad} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Transparent Subscription Plan ── */}
      <section id="pricing" className="py-24 px-4 sm:px-8 relative z-10 border-t border-white/10 bg-[#050c1c]/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-400">
              Clear Investment
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-3">
              The Professional Campus Plan
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              One comprehensive plan that scales with your institution.
            </p>
          </div>

          <div className="relative rounded-[36px] border-2 border-cyan-400/40 bg-gradient-to-b from-[#0a1a36] to-[#040b17] p-8 sm:p-12 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  Full Campus Suite
                </span>
                <h3 className="text-3xl font-black text-white mt-3">
                  Professional School License
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Includes full ERP modules and your dedicated school public website
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-slate-400">PKR</span>
                  <span className="text-4xl sm:text-5xl font-black text-white">14,999</span>
                  <span className="text-xs font-bold text-slate-400">/year</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  365 days verified platform access
                </p>
              </div>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-200">
              {[
                "Up to 500 Active Enrolled Students",
                "Unlimited Teachers & Staff Accounts",
                "Dedicated School Website (/school/:slug)",
                "Automated 3-Copy Fee Challan Printing",
                "Section Attendance & Absentee Logs",
                "Exam Grading & Digital DMC Result Cards",
                "School Admin Website Customizer Settings",
                "Neon Cloud Serverless PostgreSQL Database",
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/register-school/plans"
                className="w-full sm:flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register Your School Now</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/school-login"
                className="w-full sm:w-auto py-4 px-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition text-center"
              >
                Already Registered? Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ Section ── */}
      <section id="faq" className="py-24 px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-400">Everything you need to know about EduSphere ERP.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How soon is our school website activated after registration?",
                a: "Instantly upon registration submission! Your unique link (/school/:slug) becomes reachable immediately so parents and students can see campus information.",
              },
              {
                q: "Can school administrators edit their website details and logo?",
                a: "Yes. In the School Admin Settings console, administrators can update their school name, phone, email, address, external website, and monogram logo at any time.",
              },
              {
                q: "Is EduSphere installable as a mobile application?",
                a: "Yes. EduSphere is engineered as a Progressive Web App (PWA). Teachers and parents can add it directly to their Android and iPhone home screens with one click.",
              },
              {
                q: "How do teachers mark daily section attendance?",
                a: "Teachers access the Attendance module, select their class section, and mark attendance with one click. The system compiles real-time percentage reports.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-white/10 bg-[#081226]/80">
                <h4 className="font-bold text-base text-white">{faq.q}</h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Final Footer ── */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-8 bg-[#020610] text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="EduSphere" className="w-6 h-6" />
            <span className="font-black text-white text-base">EduSphere Pro ERP</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-semibold">
            <a href="#registered-schools" className="hover:text-white transition">Schools Directory</a>
            <Link to="/register-school/plans" className="hover:text-white transition">Register Campus</Link>
            <Link to="/school-login" className="hover:text-white transition">School Login</Link>
            <Link to="/admin-login" className="hover:text-white transition">Super Admin</Link>
          </div>

          <p>© {new Date().getFullYear()} EduSphere ERP. All rights reserved.</p>
        </div>
      </footer>

      {/* Search Modal */}
      <SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
