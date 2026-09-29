import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, GraduationCap, Layers3, Plus,
  RefreshCw, Search, Trash2, UserCheck, Users, X, BookMarked,
  DoorOpen, Check, User, ArrowRight
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity: number; teacher?: Teacher | null; students?: any[]; _count?: { students?: number } };
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
        <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
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
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ClassesLive() {
  const [activeTab,  setActiveTab]  = useState<'classes' | 'subjects'>('classes');
  const [classes,    setClasses]    = useState<ClassItem[]>([]);
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [teachers,   setTeachers]   = useState<Teacher[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [search,     setSearch]     = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
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
      setClasses(cls);
      setSubjects(sub);
      setTeachers(Array.isArray(tr.data) ? tr.data : []);
      if (cls.length > 0) {
        setSelectedClassId(prev => (prev && cls.some(c => c.id === prev)) ? prev : cls[0].id);
        setSectionClassId(p => p || cls[0].id);
        setAssignClassId(p => p || cls[0].id);
      }
      if (sub.length > 0) {
        setAssignSubjectId(p => p || sub[0].id);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
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

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  const totalSections = classes.reduce((n, c) => n + (c.sections?.length || 0), 0);
  const totalStudents = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (s._count?.students ?? s.students?.length ?? 0), 0), 0);
  const totalCapacity = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (Number(s.capacity)||0), 0), 0);
  const occupancy     = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  /* ── CRUD ── */
  const createClass = async () => {
    if (!className.trim()) return toast.error('Class name required');
    setBusy(true);
    try {
      const res = await apiClient.post('/classes', { name: className.trim(), numeric: classNumeric ? Number(classNumeric) : undefined });
      setClassName(''); setClassNumeric(''); setModal(null);
      toast.success('Class created ✓');
      await load();
      if (res.data?.id) setSelectedClassId(res.data.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error creating class');
    } finally { setBusy(false); }
  };

  const createSection = async () => {
    const targetId = sectionClassId || selectedClass?.id;
    if (!targetId || !sectionName.trim()) return toast.error('Select a class and enter section name');
    setBusy(true);
    try {
      await apiClient.post('/classes/sections', {
        classId: targetId,
        name: sectionName.trim(),
        capacity: Number(capacity) || 35,
        teacherId: sectionTeacherId || undefined
      });
      setSectionName(''); setSectionTeacherId(''); setModal(null);
      toast.success('Section added to class ✓');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error creating section');
    } finally { setBusy(false); }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) return toast.error('Subject name required');
    setBusy(true);
    try {
      await apiClient.post('/classes/subjects', { name: subjectName.trim(), code: subjectCode.trim() || undefined });
      setSubjectName(''); setSubjectCode(''); setModal(null);
      toast.success('Subject registered ✓');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error creating subject');
    } finally { setBusy(false); }
  };

  const assignSubject = async () => {
    if (!assignClassId || !assignSubjectId) return toast.error('Select class and subject');
    setBusy(true);
    try {
      await apiClient.post('/classes/subjects/assign', {
        classId: assignClassId,
        subjectId: assignSubjectId,
        teacherId: assignTeacherId || undefined
      });
      setModal(null);
      toast.success('Subject assigned to class ✓');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error assigning subject');
    } finally { setBusy(false); }
  };

  const archiveClass = async (id: string, name: string) => {
    if (!confirm(`Archive class "${name}" and all its sections?`)) return;
    try {
      await apiClient.delete(`/classes/${id}`);
      toast.success('Class archived');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error deleting class');
    }
  };

  const archiveSection = async (id: string, name: string) => {
    if (!confirm(`Archive section "${name}"?`)) return;
    try {
      await apiClient.delete(`/classes/sections/${id}`);
      toast.success('Section archived');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error deleting section');
    }
  };

  const quickAddSection = (classId: string) => {
    setSectionClassId(classId);
    setSectionName('');
    setSectionTeacherId('');
    setCapacity('35');
    setModal('section');
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-600/10 via-card to-indigo-600/5 p-6 shadow-sm">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Academic Administration</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Classes & Curriculum</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage classroom levels, sections, teachers in-charge, and subject allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeTab === 'classes' ? (
              <>
                <button
                  onClick={() => setModal('grade')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition"
                >
                  <GraduationCap size={15}/> + Add Class
                </button>
                {selectedClass && (
                  <button
                    onClick={() => quickAddSection(selectedClass.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    <Layers3 size={15}/> + Add Section to {selectedClass.name}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setModal('subject')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition"
                >
                  <BookOpen size={15}/> + New Subject
                </button>
                <button
                  onClick={() => setModal('assign')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition"
                >
                  <UserCheck size={15}/> + Assign Subject
                </button>
              </>
            )}

            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin':''}/> Refresh
            </button>
          </div>
        </div>

        {/* ── DISTINCT NAVIGATION TABS ── */}
        <div className="mt-6 flex items-center gap-2 border-t border-border/50 pt-4">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'classes'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 scale-[1.02]'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <GraduationCap size={16} /> Classes & Sections
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'subjects'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookMarked size={16} /> Subjects & Curriculum
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {subjects.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-5 shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mb-3">
            <GraduationCap size={20}/>
          </div>
          <p className="text-2xl font-black text-foreground">{classes.length}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Total Classes</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-card p-5 shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-3">
            <Layers3 size={20}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalSections}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Active Sections</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-5 shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
            <Users size={20}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalStudents}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Enrolled Students</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm hover:shadow-md transition">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
            <DoorOpen size={20}/>
          </div>
          <p className="text-2xl font-black text-foreground">{totalCapacity} <span className="text-xs font-normal text-muted-foreground">seats</span></p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{occupancy}% Campus Capacity</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: CLASSES & SECTIONS WORKFLOW                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by class name, section, teacher..."
              className="w-full rounded-2xl border border-border/80 bg-card py-3 pl-11 pr-4 text-sm font-medium text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT / TOP: ALL CLASSES LIST (Click to Select) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Class Levels</h2>
                  <p className="text-xs text-muted-foreground">Click a class to view and add sections</p>
                </div>
                <button
                  onClick={() => setModal('grade')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-500 hover:text-violet-600 bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20"
                >
                  <Plus size={13}/> New Class
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3">
                  <GraduationCap size={32} className="mx-auto text-muted-foreground/40"/>
                  <p className="font-bold text-foreground text-sm">No classes found</p>
                  <button
                    onClick={() => setModal('grade')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-violet-600 text-white px-3.5 py-2 rounded-xl"
                  >
                    <Plus size={13}/> Create First Class
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((item) => {
                    const isSelected = selectedClass?.id === item.id;
                    const secCount = item.sections?.length || 0;
                    const stuCount = (item.sections || []).reduce((acc, s) => acc + (s._count?.students ?? s.students?.length ?? 0), 0);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedClassId(item.id)}
                        className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10 scale-[1.01]'
                            : 'border-border/80 bg-card hover:border-violet-500/40 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-base border shrink-0 ${
                              isSelected
                                ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                                : 'bg-muted text-foreground border-border'
                            }`}>
                              {item.numeric ?? item.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-black text-base text-foreground truncate">{item.name}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>{secCount} {secCount === 1 ? 'Section' : 'Sections'}</span>
                                <span>•</span>
                                <span className="font-semibold text-foreground">{stuCount} Students</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void archiveClass(item.id, item.name);
                              }}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                              title="Delete Class"
                            >
                              <Trash2 size={15}/>
                            </button>
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'text-violet-500 bg-violet-500/20' : 'text-muted-foreground'}`}>
                              <ChevronRight size={18}/>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: SELECTED CLASS SECTIONS DETAILS */}
            <div className="lg:col-span-7">
              {selectedClass ? (
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                  {/* Class Header & Direct Add Section Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                          Active Class Focus
                        </span>
                        {selectedClass.numeric != null && (
                          <span className="text-xs text-muted-foreground font-semibold">Grade Level: {selectedClass.numeric}</span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-foreground">{selectedClass.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage sections, assign class teachers, and monitor seat occupancy for {selectedClass.name}.
                      </p>
                    </div>

                    <button
                      onClick={() => quickAddSection(selectedClass.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition shrink-0"
                    >
                      <Plus size={15}/> Add Section
                    </button>
                  </div>

                  {/* Sections List in this Class */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Layers3 size={15} className="text-cyan-500"/>
                        Sections inside {selectedClass.name}
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground">
                        {selectedClass.sections?.length || 0} Sections
                      </span>
                    </div>

                    {!selectedClass.sections || selectedClass.sections.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-8 text-center space-y-3">
                        <Layers3 size={32} className="mx-auto text-cyan-500/60"/>
                        <p className="font-bold text-foreground text-sm">No sections created yet for {selectedClass.name}</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Click below to add the first section (e.g. Section A, Section B) to this class.
                        </p>
                        <button
                          onClick={() => quickAddSection(selectedClass.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md shadow-cyan-500/20"
                        >
                          <Plus size={14}/> Add Section Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedClass.sections.map((sec) => {
                          const fill = sec._count?.students ?? sec.students?.length ?? 0;
                          const cap = Number(sec.capacity) || 35;
                          const pct = Math.min(100, Math.round((fill / cap) * 100));

                          return (
                            <div
                              key={sec.id}
                              className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-sm hover:border-cyan-500/30 transition space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 flex items-center justify-center font-black text-sm">
                                    {sec.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-sm text-foreground">Section {sec.name}</h4>
                                    <p className="text-[11px] text-muted-foreground">Capacity: {cap} seats</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => void archiveSection(sec.id, sec.name)}
                                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                                  title="Delete Section"
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </div>

                              <div className="rounded-xl bg-card border border-border/60 p-2.5 space-y-1">
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <User size={12}/> Class Teacher:
                                </div>
                                <p className="text-xs font-bold text-foreground">
                                  {sec.teacher?.name || 'No Teacher Assigned'}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold">
                                  <span className="text-muted-foreground">Enrolled Students</span>
                                  <span className="text-foreground">{fill} / {cap} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
                  Select a class on the left to manage its sections
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: SUBJECTS & CURRICULUM SECTION                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'subjects' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <h2 className="text-xl font-black text-foreground">Subject Registry</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register all subjects taught in the school and assign subject specialist teachers to classes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal('subject')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition"
                >
                  <Plus size={15}/> + Add Subject
                </button>
                <button
                  onClick={() => setModal('assign')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition"
                >
                  <UserCheck size={15}/> Assign to Class
                </button>
              </div>
            </div>

            {/* Registered Subjects Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen size={15} className="text-emerald-500"/>
                All Registered Subjects ({subjects.length})
              </h3>

              {subjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
                  No subjects registered. Click "+ Add Subject" to create subjects like Mathematics, English, Science, etc.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {subjects.map(s => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-border/80 bg-background/80 p-3.5 hover:border-emerald-500/40 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs mb-2">
                          <BookOpen size={16}/>
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">{s.name}</h4>
                      </div>
                      {s.code ? (
                        <span className="mt-2 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit">
                          {s.code}
                        </span>
                      ) : (
                        <span className="mt-2 text-[10px] text-muted-foreground">General</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Class Subject Allocations */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserCheck size={15} className="text-amber-500"/>
                Class Subject Allocations & Assigned Teachers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(c => {
                  const asgns = c.subjects || [];
                  return (
                    <div key={c.id} className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                        <span className="font-black text-sm text-foreground">{c.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {asgns.length} subjects
                        </span>
                      </div>

                      {asgns.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">No subjects assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {asgns.map(a => (
                            <div key={a.id} className="rounded-xl border border-border/70 bg-card p-2.5 flex items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="font-bold text-foreground">{a.subject.name}</span>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User size={10}/> {a.teacher?.name || 'No Teacher'}
                                </p>
                              </div>
                              <Check size={14} className="text-emerald-500 shrink-0"/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Class Modal */}
      <ModalShell open={modal === 'grade'} onClose={() => setModal(null)}
        title="Create New Class / Grade" icon={<GraduationCap size={17}/>} palette={PALETTE.grade}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Class Name</label>
            <input className={inp} value={className} onChange={e => setClassName(e.target.value)}
              placeholder="e.g. Grade 10 / Matric / Nursery" autoFocus/>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Numeric Level (Optional)</label>
            <input className={inp} type="number" min="0" max="20" value={classNumeric} onChange={e => setClassNumeric(e.target.value)}
              placeholder="e.g. 10"/>
          </div>
          <button disabled={busy} onClick={() => void createClass()}
            className="w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white
              hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-violet-500/20 mt-2">
            {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Create Class
          </button>
        </div>
      </ModalShell>

      {/* Add Section Modal */}
      <ModalShell open={modal === 'section'} onClose={() => setModal(null)}
        title="Add New Section" icon={<Layers3 size={17}/>} palette={PALETTE.section}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Target Class</label>
            <select className={inp} value={sectionClassId} onChange={e => setSectionClassId(e.target.value)}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Section Name</label>
            <input className={inp} value={sectionName} onChange={e => setSectionName(e.target.value)}
              placeholder="e.g. Section A / Blue / Rose" autoFocus/>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Seat Capacity</label>
            <input className={inp} type="number" min="1" max="5000" value={capacity} onChange={e => setCapacity(e.target.value)}
              placeholder="e.g. 35"/>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Class Teacher In-Charge (Optional)</label>
            <select className={inp} value={sectionTeacherId} onChange={e => setSectionTeacherId(e.target.value)}>
              <option value="">— Select Teacher —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button disabled={busy} onClick={() => void createSection()}
            className="w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-sm font-bold text-white
              hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-cyan-500/20 mt-2">
            {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Create Section
          </button>
        </div>
      </ModalShell>

      {/* Add Subject Modal */}
      <ModalShell open={modal === 'subject'} onClose={() => setModal(null)}
        title="Register New Subject" icon={<BookOpen size={17}/>} palette={PALETTE.subject}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Subject Name</label>
            <input className={inp} value={subjectName} onChange={e => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics / Physics / English" autoFocus/>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Subject Code (Optional)</label>
            <input className={inp} value={subjectCode} onChange={e => setSubjectCode(e.target.value)}
              placeholder="e.g. MATH-101"/>
          </div>
          <button disabled={busy} onClick={() => void createSubject()}
            className="w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white
              hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-emerald-500/20 mt-2">
            {busy ? <RefreshCw size={15} className="animate-spin"/> : <Plus size={15}/>} Save Subject
          </button>
        </div>
      </ModalShell>

      {/* Assign Subject Modal */}
      <ModalShell open={modal === 'assign'} onClose={() => setModal(null)}
        title="Assign Subject to Class" icon={<UserCheck size={17}/>} palette={PALETTE.assign}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Select Class</label>
            <select className={inp} value={assignClassId} onChange={e => setAssignClassId(e.target.value)}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Select Subject</label>
            <select className={inp} value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)}>
              <option value="">— Select Subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` • ${s.code}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Assigned Teacher (Optional)</label>
            <select className={inp} value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
              <option value="">— Select Teacher —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button disabled={busy} onClick={() => void assignSubject()}
            className="w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white
              hover:brightness-110 disabled:opacity-50 transition shadow-md shadow-amber-500/20 mt-2">
            {busy ? <RefreshCw size={15} className="animate-spin"/> : <UserCheck size={15}/>} Save Assignment
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
