import { useEffect, useMemo, useState } from 'react';
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
  Plus,
  UserPlus,
  Receipt,
  Megaphone,
  RefreshCw,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  LayoutDashboard,
  School,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { useNavigate, useParams } from 'react-router-dom';
import {
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
  numeric?: number | null;
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
  <div className="flex min-h-[130px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 px-5 text-center">
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
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  action?: string;
}) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={16} />
      </span>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {action ? <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{action}</span> : null}
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

  const kpis = useMemo(() => [
    {
      icon: GraduationCap,
      label: 'Total Students',
      value: stats.studentsCount,
      subtitle: 'Live database count',
      trend: stats.studentsCount ? 'Synced' : 'No students yet',
      gradient: 'gradient-bg-blue',
      path: '/students',
    },
    {
      icon: Users,
      label: 'Total Staff',
      value: totalStaff,
      subtitle: `${stats.teachersCount} teachers · ${stats.staffCount} staff`,
      trend: totalStaff ? 'Synced' : 'No staff yet',
      gradient: 'gradient-bg-emerald',
      path: '/staff',
    },
    {
      icon: BookOpen,
      label: 'Total Classes',
      value: stats.classesCount,
      subtitle: 'Live academic classes',
      trend: stats.classesCount ? 'Synced' : 'No classes yet',
      gradient: 'gradient-bg-primary',
      path: '/classes',
    },
    {
      icon: ClipboardCheck,
      label: 'Today Attendance',
      value: `${stats.todayAttendancePercentage}%`,
      subtitle: `${stats.presentToday} present · ${stats.absentToday} absent`,
      trend: attendanceTotal ? 'Live attendance' : 'No attendance yet',
      gradient: 'gradient-bg-blue',
      path: '/attendance',
    },
    {
      icon: WalletCards,
      label: 'Fee Collection',
      value: money(stats.totalRevenue),
      subtitle: 'Recorded payments',
      trend: stats.totalRevenue ? 'Live finance data' : 'No payments yet',
      gradient: 'gradient-bg-rose',
      path: '/finance',
    },
    {
      icon: AlertTriangle,
      label: 'Pending Fees',
      value: money(stats.pendingFees),
      subtitle: `${stats.pendingFeePaymentsCount} pending payments`,
      trend: stats.pendingFeePaymentsCount ? 'Action required' : 'All clear',
      trendDir: stats.pendingFeePaymentsCount ? 'down' : 'up',
      gradient: 'gradient-bg-amber',
      path: '/finance',
    },
  ], [stats, totalStaff, attendanceTotal]);

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
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Live DB Connected
              </span>
              <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-PK', { dateStyle: 'full' })}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {user?.schoolName || 'Your School'}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {role === 'TEACHER'
                ? 'Your teacher portal is showing live school records from the connected database.'
                : 'Your school operations overview is synchronized directly with live database records.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`${basePath}/students`)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm">
              <UserPlus size={15} /> Add Student
            </button>
            <button onClick={() => navigate(`${basePath}/finance`)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground">
              <Receipt size={15} /> Fees
            </button>
            <button onClick={() => navigate(`${basePath}/notices`)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground">
              <Megaphone size={15} /> Notice Board
            </button>
            <button onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-muted-foreground" title="Refresh live database data">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {error ? <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</div> : null}
      </motion.section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((item, index) => (
          <StatCard
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={loading ? '—' : item.value}
            trend={item.trend}
            trendDir={item.trendDir as any}
            subtitle={item.subtitle}
            gradient={item.gradient}
            delay={index * 0.04}
            onClick={() => navigate(`${basePath}${item.path}`)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="glass-card p-6 xl:col-span-2">
          <SectionTitle icon={LayoutDashboard} title="Live School Overview" subtitle="Only current records returned by the database" action={`${totalPeople} people`} />
          {totalPeople === 0 && stats.classesCount === 0 ? (
            <EmptyState label="Your school has no live academic/people records yet." />
          ) : (
            <div className="h-[285px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicatorData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.55} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="currentColor" className="text-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="glass-card p-6">
          <SectionTitle icon={ClipboardCheck} title="Attendance Details" subtitle="Today from live attendance records" />
          {attendanceTotal === 0 ? (
            <EmptyState label="No attendance has been recorded today." />
          ) : (
            <div className="space-y-5">
              <div className="mx-auto h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3}>
                      {attendanceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.name === 'Present' ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Present</p>
                  <p className="mt-1 text-xl font-black text-foreground">{stats.presentToday}</p>
                </div>
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Absent</p>
                  <p className="mt-1 text-xl font-black text-foreground">{stats.absentToday}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <SectionTitle icon={BookOpen} title="Classes & Sections" subtitle="Live academic structure" action={`${classes.length} classes`} />
          {classes.length === 0 ? (
            <EmptyState label="No classes found for this school." />
          ) : (
            <div className="space-y-2.5">
              {classes.slice(0, 8).map((item) => (
                <button key={item.id} onClick={() => navigate(`${basePath}/classes`)} className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.sections?.length || 0} sections · {item.subjects?.length || 0} subjects
                    </p>
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card p-6">
          <SectionTitle icon={UserPlus} title="Recent Admissions" subtitle="Latest students stored in the database" />
          {stats.recentAdmissions.length === 0 ? (
            <EmptyState label="No student admissions found." />
          ) : (
            <div className="space-y-2.5">
              {stats.recentAdmissions.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <GraduationCap size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">{student.section?.class?.name || 'Class not assigned'}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{formatDate(student.admissionDate)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-card p-6 lg:col-span-2">
          <SectionTitle icon={CalendarDays} title="Upcoming Exams" subtitle="Future exams currently stored in the database" />
          {stats.upcomingExams.length === 0 ? (
            <EmptyState label="No upcoming exams found." />
          ) : (
            <div className="space-y-2.5">
              {stats.upcomingExams.map((exam) => (
                <div key={exam.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <FileText size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{exam.name}</p>
                      <p className="text-[11px] text-muted-foreground">{exam.type || 'Exam'} · {formatDate(exam.startDate)}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`${basePath}/exams`)} className="text-xs font-bold text-primary">Open Exams <ArrowRight className="ml-1 inline" size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card p-6">
          <SectionTitle icon={Bell} title="Notice Board" subtitle="Latest school announcements" />
          {stats.announcements.length === 0 ? (
            <EmptyState label="No announcements found." />
          ) : (
            <div className="space-y-2.5">
              {stats.announcements.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.content}</p>
                  <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{formatDate(item.publishedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <button onClick={() => navigate(`${basePath}/homework`)} className="glass-card flex items-center gap-3 p-5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><FileText size={18} /></span>
          <span><span className="block text-sm font-bold text-foreground">Pending Homework</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.pendingHomeworks} live records</span></span>
        </button>
        <button onClick={() => navigate(`${basePath}/staff`)} className="glass-card flex items-center gap-3 p-5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Clock3 size={18} /></span>
          <span><span className="block text-sm font-bold text-foreground">Pending Leaves</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.pendingLeaves} live records</span></span>
        </button>
        <button onClick={() => navigate(`${basePath}/library`)} className="glass-card flex items-center gap-3 p-5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400"><AlertTriangle size={18} /></span>
          <span><span className="block text-sm font-bold text-foreground">Overdue Library</span><span className="mt-0.5 block text-xs text-muted-foreground">{stats.overdueLibraryBooks} overdue records</span></span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Dashboard data source: live school database via NestJS API
        </div>
        <button onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 text-xs font-bold text-primary">
          <RefreshCw size={13} /> Refresh data
        </button>
      </div>
    </div>
  );
}
