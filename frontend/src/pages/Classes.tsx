import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Loader2, Plus, Trash2, Users } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Section = { id: string; name: string; capacity: number; teacher?: { id: string; name: string } | null };
type ClassItem = { id: string; name: string; numeric?: number | null; sections: Section[] };
type Subject = { id: string; name: string; code?: string | null; description?: string | null };

export default function Classes() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showClass, setShowClass] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const [showSubject, setShowSubject] = useState(false);
  const [className, setClassName] = useState('');
  const [sectionClassId, setSectionClassId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [classRes, subjectRes] = await Promise.all([apiClient.get('/classes'), apiClient.get('/classes/subjects')]);
      const data = Array.isArray(classRes.data) ? classRes.data : [];
      setClasses(data); setSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : []);
      setExpanded(new Set(data.map((c: ClassItem) => c.id)));
    } catch (e: any) {
      setClasses([]); setSubjects([]); setError(e?.response?.data?.message || 'Unable to load academic structure.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalSections = useMemo(() => classes.reduce((n, c) => n + (c.sections?.length || 0), 0), [classes]);
  const toggle = (id: string) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault(); if (!className.trim()) return; setSaving(true);
    try { await apiClient.post('/classes', { name: className.trim() }); toast.success('Class created'); setClassName(''); setShowClass(false); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create class'); }
    finally { setSaving(false); }
  };
  const deleteClass = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    try { await apiClient.delete(`/classes/${id}`); toast.success('Class deleted'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete class'); }
  };
  const createSection = async (e: React.FormEvent) => {
    e.preventDefault(); if (!sectionClassId || !sectionName.trim()) return; setSaving(true);
    try { await apiClient.post('/classes/sections', { classId: sectionClassId, name: sectionName.trim(), capacity: Number(capacity) || 40 }); toast.success('Section created'); setSectionName(''); setSectionClassId(''); setShowSection(false); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create section'); }
    finally { setSaving(false); }
  };
  const deleteSection = async (id: string) => {
    if (!window.confirm('Delete this section?')) return;
    try { await apiClient.delete(`/classes/sections/${id}`); toast.success('Section deleted'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete section'); }
  };
  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subjectName.trim()) return; setSaving(true);
    try { await apiClient.post('/classes/subjects', { name: subjectName.trim(), code: subjectCode.trim() || undefined }); toast.success('Subject created'); setSubjectName(''); setSubjectCode(''); setShowSubject(false); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create subject'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Classes & Sections</h1><p className="text-sm text-muted-foreground">Live academic structure for the current school.</p></div>
      {canManage && <div className="flex gap-2 flex-wrap"><button onClick={() => setShowClass(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2"><Plus size={16}/> Class</button><button onClick={() => setShowSection(true)} className="px-4 py-2 rounded-lg border flex items-center gap-2"><Plus size={16}/> Section</button><button onClick={() => setShowSubject(true)} className="px-4 py-2 rounded-lg border flex items-center gap-2"><Plus size={16}/> Subject</button></div>}
    </div>
    <div className="grid grid-cols-3 gap-4"><div className="rounded-xl border p-4"><b className="text-2xl">{classes.length}</b><div className="text-sm text-muted-foreground">Classes</div></div><div className="rounded-xl border p-4"><b className="text-2xl">{totalSections}</b><div className="text-sm text-muted-foreground">Sections</div></div><div className="rounded-xl border p-4"><b className="text-2xl">{subjects.length}</b><div className="text-sm text-muted-foreground">Subjects</div></div></div>
    {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div> : error ? <div className="rounded-xl border p-6 text-destructive">{error}<button className="underline ml-2" onClick={load}>Retry</button></div> : classes.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No classes have been created yet.</div> : <div className="space-y-3">{classes.map(cls => <div key={cls.id} className="rounded-xl border overflow-hidden"><div className="p-4 flex items-center gap-3"><button onClick={() => toggle(cls.id)}>{expanded.has(cls.id) ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</button><div className="flex-1"><div className="font-semibold">{cls.name}</div><div className="text-xs text-muted-foreground">{cls.sections?.length || 0} sections</div></div>{canManage && <button onClick={() => deleteClass(cls.id)} className="text-destructive p-2"><Trash2 size={16}/></button>}</div>{expanded.has(cls.id) && <div className="border-t divide-y">{(cls.sections || []).map(sec => <div key={sec.id} className="p-4 flex items-center justify-between"><div className="flex gap-3 items-center"><Users size={18}/><div><div className="font-medium">{sec.name}</div><div className="text-xs text-muted-foreground">Capacity {sec.capacity} · {sec.teacher?.name || 'Teacher not assigned'}</div></div></div>{canManage && <button onClick={() => deleteSection(sec.id)} className="text-destructive p-2"><Trash2 size={16}/></button>}</div>)}</div>}</div>)}</div>}
    <div className="rounded-xl border p-5"><div className="flex items-center gap-2 mb-4"><BookOpen size={18}/><h2 className="font-semibold">Subjects</h2></div>{subjects.length === 0 ? <p className="text-sm text-muted-foreground">No subjects have been created yet.</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{subjects.map(s => <div key={s.id} className="rounded-lg border p-3"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.code || 'No code'}</div></div>)}</div>}</div>
    <Modal open={showClass} onClose={() => setShowClass(false)}><ModalHeader title="Create Class" onClose={() => setShowClass(false)}/><form onSubmit={createClass} className="p-5 space-y-4"><input className="w-full rounded-lg border p-3 bg-background" placeholder="Class name" value={className} onChange={e => setClassName(e.target.value)}/><button disabled={saving} className="w-full rounded-lg bg-primary py-3 text-primary-foreground">{saving ? 'Saving...' : 'Create Class'}</button></form></Modal>
    <Modal open={showSection} onClose={() => setShowSection(false)}><ModalHeader title="Create Section" onClose={() => setShowSection(false)}/><form onSubmit={createSection} className="p-5 space-y-4"><select className="w-full rounded-lg border p-3 bg-background" value={sectionClassId} onChange={e => setSectionClassId(e.target.value)}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="w-full rounded-lg border p-3 bg-background" placeholder="Section name" value={sectionName} onChange={e => setSectionName(e.target.value)}/><input type="number" min="1" className="w-full rounded-lg border p-3 bg-background" placeholder="Capacity" value={capacity} onChange={e => setCapacity(e.target.value)}/><button disabled={saving} className="w-full rounded-lg bg-primary py-3 text-primary-foreground">{saving ? 'Saving...' : 'Create Section'}</button></form></Modal>
    <Modal open={showSubject} onClose={() => setShowSubject(false)}><ModalHeader title="Create Subject" onClose={() => setShowSubject(false)}/><form onSubmit={createSubject} className="p-5 space-y-4"><input className="w-full rounded-lg border p-3 bg-background" placeholder="Subject name" value={subjectName} onChange={e => setSubjectName(e.target.value)}/><input className="w-full rounded-lg border p-3 bg-background" placeholder="Code (optional)" value={subjectCode} onChange={e => setSubjectCode(e.target.value)}/><button disabled={saving} className="w-full rounded-lg bg-primary py-3 text-primary-foreground">{saving ? 'Saving...' : 'Create Subject'}</button></form></Modal>
  </div>;
}
