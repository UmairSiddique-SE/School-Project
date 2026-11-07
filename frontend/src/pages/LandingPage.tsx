import React, { useEffect, useState, useMemo } from "react";
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
  BarChart3,
  CheckSquare,
  Clock,
  ChevronRight,
  HelpCircle,
  FileSpreadsheet,
  Compass,
  ArrowUpRight,
  Smartphone,
  Eye,
  CreditCard,
  UserCheck,
  Laptop,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import SchoolSearchModal from "@/component/SchoolSearchModal";

interface RegisteredSchool {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  isActive: boolean;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
}

interface PublicPlan {
  id: string;
  planKey: string;
  name: string;
  price: number;
  period: string;
  maxStudents: number;
  maxTeachers: number;
  storageMb: number;
  supportTier: string;
  features: string[];
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "attendance" | "fees" | "exams" | "reports">("students");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [schools, setSchools] = useState<RegisteredSchool[]>([]);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch real registered schools and plans from backend
  useEffect(() => {
    apiClient
      .get<RegisteredSchool[]>("/public/schools")
      .then((res) => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));

    apiClient
      .get<PublicPlan[]>("/public/plans")
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handlePlanSelect = (planKey: string) => {
    sessionStorage.setItem("edusphere_registration_plan", planKey);
    navigate(`/register-school/form?plan=${encodeURIComponent(planKey)}`);
  };

  const monthlyPlan = plans.find((plan) => plan.planKey === "PROFESSIONAL" && plan.price === 3000);

  const faqs = [
    { q: "What is SchoolOS?", a: "SchoolOS is a school management platform designed to bring essential administrative and academic workflows into one organised system." },
    { q: "How does school registration work?", a: "Submit your school's details and administrator information. The application is reviewed by the Super Admin. Access is provided after approval." },
    { q: "How much does SchoolOS cost?", a: "The public SchoolOS subscription is PKR 3,000 per month. The plan details and applicable limits are shown during registration." },
    { q: "Can any school start using the platform immediately?", a: "No. Each school must submit an application and wait for Super Admin approval before its school account is activated." },
    { q: "How do I access my school after approval?", a: "After approval, use the school login page and the credentials created during registration to access your school workspace." },
  ];

  return (
    <div className="min-h-screen bg-white text-[#14213D] font-sans selection:bg-[#3563EB] selection:text-white overflow-x-hidden">
      {/* ── Subtle Background Mesh Layer ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#EEF4FF] via-[#F5F8FF] to-transparent rounded-full blur-3xl opacity-75" />
        <div className="absolute top-[35%] -right-48 w-[600px] h-[600px] bg-gradient-to-bl from-[#E0E7FF]/60 via-[#F5F3FF]/40 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[65%] -left-48 w-[600px] h-[600px] bg-gradient-to-tr from-[#E0F2FE]/60 via-[#EEF2FF]/40 to-transparent rounded-full blur-3xl opacity-60" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f030_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f030_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── 1. Sticky Commercial Light Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3563EB] via-[#4F46E5] to-[#8257E8] p-[1.5px] shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <img src="/logo.svg" alt="SchoolOS ERP" className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-[#14213D]">
                  SchoolOS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#3563EB] border border-blue-200/80">
                  ERP SaaS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#66738A]">
                School Management System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#475569]">
            <a href="#platform" className="hover:text-[#3563EB] transition-colors">
              Platform
            </a>
            <a href="#features" className="hover:text-[#3563EB] transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-[#3563EB] transition-colors">
              Product Tour
            </a>
            <a href="#campuses" className="hover:text-[#3563EB] transition-colors">
              Campuses
            </a>
            <a href="#pricing" className="hover:text-[#3563EB] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#3563EB] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#66738A] hover:text-[#14213D] hover:bg-slate-100/80 border border-slate-200 transition"
              title="Find Registered School"
            >
              <Search size={14} className="text-[#3563EB]" />
              <span>Find School</span>
            </button>
            <Link
              to="/school-login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#14213D] hover:text-[#3563EB] hover:bg-blue-50/80 transition"
            >
              School Login
            </Link>
            <Link
              to="/register-school/plans"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3563EB] via-[#4F46E5] to-[#8257E8] text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-105 transition-all duration-150 active:scale-95"
            >
              <span>Register Your School</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-slate-200 bg-white px-6 py-5 space-y-4 shadow-xl"
            >
              <div className="flex flex-col gap-3 font-semibold text-sm text-slate-700">
                <a
                  href="#platform"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  Platform
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  Features
                </a>
                <a
                  href="#preview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  Product Tour
                </a>
                <a
                  href="#campuses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  Campuses
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-[#3563EB]"
                >
                  FAQ
                </a>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                <Link
                  to="/school-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                >
                  School Portal Login
                </Link>
                <Link
                  to="/register-school/plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-[#3563EB] to-[#8257E8] text-white text-sm font-bold shadow-md shadow-blue-500/20"
                >
                  Register Your School
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 2. HERO SECTION — Two-Column Commercial Light SaaS ── */}
      <section className="relative z-10 pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* LEFT COLUMN: Strategic Selling Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF4FF] border border-[#BFDBFE] text-[#3563EB] text-xs font-bold tracking-wide">
                <Sparkles size={14} className="text-[#3563EB]" />
                <span>School Management for Growing Schools</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#14213D] tracking-tight leading-[1.12]">
                Bring Your School Operations{" "}
                <span className="bg-gradient-to-r from-[#3563EB] via-[#4F46E5] to-[#8257E8] bg-clip-text text-transparent">
                  Together in One Place.
                </span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-lg sm:text-xl text-[#66738A] leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Manage your school’s essential records, attendance, fees and academic workflows from one organised platform.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/register-school/plans"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#3563EB] via-[#4F46E5] to-[#8257E8] text-white text-base font-bold shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Register Your School</span>
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#preview"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-200 text-[#14213D] text-base font-bold hover:bg-[#F5F8FF] hover:border-blue-200 transition-all duration-200 shadow-sm"
                >
                  <span>Explore Platform</span>
                  <ChevronDown size={18} className="text-[#66738A]" />
                </a>
              </div>

              {/* Trust Micro-Badge */}
              <div className="pt-3 flex items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-[#66738A]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Guided Onboarding
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Role-Based Security
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  School Approval Required
                </span>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Realistic Light-Mode School ERP Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="lg:col-span-6 relative"
            >
              {/* Decorative back-layer glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#3563EB]/15 via-[#8257E8]/15 to-[#43C7DF]/15 rounded-[—px] blur-2xl" />

              {/* Main Dashboard Window Mockup */}
              <div className="relative rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-blue-900/10 overflow-hidden">
                {/* Window Title Bar */}
                <div className="bg-[#F8FAFC] border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[11px] font-bold text-slate-500 font-mono">
                      SchoolOS • Dashboard Preview
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Illustrative UI Preview
                  </div>
                </div>

                {/* Dashboard Inner App Canvas */}
                <div className="p-5 space-y-4 bg-gradient-to-b from-white to-[#F8FAFC]">
                  {/* Top Header inside preview */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3563EB] to-[#8257E8] text-white flex items-center justify-center font-black text-sm">
                        U
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#14213D] leading-tight">
                          Your School Name
                        </h4>
                        <p className="text-[10px] text-[#66738A]">School Admin Workspace • Your Campus</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#3563EB] bg-[#EEF4FF] px-2.5 py-1 rounded-lg">
                      Academic Session
                    </span>
                  </div>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                      <p className="text-[10px] font-bold text-[#3563EB] uppercase">Students</p>
                      <p className="text-lg font-black text-[#14213D] mt-0.5">—</p>
                      <p className="text-[9px] text-emerald-600 font-bold">● No attendance records yet</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                      <p className="text-[10px] font-bold text-[#8257E8] uppercase">Faculty</p>
                      <p className="text-lg font-black text-[#14213D] mt-0.5">32</p>
                      <p className="text-[9px] text-slate-500">Add departments after setup</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">Fee Inflow</p>
                      <p className="text-lg font-black text-[#14213D] mt-0.5">—</p>
                      <p className="text-[9px] text-emerald-600 font-bold">↑ No payments recorded</p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                      <p className="text-[10px] font-bold text-sky-700 uppercase">Exams</p>
                      <p className="text-lg font-black text-[#14213D] mt-0.5">—</p>
                      <p className="text-[9px] text-sky-600 font-bold">Exam data appears after setup</p>
                    </div>
                  </div>

                  {/* Activity Table inside preview */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#14213D] flex items-center gap-1.5">
                        <Activity size={13} className="text-[#3563EB]" />
                        Recent Admissions & Financial Vouchers
                      </span>
                      <span className="text-[9px] font-bold text-[#3563EB] hover:underline cursor-pointer">
                        No records yet
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {[

                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-lg bg-slate-50/80 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-[#3563EB] font-bold flex items-center justify-center text-[9px]">
                              {item.name[0]}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{item.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{item.class}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 text-[10px]">{item.fee}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badge}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Layered UI Card 1 — Top Right Fee Alert */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="hidden sm:flex absolute -top-5 -right-5 items-center gap-3 p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xl shadow-emerald-500/10 backdrop-blur-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Reconciliation</p>
                  <p className="text-xs font-black text-slate-900">No payments recorded yet</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Payment activity will appear here</p>
                </div>
              </motion.div>

              {/* Floating Layered UI Card 2 — Bottom Left Attendance Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-3 p-3.5 rounded-2xl bg-white border border-blue-200 shadow-xl shadow-blue-500/10 backdrop-blur-md"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3563EB] flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Morning Roll Call</p>
                  <p className="text-xs font-black text-slate-900">100% Attendance Verified</p>
                  <p className="text-[10px] text-blue-600 font-bold">Class 10-A • Register Printed</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST / INSTITUTIONAL VALUE STRIP ── */}
      <section className="relative z-10 py-10 bg-[#F5F8FF] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-[#3563EB]">
                <Layers size={18} />
                <h4 className="text-sm font-black text-[#14213D] uppercase tracking-wide">
                  Centralized Operations
                </h4>
              </div>
              <p className="text-xs text-[#66738A]">Admissions, staff, and classes in one place</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-[#8257E8]">
                <ShieldCheck size={18} />
                <h4 className="text-sm font-black text-[#14213D] uppercase tracking-wide">
                  Multi-Tenant Security
                </h4>
              </div>
              <p className="text-xs text-[#66738A]">Isolated institutional database & role policies</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-[#3563EB]">
                <Award size={18} />
                <h4 className="text-sm font-black text-[#14213D] uppercase tracking-wide">
                  Standard DMCs & Challans
                </h4>
              </div>
              <p className="text-xs text-[#66738A]">Official 3-copy bank slips & marks transcripts</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <Globe size={18} />
                <h4 className="text-sm font-black text-[#14213D] uppercase tracking-wide">
                  Public School Portals
                </h4>
              </div>
              <p className="text-xs text-[#66738A]">Automatic branded website for every campus</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT MODULES OVERVIEW — "Everything Your School Needs" ── */}
      <section id="features" className="relative z-10 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#3563EB] border border-blue-200">
              Complete Feature Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Everything Your School Needs. In One Powerful Platform.
            </h2>
            <p className="text-base text-[#66738A]">
              Carefully engineered modules designed to eliminate manual registers, streamline treasury operations, and empower school leaders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: Student Management */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#3563EB] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">Student Lifecycle & Enrollment</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Automated admission numbers, digital profiles, parent contacts, section allocation, and printable biometric ID cards in portrait & landscape.
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Printable Student ID Cards
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Class & Section Reassignments
                </li>
              </ul>
            </div>

            {/* Module 2: Fees & Treasury */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-[#8257E8] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <WalletCards size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">Fee Management & Challans</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Configurable recurring fee structures, scholarship concessions, late surcharges, 3-copy bank challans, and instant fee defaulter audit reports.
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Standard 3-Part Bank Challan
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Printable Defaulters Audit List
                </li>
              </ul>
            </div>

            {/* Module 3: Daily Attendance */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#3563EB] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">Attendance & Roll Call</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Rapid section-wise daily roll call, instant all-present triggers, leave approval tracking, CSV exports, and daily printable class attendance registers.
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Printable Daily Class Register
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> One-Click All-Present / Absent
                </li>
              </ul>
            </div>

            {/* Module 4: Examinations & DMCs */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#3563EB] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">Examinations & Marksheets</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Term exams, subject marks entry, passing thresholds, grading scale matrix, class gazettes, and official Detailed Marks Certificates (DMCs).
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Pakistani & British Standard DMC
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Class Result Gazette Generator
                </li>
              </ul>
            </div>

            {/* Module 5: Teacher & Staff Management */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-[#8257E8] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">Faculty & Staff Allotment</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Teacher profiles, subject assignments, timetable schedules, classroom incharge designations, and departmental coordination.
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Teacher Timetable Scheduling
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Classroom Incharge Mapping
                </li>
              </ul>
            </div>

            {/* Module 6: Dynamic School Websites */}
            <div className="p-7 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#3563EB] flex items-center justify-center shadow-sm mb-5 group-hover:scale-105 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-black text-[#14213D] mb-2">School Public Website</h3>
              <p className="text-sm text-[#66738A] leading-relaxed mb-4">
                Your school automatically gets an official public web presence (/school/:slug) with customizable logos, programs, facilities, and admissions inquiry.
              </p>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Live Public Admissions Form
                </li>
                <li className="flex items-center gap-2 text-emerald-600">
                  <Check size={14} /> Custom Campus Branding
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. INTERACTIVE PRODUCT SHOWCASE (Light-Mode Tabbed Preview) ── */}
      <section id="preview" className="relative z-10 py-20 bg-[#F5F8FF] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100/80 text-[#3563EB] border border-blue-200">
              Interactive Product Showcase
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Designed For Principals. Built For Daily Precision.
            </h2>
            <p className="text-base text-[#66738A]">
              Click through the modules below to see actual light-mode interfaces used by administrators every day.
            </p>
          </div>

          {/* Module Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: "students", label: "Student Roster", icon: GraduationCap },
              { id: "attendance", label: "Attendance Sheet", icon: Calendar },
              { id: "fees", label: "Fee Collection", icon: WalletCards },
              { id: "exams", label: "DMC Exam Marks", icon: Award },
              { id: "reports", label: "Executive Reports", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isSelected
                      ? "bg-[#3563EB] text-white shadow-lg shadow-blue-600/25 scale-[1.02]"
                      : "bg-white text-[#475569] hover:bg-white/80 border border-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Display */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 p-6 sm:p-8">
            {activeTab === "students" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#14213D]">Student Enrollment & Directory</h3>
                    <p className="text-xs text-[#66738A]">Student records appear here after a school is registered</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#3563EB] text-xs font-bold border border-blue-200">
                      ID Cards Generated
                    </span>
                    <Link
                      to="/register-school/plans"
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#3563EB] to-[#8257E8] text-white text-xs font-bold"
                    >
                      + Enroll Candidate
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Adm #</th>
                        <th className="py-3 px-4">Class & Section</th>
                        <th className="py-3 px-4">Father / Guardian</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr><td colSpan={6} className="py-10 text-center text-slate-500">No student records yet. Real student data will appear after school registration and admission.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#14213D]">Daily Class Roll Call & Register</h3>
                    <p className="text-xs text-[#66738A]">Class 10 - Section A • Today's Attendance</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Attendance Rate: 96%
                    </span>
                    <button className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#3563EB] text-xs font-bold border border-blue-200 flex items-center gap-1.5">
                      <span>Print Daily Register</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Enrolled</p>
                    <p className="text-xl font-black text-slate-900 mt-1">36</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Present</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">34</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                    <p className="text-[10px] font-bold text-rose-700 uppercase">Absent</p>
                    <p className="text-xl font-black text-rose-700 mt-1">2</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">On Leave</p>
                    <p className="text-xl font-black text-amber-700 mt-1">0</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#14213D]">Fee Ledger & 3-Part Bank Challan</h3>
                    <p className="text-xs text-[#66738A]">Tuition collection, bank vouchers, and defaulters ledger</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-[#8257E8] text-xs font-bold border border-purple-200">
                    3-Copy Bank Challan Ready
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-purple-50/60 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3563EB]">
                      Standard 3-Part Slip
                    </span>
                    <h4 className="text-base font-black text-[#14213D]">
                      Habib Bank Limited / Meezan Bank Collection Voucher
                    </h4>
                    <p className="text-xs text-slate-500">
                      Bank Copy • School Accounts Copy • Student Copy with automated QR/barcode
                    </p>
                  </div>
                  <Link
                    to="/register-school/plans"
                    className="px-5 py-2.5 rounded-xl bg-[#3563EB] text-white font-bold text-xs shadow-md shadow-blue-500/20 shrink-0"
                  >
                    View Challan Preview
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "exams" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#14213D]">Examination & Detailed Marks Certificate (DMC)</h3>
                    <p className="text-xs text-[#66738A]">Mid-Term & Annual Examination Transcripts</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    Grading Matrix A+ to F
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#3563EB] uppercase">Official DMC Transcript</span>
                    <h4 className="text-base font-black text-slate-900">
                      Detailed Marks Certificate for Matriculation / Middle
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Includes student identity block, subject-wise marks, passing criteria, percentage, letter grades, watermark, and triple signatures (Class Teacher, Controller of Examinations, Principal).
                    </p>
                  </div>
                  <div className="shrink-0 text-center p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sample Grade</p>
                    <p className="text-2xl font-black text-emerald-600">A+</p>
                    <p className="text-[10px] font-bold text-slate-600">89.4% (PASS)</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#14213D]">Executive School Dossier & Analytics</h3>
                    <p className="text-xs text-[#66738A]">Cross-branch performance, revenue forecasts, and teacher workload</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#3563EB] text-xs font-bold border border-blue-200">
                    PDF & CSV Export
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">Total Enrolled</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">—</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Actual admission records</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">Collected Revenue</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">—</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">No payments recorded yet</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">Active Faculty</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">—</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-1">Faculty records appear after setup</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. BENEFIT-FOCUSED STORYTELLING SECTIONS ── */}
      <section id="platform" className="relative z-10 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Story 1 */}
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#3563EB] border border-blue-200">
                Administrative Relief
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight leading-tight">
                Less Administrative Work. More Focus on Education.
              </h2>
              <p className="text-base text-[#66738A] leading-relaxed">
                School staff waste hundreds of hours manually compiling fee receipts, marking paper registers, and re-typing marks. SchoolOS automates the entire paperwork pipeline so your faculty can focus on teaching excellence.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#14213D]">Instant Batch Fee Generation</h4>
                    <p className="text-xs text-[#66738A]">Generate monthly tuition challans for 500+ students in 10 seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#14213D]">Zero Lost Records</h4>
                    <p className="text-xs text-[#66738A]">All student history, sibling discounts, and exam scores stay safely backed up.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 p-8 rounded-3xl bg-[#F5F8FF] border border-slate-200 shadow-lg shadow-blue-500/5">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Monthly Administrative Hours</p>
                    <p className="text-2xl font-black text-rose-500 line-through">120 Hours Manual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600 uppercase">With SchoolOS ERP</p>
                    <p className="text-2xl font-black text-emerald-600">8 Hours</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Automation Efficiency</span>
                    <span className="text-[#3563EB]">93% Saved</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#3563EB] to-[#8257E8] w-[93%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story 2 */}
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 p-8 rounded-3xl bg-[#F5F8FF] border border-slate-200 shadow-lg shadow-blue-500/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <School size={28} className="mx-auto text-[#3563EB] mb-2" />
                  <p className="text-sm font-black text-slate-900">School Admin</p>
                  <p className="text-xs text-slate-500">Executive command & fiscal controls</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <Users size={28} className="mx-auto text-[#8257E8] mb-2" />
                  <p className="text-sm font-black text-slate-900">Teachers Portal</p>
                  <p className="text-xs text-slate-500">Roll call, homework & marks entry</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <Smartphone size={28} className="mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm font-black text-slate-900">Parent Portal</p>
                  <p className="text-xs text-slate-500">Fee tracking & digital receipts</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                  <Laptop size={28} className="mx-auto text-cyan-600 mb-2" />
                  <p className="text-sm font-black text-slate-900">Student Portal</p>
                  <p className="text-xs text-slate-500">Class notes & exam scorecards</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-[#8257E8] border border-purple-200">
                Connected Community
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight leading-tight">
                Keep Your Entire School Community Connected.
              </h2>
              <p className="text-base text-[#66738A] leading-relaxed">
                No more disjointed WhatsApp groups or paper circulars lost in student bags. SchoolOS provides distinct portals for principals, teachers, parents, and students with strict role permissions.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#14213D]">Parent Trust & Transparency</h4>
                    <p className="text-xs text-[#66738A]">Parents can independently verify attendance and download paid fee receipts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. REGISTERED CAMPUSES DIRECTORY (Live DB) ── */}
      <section id="campuses" className="relative z-10 py-20 bg-[#F5F8FF] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100/80 text-[#3563EB] border border-blue-200">
                Live Network
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight mt-3">
                Registered Institutions & Public Portals
              </h2>
              <p className="text-sm text-[#66738A] mt-1 max-w-xl">
                Explore real campuses powered by SchoolOS ERP. Every school gets its own responsive public portal and dedicated staff login gateway.
              </p>
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-[#14213D] text-xs font-bold shadow-sm hover:border-blue-300 transition"
            >
              <Search size={14} className="text-[#3563EB]" />
              <span>Search Campuses by City</span>
            </button>
          </div>

          {loadingSchools ? (
            <div className="py-16 text-center text-sm font-semibold text-slate-400 animate-pulse">
              Loading active institutions from database...
            </div>
          ) : schools.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-3xl bg-white p-8">
              <School size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No public campuses registered yet.</p>
              <Link
                to="/register-school/plans"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#3563EB] hover:underline"
              >
                Register your school first <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {s.logoUrl ? (
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3563EB] to-[#8257E8] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                            {s.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-base text-[#14213D] leading-tight">
                            {s.name}
                          </h4>
                          {s.city && (
                            <p className="text-xs text-[#66738A] flex items-center gap-1 mt-1 font-medium">
                              <MapPin size={12} className="text-[#3563EB]" />
                              {s.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Public URL</p>
                        <p className="font-mono text-slate-700 font-bold text-[11px] truncate mt-0.5">
                          /school/{s.slug}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                        <p className="text-emerald-600 font-bold text-[11px] mt-0.5">
                          Verified Campus
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                    <Link
                      to={`/school/${s.slug}`}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition"
                    >
                      <Globe size={13} className="text-[#3563EB]" />
                      <span>Visit School Website</span>
                    </Link>
                    <Link
                      to={`/school-login/${s.slug}`}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3563EB] to-[#8257E8] text-white text-xs font-bold hover:brightness-105 transition flex items-center gap-1"
                    >
                      <span>Login</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 8. HOW TO GET STARTED (4 Practical Steps) ── */}
      <section className="relative z-10 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#3563EB] border border-blue-200">
              Simple Onboarding
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              How to Register & Launch Your School
            </h2>
            <p className="text-base text-[#66738A]">
              Get your institution fully digitized in four transparent steps using our guided onboarding workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Choose a Suitable Plan",
                desc: "Select Review the single monthly subscription and continue with your school application.",
              },
              {
                step: "02",
                title: "Submit Registration",
                desc: "Provide your school name, campus address, city, contact info, and create your master administrator credentials.",
              },
              {
                step: "03",
                title: "Institutional Verification",
                desc: "The Super Admin reviews your application before access is approved.",
              },
              {
                step: "04",
                title: "Launch & Manage",
                desc: "After approval, sign in to your school workspace and begin setup.",
              },
            ].map((st, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#F5F8FF] border border-slate-200/80 relative space-y-3 hover:border-blue-300 transition-all"
              >
                <span className="text-3xl font-black bg-gradient-to-r from-[#3563EB] to-[#8257E8] bg-clip-text text-transparent">
                  {st.step}
                </span>
                <h4 className="text-base font-black text-[#14213D]">{st.title}</h4>
                <p className="text-xs text-[#66738A] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/register-school/plans"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#3563EB] via-[#4F46E5] to-[#8257E8] text-white text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all"
            >
              <span>Begin School Registration</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. SINGLE SCHOOLOS SUBSCRIPTION ── */}
      <section id="pricing" className="relative z-10 border-y border-slate-200/80 bg-[#F5F8FF] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl space-y-3 text-center">
            <span className="rounded-full border border-blue-200 bg-blue-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#3563EB]">One simple subscription</span>
            <h2 className="text-3xl font-black tracking-tight text-[#14213D] sm:text-4xl">Everything starts with one plan.</h2>
            <p className="text-base text-[#66738A]">Straightforward monthly pricing for schools. No confusing tiers.</p>
          </div>
          <div className="mx-auto max-w-xl">
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#3563EB] bg-white p-7 shadow-2xl shadow-blue-500/10 sm:p-10">
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#3563EB] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">SchoolOS Plan</div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3563EB]"><School size={24} /></div>
              <h3 className="mt-6 text-2xl font-black text-[#14213D]">SchoolOS Monthly</h3>
              <p className="mt-2 text-sm leading-6 text-[#66738A]">One subscription for your school's day-to-day management.</p>
              <div className="mt-7 flex items-end gap-2 border-b border-slate-100 pb-7">
                <span className="text-4xl font-black tracking-tight text-[#14213D] sm:text-5xl">PKR 3,000</span>
                <span className="pb-1 text-sm font-semibold text-slate-500">/ month</span>
              </div>
              {loadingPlans ? (
                <p className="py-6 text-sm font-semibold text-slate-400">Loading plan details…</p>
              ) : monthlyPlan ? (
                <>
                  <div className="mt-6 space-y-3 text-sm text-slate-700">
                    <p className="font-bold text-[#14213D]">Included in this plan</p>
                    {monthlyPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-emerald-600" /><span>{feature}</span></div>
                    ))}
                  </div>
                  <button onClick={() => handlePlanSelect(monthlyPlan.planKey)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3563EB] to-[#6653D9] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl">
                    Apply for School Access <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Registration is temporarily unavailable. Please try again later or contact the platform administrator.</div>
              )}
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">School access is enabled after Super Admin review and approval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ACCORDION SECTION ── */}
      <section id="faq" className="relative z-10 py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#3563EB] border border-blue-200">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213D] tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-base text-[#66738A]">
              Direct answers to common questions asked by school owners, principals, and IT directors.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-[#F5F8FF] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#14213D] hover:text-[#3563EB] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[#66738A] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#3563EB]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-xs sm:text-sm text-[#66738A] leading-relaxed border-t border-slate-200/60 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 11. FINAL CONVERSION CALL-TO-ACTION (Light Gradient) ── */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-[#F5F8FF] to-[#EEF4FF] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-blue-500/10 border border-blue-100 flex items-center justify-center mx-auto text-[#3563EB]">
            <School size={32} />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#14213D] tracking-tight">
            Ready to Manage Your School Smarter?
          </h2>

          <p className="text-base sm:text-lg text-[#66738A] max-w-2xl mx-auto">
            Bring your school's essential operations together with SchoolOS. Submit your application and get access after Super Admin approval.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register-school/plans"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#3563EB] via-[#4F46E5] to-[#8257E8] text-white text-base font-bold shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 transition-all"
            >
              <span>Register Your School</span>
              <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white border border-slate-200 text-[#14213D] text-base font-bold hover:bg-slate-50 transition shadow-sm"
            >
              <Search size={16} className="text-[#3563EB]" />
              <span>Find Registered School</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 12. COMMERCIAL FOOTER ── */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-200/80">
            {/* Col 1: Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3563EB] to-[#8257E8] p-[1px] flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                    <img src="/logo.svg" alt="SchoolOS" className="w-6 h-6" />
                  </div>
                </div>
                <span className="font-black text-lg text-[#14213D]">SchoolOS ERP</span>
              </div>
              <p className="text-xs text-[#66738A] leading-relaxed max-w-sm">
                Next-generation multi-tenant school operating system engineered for educational leaders, teachers, students, and parents.
              </p>
              <p className="text-[11px] text-slate-400">
                Official SaaS Architecture • Built for Modern Schools & Colleges
              </p>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Platform</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-[#3563EB] transition">Student Records</a></li>
                <li><a href="#features" className="hover:text-[#3563EB] transition">Fee Management</a></li>
                <li><a href="#features" className="hover:text-[#3563EB] transition">Daily Attendance</a></li>
                <li><a href="#features" className="hover:text-[#3563EB] transition">Exam DMCs</a></li>
              </ul>
            </div>

            {/* Col 3: Portals */}
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Portals & Access</p>
              <ul className="space-y-2">
                <li><Link to="/school-login" className="hover:text-[#3563EB] transition">School Admin Login</Link></li>
                <li><Link to="/school-login" className="hover:text-[#3563EB] transition">Teacher Portal</Link></li>
                <li><Link to="/portal" className="hover:text-[#3563EB] transition">Parent & Student Portal</Link></li>
                <li><Link to="/admin-login" className="hover:text-[#3563EB] transition">Super Admin</Link></li>
              </ul>
            </div>

            {/* Col 4: Onboarding */}
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Institution</p>
              <ul className="space-y-2">
                <li><Link to="/register-school/plans" className="hover:text-[#3563EB] transition font-bold text-[#3563EB]">Register Campus</Link></li>
                <li><a href="#pricing" className="hover:text-[#3563EB] transition">Subscription Plans</a></li>
                <li><a href="#campuses" className="hover:text-[#3563EB] transition">Registered Schools</a></li>
                <li><button onClick={() => setSearchOpen(true)} className="hover:text-[#3563EB] transition">Search Campus</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} SchoolOS ERP. School Management Platform. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Tenant Security</span>
              <span>•</span>
              <span>Secure Access</span>
              <span>•</span>
              <span>Role-Based Access</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Search Modal Component ── */}
      <SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}