import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, Bell, BookOpen, BriefcaseBusiness, Building2, Bus, CalendarDays, ChevronDown, ClipboardCheck, CreditCard, GraduationCap, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, NotebookTabs, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck, School, Sun, UserRound, UsersRound, WalletCards, X, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { UserRole } from '@/context/AuthContext';

interface NavItem { label: string; path: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; roles: UserRole[] }
interface NavGroup { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] }] },
  { label: 'People', items: [
    { label: 'Students', path: '/students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Teachers', path: '/teachers', icon: UserRound, roles: ['SCHOOL_ADMIN'] },
    { label: 'Parents', path: '/parents', icon: UsersRound, roles: ['SCHOOL_ADMIN'] },
    { label: 'Staff', path: '/staff', icon: BriefcaseBusiness, roles: ['SCHOOL_ADMIN'] },
  ] },
  { label: 'Academics', items: [
    { label: 'Classes & Subjects', path: '/classes', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Homework', path: '/homework', icon: FileText, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    { label: 'Exams & Results', path: '/exams', icon: ClipboardCheck, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    { label: 'Timetable', path: '/timetable', icon: CalendarDays, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  ] },
  { label: 'Daily Operations', items: [
    { label: 'Attendance', path: '/attendance', icon: NotebookTabs, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    { label: 'Fees & Finance', path: '/finance', icon: WalletCards, roles: ['SCHOOL_ADMIN', 'STUDENT'] },
    { label: 'Notice Board', path: '/notices', icon: Bell, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    { label: 'Transport', path: '/transport', icon: Bus, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  ] },
  { label: 'Insights', items: [
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'TEACHER'] },
    { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  ] },
  { label: 'Administration', items: [
    { label: 'Subscription', path: '/subscription', icon: CreditCard, roles: ['SCHOOL_ADMIN'] },
    { label: 'Buildings', path: '/buildings', icon: Building2, roles: ['SCHOOL_ADMIN'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['SCHOOL_ADMIN'] },
  ] },
  { label: 'My Account', items: [{ label: 'Student LMS', path: '/student-portal', icon: UserRound, roles: ['STUDENT'] }] },
];

const roleLabel = (role?: UserRole | null) => role ? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'User';

export const DashboardLayoutPremium: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { schoolSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const role = user?.role ?? 'SCHOOL_ADMIN';
  const base = schoolSlug ? `/${schoolSlug}` : '';
  const home = role === 'STUDENT' ? '/student-portal' : '/dashboard';
  const pending = role === 'SCHOOL_ADMIN' && user?.activationStatus === 'PAYMENT_PENDING';
  const freeRoutes = ['/dashboard', '/subscription', '/settings'];
  const groups = useMemo(() => NAV.map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) })).filter((group) => group.items.length), [role]);
  const pageLabel = useMemo(() => {
    const value = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    return value === 'student-portal' ? 'Student LMS' : value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [location.pathname]);
  const initials = (user?.name || 'U').split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location.pathname]);

  const go = (path: string) => navigate(`${base}${path}`);
  const signOut = () => { logout(); navigate(schoolSlug ? `/${schoolSlug}/login` : '/school-login'); };

  return <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
    <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />}</AnimatePresence>
    <motion.aside animate={{ width: collapsed ? 78 : 272 }} transition={{ duration: .2 }} className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card shadow-2xl md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
        <button onClick={() => go(home)} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg"><School size={18} strokeWidth={2.5} /></span>
          {!collapsed && <span className="text-left"><span className="block text-[15px] font-black tracking-tight">EduSphere</span><span className="block text-[10px] text-muted-foreground">School ERP</span></span>}
        </button>
        <button onClick={() => setCollapsed((value) => !value)} className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent md:flex">{collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-accent md:hidden"><X size={18} /></button>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-4">
        {groups.map((group) => <section key={group.label} className="mb-5"><p className={`mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70 ${collapsed ? 'sr-only' : ''}`}>{group.label}</p><div className="space-y-1">{group.items.map((item) => { const target = `${base}${item.path}`; const active = location.pathname === target || (item.path !== '/dashboard' && location.pathname.startsWith(`${target}/`)); const locked = pending && !freeRoutes.includes(item.path); const Icon = item.icon; return <NavLink key={item.path} to={target} onClick={(event) => { if (locked) event.preventDefault(); }} title={collapsed ? item.label : undefined} className={`group relative flex h-10 items-center rounded-xl transition-all ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${active && !locked ? 'border border-violet-500/25 bg-violet-500/10 text-violet-500' : locked ? 'cursor-not-allowed text-muted-foreground/40' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><Icon size={17} strokeWidth={active ? 2.5 : 2} />{!collapsed && <span className="truncate text-[13px] font-semibold">{item.label}</span>}{!collapsed && locked && <LockKeyhole size={13} className="ml-auto" />}{collapsed && <span className="sidebar-tooltip">{item.label}{locked ? ' · Activate plan' : ''}</span>}</NavLink>; })}</div></section>)}
      </nav>
      <div className="shrink-0 border-t border-border p-2.5"><div className="rounded-xl border border-border bg-muted/30 p-2">{collapsed ? <button onClick={signOut} className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"><LogOut size={17} /></button> : <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold">{user?.name || 'User'}</p><p className="truncate text-[10px] text-muted-foreground">{roleLabel(role)}</p></div><button onClick={signOut} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"><LogOut size={15} /></button></div>}</div></div>
    </motion.aside>

    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-xl z-30"><div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-border p-2 hover:bg-accent md:hidden"><Menu size={18} /></button><div className="hidden h-10 w-full max-w-xs items-center gap-2.5 rounded-xl border border-border bg-card px-3 sm:flex"><Search size={15} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="w-full bg-transparent text-sm outline-none" /></div><div className="hidden min-w-0 items-center gap-2 text-xs text-muted-foreground lg:flex"><span className="truncate">{user?.schoolName || 'EduSphere'}</span><span>•</span><span className="font-semibold text-violet-500">{pageLabel}</span></div></div>
        <div className="flex shrink-0 items-center gap-2">{user?.schoolName && <div className="hidden items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-500 xl:flex"><School size={12} />{user.schoolName}</div>}<button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-accent">{theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-violet-500" />}</button><button onClick={() => go('/notifications')} title="Notifications" className="relative h-9 w-9 rounded-xl border border-border bg-card hover:bg-accent"><Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500" /></button>
          <div className="relative"><button onClick={() => setProfileOpen((value) => !value)} className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-1.5 pr-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white">{initials}</span><ChevronDown size={13} /></button><AnimatePresence>{profileOpen && <><div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} /><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><div className="border-b border-border p-4"><p className="truncate text-sm font-bold">{user?.name || 'User'}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500"><ShieldCheck size={12} />{roleLabel(role)}</span></div><div className="p-2">{role === 'SCHOOL_ADMIN' ? <button onClick={() => { setProfileOpen(false); go('/settings'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent"><Settings size={14} />Settings</button> : role === 'STUDENT' ? <button onClick={() => { setProfileOpen(false); go('/student-portal'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent"><UserRound size={14} />Student LMS</button> : <button onClick={() => { setProfileOpen(false); go('/teacher/classes'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-muted-foreground hover:bg-accent"><UserRound size={14} />Teacher LMS</button>}<button onClick={() => { setProfileOpen(false); signOut(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-rose-500 hover:bg-rose-500/10"><LogOut size={14} />Sign out</button></div></motion.div></>}</AnimatePresence></div>
        </div>
      </div>{pending && <div className="flex items-center justify-between gap-3 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[11px] text-amber-700 dark:text-amber-300 sm:px-6"><span><strong>Payment pending.</strong> Modules unlock after Super Admin approval.</span><button onClick={() => go('/subscription')} className="font-bold underline underline-offset-2">Review payment</button></div>}</header>
      <main className="scrollbar-thin flex-1 overflow-y-auto"><div className="min-h-full p-4 sm:p-6 lg:p-8 animate-fade-in">{pending && !freeRoutes.includes(location.pathname.replace(base, '')) ? <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center shadow-xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10"><LockKeyhole size={25} className="text-amber-500" /></div><p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">Activation pending</p><h1 className="mt-2 text-2xl font-black">Complete payment verification to unlock your school.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your dashboard remains available while the Super Admin reviews your payment.</p><button onClick={() => go('/subscription')} className="mt-6 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white">Open Subscription</button></div> : <Outlet />}</div></main>
    </div>
  </div>;
};

export default DashboardLayoutPremium;
