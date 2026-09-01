import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/context/AuthContext';

import {
  LayoutDashboard, GraduationCap, UserCheck, Users, Briefcase,
  BookOpen, FileText, ClipboardList, FileSpreadsheet,
  Calendar, CreditCard, Bell, BellRing, Bus, BarChart3,
  Settings, LogOut, Menu, X,
  ChevronLeft, ChevronDown,
  Search, Shield, Sparkles,
  Activity, TrendingUp, Eye, EyeOff,
  School,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  badge?: number;
  badgeVariant?: 'violet' | 'rose' | 'amber' | 'emerald';
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Platform',
    items: [
      { name: 'Super Admin', path: '/super-admin', icon: Shield, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    ],
  },
  {
    label: 'People',
    items: [
      { name: 'Students', path: '/students', icon: GraduationCap, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Teachers', path: '/teachers', icon: UserCheck, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Parents', path: '/parents', icon: Users, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      { name: 'Staff', path: '/staff', icon: Briefcase, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { name: 'Classes', path: '/classes', icon: BookOpen, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Homework', path: '/homework', icon: FileText, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Exams', path: '/exams', icon: ClipboardList, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Timetable', path: '/timetable', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Attendance', path: '/attendance', icon: Calendar, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Mark Attendance', path: '/teacher/attendance', icon: Calendar, roles: ['TEACHER'] },
      { name: 'Finance', path: '/finance', icon: CreditCard, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Notices', path: '/notices', icon: BellRing, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Transport', path: '/transport', icon: Bus, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { name: 'My Classes', path: '/teacher/classes', icon: BookOpen, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
      { name: 'Grades', path: '/teacher/grades', icon: FileSpreadsheet, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
      {
        name: 'Notifications', path: '/notifications', icon: Bell,
        roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
        badge: 4, badgeVariant: 'violet',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Subscription', path: '/subscription', icon: Sparkles, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
      { name: 'Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
    ],
  },
];

/* ===== Right Activity Panel Data ===== */
const ACTIVITY_ITEMS = [
  { id: 1, icon: GraduationCap, title: 'New student enrolled', subtitle: 'Aarav Sharma — Class 10-A', time: '2m ago', dot: 'bg-violet-500' },
  { id: 2, icon: CreditCard, title: 'Fee payment received', subtitle: '₹15,000 — Priya Patel', time: '14m ago', dot: 'bg-emerald-500' },
  { id: 3, icon: Calendar, title: 'Attendance marked', subtitle: 'Class 9-B — 94% present', time: '32m ago', dot: 'bg-blue-500' },
  { id: 4, icon: ClipboardList, title: 'Exam results published', subtitle: 'Mathematics — Mid Term', time: '1h ago', dot: 'bg-amber-500' },
  { id: 5, icon: BellRing, title: 'Notice posted', subtitle: 'Annual Sports Day — Dec 15', time: '2h ago', dot: 'bg-rose-500' },
  { id: 6, icon: UserCheck, title: 'Teacher joined', subtitle: 'Ms. Anjali Verma — Science', time: '3h ago', dot: 'bg-cyan-500' },
];

/* ===== Sidebar Nav Item ===== */
const NavItem: React.FC<{
  item: SidebarItem;
  basePath: string;
  collapsed: boolean;
  onMobileClose: () => void;
}> = ({ item, basePath, collapsed, onMobileClose }) => {
  const location = useLocation();
  const Icon = item.icon;
  const currentPath = item.path.startsWith('/') ? item.path : '/' + item.path;
  const targetPath = item.path.startsWith('/super-admin')
    ? '/super-admin'
    : `${basePath || '/demo'}${currentPath}`;
  const isActive = location.pathname === targetPath || (currentPath !== '/dashboard' && location.pathname.endsWith(currentPath));

  return (
    <NavLink
      to={targetPath}
      onClick={onMobileClose}
      className={({ isActive: navActive }) =>
        `sidebar-nav-item relative ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${
          (isActive || navActive) ? 'active' : ''
        }`
      }
    >
      <Icon size={16} className="shrink-0" strokeWidth={isActive ? 2.5 : 2} />

      {!collapsed && (
        <span className="flex-1 text-[13px] font-medium truncate">{item.name}</span>
      )}

      {!collapsed && item.badge && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
          item.badgeVariant === 'violet' ? 'badge-violet' :
          item.badgeVariant === 'rose' ? 'badge-rose' :
          item.badgeVariant === 'amber' ? 'badge-amber' : 'badge-emerald'
        }`}>
          {item.badge}
        </span>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span className="sidebar-tooltip">{item.name}</span>
      )}
    </NavLink>
  );
};

/* ===== Main Layout ===== */
export const DashboardLayout: React.FC = () => {
  const { user, logout, previewRole, setPreviewRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolSlug } = useParams();
  const basePath = schoolSlug ? `/${schoolSlug}` : '';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveRole = previewRole ?? user?.role ?? 'SCHOOL_ADMIN';
  const isPreviewMode = !!previewRole;

  // Close mobile sidebar on route change
  useEffect(() => {
    const close = () => setMobileOpen(false);
    close();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(schoolSlug ? `/${schoolSlug}/login` : '/login');
  };

  const filteredGroups = sidebarGroups
    .map(g => ({ ...g, items: g.items.filter(i => effectiveRole && i.roles.includes(effectiveRole as UserRole)) }))
    .filter(g => g.items.length > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')?.[0] ?? 'User';
  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  /* ===== Page label from path ===== */
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageLabel = pathSegments[pathSegments.length - 1]
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, l => l.toUpperCase()) ?? 'Dashboard';

  /* ===== Sidebar Width ===== */
  const SIDEBAR_W = collapsed ? 72 : 260;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      {/* ===== MOBILE BACKDROP ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <motion.aside
        animate={{ width: SIDEBAR_W }}
        transition={{ type: 'spring' as const, damping: 28, stiffness: 260 }}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden
          glass border-r border-white/[0.06]
          md:static md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ willChange: 'width' }}
      >

        {/* Sidebar — Logo */}
        <div className="flex h-[60px] items-center justify-between px-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo mark */}
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-xl gradient-bg-primary flex items-center justify-center shadow-lg glow-violet-sm">
                <School size={16} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="logo-text"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <p className="text-[15px] font-black text-white tracking-tight leading-none">EduSphere</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">School ERP</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle — desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-slate-500 hover:text-slate-300 transition-all shrink-0"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronLeft size={12} strokeWidth={2.5} />
            </motion.div>
          </button>

          {/* Close — mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar — Nav Groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
          {filteredGroups.map((group, gi) => (
            <div key={gi}>
              {/* Group label */}
              {!collapsed && group.label && (
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-600 px-3 mb-1.5">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="h-px bg-white/[0.05] mx-2 mb-2" />
              )}

              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.path}
                    item={item}
                    basePath={basePath}
                    collapsed={collapsed}
                    onMobileClose={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar — Upgrade Banner */}
        {!collapsed ? (
          <div className="p-2 border-t border-white/[0.05] shrink-0">
            <div className="gradient-border-card">
              <div className="gradient-border-card-inner p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={13} className="text-violet-400" />
                  <span className="text-[11px] font-bold text-white">EduSphere Pro</span>
                  <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full badge-violet">NEW</span>
                </div>
                <button
                  onClick={() => navigate(`${basePath}/subscription`)}
                  className="btn-primary w-full px-2.5 py-1.5 text-[10.5px] rounded-lg mt-1"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-white/[0.05] shrink-0">
            <button
              onClick={() => navigate(`${basePath}/subscription`)}
              title="Upgrade"
              className="flex w-full items-center justify-center p-2 rounded-xl text-violet-400 hover:bg-violet-500/10 transition-all"
            >
              <Sparkles size={16} />
            </button>
          </div>
        )}

        {/* Sidebar — User + Logout */}
        <div className={`p-2.5 border-t border-white/[0.05] shrink-0 ${collapsed ? '' : 'px-3'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all">
              <div className="h-8 w-8 rounded-xl gradient-bg-primary flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex w-full items-center justify-center p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* ===== NAVBAR ===== */}
        <header className="glass border-b border-white/[0.05] shrink-0 z-30">
          <div className="flex h-[60px] items-center justify-between px-5 gap-4">

            {/* Left: mobile hamburger + search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Mobile menu */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl btn-ghost shrink-0"
              >
                <Menu size={18} />
              </button>

              {/* Smart search */}
              <div className={`
                hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200
                border ${searchFocused
                  ? 'border-violet-500/40 bg-violet-500/5 w-72'
                  : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] w-52'
                }
              `}>
                <Search size={14} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search anything..."
                  className="bg-transparent border-none text-[13px] text-slate-300 outline-none flex-1 placeholder:text-slate-600"
                />
                {!searchFocused && !searchQuery && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <kbd className="text-[9px] font-mono text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.06]">
                      ⌘K
                    </kbd>
                  </div>
                )}
              </div>

              {/* Breadcrumb */}
              <div className="hidden lg:flex items-center gap-2 text-[12px] text-slate-600">
                <span className="text-slate-500">{greeting},</span>
                <span className="text-white font-semibold">{firstName}</span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">{pageLabel}</span>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2 shrink-0">

              {/* School pill */}
              {user?.schoolName && (
                <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-[11px] font-semibold text-violet-400">
                  <School size={11} />
                  <span className="max-w-[120px] truncate">{user.schoolName}</span>
                </div>
              )}

              {/* Preview portal toggle */}
              {user?.role === 'SCHOOL_ADMIN' && (
                <button
                  onClick={() => {
                    setPreviewRole(isPreviewMode ? null : 'STUDENT');
                    navigate(`${basePath}/dashboard`);
                  }}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                    isPreviewMode
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-400'
                      : 'border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  {isPreviewMode ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isPreviewMode ? 'Exit Preview' : 'Preview Portal'}
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={() => navigate(`${basePath}/notifications`)}
                className="relative p-2 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-all"
              >
                <Bell size={16} strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 pulse-dot" />
              </button>

              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-1.5 pr-2 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                >
                  <div className="h-7 w-7 rounded-lg gradient-bg-primary flex items-center justify-center font-bold text-white text-[11px] shadow-md">
                    {initials}
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-slate-600 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        className="glass-elevated absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.08] shadow-2xl z-40 overflow-hidden"
                      >
                        {/* User info */}
                        <div className="px-4 py-4 border-b border-white/[0.06]">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl gradient-bg-primary flex items-center justify-center font-bold text-white text-base shadow-lg">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-white truncate">{user?.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-medium">{user?.role?.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2">
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate(`${basePath}/settings`); }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all"
                          >
                            <Settings size={14} className="text-slate-500" />
                            Account Settings
                          </button>
                          <button
                            onClick={() => { setUserMenuOpen(false); navigate(`${basePath}/notifications`); }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-all"
                          >
                            <Bell size={14} className="text-slate-500" />
                            Notifications
                            <span className="ml-auto badge-violet text-[10px] font-bold px-1.5 py-0.5 rounded-full">4</span>
                          </button>
                        </div>

                        <div className="p-2 border-t border-white/[0.06]">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Preview mode banner */}
          <AnimatePresence>
            {isPreviewMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-2 bg-amber-500/8 border-t border-amber-500/20">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400">
                    <Eye size={12} />
                    <span>Viewing as Student — Read-only preview mode</span>
                  </div>
                  <button
                    onClick={() => setPreviewRole(null)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <EyeOff size={11} />
                    Exit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ===== CONTENT ===== */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-6 lg:p-8 animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="h-9 border-t border-white/[0.04] flex items-center justify-between px-5 bg-white/[0.01] shrink-0">
          <span className="text-[10.5px] text-slate-700">
            © {new Date().getFullYear()} EduSphere ERP
          </span>
          <div className="flex items-center gap-3 text-[10.5px] text-slate-700">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 font-medium">All systems normal</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
