import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, Check, ChevronDown, Crown, GraduationCap,
  Menu, Moon, School, Search, ShieldCheck, Star,
  Sun, Users, WalletCards, X, Zap,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import SchoolSearchModal from "@/component/SchoolSearchModal";
import { useTheme } from "@/context/ThemeContext";

type PublicPlan = {
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
};

const modules = [
  ["📚", "Academics", "Classes, subjects, timetable, homework and digital learning."],
  ["✅", "Attendance", "Fast daily attendance with clear student and staff records."],
  ["📝", "Exams & Results", "Exams, marks, grades, result cards and performance reports."],
  ["💳", "Fees & Finance", "Fee structures, payments, receipts and finance reporting."],
  ["👩‍🏫", "Teachers & Staff", "Staff records, roles, attendance, leave and payroll-ready data."],
  ["🚌", "Transport", "Routes, vehicles, drivers and student transport assignments."],
  ["📢", "Communication", "Announcements, notifications and school-wide updates."],
  ["📊", "Reports", "Actionable reports for school leadership and administrators."],
];

const benefits = [
  ["🏫", "Multi-school control", "Manage every institution from one secure Super Admin console."],
  ["🔐", "Role-based security", "Separate access for Super Admins, school admins, teachers and users."],
  ["⚡", "Fast daily workflows", "Clean screens and focused actions built for real school operations."],
  ["☁️", "Cloud SaaS", "Centralized database, subscription controls and tenant-aware architecture."],
  ["📱", "Responsive everywhere", "Use the platform comfortably on desktop, tablet or mobile."],
  ["🧾", "Real auditability", "Payments, requests and admin activity stay traceable."],
];

const faqs = [
  ["Can I try EduSphere before paying?", "Yes. The Free Trial plan lets a school experience the platform before choosing a paid plan."],
  ["What are the current plans?", "Free Trial supports up to 20 students, Professional supports up to 500 students with unlimited staff, and Premium supports unlimited students and staff."],
  ["Who controls pricing and limits?", "The Super Admin can edit plan price, period, student limit, staff limit, storage, support tier and feature lines from Plans & Pricing."],
  ["How are school registrations approved?", "A school selects a plan, submits its registration and payment proof, and the Super Admin reviews the request before access is enabled."],
  ["Can a school change plans later?", "Yes. Subscription and payment workflows are managed from the Super Admin side so plan changes remain controlled and auditable."],
];

const planStyle: Record<string, { gradient: string; border: string; icon: React.ComponentType<any>; badge?: string }> = {
  FREE_TRIAL: { gradient: "from-sky-500 to-cyan-600", border: "border-sky-400/30", icon: Zap },
  PROFESSIONAL: { gradient: "from-indigo-500 via-blue-600 to-violet-600", border: "border-indigo-400/50", icon: Star, badge: "MOST POPULAR" },
  PREMIUM: { gradient: "from-emerald-500 via-teal-500 to-cyan-600", border: "border-emerald-400/40", icon: Crown, badge: "BEST VALUE" },
};

const fallbackPlans: PublicPlan[] = [
  { id: "free-trial", planKey: "FREE_TRIAL", name: "Free Trial", price: 0, period: "1 day", maxStudents: 20, maxTeachers: 999999, storageMb: 1024, supportTier: "Standard", features: ["Up to 20 students", "All core modules", "Attendance & fees", "Exams & results", "Basic reports"] },
  { id: "professional", planKey: "PROFESSIONAL", name: "Professional", price: 3000, period: "per month", maxStudents: 500, maxTeachers: 999999, storageMb: 5120, supportTier: "Priority", features: ["Up to 500 students", "Unlimited staff", "All school modules", "Advanced reports", "Priority support"] },
  { id: "premium", planKey: "PREMIUM", name: "Premium", price: 5000, period: "per month", maxStudents: 999999, maxTeachers: 999999, storageMb: 51200, supportTier: "Premium", features: ["Unlimited students", "Unlimited staff", "All modules", "Advanced reports", "School website ready", "Custom domain ready"] },
];

const scrollToPricing = () => {
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

function useReveal() {
  return { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.12 }, transition: { duration: 0.55 } };
}

function Background() {
  return <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06111d]">
    <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-cyan-500/10 blur-[120px]" />
    <div className="absolute right-[-180px] top-[18%] h-[650px] w-[650px] rounded-full bg-indigo-500/10 blur-[130px]" />
    <div className="absolute bottom-[-220px] left-[28%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[130px]" />
    <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
  </div>;
}

function Navbar({ onSearch }: { onSearch: () => void }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const goPricing = () => { setOpen(false); scrollToPricing(); };
  return <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
    <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#071522]/85 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-5">
      <Link to="/" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-black text-white shadow-lg shadow-cyan-500/20">E</div><div><p className="text-base font-black text-white">EduSphere</p><p className="text-[9px] font-bold tracking-[0.22em] text-cyan-300">MULTI-TENANT SAAS</p></div></Link>
      <div className="hidden items-center gap-7 md:flex">{["Features", "Modules", "Pricing", "FAQ"].map((x) => <a key={x} href={`#${x.toLowerCase()}`} className="text-sm font-semibold text-slate-300 transition hover:text-white">{x}</a>)}</div>
      <div className="hidden items-center gap-2 md:flex">
        <button onClick={toggleTheme} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10" title="Toggle theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button onClick={() => navigate("/admin-login")} className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3.5 py-2.5 text-xs font-bold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20"><ShieldCheck size={14} /> Super Admin</button>
        <button onClick={onSearch} className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/5"><Search size={14} /> School Login</button>
        <button onClick={scrollToPricing} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/20 hover:brightness-110">Register School</button>
      </div>
      <button onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2 text-white md:hidden">{open ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-4 mt-2 rounded-2xl border border-white/10 bg-[#071522]/95 p-5 backdrop-blur-xl md:hidden"><div className="flex flex-col gap-3">{["Features", "Modules", "Pricing", "FAQ"].map((x) => <a onClick={() => setOpen(false)} key={x} href={`#${x.toLowerCase()}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">{x}</a>)}<button onClick={() => { setOpen(false); navigate("/admin-login"); }} className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 py-2.5 text-sm font-bold text-violet-200 hover:bg-violet-500/20"><ShieldCheck size={15} /> Super Admin</button><button onClick={onSearch} className="rounded-xl border border-white/10 py-2.5 text-sm font-bold text-white">School Login</button><button onClick={goPricing} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-black text-white">Register School</button></div></motion.div>}</AnimatePresence>
  </nav>;
}

function Hero({ onSearch }: { onSearch: () => void }) {
  const reveal = useReveal();
  return <section className="relative flex min-h-screen items-center overflow-hidden px-5 pb-20 pt-32">
    <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
      <motion.div {...reveal}>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> School management, redesigned</div>
        <h1 className="max-w-4xl text-5xl font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">One powerful platform for <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">every school operation.</span></h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">EduSphere brings students, teachers, attendance, exams, fees, communication, reports and school administration into one secure multi-tenant SaaS platform.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={scrollToPricing} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:brightness-110">Start with a Plan <ArrowRight size={16} className="transition group-hover:translate-x-1" /></button><button onClick={onSearch} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white hover:bg-white/10"><Search size={16} className="text-cyan-300" /> Find School Login</button></div>
        <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-2xl font-black text-white">24/7</p><p className="text-[10px] text-slate-500">Cloud access</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-2xl font-black text-white">Multi</p><p className="text-[10px] text-slate-500">School ready</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-2xl font-black text-white">Live</p><p className="text-[10px] text-slate-500">DB analytics</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-2xl font-black text-white">Secure</p><p className="text-[10px] text-slate-500">Role based</p></div></div>
      </motion.div>
      <motion.div {...reveal} transition={{ duration: .65, delay: .12 }} className="relative">
        <div className="absolute -inset-8 rounded-[40px] bg-cyan-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#091a2a]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">Super Admin Console</p><p className="mt-1 text-lg font-black text-white">Platform Intelligence</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><BarChart3 size={18} /></div></div>
          <div className="grid grid-cols-2 gap-3 py-4"><div className="rounded-2xl bg-white/[.04] p-4"><School size={17} className="text-cyan-300" /><p className="mt-3 text-2xl font-black text-white">Schools</p><p className="text-[10px] text-slate-500">One command center</p></div><div className="rounded-2xl bg-white/[.04] p-4"><WalletCards size={17} className="text-emerald-300" /><p className="mt-3 text-2xl font-black text-white">Revenue</p><p className="text-[10px] text-slate-500">Live payments</p></div><div className="rounded-2xl bg-white/[.04] p-4"><GraduationCap size={17} className="text-indigo-300" /><p className="mt-3 text-2xl font-black text-white">Students</p><p className="text-[10px] text-slate-500">Across tenants</p></div><div className="rounded-2xl bg-white/[.04] p-4"><Users size={17} className="text-amber-300" /><p className="mt-3 text-2xl font-black text-white">Staff</p><p className="text-[10px] text-slate-500">Managed centrally</p></div></div>
          <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/10 to-indigo-400/10 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-300">Operational health</span><span className="text-[10px] font-black text-emerald-300">LIVE</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" /></div></div>
        </div>
      </motion.div>
    </div>
  </section>;
}

function Benefits() {
  const reveal = useReveal();
  return <section id="features" className="px-5 py-24"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Built for schools</span><h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Everything important. <span className="text-cyan-300">One place.</span></h2><p className="mt-4 text-sm leading-6 text-slate-400">A focused operational layer for school teams, with a powerful control plane for Super Admins.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{benefits.map(([icon,title,body]) => <motion.div key={title} {...reveal} className="group rounded-[24px] border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-white/[.055]"><span className="text-3xl">{icon}</span><h3 className="mt-5 text-lg font-black text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></motion.div>)}</div></div></section>;
}

function Modules() {
  const reveal = useReveal();
  return <section id="modules" className="px-5 py-24"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="text-[10px] font-black uppercase tracking-[.2em] text-indigo-300">Platform modules</span><h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Run the whole school.</h2></div><p className="max-w-xl text-sm leading-6 text-slate-400">From admissions to reports, keep the daily workflow connected instead of spreading data across separate tools.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{modules.map(([icon,name,desc],i) => <motion.div {...reveal} transition={{ duration:.5, delay:i*.03 }} key={name} className="rounded-[22px] border border-white/10 bg-[#091a2a]/75 p-5 hover:border-indigo-400/25"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-2xl">{icon}</div><h3 className="mt-4 font-black text-white">{name}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p></motion.div>)}</div></div></section>;
}

function Pricing() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get<PublicPlan[]>("/public/plans").then((r) => setPlans(r.data || [])).catch(() => setPlans([])).finally(() => setLoading(false)); }, []);
  const visiblePlans = useMemo(() => {
    const source = plans.length ? plans : fallbackPlans;
    const order = ["FREE_TRIAL", "PROFESSIONAL", "PREMIUM"];
    return [...source].sort((a,b) => order.indexOf(a.planKey) - order.indexOf(b.planKey));
  }, [plans]);
  const register = () => scrollToPricing();
  return <section id="pricing" className="relative scroll-mt-28 px-5 py-24"><div className="absolute inset-x-0 top-1/3 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-indigo-500/10 blur-[120px]" /><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Plans & pricing</span><h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Choose the right <span className="text-cyan-300">school plan.</span></h2><p className="mt-4 text-sm leading-6 text-slate-400">Start with 20 students on Free Trial, scale to 500 on Professional, or go unlimited with Premium.</p></div>{loading ? <div className="mt-12 rounded-3xl border border-white/10 bg-white/[.03] p-12 text-center text-sm text-slate-400">Loading plans…</div> : <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">{visiblePlans.map((plan) => { const style = planStyle[plan.planKey] || planStyle.PROFESSIONAL; const Icon = style.icon; const featured = plan.planKey === "PROFESSIONAL"; const students = plan.maxStudents >= 999999 ? "Unlimited students" : `Up to ${plan.maxStudents.toLocaleString()} students`; const staff = plan.maxTeachers >= 999999 ? "Unlimited staff" : `Up to ${plan.maxTeachers.toLocaleString()} staff`; return <motion.article key={plan.id} whileHover={{ y: featured ? -10 : -6 }} className={`relative flex flex-col overflow-hidden rounded-[30px] border ${style.border} ${featured ? "lg:-mt-5 lg:mb-[-1.25rem] ring-2 ring-indigo-400/30 shadow-[0_25px_80px_rgba(79,70,229,.22)]" : ""} bg-[#091a2a]/90 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl`}><div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.gradient}`} />{style.badge && <span className={`absolute right-5 top-5 rounded-full bg-gradient-to-r ${style.gradient} px-2.5 py-1 text-[9px] font-black tracking-wider text-white`}>{style.badge}</span>}<div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg`}><Icon size={21} /></div><h3 className="mt-6 text-2xl font-black text-white">{plan.name}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-slate-400">{plan.planKey === "FREE_TRIAL" ? "Try the complete school workflow before you commit." : plan.planKey === "PROFESSIONAL" ? "The best fit for growing schools and daily operations." : "Maximum scale for schools that want the full platform."}</p><div className="mt-6 flex items-end gap-1">{plan.price === 0 ? <span className="text-4xl font-black text-white">Free</span> : <><span className="mb-1 text-xs font-bold text-slate-500">PKR</span><span className="text-4xl font-black tracking-tight text-white">{plan.price.toLocaleString()}</span></>}<span className="mb-1 text-xs font-bold text-slate-500">{plan.price === 0 ? plan.period : `/${plan.period.replace(/^per /, "")}`}</span></div><div className="mt-6 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.045] p-3"><GraduationCap size={14} className="text-cyan-300" /><p className="mt-2 text-[11px] font-black text-white">{students}</p></div><div className="rounded-xl bg-white/[.045] p-3"><Users size={14} className="text-indigo-300" /><p className="mt-2 text-[11px] font-black text-white">{staff}</p></div></div><ul className="mt-6 flex-1 space-y-2.5">{(plan.features || []).map((feature, i) => <li key={`${feature}-${i}`} className="flex gap-2 text-xs leading-5 text-slate-300"><Check size={14} className="mt-0.5 shrink-0 text-cyan-300" />{feature}</li>)}</ul><div className="mt-7 flex items-center gap-2 text-[10px] font-bold text-slate-500"><span>{plan.storageMb >= 512000 ? "500 GB" : `${Math.max(1, Math.round(plan.storageMb / 1024))} GB`} storage</span><span>•</span><span>{plan.supportTier} support</span></div><button onClick={register} className={`mt-7 w-full rounded-2xl bg-gradient-to-r ${style.gradient} px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110`}>{plan.planKey === "FREE_TRIAL" ? "Start Free Trial" : plan.planKey === "PROFESSIONAL" ? "Choose Professional" : "Choose Premium"}<ArrowRight size={15} className="ml-2 inline" /></button></motion.article>; })}</div>}<p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-500">After choosing a plan, continue to school registration and submit the required payment proof where applicable. Super Admin approval enables school access.</p></div></section>;
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return <section id="faq" className="px-5 py-24"><div className="mx-auto max-w-4xl"><div className="text-center"><span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">FAQ</span><h2 className="mt-3 text-4xl font-black text-white">Questions, answered.</h2></div><div className="mt-10 space-y-3">{faqs.map(([q,a],i) => <div key={q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]"><button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"><span className="text-sm font-black text-white">{q}</span><ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open === i ? "rotate-180" : ""}`} /></button><AnimatePresence>{open === i && <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}><p className="px-5 pb-5 text-xs leading-6 text-slate-400">{a}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", school:"", message:"" });
  const submit = async (e: React.FormEvent) => { e.preventDefault(); await apiClient.post("/public/contact", { name:form.name, email:form.email, schoolName:form.school, message:form.message }); setSent(true); };
  return <section id="contact" className="px-5 py-24"><div className="mx-auto max-w-5xl rounded-[32px] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 via-[#091a2a] to-indigo-500/10 p-7 sm:p-10"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Talk to EduSphere</span><h2 className="mt-3 text-4xl font-black text-white">Ready to modernize your school?</h2><p className="mt-4 text-sm leading-6 text-slate-400">Send your details and the EduSphere team can help you understand the right plan and onboarding flow.</p></div>{sent ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check size={22} /></div><h3 className="mt-4 font-black text-white">Message received</h3><p className="mt-2 text-xs text-slate-400">We will get back to you soon.</p></div> : <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><input required placeholder="Your name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40" /><input required type="email" placeholder="Work email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40" /><input required placeholder="School / organization" value={form.school} onChange={(e)=>setForm({...form,school:e.target.value})} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40 sm:col-span-2" /><textarea required rows={4} placeholder="Tell us what you need" value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})} className="resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40 sm:col-span-2" /><button className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-black text-white sm:col-span-2">Request a Demo <ArrowRight size={15} className="ml-1 inline" /></button></form>}</div></div></section>;
}

function Footer() {
  return <footer className="border-t border-white/10 px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"><div><p className="font-black text-white">EduSphere</p><p className="mt-1 text-[10px] text-slate-600">Multi-tenant school management SaaS</p></div><div className="flex items-center justify-center gap-4 text-xs text-slate-500"><a href="#features" className="hover:text-white">Features</a><a href="#pricing" className="hover:text-white">Pricing</a><Link to="/admin/login" className="hover:text-white">Super Admin</Link></div><p className="text-[10px] text-slate-600">© {new Date().getFullYear()} EduSphere</p></div></footer>;
}

export default function LandingPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  return <div className="min-h-screen overflow-x-hidden bg-[#06111d] font-sans text-white"><Background /><Navbar onSearch={() => setSearchOpen(true)} /><Hero onSearch={() => setSearchOpen(true)} /><Benefits /><Modules /><Pricing /><FAQ /><Contact /><Footer /><SchoolSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} /></div>;
}
