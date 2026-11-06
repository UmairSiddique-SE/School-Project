import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, BarChart4, Calendar, CheckCircle2, ClipboardList, FileSpreadsheet, Loader2, Plus, RefreshCw, Search, Trophy, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

interface Section { id: string; name: string; class?: { id: string; name: string; numeric?: number | null }; }
interface SchoolClass { id: string; name: string; numeric?: number | null; sections?: Section[]; }
interface Subject { id: string; name: string; code?: string | null; }
interface Student { id: string; name: string; rollNo?: string | number | null; admissionNo?: string | null; sectionId?: string | null; section?: Section; }
interface Exam {
  id: string;
  name: string;
  type?: string;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  description?: string | null;
  isPublished: boolean;
  sectionId?: string | null;
}
interface Result {
  id?: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  isAbsent: boolean;
  grade?: string | null;
  remarks?: string | null;
  student?: { name?: string; rollNo?: string | number; admissionNo?: string };
}

const gradeFor = (marks: number, total: number) => {
  const pct = total > 0 ? (marks / total) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

export default function Exams() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SCHOOL_ADMIN';
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [activeTab, setActiveTab] = useState<'schedules' | 'gradebook' | 'reportCards'>('schedules');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '', totalMarks: '100', passingMarks: '33', sectionId: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [examRes, classRes, subjectRes, studentRes] = await Promise.all([
        apiClient.get('/exams'),
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/students'),
      ]);
      const nextExams = Array.isArray(examRes.data) ? examRes.data : [];
      setExams(nextExams);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setSelectedExamId((current) => current && nextExams.some((e: Exam) => e.id === current) ? current : nextExams[0]?.id || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load examination data from the school database.');
      setExams([]); setClasses([]); setSubjects([]); setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedExam = useMemo(() => exams.find((exam) => exam.id === selectedExamId) || null, [exams, selectedExamId]);
  const selectedSection = useMemo(() => {
    if (!selectedExam?.sectionId) return null;
    for (const schoolClass of classes) {
      const section = schoolClass.sections?.find((item) => item.id === selectedExam.sectionId);
      if (section) return section;
    }
    return null;
  }, [classes, selectedExam]);
  const examStudents = useMemo(() => {
    if (!selectedExam?.sectionId) return students;
    return students.filter((student) => student.sectionId === selectedExam.sectionId || student.section?.id === selectedExam.sectionId);
  }, [selectedExam, students]);
  const filteredExams = useMemo(() => exams.filter((exam) => `${exam.name} ${exam.type || ''}`.toLowerCase().includes(search.toLowerCase())), [exams, search]);

  const loadResults = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId) { setResults([]); return; }
    setResultsLoading(true);
    try {
      const response = await apiClient.get('/exams/results', { params: { examId: selectedExamId, subjectId: selectedSubjectId } });
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setResults([]);
      toast.error(err?.response?.data?.message || 'Unable to load results.');
    } finally { setResultsLoading(false); }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => { void loadResults(); }, [loadResults]);

  const resultByStudent = useMemo(() => new Map(results.map((result) => [result.studentId, result])), [results]);
  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const average = results.length && selectedExam ? Math.round((results.reduce((sum, item) => sum + Number(item.marksObtained || 0), 0) / results.length / selectedExam.totalMarks) * 1000) / 10 : 0;
  const passRate = results.length && selectedExam ? Math.round((results.filter((item) => Number(item.marksObtained) >= selectedExam.passingMarks && !item.isAbsent).length / results.length) * 100) : 0;

  const createExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) { toast.error('Exam name and dates are required.'); return; }
    setSaving(true);
    try {
      const response = await apiClient.post('/exams', {
        name: form.name.trim(), type: form.type, startDate: form.startDate, endDate: form.endDate,
        totalMarks: Number(form.totalMarks), passingMarks: Number(form.passingMarks), sectionId: form.sectionId || undefined,
        description: form.description.trim() || undefined,
      });
      const created = response.data as Exam;
      setExams((current) => [created, ...current]);
      setSelectedExamId(created.id);
      setShowCreate(false);
      setForm({ name: '', type: 'UNIT_TEST', startDate: '', endDate: '', totalMarks: '100', passingMarks: '33', sectionId: '', description: '' });
      toast.success('Exam created in the school database.');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Exam could not be created.'); }
    finally { setSaving(false); }
  };

  const saveResults = async () => {
    if (!selectedExam || !selectedSubjectId || !examStudents.length) { toast.error('Select an exam, subject, and students first.'); return; }
    setSaving(true);
    try {
      const payload = examStudents.map((student) => {
        const current = resultByStudent.get(student.id);
        const raw = document.querySelector<HTMLInputElement>(`input[data-result-student="${student.id}"]`)?.value;
        const absent = document.querySelector<HTMLInputElement>(`input[data-absent-student="${student.id}"]`)?.checked || false;
        const marks = absent ? 0 : Number(raw ?? current?.marksObtained ?? 0);
        return { studentId: student.id, subjectId: selectedSubjectId, marksObtained: Number.isFinite(marks) ? marks : 0, isAbsent: absent, grade: gradeFor(marks, selectedExam.totalMarks) };
      });
      await apiClient.post('/exams/results', { examId: selectedExam.id, results: payload });
      toast.success('Results saved to the school database.');
      await loadResults();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Results could not be saved.'); }
    finally { setSaving(false); }
  };

  const publishExam = async () => {
    if (!selectedExam) return;
    try {
      const response = await apiClient.patch(`/exams/${selectedExam.id}/publish`, { published: !selectedExam.isPublished });
      setExams((current) => current.map((exam) => exam.id === selectedExam.id ? response.data : exam));
      toast.success(response.data?.isPublished ? 'Exam published.' : 'Exam unpublished.');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Exam publication failed.'); }
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1"><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /><span className="text-[11px] font-black uppercase tracking-widest text-amber-400">Examination & Academic Assessment</span></div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Exams & Results</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Live examination schedules, marks entry and result records from your school database.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => void load()} className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground" title="Refresh"><RefreshCw size={15} /></button>
          {isAdmin && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm shadow-lg"><Plus size={16} /> Schedule New Exam</button>}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Exam Sessions', value: exams.length, icon: ClipboardList, tone: 'amber' },
          { label: 'Published', value: publishedCount, icon: CheckCircle2, tone: 'emerald' },
          { label: 'Average Result', value: `${average}%`, icon: Trophy, tone: 'violet' },
          { label: 'Pass Rate', value: `${passRate}%`, icon: BarChart4, tone: 'cyan' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
            <div className={`h-11 w-11 rounded-2xl bg-${tone}-500/10 border border-${tone}-500/20 text-${tone}-400 flex items-center justify-center shrink-0`}><Icon size={20} /></div>
            <div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-2xl font-black text-foreground">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60">
            {([['schedules', 'Schedules', Calendar], ['gradebook', 'Marks Entry', FileSpreadsheet], ['reportCards', 'Results', Award]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${activeTab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={13} /> {label}</button>
            ))}
          </div>
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams..." className="w-full lg:w-72 pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
        </div>
      </div>

      {loading ? <div className="p-12 rounded-2xl bg-card border border-border flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
        <>
          {activeTab === 'schedules' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {filteredExams.length === 0 ? <Empty title="No exams found" text="Create an exam to start using examination management." /> : filteredExams.map((exam) => {
                const section = classes.flatMap((item) => item.sections || []).find((item) => item.id === exam.sectionId);
                return <button key={exam.id} onClick={() => setSelectedExamId(exam.id)} className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedExamId === exam.id ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-accent/40'}`}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-foreground">{exam.name}</h3><p className="text-xs text-muted-foreground mt-1">{exam.type || 'Exam'} · {section?.class?.name || 'All classes'}{section ? ` · ${section.name}` : ''}</p></div><span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${exam.isPublished ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>{exam.isPublished ? 'PUBLISHED' : 'DRAFT'}</span></div>
                  <div className="grid grid-cols-3 gap-3 mt-4 text-xs"><div><p className="text-muted-foreground">Start</p><p className="font-bold mt-1">{new Date(exam.startDate).toLocaleDateString()}</p></div><div><p className="text-muted-foreground">End</p><p className="font-bold mt-1">{new Date(exam.endDate).toLocaleDateString()}</p></div><div><p className="text-muted-foreground">Marks</p><p className="font-bold mt-1">{exam.totalMarks} / Pass {exam.passingMarks}</p></div></div>
                </button>;
              })}
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border h-fit">
              <h3 className="font-black text-foreground">Selected Exam</h3>
              {!selectedExam ? <p className="text-sm text-muted-foreground mt-3">Select an exam from the list.</p> : <div className="space-y-4 mt-4"><div><p className="text-lg font-black">{selectedExam.name}</p><p className="text-xs text-muted-foreground mt-1">{selectedExam.description || 'No description added.'}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><Stat label="Total Marks" value={selectedExam.totalMarks} /><Stat label="Passing" value={selectedExam.passingMarks} /><Stat label="Students" value={examStudents.length} /><Stat label="Subjects" value={subjects.length} /></div>{isAdmin && <button onClick={() => void publishExam()} className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">{selectedExam.isPublished ? 'Unpublish Exam' : 'Publish Exam'}</button>}</div>}
            </div>
          </div>}

          {activeTab === 'gradebook' && <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border grid grid-cols-1 md:grid-cols-2 gap-3"><select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select><select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</option>)}</select></div>
            {!selectedExam || !selectedSubjectId ? <Empty title="Select exam and subject" text="Marks entry uses students, subjects and exams directly from the school database." /> : resultsLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="rounded-2xl bg-card border border-border overflow-hidden"><div className="p-4 flex justify-between items-center border-b border-border"><div><h3 className="font-black">{selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId)?.name : 'Subject'} Gradebook</h3><p className="text-xs text-muted-foreground mt-1">{selectedSection?.class?.name || 'All classes'} {selectedSection ? `· ${selectedSection.name}` : ''}</p></div>{isAdmin || user?.role === 'TEACHER' ? <button disabled={saving} onClick={() => void saveResults()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2">{saving && <Loader2 size={13} className="animate-spin" />} Save Results</button> : null}</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Student</th><th className="p-3">Roll No</th><th className="p-3">Marks</th><th className="p-3">Absent</th><th className="p-3">Grade</th></tr></thead><tbody>{examStudents.map((student) => { const result = resultByStudent.get(student.id); return <tr key={student.id} className="border-b border-border/60"><td className="p-3 font-semibold">{student.name}</td><td className="p-3 text-muted-foreground">{student.rollNo || student.admissionNo || '—'}</td><td className="p-3"><input disabled={selectedExam.isPublished || (!isAdmin && user?.role !== 'TEACHER')} data-result-student={student.id} defaultValue={result?.marksObtained ?? ''} type="number" min="0" max={selectedExam.totalMarks} className="w-24 rounded-lg border border-border bg-background px-2.5 py-2" /></td><td className="p-3"><input disabled={selectedExam.isPublished || (!isAdmin && user?.role !== 'TEACHER')} data-absent-student={student.id} defaultChecked={result?.isAbsent ?? false} type="checkbox" /></td><td className="p-3 font-black">{result ? gradeFor(Number(result.marksObtained), selectedExam.totalMarks) : '—'}</td></tr>; })}</tbody></table></div>{examStudents.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No students are assigned to this exam section.</div>}</div>}
          </div>}

          {activeTab === 'reportCards' && <div className="space-y-4"><div className="p-4 rounded-2xl bg-card border border-border grid grid-cols-1 md:grid-cols-2 gap-3"><select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select><select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>{!selectedSubjectId ? <Empty title="Select a subject" text="Results shown here are loaded from the ExamResult records in the database." /> : resultsLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="rounded-2xl bg-card border border-border overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Rank</th><th className="p-3">Student</th><th className="p-3">Marks</th><th className="p-3">Percentage</th><th className="p-3">Grade</th></tr></thead><tbody>{[...results].sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained)).map((result, index) => { const pct = selectedExam ? Math.round((Number(result.marksObtained) / selectedExam.totalMarks) * 1000) / 10 : 0; return <tr key={result.id || `${result.studentId}-${result.subjectId}`} className="border-b border-border/60"><td className="p-3 font-black">#{index + 1}</td><td className="p-3 font-semibold">{result.student?.name || students.find((s) => s.id === result.studentId)?.name || 'Student'}</td><td className="p-3">{result.isAbsent ? 'Absent' : `${result.marksObtained} / ${selectedExam?.totalMarks ?? '—'}`}</td><td className="p-3">{result.isAbsent ? '0%' : `${pct}%`}</td><td className="p-3 font-black">{result.isAbsent ? 'F' : gradeFor(Number(result.marksObtained), selectedExam?.totalMarks || 100)}</td></tr>; })}</tbody></table>{results.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No results recorded for this exam and subject.</div>}</div>}</div>}
        </>
      )}

      {showCreate && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onMouseDown={(e) => e.currentTarget === e.target && setShowCreate(false)}><form onSubmit={createExam} className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4"><div className="flex justify-between items-center"><div><h2 className="text-xl font-black">Schedule New Exam</h2><p className="text-xs text-muted-foreground mt-1">Creates a real Exam record for this school.</p></div><button type="button" onClick={() => setShowCreate(false)}><X size={18} /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Exam name" className="md:col-span-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="UNIT_TEST">Unit Test</option><option value="MIDTERM">Midterm</option><option value="FINAL">Final</option></select><select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="">All sections</option>{classes.flatMap((schoolClass) => (schoolClass.sections || []).map((section) => <option key={section.id} value={section.id}>{schoolClass.name} · {section.name}</option>))}</select><input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} placeholder="Total marks" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><input type="number" min="0" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} placeholder="Passing marks" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="md:col-span-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm min-h-24" /></div><button disabled={saving} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-bold flex justify-center gap-2">{saving && <Loader2 size={15} className="animate-spin" />} Create Exam</button></form></div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl bg-muted/40 border border-border/60 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p><p className="font-black mt-1">{value}</p></div>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="p-12 rounded-2xl bg-card border border-border text-center"><Award className="mx-auto text-muted-foreground mb-3" size={28} /><h3 className="font-black">{title}</h3><p className="text-sm text-muted-foreground mt-1">{text}</p></div>; }
