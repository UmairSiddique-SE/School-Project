import React, { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Section = { id: string; name: string; class?: { id: string; name: string } };
type Subject = { id: string; name: string; code?: string | null };
type Teacher = { id: string; name: string };
type Slot = { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string | null; section?: Section; subject?: Subject; teacher?: Teacher | null };
type ClassItem = { id: string; name: string; sections?: Section[] };

export default function Timetable() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: '1', startTime: '08:00', endTime: '08:45', room: '', sectionId: '', subjectId: '', teacherId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [t, c, s, staff] = await Promise.all([
        apiClient.get('/academics/timetables'),
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      setSlots(Array.isArray(t.data) ? t.data : []);
      const sec: Section[] = [];
      (Array.isArray(c.data) ? c.data : []).forEach((x: ClassItem) => {
        (x.sections || []).forEach((z: Section) => sec.push({ ...z, class: { id: x.id, name: x.name } }));
      });
      setSections(sec);
      setSubjects(Array.isArray(s.data) ? s.data : []);
      setTeachers(Array.isArray(staff.data) ? staff.data.map((x: any) => ({ id: x.id, name: x.name })) : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sectionId || !form.subjectId) return toast.error('Select section and subject');
    setSaving(true);
    try {
      await apiClient.post('/academics/timetables', { ...form, dayOfWeek: Number(form.dayOfWeek), teacherId: form.teacherId || undefined });
      toast.success('Timetable slot created');
      setForm({ ...form, room: '' });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not create timetable slot');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await apiClient.delete(`/academics/timetables/${id}`);
      toast.success('Timetable slot deleted');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not delete timetable slot');
    }
  };

  const day = (n: number) => ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][n] || `Day ${n}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Timetable</h1><p className="text-sm text-muted-foreground">Live timetable records for the current school.</p></div>
        <button onClick={() => void load()} className="px-4 py-2 rounded-lg border flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
      </div>
      {canManage && (
        <form onSubmit={create} className="rounded-xl border p-5 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select className="rounded-lg border p-3 bg-background" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{day(n)}</option>)}</select>
          <input type="time" required className="rounded-lg border p-3 bg-background" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <input type="time" required className="rounded-lg border p-3 bg-background" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          <select required className="rounded-lg border p-3 bg-background" value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })}><option value="">Section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} / {s.name}</option>)}</select>
          <select required className="rounded-lg border p-3 bg-background" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}><option value="">Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className="rounded-lg border p-3 bg-background" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}><option value="">Teacher (optional)</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <input className="rounded-lg border p-3 bg-background" placeholder="Room (optional)" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
          <button disabled={saving} className="md:col-span-2 lg:col-span-5 rounded-lg bg-primary text-primary-foreground py-3"><Plus size={16} className="inline mr-1" />{saving ? 'Saving...' : 'Add Slot'}</button>
        </form>
      )}
      {loading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin" /></div> : slots.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No timetable slots have been created.</div> : <div className="rounded-xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Day</th><th className="p-3">Time</th><th className="p-3">Class / Section</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Room</th>{canManage && <th className="p-3">Action</th>}</tr></thead><tbody>{slots.map(s => <tr key={s.id} className="border-b last:border-0"><td className="p-3">{day(s.dayOfWeek)}</td><td className="p-3">{s.startTime}–{s.endTime}</td><td className="p-3">{s.section?.class?.name || '—'} / {s.section?.name || '—'}</td><td className="p-3">{s.subject?.name || '—'}</td><td className="p-3">{s.teacher?.name || '—'}</td><td className="p-3">{s.room || '—'}</td>{canManage && <td className="p-3"><button onClick={() => void remove(s.id)} className="text-destructive"><Trash2 size={16} /></button></td>}</tr>)}</tbody></table></div>}
    </div>
  );
}
