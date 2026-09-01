import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, School, FileText, CreditCard, BarChart2,
  Bell, Mail, Settings, Shield, User, Menu, X, ChevronRight,
} from 'lucide-react';

// Section Imports
import Overview from './sections/Overview';
import SchoolRequests from './sections/SchoolRequests';
import Schools from './sections/Schools';
import Plans from './sections/Plans';
import Payments from './sections/Payments';
import Reports from './sections/Reports';
import Notifications from './sections/Notifications';
import EmailTemplates from './sections/EmailTemplates';
import SystemSettings from './sections/SystemSettings';
import AuditLogs from './sections/AuditLogs';
import Profile from './sections/Profile';

type SectionId =
  | 'overview' | 'school-requests' | 'schools' | 'plans'
  | 'payments' | 'reports' | 'notifications' | 'email-templates'
  | 'system-settings' | 'audit-logs' | 'profile';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number | string;
  dividerBefore?: boolean;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'school-requests', label: 'School Requests', icon: FileText, badge: 3 },
  { id: 'schools', label: 'Schools', icon: School },
  { id: 'plans', label: 'Plans', icon: Shield, dividerBefore: true },
  { id: 'payments', label: 'Payments', icon: CreditCard, badge: 3 },
  { id: 'reports', label: 'Reports', icon: BarChart2, dividerBefore: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 4 },
  { id: 'email-templates', label: 'Email Templates', icon: Mail, dividerBefore: true },
  { id: 'system-settings', label: 'System Settings', icon: Settings },
  { id: 'audit-logs', label: 'Audit Logs', icon: Shield },
  { id: 'profile', label: 'Profile', icon: User, dividerBefore: true },
];

const sectionComponents: Record<SectionId, React.ComponentType> = {
  'overview': Overview,
  'school-requests': SchoolRequests,
  'schools': Schools,
  'plans': Plans,
  'payments': Payments,
  'reports': Reports,
  'notifications': Notifications,
  'email-templates': EmailTemplates,
  'system-settings': SystemSettings,
  'audit-logs': AuditLogs,
  'profile': Profile,
};

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const ActiveComponent = sectionComponents[activeSection];
  const activeItem = navItems.find(n => n.id === activeSection);

  const handleNav = (id: SectionId) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-border bg-background">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sub Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border w-64 shrink-0 lg:translate-x-0 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground leading-none">Super Admin</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Platform Control</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && <div className="h-px bg-border my-2" />}
                <button
                  onClick={() => handleNav(item.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={13} className="shrink-0 opacity-60" />}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-border shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-black shrink-0">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">EduSphere v1.0</p>
              <p className="text-[10px] text-muted-foreground">Platform Edition</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu size={18} />
          </button>
          {activeItem && (
            <>
              <activeItem.icon size={18} className="text-primary shrink-0" />
              <h1 className="text-base font-black text-foreground">{activeItem.label}</h1>
            </>
          )}
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
