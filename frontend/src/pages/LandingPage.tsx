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
  TrendingUp, FileText, UserRoundCheck, Command, Play, Plus
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
  { question: "Can we see the plans before registering?", answer: "Yes. Available public plans are loaded from the platform. You can review current plan details and continue to the school registration flow." },
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("schoolos-landing-theme");
      if (saved === "light") setDark(false);
      if (saved === "dark") setDark(true);
    } catch { /* Theme preference is optional. */ }
  }, []);

  const toggleTheme = () => setDark((previous) => {
    const next = !previous;
    try { window.localStorage.setItem("schoolos-landing-theme", next ? "dark" : "light"); } catch { /* ignore */ }
    return next;
  });

  useEffect(() => {
    let active = true;
    apiClient.get<PublicPlan[]>("/public/plans")
      .then((response) => { if (active) setPlans(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setPlans([]); })
      .finally(() => { if (active) setPlansLoading(false); });
    return () => { active = false; };
  }, []);

  const activePreview = tourTabs.find((tab) => tab.id === activeTab) || tourTabs[0];
  const featuredPlan = useMemo(
    () => plans.find((plan) => plan.planKey === "PROFESSIONAL" && plan.price === 3000) || plans.find((plan) => plan.price > 0) || plans[0],
    [plans]
  );

  const choosePlan = (planKey: string) => {
    sessionStorage.setItem("edusphere_registration_plan", planKey);
    navigate("/register-school/form?plan=" + encodeURIComponent(planKey));
  };

  const c = dark ? {
    bg: "bg-[#070B16]", header: "border-white/[0.07] bg-[#080E1B]/85", panel: "border-white/[0.09] bg-[#0D1526]",
    panel2: "border-white/[0.08] bg-[#101B30]", card: "border-white/[0.08] bg-[#0C1423]",
    heading: "text-white", body: "text-slate-300", muted: "text-slate-400", faint: "text-slate-500",
    line: "border-white/[0.08]", soft: "bg-white/[0.045]", footer: "bg-[#080D18]",
    glow: "from-blue-500/20 via-violet-500/14 to-cyan-400/12", grid: "rgba(148,163,184,.12)"
  } : {
    bg: "bg-[#F7F8FC]", header: "border-slate-200/80 bg-white/85", panel: "border-slate-200 bg-white",
    panel2: "border-slate-200 bg-[#F2F5FB]", card: "border-slate-200 bg-white",
    heading: "text-[#10182D]", body: "text-slate-600", muted: "text-slate-500", faint: "text-slate-400",
    line: "border-slate-200", soft: "bg-slate-100", footer: "bg-white",
    glow: "from-blue-200/65 via-violet-200/45 to-cyan-100/65", grid: "rgba(100,116,139,.12)"
  };

  const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_-12px_rgba(79,70,229,.75)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-12px_rgba(79,70,229,.8)]";
  const secondary = `inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5 ${dark ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"}`;

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans transition-colors duration-500 ${c.bg} ${dark ? "text-white" : "text-[#10182D]"}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute -top-72 left-[12%] h-[720px] w-[720px] rounded-full bg-gradient-to-br ${c.glow} blur-[120px]`} />
        <div className={`absolute right-[-320px] top-[28%] h-[700px] w-[700px] rounded-full bg-gradient-to-br ${c.glow} blur-[130px]`} />
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `linear-gradient(${c.grid} 1px, transparent 1px),linear-gradient(90deg,${c.grid} 1px, transparent 1px)`, backgroundSize: "64px 64px", maskImage: "linear-gradient(to bottom, black, transparent 72%)" }} />
      </div>

      <header className={`sticky top-0 z-50 border-b backdrop-blur-2xl ${c.header}`}>
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-blue-600/25 transition group-hover:rotate-[-5deg]">
              <img src="/logo.svg" alt="SchoolOS" className="h-7 w-7 brightness-0 invert" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#111827] bg-cyan-300" />
            </span>
            <span><span className={`block text-[21px] font-black leading-none tracking-tight ${c.heading}`}>SchoolOS</span><span className={`mt-1 block text-[9px] font-bold uppercase tracking-[.22em] ${c.muted}`}>School operating system</span></span>
          </Link>

          <nav className={`hidden items-center gap-8 text-[12px] font-bold lg:flex ${c.muted}`}>
            <a href="#platform" className="transition hover:text-blue-500">Platform</a>
            <a href="#features" className="transition hover:text-blue-500">Modules</a>
            <a href="#tour" className="transition hover:text-blue-500">Product tour</a>
            <a href="#how-it-works" className="transition hover:text-blue-500">How it works</a>
            <a href="#pricing" className="transition hover:text-blue-500">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
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
              <div className={`mx-auto mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] backdrop-blur xl:mx-0 ${dark ? "border-blue-300/20 bg-blue-400/10 text-blue-200" : "border-blue-200 bg-white text-blue-700 shadow-sm"}`}><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" /></span> The operating system for modern schools</div>
              <h1 className={`text-[46px] font-black leading-[1.02] tracking-[-.065em] sm:text-6xl lg:text-[76px] 2xl:text-[88px] ${c.heading}`}>Run your school.<br /><span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Not the chaos.</span></h1>
              <p className={`mx-auto mt-7 max-w-[560px] text-base leading-8 sm:text-lg xl:mx-0 ${c.body}`}>One connected platform for student records, attendance, fees, examinations and the everyday work behind a well-run school.</p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row xl:justify-start">
                <Link to="/register-school/plans" className={primary}>Build your school workspace <ArrowRight size={17} /></Link>
                <a href="#tour" className={secondary}><Play size={15} /> Explore the product</a>
              </div>
              <div className={`mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-bold xl:justify-start ${c.muted}`}>
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-500" /> Role-based access</span>
                <span className="flex items-center gap-2"><LockKeyhole size={14} className="text-blue-500" /> Separate school workspaces</span>
                <span className="flex items-center gap-2"><UserRoundCheck size={15} className="text-violet-500" /> Reviewed onboarding</span>
              </div>
              <div className={`mx-auto mt-12 flex max-w-md items-center justify-center gap-5 border-t pt-6 text-left xl:mx-0 xl:justify-start ${c.line}`}>
                <div className="flex -space-x-2">{["A","T","S","P"].map((letter,i)=><span key={letter} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-black text-white ${dark?"border-[#0C1423]":"border-[#F7F8FC]"} ${["bg-blue-600","bg-violet-600","bg-cyan-600","bg-emerald-600"][i]}`}>{letter}</span>)}</div>
                <div><p className={`text-[11px] font-extrabold ${c.heading}`}>One connected experience</p><p className={`mt-1 text-[10px] ${c.muted}`}>For admins, teachers, students & parents</p></div>
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

        <section id="platform" className={`border-y py-20 ${c.line} ${dark?"bg-white/[0.018]":"bg-white/80"}`}>
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-7 lg:grid-cols-3 lg:px-10">
            {[
              [Command,"One connected command centre","Replace scattered registers and disconnected tools with a unified school workspace.","text-blue-500","bg-blue-500/10"],
              [MonitorSmartphone,"Designed around real roles","Purposeful experiences for administrators, teachers, students and parents.","text-violet-500","bg-violet-500/10"],
              [ShieldCheck,"Structured access & control","School-specific workspaces and role-aware permissions keep access organised.","text-emerald-500","bg-emerald-500/10"]
            ].map(([Icon,title,desc,tone,bg])=>{const I=Icon as React.ElementType;return <motion.div key={String(title)} whileHover={{y:-5}} className={`flex gap-5 rounded-[25px] border p-6 sm:p-7 ${c.card}`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${String(bg)} ${String(tone)}`}><I size={22}/></span><div><h3 className={`text-base font-black ${c.heading}`}>{String(title)}</h3><p className={`mt-2 text-xs leading-6 ${c.muted}`}>{String(desc)}</p></div></motion.div>})}
          </div>
        </section>

        <section id="features" className="px-4 py-24 sm:px-7 lg:px-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><span className={`inline-flex rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-blue-400/10 text-blue-300":"bg-blue-50 text-blue-700"}`}>The complete school toolkit</span><h2 className={`mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>Every department.<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">Finally in sync.</span></h2></div><p className={`max-w-md text-sm leading-7 lg:pb-1 ${c.muted}`}>A connected set of tools for the people, processes and decisions that keep a school moving forward.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module,index)=>{const Icon=module.icon;return <motion.article key={module.name} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.4,delay:(index%3)*.06}} whileHover={{y:-6}} className={`group relative overflow-hidden rounded-[26px] border p-6 transition duration-300 hover:border-blue-500/35 hover:shadow-2xl ${c.card} ${dark?"hover:shadow-blue-950/20":"hover:shadow-blue-950/10"}`}><div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-2xl transition group-hover:scale-150"/><div className="relative flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${colorStyles[module.color][dark?"dark":"light"]}`}><Icon size={22}/></span><span className={`flex h-8 w-8 items-center justify-center rounded-full transition group-hover:translate-x-1 group-hover:-translate-y-1 ${c.soft} ${c.faint}`}><ArrowUpRight size={15}/></span></div><p className="relative mt-7 text-[9px] font-extrabold uppercase tracking-[.15em] text-blue-500">{module.tag}</p><h3 className={`relative mt-2 text-lg font-black ${c.heading}`}>{module.name}</h3><p className={`relative mt-2 text-sm leading-6 ${c.muted}`}>{module.description}</p></motion.article>})}
            </div>
          </div>
        </section>

        <section id="tour" className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-white/[0.018]":"bg-white/80"}`}>
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

        <section className="px-4 py-24 sm:px-7 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-2">
            <div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">Your campus, online</span><h2 className={`mt-4 text-3xl font-black leading-tight tracking-[-.05em] sm:text-5xl ${c.heading}`}>Give your school<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">a digital front door.</span></h2><p className={`mt-5 max-w-xl text-sm leading-7 ${c.muted}`}>SchoolOS supports dedicated public school pages, giving each approved institution a place to present its identity, academic information and ways to connect.</p><div className="mt-7 space-y-3">{["Dedicated school profile and public identity","Academic levels, campus details and facilities","Admissions enquiry and portal entry points"].map((item)=><div key={item} className={`flex items-center gap-3 text-xs font-semibold ${c.body}`}><CheckCircle2 size={16} className="text-emerald-500"/>{item}</div>)}</div><Link to="/register-school/plans" className={`${primary} mt-8`}>Register your school <ArrowRight size={16}/></Link></div>
            <div className={`relative rounded-[30px] border p-4 shadow-2xl ${c.panel}`}><div className={`absolute -inset-5 -z-10 rounded-[40px] bg-gradient-to-br ${c.glow} blur-2xl`}/><div className={`flex items-center justify-between border-b px-2 pb-4 ${c.line}`}><span className={`flex items-center gap-2 text-[10px] font-bold ${c.body}`}><Globe2 size={14} className="text-cyan-500"/> School website preview</span><span className="text-[8px] font-extrabold uppercase text-emerald-500">Illustrative</span></div><div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br from-[#102C62] via-[#3146A5] to-[#6D43C7] p-7 text-center text-white sm:p-10"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/20 bg-white/15 text-2xl font-black shadow-xl backdrop-blur">S</div><p className="mt-6 text-[8px] font-extrabold uppercase tracking-[.22em] text-blue-100">Welcome to</p><h3 className="mt-2 text-2xl font-black sm:text-3xl">Your School Name</h3><p className="mt-2 text-[10px] text-blue-100">Your City, Pakistan</p><div className="mt-7 flex flex-wrap justify-center gap-2">{["Admissions","Academics","Campus life","School portal"].map((label)=><span key={label} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-bold backdrop-blur">{label}</span>)}</div><div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/15 pt-6"><div><p className="text-lg font-black">01</p><p className="mt-1 text-[8px] text-blue-100">School profile</p></div><div><p className="text-lg font-black">02</p><p className="mt-1 text-[8px] text-blue-100">Public info</p></div><div><p className="text-lg font-black">03</p><p className="mt-1 text-[8px] text-blue-100">Portal access</p></div></div></div></div>
          </div>
        </section>

        <section id="how-it-works" className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-white/[0.018]":"bg-white/80"}`}>
          <div className="mx-auto max-w-[1440px]"><div className="mx-auto mb-14 max-w-3xl text-center"><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-cyan-500">A clear start</span><h2 className={`mt-4 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>From application to<br/>your own school workspace.</h2><p className={`mt-4 text-sm ${c.muted}`}>A reviewed onboarding process helps each school get started with clarity.</p></div><div className="grid gap-4 md:grid-cols-3">{[[ "01","Choose a plan","Review the available plans and select the option that fits your school.",CreditCard ],[ "02","Submit your application","Share your school information and submit it for review.",ClipboardCheck ],[ "03","Get your workspace","After approval, your school administrator can begin setup.",Zap ]].map(([number,title,description,Icon],i)=>{const I=Icon as React.ElementType;return <motion.div key={String(number)} whileHover={{y:-5}} className={`relative overflow-hidden rounded-[26px] border p-7 ${c.card}`}><span className="absolute -right-3 -top-8 text-[100px] font-black leading-none text-blue-500/[0.06]">{String(number)}</span><div className="relative flex items-center justify-between"><span className="text-3xl font-black text-blue-500/50">{String(number)}</span><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark?"bg-white/[0.05] text-cyan-300":"bg-blue-50 text-blue-600"}`}><I size={21}/></span></div><h3 className={`relative mt-8 text-lg font-black ${c.heading}`}>{String(title)}</h3><p className={`relative mt-2 text-sm leading-6 ${c.muted}`}>{String(description)}</p>{i<2&&<div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-blue-500 to-violet-500 md:block"/>}</motion.div>})}</div></div>
        </section>

        <section id="pricing" className="px-4 py-24 sm:px-7 lg:px-10">
          <div className="mx-auto max-w-[1440px]"><div className="mx-auto mb-12 max-w-3xl text-center"><span className={`inline-flex rounded-full px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] ${dark?"bg-blue-400/10 text-blue-300":"bg-blue-50 text-blue-700"}`}>Transparent plans</span><h2 className={`mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>The right plan for<br/><span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">your next chapter.</span></h2><p className={`mt-4 text-sm leading-7 ${c.muted}`}>Review the current plans provided by SchoolOS and choose the best fit for your school.</p></div>
            {plansLoading ? <div className={`rounded-2xl border p-10 text-center text-sm ${c.line} ${c.muted}`}>Loading available plans…</div> : plans.length > 0 ? <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">{plans.map((plan)=>{const featured=featuredPlan?.id===plan.id;return <div key={plan.id||plan.planKey} className={`relative overflow-hidden rounded-[28px] border p-7 shadow-xl transition hover:-translate-y-1 ${featured?"border-blue-500/60 shadow-blue-900/15":c.card} ${featured&&dark?"bg-[#101D32]":""}`}>{featured&&<div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-[8px] font-extrabold uppercase tracking-wider text-white">Recommended</div>}<p className={`text-sm font-extrabold ${c.heading}`}>{plan.name}</p><div className="mt-5 flex items-end gap-2"><span className={`text-4xl font-black tracking-tight ${c.heading}`}>{plan.price===0?"Free":`PKR ${formatPrice(plan.price)}`}</span><span className={`pb-1 text-xs ${c.muted}`}>/ {plan.period||"month"}</span></div><p className={`mt-3 text-xs ${c.muted}`}>{plan.maxStudents>0?`Up to ${plan.maxStudents.toLocaleString("en-PK")} students`:"Student capacity as configured"}</p><div className={`my-6 border-t ${c.line}`}/><div className="space-y-3">{(plan.features||[]).slice(0,7).map((feature)=><div key={feature} className={`flex items-start gap-2 text-xs ${c.body}`}><Check size={14} className="mt-0.5 shrink-0 text-emerald-500"/>{feature}</div>)}</div><button onClick={()=>choosePlan(plan.planKey)} className={`${featured?primary:secondary} mt-8 w-full`}>Choose this plan <ArrowRight size={15}/></button></div>})}</div> : <div className={`mx-auto max-w-2xl rounded-[25px] border p-8 text-center ${c.panel}`}><CircleHelp size={28} className="mx-auto text-blue-500"/><h3 className={`mt-4 text-xl font-black ${c.heading}`}>Plans are being prepared</h3><p className={`mt-2 text-sm ${c.muted}`}>You can still explore SchoolOS or continue through the registration process.</p><Link to="/register-school/plans" className={`${primary} mt-6`}>View registration <ArrowRight size={15}/></Link></div>}
          </div>
        </section>

        <section className={`border-y px-4 py-24 sm:px-7 lg:px-10 ${c.line} ${dark?"bg-white/[0.018]":"bg-white/80"}`}><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><span className="text-[9px] font-extrabold uppercase tracking-[.17em] text-violet-500">Questions, answered</span><h2 className={`mt-4 text-3xl font-black tracking-[-.05em] sm:text-5xl ${c.heading}`}>Good decisions<br/>start with clarity.</h2><p className={`mt-4 text-sm leading-7 ${c.muted}`}>A few answers to common questions about the SchoolOS platform and getting started.</p><div className={`mt-7 flex items-center gap-2 text-xs font-bold ${c.muted}`}><ShieldCheck size={16} className="text-emerald-500"/> Reviewed school onboarding</div></div><div className="space-y-3">{faqs.map((faq,index)=><div key={faq.question} className={`overflow-hidden rounded-2xl border ${c.card}`}><button onClick={()=>setOpenFaq(openFaq===index?null:index)} className="flex w-full items-center justify-between gap-4 p-5 text-left"><span className={`text-sm font-extrabold ${c.heading}`}>{faq.question}</span><ChevronDown size={17} className={`shrink-0 transition ${c.muted} ${openFaq===index?"rotate-180":""}`}/></button><AnimatePresence initial={false}>{openFaq===index&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className={`px-5 pb-5 text-sm leading-7 ${c.muted}`}>{faq.answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

        <section className="px-4 py-24 sm:px-7 lg:px-10"><div className="mx-auto max-w-[1440px]"><div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#1646A5] via-[#4338CA] to-[#7138B8] px-7 py-16 text-center text-white shadow-2xl shadow-blue-900/25 sm:px-14 sm:py-20"><div className="absolute -left-24 -top-32 h-80 w-80 rounded-full border-[35px] border-white/[0.08]"/><div className="absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"/><div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)",backgroundSize:"22px 22px"}}/><div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em]"><Star size={12}/> Bring clarity to your school operations</span><h2 className="mt-6 text-3xl font-black leading-tight tracking-[-.05em] sm:text-5xl">Your school has a lot to manage.<br/>Your software should make it easier.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100">Start with a school registration application and take the first step towards a more connected way of working.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register-school/plans" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-1">Register your school <ArrowRight size={16}/></Link><Link to="/school-login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15">School login</Link></div></div></div></div></section>
      </main>

      <footer className={`relative z-10 border-t py-14 ${c.footer} ${c.line}`}>
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-7 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
          <div><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600"><img src="/logo.svg" alt="" className="h-6 w-6 brightness-0 invert"/></span><b className={`text-lg font-black ${c.heading}`}>SchoolOS</b></Link><p className={`mt-4 max-w-xs text-xs leading-6 ${c.muted}`}>A connected school management platform for academic, administrative and financial workflows.</p></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Platform</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><a href="#features">Modules</a><a href="#tour">Product tour</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Portals</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><Link to="/school-login">School login</Link><Link to="/portal">Parent & student portal</Link><Link to="/admin-login">Super Admin</Link></div></div>
          <div><b className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${c.heading}`}>Get started</b><div className={`mt-4 flex flex-col gap-3 text-xs font-semibold ${c.muted}`}><Link to="/register-school/plans">Register school</Link><Link to="/school-login">Sign in</Link><button onClick={toggleTheme} className="flex items-center gap-2 text-left hover:text-blue-500">{dark?<Sun size={13}/>:<Moon size={13}/>} Switch to {dark?"light":"dark"} theme</button></div></div>
        </div>
        <div className={`mx-auto mt-10 flex max-w-[1440px] flex-col justify-between gap-3 border-t px-4 pt-6 text-[9px] font-semibold sm:flex-row sm:px-7 lg:px-10 ${c.line} ${c.faint}`}><span>© {new Date().getFullYear()} SchoolOS. All rights reserved.</span><span>Secure access · Role-based workflows · School-specific workspaces</span></div>
      </footer>
    </div>
  );
}
