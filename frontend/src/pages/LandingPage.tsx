import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BarChart3, BookOpen, Bus, CalendarDays,
  Check, CheckCircle2, ChevronDown, ClipboardCheck, CreditCard,
  GraduationCap, LayoutDashboard, Library, LockKeyhole, Menu, Moon,
  ShieldCheck, Sparkles, Sun, Users, WalletCards, X, Globe2,
  MonitorSmartphone, Bell, ChartNoAxesCombined, School, Layers3,
  Star, Zap, CircleHelp, Settings2, MessageCircle,
  TrendingUp, FileText, UserRoundCheck, Command, Play, Plus, Search, MapPin
} from "lucide-react";
import apiClient from "@/api/apiClient";
import "./LandingPage.css";

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

interface PublicSchool {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  loginAvailable: boolean;
  status: string;
}

const modules = [
  { icon: GraduationCap, name: "Student information", tag: "Admissions & records", description: "A complete view of student profiles, guardians, admissions and academic history.", color: "blue" },
  { icon: ClipboardCheck, name: "Smart attendance", tag: "Daily operations", description: "Make attendance easier to record, review and follow up across every class.", color: "violet" },
  { icon: WalletCards, name: "Fees & finance", tag: "Collection & dues", description: "Bring fee structures, vouchers, payments and outstanding balances together.", color: "emerald" },
  { icon: BookOpen, name: "Exams & results", tag: "Academic progress", description: "Organise exam schedules, marks, grading and student result cards.", color: "amber" },
  { icon: CalendarDays, name: "Classes & timetable", tag: "Academic planning", description: "Coordinate sections, subjects, teacher assignments and class schedules.", color: "cyan" },
  { icon: Users, name: "Staff management", tag: "People & roles", description: "Keep staff profiles, responsibilities and role-based access in order.", color: "rose" },
  { icon: Bus, name: "Transport", tag: "Routes & vehicles", description: "Manage routes, vehicles and the students connected to each service.", color: "blue" },
  { icon: Library, name: "Library", tag: "Learning resources", description: "Organise learning resources and everyday library circulation workflows.", color: "violet" },
  { icon: BarChart3, name: "Reports & insights", tag: "Clearer decisions", description: "Turn academic, attendance and financial records into useful reports.", color: "emerald" },
];

const tourTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, title: "A clear view of the whole school", description: "Bring key school activity into one organised administrative workspace.", metrics: [["Student records", "Organised"], ["Attendance", "Daily view"], ["Fee records", "Tracked"], ["Reports", "Available"]] },
  { id: "students", label: "Students", icon: GraduationCap, title: "Every student detail, in its place", description: "Explore an illustrative student lifecycle, from admission to academic history.", metrics: [["Admissions", "Managed"], ["Profiles", "Organised"], ["Guardians", "Linked"], ["Class placement", "Configured"]] },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck, title: "A better daily attendance routine", description: "A sample workspace for marking attendance and reviewing class summaries.", metrics: [["Present", "Sample view"], ["Absent", "Tracked"], ["Leave", "Recorded"], ["Monthly view", "Ready"]] },
  { id: "fees", label: "Finance", icon: WalletCards, title: "Fee collection without the paperwork", description: "See how fee structures, vouchers, payment records and dues fit together.", metrics: [["Fee plans", "Configured"], ["Vouchers", "Generated"], ["Payments", "Recorded"], ["Dues", "Reviewed"]] },
  { id: "exams", label: "Examinations", icon: BookOpen, title: "From marks entry to result cards", description: "A sample examination flow for schedules, subject marks and student results.", metrics: [["Exam setup", "Managed"], ["Marks", "Recorded"], ["Grading", "Configured"], ["DMC", "Printable"]] },
];

const faqs = [
  { question: "What is SchoolOS?", answer: "SchoolOS is a multi-school management platform that connects student records, attendance, fees, examinations, staff and everyday school operations in one workspace." },
  { question: "How does a school get started?", answer: "A school submits its registration application and selects a plan. The SchoolOS Super Admin reviews the application before the school workspace is activated." },
  { question: "Can different people have different access?", answer: "Yes. SchoolOS is designed around role-based workflows so administrators, teachers, students and parents can access the areas intended for them, where enabled." },
  { question: "Are the dashboard figures on this page real?", answer: "No. Dashboard visuals are illustrative product previews. They do not represent live customer counts, school records or database totals." },
  { question: "Can we see the plans before registering?", answer: "Yes. SchoolOS offers one straightforward Professional subscription. Review the included features and continue to the school registration flow." },
];

const colorStyles: Record<string, { light: string; dark: string }> = {
  blue: { light: "bg-blue-50 text-blue-700 ring-blue-100", dark: "bg-blue-400/10 text-blue-300 ring-blue-300/15" },
  violet: { light: "bg-violet-50 text-violet-700 ring-violet-100", dark: "bg-violet-400/10 text-violet-300 ring-violet-300/15" },
  emerald: { light: "bg-emerald-50 text-emerald-700 ring-emerald-100", dark: "bg-emerald-400/10 text-emerald-300 ring-emerald-300/15" },
  amber: { light: "bg-amber-50 text-amber-700 ring-amber-100", dark: "bg-amber-400/10 text-amber-300 ring-amber-300/15" },
  cyan: { light: "bg-cyan-50 text-cyan-700 ring-cyan-100", dark: "bg-cyan-400/10 text-cyan-300 ring-cyan-300/15" },
  rose: { light: "bg-rose-50 text-rose-700 ring-rose-100", dark: "bg-rose-400/10 text-rose-300 ring-rose-300/15" },
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
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // The app-wide ThemeProvider defaults to light. Temporarily own the document theme
  // on this public page so its global .light overrides cannot break the dark palette.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    return () => {
      root.classList.remove("dark");
      root.classList.add("light");
    };
  }, [dark]);

  // Every fresh visit starts in dark mode; visitors can switch instantly.
  const toggleTheme = () => setDark((previous) => !previous);

  useEffect(() => {
    let active = true;
    apiClient.get<PublicPlan[]>("/public/plans")
      .then((response) => { if (active) setPlans(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setPlans([]); })
      .finally(() => { if (active) setPlansLoading(false); });

    apiClient.get("/public/schools")
      .then((response) => {
        if (!active) return;
        const data = response?.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.schools) ? data.schools : [];
        setSchools(list);
      })
      .catch(() => { if (active) setSchools([]); })
      .finally(() => { if (active) setSchoolsLoading(false); });

    return () => { active = false; };
  }, []);

  const activePreview = tourTabs.find((tab) => tab.id === activeTab) || tourTabs[0];
  const featuredPlan = useMemo(
    () => plans.find((plan) => plan.planKey === "PROFESSIONAL") || {
      id: "professional",
      planKey: "PROFESSIONAL",
      name: "Professional",
      price: 3000,
      period: "per month",
      maxStudents: 500,
      maxTeachers: 100,
      storageMb: 10240,
      supportTier: "Standard",
      features: ["Students & admissions", "Attendance & timetable", "Fees & finance", "Exams & results", "Staff & role-based access", "Reports & school operations"],
    },
    [plans],
  );

  const choosePlan = (planKey: string) => {
    sessionStorage.setItem("schoolos_registration_plan", "PROFESSIONAL");
    sessionStorage.setItem("edusphere_registration_plan", "PROFESSIONAL");
    navigate("/register-school/form?plan=" + encodeURIComponent(planKey));
  };

  const c = dark ? {
    bg: "bg-[#070B13]", header: "border-slate-700/70 bg-[#090F19]/95",
    panel: "border-slate-700/80 bg-gradient-to-br from-[#172538] via-[#111D2C] to-[#102B32]",
    panel2: "border-teal-400/20 bg-gradient-to-br from-[#102B32] to-[#13243A]",
    card: "border-slate-700/75 bg-gradient-to-br from-[#142235] via-[#101B2A] to-[#10232C]",
    heading: "text-[#F7FAFC]", body: "text-slate-200", muted: "text-slate-300", faint: "text-slate-400",
    line: "border-slate-700/65", soft: "bg-slate-800/75", footer: "bg-[#080E17]",
    glow: "from-cyan-400/25 via-teal-400/15 to-blue-500/20", grid: "rgba(148,163,184,.10)"
  } : {
    bg: "bg-[#F5F8FA]", header: "border-slate-200 bg-white/95",
    panel: "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50",
    panel2: "border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50",
    card: "border-slate-200 bg-gradient-to-br from-white to-slate-50",
    heading: "text-[#10202C]", body: "text-slate-700", muted: "text-slate-600", faint: "text-slate-500",
    line: "border-slate-200", soft: "bg-slate-100", footer: "bg-[#F1F5F7]",
    glow: "from-cyan-300/55 via-teal-200/45 to-blue-200/50", grid: "rgba(15,118,110,.09)"
  };

  const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-5 py-3.5 text-sm font-extrabold text-[#041411] shadow-[0_12px_30px_-12px_rgba(20,184,166,.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-12px_rgba(20,184,166,.75)]";
  const secondary = `inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5 ${dark ? "border-slate-600/80 bg-slate-800/55 text-slate-100 hover:border-teal-400/50 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800"}`;

  return (
    <div className={`schoolos-landing ${dark ? "schoolos-dark" : "schoolos-light"} relative min-h-screen overflow-hidden font-sans transition-colors duration-500 ${c.bg} ${dark ? "text-white" : "text-[#10182D]"}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-72 left-[12%] h-[720px] w-[720px] rounded-full bg-gradient-to-br ${c.glow} blur-[120px]`} />
        <div className={`absolute right-[-320px] top-[28%] h-[700px] w-[700px] rounded-full bg-gradient-to-br ${c.glow} blur-[130px]`} />
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px),linear-gradient(90deg,${c.grid} 1px, transparent 1px)`, backgroundSize: "64px 64px", maskImage: "linear-gradient(to bottom, black, transparent 72%)" }} />
      </div>

      <header className={`sticky top-0 z-50 border-b backdrop-blur-2xl ${c.header}`}>
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-[#07131F] shadow-lg shadow-cyan-950/25 transition group-hover:-rotate-3"><img src="/logo.svg" alt="SchoolOS logo" className="h-full w-full object-contain" /></span>
            <span><span className={`block text-[21px] font-black leading-none tracking-tight ${c.heading}`}>SchoolOS</span><span className={`mt-1 block text-[9px] font-bold uppercase tracking-[.22em] ${c.muted}`}>School operating system</span></span>
          </Link>

          <nav className={`hidden items-center gap-8 text-[12px] font-bold lg:flex ${c.muted}`}>
            <a href="#platform" className="transition hover:text-blue-500">Platform</a>
            <a href="#features" className="transition hover:text-blue-500">Modules</a>
            <a href="#campuses" className="transition hover:text-blue-500">Campuses</a>
            <a href="#tour" className="transition hover:text-blue-500">Product tour</a>
            <a href="#how-it-works" className="transition hover:text-blue-500">How it works</a>
            <a href="#pricing" className="transition hover:text-blue-500">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/school-login" className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${c.line} ${c.soft} ${c.body} hover:text-blue-500`}>
              <Search size={14} /> Find School
            </Link>
            <button onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Switch to light theme" : "Switch to dark theme"} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${c.line} ${c.soft} ${c.body} hover:text-blue-500`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <Link to="/school-login" className={`rounded-xl px-3 py-2.5 text-xs font-bold transition hover:text-blue-500 ${c.body}`}>Sign in</Link>
            <Link to="/register-school/plans" className={`${primary} !rounded-xl !px-4 !py-3 !text-xs`}>Register school <ArrowUpRight size={14} /></Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} aria-label="Toggle colour theme" className={`flex h-10 w-10 items-center justify-center rounded-xl border ${c.line} ${c.soft}`}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation" className={`flex h-10 w-10 items-center justify-center rounded-xl border ${c.line} ${c.soft}`}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`overflow-hidden border-t px-5 py-5 md:hidden ${c.line} ${c.bg}`}>
            <div className={`flex flex-col gap-4 text-sm font-semibold ${c.body}`}>
              {[[ "Platform", "#platform" ],[ "Modules", "#features" ],[ "Product tour", "#tour" ],[ "How it works", "#how-it-works" ],[ "Pricing", "#pricing" ]].map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
              <Link to="/school-login" onClick={() => setMenuOpen(false)}>School login</Link>
              <Link to="/register-school/plans" onClick={() => setMenuOpen(false)} className={primary}>Register your school <ArrowRight size={15} /></Link>
            </div>
          </motion.div>}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="relative px-4 pb-24 pt-14 sm:px-7 sm:pt-20 lg:px-10 lg:pb-32 lg:pt-24">
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 xl:grid-cols-[.83fr_1.17fr]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }} className="relative z-10 text-center xl:text-left">
              <div className={`mx-auto mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] backdrop-blur xl:mx-0 ${dark ? "border-blue-300/20 bg-blue-400/10 text-blue-200" : "border-blue-200 bg-white text-blue-700 shadow-sm"}`}><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" /></span> A simple system for running your school</div>
              <h1 className={`text-[43px] font-black leading-[1.02] tracking-[-.065em] sm:text-6xl lg:text-[72px] 2xl:text-[82px] ${c.heading}`}>Run your school<br/><span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">from one simple place.</span></h1>
              <p className={`mx-auto mt-7 max-w-[590px] text-base leading-8 sm:text-lg xl:mx-0 ${c.body}`}>Manage students, teachers, attendance, fees, exams and daily school work in one place. SchoolOS helps your team stay organised, save time and work with less paperwork.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row xl:justify-start">
                <Link to="/register-school/plans" className={primary}>Register your school <ArrowRight size={17} /></Link>
                <a href="#tour" className={secondary}><Play size={15} /> See the product</a>
              </div>
              <div className={`mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-bold xl:justify-start ${c.muted}`}>
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-500" /> Role-based access</span>
                <span className="flex items-center gap-2"><LockKeyhole size={14} className="text-blue-500" /> Separate school workspaces</span>
                <span className="flex items-center gap-2"><UserRoundCheck size={15} className="text-violet-500" /> Reviewed onboarding</span>
              </div>
              <div className={`mx-auto mt-8 grid max-w-[570px] grid-cols-1 gap-2.5 text-left sm:grid-cols-3 xl:mx-0 `}>
                {[[ "01", "Know what is happening", "A clearer view of daily school activity." ],[ "02", "Stay ahead of the details", "Keep records and follow-ups organised." ],[ "03", "Focus on better education", "Give your team more room to do their best work." ]].map(([n,title,desc],i)=><div key={n} className={`rounded-2xl border p-3.5 backdrop-blur ${dark?"border-white/10 bg-gradient-to-br from-blue-500/15 to-violet-500/10":"border-indigo-100 bg-white/85 shadow-sm"}`}><span className={`text-[9px] font-black ${["text-cyan-400","text-violet-400","text-emerald-500"][i]}`}>{n}</span><p className={`mt-1 text-[10px] font-extrabold ${c.heading}`}>{title}</p><p className={`mt-1 text-[9px] leading-4 ${c.muted}`}>{desc}</p></div>)}
              </div>
              <div className={`mx-auto mt-12 flex max-w-md items-center justify-center gap-5 border-t pt-6 text-left xl:mx-0 xl:justify-start ${c.line}`}>
                <div className="flex -space-x-2">{["A","T","S","P"].map((letter,i)=><span key={letter} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-black text-white ${dark?"border-[#0C1423]":"border-[#F7F8FC]"} ${["bg-blue-600","bg-violet-600","bg-cyan-600","bg-emerald-600"][i]}`}>{letter}</span>)}</div>
                <div><p className={`text-[11px] font-extrabold ${c.heading}`}>One school. One connected system</p><p className={`mt-1 text-[10px] ${c.muted}`}>For admins, teachers, students & parents</p></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: .95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .85, delay: .12 }} className="relative mx-auto w-full max-w-[850px]">
              <div className={`absolute -inset-8 rounded-[50px] bg-gradient-to-br ${c.glow} blur-3xl`} />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="relative">
                <div className={`absolute -left-8 top-[22%] z-20 hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:block ${c.panel} ${dark?"shadow-black/40":"shadow-slate-300/60"}`}>
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={16}/></span><div><p className={`text-[9px] font-bold ${c.muted}`}>Daily workflow</p><p className={`text-xs font-black ${c.heading}`}>All in one place</p></div></div>
                </div>
                <div className={`absolute -right-5 bottom-[15%] z-20 hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:block ${c.panel} ${dark?"shadow-black/40":"shadow-slate-300/60"}`}>
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><ShieldCheck size={16}/></span><div><p className={`text-[9px] font-bold ${c.muted}`}>Workspace</p><p className={`text-xs font-black ${c.heading}`}>School-specific access</p></div></div>
                </div>
                <div className={`rounded-[30px] border p-2 shadow-[0_35px_100px_-30px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:rounded-[36px] sm:p-3 ${dark?"border-white/10 bg-[#111C2E]/90":"border-white bg-white/85"}`}>
                  <div className={`overflow-hidden rounded-[23px] border sm:rounded-[28px] ${c.line} ${dark?"bg-[#080F1C]":"bg-[#F5F7FC"}`}>
                    <div className={`flex items-center justify-between border-b px-4 py-3.5 sm:px-6 ${c.line} ${dark?"bg-[#0D1728]":"bg-white"}`}>
                      <div className="flex items-center gap-2.5"><div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400"/><i className="h-2 w-2 rounded-full bg-amber-400"/><i className="h-2 w-2 rounded-full bg-emerald-400"/></div><span className={`ml-2 text-[9px] font-extrabold tracking-[.14em] ${c.muted}`}>SCHOOLOS <span className={c.faint}>/</span> COMMAND CENTRE</span></div>
                      <span className={`rounded-full px-3 py-1 text-[8px] font-extrabold uppercase tracking-wider ${dark?"bg-blue-400/10 text-blue-200":"bg-blue-50 text-blue-700"}`}>Product preview</span>
                    </div>
                    <div className="grid grid-cols-[58px_1fr] sm:grid-cols-[76px_1fr]">
                      <aside className={`flex flex-col items-center gap-5 border-r py-5 ${c.line} ${dark?"bg-[#0B1423]":"bg-white"}`}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg"><School size={19}/></div>
                        {[LayoutDashboard,GraduationCap,CalendarDays,WalletCards,BookOpen,BarChart3].map((Icon,i)=><span key={i} className={`flex h-9 w-9 items-center justify-center rounded-xl ${i===0?"bg-blue-500/15 text-blue-500":c.faint}`}><Icon size={17}/></span>)}
                        <span className={`mt-auto flex h-9 w-9 items-center justify-center rounded-xl ${c.soft} ${c.muted}`}><Settings2 size={17}/></span>
                      </aside>
                      <div className="min-w-0 p-3.5 sm:p-6">
                        <div className="flex items-center justify-between gap-3"><div><p className={`text-[8px] font-bold uppercase tracking-[.17em] ${c.muted}`}>Monday · School overview</p><h3 className={`mt-1 text-base font-black sm:text-xl ${c.heading}`}>Good morning, Admin <span>✦</span></h3><p className={`mt-1 text-[9px] ${c.muted}`}>Here is a snapshot of your school workspace.</p></div><div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Bell size={15}/><i className="absolute right-0 top-0 h-2 w-2 rounded-full border border-white bg-rose-400"/></div></div>
                        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {[[ "Students", "1,248", GraduationCap, "text-blue-500", "+12 this month" ],[ "Attendance", "94.8%", ClipboardCheck, "text-emerald-500", "Daily overview" ],[ "Fee records", "Tracked", CreditCard, "text-violet-500", "Payments & dues" ],[ "Classes", "36", Layers3, "text-amber-500", "Across sections" ]].map(([label,value,Icon,tone,sub],i)=>{const I=Icon as React.ElementType;return <div key={String(label)} className={`rounded-2xl border p-3 sm:p-3.5 ${c.line} ${dark?"bg-white/[0.035]":"bg-white"}`}><div className="flex items-center justify-between"><span className={`text-[8px] font-bold ${c.muted}`}>{String(label)}</span><I size={15} className={String(tone)}/></div><p className={`mt-3 text-lg font-black tracking-tight sm:text-xl ${c.heading}`}>{String(value)}</p><p className={`mt-1 text-[8px] ${c.faint}`}>{String(sub)}</p></div>})}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1.3fr_.7fr]">
                          <div className={`rounded-2xl border p-3.5 sm:p-4 ${c.line} ${dark?"bg-white/[0.025]":"bg-white"}`}>
                            <div className="flex items-center justify-between"><div><p className={`text-[9px] font-extrabold ${c.heading}`}>School activity</p><p className={`mt-1 text-[8px] ${c.muted}`}>Illustrative weekly overview</p></div><span className={`rounded-lg px-2 py-1 text-[8px] font-bold ${c.soft} ${c.muted}`}>This week</span></div>
                            <div className="mt-5 flex h-[105px] items-end gap-2 sm:h-[125px]">{[38,58,47,76,63,91,70].map((h,i)=><div key={i} className="flex h-full flex-1 flex-col justify-end gap-2"><div style={{height:`${h}%`}} className={`w-full rounded-t-md ${i===5?"bg-gradient-to-t from-indigo-600 to-cyan-400":"bg-gradient-to-t from-blue-600/55 to-violet-500/65"}`}/><span className={`text-center text-[7px] ${c.faint}`}>{["M","T","W","T","F","S","S"][i]}</span></div>)}</div>
                          </div>
                          <div className={`rounded-2xl border p-3.5 sm:p-4 ${c.line} ${dark?"bg-white/[0.025]":"bg-white"}`}>
                            <p className={`text-[9px] font-extrabold ${c.heading}`}>Quick actions</p><p className={`mt-1 text-[8px] ${c.muted}`}>Common school tasks</p>
                            <div className="mt-4 space-y-2">{[[Plus,"New admission","text-blue-500"],[ClipboardCheck,"Mark attendance","text-emerald-500"],[FileText,"Create report","text-violet-500"]].map(([Icon,label,tone])=>{const I=Icon as React.ElementType;return <div key={String(label)} className={`flex items-center gap-2 rounded-xl border p-2 ${c.line} ${c.soft}`}><I size={13} className={String(tone)}/><span className={`text-[8px] font-bold ${c.body}`}>{String(label)}</span><ArrowUpRight size={11} className={`ml-auto ${c.faint}`}/></div>})}</div>
                          </div>
                        </div>
                        <div className={`mt-3 flex items-center justify-between rounded-2xl border px-3.5 py-3 ${c.line} ${dark?"bg-blue-500/[0.07]":"bg-blue-50/80"}`}><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"><MessageCircle size={13}/></span><div><p className={`text-[8px] font-extrabold ${c.heading}`}>Everything connected</p><p className={`text-[7px] ${c.muted}`}>A single place for your school operations</p></div></div><ArrowUpRight size={14} className="text-blue-500"/></div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className={`mt-4 text-center text-[9px] font-semibold ${c.faint}`}>Illustrative interface preview · Not live school data</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="platform" className={`border-y py-20 ${c.line} ${dark?"bg-gradient-to-r from-[#101E2C] via-[#122A31] to-[#10232E]":"bg-gradient-to-r from-blue-50 via-violet-50 to-cyan-50"}`}>
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-7 lg:grid-cols-3 lg:px-10">
            {[
              [Command,"One connected command centre","Replace scattered registers and disconnected tools with a unified school workspace.","text-blue-500","bg-blue-500/10"],
              [MonitorSmartphone,"Designed around real roles","Purposeful experiences for administrators, teachers, students and parents.","text-violet-500","bg-violet-500/10"],
              [ShieldCheck,"Structured access & control","School-specific workspaces and role-aware permissions keep access organised.","text-emerald-500","bg-emerald-500/10"]
            ].map(([Icon,title,desc,tone,bg])=>{const I=Icon as React.ElementType;return <motion.div key={String(title)} whileHover={{y:-5}} className={`flex gap-5 rounded-[25px] border p-6 sm:p-7 ${c.card}`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${String(bg)} ${String(tone)}`}><I size={22}/></span><div><h3 className={`text-base font-black ${c.heading}`}>{String(title)}</h3><p className={`mt-2 text-xs leading-6 ${c.muted}`}>{String(desc)}</p></div></motion.div>})}
          </div>
        </section>

        <section id="features" className={`px-4 py-24 sm:px-7 lg:px-10 ${dark?"bg-gradient-to-b from-[#070B13] via-[#101E2B] to-[#0A171D]":"bg-gradient-to-b from-[#F4F6FF] via-white to-[#F0F4FF]"}`}>
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><span className={`inline-flex rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-blue-400/10 text-blue-300":"bg-blue-50 text-blue-700"}`}>The complete school toolkit</span><h2 className={`mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>Every department.<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">Finally in sync.</span></h2></div><p className={`max-w-md text-sm leading-7 lg:pb-1 ${c.muted}`}>A connected set of tools for the people, processes and decisions that keep a school moving forward.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module,index)=>{const Icon=module.icon;return <motion.article key={module.name} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.4,delay:(index%3)*.06}} whileHover={{y:-6}} className={`group relative overflow-hidden rounded-[26px] border p-6 transition duration-300 hover:border-blue-500/35 hover:shadow-2xl ${c.card} ${dark?"hover:shadow-blue-950/20":"hover:shadow-blue-950/10"}`}><div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-2xl transition group-hover:scale-150"/><div className="relative flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${colorStyles[module.color][dark?"dark":"light"]}`}><Icon size={22}/></span><span className={`flex h-8 w-8 items-center justify-center rounded-full transition group-hover:translate-x-1 group-hover:-translate-y-1 ${c.soft} ${c.faint}`}><ArrowUpRight size={15}/></span></div><p className="relative mt-7 text-[9px] font-extrabold uppercase tracking-[.15em] text-blue-500">{module.tag}</p><h3 className={`relative mt-2 text-lg font-black ${c.heading}`}>{module.name}</h3><p className={`relative mt-2 text-sm leading-6 ${c.muted}`}>{module.description}</p></motion.article>})}
            </div>
          </div>
        </section>

        {/* Campuses & Schools Directory Showcase */}
        <section id="campuses" className={`border-y px-4 py-20 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-gradient-to-r from-[#0B1522] via-[#0E1E2C] to-[#0A1724]":"bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50"}`}>
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-cyan-400/10 text-cyan-300":"bg-blue-50 text-blue-700"}`}>
                  <School size={13} /> Active Institutions
                </span>
                <h2 className={`mt-4 text-3xl font-black tracking-[-.05em] sm:text-4xl ${c.heading}`}>
                  Trusted by Forward-Thinking <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Campuses</span>
                </h2>
                <p className={`mt-3 text-sm max-w-xl ${c.muted}`}>
                  Explore live school portals and public web addresses hosted on the SchoolOS multi-tenant cloud.
                </p>
              </div>
              <Link to="/school-login" className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 transition">
                Find your campus gateway <ArrowRight size={15} />
              </Link>
            </div>

            {schoolsLoading ? (
              <div className={`p-8 text-center rounded-2xl border ${c.line} ${c.card} text-sm ${c.muted}`}>
                Checking registered school network...
              </div>
            ) : schools.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {schools.slice(0, 6).map((item) => (
                  <div key={item.id || item.slug} className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${c.card} ${c.line}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-base shadow-sm ${item.logoUrl ? "bg-white overflow-hidden p-1 border" : "bg-gradient-to-br from-blue-600 to-violet-600 text-white"}`}>
                          {item.logoUrl ? <img src={item.logoUrl} alt={item.name} className="h-full w-full object-contain" /> : item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className={`text-sm font-black line-clamp-1 ${c.heading}`}>{item.name}</h4>
                          <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${c.muted}`}>
                            <MapPin size={11} className="text-cyan-500" /> {item.city || "Pakistan"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-700/20 flex items-center justify-between text-xs font-bold">
                      <Link to={`/school/${item.slug}`} className="inline-flex items-center gap-1 text-cyan-500 hover:underline">
                        <Globe2 size={13} /> View Website
                      </Link>
                      <Link to={`/school-login/${item.slug}`} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${c.soft} ${c.body} hover:text-blue-500 transition`}>
                        Portal Login <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-2xl border ${c.line} ${c.card}`}>
                <p className={`text-sm ${c.muted}`}>Every registered institution gets a high-performance public landing page & admin portal.</p>
                <Link to="/register-school/plans" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-500">
                  Register Your School Now <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section id="tour" className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-gradient-to-br from-[#11202D] via-[#142B31] to-[#10252C]":"bg-gradient-to-br from-blue-50 via-violet-50 to-cyan-50"}`}>
          <div className="mx-auto max-w-[1440px]">
            <div className="mx-auto mb-12 max-w-3xl text-center"><span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-cyan-400/10 text-cyan-300":"bg-cyan-50 text-cyan-700"}`}><Sparkles size={13}/> A closer look</span><h2 className={`mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>See the work flow.<br/><span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Not just the promise.</span></h2><p className={`mt-4 text-sm leading-7 ${c.muted}`}>Explore illustrative previews of the key SchoolOS workflows.</p></div>
            <div className={`overflow-hidden rounded-[30px] border shadow-2xl ${c.panel}`}>
              <div className={`flex gap-2 overflow-x-auto border-b p-3 sm:p-4 ${c.line} ${dark?"bg-white/[0.02]":"bg-slate-50"}`}>{tourTabs.map((tab)=>{const Icon=tab.icon;const selected=activeTab===tab.id;return <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${selected?"bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg":c.muted+" "+(dark?"hover:bg-white/[0.06]":"hover:bg-white")}`}><Icon size={15}/>{tab.label}</button>})}</div>
              <AnimatePresence mode="wait"><motion.div key={activePreview.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.25}} className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[.85fr_1.15fr]">
                <div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-cyan-500">Interactive product tour · preview</span><h3 className={`mt-4 text-2xl font-black leading-tight sm:text-3xl ${c.heading}`}>{activePreview.title}</h3><p className={`mt-4 text-sm leading-7 ${c.muted}`}>{activePreview.description}</p><div className="mt-7 space-y-3">{["Designed for clear day-to-day workflows","Organised around school roles","Connected with the wider platform"].map((item)=><div key={item} className={`flex items-center gap-3 text-xs font-semibold ${c.body}`}><CheckCircle2 size={16} className="shrink-0 text-emerald-500"/>{item}</div>)}</div><Link to="/register-school/plans" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-blue-500">Start with SchoolOS <ArrowRight size={16}/></Link></div>
                <div className={`rounded-[24px] border p-5 sm:p-7 ${c.line} ${dark?"bg-[#080F1B]":"bg-[#F5F7FC"}`}><div className="flex items-center justify-between"><div><p className={`text-[9px] font-extrabold uppercase tracking-widest ${c.muted}`}>SchoolOS workspace</p><h4 className={`mt-1 text-base font-black ${c.heading}`}>{activePreview.label} dashboard</h4></div><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[8px] font-extrabold uppercase text-cyan-500">Preview data</span></div><div className="mt-6 grid grid-cols-2 gap-3">{activePreview.metrics.map(([label,value],index)=><div key={label} className={`rounded-2xl border p-4 ${c.line} ${dark?"bg-white/[0.025]":"bg-white"}`}><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${["bg-blue-500/10 text-blue-500","bg-violet-500/10 text-violet-500","bg-emerald-500/10 text-emerald-500","bg-amber-500/10 text-amber-500"][index]}`}><Check size={15}/></div><p className={`mt-4 text-sm font-black ${c.heading}`}>{value}</p><p className={`mt-1 text-[9px] font-semibold ${c.muted}`}>{label}</p></div>)}</div><div className={`mt-4 rounded-2xl border p-4 ${c.line} ${dark?"bg-white/[0.025]":"bg-white"}`}><div className="flex items-center justify-between"><span className={`text-[10px] font-bold ${c.body}`}>Workflow completion</span><span className="text-[10px] font-black text-cyan-500">Preview</span></div><div className={`mt-3 h-2 overflow-hidden rounded-full ${dark?"bg-white/10":"bg-slate-100"}`}><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"/></div></div></div>
              </motion.div></AnimatePresence>
            </div>
          </div>
        </section>

        <section className={`px-4 py-24 sm:px-7 lg:px-10 ${dark?"bg-gradient-to-br from-[#0A151E] via-[#12282E] to-[#10242B]":"bg-gradient-to-br from-[#EEF4FF] via-[#F8F3FF] to-[#E9FAFF]"}`}>
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-2">
            <div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">Your campus, online</span><h2 className={`mt-4 text-3xl font-black leading-tight tracking-[-.05em] sm:text-5xl ${c.heading}`}>Give your school<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">a digital front door.</span></h2><p className={`mt-5 max-w-xl text-sm leading-7 ${c.muted}`}>SchoolOS supports dedicated public school pages, giving each approved institution a place to present its identity, academic information and ways to connect.</p><div className="mt-7 space-y-3">{["Dedicated school profile and public identity","Academic levels, campus details and facilities","Admissions enquiry and portal entry points"].map((item)=><div key={item} className={`flex items-center gap-3 text-xs font-semibold ${c.body}`}><CheckCircle2 size={16} className="text-emerald-500"/>{item}</div>)}</div><Link to="/register-school/plans" className={`${primary} mt-8`}>Register your school <ArrowRight size={16}/></Link></div>
            <div className={`relative rounded-[30px] border p-4 shadow-2xl ${c.panel}`}><div className={`absolute -inset-5 -z-10 rounded-[40px] bg-gradient-to-br ${c.glow} blur-2xl`}/><div className={`flex items-center justify-between border-b px-2 pb-4 ${c.line}`}><span className={`flex items-center gap-2 text-[10px] font-bold ${c.body}`}><Globe2 size={14} className="text-cyan-500"/> School website preview</span><span className="text-[8px] font-extrabold uppercase text-emerald-500">Illustrative</span></div><div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#102C62] via-[#3146A5] to-[#6D43C7] p-7 text-center text-white sm:p-10"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/20 bg-white/15 text-2xl font-black shadow-xl backdrop-blur">S</div><p className="mt-6 text-[8px] font-extrabold uppercase tracking-[.22em] text-blue-100">Welcome to</p><h3 className="mt-2 text-2xl font-black sm:text-3xl">Your School Name</h3><p className="mt-2 text-[10px] text-blue-100">Your City, Pakistan</p><div className="mt-7 flex flex-wrap justify-center gap-2">{["Admissions","Academics","Campus life","School portal"].map((label)=><span key={label} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-bold backdrop-blur">{label}</span>)}</div><div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/15 pt-6"><div><p className="text-lg font-black">01</p><p className="mt-1 text-[8px] text-blue-100">School profile</p></div><div><p className="text-lg font-black">02</p><p className="mt-1 text-[8px] text-blue-100">Public info</p></div><div><p className="text-lg font-black">03</p><p className="mt-1 text-[8px] text-blue-100">Portal access</p></div></div></div></div>
          </div>
        </section>

        <section id="how-it-works" className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-gradient-to-r from-[#10202B] via-[#152A31] to-[#10262D]":"bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50"}`}>
          <div className="mx-auto max-w-[1440px]"><div className="mx-auto mb-14 max-w-3xl text-center"><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-cyan-500">A clear start</span><h2 className={`mt-4 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>From application to<br/>your own school workspace.</h2><p className={`mt-4 text-sm ${c.muted}`}>A reviewed onboarding process helps each school get started with clarity.</p></div><div className="grid gap-4 md:grid-cols-3">{[[ "01","Choose a plan","Review the available plans and select the option that fits your school.",CreditCard ],[ "02","Submit your application","Share your school information and submit it for review.",ClipboardCheck ],[ "03","Get your workspace","After approval, your school administrator can begin setup.",Zap ]].map(([number,title,description,Icon],i)=>{const I=Icon as React.ElementType;return <motion.div key={String(number)} whileHover={{y:-5}} className={`relative overflow-hidden rounded-[26px] border p-7 ${c.card}`}><span className="absolute -right-3 -top-8 text-[100px] font-black leading-none text-blue-500/[0.06]">{String(number)}</span><div className="relative flex items-center justify-between"><span className="text-3xl font-black text-blue-500/50">{String(number)}</span><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark?"bg-white/[0.05] text-cyan-300":"bg-blue-50 text-blue-600"}`}><I size={21}/></span></div><h3 className={`relative mt-8 text-lg font-black ${c.heading}`}>{String(title)}</h3><p className={`relative mt-2 text-sm leading-6 ${c.muted}`}>{String(description)}</p>{i<2&&<div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-blue-500 to-violet-500 md:block"/>}</motion.div>})}</div></div>
        </section>

        <section id="pricing" className={`px-4 py-24 sm:px-7 lg:px-10 ${dark?"bg-gradient-to-b from-[#080D1B] via-[#101B34] to-[#0B1427]":"bg-gradient-to-b from-[#F4F6FF] via-white to-[#F1F4FF]"}`}>
          <div className="mx-auto max-w-[1440px]"><div className="mx-auto mb-12 max-w-3xl text-center"><span className={`inline-flex rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-blue-400/10 text-blue-300":"bg-blue-50 text-blue-700"}`}>Transparent plans</span><h2 className={`mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>The right plan for<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">your next chapter.</span></h2><p className={`mt-4 text-sm leading-7 ${c.muted}`}>Review the current plans provided by SchoolOS and choose the best fit for your school.</p></div>
            {plansLoading ? <div className={`rounded-2xl border p-10 text-center text-sm ${c.line} ${c.muted}`}>Loading available plans…</div> : plans.length > 0 ? <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">{plans.map((plan)=>{const featured=featuredPlan?.id===plan.id;return <div key={plan.id||plan.planKey} className={`relative overflow-hidden rounded-[28px] border p-7 shadow-xl transition hover:-translate-y-1 ${featured?"border-blue-500/60 shadow-blue-900/15":c.card} ${featured&&dark?"bg-[#101D32]":""}`}>{featured&&<div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-[8px] font-extrabold uppercase tracking-wider text-white">Recommended</div>}<p className={`text-sm font-extrabold ${c.heading}`}>{plan.name}</p><div className="mt-5 flex items-end gap-2"><span className={`text-4xl font-black tracking-tight ${c.heading}`}>{plan.price===0?"Free":`PKR ${formatPrice(plan.price)}`}</span><span className={`pb-1 text-xs ${c.muted}`}>/ {plan.period||"month"}</span></div><p className={`mt-3 text-xs ${c.muted}`}>{plan.maxStudents>0?`Up to ${plan.maxStudents.toLocaleString("en-PK")} students`:"Student capacity as configured"}</p><div className={`my-6 border-t ${c.line}`}/><div className="space-y-3">{(plan.features||[]).slice(0,7).map((feature)=><div key={feature} className={`flex items-start gap-2 text-xs ${c.body}`}><Check size={14} className="mt-0.5 shrink-0 text-emerald-500"/>{feature}</div>)}</div><button onClick={()=>choosePlan(plan.planKey)} className={`${featured?primary:secondary} mt-8 w-full`}>Choose this plan <ArrowRight size={15}/></button></div>})}</div> : <div className={`mx-auto max-w-2xl rounded-[25px] border p-8 text-center ${c.panel}`}><CircleHelp size={28} className="mx-auto text-blue-500"/><h3 className={`mt-4 text-xl font-black ${c.heading}`}>Plans are being prepared</h3><p className={`mt-2 text-sm ${c.muted}`}>You can still explore SchoolOS or continue through the registration process.</p><Link to="/register-school/plans" className={`${primary} mt-6`}>View registration <ArrowRight size={15}/></Link></div>}
          </div>
        </section>

        <section className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-gradient-to-br from-[#10202D] via-[#172B31] to-[#10272E]":"bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50"}`}><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">Questions, answered</span><h2 className={`mt-4 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>Good decisions<br/>start with clarity.</h2><p className={`mt-4 text-sm leading-7 ${c.muted}`}>A few answers to common questions about the SchoolOS platform and getting started.</p><div className={`mt-7 flex items-center gap-2 text-xs font-bold ${c.muted}`}><ShieldCheck size={16} className="text-emerald-500"/> Reviewed school onboarding</div></div><div className="space-y-3">{faqs.map((faq,index)=><div key={faq.question} className={`overflow-hidden rounded-2xl border ${c.card}`}><button onClick={()=>setOpenFaq(openFaq===index?null:index)} className="flex w-full items-center justify-between gap-4 p-5 text-left"><span className={`text-sm font-extrabold ${c.heading}`}>{faq.question}</span><ChevronDown size={17} className={`shrink-0 transition ${c.muted} ${openFaq===index?"rotate-180":""}`}/></button><AnimatePresence initial={false}>{openFaq===index&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className={`px-5 pb-5 text-sm leading-7 ${c.muted}`}>{faq.answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

        <section className="px-4 py-24 sm:px-7 lg:px-10"><div className="mx-auto max-w-[1440px]"><div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0E5B69] via-[#087F78] to-[#145B68] px-7 py-16 text-center text-white shadow-2xl shadow-teal-950/35 sm:px-14 sm:py-20"><div className="absolute -left-24 -top-32 h-80 w-80 rounded-full border-[35px] border-white/[0.08]"/><div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"/><div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)",backgroundSize:"22px 22px"}}/><div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em]"><Star size={12}/> Bring clarity to your school operations</span><h2 className="mt-6 text-3xl font-black leading-tight tracking-[-.05em] sm:text-5xl">You started a school to shape futures.<br/>Let SchoolOS help you lead it.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100">Your time belongs in classrooms, leadership and student success — not buried under registers and repeated follow-ups. Take the next step towards a more organised school.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register-school/plans" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-1">Register your school <ArrowRight size={16}/></Link><Link to="/school-login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">School login</Link></div></div></div></div></section>
      </main>

      <footer className={`relative z-10 border-t py-14 ${c.footer} ${c.line}`}>
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-7 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
          <div><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#07131F]"><img src="/logo.svg" alt="" className="h-full w-full object-cover"/></span><b className={`text-lg font-black ${c.heading}`}>SchoolOS</b></Link><p className={`mt-4 max-w-xs text-xs leading-6 ${c.muted}`}>A connected school management platform for academic, administrative and financial workflows.</p></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Platform</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><a href="#features">Modules</a><a href="#tour">Product tour</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Portals</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><Link to="/school-login">School login</Link><Link to="/portal">Parent & student portal</Link><Link to="/admin-login">Super Admin</Link></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Get started</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><Link to="/register-school/plans">Register school</Link><Link to="/school-login">Sign in</Link><button onClick={toggleTheme} className="flex items-center gap-2 text-left hover:text-blue-500">{dark?<Sun size={13}/>:<Moon size={13}/>} Switch to {dark?"light":"dark"} theme</button></div></div>
        </div>
        <div className={`mx-auto mt-10 flex max-w-[1440px] flex-col justify-between gap-3 border-t px-4 pt-6 text-[9px] font-semibold sm:flex-row sm:px-7 lg:px-10 ${c.line} ${c.faint}`}><span>© {new Date().getFullYear()} SchoolOS. All rights reserved.</span><span>Secure access · Role-based workflows · School-specific workspaces</span></div>
      </footer>
    </div>
  );
}
