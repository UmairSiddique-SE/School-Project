import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Layers3, BookOpen, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity: number; teacher?: Teacher | null };
type Subject = { id: string; name: string; code?: string | null };
type ClassItem = { id: string; name: string; numeric?: number | null; sections?: Section[]; subjects?: any[] };

export default function ClassesLive() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [sectionClassId, setSectionClassId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, t] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      setClasses(Array.isArray(c.data) ? c.data : []);
      setSubjects(Array.isArray(s.data) ? s.data : []);
      setTeachers(Array.isArray(t.data) ? t.data : []);
      setSectionClassId(prev => prev || c.data?.[0]?.id || '');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to load academic data');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const selectedClass = useMemo(() => classes.find(c => c.id === sectionClassId), [classes, sectionClassId]);

  const createClass = async () => {
    if (!className.trim()) return toast.error('Class name is required');
    setBusy(true);
    try { await apiClient.post('/classes', { name: className.trim() }); setClassName(''); toast.success('Class created'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create class'); }
    finally { setBusy(false); }
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Delete this class? Existing records are retained but the class is archived.')) return;
    try { await apiClient.delete(`/classes/${id}`); toast.success('Class archived'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete class'); }
  };

  const createSection = async () => {
    if (!sectionClassId || !sectionName.trim()) return toast.error('Select a class and enter section name');
    setBusy(true);
    try { await apiClient.post('/classes/sections', { classId: sectionClassId, name: sectionName.trim(), capacity: Number(capacity) || 40 }); setSectionName(''); toast.success('Section created'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create section'); }
    finally { setBusy(false); }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Archive this section?')) return;
    try { await apiClient.delete(`/classes/sections/${id}`); toast.success('Section archived'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete section'); }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) return toast.error('Subject name is required');
    setBusy(true);
    try { await apiClient.post('/classes/subjects', { name: subjectName.trim(), code: subjectCode.trim() || undefined }); setSubjectName(''); setSubjectCode(''); toast.success('Subject created'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create subject'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6 pb-10">
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="text-3xl font-black">Classes & Sections</h1><p className="text-sm text-muted-foreground">Live academic structure for this school. No demo records.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-accent"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh</button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl border bg-card p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><Layers3 size={18}/> Add Class</div><input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Class 10" className="w-full rounded-xl border bg-background px-3 py-2"/><button disabled={busy} onClick={() => void createClass()} className="w-full rounded-xl bg-primary text-primary-foreground py-2 font-bold"><Plus size={16} className="inline mr-1"/>Create Class</button></div>
      <div className="rounded-2xl border bg-card p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><Users size={18}/> Add Section</div><select value={sectionClassId} onChange={e => setSectionClassId(e.target.value)} className="w-full rounded-xl border bg-background px-3 py-2"><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="Section A" className="w-full rounded-xl border bg-background px-3 py-2"/><input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Capacity" className="w-full rounded-xl border bg-background px-3 py-2"/><button disabled={busy} onClick={() => void createSection()} className="w-full rounded-xl bg-primary text-primary-foreground py-2 font-bold"><Plus size={16} className="inline mr-1"/>Create Section</button></div>
      <div className="rounded-2xl border bg-card p-5 space-y-3"><div className="flex items-center gap-2 font-bold"><BookOpen size={18}/> Add Subject</div><input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Mathematics" className="w-full rounded-xl border bg-background px-3 py-2"/><input value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="MATH-01 (optional)" className="w-full rounded-xl border bg-background px-3 py-2"/><button disabled={busy} onClick={() => void createSubject()} className="w-full rounded-xl bg-primary text-primary-foreground py-2 font-bold"><Plus size={16} className="inline mr-1"/>Create Subject</button></div>
    </div>

    <div className="rounded-2xl border bg-card overflow-hidden"><div className="p-5 border-b font-bold">Classes ({classes.length})</div>{classes.length === 0 && !loading ? <div className="p-10 text-center text-muted-foreground">No classes yet. Create the first class above.</div> : <div className="divide-y">{classes.map(c => <div key={c.id} className="p-5"><div className="flex items-center justify-between gap-3"><div><div className="font-black text-lg">{c.name}</div><div className="text-xs text-muted-foreground">{c.sections?.length || 0} sections</div></div><button onClick={() => void deleteClass(c.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={16}/></button></div><div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{(c.sections || []).map(s => <div key={s.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><span className="font-bold">{s.name}</span><button onClick={() => void deleteSection(s.id)} className="text-red-500"><X size={14}/></button></div><div className="text-xs text-muted-foreground mt-1">Capacity {s.capacity}{s.teacher ? ` • ${s.teacher.name}` : ' • No teacher assigned'}</div></div>)}{(c.sections || []).length === 0 && <div className="text-xs text-muted-foreground">No sections yet.</div>}</div></div>)}</div>}</div>

    <div className="rounded-2xl border bg-card p-5"><div className="font-bold mb-3">Subjects ({subjects.length})</div><div className="flex flex-wrap gap-2">{subjects.map(s => <span key={s.id} className="rounded-full border px-3 py-1.5 text-sm">{s.name}{s.code ? ` • ${s.code}` : ''}</span>)}{subjects.length === 0 && <span className="text-sm text-muted-foreground">No subjects yet.</span>}</div></div>
    {selectedClass && <div className="text-xs text-muted-foreground">Managing: {selectedClass.name}</div>}
    {teachers.length === 0 && <div className="text-xs text-muted-foreground">No teachers exist yet. Add teachers from Staff before assigning class teachers.</div>}
  </div>;
}
