import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, BookOpen, Users, X, Loader2, Search, Filter,
  GraduationCap, UserCheck, MapPin, Layers, ChevronRight, Phone,
  Download, Edit2, Check, CheckCircle, AlertCircle, RotateCcw, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Interfaces ────────────────────────────────────────────────────────────────

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
  attendanceRate: string;
  enrolledAt: string;
}

// ─── Default Realistic Seed Data ───────────────────────────────────────────────

const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: 'cls-10',
    name: 'Class 10',
    wing: 'SENIOR',
    code: 'GRD-10',
    monthlyFee: 'Rs 8,500',
    coordinator: 'Prof. Tariq Mehmood',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-10a',
        name: 'Section A (Alpha)',
        roomNo: 'Room 204',
        floor: '2nd Floor, Block B',
        capacity: 40,
        enrolledCount: 38,
        boysCount: 20,
        girlsCount: 18,
        classTeacher: 'Dr. Ananya Roy',
        teacherSubject: 'Physics & Applied Math',
        teacherPhone: '+92 301 5544332',
        stream: 'Pre-Medical & Engineering',
        attendanceRate: '96.8%',
        hasSmartBoard: true,
        hasAC: true,
      },
      {
        id: 'sec-10b',
        name: 'Section B (Beta)',
        roomNo: 'Room 205',
        floor: '2nd Floor, Block B',
        capacity: 40,
        enrolledCount: 36,
        boysCount: 19,
        girlsCount: 17,
        classTeacher: 'Mr. Asad Ali',
        teacherSubject: 'Computer Science',
        teacherPhone: '+92 322 9988771',
        stream: 'ICS & Software Tech',
        attendanceRate: '94.2%',
        hasSmartBoard: true,
        hasAC: true,
      },
      {
        id: 'sec-10c',
        name: 'Section C (Gamma)',
        roomNo: 'Room 206',
        floor: '2nd Floor, Block B',
        capacity: 35,
        enrolledCount: 32,
        boysCount: 15,
        girlsCount: 17,
        classTeacher: 'Mrs. Sabeen Shah',
        teacherSubject: 'English Literature',
        teacherPhone: '+92 333 4455667',
        stream: 'Humanities & Commerce',
        attendanceRate: '93.5%',
        hasSmartBoard: false,
        hasAC: true,
      },
    ],
  },
  {
    id: 'cls-9',
    name: 'Class 9',
    wing: 'SENIOR',
    code: 'GRD-09',
    monthlyFee: 'Rs 8,000',
    coordinator: 'Dr. Farhana Siddiqui',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-9a',
        name: 'Section A',
        roomNo: 'Room 102',
        floor: '1st Floor, Block A',
        capacity: 38,
        enrolledCount: 35,
        boysCount: 18,
        girlsCount: 17,
        classTeacher: 'Dr. Farhana Siddiqui',
        teacherSubject: 'Chemistry & Biology',
        teacherPhone: '+92 300 1239874',
        stream: 'Bio-Science Focus',
        attendanceRate: '95.5%',
        hasSmartBoard: true,
        hasAC: true,
      },
      {
        id: 'sec-9b',
        name: 'Section B',
        roomNo: 'Room 103',
        floor: '1st Floor, Block A',
        capacity: 38,
        enrolledCount: 34,
        boysCount: 17,
        girlsCount: 17,
        classTeacher: 'Mr. Kamran Javed',
        teacherSubject: 'Mathematics',
        teacherPhone: '+92 321 4567890',
        stream: 'General Science & IT',
        attendanceRate: '92.8%',
        hasSmartBoard: true,
        hasAC: false,
      },
    ],
  },
  {
    id: 'cls-8',
    name: 'Class 8',
    wing: 'MIDDLE',
    code: 'GRD-08',
    monthlyFee: 'Rs 7,500',
    coordinator: 'Mrs. Aisha Malik',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-8a',
        name: 'Section A',
        roomNo: 'Room 108',
        floor: '1st Floor, Block C',
        capacity: 35,
        enrolledCount: 33,
        boysCount: 17,
        girlsCount: 16,
        classTeacher: 'Mrs. Aisha Malik',
        teacherSubject: 'General Science',
        teacherPhone: '+92 345 6789012',
        stream: 'Middle Foundation Core',
        attendanceRate: '96.0%',
        hasSmartBoard: true,
        hasAC: true,
      },
      {
        id: 'sec-8b',
        name: 'Section B',
        roomNo: 'Room 109',
        floor: '1st Floor, Block C',
        capacity: 35,
        enrolledCount: 31,
        boysCount: 16,
        girlsCount: 15,
        classTeacher: 'Mr. Zahid Bashir',
        teacherSubject: 'History & Pak Studies',
        teacherPhone: '+92 311 8899001',
        stream: 'Middle Foundation Core',
        attendanceRate: '94.5%',
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
    coordinator: 'Mr. Bilal Qureshi',
    createdAt: '2026-01-15',
    sections: [
      {
        id: 'sec-7a',
        name: 'Section A',
        roomNo: 'Room G-04',
        floor: 'Ground Floor, Block C',
        capacity: 35,
        enrolledCount: 32,
        boysCount: 16,
        girlsCount: 16,
        classTeacher: 'Mr. Bilal Qureshi',
        teacherSubject: 'Mathematics & Logic',
        teacherPhone: '+92 334 1122334',
        stream: 'Junior Middle Core',
        attendanceRate: '95.1%',
        hasSmartBoard: true,
        hasAC: false,
      },
    ],
  },
];

const DEFAULT_SECTION_STUDENTS: Student[] = [
  { id: 'st-01', rollNo: '01', name: 'Aarav Sharma', gender: 'MALE', fatherName: 'Rajesh Sharma', phone: '+92 300 1234567', feeStatus: 'PAID', attendanceRate: '98.5%', enrolledAt: '2026-01-10' },
  { id: 'st-02', rollNo: '02', name: 'Ayesha Siddiqui', gender: 'FEMALE', fatherName: 'Kamran Siddiqui', phone: '+92 321 7654321', feeStatus: 'PAID', attendanceRate: '96.2%', enrolledAt: '2026-01-10' },
  { id: 'st-03', rollNo: '03', name: 'Bilal Hussain', gender: 'MALE', fatherName: 'Hussain Ahmed', phone: '+92 333 9988112', feeStatus: 'PAID', attendanceRate: '94.0%', enrolledAt: '2026-01-12' },
  { id: 'st-04', rollNo: '04', name: 'Fatima Noor', gender: 'FEMALE', fatherName: 'Noor Muhammad', phone: '+92 345 5566778', feeStatus: 'PAID', attendanceRate: '99.0%', enrolledAt: '2026-01-12' },
  { id: 'st-05', rollNo: '05', name: 'Hamza Tariq', gender: 'MALE', fatherName: 'Tariq Javed', phone: '+92 301 4433221', feeStatus: 'PENDING', attendanceRate: '88.5%', enrolledAt: '2026-01-15' },
  { id: 'st-06', rollNo: '06', name: 'Zoya Khan', gender: 'FEMALE', fatherName: 'Asif Khan', phone: '+92 312 8877665', feeStatus: 'PAID', attendanceRate: '95.5%', enrolledAt: '2026-01-15' },
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = (schoolSlug: string) => `edusphere_classes_${schoolSlug}`;
const STUDENTS_KEY = (schoolSlug: string, sectionId: string) => `edusphere_students_${schoolSlug}_${sectionId}`;

function getStoredClasses(schoolSlug: string): ClassItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(schoolSlug));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(DEFAULT_CLASSES));
  return DEFAULT_CLASSES;
}

function saveClassesToStorage(schoolSlug: string, data: ClassItem[]) {
  localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(data));
}

function getStoredStudents(schoolSlug: string, sectionId: string): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY(schoolSlug, sectionId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem(STUDENTS_KEY(schoolSlug, sectionId), JSON.stringify(DEFAULT_SECTION_STUDENTS));
  return DEFAULT_SECTION_STUDENTS;
}

function saveStudentsToStorage(schoolSlug: string, sectionId: string, students: Student[]) {
  localStorage.setItem(STUDENTS_KEY(schoolSlug, sectionId), JSON.stringify(students));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Classes() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || '';
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassItem[]>(() => getStoredClasses(schoolSlug));
  const [search, setSearch] = useState('');
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [teacherConflict, setTeacherConflict] = useState<{ teacherName: string; className: string; sectionName: string } | null>(null);

  // Roster Modal
  const [rosterTarget, setRosterTarget] = useState<{ cls: ClassItem; sec: Section } | null>(null);
  const [rosterStudents, setRosterStudents] = useState<Student[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    rollNo: '',
    name: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    fatherName: '',
    phone: '',
    feeStatus: 'PAID' as 'PAID' | 'PENDING' | 'PARTIAL',
    attendanceRate: '100%',
  });
  const [savingStudent, setSavingStudent] = useState(false);

  // Add Class Modal
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    wing: 'SENIOR' as 'PRIMARY' | 'MIDDLE' | 'SENIOR' | 'COLLEGE',
    monthlyFee: 'Rs 8,000',
    coordinator: 'Prof. Tariq Mehmood',
  });
  const [savingClass, setSavingClass] = useState(false);

  // Add Section Modal
  const [sectionTarget, setSectionTarget] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({
    name: '',
    roomNo: '',
    floor: '1st Floor, Block A',
    capacity: '35',
    classTeacher: 'Dr. Ananya Roy',
    teacherSubject: 'Physics & Applied Math',
    teacherPhone: '+92 301 5544332',
    stream: 'Science Core',
    hasSmartBoard: true,
    hasAC: true,
  });
  const [savingSection, setSavingSection] = useState(false);

  // Edit Section Modal
  const [editTarget, setEditTarget] = useState<{ classId: string; sec: Section } | null>(null);
  const [editForm, setEditForm] = useState<Partial<Section>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [wingFilter, setWingFilter] = useState('ALL');
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(() => new Set(getStoredClasses(schoolSlug).map(c => c.id)));

  const toggleClassExpanded = (classId: string) => {
    setExpandedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  useEffect(() => {
    const stored = getStoredClasses(schoolSlug);
    setClasses(stored);
    setExpandedClassIds(new Set(stored.map(c => c.id)));

    // Fetch Teachers from Staff
    apiClient.get('/people/staff')
      .then((res: any) => {
        if (Array.isArray(res.data)) {
          const teacherList = res.data
            .filter((s: any) => s.designation === 'Teacher')
            .map((s: any) => ({ id: s.id, name: s.name }));
          setTeachers(teacherList);
        }
      })
      .catch(() => {
        setTeachers([
          { id: 't1', name: 'Dr. Ananya Roy' },
          { id: 't2', name: 'Mr. Asad Ali' },
          { id: 't3', name: 'Mrs. Sabeen Shah' },
        ]);
      });
  }, [schoolSlug]);

  const updateAndSaveClasses = (newClasses: ClassItem[]) => {
    setClasses(newClasses);
    saveClassesToStorage(schoolSlug, newClasses);
  };

  // ─── Roster Actions ─────────────────────────────────────────────────────────

  const openRoster = (cls: ClassItem, sec: Section) => {
    setRosterTarget({ cls, sec });
    const students = getStoredStudents(schoolSlug, sec.id);
    setRosterStudents(students);
    setShowAddStudent(false);
    setTeacherConflict(null);
    setStudentForm({
      rollNo: String(students.length + 1).padStart(2, '0'),
      name: '',
      gender: 'MALE',
      fatherName: '',
      phone: '',
      feeStatus: 'PAID',
      attendanceRate: '100%',
    });
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterTarget || !studentForm.name.trim()) return;
    setSavingStudent(true);

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollNo: studentForm.rollNo || String(rosterStudents.length + 1).padStart(2, '0'),
      name: studentForm.name.trim(),
      gender: studentForm.gender,
      fatherName: studentForm.fatherName.trim(),
      phone: studentForm.phone.trim() || '+92 300 0000000',
      feeStatus: studentForm.feeStatus,
      attendanceRate: studentForm.attendanceRate || '100%',
      enrolledAt: new Date().toISOString().split('T')[0],
    };

    const updatedStudents = [...rosterStudents, newStudent];
    setRosterStudents(updatedStudents);
    saveStudentsToStorage(schoolSlug, rosterTarget.sec.id, updatedStudents);

    const updatedClasses = classes.map(c =>
      c.id === rosterTarget.cls.id
        ? {
            ...c,
            sections: c.sections.map(s =>
              s.id === rosterTarget.sec.id
                ? {
                    ...s,
                    enrolledCount: updatedStudents.length,
                    boysCount: updatedStudents.filter(x => x.gender === 'MALE').length,
                    girlsCount: updatedStudents.filter(x => x.gender === 'FEMALE').length,
                  }
                : s
            ),
          }
        : c
    );
    updateAndSaveClasses(updatedClasses);

    toast.success(`Student "${newStudent.name}" enrolled and saved!`);
    setStudentForm({
      rollNo: String(updatedStudents.length + 1).padStart(2, '0'),
      name: '',
      gender: 'MALE',
      fatherName: '',
      phone: '',
      feeStatus: 'PAID',
      attendanceRate: '100%',
    });
    setShowAddStudent(false);
    setSavingStudent(false);
  };

  const handleRemoveStudent = (stuId: string) => {
    if (!rosterTarget) return;
    if (!confirm('Remove this student from the section roster?')) return;

    const updatedStudents = rosterStudents.filter(s => s.id !== stuId);
    setRosterStudents(updatedStudents);
    saveStudentsToStorage(schoolSlug, rosterTarget.sec.id, updatedStudents);

    const updatedClasses = classes.map(c =>
      c.id === rosterTarget.cls.id
        ? {
            ...c,
            sections: c.sections.map(s =>
              s.id === rosterTarget.sec.id
                ? {
                    ...s,
                    enrolledCount: updatedStudents.length,
                    boysCount: updatedStudents.filter(x => x.gender === 'MALE').length,
                    girlsCount: updatedStudents.filter(x => x.gender === 'FEMALE').length,
                  }
                : s
            ),
          }
        : c
    );
    updateAndSaveClasses(updatedClasses);
    toast.success('Student removed from roster.');
  };

  // ─── Add Grade Action ───────────────────────────────────────────────────────

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    setSavingClass(true);

    const newClass: ClassItem = {
      id: `cls-${Date.now()}`,
      name: classForm.name.trim(),
      wing: classForm.wing,
      code: `GRD-${classForm.name.replace(/\D/g, '') || '01'}`,
      monthlyFee: classForm.monthlyFee.trim() || 'Rs 8,000',
      coordinator: classForm.coordinator.trim() || 'Head of Department',
      sections: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...classes, newClass];
    updateAndSaveClasses(updated);
    setExpandedClassIds(prev => new Set(prev).add(newClass.id));
    toast.success(`Grade "${newClass.name}" created successfully!`);
    setShowAddClass(false);
    setClassForm({
      name: '',
      wing: 'SENIOR',
      monthlyFee: 'Rs 8,000',
      coordinator: 'Prof. Tariq Mehmood',
    });
    setSavingClass(false);
  };

  // ─── Add Section Action ─────────────────────────────────────────────────────

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTarget || !sectionForm.name.trim()) return;
    setSavingSection(true);

    const newSection: Section = {
      id: `sec-${Date.now()}`,
      name: sectionForm.name.trim(),
      roomNo: sectionForm.roomNo.trim() || 'Room 101',
      floor: sectionForm.floor || '1st Floor',
      capacity: parseInt(sectionForm.capacity) || 35,
      enrolledCount: 0,
      boysCount: 0,
      girlsCount: 0,
      classTeacher: sectionForm.classTeacher || 'Dr. Ananya Roy',
      teacherSubject: sectionForm.teacherSubject || 'General Subject',
      teacherPhone: sectionForm.teacherPhone || '+92 301 0000000',
      stream: sectionForm.stream || 'General Core',
      attendanceRate: '95%',
      hasSmartBoard: sectionForm.hasSmartBoard,
      hasAC: sectionForm.hasAC,
    };

    const updatedClasses = classes.map(c =>
      c.id === sectionTarget ? { ...c, sections: [...c.sections, newSection] } : c
    );
    updateAndSaveClasses(updatedClasses);
    setExpandedClassIds(prev => new Set(prev).add(sectionTarget));
    toast.success(`Section "${newSection.name}" added successfully!`);
    setSectionTarget(null);
    setSectionForm({
      name: '',
      roomNo: '',
      floor: '1st Floor, Block A',
      capacity: '35',
      classTeacher: 'Dr. Ananya Roy',
      teacherSubject: 'Physics & Applied Math',
      teacherPhone: '+92 301 5544332',
      stream: 'Science Core',
      hasSmartBoard: true,
      hasAC: true,
    });
    setTeacherConflict(null);
    setSavingSection(false);
  };

  // ─── Edit Section Action ────────────────────────────────────────────────────

  const openEdit = (classId: string, sec: Section) => {
    setEditTarget({ classId, sec });
    setEditForm({ ...sec });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);

    const updatedClasses = classes.map(c =>
      c.id === editTarget.classId
        ? {
            ...c,
            sections: c.sections.map(s =>
              s.id === editTarget.sec.id ? ({ ...s, ...editForm } as Section) : s
            ),
          }
        : c
    );
    updateAndSaveClasses(updatedClasses);
    toast.success('Section changes saved successfully!');
    setEditTarget(null);
    setEditForm({});
    setSavingEdit(false);
  };

  // ─── Delete Actions ─────────────────────────────────────────────────────────

  const handleDeleteClass = (id: string, name: string) => {
    if (!confirm(`Delete grade "${name}" and all its sections?`)) return;
    const updatedClasses = classes.filter(c => c.id !== id);
    updateAndSaveClasses(updatedClasses);
    toast.success(`Grade "${name}" deleted.`);
  };

  const handleDeleteSection = (classId: string, secId: string, secName: string) => {
    if (!confirm(`Delete section "${secName}"?`)) return;
    localStorage.removeItem(STUDENTS_KEY(schoolSlug, secId));
    const updatedClasses = classes.map(c =>
      c.id === classId ? { ...c, sections: c.sections.filter(s => s.id !== secId) } : c
    );
    updateAndSaveClasses(updatedClasses);
    toast.success(`Section "${secName}" deleted.`);
  };

  const handleResetData = () => {
    if (!confirm('Reset all classes and sections to clean standard template?')) return;
    localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(DEFAULT_CLASSES));
    setClasses(DEFAULT_CLASSES);
    toast.success('Reset to standard school template successfully!');
  };

  // ─── Computations ───────────────────────────────────────────────────────────

  const totalClasses = classes.length;
  const totalSections = classes.reduce((a, c) => a + c.sections.length, 0);
  const totalEnrolled = classes.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + s.enrolledCount, 0), 0);
  const totalCapacity = classes.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + s.capacity, 0), 0);
  const occupancy = totalCapacity > 0 ? ((totalEnrolled / totalCapacity) * 100).toFixed(0) : '0';

  const filteredClasses = classes.filter(cls => {
    const matchesWing = wingFilter === 'ALL' || cls.wing === wingFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      cls.name.toLowerCase().includes(q) ||
      cls.coordinator.toLowerCase().includes(q) ||
      cls.sections.some(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.classTeacher.toLowerCase().includes(q) ||
          s.roomNo.toLowerCase().includes(q)
      );
    return matchesWing && matchesSearch;
  });

  return (
    <div className="space-y-7 max-w-screen-2xl mx-auto pb-12">

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
              Academic Structure & Classrooms
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Classes & Sections</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Full persistent school hierarchy. Manage grade levels, sections, assigned class teachers, and student rosters.
          </p>
        </div>

        {/* Right Aligned Header Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              const rows = classes.map(c =>
                c.sections.map(s => `"${c.name}","${s.name}","${s.roomNo}","${s.classTeacher}","${s.enrolledCount}/${s.capacity}","${c.monthlyFee}"`).join('\n')
              ).join('\n');
              const blob = new Blob([`Grade,Section,Room,Teacher,Capacity,Fee\n${rows}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Classes_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              toast.success('Classes exported to CSV!');
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => setShowAddClass(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Add New Grade
          </button>
        </div>
      </div>

      {/* 2. Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Grades</p>
            <p className="text-2xl font-black text-foreground">{totalClasses}</p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">Academic Tiers</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Sections</p>
            <p className="text-2xl font-black text-foreground">{totalSections}</p>
            <p className="text-[10px] text-blue-400 font-semibold mt-0.5">Classrooms Staffed</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Enrolled Students</p>
            <p className="text-2xl font-black text-foreground">{totalEnrolled}</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Active Roster</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Occupancy Rate</p>
            <p className="text-2xl font-black text-foreground">{occupancy}%</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">{totalEnrolled} / {totalCapacity} Seats</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search grade, section, room number, or class teacher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <Filter size={13} className="text-muted-foreground mr-1 shrink-0" />
          {(['ALL', 'SENIOR', 'MIDDLE', 'PRIMARY', 'COLLEGE'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWingFilter(w)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                wingFilter === w
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {w === 'ALL' ? 'All Wings' : w[0] + w.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Grade Cards List */}
      <div className="space-y-6">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls, ci) => {
            const clsEnrolled = cls.sections.reduce((a, s) => a + s.enrolledCount, 0);
            const clsCap = cls.sections.reduce((a, s) => a + s.capacity, 0);
            const clsOcc = clsCap > 0 ? ((clsEnrolled / clsCap) * 100).toFixed(0) : '0';
            const isExpanded = expandedClassIds.has(cls.id);

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.04 }}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:border-primary/30 transition-all duration-200"
              >
                {/* Grade Header */}
                <div
                  onClick={() => toggleClassExpanded(cls.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border bg-gradient-to-r from-primary/8 via-transparent to-transparent cursor-pointer hover:bg-accent/20 transition-all select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                      {cls.name.replace(/\D/g, '') || cls.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-foreground">{cls.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                          {cls.wing}
                        </span>
                        {cls.code && (
                          <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                            {cls.code}
                          </span>
                        )}
                        <span className="text-xs font-bold text-muted-foreground ml-1">
                          ({cls.sections.length} {cls.sections.length === 1 ? 'Section' : 'Sections'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {cls.coordinator && (
                          <span className="flex items-center gap-1">
                            <UserCheck size={13} className="text-primary" />
                            Coordinator: <strong className="text-foreground ml-0.5">{cls.coordinator}</strong>
                          </span>
                        )}
                        <span>•</span>
                        <span>Fee: <strong className="text-emerald-500 font-mono">{cls.monthlyFee}</strong> / month</span>
                        <span>•</span>
                        <span>
                          Enrolled: <strong className="text-foreground">{clsEnrolled} / {clsCap}</strong> ({clsOcc}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSectionTarget(cls.id); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs transition-all shadow-sm"
                    >
                      <Plus size={14} /> Add Section
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title="Delete Grade"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className={`p-2 rounded-full bg-accent/60 border border-border transition-transform duration-300 ${isExpanded ? 'rotate-90 text-primary' : 'text-muted-foreground'}`}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {/* Expanded Sections Area */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-border bg-muted/10"
                    >
                      <div className="p-5 sm:p-7">
                        {/* Internal Header for Sections */}
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                              <Layers size={16} className="text-primary" /> Active Class Sections & Roster
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Manage classroom allocation and student enrollment for {cls.name}</p>
                          </div>
                        </div>

                        {cls.sections.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                              <Layers size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-foreground">No sections created for {cls.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 mb-4">Add your first section (e.g. Section A - Alpha)</p>
                            <button
                              onClick={() => { setSectionForm({ ...sectionForm, name: '' }); setSectionTarget(cls.id); }}
                              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:scale-102 transition-all inline-flex items-center gap-1.5"
                            >
                              <Plus size={14} /> Add First Section
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {cls.sections.map(sec => {
                              const pct = sec.capacity > 0 ? Math.min(100, Math.round((sec.enrolledCount / sec.capacity) * 100)) : 0;
                              return (
                                <motion.div
                                  key={sec.id}
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 group/sec"
                                >
                                  {/* Section Identity */}
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-base font-black text-foreground group-hover/sec:text-primary transition-colors">{sec.name}</h4>
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">{sec.stream || 'Standard Core'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${sec.id}`)}
                                        className="px-2 py-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center gap-1 text-[10px] font-black uppercase"
                                        title="Mark Attendance"
                                      >
                                        <CheckCircle size={13} /> Mark
                                      </button>
                                      <button
                                        onClick={() => openEdit(cls.id, sec)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                        title="Edit Section"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSection(cls.id, sec.id, sec.name)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        title="Delete Section"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Faculty info */}
                                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
                                      {sec.classTeacher ? sec.classTeacher.charAt(0) : 'T'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">{sec.classTeacher || 'No Teacher Assigned'}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{sec.teacherSubject || 'Class Incharge'}</p>
                                    </div>
                                  </div>

                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="p-2.5 rounded-xl bg-accent/20 border border-border">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">Classroom</span>
                                      <span className="font-bold text-foreground flex items-center gap-1"><MapPin size={11} className="text-primary"/> {sec.roomNo || 'TBD'}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-accent/20 border border-border">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">Attendance</span>
                                      <span className="font-bold text-emerald-400">{sec.attendanceRate || '96%'}</span>
                                    </div>
                                  </div>

                                  {/* Stats Progress */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-end text-xs">
                                      <span className="font-medium text-muted-foreground">Enrollment</span>
                                      <span className="font-black text-foreground font-mono">{sec.enrolledCount} / {sec.capacity} Seats</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          pct >= 90 ? 'bg-amber-500' : pct >= 70 ? 'bg-emerald-500' : 'bg-primary'
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                      <span>👦 {sec.boysCount || 0} Boys</span>
                                      <span>{pct}% Occupied</span>
                                      <span>👧 {sec.girlsCount || 0} Girls</span>
                                    </div>
                                  </div>

                                  {/* Footer Action */}
                                  <button
                                    onClick={() => openRoster(cls, sec)}
                                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group/btn"
                                  >
                                    <Users size={14} />
                                    <span>View Student Roster ({sec.enrolledCount})</span>
                                    <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-3xl">
            <BookOpen size={48} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold text-foreground">No Classes Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try clearing your search query or wing filter.</p>
          </div>
        )}
      </div>

      {/* ─── Add Grade Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={showAddClass} onClose={() => setShowAddClass(false)} maxWidth="max-w-md">
        <div>
          <div>
          <ModalHeader
            icon={<BookOpen size={20} />}
            title="Add New Grade"
            subtitle="e.g. Class 11, Grade 6, Nursery"
            onClose={() => setShowAddClass(false)}
          />
          <form onSubmit={handleAddClass} className="space-y-4 text-xs p-6">
                <div>
                  <label className="block font-bold text-foreground mb-1.5">Grade Name *</label>
                  <input
                    value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                    required placeholder="e.g. Class 11, Grade 5"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Wing Category *</label>
                    <select
                      value={classForm.wing} onChange={e => setClassForm({ ...classForm, wing: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      <option value="PRIMARY">Primary (KG–5)</option>
                      <option value="MIDDLE">Middle (6–8)</option>
                      <option value="SENIOR">Senior (9–10)</option>
                      <option value="COLLEGE">Higher Sec (11–12)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Monthly Tuition Fee</label>
                    <input
                      value={classForm.monthlyFee} onChange={e => setClassForm({ ...classForm, monthlyFee: e.target.value })}
                      placeholder="e.g. Rs 8,500"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Grade Coordinator Teacher</label>
                  <input
                    value={classForm.coordinator} onChange={e => setClassForm({ ...classForm, coordinator: e.target.value })}
                    placeholder="e.g. Prof. Tariq Mehmood"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button type="button" onClick={() => setShowAddClass(false)} className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={savingClass} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center gap-2">
                    {savingClass ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create Grade
                  </button>
                </div>
          </form>
          </div>
        </div>
      </Modal>

      {/* ─── Add Section Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={!!sectionTarget} onClose={() => setSectionTarget(null)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Layers size={20} />}
          title="Add Classroom Section"
          subtitle="Assign room, teacher & seat capacity"
          onClose={() => setSectionTarget(null)}
        />
        <form onSubmit={handleAddSection} className="space-y-4 text-xs p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Section Name *</label>
                    <input
                      value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })}
                      required placeholder="e.g. Section B, Alpha"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Seat Capacity *</label>
                    <input
                      type="number" min="1" value={sectionForm.capacity}
                      onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-foreground mb-1.5">Class In-Charge (Teacher)</label>
                    <select
                      value={sectionForm.classTeacher}
                      onChange={e => {
                        const name = e.target.value;
                        setSectionForm({ ...sectionForm, classTeacher: name });

                        // Check for conflict
                        let conflictFound = null;
                        classes.forEach(c => {
                          c.sections.forEach(s => {
                            if (s.classTeacher === name && name !== '') {
                              conflictFound = { teacherName: name, className: c.name, sectionName: s.name };
                            }
                          });
                        });
                        setTeacherConflict(conflictFound);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>

                    <AnimatePresence>
                      {teacherConflict && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2"
                        >
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-amber-200 leading-normal">
                            Note: <span className="text-white underline">{teacherConflict.teacherName}</span> is already in-charge of {teacherConflict.className}. Assign here too?
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Room Number</label>
                    <input
                      value={sectionForm.roomNo} onChange={e => setSectionForm({ ...sectionForm, roomNo: e.target.value })}
                      placeholder="e.g. Room 204"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Subject Specialization</label>
                    <input
                      value={sectionForm.teacherSubject} onChange={e => setSectionForm({ ...sectionForm, teacherSubject: e.target.value })}
                      placeholder="e.g. Physics & Math"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 p-3 rounded-xl bg-accent/20 border border-border text-foreground font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sectionForm.hasSmartBoard}
                      onChange={e => setSectionForm({ ...sectionForm, hasSmartBoard: e.target.checked })}
                      className="accent-primary" />
                    Smart Board
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sectionForm.hasAC}
                      onChange={e => setSectionForm({ ...sectionForm, hasAC: e.target.checked })}
                      className="accent-primary" />
                    AC Air-Conditioned
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button type="button" onClick={() => setSectionTarget(null)} className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={savingSection} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center gap-2">
                    {savingSection ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Section
                  </button>
                </div>
        </form>
      </Modal>

      {/* ─── Edit Section Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Edit2 size={20} />}
          title={editTarget ? `Edit Section: ${editTarget.sec.name}` : 'Edit Section'}
          onClose={() => setEditTarget(null)}
        />

        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs p-6">
                <div>
                  <label className="block font-bold text-foreground mb-1.5">Section Name</label>
                  <input
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Room Number</label>
                    <input
                      value={editForm.roomNo || ''}
                      onChange={e => setEditForm({ ...editForm, roomNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Capacity</label>
                    <input
                      type="number" min="1"
                      value={editForm.capacity || ''}
                      onChange={e => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 35 })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Class Teacher</label>
                    <input
                      value={editForm.classTeacher || ''}
                      onChange={e => setEditForm({ ...editForm, classTeacher: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Subject</label>
                    <input
                      value={editForm.teacherSubject || ''}
                      onChange={e => setEditForm({ ...editForm, teacherSubject: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={savingEdit} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center gap-2">
                    {savingEdit ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
                  </button>
                </div>
        </form>
      </Modal>

      {/* ─── Student Roster Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={!!rosterTarget} onClose={() => setRosterTarget(null)} maxWidth="max-w-3xl">
        {rosterTarget && (
          <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border p-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                    {rosterTarget.cls.name.replace(/\D/g, '') || 'G'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">
                      {rosterTarget.cls.name} — {rosterTarget.sec.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Class Teacher: {rosterTarget.sec.classTeacher} · {rosterTarget.sec.roomNo} ({rosterTarget.sec.floor})
                    </p>
                  </div>
                </div>
                <button onClick={() => setRosterTarget(null)}><X size={22} className="text-muted-foreground hover:text-foreground" /></button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
                <div className="p-3 rounded-2xl bg-accent/30 border border-border text-center">
                  <p className="text-[10px] uppercase font-black text-muted-foreground">Enrolled</p>
                  <p className="text-xl font-black text-foreground">{rosterStudents.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border text-center">
                  <p className="text-[10px] uppercase font-black text-muted-foreground">Capacity</p>
                  <p className="text-xl font-black text-foreground">{rosterTarget.sec.capacity}</p>
                </div>
                <div className="p-3 rounded-2xl bg-accent/30 border border-border text-center">
                  <p className="text-[10px] uppercase font-black text-muted-foreground">Available Seats</p>
                  <p className="text-xl font-black text-emerald-500">{Math.max(0, rosterTarget.sec.capacity - rosterStudents.length)}</p>
                </div>
              </div>

              {/* Toggle Enroll Form */}
              <div className="shrink-0 mb-3">
                <button
                  onClick={() => setShowAddStudent(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary font-bold text-xs hover:bg-primary/20 transition-all"
                >
                  <Plus size={14} /> {showAddStudent ? 'Hide Form' : 'Enroll New Student'}
                </button>
              </div>

              {/* Add Student Form */}
              <AnimatePresence>
                {showAddStudent && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddStudent}
                    className="border border-primary/20 rounded-2xl p-4 mb-3 bg-primary/5 overflow-hidden shrink-0 space-y-3"
                  >
                    <h4 className="text-xs font-black text-foreground">New Student Enrollment Details</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">Roll No *</label>
                        <input
                          value={studentForm.rollNo}
                          onChange={e => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                          required
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-foreground mb-1">Student Full Name *</label>
                        <input
                          value={studentForm.name}
                          onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                          required
                          placeholder="e.g. Muhammad Ali"
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">Gender</label>
                        <select
                          value={studentForm.gender}
                          onChange={e => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">Father's Name</label>
                        <input
                          value={studentForm.fatherName}
                          onChange={e => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                          placeholder="Father Name"
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">Parent Phone</label>
                        <input
                          value={studentForm.phone}
                          onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
                          placeholder="+92 300 ..."
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">Fee Status</label>
                        <select
                          value={studentForm.feeStatus}
                          onChange={e => setStudentForm({ ...studentForm, feeStatus: e.target.value as any })}
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        >
                          <option value="PAID">Paid</option>
                          <option value="PENDING">Pending</option>
                          <option value="PARTIAL">Partial</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={savingStudent} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2">
                      {savingStudent ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save & Enroll Student
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Roster Table */}
              <div className="flex-1 overflow-y-auto">
                <div className="border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-accent/40 text-muted-foreground font-black uppercase text-[10px] border-b border-border">
                      <tr>
                        <th className="p-3">Roll</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Father / Parent</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Fee</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rosterStudents.map(stu => (
                        <tr key={stu.id} className="hover:bg-accent/20 transition-colors">
                          <td className="p-3 font-mono font-bold">{stu.rollNo}</td>
                          <td className="p-3 font-bold text-foreground">{stu.name}</td>
                          <td className="p-3 text-muted-foreground">{stu.gender}</td>
                          <td className="p-3 text-muted-foreground">{stu.fatherName || '—'}</td>
                          <td className="p-3 font-mono text-muted-foreground">{stu.phone}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              stu.feeStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : stu.feeStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>{stu.feeStatus}</span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(stu.id)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                              title="Remove Student"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border shrink-0 px-6 pb-6">
                <button onClick={() => setRosterTarget(null)} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md">
                  Done
                </button>
              </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
