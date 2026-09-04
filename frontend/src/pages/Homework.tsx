import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, Clock, RefreshCw, Search, Trash2, Plus, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Homework = { id: string; title: string; description?: string | null; dueDate: string; attachmentUrl?: string | null; section?: { id: string; name: string; class?: { id: string; name: string } } | null; subject?: { id: string; name: string } | null; teacher?: { id: string; name: string } | null };

export default function Homework() {
  const { user } = useAuth();
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', sectionId: '', subjectId: '', attachmentUrl: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/academics/homework');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load homework');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.schoolId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(h => [h.title, h.description, h.subject?.name, h.section?.name, h.section?.class?.name, h.teacher?.name].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [items, search]);

  const createHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate || !form.sectionId.trim() || !form.subjectId.trim()) {
      toast.error('Title, due date, section ID and subject ID are required'); return;
    }
    setSaving(true);
    try {
      await apiClient.post('/academics/homework', { title: form.title.trim(), description: form.description.trim() || undefined, dueDate: form.dueDate, sectionId: form.sectionId.trim(), subjectId: form.subjectId.trim(), attachmentUrl: form.attachmentUrl.trim() || undefined });
      toast.success('Homework created successfully');
      setForm({ title: '', description: '', dueDate: '', sectionId: '', subjectId: '', attachmentUrl: '' });
      setShowCreate(false); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to create homework'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this homework?')) return;
    try { await apiClient.delete(`/academics/homework/${id}`); setItems(prev => prev.filter(h => h.id !== id)); toast.success('Homework deleted'); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to delete homework'); }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-black">Homework</h1><p className="text-sm text-muted-foreground mt-1">Live school homework. Records are loaded from the secure backend.</p></div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="px-4 py-2.5 rounded-xl border bg-background flex items-center gap-2 font-semibold text-sm"><RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Refresh</button>
          {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER') && <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground flex items-center gap-2 font-bold text-sm"><Plus size={16} /> Assign Homework</button>}
        </div>
      </div>

      <div className="relative max-w-xl"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search homework, subject, class or teacher..." className="w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground"><BookOpen className="mx-auto mb-3 opacity-50" size={40} /><p className="font-semibold">No homework found</p><p className="text-sm mt-1">Published homework will appear here automatically.</p></div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{filtered.map(h => <div key={h.id} className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-lg">{h.title}</h2><p className="text-sm text-muted-foreground mt-1">{h.subject?.name || 'Subject'} • {h.section?.class?.name || 'Class'}{h.section?.name ? ` • ${h.section.name}` : ''}</p></div>{(user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER') && <button onClick={() => remove(h.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 size={16} /></button>}</div>{h.description && <p className="text-sm mt-4 leading-6 text-muted-foreground">{h.description}</p>}<div className="flex flex-wrap gap-3 mt-5 text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Calendar size={14} /> Due {new Date(h.dueDate).toLocaleDateString()}</span>{h.teacher?.name && <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {h.teacher.name}</span>}</div>{h.attachmentUrl && <a href={h.attachmentUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm font-semibold text-primary hover:underline">Open attachment →</a>}</div>)}</div>}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}><ModalHeader title="Assign Homework" onClose={() => setShowCreate(false)} /><form onSubmit={createHomework} className="space-y-4 p-1"><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Homework title" className="w-full rounded-xl border bg-background px-4 py-3" /><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description / instructions" rows={4} className="w-full rounded-xl border bg-background px-4 py-3" /><input required type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-xl border bg-background px-4 py-3" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input required value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} placeholder="Section ID" className="rounded-xl border bg-background px-4 py-3" /><input required value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} placeholder="Subject ID" className="rounded-xl border bg-background px-4 py-3" /></div><input value={form.attachmentUrl} onChange={e => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="Attachment URL (optional)" className="w-full rounded-xl border bg-background px-4 py-3" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border">Cancel</button><button disabled={saving} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold">{saving ? 'Saving...' : 'Create Homework'}</button></div></form></Modal>
    </div>
  );
}
