import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen, Users, X, Loader2, Search, Filter, GraduationCap, UserCheck, MapPin, Layers, ChevronRight, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';
import { useNavigate } from 'react-router-dom';

interface Section {
  id: string;
  name: string;
  roomNo: string;
  floor: string;
  capacity: number;
  enrolledCount: number;
  boysCount: number;
  girlsCount: number;
  classTeacher: string;
  teacherSubject: string;
  teacherPhone: string;
  stream: string;
  attendanceRate: string;
  hasSmartBoard: boolean;
  hasAC: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  wing: 'PRIMARY' | 'MIDDLE' | 'SENIOR' | 'COLLEGE';
  code: string;
  monthlyFee: string;
  coordinator: string;
  sections: Section[];
  createdAt: string;
}

interface Student {
  id: string;
  rollNo: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  fatherName: string;
  phone: string;
  feeStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  enrolledAt: string;
}

const STORAGE_KEY = (slug: string) => `edusphere_classes_${slug}`;
const STUDENTS_KEY = (slug: string, sectionId: string) => `edusphere_students_${slug}_${sectionId}`;

const DEFAULT_CLASSES: ClassItem[] = [
  { id: 'cls-10', name: 'Class 10', wing: 'SENIOR', code: 'GRD-10', monthlyFee: 'Rs 8,500', coordinator: 'Academic Office', createdAt: '2026-01-15', sections: [] },
  { id: 'cls-9', name: 'Class 9', wing: 'SENIOR', code: 'GRD-09', monthlyFee: 'Rs 8,000', coordinator: 'Academic Office', createdAt: '2026-01-15', sections: [] },
  { id: 'cls-8', name: 'Class 8', wing: 'MIDDLE', code: 'GRD-08', monthlyFee: 'Rs 7,500', coordinator: 'Academic Office', createdAt: '2026-01-15', sections: [] },
  { id: 'cls-7', name: 'Class 7', wing: 'MIDDLE', code: 'GRD-07', monthlyFee: 'Rs 7,000', coordinator: 'Academic Office', createdAt: '2026-01-15', sections: [] },
];

function readClasses(slug: string): ClassItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(slug));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as ClassItem[];
    }
  } catch (error) {
    console.error('Failed to read classes:', error);
  }
  localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(DEFAULT_CLASSES));
  return DEFAULT_CLASSES;
}

function readStudents(slug: string, sectionId: string): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY(slug, sectionId));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Student[];
    }
  } catch (error) {
    console.error('Failed to read roster:', error);
  }
  return [];
}

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schoolSlug = user?.schoolSlug || 'demo';
  const [classes, setClasses] = useState<ClassItem[]>(() => readClasses(schoolSlug));
  const [search, setSearch] = useState('');
  const [wing, setWing] = useState<'ALL' | ClassItem['wing']>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(readClasses(schoolSlug).map(item => item.id)));
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ classId: string; section: Section } | null>(null);
  const [rosterTarget, setRosterTarget] = useState<{ cls: ClassItem; section: Section } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentModal, setStudentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ teacher: string; className: string; sectionName: string } | null>(null);
  const [classForm, setClassForm] = useState({ name: '', wing: 'SENIOR' as ClassItem['wing'], monthlyFee: 'Rs 8,000', coordinator: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', roomNo: '', capacity: '35', classTeacher: '', teacherSubject: '', stream: 'General Core', hasSmartBoard: false, hasAC: false });
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', gender: 'MALE' as Student['gender'], fatherName: '', phone: '', feeStatus: 'PAID' as Student['feeStatus'] });

  useEffect(() => {
    setClasses(readClasses(schoolSlug));
    apiClient.get('/people/staff')
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : [];
        setTeachers(data.filter((item: { designation?: string }) => item.designation === 'Teacher').map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })));
      })
      .catch(() => setTeachers([]));
  }, [schoolSlug]);

  const persist = (next: ClassItem[]) => {
    setClasses(next);
    localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(next));
  };

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter(item => {
      const wingMatch = wing === 'ALL' || item.wing === wing;
      const searchMatch = !query || [item.name, item.code, item.coordinator, ...item.sections.map(section => `${section.name} ${section.classTeacher} ${section.roomNo}`)].join(' ').toLowerCase().includes(query);
      return wingMatch && searchMatch;
    });
  }, [classes, search, wing]);

  const totalSections = classes.reduce((sum, item) => sum + item.sections.length, 0);
  const totalStudents = classes.reduce((sum, item) => sum + item.sections.reduce((inner, section) => inner + section.enrolledCount, 0), 0);
  const totalCapacity = classes.reduce((sum, item) => sum + item.sections.reduce((inner, section) => inner + section.capacity, 0), 0);
  const occupancy = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const toggleExpanded = (id: string) => setExpanded(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const addClass = (event: React.FormEvent) => {
    event.preventDefault();
    if (!classForm.name.trim()) return;
    setSaving(true);
    const newClass: ClassItem = { id: `cls-${Date.now()}`, name: classForm.name.trim(), wing: classForm.wing, code: `GRD-${String(classes.length + 1).padStart(2, '0')}`, monthlyFee: classForm.monthlyFee.trim() || 'Rs 8,000', coordinator: classForm.coordinator.trim() || 'Academic Office', sections: [], createdAt: new Date().toISOString() };
    persist([newClass, ...classes]);
    setExpanded(previous => new Set(previous).add(newClass.id));
    setClassModal(false);
    setClassForm({ name: '', wing: 'SENIOR', monthlyFee: 'Rs 8,000', coordinator: '' });
    setSaving(false);
    toast.success(`${newClass.name} created`);
  };

  const deleteClass = (item: ClassItem) => {
    if (!window.confirm(`Delete ${item.name} and its sections?`)) return;
    persist(classes.filter(current => current.id !== item.id));
    toast.success(`${item.name} deleted`);
  };

  const openSection = (classId: string) => {
    setConflict(null);
    setSectionForm({ name: '', roomNo: '', capacity: '35', classTeacher: teachers[0]?.name || '', teacherSubject: '', stream: 'General Core', hasSmartBoard: false, hasAC: false });
    setSectionModal(classId);
  };

  const saveSection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sectionModal || !sectionForm.name.trim()) return;
    const duplicate = classes.flatMap(item => item.sections.map(section => ({ section, item }))).find(({ section }) => section.classTeacher && section.classTeacher === sectionForm.classTeacher);
    if (duplicate) {
      setConflict({ teacher: duplicate.section.classTeacher, className: duplicate.item.name, sectionName: duplicate.section.name });
      return;
    }
    setSaving(true);
    const section: Section = { id: `sec-${Date.now()}`, name: sectionForm.name.trim(), roomNo: sectionForm.roomNo.trim() || 'TBD', floor: 'Ground / Main Campus', capacity: Math.max(1, Number(sectionForm.capacity) || 35), enrolledCount: 0, boysCount: 0, girlsCount: 0, classTeacher: sectionForm.classTeacher, teacherSubject: sectionForm.teacherSubject, teacherPhone: '', stream: sectionForm.stream || 'General Core', attendanceRate: '100%', hasSmartBoard: sectionForm.hasSmartBoard, hasAC: sectionForm.hasAC };
    persist(classes.map(item => item.id === sectionModal ? { ...item, sections: [...item.sections, section] } : item));
    setSectionModal(null);
    setSaving(false);
    toast.success(`${section.name} added`);
  };

  const openEdit = (classId: string, section: Section) => {
    setEditTarget({ classId, section });
    setSectionForm({ name: section.name, roomNo: section.roomNo, capacity: String(section.capacity), classTeacher: section.classTeacher, teacherSubject: section.teacherSubject, stream: section.stream, hasSmartBoard: section.hasSmartBoard, hasAC: section.hasAC });
  };

  const saveEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTarget) return;
    const updated = classes.map(item => item.id === editTarget.classId ? { ...item, sections: item.sections.map(section => section.id === editTarget.section.id ? { ...section, name: sectionForm.name.trim() || section.name, roomNo: sectionForm.roomNo.trim() || section.roomNo, capacity: Math.max(1, Number(sectionForm.capacity) || section.capacity), classTeacher: sectionForm.classTeacher, teacherSubject: sectionForm.teacherSubject, stream: sectionForm.stream, hasSmartBoard: sectionForm.hasSmartBoard, hasAC: sectionForm.hasAC } : section) } : item);
    persist(updated);
    setEditTarget(null);
    toast.success('Section updated');
  };

  const deleteSection = (classId: string, section: Section) => {
    if (!window.confirm(`Delete ${section.name}?`)) return;
    localStorage.removeItem(STUDENTS_KEY(schoolSlug, section.id));
    persist(classes.map(item => item.id === classId ? { ...item, sections: item.sections.filter(current => current.id !== section.id) } : item));
    toast.success(`${section.name} deleted`);
  };

  const openRoster = (cls: ClassItem, section: Section) => {
    setRosterTarget({ cls, section });
    setStudents(readStudents(schoolSlug, section.id));
    setStudentModal(false);
    setStudentForm({ name: '', rollNo: '', gender: 'MALE', fatherName: '', phone: '', feeStatus: 'PAID' });
  };

  const addStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rosterTarget || !studentForm.name.trim()) return;
    const next: Student = { id: `stu-${Date.now()}`, rollNo: studentForm.rollNo || String(students.length + 1).padStart(2, '0'), name: studentForm.name.trim(), gender: studentForm.gender, fatherName: studentForm.fatherName.trim(), phone: studentForm.phone.trim(), feeStatus: studentForm.feeStatus, enrolledAt: new Date().toISOString().slice(0, 10) };
    const roster = [...students, next];
    setStudents(roster);
    localStorage.setItem(STUDENTS_KEY(schoolSlug, rosterTarget.section.id), JSON.stringify(roster));
    persist(classes.map(item => item.id === rosterTarget.cls.id ? { ...item, sections: item.sections.map(section => section.id === rosterTarget.section.id ? { ...section, enrolledCount: roster.length, boysCount: roster.filter(student => student.gender === 'MALE').length, girlsCount: roster.filter(student => student.gender === 'FEMALE').length } : section) } : item));
    setStudentModal(false);
    setStudentForm({ name: '', rollNo: '', gender: 'MALE', fatherName: '', phone: '', feeStatus: 'PAID' });
    toast.success(`${next.name} enrolled`);
  };

  const removeStudent = (studentId: string) => {
    if (!rosterTarget || !window.confirm('Remove this student from the roster?')) return;
    const roster = students.filter(student => student.id !== studentId);
    setStudents(roster);
    localStorage.setItem(STUDENTS_KEY(schoolSlug, rosterTarget.section.id), JSON.stringify(roster));
    persist(classes.map(item => item.id === rosterTarget.cls.id ? { ...item, sections: item.sections.map(section => section.id === rosterTarget.section.id ? { ...section, enrolledCount: roster.length, boysCount: roster.filter(student => student.gender === 'MALE').length, girlsCount: roster.filter(student => student.gender === 'FEMALE').length } : section) } : item));
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-7 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" /><span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Academic Structure</span></div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Classes & Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage grades, classrooms, teachers and student rosters.</p>
        </div>
        <button onClick={() => setClassModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg"><Plus size={16} /> Add New Grade</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Grades', classes.length, BookOpen], ['Sections', totalSections, Layers], ['Students', totalStudents, Users], ['Occupancy', `${occupancy}%`, GraduationCap]].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={19} /></div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-2xl font-black text-foreground">{value}</p></div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search grade, section, room or teacher..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" /></div>
        <div className="flex flex-wrap items-center gap-1.5"><Filter size={14} className="mr-1 text-muted-foreground" />{(['ALL', 'SENIOR', 'MIDDLE', 'PRIMARY', 'COLLEGE'] as const).map(option => <button key={option} onClick={() => setWing(option)} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${wing === option ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'}`}>{option === 'ALL' ? 'All' : option[0] + option.slice(1).toLowerCase()}</button>)}</div>
      </div>

      <div className="space-y-4">
        {filteredClasses.map((item, index) => {
          const isOpen = expanded.has(item.id);
          const enrolled = item.sections.reduce((sum, section) => sum + section.enrolledCount, 0);
          const capacity = item.sections.reduce((sum, section) => sum + section.capacity, 0);
          return <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex cursor-pointer flex-col gap-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent p-5 sm:p-6 md:flex-row md:items-center md:justify-between" onClick={() => toggleExpanded(item.id)}>
              <div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-xl font-black text-white">{item.name.replace(/\D/g, '') || item.name.charAt(0)}</div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{item.name}</h2><span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">{item.wing}</span><span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{item.code}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.coordinator} · {enrolled}/{capacity || 0} seats · {item.monthlyFee}/month</p></div></div>
              <div className="flex items-center gap-2 self-start md:self-auto"><button onClick={event => { event.stopPropagation(); openSection(item.id); }} className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"><Plus size={14} /> Section</button><button onClick={event => { event.stopPropagation(); deleteClass(item); }} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${item.name}`}><Trash2 size={16} /></button><ChevronRight size={19} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-90 text-primary' : ''}`} /></div>
            </div>
            <AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">{item.sections.length ? item.sections.map(section => <div key={section.id} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-black">{section.name}</h3><p className="mt-0.5 text-[11px] text-primary">{section.stream}</p></div><div className="flex gap-1"><button onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${section.id}`)} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10" title="Mark attendance"><CheckCircle size={14} /></button><button onClick={() => openEdit(item.id, section)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent" title="Edit section"><Edit2 size={14} /></button><button onClick={() => deleteSection(item.id, section)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete section"><Trash2 size={14} /></button></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-border bg-card p-3"><MapPin size={13} className="mb-1 text-primary" /><b>{section.roomNo}</b><p className="text-muted-foreground">Classroom</p></div><div className="rounded-xl border border-border bg-card p-3"><UserCheck size={13} className="mb-1 text-primary" /><b className="block truncate">{section.classTeacher || 'Unassigned'}</b><p className="text-muted-foreground">Class Teacher</p></div></div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold">{section.enrolledCount}/{section.capacity} students</span><span className="text-muted-foreground">{section.attendanceRate} attendance</span></div><button onClick={() => openRoster(item, section)} className="mt-3 w-full rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground"><Users size={14} className="mr-1 inline" /> View Student Roster</button></div>) : <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-10 text-center"><Layers size={28} className="mx-auto mb-2 text-muted-foreground/50" /><p className="font-bold">No sections yet</p><p className="mt-1 text-xs text-muted-foreground">Add a classroom section to start enrollment.</p></div>}</div></motion.div>}</AnimatePresence>
          </motion.div>;
        })}
      </div>

      {filteredClasses.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center"><Search size={30} className="mx-auto mb-3 text-muted-foreground/50" /><p className="font-bold">No classes found</p><p className="mt-1 text-sm text-muted-foreground">Try another search or wing filter.</p></div>}

      <Modal isOpen={classModal} onClose={() => setClassModal(false)} maxWidth="max-w-md"><ModalHeader icon={<BookOpen size={19} />} title="Add New Grade" subtitle="Create an academic grade" onClose={() => setClassModal(false)} /><form onSubmit={addClass} className="space-y-4 p-6"><input required value={classForm.name} onChange={event => setClassForm({ ...classForm, name: event.target.value })} placeholder="e.g. Class 11" className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><div className="grid grid-cols-2 gap-3"><select value={classForm.wing} onChange={event => setClassForm({ ...classForm, wing: event.target.value as ClassItem['wing'] })} className="rounded-xl border border-border bg-background p-3 text-sm"><option>PRIMARY</option><option>MIDDLE</option><option>SENIOR</option><option>COLLEGE</option></select><input value={classForm.monthlyFee} onChange={event => setClassForm({ ...classForm, monthlyFee: event.target.value })} placeholder="Monthly fee" className="rounded-xl border border-border bg-background p-3 text-sm" /></div><input value={classForm.coordinator} onChange={event => setClassForm({ ...classForm, coordinator: event.target.value })} placeholder="Grade coordinator" className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><button disabled={saving} className="w-full rounded-xl bg-primary p-3 font-bold text-primary-foreground">{saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : 'Create Grade'}</button></form></Modal>

      <Modal isOpen={Boolean(sectionModal || editTarget)} onClose={() => { setSectionModal(null); setEditTarget(null); }} maxWidth="max-w-lg"><ModalHeader icon={editTarget ? <Edit2 size={19} /> : <Layers size={19} />} title={editTarget ? 'Edit Section' : 'Add Classroom Section'} subtitle="Assign room, teacher and capacity" onClose={() => { setSectionModal(null); setEditTarget(null); }} /><form onSubmit={editTarget ? saveEdit : saveSection} className="space-y-4 p-6"><input required value={sectionForm.name} onChange={event => setSectionForm({ ...sectionForm, name: event.target.value })} placeholder="Section name" className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><div className="grid grid-cols-2 gap-3"><input value={sectionForm.roomNo} onChange={event => setSectionForm({ ...sectionForm, roomNo: event.target.value })} placeholder="Room number" className="rounded-xl border border-border bg-background p-3 text-sm" /><input type="number" min="1" value={sectionForm.capacity} onChange={event => setSectionForm({ ...sectionForm, capacity: event.target.value })} placeholder="Capacity" className="rounded-xl border border-border bg-background p-3 text-sm" /></div><select value={sectionForm.classTeacher} onChange={event => { setSectionForm({ ...sectionForm, classTeacher: event.target.value }); setConflict(null); }} className="w-full rounded-xl border border-border bg-background p-3 text-sm"><option value="">Select teacher</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.name}>{teacher.name}</option>)}</select>{conflict && <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600"><AlertCircle size={16} className="shrink-0" />{conflict.teacher} is already assigned to {conflict.className} — {conflict.sectionName}.</div>}<input value={sectionForm.teacherSubject} onChange={event => setSectionForm({ ...sectionForm, teacherSubject: event.target.value })} placeholder="Subject specialization" className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><input value={sectionForm.stream} onChange={event => setSectionForm({ ...sectionForm, stream: event.target.value })} placeholder="Stream" className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={sectionForm.hasSmartBoard} onChange={event => setSectionForm({ ...sectionForm, hasSmartBoard: event.target.checked })} /> Smart Board</label><label className="flex items-center gap-2"><input type="checkbox" checked={sectionForm.hasAC} onChange={event => setSectionForm({ ...sectionForm, hasAC: event.target.checked })} /> AC</label></div><button disabled={saving} className="w-full rounded-xl bg-primary p-3 font-bold text-primary-foreground">{saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : editTarget ? 'Save Changes' : 'Add Section'}</button></form></Modal>

      <Modal isOpen={Boolean(rosterTarget)} onClose={() => setRosterTarget(null)} maxWidth="max-w-4xl">{rosterTarget && <div><ModalHeader icon={<Users size={19} />} title={`${rosterTarget.cls.name} — ${rosterTarget.section.name}`} subtitle={`${students.length} students enrolled`} onClose={() => setRosterTarget(null)} /><div className="p-6"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">Capacity {rosterTarget.section.capacity}</p><button onClick={() => setStudentModal(previous => !previous)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"><Plus size={14} className="mr-1 inline" /> Enroll Student</button></div>{studentModal && <form onSubmit={addStudent} className="mb-4 grid gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2"><input required value={studentForm.name} onChange={event => setStudentForm({ ...studentForm, name: event.target.value })} placeholder="Student full name" className="rounded-xl border border-border bg-background p-2.5 text-sm" /><input value={studentForm.rollNo} onChange={event => setStudentForm({ ...studentForm, rollNo: event.target.value })} placeholder="Roll no." className="rounded-xl border border-border bg-background p-2.5 text-sm" /><select value={studentForm.gender} onChange={event => setStudentForm({ ...studentForm, gender: event.target.value as Student['gender'] })} className="rounded-xl border border-border bg-background p-2.5 text-sm"><option value="MALE">Male</option><option value="FEMALE">Female</option></select><input value={studentForm.fatherName} onChange={event => setStudentForm({ ...studentForm, fatherName: event.target.value })} placeholder="Father / guardian" className="rounded-xl border border-border bg-background p-2.5 text-sm" /><input value={studentForm.phone} onChange={event => setStudentForm({ ...studentForm, phone: event.target.value })} placeholder="Parent phone" className="rounded-xl border border-border bg-background p-2.5 text-sm" /><button className="rounded-xl bg-primary p-2.5 font-bold text-primary-foreground sm:col-span-2">Save & Enroll</button></form>}<div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full text-left text-xs"><thead className="bg-muted/40 font-bold uppercase text-muted-foreground"><tr><th className="p-3">Roll</th><th className="p-3">Student</th><th className="p-3">Gender</th><th className="p-3">Parent</th><th className="p-3">Phone</th><th className="p-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">{students.map(student => <tr key={student.id}><td className="p-3 font-mono">{student.rollNo}</td><td className="p-3 font-bold">{student.name}</td><td className="p-3">{student.gender}</td><td className="p-3 text-muted-foreground">{student.fatherName || '—'}</td><td className="p-3 text-muted-foreground">{student.phone || '—'}</td><td className="p-3 text-right"><button onClick={() => removeStudent(student.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" title="Remove student"><Trash2 size={14} /></button></td></tr>)}</tbody></table>{students.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No students enrolled in this roster yet.</p>}</div></div></div>}</Modal>
    </div>
  );
}
