import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LayoutDashboard, GraduationCap, BriefcaseBusiness, UsersRound, BookOpen, FileText, ClipboardCheck, CalendarDays, WalletCards, Bell, Bus, BarChart3, Settings, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, Search, School, Sun, Moon, ChevronDown, ShieldCheck, LockKeyhole, CreditCard, Building2, UserRound, NotebookTabs } from "lucide-react";
import type { UserRole } from "@/context/AuthContext";

interface NavItemDef { label: string; path: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; roles: UserRole[]; }
interface NavGroupDef { label: string; items: NavItemDef[]; }

const NAV_GROUPS: NavGroupDef[] = [
  { label: "Overview", items: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  ]},
  { label: "People", items: [
    { label: "Students", path: "/students", icon: GraduationCap, roles: ["SCHOOL_ADMIN", "TEACHER"] },
    { label: "Staff", path: "/staff", icon: BriefcaseBusiness, roles: ["SCHOOL_ADMIN"] },
    { label: "Parents", path: "/parents", icon: UsersRound, roles: ["SCHOOL_ADMIN"] },
  ]},
  { label: "Academics", items: [
    { label: "Classes", path: "/classes", icon: BookOpen, roles: ["SCHOOL_ADMIN", "TEACHER"] },
    { label: "Homework", path: "/homework", icon: FileText, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { label: "Exams & Results", path: "/exams", icon: ClipboardCheck, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { label: "Timetable", path: "/timetable", icon: CalendarDays, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  ]},
  { label: "Daily Operations", items: [
    { label: "Attendance", path: "/attendance", icon: NotebookTabs, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { label: "Fees & Finance", path: "/finance", icon: WalletCards, roles: ["SCHOOL_ADMIN", "STUDENT", "PARENT"] },
    { label: "Notices", path: "/notices", icon: Bell, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
    { label: "Transport", path: "/transport", icon: Bus, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  ]},
  { label: "Insights", items: [
    { label: "Reports", path: "/reports", icon: BarChart3, roles: ["SCHOOL_ADMIN", "TEACHER"] },
    { label: "Notifications", path: "/notifications", icon: Bell, roles: ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  ]},
  { label: "Administration", items: [
    { label: "Subscription", path: "/subscription", icon: CreditCard, roles: ["SCHOOL_ADMIN"] },
    { label: "Buildings", path: "/buildings", icon: Building2, roles: ["SCHOOL_ADMIN"] },
    { label: "Settings", path: "/settings", icon: Settings, roles: ["SCHOOL_ADMIN"] },
  ]},
  { label: "My Account", items: [
    { label: "Student Portal", path: "/student-portal", icon: UserRound, roles: ["STUDENT"] },
  ]},
];

const roleLabel = (role?: UserRole | null) => role ? role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "User";

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const basePath = schoolSlug ? `/${schoolSlug}` : "";
  const currentRole = user?.role ?? "SCHOOL_ADMIN";
  const pending = user?.role === "SCHOOL_ADMIN" && user.activationStatus === "PAYMENT_PENDING";

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  const groups = useMemo(() => NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => item.roles.includes(currentRole)) })).filter(group => group.items.length), [currentRole]);
  const pageLabel = useMemo(() => { const value = location.pathname.split("/").filter(Boolean).pop() || "dashboard"; return value === "student-portal" ? "Student Portal" : value.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }, [location.pathname]);
  const initials = (user?.name || "U").split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
  const go = (path: string) => navigate(`${basePath}${path}`);
  const handleLogout = () => { logout(); navigate(schoolSlug ? `/${schoolSlug}/login` : "/school-login"); };
  const isFreeRoute = ["/dashboard", "/subscription", "/settings"].some(path => location.pathname.endsWith(path));

  return <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
    <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />}</AnimatePresence>
    <motion.aside animate={{ width: collapsed ? 76 : 264 }} transition={{ duration: .2 }} className={`fixed inset-y-0 left-0 z-50 flex flex-col glass border-r border-white/[0.07] shadow-2xl md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
      <div className="h-16 px-3 flex items-center justify-between border-b border-white/[0.07] shrink-0">
        <button onClick={() => go("/dashboard")} className="flex items-center gap-3 min-w-0">
          <span className="h-9 w-9 rounded-xl gradient-bg-primary flex items-center justify-center shadow-lg glow-violet-sm shrink-0"><School size={18} className="text-white" strokeWidth={2.5} /></span>
          {!collapsed && <span className="text-left"><span className="block text-[15px] font-black tracking-tight">EduSphere</span><span className="block text-[10px] text-muted-foreground font-medium">School ERP</span></span>}
        </button>
        <button onClick={() => setCollapsed(v => !v)} className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg btn-ghost shrink-0" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 rounded-lg btn-ghost"><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-thin">
        {groups.map(group => <section key={group.label}>
          {!collapsed && <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{group.label}</p>}
          <div className="space-y-1">{group.items.map(item => {
            const target = `${basePath}${item.path}`;
            const active = location.pathname === target || (item.path !== "/dashboard" && location.pathname.startsWith(target + "/"));
            const locked = pending && !["/dashboard", "/subscription", "/settings"].includes(item.path);
            const Icon = item.icon;
            return <NavLink key={item.path} to={target} onClick={event => { if (locked) event.preventDefault(); else setMobileOpen(false); }} title={collapsed ? item.label : undefined} className={`group relative flex items-center rounded-xl transition-all duration-150 ${collapsed ? "justify-center h-10" : "gap-3 px-3 h-10"} ${active && !locked ? "bg-violet-500/12 text-violet-400 border border-violet-500/25 shadow-sm" : locked ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.045]"}`}>
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />{!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}{!collapsed && locked && <LockKeyhole size={13} className="ml-auto" />}{collapsed && <span className="sidebar-tooltip">{item.label}{locked ? " · Activate plan" : ""}</span>}
            </NavLink>;
          })}</div>
        </section>)}
      </nav>
      <div className="p-2.5 border-t border-white/[0.07] shrink-0"><div className={`rounded-xl border border-white/[0.06] bg-white/[0.025] ${collapsed ? "p-1" : "p-2"}`}>
        {collapsed ? <button onClick={handleLogout} title="Sign out" className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"><LogOut size={17} /></button> : <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg gradient-bg-primary flex items-center justify-center text-white text-[11px] font-bold shrink-0">{initials}</div><div className="min-w-0 flex-1"><p className="text-[12px] font-bold truncate">{user?.name || "User"}</p><p className="text-[10px] text-muted-foreground truncate">{roleLabel(currentRole)}</p></div><button onClick={handleLogout} title="Sign out" className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"><LogOut size={15} /></button></div>}
      </div></div>
    </motion.aside>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="glass border-b border-white/[0.07] shrink-0 z-30">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1"><button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-xl btn-ghost shrink-0"><Menu size={18} /></button>
            <div className="hidden sm:flex items-center gap-2.5 w-full max-w-xs h-10 px-3 rounded-xl border border-white/[0.07] bg-white/[0.025] focus-within:border-violet-500/35 transition-all"><Search size={15} className="text-muted-foreground shrink-0" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/60" /></div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground min-w-0"><span className="truncate">{user?.schoolName || "EduSphere"}</span><span>•</span><span className="text-violet-400 font-semibold">{pageLabel}</span></div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user?.schoolName && <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1.5 text-[11px] text-violet-400 font-semibold"><School size={12} />{user.schoolName}</div>}
            <button onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"} className="h-9 w-9 rounded-xl btn-ghost border border-white/[0.07]">{theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-violet-400" />}</button>
            <button onClick={() => go("/notifications")} title="Notifications" className="relative h-9 w-9 rounded-xl btn-ghost border border-white/[0.07]"><Bell size={16} /><span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500" /></button>
            <div className="relative"><button onClick={() => setProfileOpen(v => !v)} className="h-9 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-1.5 pr-2 hover:bg-white/[0.05] transition-all"><span className="h-7 w-7 rounded-lg gradient-bg-primary flex items-center justify-center text-white text-[10px] font-bold">{initials}</span><ChevronDown size={13} className={`text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>{profileOpen && <><div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} /><motion.div initial={{ opacity: 0, y: 6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .98 }} className="absolute right-0 top-full mt-2 w-64 glass-elevated rounded-2xl border border-white/[0.08] shadow-2xl z-40 overflow-hidden"><div className="p-4 border-b border-white/[0.07]"><p className="font-bold text-sm truncate">{user?.name || "User"}</p><p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p><span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-400"><ShieldCheck size={12} />{roleLabel(currentRole)}</span></div><div className="p-2"><button onClick={() => { setProfileOpen(false); go("/settings"); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"><Settings size={14} />Settings</button><button onClick={() => { setProfileOpen(false); handleLogout(); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10"><LogOut size={14} />Sign out</button></div></motion.div></>}</AnimatePresence>
            </div>
          </div>
        </div>
        {pending && <div className="px-4 sm:px-6 py-2.5 border-t border-amber-500/15 bg-amber-500/8 text-[11px] text-amber-300 flex items-center justify-between gap-3"><span><strong>Payment pending.</strong> Features unlock after Super Admin approval.</span><button onClick={() => go("/subscription")} className="font-bold underline underline-offset-2 shrink-0">Review payment</button></div>}
      </header>
      <main className="flex-1 overflow-y-auto scrollbar-thin"><div className="min-h-full p-4 sm:p-6 lg:p-8 animate-fade-in">{pending && !isFreeRoute ? <div className="mx-auto max-w-2xl mt-10 rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] p-8 sm:p-10 text-center shadow-xl"><div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center"><LockKeyhole size={25} className="text-amber-300" /></div><p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Activation pending</p><h1 className="mt-2 text-2xl font-black">Complete payment verification to unlock your school.</h1><p className="mt-3 text-sm text-muted-foreground leading-6">Your dashboard remains available while the Super Admin reviews your payment. All school modules will unlock after approval.</p><button onClick={() => go("/subscription")} className="mt-6 rounded-xl gradient-bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg">Open Subscription</button></div> : <Outlet />}</div></main>
    </div>
  </div>;
};
