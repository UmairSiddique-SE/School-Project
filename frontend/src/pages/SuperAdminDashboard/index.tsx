import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  School,
  FileText,
  CreditCard,
  BarChart2,
  Bell,
  Mail,
  Settings,
  Shield,
  User,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Clock,
  Zap,
  LifeBuoy,
  Megaphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";

// Section Imports
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
import Subscriptions from "./sections/Subscriptions";
import Users from "./sections/Users";
import Support from "./sections/Support";
import Announcements from "./sections/Announcements";

type SectionId =
  | "overview"
  | "school-requests"
  | "schools"
  | "plans"
  | "subscriptions"
  | "payments"
  | "users"
  | "support"
  | "announcements"
  | "reports"
  | "notifications"
  | "email-templates"
  | "system-settings"
  | "audit-logs"
  | "profile";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<any>;
  badgeKey?: "pendingSchoolRequests" | "pendingPayments";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Platform Core",
    items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Institutional Governance",
    items: [
      {
        id: "school-requests",
        label: "School Requests",
        icon: FileText,
        badgeKey: "pendingSchoolRequests",
      },
      {
        id: "schools",
        label: "Schools",
        icon: School,
      },
    ],
  },
  {
    label: "Treasury & License",
    items: [
      { id: "subscriptions", label: "Subscriptions", icon: Shield },
      { id: "plans", label: "Plans & Pricing", icon: Zap },
      {
        id: "payments",
        label: "Payments",
        icon: CreditCard,
        badgeKey: "pendingPayments",
      },
    ],
  },
  {
    label: "Operations & Users",
    items: [
      { id: "users", label: "User Management", icon: User },
      { id: "support", label: "Support / Tickets", icon: LifeBuoy },
    ],
  },
  {
    label: "Communication",
    items: [
      { id: "announcements", label: "Announcements", icon: Megaphone },
      { id: "notifications", label: "System Alerts", icon: Bell },
      { id: "email-templates", label: "Email Templates", icon: Mail },
    ],
  },
  {
    label: "Insights & Settings",
    items: [
      { id: "reports", label: "Reports", icon: BarChart2 },
      { id: "audit-logs", label: "Activity Logs", icon: Shield },
      { id: "system-settings", label: "System Settings", icon: Settings },
      { id: "profile", label: "My Profile", icon: User },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

const sectionComponents: Record<SectionId, React.ComponentType> = {
  overview: Overview,
  "school-requests": SchoolRequests,
  schools: Schools,
  plans: Plans,
  subscriptions: Subscriptions,
  payments: Payments,
  users: Users,
  support: Support,
  announcements: Announcements,
  reports: Reports,
  notifications: Notifications,
  "email-templates": EmailTemplates,
  "system-settings": SystemSettings,
  "audit-logs": AuditLogs,
  profile: Profile,
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums">
      {time.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingSchoolRequests: number;
    pendingPayments: number;
  }>({
    pendingSchoolRequests: 0,
    pendingPayments: 0,
  });
  const { logout } = useAuth() as any;
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get("/admin/overview")
      .then((r) => {
        setBadgeCounts({
          pendingSchoolRequests: r.data?.pendingSchoolRequests ?? 0,
          pendingPayments: r.data?.pendingPayments ?? 0,
        });
      })
      .catch(() => {});
  }, [activeSection]);

  const ActiveComponent = sectionComponents[activeSection];
  const activeItem = allNavItems.find((n) => n.id === activeSection);

  const handleNav = (id: SectionId) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const SidebarContent = () => (
    <>
      <div className="relative shrink-0 overflow-hidden px-5 py-5">
        <div className="absolute -left-7 -top-7 h-28 w-28 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/40">
                <Shield size={16} className="text-white" />
              </div>
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400 shadow pulse-dot" />
            </div>
            <div>
              <p className="text-sm font-black leading-none tracking-tight text-foreground">
                EduSphere
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Multi-Tenant SaaS
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const badge = item.badgeKey
                  ? badgeCounts[item.badgeKey]
                  : undefined;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "text-white"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/90 to-indigo-600/90 shadow-lg shadow-violet-500/30"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="sidebar-accent"
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white/60"
                      />
                    )}

                    <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
                      <Icon
                        size={16}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span className="flex-1 truncate text-left text-[13px] font-semibold">
                        {item.label}
                      </span>
                    </div>

                    {badge !== undefined && badge > 0 && (
                      <span
                        className={`relative z-10 min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-black tabular-nums ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-violet-500/15 text-violet-400"
                        }`}
                      >
                        {badge}
                      </span>
                    )}

                    {isActive && (
                      <ChevronRight
                        size={12}
                        className="relative z-10 shrink-0 text-white/60"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-3">
        <div className="mb-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="group flex items-center gap-3 rounded-xl border border-violet-500/15 bg-gradient-to-r from-violet-500/8 to-indigo-500/5 px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white shadow-md shadow-violet-500/30">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold leading-none text-foreground">
              Super Admin
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Root Governance
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
          >
            <LogOut size={13} />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground/40">
          <Zap size={9} />
          EduSphere Multi-Tenant SaaS
        </div>
      </div>
    </>
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-[28px] border border-violet-500/15 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_30%),linear-gradient(135deg,#0b1020_0%,#111827_38%,#0f172a_100%)] shadow-[0_20px_60px_rgba(15,23,42,0.65)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02),transparent_25%,transparent_75%,rgba(255,255,255,0.02))]" />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-violet-500/10 bg-slate-950/80 backdrop-blur-xl lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } transition-transform duration-300`}
      >
        {SidebarContent()}
      </motion.aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Header Bar ── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-violet-500/10 bg-slate-950/60 px-5 py-3 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground transition-all"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Shield size={13} className="text-violet-400 shrink-0" />
              <span className="hidden sm:inline">Super Admin Console</span>
              <ChevronRight size={12} className="hidden sm:inline opacity-40" />
            </div>
            {activeItem && (
              <div className="flex items-center gap-2">
                <activeItem.icon size={15} className="text-primary shrink-0" />
                <h1 className="text-sm font-black text-foreground truncate">
                  {activeItem.label}
                </h1>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground font-medium">
              <Clock size={12} className="text-violet-400" />
              <LiveClock />
            </div>

            <button
              onClick={() => handleNav("notifications")}
              className="relative rounded-lg p-2 text-muted-foreground transition-all hover:bg-violet-500/10 hover:text-violet-200"
            >
              <Bell size={16} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-slate-950" />
            </button>

            <div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-black text-white shadow-md shadow-violet-500/30"
              onClick={() => handleNav("profile")}
              title="My Profile"
            >
              SA
            </div>
          </div>
        </header>

        {/* ── Section Content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1800px] p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
