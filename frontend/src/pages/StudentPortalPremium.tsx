import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type Student = {
  id: string;
  admissionNo: string;
  name: string;
  email?: string;
  phone?: string;
  rollNo?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  religion?: string;
  bFormNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  admissionType?: string;
  session?: string;
  status: string;
  avatarUrl?: string;
  sectionId?: string;
  section?: { name: string; teacher?: { name: string } | null; class?: { name: string } } | null;
  account?: { name?: string; email?: string; role?: string };
};
type Homework = { id: string; title: string; description?: string; dueDate?: string; subject?: { name: string } };
type Timetable = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; subject?: { name: string }; teacher?: { name: string } };
type Announcement = { id: string; title: string; content?: string; message?: string; createdAt: string };
type Attendance = { id?: string; studentId: string; status: string; remarks?: string; date?: string };
type Exam = { id: string; name?: string; title?: string; startDate?: string; date?: string };
type Result = { id: string; examName: string; examDate?: string; subjectName: string; marksObtained: number; totalMarks: number; passingMarks: number; isAbsent: boolean; grade?: string | null; remarks?: string | null };
type FeePayment = { id: string; receiptNo?: string; amount: number; discount?: number; fine?: number; totalPaid: number; status: string; dueDate?: string | null; paidDate?: string | null; feeStructure?: { name: string } | null };
type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string };
type Tab = 'overview' | 'attendance' | 'homework' | 'timetable' | 'exams' | 'results' | 'fees' | 'notices' | 'notifications' | 'profile';

const tabs: { id: Tab; label: string; icon: typeof GraduationCap }[] = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'exams', label: 'Exams', icon: Award },
  { id: 'results', label: 'Results', icon: Award },
  { id: 'fees', label: 'Fees', icon: WalletCards },
  { id: 'notices', label: 'Notices', icon: Megaphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: UserRound },
];

const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const dayName = (value: number) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][value] || `Day ${value}`;

function Barcode({ value }: { value: string }) {
  const digits = Array.from(value || 'EDUSPHERE').map((char, index) => ((char.charCodeAt(0) + index * 17) % 5) + 1);
  return (
    <div className="w-full rounded-xl border border-black/10 bg-white p-2">
      <svg viewBox={`0 0 ${digits.length * 8 + 10} 42`} className="h-12 w-full">
        {digits.map((width, index) => <rect key={index} x={5 + index * 8} y={3} width={width} height={34} rx="0.5" fill="black" />)}
      </svg>
      <p className="mt-0.5 text-center font-mono text-[9px] tracking-[0.25em] text-slate-600">{value}</p>
    </div>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">{icon}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

export default function StudentPortalPremium() {
  const { user } = useAuth();
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
      if (silent) setRefreshing(true); else setLoading(true);
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
      const [hw, tt, notices, examData, resultData, feeData, notifData, attendanceData, todayData] = requests;
      if (hw.status === 'fulfilled') setHomework(Array.isArray(hw.value.data) ? hw.value.data : []);
      if (tt.status === 'fulfilled') setTimetable(Array.isArray(tt.value.data) ? tt.value.data : []);
      if (notices.status === 'fulfilled') setAnnouncements(Array.isArray(notices.value.data) ? notices.value.data : []);
      if (examData.status === 'fulfilled') setExams(Array.isArray(examData.value.data) ? examData.value.data : []);
      if (resultData.status === 'fulfilled') setResults(Array.isArray(resultData.value.data) ? resultData.value.data : []);
      if (feeData.status === 'fulfilled') setFees(Array.isArray(feeData.value.data) ? feeData.value.data : []);
      if (notifData.status === 'fulfilled') setNotifications(Array.isArray(notifData.value.data) ? notifData.value.data : []);
      if (attendanceData.status === 'fulfilled') setAttendance(Array.isArray(attendanceData.value.data) ? attendanceData.value.data : []);
      if (todayData.status === 'fulfilled' && Array.isArray(todayData.value.data)) {
        const today = todayData.value.data.find((row: Attendance) => row.studentId === studentData.id);
        if (today) setAttendance(previous => previous.some(row => row.date === today.date) ? previous : [{ ...today, date: new Date().toISOString() }, ...previous]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load student portal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(item => item.status === 'PRESENT').length;
    const late = attendance.filter(item => item.status === 'LATE').length;
    return { total, present, late, percentage: total ? Math.round((present / total) * 100) : 0 };
  }, [attendance]);
  const pendingFees = useMemo(() => fees.reduce((sum, fee) => sum + Math.max(0, Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.fine || 0) - Number(fee.totalPaid || 0)), 0), [fees]);
  const unread = notifications.filter(item => !item.isRead).length;
  const schoolName = user?.schoolName || 'EduSphere School';
  const initials = (student?.name || user?.name || 'S').split(/\s+/).map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={34} /></div>;
  if (!student) return <Empty text="Student profile could not be loaded. Please contact your School Admin." />;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-[32px] border border-indigo-500/20 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.28),transparent_35%),linear-gradient(135deg,#0f172a,#1e1b4b_55%,#111827)] p-5 text-white shadow-2xl md:p-7">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-white/10 text-2xl font-black shadow-xl">
              {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" /> : initials}
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200"><ShieldCheck size={13} /> Active Student</div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{student.name}</h1>
              <p className="mt-1 text-sm text-slate-300">{schoolName}</p>
              <p className="mt-2 text-sm font-semibold text-slate-200">{student.section?.class?.name || 'Class'}{student.section?.name ? ` · Section ${student.section.name}` : ''} · Roll No {student.rollNo || '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <span className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold">Admission: {student.admissionNo}</span>
            <button onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/15"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
          </div>
        </div>
      </section>

      <nav className="sticky top-2 z-40 overflow-x-auto rounded-2xl border border-border/70 bg-card/95 p-2 shadow-xl backdrop-blur-xl">
        <div className="flex min-w-max gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${tab === id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon size={15} />{label}{id === 'notifications' && unread > 0 ? <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] text-white">{unread}</span> : null}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_380px]">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={<CheckCircle2 size={18} />} label="Attendance" value={`${attendanceStats.percentage}%`} />
              <Stat icon={<BookOpen size={18} />} label="Homework" value={String(homework.length)} />
              <Stat icon={<Award size={18} />} label="Results" value={String(results.length)} />
              <Stat icon={<WalletCards size={18} />} label="Pending Fees" value={`PKR ${pendingFees.toLocaleString()}`} />
            </div>
            <Panel title="Today at a Glance" icon={<GraduationCap size={18} className="text-violet-500" />}>
              <div className="grid gap-3 md:grid-cols-3">
                <InfoTile label="Class / Section" value={`${student.section?.class?.name || '—'} / ${student.section?.name || '—'}`} />
                <InfoTile label="Class Teacher" value={student.section?.teacher?.name || 'Not assigned'} />
                <InfoTile label="Session" value={student.session || '—'} />
                <InfoTile label="Attendance" value={`${attendanceStats.present} present · ${attendanceStats.late} late`} />
                <InfoTile label="Upcoming Exams" value={String(exams.length)} />
                <InfoTile label="Unread Notifications" value={String(unread)} />
              </div>
            </Panel>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Latest Homework" icon={<BookOpen size={18} className="text-indigo-500" />}><HomeworkList items={homework.slice(0, 5)} /></Panel>
              <Panel title="School Notices" icon={<Megaphone size={18} className="text-fuchsia-500" />}><NoticeList items={announcements.slice(0, 5)} /></Panel>
            </div>
            <Panel title="Latest Results" icon={<Award size={18} className="text-amber-500" />}><ResultList items={results.slice(0, 5)} /></Panel>
          </div>
          <StudentIdCard student={student} schoolName={schoolName} />
        </div>
      )}

      {tab === 'attendance' && <Panel title="My Attendance" icon={<CheckCircle2 size={18} className="text-emerald-500" />}><div className="mb-5 grid grid-cols-3 gap-3"><InfoTile label="Days Marked" value={String(attendanceStats.total)} /><InfoTile label="Present" value={String(attendanceStats.present)} /><InfoTile label="Attendance" value={`${attendanceStats.percentage}%`} /></div><div className="space-y-2">{attendance.length ? attendance.map((item, index) => <div key={`${item.id || item.date}-${index}`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4"><div><p className="font-bold">{dateText(item.date)}</p>{item.remarks && <p className="mt-1 text-xs text-muted-foreground">{item.remarks}</p>}</div><span className={`rounded-xl border px-3 py-1.5 text-xs font-black ${item.status === 'PRESENT' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' : item.status === 'ABSENT' ? 'border-rose-500/20 bg-rose-500/10 text-rose-600' : 'border-amber-500/20 bg-amber-500/10 text-amber-600'}`}>{item.status}</span></div>) : <Empty text="No attendance history has been published yet." />}</div></Panel>}
      {tab === 'homework' && <Panel title="Homework" icon={<BookOpen size={18} className="text-indigo-500" />}><HomeworkList items={homework} /></Panel>}
      {tab === 'timetable' && <Panel title="Timetable" icon={<CalendarDays size={18} className="text-cyan-500" />}><div className="grid gap-3 md:grid-cols-2">{timetable.length ? timetable.map(item => <div key={item.id} className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-cyan-500/[0.04] p-4"><p className="font-black">{dayName(item.dayOfWeek)} · {item.startTime}–{item.endTime}</p><p className="mt-2 text-sm text-muted-foreground">{item.subject?.name || 'Subject'} · {item.teacher?.name || 'Teacher'}{item.room ? ` · Room ${item.room}` : ''}</p></div>) : <Empty text="No timetable assigned." />}</div></Panel>}
      {tab === 'exams' && <Panel title="Examinations" icon={<Award size={18} className="text-amber-500" />}><div className="space-y-3">{exams.length ? exams.map(item => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border/70 p-4"><div><p className="font-bold">{item.name || item.title || 'Examination'}</p><p className="mt-1 text-xs text-muted-foreground">{dateText(item.startDate || item.date)}</p></div><Clock3 size={18} className="text-amber-500" /></div>) : <Empty text="No examinations published yet." />}</div></Panel>}
      {tab === 'results' && <Panel title="Published Results" icon={<Award size={18} className="text-violet-500" />}><ResultList items={results} /></Panel>}
      {tab === 'fees' && <Panel title="Fee History & Pending Balance" icon={<CreditCard size={18} className="text-emerald-500" />}><div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-emerald-600">Current Pending Balance</p><p className="mt-1 text-3xl font-black">PKR {pendingFees.toLocaleString()}</p></div>{fees.length ? <div className="space-y-3">{fees.map(item => <div key={item.id} className="rounded-2xl border border-border/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.feeStructure?.name || 'Fee Payment'}</p><p className="mt-1 text-xs text-muted-foreground">{item.receiptNo || 'Receipt pending'} · {dateText(item.paidDate || item.dueDate)}</p></div><span className="rounded-xl border px-2.5 py-1 text-[11px] font-black">{item.status}</span></div><p className="mt-2 text-sm">Paid <strong>PKR {Number(item.totalPaid || 0).toLocaleString()}</strong> of PKR {(Number(item.amount || 0) - Number(item.discount || 0) + Number(item.fine || 0)).toLocaleString()}</p></div>)}</div> : <Empty text="No fee history found." />}</Panel>}
      {tab === 'notices' && <Panel title="School Notices" icon={<Megaphone size={18} className="text-fuchsia-500" />}><NoticeList items={announcements} /></Panel>}
      {tab === 'notifications' && <Panel title="Notifications" icon={<Bell size={18} className="text-violet-500" />}><div className="space-y-3">{notifications.length ? notifications.map(item => <div key={item.id} className={`rounded-2xl border p-4 ${item.isRead ? 'border-border/70' : 'border-violet-500/20 bg-violet-500/[0.05]'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-[11px] text-muted-foreground">{dateText(item.createdAt)}</p></div>{!item.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500" />}</div></div>) : <Empty text="No notifications yet." />}</div></Panel>}
      {tab === 'profile' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><Panel title="Student Information" icon={<UserRound size={18} className="text-violet-500" />}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
        ['Full Name', student.name], ['Admission No', student.admissionNo], ['Roll No', student.rollNo || '—'], ['Class', student.section?.class?.name || '—'], ['Section', student.section?.name || '—'], ['Session', student.session || '—'], ['Date of Birth', dateText(student.dateOfBirth)], ['Gender', student.gender || '—'], ['Blood Group', student.bloodGroup || '—'], ['Religion', student.religion || '—'], ['B-Form / CNIC', student.bFormNumber || '—'], ['Admission Type', student.admissionType || 'NEW'], ['Email', student.email || '—'], ['Mobile', student.phone || '—'], ['Status', student.status || 'ACTIVE'],
      ].map(([label, value]) => <InfoTile key={label} label={label} value={value} />)}</div><div className="mt-4 grid gap-3 md:grid-cols-2"><InfoTile label="Current Address" value={student.currentAddress || '—'} /><InfoTile label="Permanent Address" value={student.permanentAddress || '—'} /></div></Panel><StudentIdCard student={student} schoolName={schoolName} /></div>}
    </div>
  );
}

function StudentIdCard({ student, schoolName }: { student: Student; schoolName: string }) {
  const initials = student.name.split(/\s+/).map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
  return (
    <aside className="self-start xl:sticky xl:top-20 rounded-[32px] bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 p-4 text-white shadow-2xl">
      <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.24em] text-violet-200">Official Student ID</p><p className="mt-1 text-lg font-black">{schoolName}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-black">E</div></div>
        <div className="mt-5 flex items-center gap-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-2xl font-black">{student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" /> : initials}</div><div className="min-w-0"><p className="truncate text-xl font-black">{student.name}</p><p className="mt-1 text-xs text-violet-200">{student.section?.class?.name || 'Class'} / {student.section?.name || 'Section'}</p><p className="mt-1 text-xs text-slate-300">Roll No: {student.rollNo || '—'}</p></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2"><SmallId label="Admission No" value={student.admissionNo} /><SmallId label="Session" value={student.session || '—'} /></div>
        <div className="mt-4 rounded-2xl bg-white p-2"><Barcode value={student.admissionNo} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-white/10 p-2"><p className="text-violet-200">Class Teacher</p><p className="mt-1 font-bold">{student.section?.teacher?.name || 'Not assigned'}</p></div><div className="rounded-xl bg-white/10 p-2"><p className="text-violet-200">Status</p><p className="mt-1 font-bold text-emerald-300">{student.status || 'ACTIVE'}</p></div></div>
        <p className="mt-4 text-center text-[9px] uppercase tracking-[.2em] text-violet-200/60">Property of {schoolName} · EduSphere ERP</p>
      </div>
    </aside>
  );
}

function SmallId({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/10 p-2.5"><p className="text-[9px] uppercase tracking-[.14em] text-violet-200">{label}</p><p className="mt-1 truncate text-xs font-black">{value}</p></div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm"><div className="mb-2 text-violet-500">{icon}</div><p className="text-[10px] font-black uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-lg font-black">{value}</p></div>;
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-bold">{value}</p></div>;
}

function HomeworkList({ items }: { items: Homework[] }) {
  return items.length ? <div className="space-y-2">{items.map(item => <div key={item.id} className="rounded-2xl border border-border/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.subject?.name || 'Subject'}{item.dueDate ? ` · Due ${dateText(item.dueDate)}` : ''}</p></div><BookOpen size={17} className="text-indigo-500" /></div>{item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}</div>)}</div> : <Empty text="No homework assigned." />;
}

function NoticeList({ items }: { items: Announcement[] }) {
  return items.length ? <div className="space-y-2">{items.map(item => <div key={item.id} className="rounded-2xl border border-border/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{dateText(item.createdAt)}</p></div><Megaphone size={17} className="text-fuchsia-500" /></div><p className="mt-2 text-sm text-muted-foreground">{item.content || item.message || 'School announcement'}</p></div>)}</div> : <Empty text="No school notices published yet." />;
}

function ResultList({ items }: { items: Result[] }) {
  return items.length ? <div className="space-y-2">{items.map(item => <div key={item.id} className="rounded-2xl border border-border/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.subjectName}</p><p className="mt-1 text-xs text-muted-foreground">{item.examName}{item.examDate ? ` · ${dateText(item.examDate)}` : ''}</p></div><span className="text-sm font-black text-violet-600">{item.isAbsent ? 'Absent' : `${item.marksObtained}/${item.totalMarks}`}</span></div>{!item.isAbsent && <p className="mt-2 text-xs text-muted-foreground">Passing: {item.passingMarks}{item.grade ? ` · Grade ${item.grade}` : ''}</p>}{item.remarks && <p className="mt-1 text-xs text-muted-foreground">{item.remarks}</p>}</div>)}</div> : <Empty text="No published results yet." />;
}
