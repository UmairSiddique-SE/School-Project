import { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, GraduationCap, Users, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Stats = { studentsCount?: number; teachersCount?: number; parentsCount?: number; staffCount?: number; classesCount?: number; totalRevenue?: number; pendingFees?: number; todayAttendancePercentage?: number; presentToday?: number; absentToday?: number; recentAdmissions?: any[]; upcomingExams?: any[] };

export default function DashboardLive() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [s, st, c] = await Promise.all([apiClient.get('/people/stats'), apiClient.get('/people/students'), apiClient.get('/classes')]);
      setStats(s.data || {}); setStudents(Array.isArray(st.data) ? st.data : []); setClasses(Array.isArray(c.data) ? c.data : []);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load dashboard data'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [user?.schoolId]);
  const recent = useMemo(() => [...students].sort((a,b) => new Date(b.admissionDate || b.createdAt || 0).getTime() - new Date(a.admissionDate || a.createdAt || 0).getTime()).slice(0,6), [students]);
  const cards = [
    { label: 'Students', value: stats.studentsCount ?? 0, icon: GraduationCap, href: 'students' },
    { label: 'Teachers', value: stats.teachersCount ?? 0, icon: Users, href: 'staff' },
    { label: 'Classes', value: stats.classesCount ?? classes.length, icon: BookOpen, href: 'classes' },
    { label: 'Today Attendance', value: `${stats.todayAttendancePercentage ?? 0}%`, icon: Activity, href: 'attendance' },
  ];
  return <div className="space-y-6 pb-10">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-primary">School overview</p><h1 className="text-3xl font-black mt-1">{user?.schoolName || 'Dashboard'}</h1><p className="text-sm text-muted-foreground">Live records from your school database. No demo statistics.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-accent"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh</button></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(c => { const Icon=c.icon; return <Link key={c.label} to={`/${user?.schoolSlug}/${c.href}`} className="rounded-2xl border bg-card p-5 hover:border-primary/40 transition"><Icon className="text-primary" size={20}/><p className="text-xs text-muted-foreground mt-4">{c.label}</p><p className="text-3xl font-black mt-1">{c.value}</p></Link>; })}</div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-lg">Recent admissions</h2><p className="text-xs text-muted-foreground">Latest student records</p></div><Link to={`/${user?.schoolSlug}/students`} className="text-xs font-bold text-primary">View all <ArrowRight size={13} className="inline"/></Link></div>{recent.length ? <div className="space-y-2">{recent.map((s,i)=><div key={s.id || i} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-bold text-sm">{s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'}</p><p className="text-xs text-muted-foreground">{s.admissionNo || '—'} • {s.section?.name || s.class?.name || 'Unassigned'}</p></div><span className="text-xs font-bold text-muted-foreground">{s.status || 'ACTIVE'}</span></div>)}</div> : <div className="py-12 text-center text-sm text-muted-foreground">No students registered yet.</div>}</div>
      <div className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg">Academic structure</h2><p className="text-xs text-muted-foreground mb-4">Current classes and sections</p>{classes.length ? <div className="grid sm:grid-cols-2 gap-2">{classes.map(c=><div key={c.id} className="rounded-xl border p-3"><p className="font-bold">{c.name}</p><p className="text-xs text-muted-foreground mt-1">{c.sections?.length || 0} sections</p></div>)}</div> : <div className="py-12 text-center text-sm text-muted-foreground">No classes created yet.</div>}</div>
    </div>
    <div className="grid sm:grid-cols-3 gap-4"><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Present today</p><p className="text-2xl font-black mt-1">{stats.presentToday ?? 0}</p></div><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Absent today</p><p className="text-2xl font-black mt-1">{stats.absentToday ?? 0}</p></div><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Pending fees</p><p className="text-2xl font-black mt-1">Rs {Number(stats.pendingFees || 0).toLocaleString()}</p></div></div>
  </div>;
}
