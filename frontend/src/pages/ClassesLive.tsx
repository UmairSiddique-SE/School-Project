import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, GraduationCap, Layers3, Plus,
  RefreshCw, Search, Trash2, UserCheck, Users, X, BookMarked,
  DoorOpen, Check, User, ArrowRight, Edit3, Calendar, ShieldCheck,
  Award, Clock, CheckCircle2, AlertCircle, Filter, ArrowUpRight
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────── */
type Teacher = { id: string; name: string; employeeNo?: string; email?: string; phone?: string; qualification?: string; avatarUrl?: string };
type Section = { id: string; name: string; capacity: number; teacherId?: string | null; teacher?: Teacher | null; students?: any[]; _count?: { students?: number } };
type SubjectAssignment = { id: string; subject: { id: string; name: string; code?: string | null; description?: string | null }; teacher?: Teacher | null };
type ClassItem = { id: string; name: string; numeric?: number | null; academicYearId?: string | null; sections?: Section[]; subjects?: SubjectAssignment[] };
type Subject = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isOptional?: boolean;
  subjectType?: string;
  creditHours?: number;
  cleanDescription?: string;
  assignedClassesCount?: number;
  assignedClasses?: { assignmentId?: string; classId: string; className: string; teacherId?: string | null; teacherName?: string | null; employeeNo?: string | null }[];
};
type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: { classes: number; exams: number; attendances: number };
};
type TeacherMapping = {
  id: string;
  name: string;
  employeeNo?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  assignedSubjects: { id: string; classId: string; className: string; subjectId: string; subjectName: string; subjectCode?: string | null }[];
  classTeacherOf: { sectionId: string; sectionName: string; className: string }[];
  totalWeeklyPeriods: number;
};

type ModalType = 'grade' | 'section' | 'subject' | 'edit_subject' | 'assign' | 'academic_year' | null;

/* ─── Shared input style ────────────────────────────────────── */
const inp = `w-full rounded-xl border border-border/80 bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 px-3.5 py-2.5 text-sm
  text-foreground outline-none placeholder:text-slate-500 dark:text-muted-foreground/60 transition
  focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 font-medium`;

/* ─── Gradient palette per modal ─────────────────────────────── */
const PALETTE = {
  grade:   { bg: 'bg-violet-500/10',  text: 'text-violet-500',  border: 'border-violet-500/20' },
  section: { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/20'   },
  subject: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20'},
  edit_subject: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20'},
  assign:  { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20'  },
  academic_year: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
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
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${palette.bg} ${palette.text} flex items-center justify-center`}>
              {icon}
            </div>
            <h2 className="font-black text-base text-slate-900 dark:text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:bg-muted transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ClassesLive() {
  const { user, previewRole } = useAuth();
  const role = previewRole ?? user?.role ?? 'SCHOOL_ADMIN';
  const canManage = role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';

  const [activeTab,  setActiveTab]  = useState<'classes' | 'subjects' | 'mapping' | 'sessions'>('classes');
  const [classes,    setClasses]    = useState<ClassItem[]>([]);
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [teachers,   setTeachers]   = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [teacherMappings, setTeacherMappings] = useState<TeacherMapping[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [search,     setSearch]     = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [modal,      setModal]      = useState<ModalType>(null);

  /* Form states */
  const [className,         setClassName]         = useState('');
  const [classNumeric,      setClassNumeric]      = useState('');
  const [sectionClassId,    setSectionClassId]    = useState('');
  const [sectionName,       setSectionName]       = useState('');
  const [capacity,          setCapacity]          = useState('35');
  const [sectionTeacherId,  setSectionTeacherId]  = useState('');

  // Subject form states
  const [editingSubjectId,  setEditingSubjectId]  = useState<string | null>(null);
  const [subjectName,       setSubjectName]       = useState('');
  const [subjectCode,       setSubjectCode]       = useState('');
  const [subjectType,       setSubjectType]       = useState<'COMPULSORY' | 'OPTIONAL'>('COMPULSORY');
  const [creditHours,       setCreditHours]       = useState('1');
  const [subjectDesc,       setSubjectDesc]       = useState('');
  const [selectedClassIds,  setSelectedClassIds]  = useState<string[]>([]);
  const [subjectTeacherId,  setSubjectTeacherId]  = useState('');

  // Assign Subject form
  const [assignClassId,     setAssignClassId]     = useState('');
  const [assignSubjectId,   setAssignSubjectId]   = useState('');
  const [assignTeacherId,   setAssignTeacherId]   = useState('');

  // Academic Year form
  const [sessionName,       setSessionName]       = useState('');
  const [sessionStart,      setSessionStart]      = useState('');
  const [sessionEnd,        setSessionEnd]        = useState('');
  const [sessionIsCurrent,  setSessionIsCurrent]  = useState(true);

  /* ── Load Data ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, sr, tr, ar, mr] = await Promise.allSettled([
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
        apiClient.get('/classes/academic-years'),
        apiClient.get('/classes/teacher-mapping'),
      ]);

      const cls: ClassItem[] = cr.status === 'fulfilled' && Array.isArray(cr.value.data) ? cr.value.data : [];
      const sub: Subject[]   = sr.status === 'fulfilled' && Array.isArray(sr.value.data) ? sr.value.data : [];
      const tch: Teacher[]   = tr.status === 'fulfilled' && Array.isArray(tr.value.data) ? tr.value.data : [];
      const ay: AcademicYear[] = ar.status === 'fulfilled' && Array.isArray(ar.value.data) ? ar.value.data : [];
      const tm = mr.status === 'fulfilled' && mr.value.data?.teachers ? mr.value.data.teachers : [];

      setClasses(cls);
      setSubjects(sub);
      setTeachers(tch);
      setAcademicYears(ay);
      setTeacherMappings(tm);

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

  /* ── Filtered data ── */
  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      [c.name, c.numeric,
       ...(c.sections||[]).flatMap(s => [s.name, s.teacher?.name]),
       ...(c.subjects||[]).flatMap(a => [a.subject.name, a.teacher?.name]),
      ].some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [classes, search]);

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s =>
      [s.name, s.code, s.subjectType, s.cleanDescription, ...(s.assignedClasses || []).map(ac => ac.className)]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [subjects, search]);

  const filteredTeacherMappings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teacherMappings;
    return teacherMappings.filter(t =>
      [t.name, t.employeeNo, t.email, t.qualification,
       ...t.assignedSubjects.map(as => `${as.subjectName} ${as.className}`),
       ...t.classTeacherOf.map(ct => `${ct.className} ${ct.sectionName}`)]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [teacherMappings, search]);

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  const totalSections = classes.reduce((n, c) => n + (c.sections?.length || 0), 0);
  const totalStudents = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (s._count?.students ?? s.students?.length ?? 0), 0), 0);
  const totalCapacity = classes.reduce((n, c) => n + (c.sections||[]).reduce((m,s) => m + (Number(s.capacity)||0), 0), 0);
  const occupancy     = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;
  const currentSession = academicYears.find(a => a.isCurrent);

  /* ── Class / Section CRUD ── */
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

  /* ── Subject CRUD ── */
  const openNewSubjectModal = () => {
    setEditingSubjectId(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectType('COMPULSORY');
    setCreditHours('1');
    setSubjectDesc('');
    setSelectedClassIds(classes.map(c => c.id));
    setSubjectTeacherId('');
    setModal('subject');
  };

  const openEditSubjectModal = (sub: Subject) => {
    setEditingSubjectId(sub.id);
    setSubjectName(sub.name);
    setSubjectCode(sub.code || '');
    setSubjectType(sub.subjectType === 'OPTIONAL' ? 'OPTIONAL' : 'COMPULSORY');
    setCreditHours(String(sub.creditHours || 1));
    setSubjectDesc(sub.cleanDescription || '');
    setSelectedClassIds(sub.assignedClasses?.map(ac => ac.classId) || []);
    setSubjectTeacherId('');
    setModal('edit_subject');
  };

  const saveSubject = async () => {
    if (!subjectName.trim()) return toast.error('Subject name is required');
    setBusy(true);
    try {
      const payload = {
        name: subjectName.trim(),
        code: subjectCode.trim() || undefined,
        subjectType,
        isOptional: subjectType === 'OPTIONAL',
        creditHours: Number(creditHours) || 1,
        description: subjectDesc.trim() || undefined,
        classIds: selectedClassIds,
        teacherId: subjectTeacherId || undefined,
      };

      if (editingSubjectId) {
        await apiClient.put(`/classes/subjects/${editingSubjectId}`, payload);
        toast.success('Subject updated successfully ✓');
      } else {
        await apiClient.post('/classes/subjects', payload);
        toast.success('New subject created and assigned ✓');
      }
      setModal(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error saving subject');
    } finally { setBusy(false); }
  };

  const deleteSubject = async (sub: Subject) => {
    if (!confirm(`Delete subject "${sub.name}"? This will remove all class allocations.`)) return;
    try {
      await apiClient.delete(`/classes/subjects/${sub.id}`);
      toast.success('Subject deleted');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error deleting subject');
    }
  };

  /* ── Teacher-Subject Assign ── */
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
      toast.success('Teacher assigned to subject ✓');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error assigning subject');
    } finally { setBusy(false); }
  };

  const removeSubjectAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this subject assignment from class?')) return;
    try {
      await apiClient.delete(`/classes/subjects/assign/${assignmentId}`);
      toast.success('Assignment removed');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error removing assignment');
    }
  };

  /* ── Academic Year / Session CRUD ── */
  const openAcademicYearModal = () => {
    const nextYear = new Date().getFullYear();
    setSessionName(`${nextYear}-${nextYear + 1}`);
    setSessionStart(`${nextYear}-04-01`);
    setSessionEnd(`${nextYear + 1}-03-31`);
    setSessionIsCurrent(true);
    setModal('academic_year');
  };

  const createAcademicSession = async () => {
    if (!sessionName.trim() || !sessionStart || !sessionEnd) {
      return toast.error('Session name and valid date range are required');
    }
    setBusy(true);
    try {
      await apiClient.post('/classes/academic-years', {
        name: sessionName.trim(),
        startDate: sessionStart,
        endDate: sessionEnd,
        isCurrent: sessionIsCurrent,
      });
      setModal(null);
      toast.success('Academic session activated ✓');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error activating session');
    } finally { setBusy(false); }
  };

  const activateSession = async (year: AcademicYear) => {
    if (!confirm(`Switch active school session to "${year.name}"?`)) return;
    try {
      await apiClient.patch(`/classes/academic-years/${year.id}/set-current`, {});
      toast.success(`Active session switched to ${year.name}`);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error switching session');
    }
  };

  const deleteSession = async (year: AcademicYear) => {
    if (!confirm(`Delete academic session "${year.name}"?`)) return;
    try {
      await apiClient.delete(`/classes/academic-years/${year.id}`);
      toast.success('Session deleted');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error deleting session');
    }
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
              {currentSession && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/30">
                  <Calendar size={10} /> Active Session: {currentSession.name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-foreground">Academic Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
              Class structures, subject curriculum, teacher–section allocations, and academic sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManage && activeTab === 'classes' && (
              <>
                <button
                  onClick={() => setModal('grade')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition"
                >
                  <GraduationCap size={15}/> + Add Class
                </button>
                {selectedClass && (
                  <button
                    onClick={() => {
                      setSectionClassId(selectedClass.id);
                      setSectionName('');
                      setSectionTeacherId('');
                      setCapacity('35');
                      setModal('section');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    <Layers3 size={15}/> + Add Section to {selectedClass.name}
                  </button>
                )}
              </>
            )}

            {canManage && activeTab === 'subjects' && (
              <>
                <button
                  onClick={openNewSubjectModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition"
                >
                  <BookOpen size={15}/> + New Subject
                </button>
                <button
                  onClick={() => setModal('assign')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition"
                >
                  <UserCheck size={15}/> + Assign Teacher
                </button>
              </>
            )}

            {canManage && activeTab === 'mapping' && (
              <button
                onClick={() => setModal('assign')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition"
              >
                <UserCheck size={15}/> + Allocate Teacher–Subject
              </button>
            )}

            {canManage && activeTab === 'sessions' && (
              <button
                onClick={openAcademicYearModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:brightness-110 transition"
              >
                <Calendar size={15}/> + Activate New Session
              </button>
            )}

            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin':''}/> Refresh
            </button>
          </div>
        </div>

        {/* ── 4 PROFESSIONAL NAVIGATION TABS ── */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'classes'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 scale-[1.02]'
                : 'text-slate-500 dark:text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <GraduationCap size={16} /> Classes & Sections
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'classes' ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-muted text-slate-500 dark:text-muted-foreground'}`}>
              {classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'subjects'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : 'text-slate-500 dark:text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <BookMarked size={16} /> Subjects & Curriculum
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'subjects' ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-muted text-slate-500 dark:text-muted-foreground'}`}>
              {subjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'mapping'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                : 'text-slate-500 dark:text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <UserCheck size={16} /> Teacher ↔ Subject Allocation
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'mapping' ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-muted text-slate-500 dark:text-muted-foreground'}`}>
              {teacherMappings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
              activeTab === 'sessions'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 scale-[1.02]'
                : 'text-slate-500 dark:text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <Calendar size={16} /> Academic Sessions
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'sessions' ? 'bg-white dark:bg-slate-900/20 text-white' : 'bg-muted text-slate-500 dark:text-muted-foreground'}`}>
              {academicYears.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mb-3">
            <GraduationCap size={20}/>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{classes.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Total Classes ({totalSections} Sections)</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
            <BookOpen size={20}/>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{subjects.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Curriculum Subjects</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3">
            <UserCheck size={20}/>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{teachers.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Faculty Members</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-3">
            <Calendar size={20}/>
          </div>
          <p className="text-xl font-black text-foreground truncate">{currentSession?.name || '2026-2027'}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Current Active Session</p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-muted-foreground pointer-events-none"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={
            activeTab === 'classes' ? "Search by class name, section, teacher..." :
            activeTab === 'subjects' ? "Search subjects by name, code, type, class..." :
            activeTab === 'mapping' ? "Search faculty mapping by teacher, class, subject..." :
            "Search academic sessions..."
          }
          className="w-full rounded-2xl border border-border/80 bg-card py-3 pl-11 pr-4 text-sm font-medium text-foreground shadow-sm placeholder:text-slate-500 dark:text-muted-foreground/60 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1: CLASSES & SECTIONS                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Class levels list */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Class Levels</h2>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Select class to view {canManage ? 'and manage ' : ''}sections</p>
              </div>
              {canManage && <button
                onClick={() => setModal('grade')}
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-500 hover:text-violet-600 bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20"
              >
                <Plus size={13}/> New Class
              </button>}
            </div>

            {filteredClasses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3">
                <GraduationCap size={32} className="mx-auto text-slate-500 dark:text-muted-foreground/40"/>
                <p className="font-bold text-foreground text-sm">No classes found</p>
                {canManage && <button onClick={() => setModal('grade')} className="inline-flex items-center gap-1.5 text-xs font-bold bg-violet-600 text-white px-3.5 py-2 rounded-xl">
                  <Plus size={13}/> Create First Class
                </button>}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredClasses.map((item) => {
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
                          : 'border-border/80 bg-card hover:border-violet-500/40 hover:bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40'
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
                            <p className="text-xs text-slate-500 dark:text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>{secCount} {secCount === 1 ? 'Section' : 'Sections'}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-900 dark:text-foreground">{stuCount} Students</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {canManage && <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void archiveClass(item.id, item.name);
                            }}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                            title="Delete Class"
                          >
                            <Trash2 size={15}/>
                          </button>}
                          <ChevronRight size={18} className={`transition ${isSelected ? 'text-violet-500 translate-x-1' : 'text-slate-500 dark:text-muted-foreground/40'}`}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Class Details (Sections & Subjects) */}
          <div className="lg:col-span-7 space-y-5">
            {selectedClass ? (
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/25">
                      {selectedClass.numeric ?? selectedClass.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-foreground">{selectedClass.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">Class details, active sections, and curriculum allocation</p>
                    </div>
                  </div>

                  {canManage && <button
                    onClick={() => {
                      setSectionClassId(selectedClass.id);
                      setSectionName('');
                      setSectionTeacherId('');
                      setCapacity('35');
                      setModal('section');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    <Plus size={15}/> Add Section
                  </button>}
                </div>

                {/* Sections Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground flex items-center gap-2">
                    <Layers3 size={14} className="text-cyan-500" /> Active Sections ({selectedClass.sections?.length || 0})
                  </h3>

                  {(selectedClass.sections || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
                      <Layers3 size={24} className="mx-auto text-slate-500 dark:text-muted-foreground/40" />
                      <p className="text-xs font-bold text-slate-900 dark:text-foreground">No sections in this class yet</p>
                      {canManage && <button
                        onClick={() => {
                          setSectionClassId(selectedClass.id);
                          setSectionName('');
                          setSectionTeacherId('');
                          setCapacity('35');
                          setModal('section');
                        }}
                        className="text-xs font-bold text-cyan-500 hover:underline"
                      >
                        + Add Section (e.g. Section A, Section B)
                      </button>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedClass.sections || []).map((sec) => {
                        const count = sec._count?.students ?? sec.students?.length ?? 0;
                        const pctCap = sec.capacity ? Math.round((count / sec.capacity) * 100) : 0;
                        return (
                          <div key={sec.id} className="rounded-2xl border border-border/80 bg-slate-50 dark:bg-muted/20 p-4 space-y-3 hover:border-cyan-500/40 transition group">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-sm text-slate-900 dark:text-foreground">Section {sec.name}</span>
                              {canManage && <button
                                onClick={() => void archiveSection(sec.id, sec.name)}
                                className="rounded-lg p-1.5 text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                title="Delete Section"
                              >
                                <Trash2 size={14} />
                              </button>}
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-500 dark:text-muted-foreground">
                              <p className="flex items-center gap-2 font-medium">
                                <User size={13} className="text-cyan-500" />
                                {sec.teacher ? (
                                  <span className="text-foreground font-semibold">In-charge: {sec.teacher.name}</span>
                                ) : (
                                  <span className="text-amber-500 italic">No class teacher assigned</span>
                                )}
                              </p>
                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <span>Enrollment</span>
                                <span className="font-bold text-slate-900 dark:text-foreground">{count} / {sec.capacity}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pctCap > 90 ? 'bg-rose-500' : pctCap > 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                                  style={{ width: `${Math.min(pctCap, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Class Subjects Table */}
                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground flex items-center gap-2">
                      <BookMarked size={14} className="text-emerald-500" /> Curriculum Subjects ({selectedClass.subjects?.length || 0})
                    </h3>
                    {canManage && <button
                      onClick={() => {
                        setAssignClassId(selectedClass.id);
                        setModal('assign');
                      }}
                      className="text-xs font-bold text-emerald-500 hover:underline inline-flex items-center gap-1"
                    >
                      <Plus size={12}/> Allocate Subject
                    </button>}
                  </div>

                  {(selectedClass.subjects || []).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-muted-foreground italic">No subjects allocated to this class yet.</p>
                  ) : (
                    <div className="rounded-2xl border border-border/60 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 text-slate-500 dark:text-muted-foreground uppercase text-[10px] font-black border-b border-border/60">
                          <tr>
                            <th className="p-3">Subject</th>
                            <th className="p-3">Code</th>
                            <th className="p-3">Assigned Faculty</th>
                            {canManage && <th className="p-3 text-right">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {(selectedClass.subjects || []).map((as) => (
                            <tr key={as.id} className="hover:bg-slate-50 dark:bg-muted/20">
                              <td className="p-3 font-bold text-slate-900 dark:text-foreground">{as.subject.name}</td>
                              <td className="p-3 text-slate-500 dark:text-muted-foreground">{as.subject.code || '—'}</td>
                              <td className="p-3">
                                {as.teacher ? (
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-500">
                                    <UserCheck size={13} /> {as.teacher.name}
                                  </span>
                                ) : (
                                  <span className="text-amber-500 text-[11px] italic">Unassigned</span>
                                )}
                              </td>
                              {canManage && <td className="p-3 text-right">
                                <button
                                  onClick={() => void removeSubjectAssignment(as.id)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                                  title="Unassign"
                                >
                                  <Trash2 size={13}/>
                                </button>
                              </td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-slate-500 dark:text-muted-foreground">
                Select a class from the left list to view sections and subject curriculum.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2: SUBJECTS MANAGEMENT                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-foreground">Curriculum & Subjects Catalog</h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Configure compulsory and elective subjects, credit weights, and assigned grades</p>
            </div>
            {canManage && <button
              onClick={openNewSubjectModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition shrink-0"
            >
              <Plus size={15}/> Add New Subject
            </button>}
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <BookOpen size={36} className="mx-auto text-slate-500 dark:text-muted-foreground/40" />
              <p className="font-bold text-foreground text-sm">No subjects found</p>
              {canManage && <button onClick={openNewSubjectModal} className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-xl">
                <Plus size={14} /> Register First Subject
              </button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubjects.map((sub) => {
                const isOpt = sub.isOptional || sub.subjectType === 'OPTIONAL';
                return (
                  <div key={sub.id} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 hover:border-emerald-500/40 hover:shadow-md transition group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${
                          isOpt ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-foreground leading-snug">{sub.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded-md text-slate-900 dark:text-foreground">
                              {sub.code || 'NO-CODE'}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              isOpt
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {isOpt ? 'Optional' : 'Compulsory'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManage && <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditSubjectModal(sub)}
                          className="rounded-lg p-1.5 text-slate-500 dark:text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition"
                          title="Edit Subject"
                        >
                          <Edit3 size={15}/>
                        </button>
                        <button
                          onClick={() => void deleteSubject(sub)}
                          className="rounded-lg p-1.5 text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                          title="Delete Subject"
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>}
                    </div>

                    {sub.cleanDescription && (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground line-clamp-2">{sub.cleanDescription}</p>
                    )}

                    <div className="border-t border-border/60 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-muted-foreground">Assigned Classes</span>
                        <span className="font-bold text-slate-900 dark:text-foreground">{sub.assignedClassesCount || 0} Levels</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(sub.assignedClasses || []).map((ac) => (
                          <span key={ac.classId} className="inline-flex items-center gap-1 text-[11px] font-bold bg-muted/60 text-foreground px-2 py-1 rounded-lg border border-border">
                            {ac.className}
                            {ac.teacherName && (
                              <span className="text-[10px] font-normal text-emerald-500">({ac.teacherName})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 3: TEACHER ↔ SECTION ↔ SUBJECT ALLOCATION MATRIX      */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-foreground">Teacher–Section–Subject Allocation Matrix</h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Overview of teacher subject workloads, section class teachers, and weekly period counts</p>
            </div>
            {canManage && <button
              onClick={() => setModal('assign')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-110 transition shrink-0"
            >
              <UserCheck size={15}/> + Assign Teacher to Subject
            </button>}
          </div>

          {filteredTeacherMappings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <UserCheck size={36} className="mx-auto text-slate-500 dark:text-muted-foreground/40" />
              <p className="font-bold text-foreground text-sm">No teacher allocations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeacherMappings.map((tm) => (
                <div key={tm.id} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 hover:border-amber-500/40 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black text-base shrink-0">
                      {tm.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-base text-foreground truncate">{tm.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground font-mono">{tm.employeeNo || tm.email || 'Faculty'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 p-2 border border-border/50">
                      <p className="text-lg font-black text-slate-900 dark:text-foreground">{tm.assignedSubjects.length}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground">Subjects Assigned</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 p-2 border border-border/50">
                      <p className="text-lg font-black text-amber-500">{tm.totalWeeklyPeriods}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground">Weekly Periods</p>
                    </div>
                  </div>

                  {tm.classTeacherOf.length > 0 && (
                    <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-2.5 text-xs text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-2">
                      <ShieldCheck size={15} />
                      <span>Class Teacher of: {tm.classTeacherOf.map(c => `${c.className} (${c.sectionName})`).join(', ')}</span>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <h4 className="text-[11px] font-black uppercase text-slate-500 dark:text-muted-foreground">Teaching Subjects:</h4>
                    {tm.assignedSubjects.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground italic">No subjects currently assigned.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {tm.assignedSubjects.map((as) => (
                          <div key={as.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded-xl border border-border/60">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-foreground">{as.subjectName}</span>
                              <span className="text-slate-500 dark:text-muted-foreground ml-1.5">({as.className})</span>
                            </div>
                            {canManage && <button
                              onClick={() => void removeSubjectAssignment(as.id)}
                              className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md"
                              title="Remove Allocation"
                            >
                              <Trash2 size={12} />
                            </button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 4: ACADEMIC SESSIONS / YEARS                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-foreground">Academic Years & Sessions</h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Manage active school sessions, previous year archives, and activate new academic terms</p>
            </div>
            {canManage && <button
              onClick={openAcademicYearModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:brightness-110 transition shrink-0"
            >
              <Plus size={15}/> + Activate New Session
            </button>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {academicYears.map((year) => (
              <div
                key={year.id}
                className={`rounded-2xl border p-5 space-y-4 transition ${
                  year.isCurrent
                    ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/10'
                    : 'border-border/80 bg-card hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl text-slate-900 dark:text-foreground">{year.name}</h3>
                      {year.isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5">
                          <CheckCircle2 size={11} /> CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(year.startDate).toLocaleDateString()} — {new Date(year.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  {canManage && !year.isCurrent && (
                    <button
                      onClick={() => void deleteSession(year)}
                      className="text-slate-500 dark:text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Delete Session"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 p-2 border border-border/50">
                    <p className="font-black text-slate-900 dark:text-foreground">{year._count?.classes || 0}</p>
                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground font-semibold">Classes</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 p-2 border border-border/50">
                    <p className="font-black text-slate-900 dark:text-foreground">{year._count?.exams || 0}</p>
                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground font-semibold">Exams</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 dark:bg-muted/40 p-2 border border-border/50">
                    <p className="font-black text-slate-900 dark:text-foreground">{year._count?.attendances || 0}</p>
                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground font-semibold">Records</p>
                  </div>
                </div>

                {canManage && !year.isCurrent && (
                  <button
                    onClick={() => void activateSession(year)}
                    className="w-full py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    Set as Current Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                     */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* 1. Add Class Modal */}
      <ModalShell
        open={modal === 'grade'}
        onClose={() => setModal(null)}
        title="Create New Class Level"
        icon={<GraduationCap size={18} />}
        palette={PALETTE.grade}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Class / Grade Name *</label>
            <input
              value={className}
              onChange={e => setClassName(e.target.value)}
              placeholder="e.g. Grade 1, Class 10, Matric-I"
              className={inp}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Numeric Order (Optional)</label>
            <input
              type="number"
              value={classNumeric}
              onChange={e => setClassNumeric(e.target.value)}
              placeholder="e.g. 1, 10"
              className={inp}
            />
          </div>
          <button
            onClick={createClass}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-violet-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? 'Creating...' : 'Save Class'}
          </button>
        </div>
      </ModalShell>

      {/* 2. Add Section Modal */}
      <ModalShell
        open={modal === 'section'}
        onClose={() => setModal(null)}
        title="Add Section to Class"
        icon={<Layers3 size={18} />}
        palette={PALETTE.section}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Parent Class *</label>
            <select
              value={sectionClassId}
              onChange={e => setSectionClassId(e.target.value)}
              className={inp}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Section Name *</label>
            <input
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder="e.g. A, Rose, Blue, Morning"
              className={inp}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Classroom Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                placeholder="35"
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Class Teacher (In-Charge)</label>
              <select
                value={sectionTeacherId}
                onChange={e => setSectionTeacherId(e.target.value)}
                className={inp}
              >
                <option value="">-- Optional --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={createSection}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-xs font-black text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? 'Adding...' : 'Add Section'}
          </button>
        </div>
      </ModalShell>

      {/* 3. Add/Edit Subject Modal */}
      <ModalShell
        open={modal === 'subject' || modal === 'edit_subject'}
        onClose={() => setModal(null)}
        title={editingSubjectId ? "Edit Curriculum Subject" : "Register New Subject"}
        icon={<BookOpen size={18} />}
        palette={PALETTE.subject}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Subject Name *</label>
              <input
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                placeholder="e.g. Mathematics, English"
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Subject Code</label>
              <input
                value={subjectCode}
                onChange={e => setSubjectCode(e.target.value)}
                placeholder="e.g. MTH-101"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Subject Category</label>
              <select
                value={subjectType}
                onChange={e => setSubjectType(e.target.value as any)}
                className={inp}
              >
                <option value="COMPULSORY">Compulsory (Core)</option>
                <option value="OPTIONAL">Optional (Elective)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Credit Hours / Weight</label>
              <input
                type="number"
                value={creditHours}
                onChange={e => setCreditHours(e.target.value)}
                placeholder="1"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Description / Notes</label>
            <input
              value={subjectDesc}
              onChange={e => setSubjectDesc(e.target.value)}
              placeholder="Brief course objectives or syllabus outline"
              className={inp}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Assign To Classes</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-border/80 rounded-xl bg-slate-50 dark:bg-muted/20">
              {classes.map(c => {
                const checked = selectedClassIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1.5 rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) setSelectedClassIds(prev => [...prev, c.id]);
                        else setSelectedClassIds(prev => prev.filter(id => id !== c.id));
                      }}
                      className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={saveSubject}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? 'Saving...' : (editingSubjectId ? 'Update Subject' : 'Save Subject')}
          </button>
        </div>
      </ModalShell>

      {/* 4. Assign Teacher Modal */}
      <ModalShell
        open={modal === 'assign'}
        onClose={() => setModal(null)}
        title="Assign Teacher to Subject"
        icon={<UserCheck size={18} />}
        palette={PALETTE.assign}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Target Class *</label>
            <select
              value={assignClassId}
              onChange={e => setAssignClassId(e.target.value)}
              className={inp}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Subject *</label>
            <select
              value={assignSubjectId}
              onChange={e => setAssignSubjectId(e.target.value)}
              className={inp}
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code || 'NO-CODE'})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Faculty Teacher</label>
            <select
              value={assignTeacherId}
              onChange={e => setAssignTeacherId(e.target.value)}
              className={inp}
            >
              <option value="">-- Unassigned --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.employeeNo || t.email})</option>)}
            </select>
          </div>

          <button
            onClick={assignSubject}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-white shadow-lg shadow-amber-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Confirm Allocation'}
          </button>
        </div>
      </ModalShell>

      {/* 5. Activate Academic Session Modal */}
      <ModalShell
        open={modal === 'academic_year'}
        onClose={() => setModal(null)}
        title="Activate Academic Session"
        icon={<Calendar size={18} />}
        palette={PALETTE.academic_year}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Session Title *</label>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="e.g. 2026-2027, 2027-2028"
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">Start Date *</label>
              <input
                type="date"
                value={sessionStart}
                onChange={e => setSessionStart(e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1.5 block">End Date *</label>
              <input
                type="date"
                value={sessionEnd}
                onChange={e => setSessionEnd(e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={sessionIsCurrent}
              onChange={e => setSessionIsCurrent(e.target.checked)}
              className="rounded border-border text-rose-600 focus:ring-rose-500"
            />
            <span>Set as Currently Active School Session</span>
          </label>

          <button
            onClick={createAcademicSession}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/25 hover:brightness-110 transition disabled:opacity-50"
          >
            {busy ? 'Activating...' : 'Activate Session'}
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
