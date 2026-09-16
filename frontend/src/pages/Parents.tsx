import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Mail, Phone, Plus, RefreshCw, Search, UserRound, UsersRound, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Parent = { id: string; name: string; email?: string; phone?: string; relation?: string; students?: Array<{ student?: { id: string; name: string; admissionNo?: string; section?: { name?: string; class?: { name?: string } } } }> };
const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-violet-500';
const action = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent';

export default function Parents() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Parent | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', relation: 'FATHER', password: '', studentId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [parentRes, studentRes] = await Promise.all([apiClient.get('/people/parents'), apiClient.get('/people/students')]);
      setParents(Array.isArray(parentRes.data) ? parentRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load live parent data');
      setParents([]); setStudents([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return parents.filter((parent) => !value || `${parent.name} ${parent.email || ''} ${parent.phone || ''} ${parent.relation || ''}`.toLowerCase().includes(value));
  }, [parents, query]);
  const linkedChildren = parents.reduce((sum, parent) => sum + (parent.students?.length || 0), 0);
  const parentsWithChildren = parents.filter((parent) => (parent.students?.length || 0) > 0).length;

  const createParent = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/parents', { ...form, password: form.password || `${form.name.replace(/\s+/g, '').slice(0, 5)}${Math.random().toString(36).slice(2, 8)}!9a` });
      toast.success('Parent account created and synced to the database');
      setForm({ name: '', email: '', phone: '', relation: 'FATHER', password: '', studentId: '' });
      setShowAdd(false);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create parent');
    } finally { setSaving(false); }
  };

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">People Management</p><h1 className="mt-1 text-3xl font-black">Parents</h1><p className="mt-1 text-sm text-muted-foreground">Live parent accounts and linked student relationships.</p></div><div className="flex gap-2"><button className={action} onClick={() => void load()}><RefreshCw size={15} /> Refresh</button><button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Parent</button></div></div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3"><Stat label="Total Parents" value={parents.length} /><Stat label="With Children" value={parentsWithChildren} /><Stat label="Linked Students" value={linkedChildren} /><Stat label="Unlinked" value={parents.length - parentsWithChildren} /></div>
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${input} pl-9`} placeholder="Search parent name, email, phone or relation…" /></div></div>
    {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-violet-500" /></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((parent) => <button key={parent.id} onClick={() => setSelected(parent)} className="text-left rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500/30"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><UserRound size={22} /></div><div className="min-w-0"><p className="font-black truncate">{parent.name}</p><p className="text-[11px] text-muted-foreground">{parent.relation || 'Parent'}</p></div><Eye size={16} className="ml-auto text-muted-foreground" /></div><div className="mt-4 space-y-2 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Mail size={13} /><span className="truncate">{parent.email || 'No email'}</span></div><div className="flex items-center gap-2"><Phone size={13} /><span>{parent.phone || 'No phone'}</span></div></div><div className="mt-4 border-t border-border pt-4"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Linked students ({parent.students?.length || 0})</p>{parent.students?.slice(0, 2).map(({ student }) => student && <div key={student.id} className="mt-2 rounded-xl bg-muted/40 px-3 py-2"><p className="text-xs font-bold">{student.name}</p><p className="text-[10px] text-muted-foreground">{student.admissionNo || 'No admission no.'} {student.section?.name ? `• ${student.section.name}` : ''}</p></div>)}{!parent.students?.length && <p className="mt-2 text-xs text-muted-foreground">No linked student.</p>}</div></button>)}{filtered.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No parent records found in the live database.</div>}</div>}

    {showAdd && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><form onSubmit={createParent} className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between border-b border-border pb-4"><div><h2 className="text-xl font-black">Add Parent</h2><p className="text-xs text-muted-foreground mt-1">Creates the parent login and optional student link.</p></div><button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2 py-5"><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Name *</span><input required className={`${input} mt-1.5`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Relation</span><select className={`${input} mt-1.5`} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}><option>FATHER</option><option>MOTHER</option><option>GUARDIAN</option></select></label><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Email</span><input type="email" className={`${input} mt-1.5`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Phone</span><input className={`${input} mt-1.5`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Password (12+)</span><input type="password" minLength={12} className={`${input} mt-1.5`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to generate" /></label><label><span className="text-[10px] font-bold uppercase text-muted-foreground">Link Student</span><select className={`${input} mt-1.5`} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}><option value="">No student yet</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} {student.admissionNo ? `• ${student.admissionNo}` : ''}</option>)}</select></label></div><div className="flex justify-end gap-2"><button type="button" className={action} onClick={() => setShowAdd(false)}>Cancel</button><button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Creating…' : 'Create Parent'}</button></div></form></div>}

    {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-xl font-black">{selected.name}</h2><p className="text-xs text-muted-foreground">{selected.relation || 'Parent'} • {selected.email || 'No email'}</p></div><button onClick={() => setSelected(null)}><X size={18} /></button></div><div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-3"><Info label="Phone" value={selected.phone || '—'} /><Info label="Children" value={String(selected.students?.length || 0)} /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Linked Students</p>{selected.students?.length ? selected.students.map(({ student }) => student && <div key={student.id} className="mt-2 rounded-xl bg-muted/40 p-3"><p className="font-bold text-sm">{student.name}</p><p className="text-xs text-muted-foreground">{student.admissionNo || '—'} • {student.section?.class?.name || 'Class not assigned'} / {student.section?.name || 'Section not assigned'}</p></div>) : <div className="mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No linked students.</div>}</div></div></div></div>}
  </div>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/30 p-3"><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
