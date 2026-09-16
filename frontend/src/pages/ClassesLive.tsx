import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, GraduationCap, Layers3, Plus, RefreshCw, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity: number; teacher?: Teacher | null; students?: any[] };
type SubjectAssignment = { id: string; subject: { id: string; name: string; code?: string | null }; teacher?: Teacher | null };
type ClassItem = { id: string; name: string; numeric?: number | null; sections?: Section[]; subjects?: SubjectAssignment[] };
type Subject = { id: string; name: string; code?: string | null };

const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold transition hover:bg-accent disabled:opacity-60';

export default function ClassesLive() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [className, setClassName] = useState('');
  const [classNumeric, setClassNumeric] = useState('');
  const [sectionClassId, setSectionClassId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [sectionTeacherId, setSectionTeacherId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [assignmentClassId, setAssignmentClassId] = useState('');
  const [assignmentSubjectId, setAssignmentSubjectId] = useState('');
  const [assignmentTeacherId, setAssignmentTeacherId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, t] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      const nextClasses: ClassItem[] = Array.isArray(c.data) ? c.data : [];
      setClasses(nextClasses);
      setSubjects(Array.isArray(s.data) ? s.data : []);
      setTeachers(Array.isArray(t.data) ? t.data : []);
      setSectionClassId((prev) => prev || nextClasses[0]?.id || '');
      setAssignmentClassId((prev) => prev || nextClasses[0]?.id || '');
      setAssignmentSubjectId((prev) => prev || (Array.isArray(s.data) ? s.data[0]?.id : '') || '');
    } catch (error: any) {
      setClasses([]); setSubjects([]); setTeachers([]);
      toast.error(error?.response?.data?.message || 'Unable to load academic data');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((item) => [item.name, item.numeric, ...(item.sections || []).flatMap((section) => [section.name, section.teacher?.name]), ...(item.subjects || []).flatMap((item) => [item.subject.name, item.teacher?.name])].some((value) => String(value ?? '').toLowerCase().includes(q)));
  }, [classes, search]);

  const totalSections = classes.reduce((sum, item) => sum + (item.sections?.length || 0), 0);
  const totalStudents = classes.reduce((sum, item) => sum + (item.sections || []).reduce((sectionSum, section) => sectionSum + (section.students?.length || 0), 0), 0);
  const totalCapacity = classes.reduce((sum, item) => sum + (item.sections || []).reduce((sectionSum, section) => sectionSum + section.capacity, 0), 0);
  const occupancy = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const createClass = async () => {
    if (!className.trim()) return toast.error('Class name is required');
    setBusy(true);
    try {
      await apiClient.post('/classes', { name: className.trim(), numeric: classNumeric ? Number(classNumeric) : undefined });
      setClassName(''); setClassNumeric(''); toast.success('Class created'); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not create class'); }
    finally { setBusy(false); }
  };

  const createSection = async () => {
    if (!sectionClassId || !sectionName.trim()) return toast.error('Select a class and enter section name');
    setBusy(true);
    try {
      await apiClient.post('/classes/sections', { classId: sectionClassId, name: sectionName.trim(), capacity: Number(capacity) || 40, teacherId: sectionTeacherId || undefined });
      setSectionName(''); setSectionTeacherId(''); toast.success('Section created'); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not create section'); }
    finally { setBusy(false); }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) return toast.error('Subject name is required');
    setBusy(true);
    try {
      await apiClient.post('/classes/subjects', { name: subjectName.trim(), code: subjectCode.trim() || undefined });
      setSubjectName(''); setSubjectCode(''); toast.success('Subject created'); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not create subject'); }
    finally { setBusy(false); }
  };

  const assignSubject = async () => {
    if (!assignmentClassId || !assignmentSubjectId) return toast.error('Select class and subject');
    setBusy(true);
    try {
      await apiClient.post('/classes/subjects/assign', { classId: assignmentClassId, subjectId: assignmentSubjectId, teacherId: assignmentTeacherId || undefined });
      toast.success('Subject assignment saved'); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not assign subject'); }
    finally { setBusy(false); }
  };

  const archiveClass = async (id: string) => {
    if (!confirm('Archive this class? Existing school records will remain stored.')) return;
    try { await apiClient.delete(`/classes/${id}`); toast.success('Class archived'); await load(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Could not archive class'); }
  };

  const archiveSection = async (id: string) => {
    if (!confirm('Archive this section? Existing student records will remain stored.')) return;
    try { await apiClient.delete(`/classes/sections/${id}`); toast.success('Section archived'); await load(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Could not archive section'); }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-7 pb-12">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">Academic Structure</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Classes & Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live classes, sections, class teachers, subjects and academic assignments.</p>
        </div>
        <button className={button} onClick={() => void load()}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={<GraduationCap size={18}/>} label="Classes" value={classes.length}/>
        <Stat icon={<Layers3 size={18}/>} label="Sections" value={totalSections}/>
        <Stat icon={<Users size={18}/>} label="Students" value={totalStudents}/>
        <Stat icon={<UserCheck size={18}/>} label="Occupancy" value={`${occupancy}%`}/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Panel title="Add Class" icon={<GraduationCap size={17}/>}> 
          <input className={input} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 10"/>
          <input className={input} type="number" min="0" max="100" value={classNumeric} onChange={(e) => setClassNumeric(e.target.value)} placeholder="Numeric value (optional)"/>
          <button disabled={busy} onClick={() => void createClass()} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-bold text-white"><Plus size={15} className="inline mr-1"/>Create Class</button>
        </Panel>
        <Panel title="Add Section" icon={<Layers3 size={17}/>}> 
          <select className={input} value={sectionClassId} onChange={(e) => setSectionClassId(e.target.value)}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <input className={input} value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section A"/>
          <input className={input} type="number" min="1" max="5000" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity"/>
          <select className={input} value={sectionTeacherId} onChange={(e) => setSectionTeacherId(e.target.value)}><option value="">No class teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
          <button disabled={busy} onClick={() => void createSection()} className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 font-bold text-white"><Plus size={15} className="inline mr-1"/>Create Section</button>
        </Panel>
        <Panel title="Add Subject" icon={<BookOpen size={17}/>}> 
          <input className={input} value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Mathematics"/>
          <input className={input} value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="MATH-01 (optional)"/>
          <button disabled={busy} onClick={() => void createSubject()} className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-bold text-white"><Plus size={15} className="inline mr-1"/>Create Subject</button>
        </Panel>
        <Panel title="Assign Subject" icon={<UserCheck size={17}/>}> 
          <select className={input} value={assignmentClassId} onChange={(e) => setAssignmentClassId(e.target.value)}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select className={input} value={assignmentSubjectId} onChange={(e) => setAssignmentSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}{subject.code ? ` • ${subject.code}` : ''}</option>)}</select>
          <select className={input} value={assignmentTeacherId} onChange={(e) => setAssignmentTeacherId(e.target.value)}><option value="">No subject teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
          <button disabled={busy} onClick={() => void assignSubject()} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 font-bold text-white"><UserCheck size={15} className="inline mr-1"/>Save Assignment</button>
        </Panel>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-black text-lg">Class Directory</h2><p className="text-xs text-muted-foreground">Expand each class to manage its sections and subject-teacher assignments.</p></div>
          <div className="relative w-full lg:w-96"><Search size={15} className="absolute left-3 top-3 text-muted-foreground"/><input className={`${input} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search class, section, teacher or subject…"/></div>
        </div>

        {loading ? <div className="p-12 text-center text-sm text-muted-foreground">Loading live academic data…</div> : filtered.length === 0 ? <div className="p-12 text-center"><GraduationCap className="mx-auto mb-3 text-muted-foreground" size={28}/><p className="font-bold">No classes found</p><p className="text-sm text-muted-foreground">Create your first class above.</p></div> : <div className="divide-y divide-border">
          {filtered.map((item) => {
            const isOpen = expanded[item.id] ?? true;
            const sectionCount = item.sections?.length || 0;
            const subjectCount = item.subjects?.length || 0;
            const classCapacity = (item.sections || []).reduce((sum, section) => sum + section.capacity, 0);
            return <div key={item.id}>
              <button onClick={() => setExpanded((prev) => ({ ...prev, [item.id]: !isOpen }))} className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/30">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600"><GraduationCap size={21}/></div><div><div className="font-black text-lg">{item.name}</div><div className="mt-1 text-xs text-muted-foreground">{item.numeric !== null && item.numeric !== undefined ? `Grade ${item.numeric} • ` : ''}{sectionCount} sections • {subjectCount} subjects • Capacity {classCapacity}</div></div></div>
                <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); void archiveClass(item.id); }} className="rounded-xl p-2 text-red-500 hover:bg-red-500/10" title="Archive class"><Trash2 size={16}/></button>{isOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</div>
              </button>

              {isOpen && <div className="grid gap-4 border-t border-border bg-muted/10 p-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-black"><Layers3 size={16} className="text-cyan-600"/> Sections</div><span className="text-xs font-bold text-muted-foreground">{sectionCount} total</span></div>
                  <div className="space-y-2">{(item.sections || []).map((section) => <div key={section.id} className="rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-3"><div><div className="font-black">Section {section.name}</div><div className="mt-1 text-xs text-muted-foreground">Capacity {section.capacity} • Teacher {section.teacher?.name || 'Not assigned'}</div></div><button onClick={() => void archiveSection(section.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><X size={15}/></button></div></div>)}{sectionCount === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No sections yet. Use Add Section above.</div>}</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 font-black"><BookOpen size={16} className="text-emerald-600"/> Subjects & Teachers</div><span className="text-xs font-bold text-muted-foreground">{subjectCount} assigned</span></div>
                  <div className="space-y-2">{(item.subjects || []).map((assignment) => <div key={assignment.id} className="rounded-xl border border-border bg-background p-3"><div className="font-black">{assignment.subject.name}</div><div className="mt-1 text-xs text-muted-foreground">{assignment.subject.code || 'No code'} • {assignment.teacher?.name || 'Teacher not assigned'}</div></div>)}{subjectCount === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No subject assignments yet.</div>}</div>
                </div>
              </div>}
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-0.5 text-2xl font-black text-foreground">{value}</p></div>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3"><div className="flex items-center gap-2 font-black">{icon}{title}</div>{children}</div>;
}
