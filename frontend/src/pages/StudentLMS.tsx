import { useEffect, useMemo, useState } from 'react';
import {
  Award, Bell, BookOpen, CalendarDays, CheckCircle2, Clock3, GraduationCap,
  Loader2, Megaphone, UserRound, WalletCards, RefreshCw, ShieldCheck,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = {
  id: string; admissionNo: string; name: string; email?: string; rollNo?: string;
  sectionId?: string; section?: { name: string; class?: { name: string } } | null; status: string;
};
type Homework = { id: string; title: string; description?: string; dueDate?: string; subject?: { name: string } };
type Timetable = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; subject?: { name: string }; teacher?: { name: string } };
type Announcement = { id: string; title: string; content?: string; message?: string; createdAt: string };
type Attendance = { id?: string; studentId: string; status: string; remarks?: string; date?: string; name?: string };
type Exam = { id: string; name?: string; title?: string; startDate?: string; date?: string };
type Result = { id: string; examName: string; examDate?: string; subjectName: string; marksObtained: number; totalMarks: number; passingMarks: number; isAbsent: boolean; grade?: string | null; remarks?: string | null };
type FeePayment = { id: string; receiptNo?: string; amount: number; discount?: number; fine?: number; totalPaid: number; status: string; dueDate?: string | null; paidDate?: string | null; feeStructure?: { name: string } | null };
type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string };
type Tab = 'overview' | 'attendance' | 'fees' | 'homework' | 'timetable' | 'exams' | 'results' | 'communication' | 'notifications' | 'profile';

const statusClass: Record<string, string> = {
  PRESENT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  ABSENT: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  LATE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LEAVE: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};
const feeStatusClass: Record<string, string> = {
  PAID: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  PARTIAL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PENDING: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};
const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'fees', label: 'Fees', icon: WalletCards },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'exams', label: 'Exams', icon: Award },
  { id: 'results', label: 'Results', icon: Award },
  { id: 'communication', label: 'School Communication', icon: Megaphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: UserRound },
];

const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—';
const day = (n: number) => ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][n] || `Day ${n}`;

export default function StudentLMS() {
  const [tab, setTab] = useState<Tab>('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const me = await apiClient.get('/people/me');
      const studentData = me.data as Student;
      setStudent(studentData);
      const sectionId = studentData.sectionId;
      const requests = await Promise.allSettled([
        apiClient.get('/academics/homework'),
        apiClient.get('/academics/timetables'),
        apiClient.get('/academics/announcements'),
        apiClient.get('/exams'),
        apiClient.get('/exams/my-results'),
        apiClient.get('/finance/payments'),
        apiClient.get('/notifications'),
        apiClient.get('/attendance/student/me'),
        sectionId ? apiClient.get(`/attendance?sectionId=${encodeURIComponent(sectionId)}&date=${new Date().toISOString().split('T')[0]}`) : Promise.resolve({ data: [] }),
      ]);
      const [hw, tt, notices, examData, resultData, feeData, notifData, historyData, todayData] = requests;
      if (hw.status === 'fulfilled') setHomework(Array.isArray(hw.value.data) ? hw.value.data : []);
      if (tt.status === 'fulfilled') setTimetable(Array.isArray(tt.value.data) ? tt.value.data : []);
      if (notices.status === 'fulfilled') setAnnouncements(Array.isArray(notices.value.data) ? notices.value.data : []);
      if (examData.status === 'fulfilled') setExams(Array.isArray(examData.value.data) ? examData.value.data : []);
      if (resultData.status === 'fulfilled') setResults(Array.isArray(resultData.value.data) ? resultData.value.data : []);
      if (feeData.status === 'fulfilled') setFees(Array.isArray(feeData.value.data) ? feeData.value.data : []);
      if (notifData.status === 'fulfilled') setNotifications(Array.isArray(notifData.value.data) ? notifData.value.data : []);
      if (historyData.status === 'fulfilled') setAttendance(Array.isArray(historyData.value.data) ? historyData.value.data : []);
      if (todayData.status === 'fulfilled' && Array.isArray(todayData.value.data)) {
        const today = todayData.value.data.find((r: Attendance) => r.studentId === studentData.id);
        if (today && !attendance.some(a => a.date === today.date)) setAttendance(prev => prev.some(a => a.date === today.date) ? prev : [{ ...today, date: new Date().toISOString() }, ...prev]);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to load Student LMS');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const pendingFees = useMemo(() => fees.reduce((sum, fee) => sum + Math.max(0, Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.fine || 0) - Number(fee.totalPaid || 0)), 0), [fees]);
  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return { total, present, percentage: total ? Math.round((present / total) * 100) : 0 };
  }, [attendance]);
  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={34} /></div>;
  if (!student) return <div className="rounded-3xl border border-dashed p-10 text-center bg-card"><GraduationCap className="mx-auto mb-3 text-primary" /><h2 className="font-bold text-xl">Student profile not found</h2><p className="text-muted-foreground mt-2">Please contact your School Admin.</p></div>;

  return <div className="space-y-5 max-w-screen-2xl mx-auto pb-10">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-cyan-500/10 p-6 md:p-8 shadow-xl">
      <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary"><GraduationCap size={31} /></div><div><p className="text-xs uppercase tracking-widest font-black text-primary mb-1">Student LMS</p><h1 className="text-3xl font-black">Welcome, {student.name}</h1><p className="text-muted-foreground mt-1">{student.section?.class?.name || 'Class'}{student.section?.name ? ` • Section ${student.section.name}` : ''} • Roll No: {student.rollNo || '—'}</p></div></div>
        <div className="flex items-center gap-3"><span className="flex items-center gap-2 text-xs font-bold text-emerald-400"><ShieldCheck size={16} /> Account Active</span><button onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold hover:bg-muted"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh</button></div>
      </div>
    </section>

    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition ${tab === id ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-card hover:bg-muted'}`}><Icon size={16} />{label}{id === 'notifications' && unread > 0 ? <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{unread}</span> : null}</button>)}</div>

    {tab === 'overview' && <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Metric icon={<UserRound size={20} />} label="Admission No" value={student.admissionNo} />
        <Metric icon={<CheckCircle2 size={20} />} label="Attendance" value={`${attendanceStats.percentage}%`} />
        <Metric icon={<BookOpen size={20} />} label="Homework" value={`${homework.length} assigned`} />
        <Metric icon={<Award size={20} />} label="Results" value={`${results.length} published`} />
        <Metric icon={<WalletCards size={20} />} label="Pending Fees" value={`PKR ${pendingFees.toLocaleString()}`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Today's Attendance" icon={<CheckCircle2 size={18} />}><AttendanceList items={attendance.filter(a => a.date && new Date(a.date).toDateString() === new Date().toDateString()).slice(0, 1)} empty="Attendance has not been published for today." /></Panel>
        <Panel title="School Communication" icon={<Megaphone size={18} />}><NoticeList items={announcements.slice(0, 5)} /></Panel>
        <Panel title="Upcoming Homework" icon={<BookOpen size={18} />}><HomeworkList items={homework.slice(0, 5)} /></Panel>
        <Panel title="Latest Results" icon={<Award size={18} />}><ResultList items={results.slice(0, 5)} /></Panel>
      </div>
    </>}

    {tab === 'attendance' && <Panel title="My Attendance" icon={<CheckCircle2 size={18} />}><div className="mb-5 grid grid-cols-3 gap-3"><MetricSmall label="Days" value={attendanceStats.total.toString()} /><MetricSmall label="Present" value={attendanceStats.present.toString()} /><MetricSmall label="Attendance" value={`${attendanceStats.percentage}%`} /></div><AttendanceList items={attendance} empty="No attendance history has been published yet." /></Panel>}
    {tab === 'fees' && <Panel title="Fee History & Pending Balance" icon={<WalletCards size={18} />}><div className="rounded-2xl border bg-muted/30 p-4 mb-4"><p className="text-xs text-muted-foreground">Current Pending Balance</p><p className="text-2xl font-black mt-1">PKR {pendingFees.toLocaleString()}</p></div>{fees.length ? <div className="space-y-3">{fees.map(f => <div key={f.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{f.feeStructure?.name || 'Fee Payment'}</p><p className="text-xs text-muted-foreground mt-1">{f.receiptNo || 'Receipt pending'} • {dateText(f.paidDate || f.dueDate)}</p></div><span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black ${feeStatusClass[f.status] || 'bg-muted'}`}>{f.status}</span></div><p className="text-sm mt-2">Paid <strong>PKR {Number(f.totalPaid || 0).toLocaleString()}</strong> of PKR {(Number(f.amount || 0) - Number(f.discount || 0) + Number(f.fine || 0)).toLocaleString()}</p></div>)}</div> : <Empty text="No fee history found." />}</Panel>}
    {tab === 'homework' && <Panel title="My Homework" icon={<BookOpen size={18} />}><HomeworkList items={homework} /></Panel>}
    {tab === 'timetable' && <Panel title="My Timetable" icon={<CalendarDays size={18} />}><div className="grid md:grid-cols-2 gap-3">{timetable.length ? timetable.map(t => <div key={t.id} className="rounded-xl border p-4"><p className="font-bold">{day(t.dayOfWeek)} • {t.startTime}–{t.endTime}</p><p className="text-sm text-muted-foreground mt-1">{t.subject?.name || 'Subject'} • {t.teacher?.name || 'Teacher'}{t.room ? ` • Room ${t.room}` : ''}</p></div>) : <Empty text="No timetable assigned." />}</div></Panel>}
    {tab === 'exams' && <Panel title="Examinations" icon={<Award size={18} />}><div className="space-y-3">{exams.length ? exams.map(e => <div key={e.id} className="rounded-xl border p-4 flex items-center justify-between"><div><p className="font-bold">{e.name || e.title || 'Examination'}</p><p className="text-xs text-muted-foreground mt-1">{dateText(e.startDate || e.date)}</p></div><Clock3 size={18} className="text-primary" /></div>) : <Empty text="No examinations published yet." />}</div></Panel>}
    {tab === 'results' && <Panel title="Published Results" icon={<Award size={18} />}><ResultList items={results} /></Panel>}
    {tab === 'communication' && <Panel title="School Communication" icon={<Megaphone size={18} />}><NoticeList items={announcements} /></Panel>}
    {tab === 'notifications' && <Panel title="My Notifications" icon={<Bell size={18} />}><div className="space-y-3">{notifications.length ? notifications.map(n => <div key={n.id} className={`rounded-xl border p-4 ${!n.isRead ? 'border-primary/25 bg-primary/5' : ''}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{n.title}</p><p className="text-sm text-muted-foreground mt-1">{n.message}</p><p className="text-[11px] text-muted-foreground mt-2">{dateText(n.createdAt)}</p></div>{!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}</div></div>) : <Empty text="No notifications yet." />}</div></Panel>}
    {tab === 'profile' && <Panel title="My Profile" icon={<UserRound size={18} />}><div className="grid md:grid-cols-2 gap-4">{[['Student Name', student.name], ['Admission No', student.admissionNo], ['Roll No', student.rollNo || '—'], ['Class', student.section?.class?.name || '—'], ['Section', student.section?.name || '—'], ['Email', student.email || '—'], ['Status', student.status || 'ACTIVE']].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold mt-1 break-words">{value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="font-bold">Student Login</p><p className="text-sm text-muted-foreground mt-1">Your login is managed by the School Admin. Students cannot change their password.</p></div></Panel>}
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border bg-card p-5"><div className="text-primary mb-3">{icon}</div><p className="text-xs text-muted-foreground">{label}</p><p className="font-black mt-1 break-words">{value}</p></div>; }
function MetricSmall({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-card p-4 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-black mt-1">{value}</p></div>; }
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-black text-lg mb-4 flex gap-2 items-center">{icon}{title}</h2>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className="text-muted-foreground text-sm py-5 text-center">{text}</p>; }
function AttendanceList({ items, empty }: { items: Attendance[]; empty: string }) { return items.length ? <div className="space-y-2">{items.map((a, i) => <div key={`${a.id || a.studentId}-${a.date || i}`} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-bold">{a.date ? dateText(a.date) : 'Today'}</p>{a.remarks && <p className="text-xs text-muted-foreground mt-1">{a.remarks}</p>}</div><span className={`px-3 py-1.5 rounded-lg border text-xs font-black ${statusClass[a.status] || 'bg-muted'}`}>{a.status}</span></div>)}</div> : <Empty text={empty} />; }
function HomeworkList({ items }: { items: Homework[] }) { return items.length ? <div className="space-y-3">{items.map(h => <div key={h.id} className="rounded-xl border p-4"><p className="font-bold">{h.title}</p><p className="text-xs text-muted-foreground mt-1">{h.subject?.name || 'Subject'}{h.dueDate ? ` • Due ${dateText(h.dueDate)}` : ''}</p>{h.description && <p className="text-sm mt-2 text-muted-foreground">{h.description}</p>}</div>)}</div> : <Empty text="No homework assigned." />; }
function ResultList({ items }: { items: Result[] }) { return items.length ? <div className="space-y-3">{items.map(r => <div key={r.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{r.subjectName}</p><p className="text-xs text-muted-foreground mt-1">{r.examName}{r.examDate ? ` • ${dateText(r.examDate)}` : ''}</p></div><span className="font-black text-primary">{r.isAbsent ? 'Absent' : `${r.marksObtained}/${r.totalMarks}`}</span></div>{!r.isAbsent && <p className="text-xs text-muted-foreground mt-2">Passing: {r.passingMarks}{r.grade ? ` • Grade ${r.grade}` : ''}</p>}{r.remarks && <p className="text-xs text-muted-foreground mt-1">{r.remarks}</p>}</div>)}</div> : <Empty text="No published results yet." />; }
function NoticeList({ items }: { items: Announcement[] }) { return items.length ? <div className="space-y-3">{items.map(n => <div key={n.id} className="rounded-xl border p-4"><p className="font-bold">{n.title}</p><p className="text-xs text-muted-foreground mt-1">{dateText(n.createdAt)}</p><p className="text-sm text-muted-foreground mt-2">{n.content || n.message || 'School announcement'}</p></div>)}</div> : <Empty text="No school communication published yet." />; }
