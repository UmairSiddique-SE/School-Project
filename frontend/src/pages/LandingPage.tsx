import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BarChart3, BookOpen, Bus, CalendarDays,
  Check, CheckCircle2, ChevronDown, ClipboardCheck, GraduationCap,
  LayoutDashboard, Library, LockKeyhole, Menu, Moon, ShieldCheck,
  Sparkles, Sun, Users, WalletCards, X, Globe2, MonitorSmartphone,
  BellRing, ChartNoAxesCombined, UserRoundCheck, School, Layers3,
  CreditCard, Star, Zap, CircleHelp
} from "lucide-react";
import apiClient from "@/api/apiClient";

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

const modules = [
  { icon: GraduationCap, name: "Student information", tag: "Admissions & records", description: "Keep admissions, student profiles, guardian details and academic histories organised.", accent: "blue" },
  { icon: ClipboardCheck, name: "Smart attendance", tag: "Daily operations", description: "Record daily attendance, follow absences and review class-wise summaries.", accent: "violet" },
  { icon: WalletCards, name: "Fees & finance", tag: "Collection & dues", description: "Configure fee structures, issue vouchers and keep payment records in order.", accent: "emerald" },
  { icon: BookOpen, name: "Exams & results", tag: "Academic progress", description: "Plan examinations, enter marks and prepare student result cards.", accent: "amber" },
  { icon: CalendarDays, name: "Classes & timetable", tag: "Academic planning", description: "Organise sections, subjects, teacher assignments and daily schedules.", accent: "cyan" },
  { icon: Users, name: "Staff management", tag: "People & roles", description: "Manage staff profiles, responsibilities and role-based access.", accent: "rose" },
  { icon: Bus, name: "Transport", tag: "Routes & vehicles", description: "Organise transport routes, vehicles and associated student information.", accent: "blue" },
  { icon: Library, name: "Library", tag: "Learning resources", description: "Keep library resources and day-to-day circulation workflows together.", accent: "violet" },
  { icon: BarChart3, name: "Reports & insights", tag: "Clearer decisions", description: "Review academic, attendance and financial information in structured reports.", accent: "emerald" },
];

const tourTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, title: "Your school, at a glance", description: "Bring essential school activity into one organised administrative workspace.", metrics: [["Student records", "Organised"], ["Attendance", "Daily view"], ["Fee records", "Tracked"], ["Reports", "Available"]] },
  { id: "students", label: "Students", icon: GraduationCap, title: "Every student record in its place", description: "Explore a sample of the student lifecycle, from admission to academic history.", metrics: [["Admissions", "Managed"], ["Profiles", "Organised"], ["Guardians", "Linked"], ["Class placement", "Configured"]] },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck, title: "A clearer daily attendance routine", description: "A sample workspace for marking attendance and reviewing daily class summaries.", metrics: [["Present", "Sample view"], ["Absent", "Tracked"], ["Leave", "Recorded"], ["Monthly view", "Ready"]] },
  { id: "fees", label: "Finance", icon: WalletCards, title: "Fee collection without the paperwork", description: "See how fee structures, vouchers, payment records and outstanding dues fit together.", metrics: [["Fee plans", "Configured"], ["Vouchers", "Generated"], ["Payments", "Recorded"], ["Dues", "Reviewed"]] },
  { id: "exams", label: "Examinations", icon: BookOpen, title: "From marks entry to report cards", description: "A sample examination flow for schedules, subject marks and student results.", metrics: [["Exam setup", "Managed"], ["Marks", "Recorded"], ["Grading", "Configured"], ["DMC", "Printable"]] },
];

const faqs = [
  { question: "What is SchoolOS?", answer: "SchoolOS is a multi-school management platform that connects student records, attendance, fees, examinations, staff and everyday school operations in one workspace." },
  { question: "How does a school get started?", answer: "A school submits its registration application and selects a plan. The SchoolOS Super Admin reviews the application before the school workspace is activated." },
  { question: "Can different people have different access?", answer: "Yes. SchoolOS is designed around role-based workflows so administrators, teachers, students and parents can access the areas intended for them, where enabled." },
  { question: "Are the dashboard figures on this page real?", answer: "No. The dashboard visuals are illustrative product previews. They do not represent live customer counts, school records or database totals." },
  { question: "Can we see the plans before registering?", answer: "Yes. Available public plans are loaded from the platform. You can review the current plan details and continue to the school registration flow." },
];

const accentStyles: Record<string, { light: string; dark: string }> = {
  blue: { light: "bg-blue-50 text-blue-600 ring-blue-100", dark: "bg-blue-400/10 text-blue-300 ring-blue-300/15" },
  violet: { light: "bg-violet-50 text-violet-600 ring-violet-100", dark: "bg-violet-400/10 text-violet-300 ring-violet-300/15" },
  emerald: { light: "bg-emerald-50 text-emerald-600 ring-emerald-100", dark: "bg-emerald-400/10 text-emerald-300 ring-emerald-300/15" },
  amber: { light: "bg-amber-50 text-amber-600 ring-amber-100", dark: "bg-amber-400/10 text-amber-300 ring-amber-300/15" },
  cyan: { light: "bg-cyan-50 text-cyan-600 ring-cyan-100", dark: "bg-cyan-400/10 text-cyan-300 ring-cyan-300/15" },
  rose: { light: "bg-rose-50 text-rose-600 ring-rose-100", dark: "bg-rose-400/10 text-rose-300 ring-rose-300/15" },
};

const formatPrice = (price: number) => new Intl.NumberFormat("en-PK").format(price);

export default function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("schoolos-landing-theme");
      if (saved === "light") setDark(false);
      if (saved === "dark") setDark(true);
    } catch {
      // Theme preference is optional; the page remains usable without storage.
    }
  }, []);

  const toggleTheme = () => {
    setDark((previous) => {
      const next = !previous;
      try { window.localStorage.setItem("schoolos-landing-theme", next ? "dark" : "light"); } catch { /* ignore unavailable storage */ }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    apiClient.get<PublicPlan[]>("/public/plans")
      .then((response) => { if (active) setPlans(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setPlans([]); })
      .finally(() => { if (active) setPlansLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.planKey === "PROFESSIONAL" && plan.price === 3000) || plans.find((plan) => plan.price > 0) || plans[0],
    [plans]
  );
  const activePreview = tourTabs.find((tab) => tab.id === activeTab) || tourTabs[0];

  const choosePlan = (planKey: string) => {
    sessionStorage.setItem("edusphere_registration_plan", planKey);
    navigate("/register-school/form?plan=" + encodeURIComponent(planKey));
  };

  const page = dark
    ? {
        bg: "bg-[#070B14]", header: "border-white/[0.07] bg-[#090F1D]/85", surface: "border-white/[0.08] bg-[#0D1525]",
        surfaceAlt: "border-white/[0.07] bg-[#101B2D]", card: "border-white/[0.08] bg-[#0C1422]",
        heading: "text-white", body: "text-slate-300", muted: "text-slate-400", subtle: "text-slate-500",
        line: "border-white/[0.08]", soft: "bg-white/[0.04]", input: "bg-white/[0.04] border-white/10",
        footer: "bg-[#080D18] border-white/[0.07]", glow: "from-blue-500/15 via-violet-500/10 to-cyan-400/10",
      }
    : {
        bg: "bg-[#F7F9FE]", header: "border-slate-200/80 bg-white/85", surface: "border-slate-200 bg-white",
        surfaceAlt: "border-slate-200 bg-[#F1F5FC]", card: "border-slate-200 bg-white",
        heading: "text-[#111B35]", body: "text-slate-600", muted: "text-slate-500", subtle: "text-slate-400",
        line: "border-slate-200", soft: "bg-slate-100", input: "bg-slate-50 border-slate-200",
        footer: "bg-white border-slate-200", glow: "from-blue-200/45 via-violet-200/35 to-cyan-100/50",
      };

  const buttonPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl";
  const buttonSecondary = dark
    ? "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
    : "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700";

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-500 ${page.bg} ${dark ? "text-white" : "text-[#111B35]"}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-64 left-[18%] h-[650px] w-[650px] rounded-full bg-gradient-to-br ${page.glow} blur-[110px]`} />
        <div className={`absolute right-[-260px] top-[32%] h-[600px] w-[600px] rounded-full bg-gradient-to-br ${page.glow} blur-[120px]`} />
        <div className={`absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(120,140,180,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,140,180,.18)_1px,transparent_1px)] [background-size:58px_58px] [mask-image:linear-gradient(to_bottom,black,transparent_76%)] ${dark ? "" : "opacity-[0.22]"}`} />
      </div>

      <header className={`sticky top-0 z-50 border-b backdrop-blur-2xl ${page.header}`}>
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-blue-600/25 transition group-hover:-rotate-3">
              <img src="/logo.svg" alt="SchoolOS" className="h-7 w-7 brightness-0 invert" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0D1525] bg-cyan-300" />
            </span>
            <span><span className={`block text-[21px] font-black leading-none tracking-tight ${page.heading}`}>SchoolOS</span><span className={`mt-1 block text-[9px] font-bold uppercase tracking-[.2em] ${page.muted}`}>School operating system</span></span>
          </Link>

          <nav className={`hidden items-center gap-7 text-[12px] font-bold lg:flex ${page.muted}`}>
            <a href="#platform" className="transition hover:text-blue-500">Platform</a>
            <a href="#features" className="transition hover:text-blue-500">Features</a>
            <a href="#tour" className="transition hover:text-blue-500">Product tour</a>
            <a href="#how-it-works" className="transition hover:text-blue-500">How it works</a>
            <a href="#pricing" className="transition hover:text-blue-500">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Switch to light theme" : "Switch to dark theme"} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${page.line} ${page.soft} ${page.body} hover:text-blue-500`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <Link to="/school-login" className={`rounded-xl px-3 py-2.5 text-xs font-bold transition hover:text-blue-500 ${page.body}`}>Sign in</Link>
            <Link to="/register-school/plans" className={`${buttonPrimary} !rounded-xl !px-4 !py-3 !text-xs`}>Register school <ArrowUpRight size={14} /></Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} aria-label="Toggle colour theme" className={`flex h-10 w-10 items-center justify-center rounded-xl border ${page.line} ${page.soft}`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" className={`flex h-10 w-10 items-center justify-center rounded-xl border ${page.line} ${page.soft}`}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`overflow-hidden border-t px-5 py-5 md:hidden ${page.line} ${page.bg}`}>
            <div className={`flex flex-col gap-4 text-sm font-semibold ${page.body}`}>
              {[[ "Platform", "#platform" ],[ "Features", "#features" ],[ "Product tour", "#tour" ],[ "How it works", "#how-it-works" ],[ "Pricing", "#pricing" ]].map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
              <Link to="/school-login" onClick={() => setMenuOpen(false)}>School login</Link>
              <Link to="/register-school/plans" onClick={() => setMenuOpen(false)} className={buttonPrimary}>Register your school <ArrowRight size={15} /></Link>
            </div>
          </motion.div>}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="relative px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-32">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[.88fr_1.12fr]">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10 text-center lg:text-left">
              <div className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] backdrop-blur ${dark ? "border-blue-300/20 bg-blue-400/10 text-blue-200" : "border-blue-200 bg-white text-blue-700 shadow-sm"}`}><Sparkles size={13} /> A smarter way to run your school</div>
              <h1 className={`text-[43px] font-black leading-[1.04] tracking-[-.06em] sm:text-6xl lg:text-[68px] ${page.heading}`}>Your school.<br /><span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">One powerful</span><br />operating system.</h1>
              <p className={`mx-auto mt-7 max-w-xl text-base leading-8 sm:text-lg lg:mx-0 ${page.body}`}>Bring admissions, attendance, fee management, examinations and everyday school operations together in one beautifully connected workspace.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/register-school/plans" className={buttonPrimary}>Get started <ArrowRight size={17} /></Link>
                <a href="#tour" className={buttonSecondary}>Explore the platform <ChevronDown size={16} /></a>
              </div>
              <div className={`mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[10px] font-bold lg:justify-start ${page.muted}`}>
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Role-based access</span>
                <span className="flex items-center gap-1.5"><LockKeyhole size={13} className="text-blue-500" /> School-specific workspace</span>
                <span className="flex items-center gap-1.5"><UserRoundCheck size={14} className="text-violet-500" /> Reviewed onboarding</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: .96, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, delay: .12 }} className="relative mx-auto w-full max-w-[690px]">
              <div className={`absolute -inset-8 rounded-[45px] bg-gradient-to-br ${page.glow} blur-3xl`} />
              <div className={`absolute -right-3 top-8 h-28 w-28 rounded-full border blur-[1px] ${dark ? "border-blue-300/20 bg-blue-400/10" : "border-white bg-blue-100/70"}`} />
              <div className={`relative rounded-[30px] border p-2.5 shadow-2xl backdrop-blur-2xl sm:rounded-[34px] sm:p-3.5 ${dark ? "border-white/10 bg-[#111C2E]/90 shadow-black/40" : "border-white bg-white/80 shadow-blue-950/15"}`}>
                <div className={`overflow-hidden rounded-[23px] border sm:rounded-[27px] ${dark ? "border-white/10 bg-[#0A1220]" : "border-slate-200 bg-[#F5F7FC]"}`}>
                  <div className={`flex items-center justify-between border-b px-4 py-3.5 sm:px-5 ${page.line} ${dark ? "bg-[#0E192A]" : "bg-white"}`}>
                    <div className="flex items-center gap-2"><div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" /><i className="h-2 w-2 rounded-full bg-amber-400" /><i className="h-2 w-2 rounded-full bg-emerald-400" /></div><span className={`ml-2 text-[9px] font-extrabold tracking-[.12em] ${page.muted}`}>SCHOOLOS / COMMAND CENTRE</span></div>
                    <span className={`rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider ${dark ? "bg-blue-400/10 text-blue-200" : "bg-blue-50 text-blue-700"}`}>Product preview</span>
                  </div>
                  <div className="grid grid-cols-[54px_1fr] sm:grid-cols-[66px_1fr]">
                    <aside className={`flex flex-col items-center gap-5 border-r py-5 ${page.line} ${dark ? "bg-[#0D1727]" : "bg-white"}`}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><School size={17} /></div>
                      {[LayoutDashboard, GraduationCap, CalendarDays, WalletCards, BarChart3].map((Icon, index) => <span key={index} className={`flex h-8 w-8 items-center justify-center rounded-xl ${index === 0 ? "bg-blue-500/15 text-blue-400" : page.muted}`}><Icon size={16} /></span>)}
                    </aside>
                    <div className="min-w-0 p-3.5 sm:p-5">
                      <div className="flex items-center justify-between gap-2"><div><p className={`text-[8px] font-bold uppercase tracking-widest ${page.muted}`}>Workspace overview</p><h3 className={`mt-1 text-sm font-black sm:text-lg ${page.heading}`}>Good morning, Admin</h3></div><div className={`flex h-8 w-8 items-center justify-center rounded-full ${dark ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"}`}><BellRing size={14} /></div></div>
                      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[[ "Students", "1,248", GraduationCap, "text-blue-400" ],[ "Attendance", "94.8%", ClipboardCheck, "text-emerald-400" ],[ "Fee records", "Tracked", CreditCard, "text-violet-400" ],[ "Classes", "36", Layers3, "text-amber-400" ]].map(([label, value, Icon, tone]) => {
                          const MetricIcon = Icon as React.ElementType;
                          return <div key={String(label)} className={`rounded-xl border p-2.5 sm:p-3 ${dark ? "border-white/[0.07] bg-white/[0.025]" : "border-slate-200 bg-white"}`}><MetricIcon size={14} className={String(tone)} /><p className={`mt-2 text-sm font-black sm:text-base ${page.heading}`}>{String(value)}</p><p className={`mt-0.5 text-[8px] font-bold sm:text-[9px] ${page.muted}`}>{String(label)}</p></div>;
                        })}
                      </div>
                      <div className={`mt-3 rounded-xl border p-3 sm:p-4 ${page.line} ${dark ? "bg-white/[0.025]" : "bg-white"}`}>
                        <div className="flex items-center justify-between"><div><p className={`text-[9px] font-extrabold ${page.heading}`}>School activity</p><p className={`mt-0.5 text-[8px] ${page.muted}`}>Illustrative weekly overview</p></div><span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[8px] font-bold text-emerald-500">Preview</span></div>
                        <div className="mt-4 flex h-[92px] items-end gap-2 border-b border-dashed border-slate-500/20 px-1">{[38,58,46,76,61,90,70,98,78,86,65,92].map((height,index)=><motion.div key={index} initial={{ height: 0 }} animate={{ height: height + "%" }} transition={{ duration: .7, delay: index * .035 }} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90" />)}</div>
                        <div className={`mt-2 flex justify-between text-[8px] font-semibold ${page.subtle}`}><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className={`absolute -left-4 top-[25%] hidden items-center gap-2.5 rounded-2xl border p-3 shadow-xl backdrop-blur-xl sm:flex lg:-left-10 ${dark ? "border-white/10 bg-[#142238]/95" : "border-white bg-white/95"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={18} /></span><span><b className={`block text-[10px] ${page.heading}`}>Attendance marked</b><small className={`text-[8px] ${page.muted}`}>Sample workflow</small></span></motion.div>
              <motion.div animate={{ y: [0,8,0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className={`absolute -right-3 bottom-[13%] hidden items-center gap-2.5 rounded-2xl border p-3 shadow-xl backdrop-blur-xl sm:flex lg:-right-8 ${dark ? "border-white/10 bg-[#142238]/95" : "border-white bg-white/95"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><WalletCards size={18} /></span><span><b className={`block text-[10px] ${page.heading}`}>Fee records organised</b><small className={`text-[8px] ${page.muted}`}>Illustrative activity</small></span></motion.div>
            </motion.div>
          </div>

          <div className={`mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 rounded-2xl border p-5 shadow-xl sm:grid-cols-4 sm:p-7 ${page.surface}`}>
            {[[ "09", "Connected modules" ],[ "04", "Role-based portals" ],[ "01", "Unified workspace" ],[ "24/7", "Cloud accessibility" ]].map(([value,label])=><div key={label} className="text-center"><p className={`text-2xl font-black tracking-tight sm:text-3xl ${page.heading}`}>{value}</p><p className={`mt-1 text-[9px] font-bold uppercase tracking-[.12em] ${page.muted}`}>{label}</p></div>)}
            <p className={`col-span-2 text-center text-[8px] font-semibold uppercase tracking-[.12em] sm:col-span-4 ${page.subtle}`}>Platform capabilities — not customer registration totals</p>
          </div>
        </section>

        <section id="platform" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div><span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark ? "bg-violet-400/10 text-violet-300" : "bg-violet-50 text-violet-700"}`}><Layers3 size={13} /> One connected platform</span><h2 className={`mt-5 text-3xl font-black leading-tight tracking-[-.045em] sm:text-5xl ${page.heading}`}>Less switching.<br /><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">More control.</span></h2><p className={`mt-5 max-w-md text-sm leading-7 ${page.body}`}>Bring the work that usually gets scattered across paper registers, spreadsheets and disconnected tools into one connected school workspace.</p><Link to="/register-school/plans" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-blue-500 hover:gap-3">Bring your school onto SchoolOS <ArrowRight size={16} /></Link></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div whileHover={{ y: -5 }} className="relative min-h-[230px] overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-2xl shadow-blue-900/20 sm:col-span-2"><div className="absolute -right-8 -top-12 h-56 w-56 rounded-full border-[30px] border-white/10" /><div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative max-w-lg"><span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.17em] text-blue-100">The school command centre</span><h3 className="mt-5 text-2xl font-black sm:text-3xl">A single view of your school’s moving parts.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">Connect academic, financial and administrative workflows, with access shaped around each role.</p></div><div className="absolute bottom-6 right-7 hidden h-24 w-44 rotate-[-5deg] rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl sm:block"><div className="flex items-end gap-2">{[30,60,44,85,58,95,70].map((height,index)=><i key={index} style={{height:height+"%"}} className="flex-1 rounded-t bg-cyan-200/90" />)}</div></div></motion.div>
              <motion.div whileHover={{ y: -5 }} className={`rounded-[26px] border p-6 shadow-lg ${page.card}`}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500"><MonitorSmartphone size={23} /></div><h3 className={`mt-5 text-lg font-black ${page.heading}`}>Purpose-built portals</h3><p className={`mt-2 text-sm leading-6 ${page.muted}`}>Clear experiences for administrators, teachers, students and parents.</p><div className="mt-5 flex -space-x-2">{["A","T","S","P"].map((letter,index)=><span key={letter} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-black text-white ${dark ? "border-[#0C1422]" : "border-white"} ${["bg-blue-600","bg-violet-600","bg-cyan-600","bg-emerald-600"][index]}`}>{letter}</span>)}</div></motion.div>
              <motion.div whileHover={{ y: -5 }} className={`rounded-[26px] border p-6 shadow-lg ${page.card}`}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500"><ShieldCheck size={23} /></div><h3 className={`mt-5 text-lg font-black ${page.heading}`}>Controlled access</h3><p className={`mt-2 text-sm leading-6 ${page.muted}`}>Role-aware permissions and school-specific workspaces help keep operations organised.</p><div className="mt-5 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wider text-emerald-500"><LockKeyhole size={13} /> Access by role</div></motion.div>
            </div>
          </div>
        </section>

        <section id="features" className={`border-y py-24 ${page.line} ${dark ? "bg-white/[0.018]" : "bg-white/75"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center"><span className={`rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark ? "bg-blue-400/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>Built for everyday school work</span><h2 className={`mt-5 text-3xl font-black tracking-[-.045em] sm:text-5xl ${page.heading}`}>Every department, <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">in sync.</span></h2><p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${page.muted}`}>A connected set of tools for the people and processes that keep a school moving.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module,index)=>{const Icon=module.icon;return <motion.article key={module.name} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{duration:.4,delay:(index%3)*.06}} whileHover={{y:-5}} className={`group rounded-[25px] border p-6 transition duration-300 hover:border-blue-500/30 hover:shadow-xl ${page.card}`}><div className="flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accentStyles[module.accent][dark?"dark":"light"]}`}><Icon size={22}/></span><ArrowUpRight size={17} className={`transition group-hover:-translate-y-1 group-hover:translate-x-1 ${page.subtle}`}/></div><p className="mt-6 text-[9px] font-extrabold uppercase tracking-[.14em] text-blue-500">{module.tag}</p><h3 className={`mt-2 text-lg font-black ${page.heading}`}>{module.name}</h3><p className={`mt-2 text-sm leading-6 ${page.muted}`}>{module.description}</p></motion.article>})}
            </div>
          </div>
        </section>

        <section id="tour" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-3xl text-center"><span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-cyan-400/10 text-cyan-300":"bg-cyan-50 text-cyan-700"}`}><Sparkles size={13}/> Take a product tour</span><h2 className={`mt-5 text-3xl font-black tracking-[-.045em] sm:text-5xl ${page.heading}`}>See how the pieces <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">come together.</span></h2><p className={`mt-4 text-sm leading-7 ${page.muted}`}>Explore illustrative previews of the key SchoolOS workflows.</p></div>
            <div className={`overflow-hidden rounded-[30px] border shadow-2xl ${page.surface}`}>
              <div className={`flex gap-2 overflow-x-auto border-b p-3 sm:p-4 ${page.line} ${dark?"bg-white/[0.02]":"bg-slate-50"}`}>{tourTabs.map((tab)=>{const Icon=tab.icon;const selected=activeTab===tab.id;return <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${selected?"bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg":page.muted+" "+(dark?"hover:bg-white/[0.06]":"hover:bg-white")}`}><Icon size={15}/>{tab.label}</button>})}</div>
              <AnimatePresence mode="wait"><motion.div key={activePreview.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.25}} className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[.85fr_1.15fr]">
                <div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-cyan-500">Module preview · illustrative UI</span><h3 className={`mt-4 text-2xl font-black leading-tight sm:text-3xl ${page.heading}`}>{activePreview.title}</h3><p className={`mt-4 text-sm leading-7 ${page.muted}`}>{activePreview.description}</p><div className="mt-7 space-y-3">{["Designed for clear day-to-day workflows","Organised around school roles","Connected with the wider platform"].map((item)=> <div key={item} className={`flex items-center gap-3 text-xs font-semibold ${page.body}`}><CheckCircle2 size={16} className="shrink-0 text-emerald-500"/>{item}</div>)}</div><Link to="/register-school/plans" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-blue-500">Explore registration <ArrowRight size={16}/></Link></div>
                <div className={`rounded-[24px] border p-5 sm:p-7 ${page.line} ${dark?"bg-[#080F1B]":"bg-[#F5F7FC"}`}><div className="flex items-center justify-between"><div><p className={`text-[9px] font-extrabold uppercase tracking-widest ${page.muted}`}>SchoolOS workspace</p><h4 className={`mt-1 text-base font-black ${page.heading}`}>{activePreview.label} dashboard</h4></div><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[8px] font-extrabold uppercase text-cyan-500">Preview data</span></div><div className="mt-6 grid grid-cols-2 gap-3">{activePreview.metrics.map(([label,value],index)=><div key={label} className={`rounded-2xl border p-4 ${page.line} ${dark?"bg-white/[0.025]":"bg-white"}`}><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${["bg-blue-500/10 text-blue-500","bg-violet-500/10 text-violet-500","bg-emerald-500/10 text-emerald-500","bg-amber-500/10 text-amber-500"][index]}`}><Check size={15}/></div><p className={`mt-4 text-sm font-black ${page.heading}`}>{value}</p><p className={`mt-1 text-[9px] font-semibold ${page.muted}`}>{label}</p></div>)}</div><div className={`mt-4 rounded-2xl border p-4 ${page.line} ${dark?"bg-white/[0.025]":"bg-white"}`}><div className="flex items-center justify-between"><span className={`text-[10px] font-bold ${page.body}`}>Workflow completion</span><span className="text-[10px] font-black text-cyan-500">Preview</span></div><div className={`mt-3 h-2 overflow-hidden rounded-full ${dark?"bg-white/10":"bg-slate-100"}`}><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"/></div></div></div>
              </motion.div></AnimatePresence>
            </div>
          </div>
        </section>

        <section className={`border-y py-24 ${page.line} ${dark?"bg-white/[0.018]":"bg-white/75"}`}>
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">A digital identity for every campus</span><h2 className={`mt-4 text-3xl font-black leading-tight tracking-[-.04em] sm:text-5xl ${page.heading}`}>Your school deserves <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">its own online home.</span></h2><p className={`mt-5 text-sm leading-7 ${page.muted}`}>SchoolOS supports dedicated public school pages, giving each approved institution a place to present its identity, academic information and ways to connect.</p><div className="mt-7 space-y-3">{["Dedicated school profile and public identity","Academic levels, campus details and facilities","Admissions enquiry and portal entry points"].map((item)=><div key={item} className={`flex items-center gap-3 text-xs font-semibold ${page.body}`}><CheckCircle2 size={16} className="text-emerald-500"/>{item}</div>)}</div><Link to="/register-school/plans" className={`${buttonPrimary} mt-8`}>Register your school <ArrowRight size={16}/></Link></div>
            <div className={`rounded-[28px] border p-4 shadow-2xl ${page.surface}`}><div className={`flex items-center justify-between border-b px-2 pb-4 ${page.line}`}><span className={`flex items-center gap-2 text-[10px] font-bold ${page.body}`}><Globe2 size={14} className="text-cyan-500"/> Your School Website · Preview</span><span className="text-[8px] font-extrabold uppercase text-emerald-500">Illustrative</span></div><div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-7 text-center text-white"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-black backdrop-blur">S</div><h3 className="mt-4 text-xl font-black">Your School Name</h3><p className="mt-1 text-[10px] text-blue-100">Your City, Pakistan</p><div className="mt-6 flex flex-wrap justify-center gap-2">{["Admissions","Academic levels","School portal"].map((label)=> <span key={label} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-bold">{label}</span>)}</div></div></div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl"><div className="mx-auto mb-14 max-w-3xl text-center"><span className={`text-[9px] font-extrabold uppercase tracking-[.17em] ${dark?"text-cyan-300":"text-cyan-700"}`}>Simple onboarding</span><h2 className={`mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl ${page.heading}`}>A clear path to getting started.</h2><p className={`mt-4 text-sm ${page.muted}`}>A reviewed onboarding process helps each school begin with its own workspace.</p></div><div className="grid gap-4 md:grid-cols-3">{[[ "01","Choose a plan","Review the available plans and select the option that fits your school.",CreditCard ],[ "02","Submit your application","Share your school information and submit it for review.",ClipboardCheck ],[ "03","Get your workspace","After approval, your school administrator can begin setup.",Zap ]].map(([number,title,description,Icon])=>{const StepIcon=Icon as React.ElementType;return <div key={String(number)} className={`relative rounded-[25px] border p-7 ${page.card}`}><div className="flex items-center justify-between"><span className="text-3xl font-black text-blue-500/40">{String(number)}</span><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${dark?"bg-white/[0.05] text-cyan-300":"bg-blue-50 text-blue-600"}`}><StepIcon size={20}/></span></div><h3 className={`mt-7 text-lg font-black ${page.heading}`}>{String(title)}</h3><p className={`mt-2 text-sm leading-6 ${page.muted}`}>{String(description)}</p></div>})}</div></div>
        </section>

        <section id="pricing" className={`border-y py-24 ${page.line} ${dark?"bg-white/[0.018]":"bg-white/75"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto mb-12 max-w-3xl text-center"><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-blue-500">Straightforward plans</span><h2 className={`mt-4 text-3xl font-black tracking-[-.045em] sm:text-5xl ${page.heading}`}>Choose the right starting point.</h2><p className={`mt-4 text-sm leading-7 ${page.muted}`}>Review the current plans provided by SchoolOS and start your school registration.</p></div>
            {plansLoading ? <div className={`rounded-2xl border p-10 text-center text-sm ${page.line} ${page.muted}`}>Loading available plans…</div> : plans.length > 0 ? <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">{plans.map((plan,index)=><div key={plan.id || plan.planKey} className={`relative rounded-[27px] border p-7 shadow-xl ${index===0?"border-blue-500/50 shadow-blue-900/10":page.card} ${index===0&&dark?"bg-[#101D32]":""}`}>{index===0&&<span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-[8px] font-extrabold uppercase tracking-wider text-white">Get started</span>}<p className={`text-sm font-extrabold ${page.heading}`}>{plan.name}</p><div className="mt-4 flex items-end gap-2"><span className={`text-4xl font-black tracking-tight ${page.heading}`}>{plan.price===0?"Free":`PKR ${formatPrice(plan.price)}`}</span><span className={`pb-1 text-xs ${page.muted}`}>/ {plan.period || "month"}</span></div><p className={`mt-3 text-xs ${page.muted}`}>{plan.maxStudents>0?`Up to ${plan.maxStudents.toLocaleString("en-PK")} students`:"Student capacity as configured"}</p><div className={`my-6 border-t ${page.line}`}/><div className="space-y-3">{(plan.features||[]).slice(0,6).map((feature)=><div key={feature} className={`flex items-start gap-2 text-xs ${page.body}`}><Check size={14} className="mt-0.5 shrink-0 text-emerald-500"/>{feature}</div>)}</div><button onClick={()=>choosePlan(plan.planKey)} className={`${index===0?buttonPrimary:buttonSecondary} mt-8 w-full`}>Choose this plan <ArrowRight size={15}/></button></div>)}</div> : <div className={`mx-auto max-w-2xl rounded-[25px] border p-8 text-center ${page.surface}`}><CircleHelp size={28} className="mx-auto text-blue-500"/><h3 className={`mt-4 text-xl font-black ${page.heading}`}>Plans are being prepared</h3><p className={`mt-2 text-sm ${page.muted}`}>You can still explore SchoolOS or contact the team through the school registration process.</p><Link to="/register-school/plans" className={`${buttonPrimary} mt-6`}>View registration <ArrowRight size={15}/></Link></div>}
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">Questions, answered</span><h2 className={`mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl ${page.heading}`}>A few things you may want to know.</h2><p className={`mt-4 text-sm leading-7 ${page.muted}`}>Still deciding? Here are answers to common questions about getting started with SchoolOS.</p><div className={`mt-7 flex items-center gap-2 text-xs font-bold ${page.muted}`}><ShieldCheck size={16} className="text-emerald-500"/> Reviewed school onboarding</div></div><div className="space-y-3">{faqs.map((faq,index)=><div key={faq.question} className={`overflow-hidden rounded-2xl border ${page.card}`}><button onClick={()=>setOpenFaq(openFaq===index?null:index)} className="flex w-full items-center justify-between gap-4 p-5 text-left"><span className={`text-sm font-extrabold ${page.heading}`}>{faq.question}</span><ChevronDown size={17} className={`shrink-0 transition ${page.muted} ${openFaq===index?"rotate-180":""}`}/></button><AnimatePresence initial={false}>{openFaq===index&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className={`px-5 pb-5 text-sm leading-7 ${page.muted}`}>{faq.answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-7 py-14 text-center text-white shadow-2xl shadow-blue-900/20 sm:px-14 sm:py-20"><div className="absolute -left-20 -top-28 h-72 w-72 rounded-full border-[35px] border-white/10"/><div className="absolute -bottom-36 -right-10 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"/><div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em]"><Star size={12}/> Bring clarity to your school operations</span><h2 className="mt-6 text-3xl font-black leading-tight tracking-[-.04em] sm:text-5xl">Ready to move your school forward?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-blue-100">Start with a school registration application and take the first step towards a more connected way of working.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register-school/plans" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-0.5">Register your school <ArrowRight size={16}/></Link><Link to="/school-login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">School login</Link></div></div></div></div></section>
      </main>

      <footer className={`relative z-10 border-t py-14 ${page.footer}`}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
          <div><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600"><img src="/logo.svg" alt="" className="h-6 w-6 brightness-0 invert"/></span><b className={`text-lg font-black ${page.heading}`}>SchoolOS</b></Link><p className={`mt-4 max-w-xs text-xs leading-6 ${page.muted}`}>A connected school management platform for academic, administrative and financial workflows.</p></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${page.heading}`}>Platform</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${page.muted}`}><a href="#features">Features</a><a href="#tour">Product tour</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${page.heading}`}>Portals</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${page.muted}`}><Link to="/school-login">School login</Link><Link to="/portal">Parent & student portal</Link><Link to="/admin-login">Super Admin</Link></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${page.heading}`}>Get started</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${page.muted}`}><Link to="/register-school/plans">Register school</Link><Link to="/school-login">Sign in</Link><button onClick={toggleTheme} className="flex items-center gap-2 text-left hover:text-blue-500">{dark?<Sun size={13}/>:<Moon size={13}/>} Switch to {dark?"light":"dark"} theme</button></div></div>
        </div>
        <div className={`mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t px-4 pt-6 text-[9px] font-semibold sm:flex-row sm:px-6 lg:px-8 ${page.line} ${page.subtle}`}><span>© {new Date().getFullYear()} SchoolOS. All rights reserved.</span><span>Secure access · Role-based workflows · School-specific workspaces</span></div>
      </footer>
    </div>
  );
}
