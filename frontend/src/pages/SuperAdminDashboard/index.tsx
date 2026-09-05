import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, School, FileText, CreditCard, BarChart2, Bell, Mail, Settings, Shield, User, Menu, X, ChevronRight, LogOut, Clock, Zap, LifeBuoy, Megaphone, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/api/apiClient";
import Overview from "./sections/Overview";
import SchoolRequests from "./sections/SchoolRequests";
import Schools from "./sections/Schools";
import Plans from "./sections/Plans";
import Payments from "./sections/Payments";
import Reports from "./sections/Reports";
import Notifications from "./sections/Notifications";
import EmailTemplates from "./sections/EmailTemplates";
import SystemSettings from "./sections/SystemSettings";
import AuditLogs from "./sections/AuditLogs";
import Profile from "./sections/Profile";
import Users from "./sections/Users";
import Support from "./sections/Support";
import Announcements from "./sections/Announcements";

type SectionId = "overview" | "school-requests" | "schools" | "plans" | "payments" | "users" | "support" | "announcements" | "reports" | "notifications" | "email-templates" | "system-settings" | "audit-logs" | "profile";
type NavItem = { id: SectionId; label: string; icon: React.ComponentType<any>; badgeKey?: "pendingSchoolRequests" | "pendingPayments" };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Platform Core", items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Institutional Governance", items: [{ id: "school-requests", label: "School Requests", icon: FileText, badgeKey: "pendingSchoolRequests" }, { id: "schools", label: "Schools", icon: School }] },
  { label: "Payments & Billing", items: [{ id: "plans", label: "Plans & Pricing", icon: Zap }, { id: "payments", label: "Payments", icon: CreditCard, badgeKey: "pendingPayments" }] },
  { label: "Operations & Users", items: [{ id: "users", label: "User Management", icon: User }, { id: "support", label: "Support / Tickets", icon: LifeBuoy }] },
  { label: "Communication", items: [{ id: "announcements", label: "Announcements", icon: Megaphone }, { id: "notifications", label: "System Alerts", icon: Bell }, { id: "email-templates", label: "Email Templates", icon: Mail }] },
  { label: "Insights & Settings", items: [{ id: "reports", label: "Reports", icon: BarChart2 }, { id: "audit-logs", label: "Activity Logs", icon: Shield }, { id: "system-settings", label: "System Settings", icon: Settings }, { id: "profile", label: "My Profile", icon: User }] },
];

const allNavItems = navGroups.flatMap((group) => group.items);
const sectionComponents: Record<SectionId, React.ComponentType> = { overview: Overview, "school-requests": SchoolRequests, schools: Schools, plans: Plans, payments: Payments, users: Users, support: Support, announcements: Announcements, reports: Reports, notifications: Notifications, "email-templates": EmailTemplates, "system-settings": SystemSettings, "audit-logs": AuditLogs, profile: Profile };

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setTime(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  return <span className="tabular-nums">{time.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>;
}

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ pendingSchoolRequests: 0, pendingPayments: 0 });
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Navigation badges are loaded once. Re-fetching overview on every click was
  // causing every Super Admin section to wait for an unnecessary DB request.
  useEffect(() => {
    let cancelled = false;
    apiClient.get("/admin/overview").then((response) => {
      if (!cancelled) setBadgeCounts({ pendingSchoolRequests: Number(response.data?.pendingSchoolRequests ?? 0), pendingPayments: Number(response.data?.pendingPayments ?? 0) });
    }).catch(() => { if (!cancelled) setBadgeCounts({ pendingSchoolRequests: 0, pendingPayments: 0 }); });
    return () => { cancelled = true; };
  }, []);

  const ActiveComponent = sectionComponents[activeSection];
  const activeItem = allNavItems.find((item) => item.id === activeSection);
  const initials = useMemo(() => {
    const name = user?.name?.trim() || "Super Admin";
    return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }, [user?.name]);
  const handleNav = (id: SectionId) => { setActiveSection(id); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate("/admin/login"); };

  const sidebar = (
    <>
      <div className="relative shrink-0 overflow-hidden px-5 py-5">
        <div className="absolute -left-7 -top-7 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30"><Shield size={17} className="text-white" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400" /></div>
            <div><p className="text-sm font-black leading-none tracking-tight text-foreground">EduSphere</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Multi-Tenant SaaS</p></div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label="Close menu"><X size={16} /></button>
        </div>
        <div className="mt-4 h-px bg-border" />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3 scrollbar-thin" aria-label="Super admin navigation">
        {navGroups.map((group) => <div key={group.label}><p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/60">{group.label}</p><div className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; const active = activeSection === item.id; const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0; return <button key={item.id} onClick={() => handleNav(item.id)} aria-current={active ? "page" : undefined} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${active ? "text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{active && <motion.div layoutId="super-admin-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}<span className="relative z-10 flex min-w-0 flex-1 items-center gap-3"><Icon size={16} className="shrink-0" /><span className="truncate text-left text-[13px] font-semibold">{item.label}</span></span>{badge > 0 && <span className={`relative z-10 min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-black tabular-nums ${active ? "bg-white/20 text-white" : "bg-violet-500/10 text-violet-500"}`}>{badge}</span>}{active && <ChevronRight size={12} className="relative z-10 text-white/70" />}</button>; })}</div></div>)}
      </nav>
      <div className="shrink-0 px-3 py-3"><div className="mb-3 h-px bg-border" /><div className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold leading-none text-foreground">{user?.name || "Super Admin"}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Root Governance</p></div><button onClick={handleLogout} title="Logout" aria-label="Logout" className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"><LogOut size={13} /></button></div><div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground/50"><Zap size={9} /> EduSphere Multi-Tenant SaaS</div></div>
    </>
  );

  return <div className="edusphere-admin relative flex h-full min-h-0 w-full overflow-hidden rounded-[28px] border border-border bg-background text-foreground shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-colors duration-300">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_32%)]" />
    <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />}</AnimatePresence>
    <motion.aside className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur-xl lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} transition-transform duration-300`}>{sidebar}</motion.aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl sm:px-5">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label="Open menu"><Menu size={18} /></button>
        <div className="flex min-w-0 flex-1 items-center gap-2"><Shield size={14} className="shrink-0 text-primary" /><span className="hidden text-xs font-semibold text-muted-foreground sm:inline">Super Admin Console</span><ChevronRight size={12} className="hidden text-muted-foreground/50 sm:inline" />{activeItem && <><activeItem.icon size={15} className="shrink-0 text-primary" /><h1 className="truncate text-sm font-black text-foreground">{activeItem.label}</h1></>}</div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2"><div className="hidden items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground md:flex"><Clock size={12} className="text-primary" /><LiveClock /></div><button onClick={toggleTheme} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-bold text-foreground shadow-sm transition-all hover:bg-accent" title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span></button><button onClick={() => handleNav("notifications")} className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Notifications"><Bell size={16} />{(badgeCounts.pendingSchoolRequests + badgeCounts.pendingPayments) > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />}</button><button onClick={() => handleNav("profile")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-black text-white shadow-md shadow-violet-500/20" title="My Profile" aria-label="My Profile">{initials}</button></div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"><div className="mx-auto max-w-[1800px] p-4 sm:p-6"><AnimatePresence mode="wait"><motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}><ActiveComponent /></motion.div></AnimatePresence></div></main>
    </div>
  </div>;
}
