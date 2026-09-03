import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Search, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Exam = { id: string; name: string; type: string; startDate: string; endDate: string; totalMarks: number; passingMarks: number; description?: string | null };
type Student = { id: string; name: string; rollNo?: string | null; admissionNo: string };
type Subject = { id: string; name: string; code?: string | null };

export default function Exams() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';
  const canRecord = canManage || user?.role === 'TEACHER';
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [absent, setAbsent] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '', totalMarks: '100', passingMarks: '33', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [e, s, sub] = await Promise.all([apiClient.get('/exams'), apiClient.get('/people/students'), apiClient.get('/classes/subjects')]);
      setExams(Array.isArray(e.data) ? e.data : []); setStudents(Array.isArray(s.data) ? s.data : []); setSubjects(Array.isArray(sub.data) ? sub.data : []);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Unable to load exams'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.name.trim() || !form.startDate || !form.endDate) return toast.error('Name and dates are required'); setSaving(true);
    try { await apiClient.post('/exams', { ...form, name: form.name.trim(), totalMarks: Number(form.totalMarks), passingMarks: Number(form.passingMarks) }); toast.success('Exam created'); setOpenCreate(false); setForm({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '', totalMarks: '100', passingMarks: '33', description: '' }); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not create exam'); }
    finally { setSaving(false); }
  };
  const openResultEntry = (exam: Exam) => { setSelectedExam(exam); setSubjectId(subjects[0]?.id || ''); setMarks({}); setAbsent({}); setOpenResults(true); };
  const record = async () => {
    if (!selectedExam || !subjectId || !students.length) return toast.error('Select a subject and ensure students exist'); setSaving(true);
    try {
      const results = students.map(s => ({ studentId: s.id, subjectId, marksObtained: absent[s.id] ? 0 : Number(marks[s.id] || 0), isAbsent: !!absent[s.id] }));
      await apiClient.post('/exams/results', { examId: selectedExam.id, results }); toast.success('Results saved'); setOpenResults(false);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save results'); }
    finally { setSaving(false); }
  };

  const upcoming = useMemo(() => [...exams].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [exams]);
  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div>;
  return <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:justify-between gap-4"><div><h1 className="text-2xl font-bold">Exams & Results</h1><p className="text-sm text-muted-foreground">Manage examinations and record real student results.</p></div>{canManage && <button onClick={() => setOpenCreate(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 w-fit"><Plus size={17}/> Create Exam</button>}</div>
    {upcoming.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No exams have been created yet.</div> : <div className="rounded-xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Exam</th><th className="p-3">Type</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Marks</th>{canRecord && <th className="p-3">Results</th>}</tr></thead><tbody>{upcoming.map(exam => <tr key={exam.id} className="border-b last:border-0"><td className="p-3 font-medium">{exam.name}</td><td className="p-3">{exam.type}</td><td className="p-3">{new Date(exam.startDate).toLocaleDateString()}</td><td className="p-3">{new Date(exam.endDate).toLocaleDateString()}</td><td className="p-3">{exam.totalMarks} / pass {exam.passingMarks}</td>{canRecord && <td className="p-3"><button onClick={() => openResultEntry(exam)} className="px-3 py-1.5 rounded-lg border">Enter results</button></td>}</tr>)}</tbody></table></div>}

    <Modal open={openCreate} onClose={() => setOpenCreate(false)}><ModalHeader title="Create Exam" onClose={() => setOpenCreate(false)}/><form onSubmit={create} className="p-5 grid sm:grid-cols-2 gap-4"><input required className="sm:col-span-2 rounded-lg border p-3 bg-background" placeholder="Exam name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><select className="rounded-lg border p-3 bg-background" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>UNIT_TEST</option><option>MIDTERM</option><option>FINAL</option><option>MONTHLY_TEST</option><option>QUIZ</option><option>MOCK_BOARD</option></select><input type="number" min="1" className="rounded-lg border p-3 bg-background" placeholder="Total marks" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })}/><label className="text-sm">Start<input required type="date" className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/></label><label className="text-sm">End<input required type="date" className="mt-1 w-full rounded-lg border p-3 bg-background" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}/></label><input type="number" min="0" className="rounded-lg border p-3 bg-background" placeholder="Passing marks" value={form.passingMarks} onChange={e => setForm({ ...form, passingMarks: e.target.value })}/><textarea className="sm:col-span-2 rounded-lg border p-3 bg-background" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/><button disabled={saving} className="sm:col-span-2 rounded-lg bg-primary py-3 text-primary-foreground">{saving ? 'Saving...' : 'Create Exam'}</button></form></Modal>
    <Modal open={openResults} onClose={() => setOpenResults(false)}><ModalHeader title={`Results: ${selectedExam?.name || ''}`} onClose={() => setOpenResults(false)}/><div className="p-5 space-y-4"><select className="w-full rounded-lg border p-3 bg-background" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}</select><div className="max-h-[55vh] overflow-y-auto rounded-lg border">{students.map(s => <div key={s.id} className="p-3 border-b last:border-0 flex items-center gap-3"><div className="flex-1"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.admissionNo} · Roll {s.rollNo || '—'}</div></div><input disabled={absent[s.id]} type="number" min="0" max={selectedExam?.totalMarks || 100} className="w-24 rounded-lg border p-2 bg-background" value={marks[s.id] || ''} onChange={e => setMarks({ ...marks, [s.id]: e.target.value })} placeholder="Marks"/><label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!absent[s.id]} onChange={e => setAbsent({ ...absent, [s.id]: e.target.checked })}/> Absent</label></div>)}</div>{canRecord && <button disabled={saving} onClick={record} className="w-full rounded-lg bg-primary py-3 text-primary-foreground flex justify-center items-center gap-2"><Save size={16}/>{saving ? 'Saving...' : 'Save Results'}</button>}</div></Modal>
  </div>;
}
