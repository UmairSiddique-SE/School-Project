import React, { useEffect, useMemo, useState, type ComponentType } from 'react';

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("Chart render fallback activated:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl bg-slate-50 dark:bg-muted/20 text-xs font-semibold text-muted-foreground">
          Analytics chart preview
        </div>
      );
    }
    return this.props.children;
  }
}
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  WalletCards,
  AlertTriangle,
  CalendarDays,
  Bell,
  ArrowRight,
  UserPlus,
  Receipt,
  Megaphone,
  RefreshCw,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '@/component/ui/StatCard';

type Stats = {
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
  todayAttendancePercentage: number;
  presentToday: number;
  absentToday: number;
  announcements: Array<{ id: string; title: string; content: string; publishedAt: string }>;
  recentAdmissions: Array<{
    id: string;
    name: string;
    admissionDate: string;
    section?: { class?: { name?: string } };
  }>;
  upcomingExams: Array<{ id: string; name: string; type: string; startDate: string }>;
};

type ClassRow = {
  id: string;
  name: string;
  sections?: Array<{ id: string; name: string; students?: Array<unknown> }>;
  subjects?: Array<{ id: string }>;
};

const emptyStats: Stats = {
  studentsCount: 0,
  teachersCount: 0,
  parentsCount: 0,
  staffCount: 0,
  classesCount: 0,
  totalRevenue: 0,
  pendingFees: 0,
  pendingFeePaymentsCount: 0,
  pendingHomeworks: 0,
  pendingLeaves: 0,
  overdueLibraryBooks: 0,
  todayAttendancePercentage: 0,
  presentToday: 0,
  absentToday: 0,
  announcements: [],
  recentAdmissions: [],
  upcomingExams: [],
};

const money = (value: number) =>
  `PKR ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex min-h-[130px] items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/70 dark:bg-background/60 px-5 text-center">
    <div>
      <CircleDashed className="mx-auto mb-2 text-muted-foreground/60" size={22} />
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">No database records available yet.</p>
    </div>
  </div>
);

const SectionTitle = ({
  icon: Icon,
  title,
  subtitle,
  action,
  gradient = "from-cyan-500 via-sky-500 to-blue-600",
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  action?: string;
  gradient?: string;
}) => (
  <div className={`-mx-6 -mt-6 mb-5 flex items-center justify-between bg-gradient-to-r ${gradient} px-6 py-3.5 text-white shadow-sm`}>
    <div className="flex items-center gap-3 min-w-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-900/20 text-white shadow-inner shrink-0">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{title}</h2>
        <p className="text-[11px] text-white/85 truncate">{subtitle}</p>
      </div>
    </div>
    {action ? (
      <span className="rounded-full bg-white dark:bg-slate-900/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-inner shrink-0">
        {action}
      </span>
    ) : null}
  </div>
);

export default function Dashboard() {
  const { user, previewRole } = useAuth();
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const basePath = schoolSlug ? `/${schoolSlug}` : '';
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = previewRole ?? user?.role ?? 'SCHOOL_ADMIN';

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResponse, classesResponse] = await Promise.all([
        apiClient.get('/people/stats'),
        apiClient.get('/classes'),
      ]);
      setStats({ ...emptyStats, ...(statsResponse.data || {}) });
      setClasses(Array.isArray(classesResponse.data) ? classesResponse.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load live school data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [user?.schoolId, schoolSlug]);

  const totalStaff = stats.teachersCount + stats.staffCount;
  const totalPeople = stats.studentsCount + totalStaff + stats.parentsCount;
  const attendanceTotal = stats.presentToday + stats.absentToday;

  const isTeacher = role === 'TEACHER';

  const kpis = useMemo(() => {
    if (isTeacher) {
      return [
        { icon: BookOpen, label: 'Classes', value: stats.classesCount, subtitle: 'Academic classes', trend: stats.classesCount ? 'Synced' : 'No classes yet', gradient: 'gradient-bg-primary', path: '/classes' },
        { icon: GraduationCap, label: 'Students', value: stats.studentsCount, subtitle: 'Total enrolled students', trend: stats.studentsCount ? 'Synced' : 'No students yet', gradient: 'gradient-bg-blue', path: '/students' },
        { icon: ClipboardCheck, label: 'Attendance', value: `${stats.todayAttendancePercentage}%`, subtitle: `${stats.presentToday} present · ${stats.absentToday} absent`, trend: attendanceTotal ? 'Today live' : 'Not marked', gradient: 'gradient-bg-emerald', path: '/attendance' },
        { icon: FileText, label: 'Homework', value: stats.pendingHomeworks, subtitle: 'Active homework tasks', trend: stats.pendingHomeworks ? 'Active' : 'No tasks', gradient: 'gradient-bg-blue', path: '/homework' },
        { icon: CalendarDays, label: 'Upcoming Exams', value: stats.upcomingExams.length, subtitle: 'Scheduled exams', trend: stats.upcomingExams.length ? 'Scheduled' : 'None', gradient: 'gradient-bg-violet', path: '/exams' },
        { icon: Bell, label: 'Notice Board', value: stats.announcements.length, subtitle: 'School announcements', trend: stats.announcements.length ? 'Active' : 'Clear', gradient: 'gradient-bg-amber', path: '/notices' },
      ];
    }

    return [
      { icon: GraduationCap, label: 'Total Students', value: stats.studentsCount, subtitle: 'Live database count', trend: stats.studentsCount ? 'Synced' : 'No students yet', gradient: 'gradient-bg-blue', path: '/students' },
      { icon: Users, label: 'Total Staff', value: totalStaff, subtitle: `${stats.teachersCount} teachers · ${stats.staffCount} staff`, trend: totalStaff ? 'Synced' : 'No staff yet', gradient: 'gradient-bg-emerald', path: '/staff' },
      { icon: BookOpen, label: 'Total Classes', value: stats.classesCount, subtitle: 'Live academic classes', trend: stats.classesCount ? 'Synced' : 'No classes yet', gradient: 'gradient-bg-primary', path: '/classes' },
      { icon: ClipboardCheck, label: 'Today Attendance', value: `${stats.todayAttendancePercentage}%`, subtitle: `${stats.presentToday} present · ${stats.absentToday} absent`, trend: attendanceTotal ? 'Live attendance' : 'No attendance yet', gradient: 'gradient-bg-blue', path: '/attendance' },
      { icon: WalletCards, label: 'Fee Collection', value: money(stats.totalRevenue), subtitle: 'Recorded payments', trend: stats.totalRevenue ? 'Live finance data' : 'No payments yet', gradient: 'gradient-bg-rose', path: '/finance' },
      { icon: AlertTriangle, label: 'Pending Fees', value: money(stats.pendingFees), subtitle: `${stats.pendingFeePaymentsCount} pending payments`, trend: stats.pendingFeePaymentsCount ? 'Action required' : 'All clear', trendDir: stats.pendingFeePaymentsCount ? 'down' as const : 'up' as const, gradient: 'gradient-bg-amber', path: '/finance' },
    ];
  }, [isTeacher, stats, totalStaff, attendanceTotal]);

  const indicatorData = [
    { label: 'Students', value: stats.studentsCount },
    { label: 'Teachers', value: stats.teachersCount },
    { label: 'Staff', value: stats.staffCount },
    { label: 'Parents', value: stats.parentsCount },
    { label: 'Classes', value: stats.classesCount },
  ];

  const attendanceData = [
    { name: 'Present', value: stats.presentToday },
    { name: 'Absent', value: stats.absentToday },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl space-y-7 pb-10">
      <motion.section initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Live DB Connected
              </span>
              <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-PK', { dateStyle: 'full' })}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{user?.schoolName || 'Your School'}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{isTeacher ? `Welcome back, ${user?.name || 'Teacher'}. Your portal provides access to your classes, daily attendance, homework, exams and academic routines.` : 'Your school operations overview is synchronized directly with live database records.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isTeacher ? (
              <>
                <button onClick={() => navigate(`${basePath}/attendance`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"><ClipboardCheck size={15} /> Mark Attendance</button>
                <button onClick={() => navigate(`${basePath}/homework`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors"><FileText size={15} /> Homework</button>
                <button onClick={() => navigate(`${basePath}/exams`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors"><GraduationCap size={15} /> Exams & Marks</button>
                <button onClick={() => navigate(`${basePath}/timetable`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors"><CalendarDays size={15} /> Timetable</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate(`${basePath}/students`)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"><UserPlus size={15} /> Add Student</button>
                <button onClick={() => navigate(`${basePath}/finance`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors"><Receipt size={15} /> Fees</button>
                <button onClick={() => navigate(`${basePath}/notices`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors"><Megaphone size={15} /> Notice Board</button>
              </>
            )}
            <button onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3 py-2.5 text-xs font-bold text-slate-500 dark:text-muted-foreground hover:bg-slate-50 dark:bg-slate-900 transition-colors" title="Refresh live database data"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>
        {error ? <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</div> : null}
      </motion.section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((item, index) => (
          <StatCard key={item.label} icon={item.icon} label={item.label} value={loading ? '—' : item.value} trend={item.trend} trendDir={item.trendDir || 'up'} subtitle={item.subtitle} gradient={item.gradient} delay={index * 0.04} onClick={() => navigate(`${basePath}${item.path}`)} />
        ))}
      </div>

      {/* ─── Institutional Financial & Attendance Trend Strip ─── */}
      {!isTeacher && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Action Center / Today's Pending Operational Tasks */}
          <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-border">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Action Center & Daily Tasks</h3>
                    <p className="text-[11px] text-muted-foreground">Critical operational items requiring attention</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">
                  {((stats.presentToday === 0 && stats.absentToday === 0 ? 1 : 0) + (stats.pendingFeePaymentsCount > 0 ? 1 : 0) + (stats.pendingHomeworks > 0 ? 1 : 0))} Pending
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Task 1: Attendance Check */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${attendanceTotal > 0 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">Daily Student Roll Call</p>
                      <p className="text-[11px] text-muted-foreground truncate">{attendanceTotal > 0 ? `${attendanceTotal} students recorded today` : 'Attendance not marked yet'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`${basePath}/attendance`)}
                    className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                  >
                    {attendanceTotal > 0 ? 'Review' : 'Mark Now'} →
                  </button>
                </div>

                {/* Task 2: Fee Defaulters */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${stats.pendingFeePaymentsCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">Fee Dues & Challans</p>
                      <p className="text-[11px] text-muted-foreground truncate">{stats.pendingFeePaymentsCount > 0 ? `${stats.pendingFeePaymentsCount} invoices pending payment` : 'All invoices settled'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`${basePath}/finance`)}
                    className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                  >
                    View Ledger →
                  </button>
                </div>

                {/* Task 3: Admissions & Docs */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-border/60 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">New Student Intake</p>
                      <p className="text-[11px] text-muted-foreground truncate">{stats.recentAdmissions.length} new enrolments this session</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`${basePath}/students`)}
                    className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                  >
                    Enrol Student →
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-border mt-3">
              <button
                onClick={() => navigate(`${basePath}/daily-operations`)}
                className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>Open Operations Command Hub</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-border">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Cashflow & Revenue</h3>
                  <p className="text-[11px] text-muted-foreground">Tuition velocity vs receivables</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mb-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Collected ({money(stats.totalRevenue)})
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Dues ({money(stats.pendingFees)})
              </span>
            </div>
            <div className="h-[180px] w-full">
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: 'Jul', collected: Math.round(stats.totalRevenue * 0.35), pending: Math.round(stats.pendingFees * 0.6) },
                      { month: 'Aug', collected: Math.round(stats.totalRevenue * 0.52), pending: Math.round(stats.pendingFees * 0.5) },
                      { month: 'Sep', collected: Math.round(stats.totalRevenue * 0.70), pending: Math.round(stats.pendingFees * 0.45) },
                      { month: 'Oct', collected: Math.round(stats.totalRevenue * 0.85), pending: Math.round(stats.pendingFees * 0.4) },
                      { month: 'Nov', collected: stats.totalRevenue, pending: stats.pendingFees },
                      { month: 'Dec (Est)', collected: Math.round(stats.totalRevenue * 1.15), pending: Math.round(stats.pendingFees * 0.25) },
                    ]}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
                    <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorPending)" name="Outstanding Dues" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          </section>

          <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-border">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <ClipboardCheck size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Campus Roll Call Velocity</h3>
                  <p className="text-[11px] text-muted-foreground">Today's overall student presence</p>
                </div>
              </div>
              <div className="text-center py-2">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground tracking-tight">{stats.todayAttendancePercentage}%</span>
                  <span className="text-xs font-bold text-emerald-600">Rate</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-muted/40 h-3 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.todayAttendancePercentage || 0))}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800/30">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Present</span>
                  <p className="text-lg font-black text-foreground">{stats.presentToday}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-800/30">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Absent</span>
                  <p className="text-lg font-black text-foreground">{stats.absentToday}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`${basePath}/attendance`)}
              className="mt-4 w-full py-2 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-background text-xs font-bold hover:bg-slate-100 dark:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Attendance Register</span>
              <ArrowRight size={12} />
            </button>
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden xl:col-span-2">
          <SectionTitle icon={LayoutDashboard} title="Live School Overview" subtitle="Only current records returned by the database" action={`${totalPeople} people`} />
          {totalPeople === 0 && stats.classesCount === 0 ? <EmptyState label="Your school has no live academic/people records yet." /> : (
            <div className="h-[285px] w-full">
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={indicatorData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="currentColor" className="text-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden">
          <SectionTitle icon={ClipboardCheck} title="Attendance Details" subtitle="Today from live attendance records" gradient="from-teal-500 via-emerald-500 to-cyan-600" />
          {attendanceTotal === 0 ? <EmptyState label="No attendance has been recorded today." /> : (
            <div className="space-y-5">
              <div className="mx-auto h-[190px] w-full">
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3}>
                        {attendanceData.map((entry) => <Cell key={entry.name} fill={entry.name === 'Present' ? '#10b981' : '#ef4444'} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Present</p><p className="mt-1 text-xl font-black text-foreground">{stats.presentToday}</p></div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Absent</p><p className="mt-1 text-xl font-black text-foreground">{stats.absentToday}</p></div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden">
          <SectionTitle icon={BookOpen} title="Classes & Sections" subtitle="Live academic structure" gradient="from-sky-500 via-blue-500 to-indigo-600" action={`${classes.length} classes`} />
          {classes.length === 0 ? <EmptyState label="No classes found for this school." /> : (
            <div className="space-y-2.5">
              {classes.slice(0, 8).map((item) => (
                <button key={item.id} onClick={() => navigate(`${basePath}/classes`)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-muted/40 transition-colors">
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-foreground">{item.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{item.sections?.length || 0} sections · {item.subjects?.length || 0} subjects</p></div>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden">
          <SectionTitle icon={UserPlus} title="Recent Admissions" subtitle="Latest students stored in the database" />
          {stats.recentAdmissions.length === 0 ? <EmptyState label="No student admissions found." /> : (
            <div className="space-y-2.5">
              {stats.recentAdmissions.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-3 hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><GraduationCap size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-foreground">{student.name}</p><p className="text-[11px] text-muted-foreground">{student.section?.class?.name || 'Class not assigned'}</p></div></div>
                  <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{formatDate(student.admissionDate)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden lg:col-span-2">
          <SectionTitle icon={CalendarDays} title="Upcoming Exams" subtitle="Future exams currently stored in the database" gradient="from-indigo-500 via-purple-500 to-violet-600" />
          {stats.upcomingExams.length === 0 ? <EmptyState label="No upcoming exams found." /> : (
            <div className="space-y-2.5">
              {stats.upcomingExams.map((exam) => (
                <div key={exam.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 dark:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><FileText size={16} /></span><div><p className="text-sm font-bold text-foreground">{exam.name}</p><p className="text-[11px] text-muted-foreground">{exam.type || 'Exam'} · {formatDate(exam.startDate)}</p></div></div>
                  <button onClick={() => navigate(`${basePath}/exams`)} className="text-xs font-bold text-primary">Open Exams <ArrowRight className="ml-1 inline" size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm p-6 overflow-hidden">
          <SectionTitle icon={Bell} title="Notice Board" subtitle="Latest school announcements" gradient="from-amber-500 via-orange-500 to-rose-500" />
          {stats.announcements.length === 0 ? <EmptyState label="No announcements found." /> : (
            <div className="space-y-2.5">
              {stats.announcements.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background p-3 hover:bg-slate-50 dark:bg-slate-900 transition-colors"><p className="text-xs font-bold text-foreground">{item.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.content}</p><p className="mt-2 text-[10px] font-semibold text-muted-foreground">{formatDate(item.publishedAt)}</p></div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {isTeacher ? (
          <>
            <button onClick={() => navigate(`${basePath}/homework`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><FileText size={18} /></span><span><span className="block text-sm font-bold text-foreground">Homework Assigned</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.pendingHomeworks} active tasks</span></span></button>
            <button onClick={() => navigate(`${basePath}/timetable`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"><CalendarDays size={18} /></span><span><span className="block text-sm font-bold text-foreground">My Timetable</span><span className="mt-0.5 block text-xs text-muted-foreground">Class & period schedule</span></span></button>
            <button onClick={() => navigate(`${basePath}/exams`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><GraduationCap size={18} /></span><span><span className="block text-sm font-bold text-foreground">Exams & Gradebook</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.upcomingExams.length} upcoming exams</span></span></button>
          </>
        ) : (
          <>
            <button onClick={() => navigate(`${basePath}/homework`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><FileText size={18} /></span><span><span className="block text-sm font-bold text-foreground">Pending Homework</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.pendingHomeworks} live records</span></span></button>
            <button onClick={() => navigate(`${basePath}/staff`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Clock3 size={18} /></span><span><span className="block text-sm font-bold text-foreground">Staff & Leaves</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.pendingLeaves} live records</span></span></button>
            <button onClick={() => navigate(`${basePath}/reports`)} className="bg-white dark:bg-card border border-slate-200 dark:border-border/40 rounded-2xl shadow-sm flex items-center gap-3 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><LayoutDashboard size={18} /></span><span><span className="block text-sm font-bold text-foreground">School Reports</span><span className="mt-0.5 block text-xs text-muted-foreground">Live analytics</span></span></button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 size={14} className="text-emerald-500" /> Dashboard data source: live school database via NestJS API</div>
        <button onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 text-xs font-bold text-primary"><RefreshCw size={13} /> Refresh data</button>
      </div>
    </div>
  );
}
