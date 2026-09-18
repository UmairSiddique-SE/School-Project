import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, GraduationCap, Layers3, Plus,
  RefreshCw, Search, Trash2, UserCheck, Users, X, BookMarked,
  DoorOpen, Sparkles, AlertCircle, Check, User
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity: number; teacher?: Teacher | null; students?: any[] };
type SubjectAssignment = { id: string; subject: { id: string; name: string; code?: string | null }; teacher?: Teacher | null };
type ClassItem = { id: string; name: string; numeric?: number | null; sections?: Section[]; subjects?: SubjectAssignment[] };
type Subject = { id: string; name: string; code?: string | null };
type ModalType = 'grade' | 'section' | 'subject' | 'assign' | null;

/* ─── Shared class tokens ────────────────────────────────────── */
const inp = `w-full rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 text-sm
  text-foreground outline-none placeholder:text-muted-foreground/60 transition
  focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium`;

/* ─── Gradient palette per step ─────────────────────────────── */
const PALETTE = {
  grade:   { from: 'from-violet-600', to: 'to-indigo-600',  ring: 'ring-violet-500/20',  bg: 'bg-violet-500/10',  text: 'text-violet-500',  border: 'border-violet-500/20' },
  section: { from: 'from-cyan-600',   to: 'to-blue-600',    ring: 'ring-cyan-500/20',    bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/20'   },
  subject: { from: 'from-emerald-600',to: 'to-teal-600',    ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20'},
  assign:  { from: 'from-amber-500',  to: 'to-orange-500',  ring: 'ring-amber-500/20',   bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20'  },
};

/* ─── Reusable Modal Shell ───────────────────────────────────── */
function ModalShell({ open, onClose, title, icon, children, palette }: {
  open: boolean; onClose: () => void; title: string; icon: React.ReactNode;
  children: React.ReactNode; palette: typeof PALETTE['grade'];
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 border-b border-border/60 p-5`}>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${palette.bg} ${palette.text} flex items-center justify-center`}>
              {icon}
            </div>
            <h2 className="font-black text-base text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted transition">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string;
  sub?: string; color: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm
      transition-all hover:shadow-md group cursor-default`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${color} opacity-[0.07]
        group-hover:opacity-[0.13] transition-all pointer-events-none blur-xl`} />
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl ${color} bg-opacity-10 border flex items-center justify-center`}
          style={{ background: undefined }}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center`}
            style={{ background: `color-mix(in srgb, currentColor 12%, transparent)` }}>
            {icon}
          </div>
        </div>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</p>}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ClassesLive() {
  const [classes,    setClasses]    = useState<ClassItem[]>([]);
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [teachers,   setTeachers]   = useState<Teacher[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [modal,      setModal]      = useState<ModalType>(null);

  /* form state */
  const [className,         setClassName]         = useState('');
  const [classNumeric,      setClassNumeric]      = useState('');
  const [sectionClassId,    setSectionClassId]    = useState('');
  const [sectionName,       setSectionName]       = useState('');
  const [capacity,          setCapacity]          = useState('35');
  const [sectionTeacherId,  setSectionTeacherId]  = useState('');
  const [subjectName,       setSubjectName]       = useState('');
  const [subjectCode,       setSubjectCode]       = useState('');
  const [assignClassId,     setAssignClassId]     = useState('');
  const [assignSubjectId,   setAssignSubjectId]   = useState('');
  const [assignTeacherId,   setAssignTeacherId]   = useState('');

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, sr, tr] = await Promise.all([
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      const cls: ClassItem[] = Array.isArray(cr.data) ? cr.data : [];
      const sub: Subject[]   = Array.isArray(sr.data) ? sr.data : [];
      setClasses(cls); setSubjects(sub);
      setTeachers(Array.isArray(tr.data) ? tr.data : []);
      setExpanded(prev => { const m: Record<string,boolean> = {}; cls.forEach(c => { m[c.id] = prev[c.id] ?? true; }); return m; });
      if (cls.length) { setSectionClassId(p => p || cls[0].id); setAssignClassId(p => p || cls[0].id); }
      if (sub.length) { setAssignSubjectId(p => p || sub[0].id); }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /* ── derived ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      [c.name, c.numeric,
       ...(c.sections||[]).flatMap(s => [s.name, s.teacher?.name]),
       ...(c.subjects||[]).flatMap(a => [a.subject.name, a.teacher?.name]),
      ].some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [classes, search]);

  const totalSections = classes.reduce((n, c) => n + (c.sections?.length || 0), 0);
  const totalStudents = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (s.students?.length||0), 0), 0);
  const totalCapacity = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (Number(s.capacity)||0), 0), 0);
  const occupancy     = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  /* ── CRUD ── */
  const createClass = async () => {
    if (!className.trim()) return toast.error('Class name required');
    setBusy(true);
    try { await apiClient.post('/classes', { name: className.trim(), numeric: classNumeric ? Number(classNumeric) : undefined }); setClassName(''); setClassNumeric(''); setModal(null); toast.success('Grade created ✓'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setBusy(false); }
  };

  const createSection = async () => {
    if (!sectionClassId || !sectionName.trim()) return toast.error('Select a grade and enter section name');
    setBusy(true);
    try { await apiClient.post('/classes/sections', { classId: sectionClassId, name: sectionName.trim(), capacity: Number(capacity)||35, teacherId: sectionTeacherId||undefined }); setSectionName(''); setSectionTeacherId(''); setModal(null); toast.success('Section created ✓'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setBusy(false); }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) return toast.error('Subject name required');
    setBusy(true);
    try { await apiClient.post('/classes/subjects', { name: subjectName.trim(), code: subjectCode.trim()||undefined }); setSubjectName(''); setSubjectCode(''); setModal(null); toast.success('Subject created ✓'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setBusy(false); }
  };

  const assignSubject = async () => {
    if (!assignClassId || !assignSubjectId) return toast.error('Select grade and subject');
    setBusy(true);
    try { await apiClient.post('/classes/subjects/assign', { classId: assignClassId, subjectId: assignSubjectId, teacherId: assignTeacherId||undefined }); setModal(null); toast.success('Subject assigned ✓'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    finally { setBusy(false); }
  };

  const archiveClass   = async (id: string) => { if (!confirm('Archive this grade?')) return; try { await apiClient.delete(`/classes/${id}`); toast.success('Archived'); await load(); } catch (e: any) { toast.error(e?.response?.data?.message||'Error'); } };
  const archiveSection = async (id: string) => { if (!confirm('Archive this section?')) return; try { await apiClient.delete(`/classes/sections/${id}`); toast.success('Archived'); await load(); } catch (e: any) { toast.error(e?.response?.data?.message||'Error'); } };

  /* quick-open section modal pre-filled for a grade */
  const quickAddSection = (classId: string) => {
    setSectionClassId(classId); setSectionName(''); setSectionTeacherId(''); setCapacity('35');
    setModal('section');
  };

  /* ── render ── */
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60
        bg-gradient-to-br from-violet-600/10 via-card to-indigo-600/5 p-6 shadow-sm">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Academic Structure</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Classes & Sections</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage grade levels, sections, assigned teachers, and subject allocations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button onClick={() => setModal('grade')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
                px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition">
              <GraduationCap size={15}/> New Grade
            </button>
            <button onClick={() => setModal('section')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600
                px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition">
              <Layers3 size={15}/> New Section
            </button>
            <button onClick={() => setModal('subject')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600
                px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition">
              <BookOpen size={15}/> New Subject
            </button>
            <button onClick={() => setModal('assign')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500
                px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition">
              <UserCheck size={15}/> Assign Subject
            </button>
            <button onClick={() => void load()} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80
                px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin':''}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-500/10 blur-xl" />
          <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mb-3">
            <GraduationCap size={22}/>
          </div>
          <p className="text-2xl font-black text-foreground">{classes.length}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Total Grades</p>
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-black text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"/> Live
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-card p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-cyan-500/10 blur-xl" />
          <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-3">
            <Layers3 size={22}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalSections}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Active Sections</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
            <Users size={22}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalStudents}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Enrolled Students</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/10 blur-xl" />
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
            <DoorOpen size={22}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalCapacity} <span className="text-xs font-normal text-muted-foreground">seats</span></p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{occupancy}% Campus Occupancy</p>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search grade, section, teacher or subject…"
          className="w-full rounded-2xl border border-border/80 bg-card py-3 pl-11 pr-4 text-sm
            font-medium text-foreground shadow-sm placeholder:text-muted-foreground/60
            focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"/>
      </div>

      {/* ── SUBJECTS PILL BAR ── */}
      {subjects.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <BookMarked size={16} className="text-emerald-500"/> Subject Registry
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {subjects.length} subjects
              </span>
            </div>
            <button onClick={() => setModal('subject')}
              className="inline-flex items-center gap-1.5 rounded-xl text-[11px] font-bold px-3 py-1.5
                bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
              <Plus size={12}/> Add Subject
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <span key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60
                  px-3 py-1 text-xs font-semibold text-foreground hover:border-emerald-500/30 transition">
                <BookOpen size={11} className="text-emerald-500"/> {s.name}
                {s.code && <span className="text-muted-foreground font-mono">• {s.code}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── GRADE DIRECTORY ── */}
      <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="font-black text-lg text-foreground">Grade Directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click a grade to expand and manage its sections, subjects and assigned teachers.</p>
          </div>
          <span className="text-xs font-bold text-muted-foreground px-3 py-1 rounded-full bg-muted border border-border">
            {filtered.length} {filtered.length === 1 ? 'Grade' : 'Grades'}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <RefreshCw size={28} className="animate-spin text-violet-500"/>
            <p className="text-sm text-muted-foreground font-medium">Loading academic structure…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <GraduationCap size={32} className="text-muted-foreground/50"/>
            </div>
            <p className="font-black text-foreground">No grades yet</p>
            <p className="text-xs text-muted-foreground">Click "New Grade" above to get started.</p>
            <button onClick={() => setModal('grade')}
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
                px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition">
              <Plus size={14}/> Create First Grade
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => {
              const isOpen = expanded[item.id] ?? true;
              const secs   = item.sections || [];
              const asgns  = item.subjects  || [];
              const cap    = secs.reduce((n, s) => n + (Number(s.capacity)||0), 0);
              const enr    = secs.reduce((n, s) => n + (s.students?.length||0), 0);

              /* generate a colour accent per grade based on index */
              const colors = [
                'bg-violet-500/10 text-violet-600 border-violet-500/20',
                'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                'bg-amber-500/10 text-amber-600 border-amber-500/20',
                'bg-rose-500/10 text-rose-600 border-rose-500/20',
                'bg-sky-500/10 text-sky-600 border-sky-500/20',
              ];
              const ci = classes.findIndex(c => c.id === item.id) % colors.length;

              return (
                <div key={item.id}>
                  {/* Grade row */}
                  <div className="flex items-center justify-between gap-4 p-5 hover:bg-muted/20 transition">
                    <button onClick={() => setExpanded(p => ({ ...p, [item.id]: !isOpen }))}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left">
                      <div className={`h-12 w-12 shrink-0 rounded-2xl border flex items-center justify-center font-black text-xl ${colors[ci]}`}>
                        {item.numeric ?? item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-lg text-foreground leading-tight">{item.name}</span>
                          {item.numeric != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">Grade {item.numeric}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium">{secs.length} sections</span>
                          <span>·</span>
                          <span className="font-medium">{asgns.length} subjects</span>
                          <span>·</span>
                          <span className="font-medium text-foreground">{enr} students</span>
                          <span>·</span>
                          <span>{cap} seats</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => quickAddSection(item.id)}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5
                          text-xs font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/20
                          hover:bg-cyan-500/20 transition"
                        title="Add section to this grade">
                        <Layers3 size={13}/> + Section
                      </button>
                      <button onClick={() => void archiveClass(item.id)}
                        className="rounded-xl p-2 text-rose-500 hover:bg-rose-500/10 transition" title="Archive grade">
                        <Trash2 size={16}/>
                      </button>
                      <button onClick={() => setExpanded(p => ({ ...p, [item.id]: !isOpen }))}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition">
                        {isOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                      </button>
                    </div>
                  </div>

                  {/* Expanded body */}
                  {isOpen && (
                    <div className="border-t border-border bg-muted/10 p-5">
                      <div className="grid gap-4 xl:grid-cols-2">

                        {/* Sections panel */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-black text-sm text-foreground">
                              <Layers3 size={15} className="text-cyan-500"/> Sections
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{secs.length} total</span>
                              <button onClick={() => quickAddSection(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold
                                  bg-cyan-500 text-white hover:bg-cyan-600 transition">
                                <Plus size={11}/> Add
                              </button>
                            </div>
                          </div>

                          {secs.length ? (
                            <div className="space-y-2">
                              {secs.map(sec => {
                                const fill = sec.students?.length || 0;
                                const pct  = sec.capacity ? Math.round((fill / sec.capacity) * 100) : 0;
                                return (
                                  <div key={sec.id}
                                    className="rounded-xl border border-border bg-background/80 p-3
                                      hover:border-cyan-500/30 transition">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="font-black text-sm text-foreground flex items-center gap-2">
                                          <span>Section {sec.name}</span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                            pct >= 90 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            : pct >= 70 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                            {pct}% full
                                          </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                          <span>{fill} / {sec.capacity} students</span>
                                          <span>·</span>
                                          <span className="flex items-center gap-1">
                                            <User size={10}/>
                                            <strong className="text-foreground">{sec.teacher?.name || 'No class teacher'}</strong>
                                          </span>
                                        </div>
                                        {/* capacity bar */}
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${
                                            pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(pct, 100)}%` }}/>
                                        </div>
                                      </div>
                                      <button onClick={() => void archiveSection(sec.id)}
                                        className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition">
                                        <X size={14}/>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <button onClick={() => quickAddSection(item.id)}
                              className="w-full rounded-xl border-2 border-dashed border-border p-6
                                flex flex-col items-center gap-2 text-muted-foreground
                                hover:border-cyan-500/40 hover:text-cyan-600 hover:bg-cyan-500/5 transition">
                              <Layers3 size={22}/>
                              <span className="text-xs font-bold">Click to add the first section</span>
                            </button>
                          )}
                        </div>

                        {/* Subjects & teachers panel */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-black text-sm text-foreground">
                              <BookOpen size={15} className="text-emerald-500"/> Subjects & Teachers
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{asgns.length} subjects</span>
                              <button onClick={() => { setAssignClassId(item.id); setModal('assign'); }}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold
                                  bg-amber-500 text-white hover:bg-amber-600 transition">
                                <Plus size={11}/> Assign
                              </button>
                            </div>
                          </div>

                          {asgns.length ? (
                            <div className="space-y-2">
                              {asgns.map(a => (
                                <div key={a.id}
                                  className="rounded-xl border border-border bg-background/80 p-3
                                    flex items-center justify-between gap-3
                                    hover:border-emerald-500/30 transition">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-black text-sm text-foreground">{a.subject.name}</span>
                                      {a.subject.code && (
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                          {a.subject.code}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                                      <User size={10}/>
                                      <strong className="text-foreground">{a.teacher?.name || 'No subject teacher'}</strong>
                                    </div>
                                  </div>
                                  <Check size={14} className="shrink-0 text-emerald-500"/>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <button onClick={() => { setAssignClassId(item.id); setModal('assign'); }}
                              className="w-full rounded-xl border-2 border-dashed border-border p-6
                                flex flex-col items-center gap-2 text-muted-foreground
                                hover:border-amber-500/40 hover:text-amber-600 hover:bg-amber-500/5 transition">
                              <BookOpen size={22}/>
                              <span className="text-xs font-bold">Click to assign subjects to this grade</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Add Grade */}
      <ModalShell open={modal === 'grade'} onClose={() => setModal(null)}
        title="Create New Grade" icon={<GraduationCap size={17}/>} palette={PALETTE.grade}>
        <input className={inp} value={className} onChange={e => setClassName(e.target.value)}
          placeholder="Grade name  (e.g. Grade 10 / Matric)" autoFocus/>
        <input className={inp} type="number" min="0" max="20" value={classNumeric} onChange={e => setClassNumeric(e.target.value)}
          placeholder="Numeric level (optional  e.g. 10)"/>
        <button disabled={busy} onClick={() => void createClass()}
          className="w-full flex items-center justify-center gap-2 rounded-xl
            bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white
            hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-violet-500/20">
          {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Create Grade
        </button>
      </ModalShell>

      {/* Add Section */}
      <ModalShell open={modal === 'section'} onClose={() => setModal(null)}
        title="Add New Section" icon={<Layers3 size={17}/>} palette={PALETTE.section}>
        <select className={inp} value={sectionClassId} onChange={e => setSectionClassId(e.target.value)}>
          <option value="">— Select Grade —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className={inp} value={sectionName} onChange={e => setSectionName(e.target.value)}
          placeholder="Section name  (e.g. A / Blue / Rose)" autoFocus/>
        <input className={inp} type="number" min="1" max="5000" value={capacity} onChange={e => setCapacity(e.target.value)}
          placeholder="Seat capacity  (e.g. 35)"/>
        <select className={inp} value={sectionTeacherId} onChange={e => setSectionTeacherId(e.target.value)}>
          <option value="">Class teacher  (optional)</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button disabled={busy} onClick={() => void createSection()}
          className="w-full flex items-center justify-center gap-2 rounded-xl
            bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-bold text-white
            hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-cyan-500/20">
          {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Create Section
        </button>
      </ModalShell>

      {/* Add Subject */}
      <ModalShell open={modal === 'subject'} onClose={() => setModal(null)}
        title="Register New Subject" icon={<BookOpen size={17}/>} palette={PALETTE.subject}>
        <input className={inp} value={subjectName} onChange={e => setSubjectName(e.target.value)}
          placeholder="Subject name  (e.g. Mathematics)" autoFocus/>
        <input className={inp} value={subjectCode} onChange={e => setSubjectCode(e.target.value)}
          placeholder="Subject code  (optional  e.g. MATH-101)"/>
        <button disabled={busy} onClick={() => void createSubject()}
          className="w-full flex items-center justify-center gap-2 rounded-xl
            bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white
            hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-emerald-500/20">
          {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Create Subject
        </button>
      </ModalShell>

      {/* Assign Subject */}
      <ModalShell open={modal === 'assign'} onClose={() => setModal(null)}
        title="Assign Subject to Grade" icon={<UserCheck size={17}/>} palette={PALETTE.assign}>
        <select className={inp} value={assignClassId} onChange={e => setAssignClassId(e.target.value)}>
          <option value="">— Select Grade —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={inp} value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)}>
          <option value="">— Select Subject —</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` • ${s.code}` : ''}</option>)}
        </select>
        <select className={inp} value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
          <option value="">Subject teacher  (optional)</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button disabled={busy} onClick={() => void assignSubject()}
          className="w-full flex items-center justify-center gap-2 rounded-xl
            bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white
            hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-amber-500/20">
          {busy ? <RefreshCw size={15} className="animate-spin"/> : <UserCheck size={15}/>} Save Assignment
        </button>
      </ModalShell>
    </div>
  );
}
