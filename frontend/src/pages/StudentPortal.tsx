import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, GraduationCap, Loader2, Megaphone } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = { id: string; admissionNo: string; name: string; email?: string; rollNo?: string; section?: { name: string; class?: { name: string } } | null; status: string };
type Homework = { id: string; title: string; description?: string; dueDate?: string; subject?: { name: string } };
type Timetable = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; subject?: { name: string }; teacher?: { name: string } };
type Announcement = { id: string; title: string; message: string; createdAt: string };

export default function StudentPortal() {
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try {
    const [me, hw, tt, notices] = await Promise.all([apiClient.get('/people/me'), apiClient.get('/academics/homework'), apiClient.get('/academics/timetables'), apiClient.get('/academics/announcements')]);
    setStudent(me.data); setHomework(Array.isArray(hw.data) ? hw.data : []); setTimetable(Array.isArray(tt.data) ? tt.data : []); setAnnouncements(Array.isArray(notices.data) ? notices.data : []);
  } catch (e: any) { toast.error(e?.response?.data?.message || 'Unable to load student portal'); } finally { setLoading(false); } })(); }, []);
  const day = (n: number) => ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][n] || `Day ${n}`;
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!student) return <div className="rounded-2xl border border-dashed p-10 text-center"><GraduationCap className="mx-auto mb-3" /><h2 className="font-bold text-xl">Student profile not found</h2><p className="text-muted-foreground mt-2">Your school admin needs to link your login email with your student record.</p></div>;
  return <div className="space-y-6">
    <div className="rounded-2xl border p-6 bg-card"><div className="flex items-center gap-4"><div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap /></div><div><h1 className="text-2xl font-bold">Welcome, {student.name}</h1><p className="text-muted-foreground">{student.section?.class?.name || 'Class'} {student.section?.name ? `• Section ${student.section.name}` : ''} • Roll No: {student.rollNo || '—'}</p></div></div></div>
    <div className="grid md:grid-cols-3 gap-4"><div className="rounded-xl border p-5"><CheckCircle2 className="mb-3" /><p className="text-sm text-muted-foreground">Admission No</p><p className="font-bold">{student.admissionNo}</p></div><div className="rounded-xl border p-5"><BookOpen className="mb-3" /><p className="text-sm text-muted-foreground">Homework</p><p className="font-bold">{homework.length} assigned</p></div><div className="rounded-xl border p-5"><CalendarDays className="mb-3" /><p className="text-sm text-muted-foreground">Timetable</p><p className="font-bold">{timetable.length} periods</p></div></div>
    <div className="grid lg:grid-cols-2 gap-6"><section className="rounded-xl border p-5"><h2 className="font-bold text-lg mb-4 flex gap-2 items-center"><BookOpen size={18} /> My Homework</h2>{homework.length ? <div className="space-y-3">{homework.slice(0, 10).map(h => <div key={h.id} className="rounded-lg border p-3"><div className="font-semibold">{h.title}</div><div className="text-sm text-muted-foreground">{h.subject?.name || 'Subject'}{h.dueDate ? ` • Due ${new Date(h.dueDate).toLocaleDateString()}` : ''}</div>{h.description && <p className="text-sm mt-1">{h.description}</p>}</div>)}</div> : <p className="text-muted-foreground">No homework assigned.</p>}</section>
    <section className="rounded-xl border p-5"><h2 className="font-bold text-lg mb-4 flex gap-2 items-center"><CalendarDays size={18} /> My Timetable</h2>{timetable.length ? <div className="space-y-3">{timetable.slice(0, 12).map(t => <div key={t.id} className="rounded-lg border p-3"><div className="font-semibold">{day(t.dayOfWeek)} • {t.startTime}–{t.endTime}</div><div className="text-sm text-muted-foreground">{t.subject?.name || 'Subject'} • {t.teacher?.name || 'Teacher'}{t.room ? ` • Room ${t.room}` : ''}</div></div>)}</div> : <p className="text-muted-foreground">No timetable assigned.</p>}</section></div>
    <section className="rounded-xl border p-5"><h2 className="font-bold text-lg mb-4 flex gap-2 items-center"><Megaphone size={18} /> School Notices</h2>{announcements.length ? <div className="space-y-3">{announcements.slice(0, 10).map(n => <div key={n.id} className="rounded-lg border p-3"><div className="font-semibold">{n.title}</div><p className="text-sm mt-1">{n.message}</p><div className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</div></div>)}</div> : <p className="text-muted-foreground">No new notices.</p>}</section>
  </div>;
}
