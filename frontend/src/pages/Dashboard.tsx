import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, TrendingUp, Bell, ArrowRight, DollarSign,
  UserCheck, Activity, Clock, Calendar, FileText, ClipboardList,
  Award, BarChart3, Zap, ChevronRight, Star, AlertCircle,
  Briefcase, CreditCard, BellRing, LayoutDashboard, Shield, Users,
  Bus, Sparkles, CheckCircle2, MessageSquare, Phone, Send,
  Plus, Download, RefreshCw, Filter, Search, School, Check,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, Eye, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import StatCard from '@/component/ui/StatCard';
import GlassCard from '@/component/ui/GlassCard';
import { toast } from 'sonner';

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

/* ===== Mock Chart Data ===== */
const revenueData = [
  { month: 'Jan', revenue: 1850000, fees: 1650000, expenses: 950000 },
  { month: 'Feb', revenue: 2100000, fees: 1900000, expenses: 1050000 },
  { month: 'Mar', revenue: 2400000, fees: 2150000, expenses: 1100000 },
  { month: 'Apr', revenue: 1950000, fees: 1750000, expenses: 980000 },
  { month: 'May', revenue: 2800000, fees: 2550000, expenses: 1200000 },
  { month: 'Jun', revenue: 3100000, fees: 2850000, expenses: 1350000 },
  { month: 'Jul', revenue: 2950000, fees: 2700000, expenses: 1280000 },
];

const attendanceWeeklyData = [
  { day: 'Mon', students: 95, staff: 98 },
  { day: 'Tue', students: 93, staff: 96 },
  { day: 'Wed', students: 96, staff: 100 },
  { day: 'Thu', students: 91, staff: 95 },
  { day: 'Fri', students: 94, staff: 97 },
  { day: 'Sat', students: 88, staff: 92 },
];

const classAverages = [
  { class: 'Class 10-A', score: 88, students: 42 },
  { class: 'Class 10-B', score: 84, students: 40 },
  { class: 'Class 9-A', score: 91, students: 38 },
  { class: 'Class 9-B', score: 79, students: 41 },
  { class: 'Class 8-A', score: 86, students: 36 },
];

const pendingDefaulters = [
  { id: '1', name: 'Zaid Khan', class: '10-A', roll: '24', amount: '₹14,500', due: '15 Days Overdue', phone: '+92 301 2345678' },
  { id: '2', name: 'Alina Fatima', class: '9-B', roll: '12', amount: '₹12,000', due: '8 Days Overdue', phone: '+92 322 7654321' },
  { id: '3', name: 'Hamza Tariq', class: '8-C', roll: '09', amount: '₹18,000', due: '20 Days Overdue', phone: '+92 333 9988776' },
  { id: '4', name: 'Sara Ahmed', class: '11-A', roll: '31', amount: '₹15,500', due: '5 Days Overdue', phone: '+92 345 5544332' },
];

const todaySchedule = [
  { period: 'Period 1', time: '08:00 - 08:45', subject: 'Mathematics', teacher: 'Dr. Ananya Roy', room: 'Room 204', grade: 'Class 10-A', status: 'Completed' },
  { period: 'Period 2', time: '08:50 - 09:35', subject: 'Physics Lab', teacher: 'Prof. Tariq Mehmood', room: 'Science Lab 2', grade: 'Class 11-A', status: 'Completed' },
  { period: 'Period 3', time: '09:40 - 10:25', subject: 'English Literature', teacher: 'Mrs. Sabeen Shah', room: 'Room 102', grade: 'Class 9-B', status: 'In Progress' },
  { period: 'Period 4', time: '10:45 - 11:30', subject: 'Computer Science', teacher: 'Mr. Asad Ali', room: 'IT Lab 1', grade: 'Class 10-B', status: 'Upcoming' },
  { period: 'Period 5', time: '11:35 - 12:20', subject: 'Chemistry', teacher: 'Dr. Farhana', room: 'Science Lab 1', grade: 'Class 12-A', status: 'Upcoming' },
];

const fallbackAdmissions = [
  { name: 'Muhammad Ali', admissionDate: '2026-08-30', class: 'Class 10-A', status: 'Verified' },
  { name: 'Ayesha Siddiqui', admissionDate: '2026-08-29', class: 'Class 9-B', status: 'Verified' },
  { name: 'Bilal Hussain', admissionDate: '2026-08-28', class: 'Class 11-A', status: 'Pending Doc' },
  { name: 'Zoya Fatima', admissionDate: '2026-08-27', class: 'Class 8-C', status: 'Verified' },
  { name: 'Rayyan Malik', admissionDate: '2026-08-26', class: 'Class 7-A', status: 'Verified' },
];

const upcomingExamsList = [
  { title: 'Mid-Term Mathematics Exam', class: 'Classes 8-12', date: 'Sep 10, 2026', daysLeft: 9, type: 'Theory' },
  { title: 'Physics & Chemistry Practical', class: 'Classes 10 & 12', date: 'Sep 14, 2026', daysLeft: 13, type: 'Practical' },
  { title: 'English Language Assessment', class: 'All Secondary', date: 'Sep 18, 2026', daysLeft: 17, type: 'Written' },
];

/* ===== Custom Tooltip ===== */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#090e24]/95 border border-white/15 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl z-50">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">{label || ''}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-300 font-medium">{p.name}:</span>
              <span className="font-extrabold font-mono" style={{ color: p?.color || '#a78bfa' }}>
                {typeof p?.value === 'number' && p.value > 10000
                  ? `₹${(p.value / 100000).toFixed(2)} Lakh`
                  : `${p?.value ?? 0}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/* ===== Section Header ===== */
function SectionHeader({ icon: Icon, title, subtitle, badge, action, onAction }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
          <Icon size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 border border-violet-500/30 text-violet-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20"
        >
          <span>{action}</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

/* ===== Quick Action VIP Card ===== */
function VIPQuickAction({ to, icon: Icon, label, description, gradient, glow, onClick }: any) {
  const content = (
    <div className="group relative p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity ${glow}`} />
      <div className="flex items-center gap-3.5 relative z-10">
        <div className={`h-11 w-11 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-lg text-white group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
        </div>
        <ChevronRight size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : <div onClick={onClick}>{content}</div>;
}

export default function Dashboard() {
  const { user, previewRole } = useAuth();
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const basePath = schoolSlug ? `/${schoolSlug}` : '';

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'attendance' | 'performance'>('revenue');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modals state for user-friendliness
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePriority, setNoticePriority] = useState('URGENT');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (user?.schoolId || schoolSlug) {
      apiClient.get('/people/stats')
        .then(r => { if (active) setStats(r.data); })
        .catch(() => { })
        .finally(() => { if (active) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, [user, schoolSlug]);

  const handleSendReminder = (student: any) => {
    toast.success(`Fee reminder SMS & Notification sent to ${student.name}'s parents!`, {
      description: `Amount: ${student.amount} · Contact: ${student.phone}`,
    });
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;
    toast.success(`Announcement broadcasted to entire school!`, {
      description: `"${noticeTitle}" is now live on Notice Board.`,
    });
    setIsNoticeModalOpen(false);
    setNoticeTitle('');
    setNoticeBody('');
  };

  const role = previewRole ?? user?.role ?? 'SCHOOL_ADMIN';

  /* ========================================
     TEACHER DASHBOARD
     ======================================== */
  if (role === 'TEACHER') {
    const teacherClasses = [
      { id: '1', name: 'Class 10-A', subject: 'Mathematics', students: 42, room: 'Room 204', nextClass: '08:00 AM' },
      { id: '2', name: 'Class 9-B', subject: 'Mathematics', students: 38, room: 'Room 102', nextClass: '09:40 AM' },
      { id: '3', name: 'Class 11-A', subject: 'Physics Lab', students: 35, room: 'Science Lab 2', nextClass: '10:45 AM' },
      { id: '4', name: 'Class 10-B', subject: 'Mathematics', students: 40, room: 'Room 205', nextClass: '11:35 AM' },
      { id: '5', name: 'Class 8-C', subject: 'General Science', students: 36, room: 'Room 108', nextClass: 'Tomorrow' },
    ];

    const todayTeacherPeriods = [
      { period: 'Period 1', time: '08:00 - 08:45', class: 'Class 10-A', subject: 'Mathematics', room: 'Room 204', status: 'Completed' },
      { period: 'Period 2', time: '09:40 - 10:25', class: 'Class 9-B', subject: 'Mathematics', room: 'Room 102', status: 'In Progress' },
      { period: 'Period 3', time: '10:45 - 11:30', class: 'Class 11-A', subject: 'Physics Lab', room: 'Science Lab 2', status: 'Upcoming' },
      { period: 'Period 4', time: '11:35 - 12:20', class: 'Class 10-B', subject: 'Mathematics', room: 'Room 205', status: 'Upcoming' },
    ];

    const pendingHomeworksList = [
      { id: 'hw-1', title: 'Quadratic Equations Exercise 3.2', class: 'Class 10-A', due: 'Today, 05:00 PM', submitted: 38, total: 42 },
      { id: 'hw-2', title: 'Thermodynamics Problem Set', class: 'Class 11-A', due: 'Tomorrow, 09:00 AM', submitted: 24, total: 35 },
      { id: 'hw-3', title: 'Algebraic Formulas Practice', class: 'Class 9-B', due: 'Sep 05, 2026', submitted: 30, total: 38 },
    ];

    const teacherLeaves = [
      { id: 'l1', type: 'Casual Leave', dates: 'Aug 18 - Aug 19, 2026', days: '2 Days', status: 'APPROVED', reason: 'Family Function' },
      { id: 'l2', type: 'Medical Leave', dates: 'Sep 12, 2026', days: '1 Day', status: 'PENDING', reason: 'Doctor Appointment' },
    ];

    return (
      <div className="space-y-7 max-w-screen-2xl mx-auto pb-10">
        {/* 1. Teacher Executive Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-violet-950/70 via-indigo-950/40 to-[#090e24] border border-violet-500/25 shadow-[0_0_50px_rgba(124,58,237,0.15)]"
        >
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>👨‍🏫 Faculty Portal Active</span>
                </span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-violet-400" />
                  <span>Session 2026-2027 · Term 2</span>
                </span>
                <span className="hidden sm:inline-block text-slate-600">•</span>
                <span className="text-xs font-mono text-violet-300">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Welcome, {user?.name || 'Faculty Member'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
                Here is your daily teaching schedule, attendance overview, and pending student tasks for today.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate(`${basePath}/attendance`)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 hover:scale-105 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>Mark Attendance</span>
              </button>
              <button
                onClick={() => navigate(`${basePath}/homework`)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 hover:scale-105 transition-all flex items-center gap-2"
              >
                <FileText size={15} />
                <span>Create Homework</span>
              </button>
              <button
                onClick={() => navigate(`${basePath}/exams`)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Award size={15} />
                <span>Enter Marks</span>
              </button>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs hover:scale-105 transition-all flex items-center gap-2"
              >
                <Calendar size={15} className="text-amber-400" />
                <span>Apply Leave</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. Top 4 Teacher Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Classes"
            value={5}
            trend="5 Assigned Sections"
            trendDir="up"
            subtitle="Class 8th to 11th"
            gradient="gradient-bg-primary"
            delay={0.05}
            onClick={() => navigate(`${basePath}/classes`)}
          />
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={191}
            trend="Under your supervision"
            trendDir="up"
            subtitle="96% Average Attendance"
            gradient="gradient-bg-blue"
            delay={0.1}
            onClick={() => navigate(`${basePath}/students`)}
          />
          <StatCard
            icon={Clock}
            label="Today's Classes"
            value={4}
            trend="1 Completed, 1 Live"
            trendDir="up"
            subtitle="Next: Physics Lab (10:45 AM)"
            gradient="gradient-bg-emerald"
            delay={0.15}
            onClick={() => navigate(`${basePath}/timetable`)}
          />
          <StatCard
            icon={FileText}
            label="Pending Homework"
            value={12}
            trend="To check & grade"
            trendDir="down"
            subtitle="3 Active Assignments"
            gradient="gradient-bg-rose"
            delay={0.2}
            onClick={() => navigate(`${basePath}/homework`)}
          />
        </div>

        {/* 3. Today's Teaching Schedule & Assigned Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule (2 cols) */}
          <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-6 shadow-xl">
            <SectionHeader
              icon={Clock}
              title="Today's Teaching Schedule"
              subtitle="Your daily timetable and live period tracker"
              badge="Daily Timetable"
              action="Full Timetable"
              onAction={() => navigate(`${basePath}/timetable`)}
            />

            <div className="space-y-3 mt-4">
              {todayTeacherPeriods.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    p.status === 'In Progress'
                      ? 'bg-violet-500/10 border-violet-500/40 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/30'
                      : p.status === 'Completed'
                      ? 'bg-muted/20 border-border/40 opacity-70'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      p.status === 'In Progress'
                        ? 'bg-violet-600 text-white shadow-md'
                        : p.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {p.period.split(' ')[1]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm">{p.subject}</p>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                          {p.class}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{p.time}</span>
                        <span>•</span>
                        <span>{p.room}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                      p.status === 'In Progress'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-pulse'
                        : p.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {p.status}
                    </span>
                    <button
                      onClick={() => navigate(`${basePath}/attendance`)}
                      className="text-xs font-bold px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-colors"
                    >
                      Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Leave & Quick Access (1 col) */}
          <div className="space-y-6">
            {/* Leave Tracker Card */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Calendar size={16} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Leave Applications</h3>
                </div>
                <button
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Apply
                </button>
              </div>

              <div className="space-y-2.5">
                {teacherLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-foreground">{l.type}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{l.dates} ({l.days})</p>
                      <p className="text-[10px] text-muted-foreground/70 italic mt-0.5">Reason: {l.reason}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      l.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links for Teachers */}
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl space-y-2.5">
              <h3 className="font-bold text-foreground text-sm mb-3">Academic Shortcuts</h3>
              <button
                onClick={() => navigate(`${basePath}/classes`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-border text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen size={16} className="text-violet-400" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">My Classes & Sections</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate(`${basePath}/exams`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-border text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">Exams & Enter Marks</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate(`${basePath}/notices`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-border text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Bell size={16} className="text-blue-400" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">School & Class Notices</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. My Classes & Subject Mapping Grid */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl">
          <SectionHeader
            icon={BookOpen}
            title="My Assigned Classes & Subject Mapping"
            subtitle="Manage students, attendance, homework, and marks for each class"
            badge="5 Active Classes"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
            {teacherClasses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/70 hover:border-primary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{c.room}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-base mt-1">{c.subject}</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Users size={12} className="text-slate-400" />
                    <span>{c.students} Students Enrolled</span>
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 flex gap-1.5">
                  <button
                    onClick={() => navigate(`${basePath}/attendance`)}
                    className="flex-1 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-bold transition-all text-center"
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => navigate(`${basePath}/homework`)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground text-[11px] font-bold border border-border transition-all text-center"
                  >
                    Homework
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Pending Homework Submissions to Check */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-xl">
          <SectionHeader
            icon={FileText}
            title="Homework & Assignment Submissions"
            subtitle="Review, grade, and provide feedback on student homework"
            badge="Review Hub"
            action="Create Assignment"
            onAction={() => navigate(`${basePath}/homework`)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {pendingHomeworksList.map((hw) => (
              <div key={hw.id} className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {hw.class}
                    </span>
                    <span className="text-[11px] text-slate-400">{hw.due}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm">{hw.title}</h4>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Submissions</span>
                      <span className="font-bold text-foreground">{hw.submitted} / {hw.total}</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(hw.submitted / hw.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`${basePath}/homework`)}
                  className="mt-4 w-full py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Review Submissions</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Modal */}
        <AnimatePresence>
          {isNoticeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
                className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground text-lg">Apply for Leave</h3>
                  <button onClick={() => setIsNoticeModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Leave application submitted to Principal for approval!');
                  setIsNoticeModalOpen(false);
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Leave Type</label>
                    <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option>Casual Leave</option>
                      <option>Medical / Sick Leave</option>
                      <option>Emergency Leave</option>
                      <option>Half Day Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">From Date</label>
                      <input type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1">To Date</label>
                      <input type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Reason for Leave</label>
                    <textarea required rows={3} placeholder="Please provide details for your leave request..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                  <button type="submit"
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    Submit Leave Application
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ========================================
     VIP SCHOOL ADMIN DASHBOARD (PRIMARY)
     ======================================== */
  return (
    <div className="space-y-7 max-w-screen-2xl mx-auto pb-10">

      {/* 1. VIP Executive Command Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-violet-950/60 via-indigo-950/40 to-[#090e24] border border-violet-500/25 shadow-[0_0_50px_rgba(124,58,237,0.15)]"
      >
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            {/* Live Ticker Strip */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>🟢 Live School Active</span>
              </span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-violet-400" />
                <span>Academic Session 2026-2027 · Term 2</span>
              </span>
              <span className="hidden sm:inline-block text-slate-600">•</span>
              <span className="text-xs font-mono text-violet-300">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {user?.schoolName || 'EduSphere Academy'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
              Welcome back, <strong className="text-white font-bold">{user?.name || 'Principal Sharma'}</strong>. Here is today's real-time school operations overview.
            </p>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate(`${basePath}/students`)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Enroll Student</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/finance`)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 hover:scale-105 transition-all flex items-center gap-2"
            >
              <DollarSign size={15} />
              <span>Collect Fee</span>
            </button>
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs hover:scale-105 transition-all flex items-center gap-2"
            >
              <Bell size={15} className="text-amber-400" />
              <span>Broadcast Notice</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/reports`)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Download Executive Summary"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Top 6 VIP KPI Metric Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={stats?.studentsCount ?? 1248}
          trend="+14 this month"
          trendDir="up"
          subtitle="94.8% Present Today"
          gradient="gradient-bg-blue"
          delay={0.05}
          onClick={() => navigate(`${basePath}/students`)}
        />
        <StatCard
          icon={UserCheck}
          label="Faculty Staff"
          value={stats?.teachersCount ?? 84}
          trend="81 on duty"
          trendDir="up"
          subtitle="3 on approved leave"
          gradient="gradient-bg-primary"
          delay={0.1}
          onClick={() => navigate(`${basePath}/staff`)}
        />
        <StatCard
          icon={Users}
          label="Parents Active"
          value={stats?.parentsCount ?? 1096}
          trend="96% app verified"
          trendDir="up"
          subtitle="Instant SMS linked"
          gradient="gradient-bg-rose"
          delay={0.15}
          onClick={() => navigate(`${basePath}/parents`)}
        />
        <StatCard
          icon={DollarSign}
          label="Fee Collection"
          value={`₹${((stats?.totalRevenue ?? 2480000) / 100000).toFixed(1)}L`}
          trend="+19% vs target"
          trendDir="up"
          subtitle="₹3.1L pending recovery"
          gradient="gradient-bg-emerald"
          delay={0.2}
          onClick={() => navigate(`${basePath}/finance`)}
        />
        <StatCard
          icon={BookOpen}
          label="Active Classes"
          value={stats?.classesCount ?? 28}
          trend="100% staffed"
          trendDir="up"
          subtitle="56 Daily Periods"
          gradient="gradient-bg-cyan"
          delay={0.25}
          onClick={() => navigate(`${basePath}/classes`)}
        />
        <StatCard
          icon={AlertCircle}
          label="Urgent Tasks"
          value={stats?.pendingFeePaymentsCount ?? 6}
          trend="Action required"
          trendDir="down"
          subtitle="4 fee alerts, 2 leaves"
          gradient="gradient-bg-amber"
          delay={0.3}
          onClick={() => navigate(`${basePath}/notifications`)}
        />
      </div>

      {/* 3. Graphical Analytics & Live Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Main Analytics Chart */}
        <GlassCard className="lg:col-span-3 p-6" delay={0.2} noPad>
          <div className="p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Financial & Academic Insights</h2>
                  <p className="text-xs text-slate-400">Monthly trend of revenue, collections & budget</p>
                </div>
              </div>

              {/* View switchers */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl text-xs">
                <button
                  onClick={() => setActiveChartTab('revenue')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeChartTab === 'revenue' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveChartTab('attendance')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeChartTab === 'attendance' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => setActiveChartTab('performance')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    activeChartTab === 'performance' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scores
                </button>
              </div>
            </div>
          </div>

          <div className="px-3 pb-6 pt-2">
            {activeChartTab === 'revenue' && (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" name="Total Revenue" />
                  <Area type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} fill="url(#feeGrad)" name="Fee Collected" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'attendance' && (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={attendanceWeeklyData} margin={{ top: 10, right: 16, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="students" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Students %" />
                  <Bar dataKey="staff" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Faculty %" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'performance' && (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={classAverages} margin={{ top: 10, right: 16, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Score %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Attendance & Campus Health Gauge Card */}
        <GlassCard className="lg:col-span-2 p-6" delay={0.25}>
          <SectionHeader
            icon={Calendar}
            title="Today's Attendance"
            subtitle="Live student & teacher check-in"
            action="Details"
            onAction={() => navigate(`${basePath}/attendance`)}
          />

          <div className="space-y-4">
            {/* Big Progress Metric */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-transparent border border-emerald-500/25 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Overall Attendance Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">94.8%</span>
                  <span className="text-xs font-bold text-emerald-400">+1.4% vs yesterday</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-base shadow-lg">
                ✓
              </div>
            </div>

            {/* Individual Breakdown Bars */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Senior Wing (Classes 9-12)</span>
                  <span className="text-white font-bold">96.2% (580/603)</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: '96.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Junior Wing (Classes 1-8)</span>
                  <span className="text-white font-bold">93.5% (603/645)</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: '93.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-300">Faculty & Staff Present</span>
                  <span className="text-white font-bold">96.4% (81/84)</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: '96.4%' }} />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 4. VIP Quick Operations Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">VIP Quick Management Hub</h2>
              <p className="text-xs text-slate-400">Fast 1-click access to core school workflows</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <VIPQuickAction
            to={`${basePath}/students`}
            icon={GraduationCap}
            label="Students"
            description="Enroll & Records"
            gradient="bg-gradient-to-tr from-blue-600 to-cyan-600"
            glow="bg-blue-600"
          />
          <VIPQuickAction
            to={`${basePath}/staff`}
            icon={UserCheck}
            label="Staff"
            description="Faculty & Team"
            gradient="bg-gradient-to-tr from-violet-600 to-indigo-600"
            glow="bg-violet-600"
          />
          <VIPQuickAction
            to={`${basePath}/classes`}
            icon={BookOpen}
            label="Classes"
            description="Sections & Batches"
            gradient="bg-gradient-to-tr from-emerald-600 to-teal-600"
            glow="bg-emerald-600"
          />
          <VIPQuickAction
            to={`${basePath}/finance`}
            icon={CreditCard}
            label="Finance"
            description="Fee Invoices"
            gradient="bg-gradient-to-tr from-amber-600 to-orange-600"
            glow="bg-amber-600"
          />
          <VIPQuickAction
            to={`${basePath}/attendance`}
            icon={Calendar}
            label="Attendance"
            description="Daily Tracking"
            gradient="bg-gradient-to-tr from-fuchsia-600 to-pink-600"
            glow="bg-fuchsia-600"
          />
          <VIPQuickAction
            to={`${basePath}/exams`}
            icon={ClipboardList}
            label="Exams"
            description="Grading & Tests"
            gradient="bg-gradient-to-tr from-indigo-600 to-blue-600"
            glow="bg-indigo-600"
          />
          <VIPQuickAction
            to={`${basePath}/timetable`}
            icon={Clock}
            label="Timetable"
            description="Daily Periods"
            gradient="bg-gradient-to-tr from-teal-600 to-emerald-600"
            glow="bg-teal-600"
          />
          <VIPQuickAction
            to={`${basePath}/transport`}
            icon={Bus}
            label="Transport"
            description="Bus Routes"
            gradient="bg-gradient-to-tr from-rose-600 to-pink-600"
            glow="bg-rose-600"
          />
        </div>
      </div>

      {/* 5. Split Command Grid: Live Schedules, Defaulter Recovery, Recent Admissions & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column (7 cols): Today's Schedule & Recent Admissions */}
        <div className="lg:col-span-7 space-y-5">

          {/* Today's Live Class Bell & Timetable */}
          <GlassCard delay={0.3} className="p-6">
            <SectionHeader
              icon={Clock}
              title="Today's Live Class Schedule"
              subtitle="Active teaching periods across institution"
              badge="56 Periods Today"
              action="Full Timetable"
              onAction={() => navigate(`${basePath}/timetable`)}
            />

            <div className="space-y-2.5">
              {todaySchedule.map((slot, index) => {
                const isCurrent = slot.status === 'In Progress';
                const isDone = slot.status === 'Completed';
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      isCurrent
                        ? 'bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-blue-500/40 shadow-lg shadow-blue-500/10'
                        : isDone
                        ? 'bg-white/[0.02] border-white/5 opacity-75'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-bold text-white">{slot.time.split('-')[0]}</p>
                        <p className="text-[10px] text-slate-400">{slot.time.split('-')[1]}</p>
                      </div>

                      <div className="h-8 w-px bg-white/10 shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">{slot.subject}</p>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {slot.grade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {slot.teacher} · <span className="text-slate-300 font-mono">{slot.room}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                        isCurrent
                          ? 'bg-blue-500 text-white border-blue-400 shadow-sm animate-pulse'
                          : isDone
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Recent Admissions */}
          <GlassCard delay={0.35} className="p-6">
            <SectionHeader
              icon={Activity}
              title="Recent Student Admissions"
              subtitle="Latest enrolled scholars"
              action="View All Students"
              onAction={() => navigate(`${basePath}/students`)}
            />

            <div className="divide-y divide-white/5">
              {(stats?.recentAdmissions?.length ? stats.recentAdmissions : fallbackAdmissions).map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.class || 'Class 10-A'} · Adm Date: {item.admissionDate}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {item.status || 'Enrolled'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column (5 cols): Fee Defaulter Recovery & Notice Announcements */}
        <div className="lg:col-span-5 space-y-5">

          {/* Fee Recovery Center with Instant Reminder */}
          <GlassCard delay={0.3} className="p-6 border-amber-500/20">
            <SectionHeader
              icon={AlertTriangle}
              title="Pending Fee Defaulters"
              subtitle="Send 1-click reminders to parents"
              badge="₹3.1L Pending"
              action="Manage"
              onAction={() => navigate(`${basePath}/finance`)}
            />

            <div className="space-y-3">
              {pendingDefaulters.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.class} (Roll {item.roll})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-extrabold text-rose-400 font-mono">{item.amount}</span>
                      <span className="text-[10px] text-amber-400/90 font-medium">({item.due})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendReminder(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    <Send size={12} />
                    <span>Remind</span>
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Upcoming Exams & Timeline */}
          <GlassCard delay={0.35} className="p-6">
            <SectionHeader
              icon={ClipboardList}
              title="Upcoming Exams & Tests"
              subtitle="Examination dates countdown"
              action="Exam Schedule"
              onAction={() => navigate(`${basePath}/exams`)}
            />

            <div className="space-y-2.5">
              {upcomingExamsList.map((exam, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">{exam.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{exam.class} · {exam.date}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-violet-500/20 border border-violet-500/30 text-violet-300 shrink-0">
                    {exam.daysLeft}d left
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notice Board & Announcements */}
          <GlassCard delay={0.4} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                  <BellRing size={15} />
                </div>
                <h3 className="text-sm font-bold text-white">Institutional Notices</h3>
              </div>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="text-xs font-bold text-violet-400 hover:text-violet-300"
              >
                + Post New
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-violet-300">Annual Sports Gala 2026</span>
                  <span className="text-[10px] text-violet-400/80">Sep 05</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">Inter-house athletics & cricket trials begin this Friday at Main Ground.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">Parent-Teacher Meeting (PTM)</span>
                  <span className="text-[10px] text-slate-400">Sep 12</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Term 2 evaluation cards will be shared directly with parents in Auditorium.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Notice Modal */}
      <AnimatePresence>
        {isNoticeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoticeModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#090e24] border border-white/20 rounded-3xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                    <BellRing size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Broadcast School Announcement</h3>
                </div>
                <button onClick={() => setIsNoticeModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handlePostNotice} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Announcement Title</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Science Fair Registration Open"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Details / Body</label>
                  <textarea
                    rows={3}
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    placeholder="Write announcement message for teachers, parents & students..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNoticeModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg transition-all"
                  >
                    Broadcast Now
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
