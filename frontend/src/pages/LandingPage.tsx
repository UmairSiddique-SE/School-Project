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
  BookOpen,
  FileCheck2,
  Calendar,
  Building2,
  Award,
  HelpCircle,
  Laptop,
  CheckSquare,
  ShieldAlert,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import SchoolSearchModal from "@/component/SchoolSearchModal";
import { useTheme } from "@/context/ThemeContext";

const go = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

function Navbar({ onSearch }: { onSearch: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#061324]/85 px-5 py-3.5 shadow-2xl backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <img src="/logo.svg" alt="EduSphere ERP" className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">EduSphere</span>
              <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 text-[9px] font-black uppercase text-cyan-300">
                ERP
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-[.18em] text-slate-400 uppercase">
              School Management System
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {[
            { name: "Product", href: "#product" },
            { name: "Features", href: "#features" },
            { name: "How It Works", href: "#how-it-works" },
            { name: "Roles", href: "#roles" },
            { name: "Pricing", href: "#pricing" },
            { name: "Security", href: "#security" },
            { name: "FAQ", href: "#faq" },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-cyan-300 transition"
            >
              {item.name}
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
            Register School
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
              {[
                { name: "Product", href: "#product" },
                { name: "Features", href: "#features" },
                { name: "How It Works", href: "#how-it-works" },
                { name: "Roles", href: "#roles" },
                { name: "Pricing", href: "#pricing" },
                { name: "Security", href: "#security" },
                { name: "FAQ", href: "#faq" },
              ].map((item) => (
                <a
                  key={item.name}
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/5"
                >
                  {item.name}
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
                  Register School
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-20 pt-36">
      {/* High-end ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -left-48 top-20 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <div className="mx-auto w-full max-w-7xl text-center relative z-10">
        <motion.div {...reveal} className="max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.18em] text-cyan-300 backdrop-blur-md">
            <Sparkles size={14} className="text-cyan-300 animate-pulse" />
            <span>Enterprise Multi-Campus Education SaaS</span>
          </div>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            One Platform.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300 bg-clip-text text-transparent">
              Complete Control Over Your School.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg font-medium mx-auto">
            EduSphere ERP streamlines academics, daily attendance, automated fee challans, examination grading, and role-based staff operations with verified public websites for every registered school.
          </p>

          <div className="mt-9 flex flex-wrap gap-4 items-center justify-center">
            <button
              type="button"
              onClick={() => go("pricing")}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 hover:brightness-110 transition cursor-pointer"
            >
              <span>Register Your School</span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/school-login")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-bold text-slate-200 hover:bg-white/[0.08] transition backdrop-blur-sm cursor-pointer"
            >
              <School size={17} className="text-cyan-400" />
              <span>Campus Portal Login</span>
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Showcase */}
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#0a1e36]/90 to-[#040e1b]/95 p-6 shadow-2xl backdrop-blur-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                  school-managment-pro.vercel.app/umair-model-school/dashboard
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                ACTIVE CAMPUS
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Campus Enrolled
                </span>
                <p className="text-2xl font-black text-white mt-1">Verified</p>
                <p className="text-[11px] text-cyan-300 font-bold mt-1">Students & Teachers</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Today Attendance
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-1">96.4%</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Digital logs recorded</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Fee Collection
                </span>
                <p className="text-2xl font-black text-white mt-1">PKR 24,000</p>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">Direct Bank & Cash</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Public Website
                </span>
                <p className="text-2xl font-black text-cyan-400 mt-1">Online</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">/school/slug active</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CoreFeatures() {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      desc: "Complete admissions lifecycle, roll numbers, guardian linkage, document archives and academic history.",
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      desc: "Faculty schedules, class teacher designations, payroll tracking, and subject responsibilities.",
    },
    {
      icon: CheckSquare,
      title: "Digital Attendance",
      desc: "One-click morning attendance with automated absentee lists and instant parent notifications.",
    },
    {
      icon: CreditCard,
      title: "Fees & Finance",
      desc: "Voucher generation, customized fee heads, receipt printing, bank challans, and defaulter tracking.",
    },
    {
      icon: Award,
      title: "Examinations & Grading",
      desc: "Exam schedules, digital marks entry, passing percentages, and printable student progress report cards.",
    },
    {
      icon: Layers,
      title: "Classes & Sections",
      desc: "Organized class hierarchy, numerical sections, capacity tracking, and student section distribution.",
    },
    {
      icon: BarChart3,
      title: "Actionable Reports",
      desc: "Comprehensive operational insights on finances, attendance trends, staff activity, and school growth.",
    },
    {
      icon: ShieldCheck,
      title: "School Administration",
      desc: "Full school settings, logo customization, address, phone, and public website control in one place.",
    },
  ];

  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Core Modules
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            Engineered for Modern School Operations
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Everything essential to run a high-performing campus without software clutter or fragile workarounds.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                {...reveal}
                className="p-6 rounded-3xl border border-white/10 bg-[#071526]/70 hover:border-cyan-400/40 hover:bg-[#071526] transition-all group shadow-xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  return (
    <section id="product" className="py-24 px-5 relative">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[36px] border border-cyan-400/20 bg-gradient-to-br from-[#071628] via-[#040e1b] to-[#0a1f38] p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-3.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-[10px] font-black uppercase tracking-widest">
                Interactive Multi-School Showcase
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
                Dedicated Public Webpages for Every School
              </h2>
              <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
                When an institution joins EduSphere ERP, an official public-facing website is provisioned instantly at{" "}
                <code className="text-cyan-300 bg-white/5 px-2 py-0.5 rounded-md font-mono text-xs">
                  /school/:slug
                </code>
                . School admins can customize contact numbers, addresses, logos, and mission statements.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  "Verified public landing with school address, phone & official email",
                  "Direct student and teacher sign-in gateways attached to that campus",
                  "Automatic WhatsApp sharing previews with high-res school logos",
                  "Full multi-tenant database isolation powered by Neon Serverless Cloud",
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
                  <span>View Live School Website</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-[#061222]/80 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-2">
                  <School size={14} className="text-cyan-400" />
                  school-managment-pro.vercel.app/school/umair-model-school
                </span>
                <span className="text-emerald-400 font-bold">Verified Institution</span>
              </div>

              <div className="mt-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-500/25 mb-4">
                  U
                </div>
                <h3 className="text-xl font-black text-white">Umair Model School</h3>
                <p className="text-xs text-slate-400 mt-1">Sargodha, Pakistan</p>
                <div className="mt-6 flex justify-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold">
                    Academics
                  </span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold">
                    Admissions
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold">
                    Online Portal
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

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Register Your School",
      desc: "Provide your institution name, desired web slug, campus city, and administrator details.",
    },
    {
      num: "02",
      title: "Submit Plan Application",
      desc: "Choose the Professional Campus license and submit verification receipt securely.",
    },
    {
      num: "03",
      title: "Super Admin Approval",
      desc: "Platform leadership activates your tenant credentials with 365-day guaranteed access.",
    },
    {
      num: "04",
      title: "Start Managing & Launch Website",
      desc: "Admit students, assign teachers, print fee vouchers, and share your live school webpage.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Lifecycle Workflow
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            How It Works
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            A frictionless journey from school registration to full digital campus deployment.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              {...reveal}
              className="p-6 rounded-3xl border border-white/10 bg-[#071526]/50 relative"
            >
              <span className="text-3xl font-black text-cyan-400/40">{s.num}</span>
              <h3 className="text-base font-black text-white mt-4">{s.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UserRoles() {
  const roles = [
    {
      title: "Super Admin",
      badge: "Platform Control Plane",
      desc: "Multi-tenant governance, subscription approvals, platform revenue tracking, and complete campus oversight.",
      features: [
        "Global campus lifecycle control",
        "Subscription renewal & extension",
        "School request approvals",
        "Platform-wide audit logs",
      ],
    },
    {
      title: "School Admin",
      badge: "Institutional Leadership",
      desc: "Direct daily authority over staff, admissions, fee structures, examinations, and custom public website profile.",
      features: [
        "Manage students & teachers",
        "Generate & print fee vouchers",
        "Exam marks & digital report cards",
        "Customize public school website",
      ],
    },
    {
      title: "Teacher",
      badge: "Academic Operations",
      desc: "Classroom management, student attendance marking, homework publishing, and examination grading.",
      features: [
        "Section attendance marking",
        "Homework assignment publishing",
        "Exam marks recording",
        "Timetable & timetable view",
      ],
    },
  ];

  return (
    <section id="roles" className="py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
            Role-Based Access
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            Designed for Every Stakeholder
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Clear permission boundaries keep institution data secure while empowering daily work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <motion.div
              key={i}
              {...reveal}
              className="p-8 rounded-3xl border border-white/10 bg-[#071526]/70 flex flex-col justify-between"
            >
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-black uppercase">
                  {r.badge}
                </span>
                <h3 className="text-xl font-black text-white mt-4">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  {r.desc}
                </p>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-2.5">
                  {r.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
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
            Single Unified Plan
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3">
            The Professional School Plan
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            One comprehensive enterprise tier for real institutions. No hidden limitations or multiple confusing upgrades.
          </p>
        </div>

        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-[36px] border-2 border-cyan-400/40 bg-gradient-to-b from-[#0a1e38] to-[#040e1b] p-8 sm:p-12 shadow-2xl backdrop-blur-2xl"
        >
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
                Full academic suite with automated finance and custom public website
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
                365 days platform access & updates
              </p>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[
              "Up to 500 Enrolled Students",
              "Unlimited Teachers & Staff Accounts",
              "Automated Fee Vouchers & Receipts",
              "Dedicated School Website (/school/:slug)",
              "Examination & Digital Report Cards",
              "Attendance Tracking & Absentee Logs",
              "Parent & Student LMS Portals",
              "High-Speed Neon Cloud PostgreSQL DB",
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
              <span>Register Your School</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/school-login"
              className="w-full sm:w-auto py-4 px-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold text-xs transition text-center"
            >
              School Portal Login
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
              Enterprise Resilience
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
              Enterprise Security & Cloud Reliability
            </h2>
            <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
              EduSphere ERP isolates institution data with strict tenant-scoped relational schemas. Your students, fee payments, and staff records remain confidential, encrypted in transit, and continuously backed up.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "Tenant-Isolated Multi-Tenancy",
                  desc: "Every database query verifies the authenticated school ID, preventing any cross-tenant data leakage.",
                },
                {
                  title: "Stateless JWT & Role Guards",
                  desc: "Cryptographically signed tokens and granular RBAC guards on all backend API endpoints.",
                },
                {
                  title: "Automated Soft-Delete Architecture",
                  desc: "Critical student and financial records are protected against accidental permanent deletion.",
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h4 className="font-black text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#071628] to-[#040e1b] shadow-2xl">
            <ShieldCheck size={48} className="text-cyan-400 mb-6" />
            <h3 className="text-2xl font-black text-white">99.98% Service Availability</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Hosted across Render backend services and Vercel edge networks, backed by Neon Cloud Serverless PostgreSQL in AWS US-East-2.
            </p>

            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black text-white">256-Bit</p>
                <p className="text-xs text-slate-400 mt-0.5">SSL / TLS Encryption</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">Continuous</p>
                <p className="text-xs text-slate-400 mt-0.5">Automated Cloud Backups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    [
      "How is our school's public website activated?",
      "As soon as your school registration is submitted, your dedicated URL (/school/:slug) is active and accessible to parents and students.",
    ],
    [
      "Can teachers and parents use this on their smartphones?",
      "Yes. EduSphere ERP is a responsive Progressive Web App (PWA). It can be installed directly onto iOS and Android home screens without an app store download.",
    ],
    [
      "How are school approval and fees verified?",
      "After submitting your registration and proof of payment, the Super Admin reviews the application and enables full access across the school dashboard.",
    ],
    [
      "Can school administrators change their school logo and contact details?",
      "Yes. School Admins can update their campus phone, address, website link, and logo directly from their dashboard settings.",
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

function CTASection() {
  return (
    <section className="py-20 px-5">
      <div className="max-w-5xl mx-auto rounded-[36px] border border-cyan-400/30 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Modernize Your School Operations?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-cyan-100 max-w-xl mx-auto">
            Join modern campuses operating on EduSphere ERP. Instant registration, dedicated school web page, and full academic control.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => go("pricing")}
              className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm shadow-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Register Your School
            </button>
            <Link
              to="/school-login"
              className="px-8 py-4 rounded-2xl border border-white/30 hover:bg-white/10 text-white font-bold text-sm transition"
            >
              School Login
            </Link>
          </div>
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
      <Hero />
      <CoreFeatures />
      <ProductShowcase />
      <HowItWorks />
      <UserRoles />
      <PricingSection />
      <SecuritySection />
      <FAQSection />
      <CTASection />

      {/* ── Professional Footer ── */}
      <footer className="border-t border-white/10 py-14 px-5 bg-[#030913]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-xs">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.svg" alt="EduSphere" className="h-6 w-6" />
              <span className="font-black text-white text-base">EduSphere ERP</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Enterprise multi-school SaaS platform for academics, finance, and campus administration.
            </p>
          </div>

          <div>
            <h4 className="font-black text-white uppercase text-[10px] tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-white transition">Core Features</a></li>
              <li><a href="#product" className="hover:text-white transition">Product Showcase</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing Plan</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white uppercase text-[10px] tracking-wider mb-3">
              Gateways
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/school-login" className="hover:text-white transition">School Login</Link></li>
              <li><Link to="/register-school" className="hover:text-white transition">Register Campus</Link></li>
              <li><Link to="/admin-login" className="hover:text-white transition">Super Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white uppercase text-[10px] tracking-wider mb-3">
              Security
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#security" className="hover:text-white transition">Data Isolation</a></li>
              <li><span className="text-emerald-400">256-Bit SSL Encrypted</span></li>
              <li><span>Neon PostgreSQL Cloud</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EduSphere ERP. All rights reserved.</p>
          <p>Verified Enterprise Multi-Campus SaaS Platform</p>
        </div>
      </footer>

      <SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
