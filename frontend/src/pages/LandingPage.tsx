import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  GraduationCap,
  Layers,
  Lock,
  Globe,
  Menu,
  Moon,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import SchoolSearchModal from "@/component/SchoolSearchModal";
import { useTheme } from "@/context/ThemeContext";

const go = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

function Navbar({ onSearch }: { onSearch: () => void }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#061322]/80 px-5 py-3.5 shadow-2xl backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <img src="/logo.svg" alt="EduSphere" className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">EduSphere</span>
              <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 text-[9px] font-black uppercase text-cyan-300">
                PRO ERP
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-[.18em] text-slate-400 uppercase">
              Multi-Campus SaaS
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {["Features", "Modules", "Dedicated Portal", "Pricing", "FAQ"].map((x) => (
            <a
              key={x}
              href={`#${x.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-cyan-300 transition"
            >
              {x}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
          >
            <Search size={14} className="text-cyan-400" />
            <span>Find School</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/school-login")}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition shadow-sm"
          >
            <School size={15} /> School Login
          </button>

          <button
            type="button"
            onClick={() => go("pricing")}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-cyan-500/25 transition"
          >
            Get Professional
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl border border-white/10 p-2.5 text-white lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2 rounded-2xl border border-white/10 bg-[#071526]/95 p-5 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              {["Features", "Modules", "Dedicated Portal", "Pricing", "FAQ"].map((x) => (
                <a
                  key={x}
                  onClick={() => setOpen(false)}
                  href={`#${x.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/5"
                >
                  {x}
                </a>
              ))}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSearch();
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-200 flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Find School
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/school-login");
                  }}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 py-3 text-sm font-bold text-cyan-200 flex items-center justify-center gap-2"
                >
                  <School size={16} /> School Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    go("pricing");
                  }}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-black text-white shadow-lg"
                >
                  Get Professional Plan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero({ onSearch }: { onSearch: () => void }) {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-20 pt-36">
      {/* High-end ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -left-48 top-20 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_.85fr] relative z-10">
        <motion.div {...reveal}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.18em] text-cyan-300 backdrop-blur-md">
            <Sparkles size={14} className="text-cyan-300 animate-pulse" />
            <span>Next-Gen Enterprise School ERP</span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Empower your campus with{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300 bg-clip-text text-transparent">
              complete digital intelligence.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg font-medium">
            A cohesive SaaS control plane designed for modern institutions. Every registered school receives its own verified, aesthetic public website, dedicated login links, fee voucher automation, and role-based portals.
          </p>

          <div className="mt-9 flex flex-wrap gap-4 items-center">
            <button
              type="button"
              onClick={() => go("pricing")}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 hover:brightness-110 transition cursor-pointer"
            >
              <span>Get Started with Professional</span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/school-login")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold text-slate-200 hover:bg-white/[0.08] transition backdrop-blur-sm cursor-pointer"
            >
              <School size={17} className="text-cyan-400" />
              <span>Campus Portal Login</span>
            </button>
          </div>

          {/* Social Proof Bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["U", "A", "H", "M"].map((letter, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#06111d] bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shadow-sm"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-xs">
                <p className="font-black text-white">50+ Campuses</p>
                <p className="text-[10px] text-slate-400">Streamlining daily workflows</p>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              <div className="text-xs">
                <p className="font-black text-white">100% Cloud-Native</p>
                <p className="text-[10px] text-slate-400">PWA Ready & Mobile Optimized</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Interactive Visual Showcase */}
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#0a1e36]/90 to-[#040e1b]/95 p-6 shadow-2xl backdrop-blur-2xl">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-bold text-slate-400">
                  school-managment-pro.vercel.app/umair-model-school
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                LIVE SAAS
              </span>
            </div>

            {/* Simulated Live School Hub */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
                    U
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Umair Model School</h4>
                    <p className="text-[11px] text-cyan-300 font-semibold">
                      Dedicated School Landing & Portal
                    </p>
                  </div>
                </div>
                <Link
                  to="/school/umair-model-school"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                >
                  <span>Preview Page</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-lg font-black text-white">Automated</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Fee Vouchers
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-lg font-black text-white">Real-Time</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Attendance
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-lg font-black text-white">Multi-Role</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Portals
                  </p>
                </div>
              </div>

              {/* Live Status Graph */}
              <div className="p-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03]">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
                  <span>Platform Operations Sync</span>
                  <span className="text-emerald-400 font-black">99.98% OK</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DedicatedSchoolFeature() {
  const navigate = useNavigate();

  return (
    <section id="dedicated-portal" className="py-24 px-5 relative">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[36px] border border-cyan-400/20 bg-gradient-to-br from-[#071628] via-[#040e1b] to-[#0a1f38] p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <span className="px-3.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-[10px] font-black uppercase tracking-widest">
                Automatic School Branding
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
                Every School Gets Its Own{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300">
                  Dedicated Website.
                </span>
              </h2>
              <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
                When a school registers, EduSphere automatically provisions an aesthetic, high-velocity institutional website at{" "}
                <code className="text-cyan-300 bg-white/5 px-2 py-0.5 rounded-md font-mono text-xs">
                  /school/:slug
                </code>
                . School admins can customize contact details, logo, phone, address, and link parents and students directly to their campus hub.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  "Dedicated URL for every campus to share on WhatsApp and admissions",
                  "Verified public landing with school address, contact info, and website",
                  "Direct student and teacher sign-in gateways attached to that campus",
                  "Full Super Admin governance and real-time subscription lifecycle",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-300">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  to="/school/umair-model-school"
                  className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2"
                >
                  <span>See Live School Example</span>
                  <ExternalLink size={14} />
                </Link>

                <button
                  onClick={() => go("pricing")}
                  className="px-6 py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 text-white font-bold text-xs transition"
                >
                  Create Your School Page
                </button>
              </div>
            </div>

            {/* School Web Card Mockup */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#061222]/80 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-2">
                  <Globe size={14} className="text-cyan-400" />
                  school-managment-pro.vercel.app/school/umair-model-school
                </span>
                <span className="text-emerald-400 font-bold">Active Website</span>
              </div>

              <div className="mt-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-500/25 mb-4">
                  U
                </div>
                <h3 className="text-xl font-black text-white">Umair Model School</h3>
                <p className="text-xs text-slate-400 mt-1">Sargodha, Pakistan</p>
                <div className="mt-6 flex justify-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold">
                    Admissions Open
                  </span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold">
                    Cloud LMS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  const modulesList = [
    {
      icon: GraduationCap,
      title: "Academics & Classes",
      desc: "Class sections, subjects, syllabus management, digital timetables, and teacher assignments.",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Students & Teachers",
      desc: "Enrollment records, guardian linkage, staff credentials, biometric & daily attendance.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: CreditCard,
      title: "Fee Billing & Finance",
      desc: "Custom fee structures, monthly voucher generation, receipts, bank challans, and defaulter tracking.",
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      icon: BarChart3,
      title: "Exams & Digital Reports",
      desc: "Exam schedules, grade books, automated percentage marks calculation, and printable result cards.",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      icon: Layers,
      title: "Campus Buildings",
      desc: "Track rooms, lecture halls, campus facilities, and campus resource distribution.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Role Portals",
      desc: "Specialized interfaces for Super Admins, School Principals, Teachers, Parents, and Students.",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <section id="modules" className="py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Enterprise Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            Everything your campus needs.
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Carefully crafted modules built to eliminate operational friction and keep parents, staff, and leadership aligned.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulesList.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={i}
                {...reveal}
                className="p-7 rounded-3xl border border-white/10 bg-[#071526]/70 hover:border-cyan-400/40 hover:bg-[#071526] transition-all group shadow-xl"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${m.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  {m.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed font-medium">
                  {m.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SingleProfessionalPricing() {
  const navigate = useNavigate();

  const handleRegister = () => {
    sessionStorage.setItem("edusphere_registration_plan", "PROFESSIONAL");
    navigate("/register-school/form?plan=PROFESSIONAL");
  };

  return (
    <section id="pricing" className="py-24 px-5 relative scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Clear, Transparent Investment
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            The Professional School Plan
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            One comprehensive tier designed for serious educational institutions. No hidden fees, no complicated tiers.
          </p>
        </div>

        {/* Single Aesthetic Professional Tier Card */}
        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-[36px] border-2 border-cyan-400/40 bg-gradient-to-b from-[#0a1e38] to-[#040e1b] p-8 sm:p-12 shadow-2xl backdrop-blur-2xl"
        >
          {/* Top highlight bar */}
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-3">
                <Crown size={12} /> Institutional Standard
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white">
                Professional Campus Suite
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Unlimited teachers, staff, classes, and dedicated school website
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="flex items-baseline md:justify-end gap-1">
                <span className="text-xs font-bold text-slate-400">PKR</span>
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  14,999
                </span>
                <span className="text-xs font-bold text-slate-400">/year</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                Full license with 365 days platform guarantee
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[
              "Up to 500 Active Enrolled Students",
              "Unlimited Teachers, Admins & Staff Accounts",
              "Automated Fee Vouchers & Print Ready Receipts",
              "Dedicated School Landing Page (/school/:slug)",
              "Class Timetables & Daily Attendance Tracking",
              "Examination Management & Digital Result Cards",
              "Parent & Student LMS Portals Included",
              "Direct School Admin Support & Cloud Backups",
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  {feat}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleRegister}
              className="w-full sm:flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register Your School Now</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/school-login"
              className="w-full sm:w-auto py-4 px-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold text-xs transition text-center"
            >
              Already Registered? Login
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    [
      "How quickly is our school landing page created?",
      "Instantly upon submission! As soon as you complete the registration form, your dedicated URL (/school/:slug) is active and accessible.",
    ],
    [
      "Can school staff and students use this on mobile phones?",
      "Yes! EduSphere is built as an installable Progressive Web App (PWA). It works seamlessly on iPhones, Android devices, tablets, and desktop computers.",
    ],
    [
      "How are payments and renewals handled?",
      "Schools submit payment confirmation through secure portal upload. The Super Admin reviews and issues instant activation receipts.",
    ],
    [
      "Can we customize our school's information and logo?",
      "Yes. School Admins can update their school name, logo, phone, address, and social links anytime from their settings console.",
    ],
  ];

  return (
    <section id="faq" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map(([q, a], i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-[#071526]/60 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <span className="font-bold text-sm text-white">{q}</span>
                <ChevronDown
                  size={16}
                  className={`text-cyan-400 transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#040d1a] font-sans text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <Navbar onSearch={() => setSearchOpen(true)} />
      <Hero onSearch={() => setSearchOpen(true)} />
      <DedicatedSchoolFeature />
      <ModulesSection />
      <SingleProfessionalPricing />
      <FAQ />

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-12 px-5 bg-[#030913]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
              <img src="/logo.svg" alt="EduSphere" className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-white text-sm">EduSphere Pro ERP</p>
              <p className="text-[10px] text-slate-500">Enterprise Multi-School SaaS</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold">
            <Link to="/school-login" className="hover:text-white transition">
              School Directory
            </Link>
            <Link to="/register-school" className="hover:text-white transition">
              Register Campus
            </Link>
            <Link to="/admin-login" className="hover:text-white transition">
              Super Admin
            </Link>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} EduSphere Pro Technologies. All rights reserved.
          </p>
        </div>
      </footer>

      <SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
