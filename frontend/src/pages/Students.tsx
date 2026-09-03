import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Student = {
  id: string; admissionNo: string; rollNo?: string | null; name: string; gender?: string | null;
  dateOfBirth?: string | null; bFormNumber?: string | null; phone?: string | null; email?: string | null;
  status?: string; session?: string | null; section?: { id: string; name: string; class?: { name: string } } | null;
};
type Section = { id: string; name: string; class?: { id: string; name: string } };

type Form = {
  name: string; gender: string; dateOfBirth: string; bFormNumber: string; phone: string; email: string;
  sectionId: string; session: string; status: string; password: string;
};
const emptyForm: Form = { name: '', gender: 'MALE', dateOfBirth: '', bFormNumber: '', phone: '', email: '', sectionId: '', session: '', status: 'ACTIVE', password: '' };

export default function Students() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [studentRes, classRes] = await Promise.all([apiClient.get('/people/students'), apiClient.get('/classes')]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      const allSections: Section[] = [];
      (Array.isArray(classRes.data) ? classRes.data : []).forEach((c: any) => (c.sections || []).forEach((s: any) => allSections.push({ ...s, class: { id: c.id, name: c.name } })));
      setSections(allSections);
    } catch (e: any) {
      setStudents([]); setSections([]); setError(e?.response?.data?.message || 'Unable to load students.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => [s.name, s.admissionNo, s.rollNo, s.phone, s.email, s.section?.name, s.section?.class?.name].some(v => String(v || '').toLowerCase().includes(q)));
  }, [students, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s); setForm({ name: s.name, gender: s.gender || 'MALE', dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '', bFormNumber: s.bFormNumber || '', phone: s.phone || '', email: s.email || '', sectionId: s.section?.id || '', session: s.session || '', status: s.status || 'ACTIVE', password: '' }); setOpen(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Student name is required');
    if (!editing && form.password.length < 12) return toast.error('Student password must be at least 12 characters');
    setSaving(true);
    const payload: any = { name: form.name.trim(), gender: form.gender, dateOfBirth: form.dateOfBirth || undefined, bFormNumber: form.bFormNumber || undefined, phone: form.phone || undefined, email: form.email || undefined, sectionId: form.sectionId || undefined, session: form.session || undefined, status: form.status };
    if (!editing) payload.password = form.password;
    try {
      if (editing) await apiClient.patch(`/people/students/${editing.id}`, payload); else await apiClient.post('/people/students', payload);
      toast.success(editing ? 'Student updated' : 'Student added'); setOpen(false); await load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save student'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Delete this student?')) return;
    try { await apiClient.delete(`/people/students/${id}`); toast.success('Student deleted'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete student'); }
  };
  const set = (key: keyof Form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h1 className="text-2xl font-bold">Students</h1><p className="text-sm text-muted-foreground">Live student records for your school.</p></div>{canManage && <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 w-fit"><Plus size={17}/> Add Student</button>}</div>
    <div className="rounded-xl border p-4 flex items-center gap-3"><Search size={18} className="text-muted-foreground"/><input className="flex-1 bg-transparent outline-none" placeholder="Search by name, admission no, roll no, class..." value={search} onChange={e => setSearch(e.target.value)}/><span className="text-sm text-muted-foreground">{filtered.length} records</span></div>
    {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div> : error ? <div className="rounded-xl border p-6 text-destructive">{error}<button className="underline ml-2" onClick={load}>Retry</button></div> : filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground"><Users className="mx-auto mb-2"/>No students found.</div> : <div className="rounded-xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Admission</th><th className="p-3">Name</th><th className="p-3">Class / Section</th><th className="p-3">Roll</th><th className="p-3">Gender</th><th className="p-3">Status</th>{canManage && <th className="p-3">Actions</th>}</tr></thead><tbody>{filtered.map(s => <tr key={s.id} className="border-b last:border-0"><td className="p-3 font-medium">{s.admissionNo}</td><td className="p-3">{s.name}</td><td className="p-3">{s.section?.class?.name || '—'}{s.section?.name ? ` / ${s.section.name}` : ''}</td><td className="p-3">{s.rollNo || '—'}</td><td className="p-3">{s.gender || '—'}</td><td className="p-3">{s.status || 'ACTIVE'}</td>{canManage && <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(s)} className="p-2 rounded hover:bg-muted"><Edit2 size={15}/></button><button onClick={() => remove(s.id)} className="p-2 rounded text-destructive hover:bg-destructive/10"><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table></div>}

    <Modal open={open} onClose={() => setOpen(false)}><ModalHeader title={editing ? 'Edit Student' : 'Add Student'} onClose={() => setOpen(false)}/><form onSubmit={save} className="p-5 grid sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto"><label className="sm:col-span-2 text-sm">Name<input required className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.name} onChange={e => set('name', e.target.value)}/></label><label className="text-sm">Gender<select className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.gender} onChange={e => set('gender', e.target.value)}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></label><label className="text-sm">Date of birth<input type="date" className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}/></label><label className="text-sm">B-Form number<input className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.bFormNumber} onChange={e => set('bFormNumber', e.target.value)}/></label><label className="text-sm">Phone<input className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.phone} onChange={e => set('phone', e.target.value)}/></label><label className="text-sm">Email<input type="email" className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.email} onChange={e => set('email', e.target.value)}/></label><label className="text-sm">Session<input placeholder="2026-2027" className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.session} onChange={e => set('session', e.target.value)}/></label><label className="text-sm sm:col-span-2">Class / Section<select className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.sectionId} onChange={e => set('sectionId', e.target.value)}><option value="">Not assigned</option>{sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} / {s.name}</option>)}</select></label><label className="text-sm">Status<select className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.status} onChange={e => set('status', e.target.value)}><option>ACTIVE</option><option>INACTIVE</option><option>GRADUATED</option><option>LEFT</option></select></label>{!editing && <label className="text-sm sm:col-span-2">Student login password (minimum 12 characters)<input required type="password" minLength={12} className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.password} onChange={e => set('password', e.target.value)}/></label>}<div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button><button disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">{saving ? 'Saving...' : editing ? 'Update Student' : 'Create Student'}</button></div></form></Modal>
  </div>;
}
