import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Sparkles, ShieldCheck, GraduationCap, Users,
  WalletCards, CheckCircle2, CalendarDays, BookOpen, Menu, X, Search,
  ChevronDown, BarChart3, ClipboardCheck, Bus, Library, Globe2, LockKeyhole,
  LayoutDashboard, CreditCard, BellRing, ChartNoAxesCombined, School,
  UserRoundCheck, Clock3, Layers3, MonitorSmartphone, Star, Check
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
  { icon: GraduationCap, title: "Student management", desc: "Admissions, student profiles, guardians, class placement and complete academic history.", tone: "blue", tag: "Admissions to alumni" },
  { icon: ClipboardCheck, title: "Attendance", desc: "Daily class-wise attendance, leave tracking, summaries and printable registers.", tone: "violet", tag: "Daily operations" },
  { icon: WalletCards, title: "Fee & finance", desc: "Fee structures, monthly vouchers, payment records, dues and financial reports.", tone: "emerald", tag: "Accounts & collection" },
  { icon: BookOpen, title: "Exams & results", desc: "Exam schedules, subject marks, grading, report cards and DMC generation.", tone: "amber", tag: "Academic performance" },
  { icon: CalendarDays, title: "Timetable & classes", desc: "Organise classes, sections, subjects, teacher assignments and daily schedules.", tone: "cyan", tag: "Academic planning" },
  { icon: Users, title: "Staff & HR", desc: "Teacher and staff records, roles, departments and staff-related operations.", tone: "rose", tag: "People management" },
  { icon: Bus, title: "Transport", desc: "Manage routes, vehicles and transport-related student information.", tone: "blue", tag: "Campus movement" },
  { icon: Library, title: "Library & resources", desc: "Keep learning resources and library operations organised in one place.", tone: "violet", tag: "Learning resources" },
  { icon: BarChart3, title: "Reports & insights", desc: "Review academic, attendance and financial information with structured reports.", tone: "emerald", tag: "School intelligence" },
];

const previewTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, heading: "A clearer picture of your school day", detail: "Bring essential school activity into one organised workspace.", stats: [["Students", "1,248", "Sample records"], ["Attendance", "94.8%", "Sample daily view"], ["Fee collection", "PKR 8.4M", "Sample ledger"], ["Classes", "36", "Sample setup"]] },
  { id: "students", label: "Students", icon: GraduationCap, heading: "Every student record, organised", detail: "Explore how admissions, guardian information and class placement fit together.", stats: [["Admissions", "128", "Illustrative"], ["Active classes", "36", "Illustrative"], ["Guardians", "1,096", "Illustrative"], ["Profiles", "1,248", "Illustrative"]] },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck, heading: "Attendance without paper registers", detail: "A sample view of daily attendance, class summaries and absence tracking.", stats: [["Present", "1,182", "Sample day"], ["Absent", "42", "Sample day"], ["On leave", "24", "Sample day"], ["Attendance", "94.8%", "Sample day"]] },
  { id: "fees", label: "Fees", icon: WalletCards, heading: "Fee records that stay in order", detail: "Review sample fee collection, outstanding dues and voucher workflows.", stats: [["Collected", "PKR 8.4M", "Sample month"], ["Outstanding", "PKR 1.2M", "Sample month"], ["Vouchers", "1,248", "Sample batch"], ["Paid", "87%", "Sample month"]] },
  { id: "exams", label: "Exams", icon: BookOpen, heading: "From marks entry to report cards", detail: "A sample examination workspace for schedules, subject marks and results.", stats: [["Exams", "03", "Sample session"], ["Subjects", "12", "Sample setup"], ["Results", "Ready", "Preview state"], ["DMC", "PDF", "Preview output"]] },
];

const faqs = [
  { q: "What is SchoolOS?", a: "SchoolOS is a multi-school management platform that brings student records, attendance, fees, examinations, staff and daily school operations into one workspace." },
  { q: "Can any school register itself?", a: "A school can submit its registration application. The SchoolOS Super Admin reviews the application before the school workspace is activated." },
  { q: "When can we start using the system?", a: "After your school application is reviewed and approved, your administrator can access the school workspace and begin setup." },
  { q: "Can teachers, parents and students have separate access?", a: "SchoolOS is designed with role-based access and separate workflows for school administrators, teachers, students and parents, where enabled for the school." },
  { q: "Are the dashboard numbers on this page real customer records?", a: "No. Numbers shown inside product mockups are illustrative sample data used to demonstrate the interface. They are not live customer or database totals." },
];

const toneClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    apiClient.get<PublicPlan[]>("/public/plans")
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const monthlyPlan = plans.find((plan) => plan.planKey === "PROFESSIONAL" && plan.price === 3000)
    || plans.find((plan) => plan.price > 0);

  const handlePlanSelect = (planKey: string) => {
    sessionStorage.setItem("edusphere_registration_plan", planKey);
    navigate("/register-school/form?plan=" + encodeURIComponent(planKey));
  };

  const selectedPreview = previewTabs.find((tab) => tab.id === activeTab) || previewTabs[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFF] font-sans text-[#101B36] selection:bg-blue-600 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 left-[38%] h-[620px] w-[620px] rounded-full bg-blue-200/35 blur-[110px]" />
        <div className="absolute right-[-180px] top-[34%] h-[540px] w-[540px] rounded-full bg-violet-200/30 blur-[110px]" />
        <div className="absolute bottom-[-180px] left-[-160px] h-[520px] w-[520px] rounded-full bg-cyan-100/60 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(100,116,139,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,.12)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,.04)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-blue-600/20 transition-transform group-hover:-rotate-3 group-hover:scale-105">
              <img src="/logo.svg" alt="SchoolOS" className="h-7 w-7 brightness-0 invert" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-300" />
            </span>
            <span>
              <span className="block text-[21px] font-black leading-none tracking-tight text-[#111B36]">SchoolOS</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.19em] text-slate-500">School operating system</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-slate-600 lg:flex">
            <a href="#platform" className="transition hover:text-blue-600">Platform</a>
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#preview" className="transition hover:text-blue-600">Product tour</a>
            <a href="#process" className="transition hover:text-blue-600">How it works</a>
            <a href="#pricing" className="transition hover:text-blue-600">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link to="/school-login" className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Sign in</Link>
            <Link to="/register-school/plans" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl">
              Register your school <ArrowUpRight size={15} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 md:hidden" aria-label="Toggle navigation">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100 bg-white px-5 py-5 md:hidden">
              <div className="flex flex-col gap-4 text-sm font-semibold text-slate-700">
                {["Platform", "Features", "Product tour", "How it works", "Pricing"].map((item) => <a key={item} href={"#" + (item === "Product tour" ? "preview" : item === "How it works" ? "process" : item.toLowerCase())} onClick={() => setMobileMenuOpen(false)}>{item}</a>)}
                <Link to="/school-login" onClick={() => setMobileMenuOpen(false)}>School login</Link>
                <Link to="/register-school/plans" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-white">Register your school</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="relative px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[.92fr_1.08fr]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10 text-center lg:text-left">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.13em] text-blue-700 shadow-sm shadow-blue-900/5 backdrop-blur">
                <Sparkles size={14} className="text-violet-600" /> One workspace. Every school operation.
              </div>
              <h1 className="text-[43px] font-black leading-[1.06] tracking-[-.055em] text-[#111B36] sm:text-6xl lg:text-[68px]">
                Run your school
                <span className="mt-1 block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text pb-2 text-transparent">with clarity.</span>
                <span className="block text-[34px] leading-tight tracking-[-.045em] text-slate-700 sm:text-5xl lg:text-[53px]">Teach more. Manage less.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
                A connected school management platform for admissions, attendance, fees, examinations, staff and parent communication — designed to make everyday school work feel simpler.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/register-school/plans" className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-4 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(79,70,229,.25)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(79,70,229,.32)]">
                  Get started <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </Link>
                <a href="#preview" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:text-blue-700">
                  Explore the platform <ChevronDown size={17} />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[11px] font-bold text-slate-500 lg:justify-start">
                <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Role-based access</span>
                <span className="flex items-center gap-1.5"><LockKeyhole size={14} className="text-blue-500" /> School data separation</span>
                <span className="flex items-center gap-1.5"><UserRoundCheck size={15} className="text-violet-500" /> Approval-led onboarding</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: .94, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, delay: .12 }} className="relative mx-auto w-full max-w-[680px]">
              <div className="absolute -inset-8 rounded-[44px] bg-gradient-to-br from-blue-300/40 via-violet-300/35 to-cyan-200/45 blur-3xl" />
              <div className="absolute -right-2 top-4 h-28 w-28 rounded-full border border-white/80 bg-gradient-to-br from-violet-200/70 to-blue-200/30 blur-[1px] lg:-right-8" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-200/60 to-blue-200/30 blur-2xl" />
              <div className="relative rounded-[30px] border border-white/90 bg-white/75 p-2.5 shadow-[0_35px_90px_rgba(30,64,175,.18)] backdrop-blur-2xl sm:rounded-[36px] sm:p-3.5">
                <div className="overflow-hidden rounded-[23px] border border-slate-200/80 bg-[#F7F9FE] sm:rounded-[29px]">
                  <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
                      <span className="ml-2 text-[10px] font-bold tracking-wide text-slate-500">SCHOOLOS / OVERVIEW</span>
                    </div>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-700">Sample dashboard</span>
                  </div>
                  <div className="grid grid-cols-[58px_1fr] sm:grid-cols-[70px_1fr]">
                    <aside className="flex flex-col items-center gap-5 border-r border-slate-200/80 bg-white/75 py-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><School size={17} /></div>
                      {[LayoutDashboard, GraduationCap, CalendarDays, WalletCards, BarChart3].map((Icon, i) => <span key={i} className={"flex h-8 w-8 items-center justify-center rounded-xl " + (i === 0 ? "bg-blue-50 text-blue-600" : "text-slate-400")}><Icon size={16} /></span>)}
                    </aside>
                    <div className="min-w-0 p-3.5 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">School workspace</p><h3 className="mt-1 text-sm font-black text-slate-800 sm:text-base">Good morning, Admin</h3></div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"><BellRing size={14} /></div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[["Students","1,248","blue"],["Attendance","94.8%","emerald"],["Fee records","PKR 8.4M","violet"],["Classes","36","amber"]].map(([label,value,tone]) => <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,.03)]"><p className="text-[9px] font-bold text-slate-400 sm:text-[10px]">{label}</p><p className={"mt-2 text-sm font-black sm:text-lg " + (tone === "blue" ? "text-blue-700" : tone === "emerald" ? "text-emerald-600" : tone === "violet" ? "text-violet-700" : "text-amber-600")}>{value}</p><p className="mt-1 text-[8px] font-semibold text-slate-400">Illustrative</p></div>)}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_.75fr]">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                          <div className="flex items-center justify-between"><p className="text-[10px] font-extrabold text-slate-700">Weekly attendance</p><span className="text-[9px] font-bold text-emerald-600">Sample view</span></div>
                          <div className="mt-4 flex h-24 items-end justify-around gap-2">
                            {[44,68,57,86,73,94,63].map((h,i)=><div key={i} className="flex h-full flex-1 items-end"><div style={{height:h+"%"}} className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90" /></div>)}
                          </div>
                          <div className="mt-2 flex justify-between text-[8px] font-semibold text-slate-400"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                          <p className="text-[10px] font-extrabold text-slate-700">Quick actions</p>
                          <div className="mt-3 space-y-2.5">{[{icon:GraduationCap,label:"Add student"},{icon:ClipboardCheck,label:"Mark attendance"},{icon:CreditCard,label:"Create voucher"}].map(({icon:Icon,label})=><div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-2 text-[9px] font-bold text-slate-600"><span className="text-blue-600"><Icon size={13} /></span>{label}</div>)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div animate={{ y: [0,-8,0], rotate: [0,1,0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-5 top-[24%] hidden items-center gap-3 rounded-2xl border border-white bg-white/90 p-3.5 shadow-[0_18px_45px_rgba(15,23,42,.13)] backdrop-blur-xl sm:flex lg:-left-12">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={19} /></span>
                <span><b className="block text-[11px] text-slate-800">Attendance marked</b><small className="text-[9px] font-semibold text-slate-400">Illustrative activity</small></span>
              </motion.div>
              <motion.div animate={{ y: [0,8,0], rotate: [0,-1,0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-3 bottom-[14%] hidden items-center gap-3 rounded-2xl border border-white bg-white/90 p-3.5 shadow-[0_18px_45px_rgba(15,23,42,.13)] backdrop-blur-xl sm:flex lg:-right-9">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><WalletCards size={19} /></span>
                <span><b className="block text-[11px] text-slate-800">Fee ledger updated</b><small className="text-[9px] font-semibold text-slate-400">Sample workflow</small></span>
              </motion.div>
            </motion.div>
          </div>
          <div className="mx-auto mt-20 max-w-5xl rounded-[26px] border border-white bg-white/65 p-5 shadow-[0_16px_45px_rgba(30,64,175,.07)] backdrop-blur-xl sm:p-7">
            <div className="grid grid-cols-2 gap-5 text-center md:grid-cols-4 md:divide-x md:divide-slate-200">
              {[["09","Core modules"],["04","Role-based portals"],["01","Connected workspace"],["24/7","Cloud access"]].map(([value,label])=><div key={label}><p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</p></div>)}
            </div>
            <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">Platform capabilities — not customer registration totals</p>
          </div>
        </section>

        <section id="platform" className="relative py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-violet-700"><Layers3 size={13}/> One connected platform</span>
              <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-.04em] text-slate-900 sm:text-5xl">Less switching.<br/><span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">More control.</span></h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">SchoolOS connects the work that usually gets scattered across paper registers, spreadsheets and disconnected tools.</p>
              <Link to="/register-school/plans" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 hover:gap-3">Bring your school onto SchoolOS <ArrowRight size={16}/></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div whileHover={{ y: -5 }} className="relative min-h-[240px] overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white shadow-xl shadow-blue-900/10 sm:col-span-2">
                <div className="absolute -right-8 -top-10 h-52 w-52 rounded-full border-[30px] border-white/10"/><div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl"/>
                <div className="relative max-w-lg"><span className="rounded-full bg-white/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.18em] text-blue-100">The school command centre</span><h3 className="mt-5 text-2xl font-black sm:text-3xl">A single view of your school’s moving parts.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">Bring academic, financial and administrative workflows together, with access shaped around each role.</p></div>
                <div className="absolute bottom-6 right-7 hidden h-28 w-48 rotate-[-5deg] rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl sm:block"><div className="flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-white/70"/><i className="h-1.5 w-1.5 rounded-full bg-white/40"/><i className="h-1.5 w-1.5 rounded-full bg-white/30"/></div><div className="mt-4 flex items-end gap-2">{[30,60,44,85,58,95,70].map((h,i)=><i key={i} style={{height:h+"%"}} className="flex-1 rounded-t bg-cyan-200/90"/>)}</div></div>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="rounded-[26px] border border-violet-100 bg-white p-6 shadow-[0_12px_40px_rgba(30,41,59,.05)]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><MonitorSmartphone size={23}/></div><h3 className="mt-5 text-lg font-black text-slate-900">Separate portals</h3><p className="mt-2 text-sm leading-6 text-slate-500">Purposeful experiences for administrators, teachers, students and parents.</p><div className="mt-5 flex -space-x-2">{["A","T","S","P"].map((v,i)=><span key={v} className={"flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white "+["bg-blue-600","bg-violet-600","bg-cyan-600","bg-emerald-600"][i]}>{v}</span>)}</div></motion.div>
              <motion.div whileHover={{ y: -5 }} className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-[0_12px_40px_rgba(30,41,59,.05)]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm"><ShieldCheck size={23}/></div><h3 className="mt-5 text-lg font-black text-slate-900">Controlled access</h3><p className="mt-2 text-sm leading-6 text-slate-500">Role-aware access and school-specific workspaces help keep operations organised.</p><div className="mt-5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700"><LockKeyhole size={13}/> Access by role</div></motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white/80 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-700">Built for daily school work</span>
              <h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-5xl">Every department, <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">in sync.</span></h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">Explore the modules that help your team spend less time managing paperwork and more time supporting students.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((item,index)=>{const Icon=item.icon;return <motion.article key={item.title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.15}} transition={{delay:(index%3)*.06}} whileHover={{y:-5}} className={"group relative overflow-hidden rounded-[25px] border border-slate-200/80 bg-white p-6 shadow-[0_5px_22px_rgba(15,23,42,.035)] transition hover:shadow-[0_18px_40px_rgba(30,64,175,.09)] "+(index===0?"lg:col-span-1":"")}>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-100/80 transition-transform duration-500 group-hover:scale-150"/><div className="relative"><div className={"flex h-12 w-12 items-center justify-center rounded-2xl ring-1 "+toneClasses[item.tone]}><Icon size={22}/></div><p className="mt-5 text-[9px] font-extrabold uppercase tracking-[.15em] text-slate-400">{item.tag}</p><h3 className="mt-2 text-lg font-black text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p><div className="mt-5 flex items-center gap-2 text-[11px] font-extrabold text-blue-700">Explore capability <ArrowUpRight size={14} className="transition group-hover:translate-x-1 group-hover:-translate-y-1"/></div></div>
              </motion.article>})}
            </div>
          </div>
        </section>

        <section id="preview" className="relative overflow-hidden bg-[#0B1530] py-24 text-white">
          <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]"/><div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]"/>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-cyan-200">Interactive product tour</span><h2 className="mt-5 text-3xl font-black tracking-[-.04em] sm:text-5xl">See how the workspace comes together.</h2><p className="mt-4 text-sm leading-7 text-slate-400">Switch between modules to explore illustrative screens. All figures and records below are sample data, not live school records.</p></div>
            <div className="mb-7 flex gap-2 overflow-x-auto pb-2">{previewTabs.map((tab)=>{const Icon=tab.icon;return <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={"flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold transition "+(activeTab===tab.id?"border-cyan-300/50 bg-cyan-300 text-[#0B1530] shadow-lg shadow-cyan-900/30":"border-white/10 bg-white/[.04] text-slate-300 hover:bg-white/[.08]")}><Icon size={15}/>{tab.label}</button>})}</div>
            <AnimatePresence mode="wait"><motion.div key={selectedPreview.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.25}} className="grid gap-8 rounded-[30px] border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur-xl sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:p-10">
              <div className="flex flex-col justify-center"><span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-200">Feature preview / {selectedPreview.label}</span><h3 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">{selectedPreview.heading}</h3><p className="mt-4 text-sm leading-7 text-slate-300">{selectedPreview.detail}</p><div className="mt-8 flex items-center gap-3 text-xs font-bold text-emerald-300"><CheckCircle2 size={16}/> Illustrative interface preview</div><Link to="/register-school/plans" className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-slate-900 transition hover:bg-cyan-100">Start with your school <ArrowRight size={15}/></Link></div>
              <div className="rounded-[24px] border border-white/10 bg-[#F6F8FC] p-4 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:p-5"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white"><School size={15}/></span><span><b className="block text-[11px]">Your School Workspace</b><small className="text-[9px] font-semibold text-slate-400">Illustrative sample</small></span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">Preview mode</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{selectedPreview.stats.map(([label,value,sub],i)=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-bold text-slate-400">{label}</p><p className={"mt-2 break-words text-lg font-black "+["text-blue-700","text-emerald-600","text-violet-700","text-amber-600"][i]}>{value}</p><p className="mt-1 text-[8px] font-semibold text-slate-400">{sub}</p></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_.8fr]"><div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><b className="text-[10px]">Recent activity</b><span className="text-[9px] font-bold text-blue-600">Sample</span></div>{["Admission record created","Attendance register updated","Fee voucher generated"].map((line,i)=><div key={line} className="mt-3 flex items-center gap-2 border-b border-slate-100 pb-2 last:border-0"><span className={"h-2 w-2 rounded-full "+["bg-blue-500","bg-emerald-500","bg-violet-500"][i]}/><span className="text-[9px] font-semibold text-slate-600">{line}</span></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-4"><b className="text-[10px]">Workflow status</b><div className="mt-4 space-y-3">{["Records organised","Roles assigned","Reports available"].map((line,i)=><div key={line}><div className="mb-1 flex justify-between text-[9px] font-bold text-slate-500"><span>{line}</span><Check size={11} className="text-emerald-500"/></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{width:(72+i*9)+"%"}}/></div></div>)}</div></div></div></div>
            </motion.div></AnimatePresence>
          </div>
        </section>

        <section id="process" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center"><span className="rounded-full bg-violet-50 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-violet-700">Getting started</span><h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-5xl">A clear path from application to launch.</h2><p className="mt-4 text-sm leading-7 text-slate-500">Your school stays in control at every step. Access begins after the application review.</p></div>
            <div className="relative grid gap-5 md:grid-cols-4">{[{n:"01",title:"Submit application",desc:"Share your institution and administrator details.",icon:School},{n:"02",title:"Application review",desc:"The SchoolOS Super Admin reviews your request.",icon:ShieldCheck},{n:"03",title:"Approval & setup",desc:"After approval, configure your school workspace.",icon:Layers3},{n:"04",title:"Start managing",desc:"Set up records and invite your school community.",icon:ChartNoAxesCombined}].map((step,i)=>{const Icon=step.icon;return <div key={step.n} className="relative rounded-[25px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.04)]"><div className="flex items-center justify-between"><span className="text-3xl font-black tracking-tight text-blue-100">{step.n}</span><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon size={21}/></span></div><h3 className="mt-6 text-base font-black text-slate-900">{step.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{step.desc}</p>{i<3&&<span className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-500 shadow-sm md:flex"><ArrowRight size={14}/></span>}</div>})}</div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#EEF4FF] via-white to-[#F4F0FF] py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><span className="rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-700">Your school. Your identity.</span><h2 className="mt-5 text-3xl font-black leading-tight tracking-[-.04em] text-slate-900 sm:text-5xl">A digital front door for every school.</h2><p className="mt-5 text-sm leading-7 text-slate-600">SchoolOS supports dedicated public school pages, giving each approved institution a place to present its identity, information and access links.</p><ul className="mt-7 space-y-3 text-sm font-semibold text-slate-700">{["School profile and campus information","Public-facing school identity","Direct access to the relevant school login"].map((item)=><li key={item} className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/>{item}</li>)}</ul><Link to="/register-school/plans" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">Create your school presence <ArrowRight size={15}/></Link></div>
            <div className="relative"><div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-blue-300/40 to-violet-300/40 blur-2xl"/><div className="relative rotate-1 rounded-[30px] border border-white bg-white p-3 shadow-[0_30px_80px_rgba(30,64,175,.16)]"><div className="overflow-hidden rounded-[22px] border border-slate-100"><div className="flex items-center justify-between bg-slate-50 px-4 py-3"><span className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Globe2 size={13}/> schoolos / your-school</span><span className="text-[9px] font-bold text-emerald-600">PREVIEW</span></div><div className="bg-gradient-to-br from-[#172554] via-blue-800 to-violet-800 px-6 py-10 text-center text-white"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><School size={27}/></span><p className="mt-4 text-[9px] font-extrabold uppercase tracking-[.2em] text-blue-200">Your institution</p><h3 className="mt-2 text-2xl font-black">Your School Name</h3><p className="mt-2 text-xs text-blue-100">Your City, Pakistan</p><div className="mt-6 flex justify-center gap-2"><span className="rounded-lg bg-white px-3 py-2 text-[9px] font-extrabold text-blue-800">About school</span><span className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-[9px] font-bold">Contact</span></div></div><div className="grid grid-cols-3 gap-2 p-4"><div className="h-14 rounded-xl bg-blue-50"/><div className="h-14 rounded-xl bg-violet-50"/><div className="h-14 rounded-xl bg-cyan-50"/></div></div></div></div>
          </div>
        </section>

        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center"><span className="rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-emerald-700">Straightforward pricing</span><h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-5xl">Choose the right start for your school.</h2><p className="mt-4 text-sm leading-7 text-slate-500">Plan availability and final limits are confirmed during registration.</p></div>
            <div className="mx-auto max-w-xl rounded-[30px] border border-blue-200 bg-white p-7 shadow-[0_24px_70px_rgba(30,64,175,.11)] sm:p-10"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-blue-700">School subscription</span><h3 className="mt-4 text-2xl font-black text-slate-900">{monthlyPlan?.name || "SchoolOS Monthly"}</h3><p className="mt-2 text-sm text-slate-500">A connected workspace for your institution.</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg"><Star size={22}/></span></div>
              <div className="mt-7 flex items-end gap-2 border-b border-slate-100 pb-7"><span className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{monthlyPlan ? "PKR " + monthlyPlan.price.toLocaleString("en-PK") : "View plans"}</span>{monthlyPlan&&<span className="pb-1 text-sm font-semibold text-slate-500">/ {monthlyPlan.period || "month"}</span>}</div>
              {loadingPlans?<p className="py-6 text-sm font-semibold text-slate-400">Loading current plan details…</p>:monthlyPlan?<><div className="mt-6 space-y-3"><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Included plan features</p>{monthlyPlan.features.map((feature,i)=><div key={i} className="flex items-start gap-3 text-sm text-slate-700"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500"/>{feature}</div>)}</div><button onClick={()=>handlePlanSelect(monthlyPlan.planKey)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl">Apply for school access <ArrowRight size={16}/></button></>:<Link to="/register-school/plans" className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 text-sm font-extrabold text-white">View available plans <ArrowRight size={16}/></Link>}
              <p className="mt-4 text-center text-[10px] leading-5 text-slate-400">School access is enabled after application review and approval.</p>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white/75 py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><div className="mb-12 text-center"><span className="rounded-full bg-blue-50 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-700">Frequently asked</span><h2 className="mt-5 text-3xl font-black tracking-[-.04em] text-slate-900 sm:text-4xl">Good questions. Clear answers.</h2></div><div className="space-y-3">{faqs.map((faq,i)=><div key={faq.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(15,23,42,.03)]"><button onClick={()=>setActiveFaq(activeFaq===i?null:i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-extrabold text-slate-800 transition hover:text-blue-700"><span>{faq.q}</span><ChevronDown size={18} className={"shrink-0 text-slate-400 transition "+(activeFaq===i?"rotate-180 text-blue-600":"")}/></button><AnimatePresence>{activeFaq===i&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-500">{faq.a}</p></motion.div>}</AnimatePresence></div>)}</div></div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[34px] bg-gradient-to-br from-[#14265B] via-blue-800 to-violet-800 px-7 py-14 text-center text-white shadow-[0_30px_80px_rgba(30,64,175,.22)] sm:px-12 sm:py-20"><div className="absolute -left-20 -top-28 h-72 w-72 rounded-full border-[35px] border-white/5"/><div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-cyan-300/10 blur-2xl"/><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-100"><Sparkles size={13}/> Your next school day, better organised</span><h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-5xl">Give your school a smarter way to work.</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-blue-100">Explore the platform, review the available plan and submit your school application to get started.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register-school/plans" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-blue-800 shadow-lg transition hover:-translate-y-1 hover:bg-cyan-50">Register your school <ArrowRight size={16}/></Link><Link to="/school-login" className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/15">School login</Link></div></div></div></section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white py-14 text-slate-500">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div><Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600"><img src="/logo.svg" alt="" className="h-6 w-6 brightness-0 invert"/></span><b className="text-lg font-black text-slate-900">SchoolOS</b></Link><p className="mt-4 max-w-xs text-xs leading-6">A connected school management platform for academic, administrative and financial workflows.</p></div>
          <div><b className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-900">Platform</b><div className="mt-4 flex flex-col gap-3 text-xs font-semibold"><a href="#features" className="hover:text-blue-700">Features</a><a href="#preview" className="hover:text-blue-700">Product tour</a><a href="#process" className="hover:text-blue-700">How it works</a><a href="#pricing" className="hover:text-blue-700">Pricing</a></div></div>
          <div><b className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-900">Portals</b><div className="mt-4 flex flex-col gap-3 text-xs font-semibold"><Link to="/school-login" className="hover:text-blue-700">School login</Link><Link to="/portal" className="hover:text-blue-700">Parent & student portal</Link><Link to="/admin-login" className="hover:text-blue-700">Super Admin</Link></div></div>
          <div><b className="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-900">Get started</b><div className="mt-4 flex flex-col gap-3 text-xs font-semibold"><Link to="/register-school/plans" className="hover:text-blue-700">Register school</Link><Link to="/school-login" className="hover:text-blue-700">School login</Link></div></div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-slate-100 px-4 pt-6 text-[10px] font-semibold text-slate-400 sm:flex-row sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} SchoolOS. All rights reserved.</span><span>Secure access · Role-based workflows · School-specific workspaces</span></div>
      </footer>
    </div>
  );
}
