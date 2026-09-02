import React, { useState, useEffect } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import type { UserRole } from "@/context/AuthContext";

import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  BookOpen,
  FileText,
  ClipboardList,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Bell,
  BellRing,
  Bus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Shield,
  Sparkles,
  School,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  badge?: number;
  badgeVariant?: "violet" | "rose" | "amber" | "emerald";
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        name: "Students",
        path: "/students",
        icon: GraduationCap,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Staff",
        path: "/staff",
        icon: Briefcase,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
      },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        name: "Classes",
        path: "/classes",
        icon: BookOpen,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Homework",
        path: "/homework",
        icon: FileText,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Exams & Grades",
        path: "/exams",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Timetable",
        path: "/timetable",
        icon: FileSpreadsheet,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Attendance",
        path: "/attendance",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Finance & Fees",
        path: "/finance",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Notices",
        path: "/notices",
        icon: BellRing,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
      {
        name: "Transport",
        path: "/transport",
        icon: Bus,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        name: "Reports",
        path: "/reports",
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"],
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: Bell,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
        badge: 4,
        badgeVariant: "violet",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        name: "Admin Panel",
        path: "/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
      },
    ],
  },
];

/* ===== Sidebar Nav Item ===== */
const NavItem: React.FC<{
  item: SidebarItem;
  basePath: string;
  isExpanded: boolean;
  onMobileClose: () => void;
  locked?: boolean;
}> = ({ item, basePath, isExpanded, onMobileClose, locked = false }) => {
  const location = useLocation();
  const Icon = item.icon;
  const currentPath = item.path.startsWith("/") ? item.path : "/" + item.path;
  const targetPath = item.path.startsWith("/super-admin")
    ? "/super-admin"
    : `${basePath || "/demo"}${currentPath}`;
  const isActive =
    location.pathname === targetPath ||
    (currentPath !== "/dashboard" && location.pathname.endsWith(currentPath));

  return (
    <NavLink
      to={targetPath}
      onClick={(event) => {
        if (locked) event.preventDefault();
        else onMobileClose();
      }}
      className={({ isActive: navActive }) =>
        `sidebar-nav-item relative group flex items-center transition-all duration-200 ${
          isExpanded
            ? "px-3 py-2 gap-2.5"
            : "justify-center p-2 mx-auto w-9 h-9"
        } ${
          (isActive || navActive) && !locked
            ? "active bg-violet-600/15 text-violet-400 font-bold border border-violet-500/30 shadow-sm"
            : locked
              ? "text-slate-600 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
        }`
      }
    >
      <div
        className={`shrink-0 flex items-center justify-center ${isActive ? "text-violet-400" : ""}`}
      >
        {locked ? (
          <LockKeyhole size={16} />
        ) : (
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        )}
      </div>

      {isExpanded && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.15 }}
          className="flex-1 text-[13px] font-medium truncate"
        >
          {item.name}
          {locked ? " - Activate plan" : ""}
        </motion.span>
      )}

      {isExpanded && item.badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            item.badgeVariant === "violet"
              ? "badge-violet"
              : item.badgeVariant === "rose"
                ? "badge-rose"
                : item.badgeVariant === "amber"
                  ? "badge-amber"
                  : "badge-emerald"
          }`}
        >
          {item.badge}
        </motion.span>
      )}

      {/* Floating Tooltip when Collapsed */}
      {!isExpanded && (
        <span className="sidebar-tooltip shadow-2xl z-50">{item.name}</span>
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
  const basePath = schoolSlug ? `/${schoolSlug}` : "";

  const isDashboardRoute =
    location.pathname.endsWith("/dashboard") ||
    location.pathname === `/${schoolSlug}` ||
    location.pathname === `/${schoolSlug}/` ||
    location.pathname === "/";

  // Manual Sidebar Size State (Chota / Bara)
  // Default: True (Bara) on Dashboard, False (Chota) on other sections
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();

  // On page change: Dashboard stays open (Bara), other sections start mini (Chota) unless user toggled
  useEffect(() => {
    setMobileOpen(false);
    if (isDashboardRoute) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Expanded if user manually opened it (Bara) OR hovered with mouse
  const isExpanded = isSidebarOpen || isHovered;

  const effectiveRole = previewRole ?? user?.role ?? "SCHOOL_ADMIN";
  const isPreviewMode = !!previewRole;
  const isActivationPending =
    user?.role === "SCHOOL_ADMIN" &&
    user.activationStatus === "PAYMENT_PENDING";
  const isFreeRoute =
    location.pathname.endsWith("/dashboard") ||
    location.pathname.endsWith("/subscription") ||
    location.pathname.endsWith("/settings");

  const handleLogout = () => {
    logout();
    navigate(schoolSlug ? `/${schoolSlug}/login` : "/login");
  };

  const filteredGroups = sidebarGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => effectiveRole && i.roles.includes(effectiveRole as UserRole),
      ),
    }))
    .filter((g) => g.items.length > 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")?.[0] ?? "User";
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const pageLabel =
    pathSegments[pathSegments.length - 1]
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (l) => l.toUpperCase()) ?? "Dashboard";

  const SIDEBAR_W = isExpanded ? 260 : 72;

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
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR WITH CHOTA / BARA TOGGLE & HOVER ANIMATION ===== */}
      <motion.aside
        animate={{ width: SIDEBAR_W }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        onMouseEnter={() => {
          if (!isSidebarOpen) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden
          glass border-r border-white/[0.06] shadow-xl
          md:static md:translate-x-0 select-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ willChange: "width" }}
      >
        {/* Sidebar Header: Logo + Chota/Bara Toggle */}
        <div className="flex h-[64px] items-center px-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between w-full">
            <div
              className="flex items-center gap-3 overflow-hidden cursor-pointer"
              onClick={() => navigate(`${basePath}/dashboard`)}
            >
              <div className="h-9 w-9 rounded-xl gradient-bg-primary flex items-center justify-center shadow-lg glow-violet-sm shrink-0">
                <School size={18} className="text-white" strokeWidth={2.5} />
              </div>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <p className="text-[15px] font-black text-white tracking-tight leading-none">
                    EduSphere
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    School ERP
                  </p>
                </motion.div>
              )}
            </div>

            {/* Desktop Chota / Bara Toggle Button */}
            <div className="hidden md:flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSidebarOpen(!isSidebarOpen);
                }}
                title={
                  isSidebarOpen
                    ? "Chota Karein (Collapse Sidebar)"
                    : "Bara Karein (Expand Sidebar)"
                }
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-violet-500/40 transition-all cursor-pointer"
              >
                {isExpanded ? (
                  <PanelLeftClose size={14} className="text-violet-400" />
                ) : (
                  <PanelLeftOpen size={14} className="text-slate-400" />
                )}
              </button>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-3 scrollbar-thin">
          {filteredGroups.map((group, gi) => (
            <div key={gi}>
              {/* Group label */}
              {isExpanded ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-500 px-3 mb-1"
                >
                  {group.label}
                </motion.p>
              ) : gi > 0 ? (
                <div className="h-px bg-white/[0.06] mx-2 mb-2" />
              ) : null}

              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    basePath={basePath}
                    isExpanded={isExpanded}
                    onMobileClose={() => setMobileOpen(false)}
                    locked={
                      isActivationPending &&
                      item.path !== "/dashboard" &&
                      item.path !== "/subscription" &&
                      item.path !== "/settings"
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Chota / Bara Size Toggle Strip at Bottom */}
        <div className="p-2 border-t border-white/[0.05] shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all ${
              isExpanded
                ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300"
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]"
            }`}
            title={
              isSidebarOpen ? "Sidebar Chota Karein" : "Sidebar Bara Karein"
            }
          >
            {isExpanded ? (
              <>
                <ChevronLeft size={14} className="text-violet-400" />
                <span className="text-[11px] font-medium">
                  Collapse Sidebar
                </span>
              </>
            ) : (
              <ChevronRight size={16} className="text-violet-400" />
            )}
          </button>
        </div>

        {/* Sidebar User Footer */}
        <div
          className={`p-2 border-t border-white/[0.05] shrink-0 ${isExpanded ? "px-3" : "flex justify-center"}`}
        >
          {isExpanded ? (
            <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.04] transition-all">
              <div className="h-8 w-8 rounded-xl gradient-bg-primary flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="glass border-b border-white/[0.05] shrink-0 z-30">
          <div className="flex h-[64px] items-center justify-between px-5 gap-4">
            {/* Left: Mobile hamburger + Search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl btn-ghost shrink-0"
              >
                <Menu size={18} />
              </button>

              {/* Smart Search */}
              <div
                className={`
                hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200
                border ${
                  searchFocused
                    ? "border-violet-500/40 bg-violet-500/5 w-72"
                    : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] w-52"
                }
              `}
              >
                <Search size={14} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search anything..."
                  className="bg-transparent border-none text-[13px] text-slate-300 outline-none flex-1 placeholder:text-slate-600"
                />
                {!searchFocused && !searchQuery && (
                  <kbd className="text-[9px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.06]">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Breadcrumb Info */}
              <div className="hidden lg:flex items-center gap-2 text-[12px] text-slate-500">
                <span>{greeting},</span>
                <span className="text-white font-semibold">{firstName}</span>
                <span className="text-slate-700">·</span>
                <span className="text-violet-400 font-medium">{pageLabel}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              {user?.schoolName && (
                <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-[11px] font-semibold text-violet-400">
                  <School size={12} />
                  <span className="max-w-[140px] truncate">
                    {user.schoolName}
                  </span>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
                title={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                {theme === "dark" ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-violet-400" />
                )}
              </button>

              {/* Notifications */}
              <button
                onClick={() => navigate(`${basePath}/notifications`)}
                className="relative p-2 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 pulse-dot" />
              </button>

              {/* Profile dropdown */}
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
                    className={`text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
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
                        className="glass-elevated absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.08] shadow-2xl z-40 overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-white/[0.06]">
                          <p className="text-[13px] font-bold text-white truncate">
                            {user?.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold">
                            {user?.role?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="p-2">
                          {user?.role === "SUPER_ADMIN" && (
                            <button
                              onClick={() => {
                                setUserMenuOpen(false);
                                navigate("/super-admin");
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-violet-400 hover:bg-violet-500/10 font-bold"
                            >
                              <Shield size={14} />
                              Super Admin Portal
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              navigate(`${basePath}/settings`);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-slate-300 hover:bg-white/[0.05]"
                          >
                            <Settings size={14} className="text-slate-400" />
                            Admin Panel
                          </button>
                        </div>
                        <div className="p-2 border-t border-white/[0.06]">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-rose-400 hover:bg-rose-500/10"
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

          {/* Read-only preview mode */}
          <AnimatePresence>
            {isPreviewMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-amber-500/10 border-t border-amber-500/20 px-5 py-2 flex items-center justify-between text-[11px] text-amber-400 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Eye size={12} />
                  <span>Viewing in Preview Mode</span>
                </div>
                <button
                  onClick={() => setPreviewRole(null)}
                  className="font-bold flex items-center gap-1 hover:underline"
                >
                  <EyeOff size={12} /> Exit
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 lg:p-8 animate-fade-in">
            {isActivationPending && !isFreeRoute ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-amber-400/20 bg-amber-400/5 p-8 text-center shadow-2xl">
                <LockKeyhole className="mx-auto text-amber-300" size={34} />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                  Account Pending Activation
                </p>
                <h1 className="mt-3 text-2xl font-black text-white">
                  Complete payment to activate your school
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  Your dashboard overview is available. Students, teachers,
                  attendance, fees, exams and reports will unlock after super
                  admin approval.
                </p>
                <button
                  onClick={() => navigate(`${basePath}/subscription`)}
                  className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500"
                >
                  View activation plan
                </button>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
