import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, BookOpen, Users, X, Loader2, Search, Filter,
  GraduationCap, UserCheck, MapPin, Layers, ChevronRight, Edit2,
  CheckCircle, AlertCircle, ShieldCheck, Sparkles, Building2,
  Tv, Wind, Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';
import { useNavigate } from 'react-router-dom';

interface Section {
  id: string;
  name: string;
  roomNo: string;
  floor?: string;
  capacity: number;
  enrolledCount: number;
  boysCount: number;
  girlsCount: number;
  classTeacher: string;
  teacherSubject: string;
  teacherPhone?: string;
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
  {
    id: 'cls-10',
    name: 'Class 10',
    wing: 'SENIOR',
    code: 'GRD-10',
    monthlyFee: 'Rs 8,500',
    coordinator: 'Academic Office',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-1',
        name: 'Section A (Alpha)',
        roomNo: 'Room 201',
        floor: '2nd Floor',
        capacity: 40,
        enrolledCount: 38,
        boysCount: 20,
        girlsCount: 18,
        classTeacher: 'Mr. Tariq Mehmood',
        teacherSubject: 'Physics',
        stream: 'Pre-Engineering / Medical',
        attendanceRate: '96%',
        hasSmartBoard: true,
        hasAC: true,
      },
      {
        id: 'sec-2',
        name: 'Section B (Beta)',
        roomNo: 'Room 202',
        floor: '2nd Floor',
        capacity: 40,
        enrolledCount: 36,
        boysCount: 19,
        girlsCount: 17,
        classTeacher: 'Ms. Fatima Sana',
        teacherSubject: 'Computer Science',
        stream: 'ICS / Computer Science',
        attendanceRate: '94%',
        hasSmartBoard: true,
        hasAC: false,
      },
    ],
  },
  {
    id: 'cls-9',
    name: 'Class 9',
    wing: 'SENIOR',
    code: 'GRD-09',
    monthlyFee: 'Rs 8,000',
    coordinator: 'Academic Office',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-3',
        name: 'Section A (Alpha)',
        roomNo: 'Room 105',
        floor: '1st Floor',
        capacity: 35,
        enrolledCount: 34,
        boysCount: 18,
        girlsCount: 16,
        classTeacher: 'Mr. Salman Ahmed',
        teacherSubject: 'Mathematics',
        stream: 'Science Core',
        attendanceRate: '92%',
        hasSmartBoard: true,
        hasAC: true,
      },
    ],
  },
  {
    id: 'cls-8',
    name: 'Class 8',
    wing: 'MIDDLE',
    code: 'GRD-08',
    monthlyFee: 'Rs 7,500',
    coordinator: 'Middle Wing In-charge',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-4',
        name: 'Section A (Rose)',
        roomNo: 'Room 101',
        floor: '1st Floor',
        capacity: 35,
        enrolledCount: 32,
        boysCount: 16,
        girlsCount: 16,
        classTeacher: 'Mrs. Hina Babar',
        teacherSubject: 'English',
        stream: 'Middle General',
        attendanceRate: '95%',
        hasSmartBoard: false,
        hasAC: true,
      },
    ],
  },
  {
    id: 'cls-7',
    name: 'Class 7',
    wing: 'MIDDLE',
    code: 'GRD-07',
    monthlyFee: 'Rs 7,000',
    coordinator: 'Middle Wing In-charge',
    createdAt: '2026-01-15',
    sections: [],
  },
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
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(readClasses(schoolSlug).map((item) => item.id)));
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ classId: string; section: Section } | null>(null);
  const [rosterTarget, setRosterTarget] = useState<{ cls: ClassItem; section: Section } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentModal, setStudentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ teacher: string; className: string; sectionName: string } | null>(null);

  const [classForm, setClassForm] = useState({
    name: '',
    wing: 'SENIOR' as ClassItem['wing'],
    monthlyFee: 'Rs 8,000',
    coordinator: '',
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    roomNo: '',
    capacity: '35',
    classTeacher: '',
    teacherSubject: '',
    stream: 'General Core',
    hasSmartBoard: false,
    hasAC: false,
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNo: '',
    gender: 'MALE' as Student['gender'],
    fatherName: '',
    phone: '',
    feeStatus: 'PAID' as Student['feeStatus'],
  });

  useEffect(() => {
    setClasses(readClasses(schoolSlug));
    apiClient
      .get('/people/staff')
      .then((response) => {
        const data = Array.isArray(response.data) ? response.data : [];
        setTeachers(
          data
            .filter((item: { designation?: string }) => item.designation === 'Teacher')
            .map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))
        );
      })
      .catch(() => setTeachers([]));
  }, [schoolSlug]);

  const persist = (next: ClassItem[]) => {
    setClasses(next);
    localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(next));
  };

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => {
      const wingMatch = wing === 'ALL' || item.wing === wing;
      const searchMatch =
        !query ||
        [
          item.name,
          item.code,
          item.coordinator,
          ...item.sections.map((section) => `${section.name} ${section.classTeacher} ${section.roomNo}`),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return wingMatch && searchMatch;
    });
  }, [classes, search, wing]);

  const totalSections = classes.reduce((sum, item) => sum + item.sections.length, 0);
  const totalStudents = classes.reduce(
    (sum, item) => sum + item.sections.reduce((inner, section) => inner + section.enrolledCount, 0),
    0
  );
  const totalCapacity = classes.reduce(
    (sum, item) => sum + item.sections.reduce((inner, section) => inner + section.capacity, 0),
    0
  );
  const occupancy = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const toggleExpanded = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addClass = (event: React.FormEvent) => {
    event.preventDefault();
    if (!classForm.name.trim()) return;
    setSaving(true);
    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: classForm.name.trim(),
      wing: classForm.wing,
      code: `GRD-${String(classes.length + 1).padStart(2, '0')}`,
      monthlyFee: classForm.monthlyFee.trim() || 'Rs 8,000',
      coordinator: classForm.coordinator.trim() || 'Academic Office',
      sections: [],
      createdAt: new Date().toISOString(),
    };
    persist([newClass, ...classes]);
    setExpanded((previous) => new Set(previous).add(newClass.id));
    setClassModal(false);
    setClassForm({ name: '', wing: 'SENIOR', monthlyFee: 'Rs 8,000', coordinator: '' });
    setSaving(false);
    toast.success(`${newClass.name} created successfully!`);
  };

  const deleteClass = (item: ClassItem) => {
    if (!window.confirm(`Delete ${item.name} and all its sections?`)) return;
    persist(classes.filter((current) => current.id !== item.id));
    toast.success(`${item.name} deleted`);
  };

  const openSection = (classId: string) => {
    setConflict(null);
    setSectionForm({
      name: '',
      roomNo: '',
      capacity: '35',
      classTeacher: teachers[0]?.name || '',
      teacherSubject: '',
      stream: 'General Core',
      hasSmartBoard: false,
      hasAC: false,
    });
    setSectionModal(classId);
  };

  const saveSection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sectionModal || !sectionForm.name.trim()) return;
    const duplicate = classes
      .flatMap((item) => item.sections.map((section) => ({ section, item })))
      .find(({ section }) => section.classTeacher && section.classTeacher === sectionForm.classTeacher);

    if (duplicate) {
      setConflict({
        teacher: duplicate.section.classTeacher,
        className: duplicate.item.name,
        sectionName: duplicate.section.name,
      });
      return;
    }

    setSaving(true);
    const section: Section = {
      id: `sec-${Date.now()}`,
      name: sectionForm.name.trim(),
      roomNo: sectionForm.roomNo.trim() || 'TBD',
      floor: 'Ground / Main Campus',
      capacity: Math.max(1, Number(sectionForm.capacity) || 35),
      enrolledCount: 0,
      boysCount: 0,
      girlsCount: 0,
      classTeacher: sectionForm.classTeacher,
      teacherSubject: sectionForm.teacherSubject,
      stream: sectionForm.stream || 'General Core',
      attendanceRate: '100%',
      hasSmartBoard: sectionForm.hasSmartBoard,
      hasAC: sectionForm.hasAC,
    };

    persist(
      classes.map((item) =>
        item.id === sectionModal ? { ...item, sections: [...item.sections, section] } : item
      )
    );
    setSectionModal(null);
    setSaving(false);
    toast.success(`${section.name} added successfully`);
  };

  const openEdit = (classId: string, section: Section) => {
    setEditTarget({ classId, section });
    setSectionForm({
      name: section.name,
      roomNo: section.roomNo,
      capacity: String(section.capacity),
      classTeacher: section.classTeacher,
      teacherSubject: section.teacherSubject,
      stream: section.stream,
      hasSmartBoard: section.hasSmartBoard,
      hasAC: section.hasAC,
    });
  };

  const saveEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTarget) return;
    const updated = classes.map((item) =>
      item.id === editTarget.classId
        ? {
            ...item,
            sections: item.sections.map((section) =>
              section.id === editTarget.section.id
                ? {
                    ...section,
                    name: sectionForm.name.trim() || section.name,
                    roomNo: sectionForm.roomNo.trim() || section.roomNo,
                    capacity: Math.max(1, Number(sectionForm.capacity) || section.capacity),
                    classTeacher: sectionForm.classTeacher,
                    teacherSubject: sectionForm.teacherSubject,
                    stream: sectionForm.stream,
                    hasSmartBoard: sectionForm.hasSmartBoard,
                    hasAC: sectionForm.hasAC,
                  }
                : section
            ),
          }
        : item
    );
    persist(updated);
    setEditTarget(null);
    toast.success('Section updated successfully');
  };

  const deleteSection = (classId: string, section: Section) => {
    if (!window.confirm(`Delete section ${section.name}?`)) return;
    localStorage.removeItem(STUDENTS_KEY(schoolSlug, section.id));
    persist(
      classes.map((item) =>
        item.id === classId ? { ...item, sections: item.sections.filter((c) => c.id !== section.id) } : item
      )
    );
    toast.success(`${section.name} removed`);
  };

  const openRoster = (cls: ClassItem, section: Section) => {
    setRosterTarget({ cls, section });
    setStudents(readStudents(schoolSlug, section.id));
    setStudentModal(false);
    setStudentForm({
      name: '',
      rollNo: '',
      gender: 'MALE',
      fatherName: '',
      phone: '',
      feeStatus: 'PAID',
    });
  };

  const addStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rosterTarget || !studentForm.name.trim()) return;
    const next: Student = {
      id: `stu-${Date.now()}`,
      rollNo: studentForm.rollNo || String(students.length + 1).padStart(2, '0'),
      name: studentForm.name.trim(),
      gender: studentForm.gender,
      fatherName: studentForm.fatherName.trim(),
      phone: studentForm.phone.trim(),
      feeStatus: studentForm.feeStatus,
      enrolledAt: new Date().toISOString().slice(0, 10),
    };
    const roster = [...students, next];
    setStudents(roster);
    localStorage.setItem(STUDENTS_KEY(schoolSlug, rosterTarget.section.id), JSON.stringify(roster));
    persist(
      classes.map((item) =>
        item.id === rosterTarget.cls.id
          ? {
              ...item,
              sections: item.sections.map((section) =>
                section.id === rosterTarget.section.id
                  ? {
                      ...section,
                      enrolledCount: roster.length,
                      boysCount: roster.filter((s) => s.gender === 'MALE').length,
                      girlsCount: roster.filter((s) => s.gender === 'FEMALE').length,
                    }
                  : section
              ),
            }
          : item
      )
    );
    setStudentModal(false);
    setStudentForm({ name: '', rollNo: '', gender: 'MALE', fatherName: '', phone: '', feeStatus: 'PAID' });
    toast.success(`${next.name} enrolled`);
  };

  const removeStudent = (studentId: string) => {
    if (!rosterTarget || !window.confirm('Remove this student from the section roster?')) return;
    const roster = students.filter((s) => s.id !== studentId);
    setStudents(roster);
    localStorage.setItem(STUDENTS_KEY(schoolSlug, rosterTarget.section.id), JSON.stringify(roster));
    persist(
      classes.map((item) =>
        item.id === rosterTarget.cls.id
          ? {
              ...item,
              sections: item.sections.map((section) =>
                section.id === rosterTarget.section.id
                  ? {
                      ...section,
                      enrolledCount: roster.length,
                      boysCount: roster.filter((s) => s.gender === 'MALE').length,
                      girlsCount: roster.filter((s) => s.gender === 'FEMALE').length,
                    }
                  : section
              ),
            }
          : item
      )
    );
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShieldCheck size={12} /> Academic Wings & Classes
            </span>
            <span className="text-xs text-muted-foreground">• Roster & Classrooms</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Classes & Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage academic grades, classroom facilities, appointed teachers, and enrollment rosters.
          </p>
        </div>

        <button
          onClick={() => setClassModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          <Plus size={15} /> Add New Grade
        </button>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Academic Grades</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{classes.length}</p>
          <span className="text-xs text-muted-foreground font-semibold">Active curriculums</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Classroom Sections</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{totalSections}</p>
          <span className="text-xs text-muted-foreground font-semibold">Operational wings</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Total Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{totalStudents}</p>
          <span className="text-xs text-emerald-600 font-semibold">Active students</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Campus Occupancy</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{occupancy}%</p>
          <span className="text-xs text-muted-foreground font-semibold">{totalCapacity} total seats</span>
        </div>
      </div>

      {/* ─── Search & Wing Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search grade, section, room or teacher..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={14} className="mr-1 text-muted-foreground" />
          {(['ALL', 'SENIOR', 'MIDDLE', 'PRIMARY', 'COLLEGE'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setWing(option)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                wing === option
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {option === 'ALL' ? 'All Wings' : option[0] + option.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Classes Accordion List ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredClasses.map((item, index) => {
          const isOpen = expanded.has(item.id);
          const enrolled = item.sections.reduce((sum, section) => sum + section.enrolledCount, 0);
          const capacity = item.sections.reduce((sum, section) => sum + section.capacity, 0);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:border-border/80"
            >
              {/* Class Header */}
              <div
                className="flex cursor-pointer flex-col gap-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-transparent to-transparent p-5 sm:p-6 md:flex-row md:items-center md:justify-between"
                onClick={() => toggleExpanded(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-xl font-black text-white shadow-md shadow-violet-600/20">
                    {item.name.replace(/\D/g, '') || item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-foreground">{item.name}</h2>
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-violet-500">
                        {item.wing}
                      </span>
                      <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {item.code}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Coordinator: {item.coordinator} • {enrolled}/{capacity || 0} seats enrolled • Fee: {item.monthlyFee}/month
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      openSection(item.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-600 hover:bg-violet-500/20 transition-all"
                  >
                    <Plus size={14} /> Add Section
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteClass(item);
                    }}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                    title={`Delete ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight
                    size={19}
                    className={`text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-primary' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Sections Expansion */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                      {item.sections.length ? (
                        item.sections.map((section) => (
                          <div
                            key={section.id}
                            className="rounded-2xl border border-border bg-background/60 p-4 hover:border-violet-500/30 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-black text-foreground">{section.name}</h3>
                                  <p className="mt-0.5 text-[11px] text-violet-500 font-semibold">{section.stream}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${section.id}`)}
                                    className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                                    title="Mark attendance"
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    onClick={() => openEdit(item.id, section)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                    title="Edit section"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => deleteSection(item.id, section)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                    title="Delete section"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl border border-border bg-card p-2.5">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                    <MapPin size={12} className="text-violet-500" />
                                    <span className="text-[10px] font-bold uppercase">Room</span>
                                  </div>
                                  <b className="text-foreground">{section.roomNo}</b>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-2.5">
                                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                    <UserCheck size={12} className="text-violet-500" />
                                    <span className="text-[10px] font-bold uppercase">Teacher</span>
                                  </div>
                                  <b className="block truncate text-foreground">{section.classTeacher || 'Unassigned'}</b>
                                </div>
                              </div>

                              <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                                {section.hasSmartBoard && (
                                  <span className="inline-flex items-center gap-1 text-violet-500 font-semibold">
                                    <Tv size={12} /> Smart Board
                                  </span>
                                )}
                                {section.hasAC && (
                                  <span className="inline-flex items-center gap-1 text-sky-500 font-semibold">
                                    <Wind size={12} /> AC
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border">
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-bold text-foreground">
                                  {section.enrolledCount} / {section.capacity} students
                                </span>
                                <span className="text-emerald-500 font-semibold">{section.attendanceRate} turn-out</span>
                              </div>
                              <button
                                onClick={() => openRoster(item, section)}
                                className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Users size={14} /> View Student Roster
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-8 text-center bg-card/30">
                          <Layers size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                          <p className="font-bold text-foreground">No sections created yet</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Click "Add Section" above to open a classroom section.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
          <Search size={30} className="mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-bold text-foreground">No classes found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search query or wing filter.</p>
        </div>
      )}

      {/* ─── Modal 1: Add New Grade ───────────────────────────────────────────── */}
      <Modal isOpen={classModal} onClose={() => setClassModal(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<BookOpen size={19} />}
          title="Add New Academic Grade"
          subtitle="Create a new grade level for the school"
          onClose={() => setClassModal(false)}
        />
        <form onSubmit={addClass} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Grade Name *</label>
            <input
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Class 11 / First Year"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Wing</label>
              <select
                value={classForm.wing}
                onChange={(e) => setClassForm({ ...classForm, wing: e.target.value as ClassItem['wing'] })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              >
                <option value="PRIMARY">PRIMARY</option>
                <option value="MIDDLE">MIDDLE</option>
                <option value="SENIOR">SENIOR</option>
                <option value="COLLEGE">COLLEGE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Monthly Fee</label>
              <input
                value={classForm.monthlyFee}
                onChange={(e) => setClassForm({ ...classForm, monthlyFee: e.target.value })}
                placeholder="Rs 8,000"
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Coordinator / In-charge</label>
            <input
              value={classForm.coordinator}
              onChange={(e) => setClassForm({ ...classForm, coordinator: e.target.value })}
              placeholder="Academic Coordinator Name"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClassModal(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : 'Create Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 2: Add / Edit Section ──────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(sectionModal || editTarget)}
        onClose={() => {
          setSectionModal(null);
          setEditTarget(null);
        }}
        maxWidth="max-w-lg"
      >
        <ModalHeader
          icon={editTarget ? <Edit2 size={19} /> : <Layers size={19} />}
          title={editTarget ? 'Edit Classroom Section' : 'Add Section'}
          subtitle="Configure classroom capacity, teacher and facilities"
          onClose={() => {
            setSectionModal(null);
            setEditTarget(null);
          }}
        />
        <form onSubmit={editTarget ? saveEdit : saveSection} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Section Name *</label>
            <input
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. Section A (Alpha)"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Room Number</label>
              <input
                value={sectionForm.roomNo}
                onChange={(e) => setSectionForm({ ...sectionForm, roomNo: e.target.value })}
                placeholder="e.g. Room 204"
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Student Capacity</label>
              <input
                type="number"
                min="1"
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Class Teacher</label>
            <select
              value={sectionForm.classTeacher}
              onChange={(e) => {
                setSectionForm({ ...sectionForm, classTeacher: e.target.value });
                setConflict(null);
              }}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Choose Assigned Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {conflict && (
            <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                {conflict.teacher} is already appointed to {conflict.className} — {conflict.sectionName}.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Stream / Major</label>
              <input
                value={sectionForm.stream}
                onChange={(e) => setSectionForm({ ...sectionForm, stream: e.target.value })}
                placeholder="e.g. Pre-Engineering"
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Subject Specialization</label>
              <input
                value={sectionForm.teacherSubject}
                onChange={(e) => setSectionForm({ ...sectionForm, teacherSubject: e.target.value })}
                placeholder="e.g. Physics"
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-5 text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionForm.hasSmartBoard}
                onChange={(e) => setSectionForm({ ...sectionForm, hasSmartBoard: e.target.checked })}
                className="rounded border-border"
              />
              <span className="font-semibold text-foreground">Interactive Smart Board</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionForm.hasAC}
                onChange={(e) => setSectionForm({ ...sectionForm, hasAC: e.target.checked })}
                className="rounded border-border"
              />
              <span className="font-semibold text-foreground">Air Conditioned</span>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setSectionModal(null);
                setEditTarget(null);
              }}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : editTarget ? 'Save Changes' : 'Add Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 3: Section Student Roster ─────────────────────────────────── */}
      <Modal
        isOpen={Boolean(rosterTarget)}
        onClose={() => setRosterTarget(null)}
        maxWidth="max-w-4xl"
      >
        {rosterTarget && (
          <div>
            <ModalHeader
              icon={<Users size={19} />}
              title={`${rosterTarget.cls.name} — ${rosterTarget.section.name}`}
              subtitle={`${students.length} students enrolled • Max capacity ${rosterTarget.section.capacity}`}
              onClose={() => setRosterTarget(null)}
            />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Class Teacher: {rosterTarget.section.classTeacher || 'Unassigned'} • Room {rosterTarget.section.roomNo}
                </span>
                <button
                  onClick={() => setStudentModal((prev) => !prev)}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 flex items-center gap-1"
                >
                  <Plus size={14} /> Enroll Student
                </button>
              </div>

              {studentModal && (
                <form
                  onSubmit={addStudent}
                  className="mb-4 grid gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Student Name *</label>
                    <input
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="Student full name"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Roll Number</label>
                    <input
                      value={studentForm.rollNo}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                      placeholder="e.g. 01"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Gender</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as Student['gender'] })}
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Father / Guardian</label>
                    <input
                      value={studentForm.fatherName}
                      onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                      placeholder="Guardian name"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-foreground mb-1">Parent Phone</label>
                    <input
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      placeholder="0300-1234567"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-primary p-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                    >
                      Save & Add to Roster
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-bold uppercase text-muted-foreground text-[10px]">
                    <tr>
                      <th className="p-3">Roll</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Parent</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-accent/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{student.rollNo}</td>
                        <td className="p-3 font-bold text-foreground">{student.name}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              student.gender === 'MALE'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-pink-500/10 text-pink-500'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{student.fatherName || '—'}</td>
                        <td className="p-3 text-muted-foreground font-mono">{student.phone || '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => removeStudent(student.id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Remove student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <p className="p-8 text-center text-xs text-muted-foreground">
                    No students enrolled in this roster yet. Click "Enroll Student" to begin.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
