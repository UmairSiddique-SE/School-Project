import { useEffect, useState } from 'react';
import { Award, Bell, BookOpen, CalendarDays, CheckCircle2, GraduationCap, Loader2, Megaphone, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = { id: string; admissionNo: string; name: string; email?: string; rollNo?: string; sectionId?: string; section?: { name: string; class?: { name: string } } | null; status: string };
type Homework = { id: string; title: string; description?: string; dueDate?: string; subject?: { name: string } };
type Timetable = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; subject?: { name: string }; teacher?: { name: string } };
type Announcement = { id: string; title: string; content?: string; message?: string; createdAt: string };
type Attendance = { studentId: string; status: string; remarks?: string; name: string; rollNo?: string };
type Exam = { id: string; name?: string; title?: string; startDate?: string; date?: string };
type Result = { id: string; examName: string; examDate?: string; subjectName: string; marksObtained: number; totalMarks: number; passingMarks: number; isAbsent: boolean; grade?: string | null; remarks?: string | null };
type FeePayment = { id: string; receiptNo?: string; amount: number; discount?: number; fine?: number; totalPaid: number; status: string; dueDate?: string | null; paidDate?: string | null; feeStructure?: { name: string } | null };
type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string };

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

export default function StudentPortal() {
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiClient.get('/people/me');
        if (!mounted) return;
        setStudent(me.data);
        const sectionId = me.data?.sectionId;
        const requests = await Promise.allSettled([
          apiClient.get('/academics/homework'),
          apiClient.get('/academics/timetables'),
          apiClient.get('/academics/announcements'),
          apiClient.get('/exams'),
          apiClient.get('/exams/my-results'),
          apiClient.get('/finance/payments'),
          apiClient.get('/notifications'),
          sectionId ? apiClient.get(`/attendance?sectionId=${encodeURIComponent(sectionId)}&date=${new Date().toISOString().split('T')[0]}`) : Promise.resolve({ data: [] }),
        ]);
        if (!mounted) return;
        const [hw, tt, notices, examData, resultData, feeData, notifData, attendanceData] = requests;
        if (hw.status === 'fulfilled') setHomework(Array.isArray(hw.value.data) ? hw.value.data : []);
        if (tt.status === 'fulfilled') setTimetable(Array.isArray(tt.value.data) ? tt.value.data : []);
        if (notices.status === 'fulfilled') setAnnouncements(Array.isArray(notices.value.data) ? notices.value.data : []);
        if (examData.status === 'fulfilled') setExams(Array.isArray(examData.value.data) ? examData.value.data : []);
        if (resultData.status === 'fulfilled') setResults(Array.isArray(resultData.value.data) ? resultData.value.data : []);
        if (feeData.status === 'fulfilled') setFees(Array.isArray(feeData.value.data) ? feeData.value.data : []);
        if (notifData.status === 'fulfilled') setNotifications(Array.isArray(notifData.value.data) ? notifData.value.data : []);
        if (attendanceData.status === 'fulfilled') setAttendance(Array.isArray(attendanceData.value.data) ? attendanceData.value.data.filter((r: Attendance) => r.studentId === me.data?.id) : []);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Unable to load student profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const day = (n: number) => ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][n] || `Day ${n}`;
  const unread = notifications.filter(n => !n.isRead).length;
  const pendingFees = fees.reduce((sum, fee) => sum + Math.max(0, Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.fine || 0) - Number(fee.totalPaid || 0)), 0);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!student) return <div className="rounded-3xl border border-dashed p-10 text-center bg-card"><GraduationCap className="mx-auto mb-3 text-primary" /><h2 className="font-bold text-xl">Student profile not found</h2><p className="text-muted-foreground mt-2">Your school admin needs to link your login email with your student record.</p></div>;

  return <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-cyan-500/10 p-6 md:p-8 shadow-xl">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary"><GraduationCap size={30} /></div><div><p className="text-xs uppercase tracking-widest font-black text-primary mb-1">Student Portal</p><h1 className="text-3xl font-black">Welcome, {student.name}</h1><p className="text-muted-foreground mt-1">{student.section?.class?.name || 'Class'}{student.section?.name ? ` • Section ${student.section.name}` : ''} • Roll No: {student.rollNo || '—'}</p></div></div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400"><ShieldCheck size={16} /> Account Active</div>
      </div>
    </section>

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="rounded-2xl border bg-card p-5"><UserRound className="text-primary mb-3" size={20} /><p className="text-xs text-muted-foreground">Admission No</p><p className="font-black mt-1">{student.admissionNo}</p></div>
      <div className="rounded-2xl border bg-card p-5"><CheckCircle2 className="text-emerald-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Today Attendance</p><p className="font-black mt-1">{attendance[0]?.status || 'Not marked'}</p></div>
      <div className="rounded-2xl border bg-card p-5"><BookOpen className="text-sky-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Homework</p><p className="font-black mt-1">{homework.length} assigned</p></div>
      <div className="rounded-2xl border bg-card p-5"><Award className="text-violet-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Results</p><p className="font-black mt-1">{results.length} published</p></div>
      <div className="rounded-2xl border bg-card p-5"><WalletCards className="text-amber-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Pending Fees</p><p className="font-black mt-1">PKR {pendingFees.toLocaleString()}</p></div>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><CheckCircle2 size={18} className="text-emerald-400" /> Attendance</h2>{attendance.length ? attendance.map(a => <div key={a.studentId} className="flex items-center justify-between rounded-xl border p-4"><span className="text-sm text-muted-foreground">Today</span><span className={`px-3 py-1.5 rounded-lg border text-xs font-black ${statusClass[a.status] || 'bg-muted text-foreground'}`}>{a.status}</span></div>) : <p className="text-muted-foreground text-sm">No attendance record has been published for today.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Award size={18} className="text-violet-400" /> Examinations</h2>{exams.length ? <div className="space-y-3">{exams.slice(0, 6).map(e => <div key={e.id} className="rounded-xl border p-3"><p className="font-bold">{e.name || e.title || 'Examination'}</p><p className="text-xs text-muted-foreground mt-1">{e.startDate || e.date ? new Date(e.startDate || e.date!).toLocaleDateString() : 'Date to be announced'}</p></div>)}</div> : <p className="text-muted-foreground text-sm">No examinations published yet.</p>}</section>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Award size={18} className="text-violet-400" /> Published Results</h2>{results.length ? <div className="space-y-3">{results.slice(0, 10).map(r => <div key={r.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{r.subjectName}</p><p className="text-xs text-muted-foreground mt-1">{r.examName}{r.examDate ? ` • ${new Date(r.examDate).toLocaleDateString()}` : ''}</p></div><span className="font-black text-primary">{r.isAbsent ? 'Absent' : `${r.marksObtained}/${r.totalMarks}`}</span></div>{!r.isAbsent && <p className="text-xs text-muted-foreground mt-2">Passing: {r.passingMarks}{r.grade ? ` • Grade ${r.grade}` : ''}</p>}{r.remarks && <p className="text-xs text-muted-foreground mt-1">{r.remarks}</p>}</div>)}</div> : <p className="text-muted-foreground text-sm">No published results yet.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><WalletCards size={18} className="text-amber-400" /> Fee History</h2>{fees.length ? <div className="space-y-3">{fees.slice(0, 8).map(f => <div key={f.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{f.feeStructure?.name || 'Fee Payment'}</p><p className="text-xs text-muted-foreground mt-1">{f.receiptNo || 'Receipt pending'}{f.paidDate ? ` • ${new Date(f.paidDate).toLocaleDateString()}` : ''}</p></div><span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black ${feeStatusClass[f.status] || 'bg-muted'}`}>{f.status}</span></div><p className="text-sm mt-2">Paid <strong>PKR {Number(f.totalPaid || 0).toLocaleString()}</strong> of PKR {(Number(f.amount || 0) - Number(f.discount || 0) + Number(f.fine || 0)).toLocaleString()}</p></div>)}</div> : <p className="text-muted-foreground text-sm">No fee payments found.</p>}</section>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><BookOpen size={18} /> My Homework</h2>{homework.length ? <div className="space-y-3">{homework.slice(0, 8).map(h => <div key={h.id} className="rounded-xl border p-3"><div className="font-semibold">{h.title}</div><div className="text-xs text-muted-foreground mt-1">{h.subject?.name || 'Subject'}{h.dueDate ? ` • Due ${new Date(h.dueDate).toLocaleDateString()}` : ''}</div>{h.description && <p className="text-sm mt-1.5 text-muted-foreground">{h.description}</p>}</div>)}</div> : <p className="text-muted-foreground text-sm">No homework assigned.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><CalendarDays size={18} className="text-sky-400" /> My Timetable</h2>{timetable.length ? <div className="space-y-3">{timetable.slice(0, 8).map(t => <div key={t.id} className="rounded-xl border p-3"><div className="font-semibold">{day(t.dayOfWeek)} • {t.startTime}–{t.endTime}</div><div className="text-xs text-muted-foreground mt-1">{t.subject?.name || 'Subject'} • {t.teacher?.name || 'Teacher'}{t.room ? ` • Room ${t.room}` : ''}</div></div>)}</div> : <p className="text-muted-foreground text-sm">No timetable assigned.</p>}</section>
    </div>

    <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Bell size={18} className="text-amber-400" /> My Notifications</h2>{notifications.length ? <div className="space-y-3">{notifications.slice(0, 10).map(n => <div key={n.id} className={`rounded-xl border p-4 ${!n.isRead ? 'border-primary/25 bg-primary/5' : ''}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{n.title}</p><p className="text-sm text-muted-foreground mt-1">{n.message}</p></div>{!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}</div><p className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>)}</div> : <p className="text-muted-foreground text-sm">No notifications.</p>}</section>

    <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Megaphone size={18} className="text-cyan-400" /> School Notices</h2>{announcements.length ? <div className="grid md:grid-cols-2 gap-3">{announcements.slice(0, 8).map(n => <div key={n.id} className="rounded-xl border p-4"><div className="font-semibold">{n.title}</div><p className="text-sm mt-1.5 text-muted-foreground">{n.content || n.message}</p><div className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</div></div>)}</div> : <p className="text-muted-foreground text-sm">No new notices.</p>}</section>
  </div>;
}
