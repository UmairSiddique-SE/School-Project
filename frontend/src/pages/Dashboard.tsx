import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, BookOpen, TrendingUp, Bell, ArrowRight, DollarSign,
  UserCheck, Activity, Clock, Calendar, FileText, ClipboardList,
  Award, BarChart3, Zap, ChevronRight, Star, AlertCircle,
  Briefcase, CreditCard, BellRing, LayoutDashboard, Shield, Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import StatCard from '@/component/ui/StatCard';
import GlassCard from '@/component/ui/GlassCard';


interface Stats {
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
  staffCount: number;
  classesCount: number;
  totalRevenue: number;
  pendingFees: number;
  pendingFeePaymentsCount: number;
  pendingHomeworks: number;
  pendingLeaves: number;
  overdueLibraryBooks: number;
  announcements: any[];
  recentAdmissions: any[];
  upcomingExams: any[];
}

/* ===== Static fallback data (defined outside component to avoid purity lint) ===== */
const TODAY = new Date('2026-07-27');
const FALLBACK_ADMISSIONS = [
  { name: 'Aarav Sharma', admissionDate: new Date('2026-07-27'), class: '10-A' },
  { name: 'Priya Patel', admissionDate: new Date('2026-07-26'), class: '9-B' },
  { name: 'Rohan Mehta', admissionDate: new Date('2026-07-25'), class: '11-A' },
  { name: 'Sneha Gupta', admissionDate: new Date('2026-07-24'), class: '8-C' },
];

/* ===== Mock chart data ===== */
const revenueData = [
  { month: 'Jan', revenue: 185000, fees: 165000 },
  { month: 'Feb', revenue: 210000, fees: 190000 },
  { month: 'Mar', revenue: 240000, fees: 215000 },
  { month: 'Apr', revenue: 195000, fees: 175000 },
  { month: 'May', revenue: 280000, fees: 255000 },
  { month: 'Jun', revenue: 310000, fees: 285000 },
  { month: 'Jul', revenue: 295000, fees: 270000 },
];

const attendanceData = [
  { day: 'Mon', present: 94 },
  { day: 'Tue', present: 91 },
  { day: 'Wed', present: 96 },
  { day: 'Thu', present: 89 },
  { day: 'Fri', present: 88 },
  { day: 'Sat', present: 75 },
];

const subjectPerf = [
  { subject: 'Math', score: 86 },
  { subject: 'Science', score: 91 },
  { subject: 'English', score: 78 },
  { subject: 'History', score: 82 },
  { subject: 'Hindi', score: 74 },
];

/* ===== Custom Tooltip ===== */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-elevated rounded-xl p-3 border border-white/[0.1] shadow-2xl">
        <p className="text-[11px] font-bold text-slate-400 mb-1">{label || ''}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-[12px] font-bold" style={{ color: p?.color || '#a78bfa' }}>
            {typeof p?.value === 'number' && p.value > 1000
              ? `₹${p.value.toLocaleString('en-IN')}`
              : `${p?.value ?? 0}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ===== Quick Action Card ===== */
function QuickAction({ to, icon: Icon, label, description, gradient, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring' as const, damping: 22 }}
    >
      <Link
        to={to}
        className="group flex items-center gap-3.5 p-4 rounded-2xl glass-card glass-hover transition-all duration-200"
      >
        <div className={`h-10 w-10 rounded-xl ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}>
          <Icon size={18} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-none">{label}</p>
          {description && <p className="text-[11px] text-slate-600 mt-1 truncate">{description}</p>}
        </div>
        <ChevronRight size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </Link>
    </motion.div>
  );
}

/* ===== Section Header ===== */
function SectionHeader({ icon: Icon, title, subtitle, action, onAction }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
          <Icon size={13} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-[14px] font-bold text-white leading-none">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-violet-400 transition-colors"
        >
          {action} <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

/* ===== Skeleton ===== */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton h-9 w-72 rounded-xl" />
        <div className="skeleton h-4 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="skeleton h-64 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

/* ===== Pending Item Row ===== */
function PendingRow({ label, count, color, bgColor }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${bgColor}`} />
        <span className="text-[12.5px] text-slate-400 font-medium">{label}</span>
      </div>
      <span className={`text-[12px] font-black px-2.5 py-0.5 rounded-full ${color}`}>
        {count}
      </span>
    </div>
  );
}

/* ===== Progress Bar ===== */
function AnimatedBar({ pct, color, delay = 0 }: any) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

/* ===== MAIN DASHBOARD ===== */
export default function Dashboard() {
  const { user, previewRole } = useAuth();
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const basePath = schoolSlug ? `/${schoolSlug}` : '';
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user?.schoolId) {
      apiClient.get('/people/stats')
        .then(r => { if (active) setStats(r.data); })
        .catch(() => { })
        .finally(() => { if (active) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const role = previewRole ?? user?.role ?? 'SCHOOL_ADMIN';

  /* ========================================
     SUPER ADMIN DASHBOARD
     ======================================== */
  if (role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-8 max-w-screen-2xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-9 w-9 rounded-2xl gradient-bg-primary flex items-center justify-center shadow-lg glow-violet-sm">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Platform Control Center</h1>
              <p className="text-[12px] text-slate-500 mt-0.5">Manage schools, plans, and platform settings</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to={`${basePath}/super-admin`}>
            <GlassCard className="group cursor-pointer border-violet-500/15 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Super Admin Panel</p>
                  <h3 className="text-xl font-black text-white mt-1">Manage Platform</h3>
                  <p className="text-[12px] text-slate-500 mt-2">View all schools, analytics and system health</p>
                </div>
                <div className="h-14 w-14 rounded-2xl gradient-bg-primary flex items-center justify-center shadow-xl glow-violet group-hover:scale-110 transition-transform">
                  <ArrowRight size={24} className="text-white" />
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link to={`${basePath}/settings`}>
            <GlassCard className="group cursor-pointer border-blue-500/15 hover:border-blue-500/30 transition-colors" delay={0.1}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Configuration</p>
                  <h3 className="text-xl font-black text-white mt-1">System Settings</h3>
                  <p className="text-[12px] text-slate-500 mt-2">Manage platform configuration and security</p>
                </div>
                <div className="h-14 w-14 rounded-2xl gradient-bg-blue flex items-center justify-center shadow-xl glow-blue group-hover:scale-110 transition-transform">
                  <ArrowRight size={24} className="text-white" />
                </div>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    );
  }

  /* ========================================
     SCHOOL ADMIN DASHBOARD
     ======================================== */
  if (role === 'SCHOOL_ADMIN') {
    return (
      <div className="space-y-8 max-w-screen-2xl mx-auto">

        {/* Hero greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-7"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 40%, rgba(6,182,212,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          {/* Glow orbs */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {user?.schoolName || 'School Overview'}
              </h1>
              <p className="text-[13px] text-slate-400 mt-1.5">
                Real-time insights · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => navigate(`${basePath}/students`)}
                className="btn-primary px-5 py-2.5 rounded-xl text-[12px] flex items-center gap-2"
              >
                <GraduationCap size={14} />
                Add Student
              </button>
              <button
                onClick={() => navigate(`${basePath}/reports`)}
                className="px-5 py-2.5 rounded-xl text-[12px] border border-white/[0.1] bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] transition-all flex items-center gap-2"
              >
                <BarChart3 size={14} />
                View Reports
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stat cards — 6 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <StatCard icon={GraduationCap} label="Students" value={stats?.studentsCount ?? 1248} trend="+12 this month" trendDir="up" gradient="gradient-bg-blue" delay={0.05} />
          <StatCard icon={UserCheck} label="Teachers" value={stats?.teachersCount ?? 84} trend="+2 this month" trendDir="up" gradient="gradient-bg-primary" delay={0.1} />
          <StatCard icon={Users} label="Parents" value={stats?.parentsCount ?? 1096} trend="+8 this week" trendDir="up" gradient="gradient-bg-rose" delay={0.15} />
          <StatCard icon={Briefcase} label="Staff" value={stats?.staffCount ?? 32} gradient="gradient-bg-cyan" delay={0.2} />
          <StatCard icon={BookOpen} label="Classes" value={stats?.classesCount ?? 28} gradient="gradient-bg-emerald" delay={0.25} />
          <StatCard icon={DollarSign} label="Revenue" value={`₹${((stats?.totalRevenue ?? 2450000) / 100000).toFixed(1)}L`} trend="+18% vs last month" trendDir="up" gradient="gradient-bg-amber" delay={0.3} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Revenue Area Chart */}
          <GlassCard className="lg:col-span-3" delay={0.2} noPad>
            <div className="p-5 pb-3">
              <SectionHeader icon={TrendingUp} title="Revenue Overview" subtitle="Monthly collection vs fees due" action="Full Report" onAction={() => navigate(`${basePath}/finance`)} />
            </div>
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={200}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="feesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
                  <Area type="monotone" dataKey="fees" stroke="#06b6d4" strokeWidth={2} fill="url(#feesGrad)" name="Fees Collected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Attendance Bar Chart */}
          <GlassCard className="lg:col-span-2" delay={0.25} noPad>
            <div className="p-5 pb-3">
              <SectionHeader icon={Calendar} title="Weekly Attendance" subtitle="This week's daily avg %" />
            </div>
            <div className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={200}>
                <BarChart data={attendanceData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} domain={[60, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="present" radius={[6, 6, 0, 0]} name="Attendance">
                    {attendanceData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.present >= 90 ? '#10b981' : entry.present >= 80 ? '#f59e0b' : '#ef4444'}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div>
          <SectionHeader icon={Zap} title="Quick Actions" subtitle="Frequently used operations" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction to={`${basePath}/students`} icon={GraduationCap} label="Enroll Student" description="Add new student record" gradient="gradient-bg-blue" delay={0.05} />
            <QuickAction to={`${basePath}/teachers`} icon={UserCheck} label="Add Teacher" description="Register teaching staff" gradient="gradient-bg-primary" delay={0.1} />
            <QuickAction to={`${basePath}/finance`} icon={CreditCard} label="Collect Fee" description="Record payment" gradient="gradient-bg-emerald" delay={0.15} />
            <QuickAction to={`${basePath}/notices`} icon={BellRing} label="Post Notice" description="Announce to school" gradient="gradient-bg-amber" delay={0.2} />
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Admissions */}
          <GlassCard delay={0.3}>
            <SectionHeader icon={Activity} title="Recent Admissions" subtitle="Newest students enrolled" action="View all" onAction={() => navigate(`${basePath}/students`)} />
            <div className="space-y-0.5">
              {(stats?.recentAdmissions?.length
                ? stats.recentAdmissions.slice(0, 5)
                : FALLBACK_ADMISSIONS
              ).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="h-8 w-8 rounded-xl gradient-bg-primary flex items-center justify-center text-white text-[11px] font-bold shadow-md shrink-0">
                    {s.name?.charAt(0) ?? 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-200 truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-600">{s.class ? `Class ${s.class}` : 'New Student'}</p>
                  </div>
                  <span className="text-[10.5px] text-slate-600">
                    {(() => {
                      try {
                        const d = new Date(s.admissionDate);
                        return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      } catch {
                        return 'Recent';
                      }
                    })()}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Pending Items */}
          <GlassCard delay={0.35}>
            <SectionHeader icon={AlertCircle} title="Pending Items" subtitle="Items requiring attention" />
            <div className="space-y-1">
              <PendingRow label="Fee payments pending" count={stats?.pendingFeePaymentsCount ?? 23} color="badge-rose" bgColor="bg-rose-400" />
              <PendingRow label="Homework unsubmitted" count={stats?.pendingHomeworks ?? 47} color="badge-amber" bgColor="bg-amber-400" />
              <PendingRow label="Leave requests" count={stats?.pendingLeaves ?? 5} color="badge-blue" bgColor="bg-blue-400" />
              <PendingRow label="Library books overdue" count={stats?.overdueLibraryBooks ?? 12} color="badge-violet" bgColor="bg-violet-400" />
            </div>

            {/* Pending fee progress */}
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">Fee Collection Progress</span>
                <span className="text-[11px] font-bold text-emerald-400">78%</span>
              </div>
              <AnimatedBar pct={78} color="gradient-bg-emerald" delay={0.6} />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-700">₹19.1L collected</span>
                <span className="text-[10px] text-slate-700">₹24.5L total</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Announcements */}
        {stats?.announcements && stats.announcements.length > 0 && (
          <div>
            <SectionHeader icon={Bell} title="Announcements" subtitle="Recent school notices" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.announcements.map((a: any) => (
                <GlassCard key={a.id} className="glass-hover" delay={0.1}>
                  <p className="text-[13px] font-bold text-white mb-1.5">{a.title}</p>
                  <p className="text-[12px] text-slate-500 line-clamp-2">{a.content}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================
     TEACHER DASHBOARD
     ======================================== */
  if (role === 'TEACHER') {
    return (
      <div className="space-y-8 max-w-screen-2xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white tracking-tight">Teacher Dashboard</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          <StatCard icon={BookOpen} label="My Classes" value={3} gradient="gradient-bg-primary" delay={0.05} />
          <StatCard icon={GraduationCap} label="Total Students" value={92} gradient="gradient-bg-blue" delay={0.1} />
          <StatCard icon={ClipboardList} label="Pending Reviews" value={5} gradient="gradient-bg-amber" delay={0.15} />
          <StatCard icon={Calendar} label="Attendance Today" value="87%" trend="+2% vs yesterday" trendDir="up" gradient="gradient-bg-emerald" delay={0.2} />
        </div>

        {/* Quick Actions */}
        <div>
          <SectionHeader icon={Zap} title="Quick Actions" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction to={`${basePath}/teacher/attendance`} icon={Calendar} label="Mark Attendance" description="Today's attendance" gradient="gradient-bg-primary" delay={0.05} />
            <QuickAction to={`${basePath}/teacher/classes`} icon={BookOpen} label="My Classes" description="View assigned classes" gradient="gradient-bg-blue" delay={0.1} />
            <QuickAction to={`${basePath}/homework`} icon={FileText} label="Assign Homework" description="Create assignment" gradient="gradient-bg-emerald" delay={0.15} />
            <QuickAction to={`${basePath}/teacher/grades`} icon={Award} label="Record Grades" description="Enter exam results" gradient="gradient-bg-amber" delay={0.2} />
          </div>
        </div>

        {/* Today's schedule + Subject performance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Today's Schedule */}
          <GlassCard className="lg:col-span-3" delay={0.2}>
            <SectionHeader icon={Clock} title="Today's Schedule" subtitle="Your teaching timetable" />
            <div className="space-y-2">
              {[
                { time: '08:00', end: '08:45', subject: 'Mathematics', class: 'Class 10-A', status: 'Completed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                { time: '09:00', end: '09:45', subject: 'Mathematics', class: 'Class 9-B', status: 'Completed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                { time: '10:00', end: '10:45', subject: 'Statistics', class: 'Class 11-A', status: 'In Progress', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
                { time: '11:00', end: '11:45', subject: 'Mathematics', class: 'Class 8-C', status: 'Upcoming', color: 'bg-white/[0.04] text-slate-500 border-white/[0.06]' },
                { time: '12:30', end: '01:15', subject: 'Lab Session', class: 'Class 10-A', status: 'Upcoming', color: 'bg-white/[0.04] text-slate-500 border-white/[0.06]' },
              ].map((slot, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[12px] font-bold text-slate-300">{slot.time}</p>
                    <p className="text-[10px] text-slate-600">{slot.end}</p>
                  </div>
                  <div className="h-8 w-px bg-white/[0.06]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-200">{slot.subject}</p>
                    <p className="text-[11px] text-slate-600">{slot.class}</p>
                  </div>
                  <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${slot.color}`}>
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Subject Performance */}
          <GlassCard className="lg:col-span-2" delay={0.25}>
            <SectionHeader icon={BarChart3} title="Class Performance" subtitle="Average scores by subject" />
            <div className="space-y-4">
              {subjectPerf.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-slate-400">{s.subject}</span>
                    <span className="text-[12px] font-bold text-white">{s.score}%</span>
                  </div>
                  <AnimatedBar
                    pct={s.score}
                    color={s.score >= 90 ? 'gradient-bg-emerald' : s.score >= 80 ? 'gradient-bg-blue' : 'gradient-bg-primary'}
                    delay={0.4 + i * 0.08}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  /* ========================================
     STUDENT DASHBOARD
     ======================================== */
  if (role === 'STUDENT') {
    return (
      <div className="space-y-8 max-w-screen-2xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white tracking-tight">My Dashboard</h1>
          <p className="text-[13px] text-slate-500 mt-1">Stay on top of your academics! 📚</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          <StatCard icon={Award} label="Overall Grade" value="A+" trend="Top 5% of class" trendDir="up" gradient="gradient-bg-emerald" delay={0.05} />
          <StatCard icon={Calendar} label="Attendance" value="94%" trend="+1% this week" trendDir="up" gradient="gradient-bg-blue" delay={0.1} />
          <StatCard icon={FileText} label="Homework Due" value={3} gradient="gradient-bg-amber" delay={0.15} />
          <StatCard icon={CreditCard} label="Fee Status" value="Paid" gradient="gradient-bg-primary" delay={0.2} />
        </div>

        {/* Quick Access */}
        <div>
          <SectionHeader icon={Zap} title="Quick Access" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction to={`${basePath}/homework`} icon={FileText} label="Homework" description="View assignments" gradient="gradient-bg-amber" delay={0.05} />
            <QuickAction to={`${basePath}/exams`} icon={ClipboardList} label="Exam Results" description="Check your grades" gradient="gradient-bg-emerald" delay={0.1} />
            <QuickAction to={`${basePath}/timetable`} icon={Clock} label="Timetable" description="Today's schedule" gradient="gradient-bg-blue" delay={0.15} />
            <QuickAction to={`${basePath}/notices`} icon={Bell} label="Notices" description="Announcements" gradient="gradient-bg-primary" delay={0.2} />
          </div>
        </div>

        {/* Exams + Grades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Upcoming Exams */}
          <GlassCard delay={0.2}>
            <SectionHeader icon={ClipboardList} title="Upcoming Exams" subtitle="Mid-term schedule" />
            <div className="space-y-2">
              {[
                { subject: 'Mathematics', date: 'Jul 28', days: 1, type: 'Mid-Term', color: 'badge-rose' },
                { subject: 'English', date: 'Jul 30', days: 3, type: 'Mid-Term', color: 'badge-amber' },
                { subject: 'Science', date: 'Aug 1', days: 5, type: 'Mid-Term', color: 'badge-blue' },
                { subject: 'Social Studies', date: 'Aug 3', days: 7, type: 'Mid-Term', color: 'badge-violet' },
              ].map((exam, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors border border-white/[0.04]">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-200">{exam.subject}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{exam.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-white">{exam.date}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${exam.color}`}>
                      {exam.days}d away
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Grades */}
          <GlassCard delay={0.25}>
            <SectionHeader icon={Star} title="Recent Grades" subtitle="Latest exam results" />
            <div className="space-y-2">
              {[
                { subject: 'Mathematics', grade: 'A+', marks: '95/100', pct: 95, color: 'text-emerald-400', barColor: 'gradient-bg-emerald' },
                { subject: 'English', grade: 'A', marks: '88/100', pct: 88, color: 'text-blue-400', barColor: 'gradient-bg-blue' },
                { subject: 'Science', grade: 'A+', marks: '92/100', pct: 92, color: 'text-emerald-400', barColor: 'gradient-bg-emerald' },
                { subject: 'Hindi', grade: 'B+', marks: '78/100', pct: 78, color: 'text-amber-400', barColor: 'gradient-bg-amber' },
              ].map((g, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-300">{g.subject}</p>
                      <p className="text-[10.5px] text-slate-600">{g.marks}</p>
                    </div>
                    <span className={`text-lg font-black ${g.color}`}>{g.grade}</span>
                  </div>
                  <AnimatedBar pct={g.pct} color={g.barColor} delay={0.5 + i * 0.1} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  /* ========================================
     PARENT DASHBOARD
     ======================================== */
  if (role === 'PARENT') {
    return (
      <div className="space-y-8 max-w-screen-2xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white tracking-tight">Parent Dashboard</h1>
          <p className="text-[13px] text-slate-500 mt-1">Monitor your child's academic progress</p>
        </motion.div>

        {/* Child selector */}
        <GlassCard delay={0.05} className="border-violet-500/15">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl gradient-bg-primary flex items-center justify-center text-white font-black text-xl shadow-xl glow-violet">
                A
              </div>
              <div>
                <p className="text-lg font-black text-white">Aarav Sharma</p>
                <p className="text-[12px] text-slate-500">Class 10-A · Roll No. 15 · Adm: STD2024001</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Active</span>
                </div>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-400 text-[12px] font-bold hover:bg-violet-500/15 transition-colors">
              Switch Child
            </button>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          <StatCard icon={Calendar} label="Attendance" value="94%" trend="+1% vs last week" trendDir="up" gradient="gradient-bg-emerald" delay={0.05} />
          <StatCard icon={Award} label="Overall Grade" value="A+" trend="Top 5%" trendDir="up" gradient="gradient-bg-blue" delay={0.1} />
          <StatCard icon={CreditCard} label="Fee Status" value="Paid" gradient="gradient-bg-primary" delay={0.15} />
          <StatCard icon={FileText} label="Homework Due" value="2" gradient="gradient-bg-amber" delay={0.2} />
        </div>

        {/* Quick access */}
        <div>
          <SectionHeader icon={Zap} title="Quick Access" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction to={`${basePath}/exams`} icon={ClipboardList} label="Exam Results" description="View report card" gradient="gradient-bg-emerald" delay={0.05} />
            <QuickAction to={`${basePath}/finance`} icon={CreditCard} label="Fee Details" description="Payment history" gradient="gradient-bg-primary" delay={0.1} />
            <QuickAction to={`${basePath}/homework`} icon={FileText} label="Homework" description="Pending assignments" gradient="gradient-bg-amber" delay={0.15} />
            <QuickAction to={`${basePath}/notices`} icon={Bell} label="Notices" description="School updates" gradient="gradient-bg-blue" delay={0.2} />
          </div>
        </div>

        {/* Performance + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Subject Performance */}
          <GlassCard delay={0.2}>
            <SectionHeader icon={BarChart3} title="Subject Performance" subtitle="Aarav's latest scores" />
            <div className="space-y-4">
              {[
                { subject: 'Mathematics', pct: 95, grade: 'A+', color: 'gradient-bg-emerald', textColor: 'text-emerald-400' },
                { subject: 'Science', pct: 92, grade: 'A+', color: 'gradient-bg-blue', textColor: 'text-blue-400' },
                { subject: 'English', pct: 88, grade: 'A', color: 'gradient-bg-primary', textColor: 'text-violet-400' },
                { subject: 'Social Studies', pct: 85, grade: 'A', color: 'gradient-bg-cyan', textColor: 'text-cyan-400' },
                { subject: 'Hindi', pct: 78, grade: 'B+', color: 'gradient-bg-amber', textColor: 'text-amber-400' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-slate-400">{s.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${s.textColor}`}>{s.grade}</span>
                      <span className="text-[11px] text-slate-600">{s.pct}%</span>
                    </div>
                  </div>
                  <AnimatedBar pct={s.pct} color={s.color} delay={0.4 + i * 0.08} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard delay={0.25}>
            <SectionHeader icon={Activity} title="Recent Activity" subtitle="Aarav's latest updates" />
            <div className="space-y-0.5">
              {[
                { icon: Award, title: 'Scored A+ in Mathematics Test', subtitle: '95/100 marks', time: 'Yesterday', dot: 'gradient-bg-emerald' },
                { icon: FileText, title: 'Submitted Science homework', subtitle: 'Chapter 4 — Atoms & Molecules', time: '2 days ago', dot: 'gradient-bg-blue' },
                { icon: Calendar, title: 'Present — Full week attendance', subtitle: '100% this week', time: '3 days ago', dot: 'gradient-bg-primary' },
                { icon: CreditCard, title: 'Quarterly fee paid', subtitle: '₹15,000 — Q2 2026', time: '1 week ago', dot: 'gradient-bg-amber' },
                { icon: Bell, title: 'Annual Day confirmed', subtitle: 'Participation registered', time: '2 weeks ago', dot: 'gradient-bg-cyan' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="activity-item flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
                    <div className={`h-7 w-7 rounded-lg ${item.dot} flex items-center justify-center shrink-0`} style={{ zIndex: 1 }}>
                      <Icon size={12} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-slate-300 leading-snug">{item.title}</p>
                      <p className="text-[10.5px] text-slate-600 mt-0.5 truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-slate-700 shrink-0 pt-0.5">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  /* Fallback */
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-20 w-20 rounded-3xl gradient-bg-primary flex items-center justify-center shadow-2xl glow-violet mb-6">
        <LayoutDashboard size={32} className="text-white" />
      </div>
      <h2 className="text-xl font-black text-white mb-2">Welcome to EduSphere</h2>
      <p className="text-slate-500 text-[13px]">Your dashboard is being configured.</p>
    </div>
  );
}
