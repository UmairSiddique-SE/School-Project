import React, { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Section = { id: string; name: string; class?: { id: string; name: string } };
type Subject = { id: string; name: string; code?: string | null };
type Teacher = { id: string; name: string };
type HomeworkItem = { id: string; title: string; description?: string | null; dueDate: string; section?: Section; subject?: Subject; teacher?: Teacher | null };

type ClassItem = { id: string; name: string; sections?: Section[] };

export default function Homework() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', sectionId: '', subjectId: '', teacherId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [h, c, s, t] = await Promise.all([
        apiClient.get('/academics/homework'),
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      setItems(Array.isArray(h.data) ? h.data : []);
      const sec: Section[] = [];
      (Array.isArray(c.data) ? c.data : []).forEach((x: ClassItem) => {
        (x.sections || []).forEach((z: Section) => sec.push({ ...z, class: { id: x.id, name: x.name } }));
      });
      setSections(sec);
      setSubjects(Array.isArray(s.data) ? s.data : []);
      setTeachers(Array.isArray(t.data) ? t.data.map((x: any) => ({ id: x.id, name: x.name })) : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sectionId || !form.subjectId || !form.dueDate) return toast.error('Section, subject and due date are required');
    setSaving(true);
    try {
      await apiClient.post('/academics/homework', { ...form, teacherId: form.teacherId || undefined });
      toast.success('Homework created');
      setForm({ title: '', description: '', dueDate: '', sectionId: '', subjectId: '', teacherId: '' });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not create homework');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this homework?')) return;
    try {
      await apiClient.delete(`/academics/homework/${id}`);
      toast.success('Homework deleted');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not delete homework');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Homework</h1><p className="text-sm text-muted-foreground">Live homework assignments for this school.</p></div>
        <button onClick={() => void load()} className="px-4 py-2 rounded-lg border flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
      </div>
      {canManage && (
        <form onSubmit={create} className="rounded-xl border p-5 grid md:grid-cols-2 gap-3">
          <input required className="rounded-lg border p-3 bg-background" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input type="date" required className="rounded-lg border p-3 bg-background" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <select required className="rounded-lg border p-3 bg-background" value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })}><option value="">Select section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} / {s.name}</option>)}</select>
          <select required className="rounded-lg border p-3 bg-background" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className="rounded-lg border p-3 bg-background" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}><option value="">Teacher (optional)</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <textarea required className="rounded-lg border p-3 bg-background" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button disabled={saving} className="md:col-span-2 rounded-lg bg-primary text-primary-foreground py-3"><Plus size={16} className="inline mr-1" />{saving ? 'Saving...' : 'Create Homework'}</button>
        </form>
      )}
      {loading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin" /></div> : items.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No homework assignments found.</div> : <div className="rounded-xl border divide-y">{items.map(x => <div key={x.id} className="p-5 flex justify-between gap-4"><div><div className="font-semibold">{x.title}</div><p className="text-sm text-muted-foreground mt-1">{x.description || ''}</p><div className="text-xs text-muted-foreground mt-2">{x.section?.class?.name || '—'} / {x.section?.name || '—'} · {x.subject?.name || '—'} · Due {new Date(x.dueDate).toLocaleDateString()}</div></div>{canManage && <button onClick={() => void remove(x.id)} className="text-destructive"><Trash2 size={16} /></button>}</div>)}</div>}
    </div>
  );
}
