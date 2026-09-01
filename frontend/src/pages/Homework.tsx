import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Calendar, FileText, CheckCircle2, Clock, BookOpen, User, X, Loader2,
  Search, Download, AlertCircle, Award, ChevronRight, Users, UserCheck,
  Send, Printer, MessageSquare, Sparkles, Filter, RefreshCw, Check, CheckCheck,
  Eye, HelpCircle, Layers, ArrowUpRight
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface HomeworkSubmission {
  studentId: string;
  studentName: string;
  rollNo: string;
  parentPhone: string;
  status: 'SUBMITTED' | 'PENDING' | 'LATE' | 'EVALUATED';
  submittedAt?: string;
  marksObtained?: number;
  totalMarks: number;
  attachmentUrl?: string;
  feedback?: string;
}

interface TeacherProfile {
  id: string;
  name: string;
  subject: string;
  department: string;
  phone: string;
  avatarColor: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  sectionName: string;
  assignedDate: string;
  assignedTime: string;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  passingMarks?: number;
  submissionMode: 'NOTEBOOK' | 'ONLINE_UPLOAD' | 'ORAL_PRESENTATION' | 'PROJECT_FILE';
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  teacherDepartment: string;
  type: 'DAILY_PRACTICE' | 'PROJECT' | 'READING' | 'WORKSHEET' | 'EXAM_PREP';
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING';
  status: 'ACTIVE' | 'EVALUATED' | 'ARCHIVED';
  notifyParents: boolean;
  estimatedMinutes?: number;
  submissions: HomeworkSubmission[];
}

// ─── Faculty List ─────────────────────────────────────────────────────────────

const FACULTY_LIST: TeacherProfile[] = [
  { id: 't-1', name: 'Dr. Ananya Roy', subject: 'Physics & Math', department: 'Senior Science Faculty', phone: '+92 301 5544332', avatarColor: 'from-violet-600 to-indigo-600' },
  { id: 't-2', name: 'Dr. Farhana Siddiqui', subject: 'Chemistry & Biology', department: 'Department Head (Sciences)', phone: '+92 300 1239874', avatarColor: 'from-emerald-600 to-teal-600' },
  { id: 't-3', name: 'Mr. Kamran Javed', subject: 'Mathematics', department: 'Senior Mathematics Wing', phone: '+92 321 4567890', avatarColor: 'from-blue-600 to-cyan-600' },
  { id: 't-4', name: 'Mrs. Sabeen Shah', subject: 'English Literature', department: 'Language & Arts Faculty', phone: '+92 333 4455667', avatarColor: 'from-rose-600 to-pink-600' },
  { id: 't-5', name: 'Mr. Asad Ali', subject: 'Computer Science & IT', department: 'Computer Science Department', phone: '+92 322 9988771', avatarColor: 'from-amber-600 to-orange-600' },
  { id: 't-6', name: 'Mr. Zahid Bashir', subject: 'History & Pak Studies', department: 'Social Sciences', phone: '+92 311 8899001', avatarColor: 'from-purple-600 to-violet-600' },
];

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English Literature',
  'Urdu Language',
  'Islamic Studies',
  'Pakistan Studies',
  'General Science',
];

const DEFAULT_HOMEWORK_LIST: HomeworkItem[] = [
  {
    id: 'hw-1',
    title: 'Quadratic Equations & Polynomials Problem Set 4.2',
    description: 'Solve exercises 4.1 to 4.5 from textbook. Complete all derivation steps for quadratic formula in class notebook. Verify discriminant for all 10 problems.',
    subject: 'Mathematics',
    className: 'Class 10',
    sectionName: 'Section A (Alpha)',
    assignedDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    assignedTime: '09:30 AM',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '08:00 PM',
    totalMarks: 20,
    passingMarks: 8,
    submissionMode: 'NOTEBOOK',
    teacherId: 't-1',
    teacherName: 'Dr. Ananya Roy',
    teacherSubject: 'Physics & Applied Math',
    teacherDepartment: 'Senior Science Faculty',
    type: 'DAILY_PRACTICE',
    difficulty: 'MODERATE',
    status: 'ACTIVE',
    notifyParents: true,
    estimatedMinutes: 45,
    submissions: [
      { studentId: 'st-1', rollNo: '01', studentName: 'Aarav Sharma', parentPhone: '+92 300 1234567', status: 'EVALUATED', submittedAt: 'Yesterday, 4:15 PM', marksObtained: 19, totalMarks: 20, feedback: 'Excellent step-by-step solutions!' },
      { studentId: 'st-2', rollNo: '02', studentName: 'Ayesha Siddiqui', parentPhone: '+92 321 7654321', status: 'SUBMITTED', submittedAt: 'Today, 9:30 AM', totalMarks: 20 },
      { studentId: 'st-3', rollNo: '03', studentName: 'Bilal Hussain', parentPhone: '+92 333 9988112', status: 'PENDING', totalMarks: 20 },
      { studentId: 'st-4', rollNo: '04', studentName: 'Fatima Noor', parentPhone: '+92 345 5566778', status: 'EVALUATED', submittedAt: 'Yesterday, 6:00 PM', marksObtained: 20, totalMarks: 20, feedback: 'Full marks, very neat presentation.' },
      { studentId: 'st-5', rollNo: '05', studentName: 'Hamza Tariq', parentPhone: '+92 301 4433221', status: 'PENDING', totalMarks: 20 },
      { studentId: 'st-6', rollNo: '06', studentName: 'Zoya Khan', parentPhone: '+92 312 8877665', status: 'SUBMITTED', submittedAt: 'Today, 11:20 AM', totalMarks: 20 },
    ],
  },
  {
    id: 'hw-2',
    title: 'Chemical Reactions & Balancing Redox Equations',
    description: 'Balance 15 oxidation-reduction reactions provided in the attached sheet. Identify limiting reagents and write physical state notation (s, l, g, aq).',
    subject: 'Chemistry',
    className: 'Class 9',
    sectionName: 'Section A',
    assignedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    assignedTime: '11:15 AM',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    dueTime: '10:00 PM',
    totalMarks: 25,
    passingMarks: 10,
    submissionMode: 'ONLINE_UPLOAD',
    teacherId: 't-2',
    teacherName: 'Dr. Farhana Siddiqui',
    teacherSubject: 'Chemistry & Biology',
    teacherDepartment: 'Department Head (Sciences)',
    type: 'WORKSHEET',
    difficulty: 'CHALLENGING',
    status: 'ACTIVE',
    notifyParents: true,
    estimatedMinutes: 60,
    submissions: [
      { studentId: 'st-11', rollNo: '01', studentName: 'Daniyal Khan', parentPhone: '+92 300 2233445', status: 'SUBMITTED', submittedAt: 'Today, 8:00 AM', totalMarks: 25 },
      { studentId: 'st-12', rollNo: '02', studentName: 'Maham Ali', parentPhone: '+92 321 4455667', status: 'SUBMITTED', submittedAt: 'Today, 10:15 AM', totalMarks: 25 },
      { studentId: 'st-13', rollNo: '03', studentName: 'Usman Farooq', parentPhone: '+92 333 7788990', status: 'PENDING', totalMarks: 25 },
      { studentId: 'st-14', rollNo: '04', studentName: 'Sana Malik', parentPhone: '+92 345 1122334', status: 'PENDING', totalMarks: 25 },
    ],
  },
  {
    id: 'hw-3',
    title: 'Argumentative Essay: Artificial Intelligence in Modern Education',
    description: 'Write a comprehensive 500–600 word argumentative essay discussing the advantages and ethical considerations of AI tutors in modern school classrooms.',
    subject: 'English Literature',
    className: 'Class 10',
    sectionName: 'Section B (Beta)',
    assignedDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    assignedTime: '01:00 PM',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    dueTime: '06:00 PM',
    totalMarks: 15,
    passingMarks: 6,
    submissionMode: 'NOTEBOOK',
    teacherId: 't-4',
    teacherName: 'Mrs. Sabeen Shah',
    teacherSubject: 'English Literature',
    teacherDepartment: 'Language & Arts Faculty',
    type: 'PROJECT',
    difficulty: 'EASY',
    status: 'ACTIVE',
    notifyParents: false,
    estimatedMinutes: 50,
    submissions: [
      { studentId: 'st-21', rollNo: '01', studentName: 'Rohan Mehmood', parentPhone: '+92 301 5566778', status: 'EVALUATED', submittedAt: '2 days ago', marksObtained: 14, totalMarks: 15, feedback: 'Well structured essay with strong thesis.' },
      { studentId: 'st-22', rollNo: '02', studentName: 'Sara Qasim', parentPhone: '+92 322 8899001', status: 'LATE', submittedAt: 'Yesterday, 9:00 PM', totalMarks: 15 },
      { studentId: 'st-23', rollNo: '03', studentName: 'Zainab Bibi', parentPhone: '+92 334 2233114', status: 'PENDING', totalMarks: 15 },
    ],
  },
];

const STORAGE_KEY = (slug: string) => `edusphere_homework_${slug}`;

function getStoredHomework(schoolSlug: string): HomeworkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(schoolSlug));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(DEFAULT_HOMEWORK_LIST));
  return DEFAULT_HOMEWORK_LIST;
}

export default function Homework() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || 'demo';

  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(() => getStoredHomework(schoolSlug));
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'EVALUATED'>('ALL');

  // Modals & Drawers
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<HomeworkItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<HomeworkItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedHomeworkForRoster, setSelectedHomeworkForRoster] = useState<HomeworkItem | null>(null);
  const [gradingStudent, setGradingStudent] = useState<HomeworkSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Assign Homework Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'Mathematics',
    className: 'Class 10',
    sectionName: 'Section A (Alpha)',
    teacherId: FACULTY_LIST[0].id,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '08:00 PM',
    totalMarks: '20',
    passingMarks: '8',
    estimatedMinutes: '45',
    submissionMode: 'NOTEBOOK' as HomeworkItem['submissionMode'],
    difficulty: 'MODERATE' as HomeworkItem['difficulty'],
    type: 'DAILY_PRACTICE' as HomeworkItem['type'],
    notifyParents: true,
  });

  // Load Data
  useEffect(() => {
    setHomeworks(getStoredHomework(schoolSlug));
  }, [schoolSlug]);

  const updateAndPersist = (updated: HomeworkItem[]) => {
    setHomeworks(updated);
    localStorage.setItem(STORAGE_KEY(schoolSlug), JSON.stringify(updated));
  };

  // Assign Homework Submit
  const handleAssignHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const selectedTeacherObj = FACULTY_LIST.find(t => t.id === form.teacherId) || FACULTY_LIST[0];

    const defaultClassStudents: HomeworkSubmission[] = [
      { studentId: 'st-01', rollNo: '01', studentName: 'Aarav Sharma', parentPhone: '+92 300 1234567', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
      { studentId: 'st-02', rollNo: '02', studentName: 'Ayesha Siddiqui', parentPhone: '+92 321 7654321', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
      { studentId: 'st-03', rollNo: '03', studentName: 'Bilal Hussain', parentPhone: '+92 333 9988112', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
      { studentId: 'st-04', rollNo: '04', studentName: 'Fatima Noor', parentPhone: '+92 345 5566778', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
      { studentId: 'st-05', rollNo: '05', studentName: 'Hamza Tariq', parentPhone: '+92 301 4433221', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
      { studentId: 'st-06', rollNo: '06', studentName: 'Zoya Khan', parentPhone: '+92 312 8877665', status: 'PENDING', totalMarks: parseInt(form.totalMarks) || 20 },
    ];

    const newHw: HomeworkItem = {
      id: `hw-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject,
      className: form.className,
      sectionName: form.sectionName,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      totalMarks: parseInt(form.totalMarks) || 20,
      passingMarks: parseInt(form.passingMarks) || Math.floor((parseInt(form.totalMarks) || 20) * 0.4),
      estimatedMinutes: parseInt(form.estimatedMinutes) || 45,
      submissionMode: form.submissionMode,
      teacherId: selectedTeacherObj.id,
      teacherName: selectedTeacherObj.name,
      teacherSubject: selectedTeacherObj.subject,
      teacherDepartment: selectedTeacherObj.department,
      type: form.type,
      difficulty: form.difficulty,
      status: 'ACTIVE',
      notifyParents: form.notifyParents,
      submissions: defaultClassStudents,
    };

    const updated = [newHw, ...homeworks];
    updateAndPersist(updated);

    toast.success(`Homework assigned by ${selectedTeacherObj.name} to ${form.className}!`);

    setShowAssignModal(false);
    setSaving(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete homework assignment "${title}"?`)) return;
    const updated = homeworks.filter(h => h.id !== id);
    updateAndPersist(updated);
    toast.success('Assignment deleted.');
    if (selectedHomeworkForRoster?.id === id) setSelectedHomeworkForRoster(null);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomeworkForRoster || !gradingStudent) return;
    const obtained = parseFloat(gradeMarks);
    if (isNaN(obtained) || obtained < 0 || obtained > gradingStudent.totalMarks) {
      toast.error(`Marks must be between 0 and ${gradingStudent.totalMarks}`);
      return;
    }

    const updatedSubmissions = selectedHomeworkForRoster.submissions.map(sub =>
      sub.studentId === gradingStudent.studentId
        ? {
            ...sub,
            status: 'EVALUATED' as const,
            marksObtained: obtained,
            feedback: gradeFeedback.trim() || 'Checked and verified.',
            submittedAt: sub.submittedAt || 'Today, Recorded',
          }
        : sub
    );

    const updatedHomework: HomeworkItem = { ...selectedHomeworkForRoster, submissions: updatedSubmissions };
    const updatedList = homeworks.map(h => (h.id === updatedHomework.id ? updatedHomework : h));
    updateAndPersist(updatedList);
    setSelectedHomeworkForRoster(updatedHomework);
    setGradingStudent(null);
    setGradeMarks('');
    setGradeFeedback('');
    toast.success(`Marks saved for ${gradingStudent.studentName}!`);
  };

  // Batch action: Mark All as Submitted
  const handleBatchMarkSubmitted = () => {
    if (!selectedHomeworkForRoster) return;
    const updatedSubmissions = selectedHomeworkForRoster.submissions.map(sub => ({
      ...sub,
      status: (sub.status === 'PENDING' ? 'SUBMITTED' : sub.status) as any,
      submittedAt: sub.submittedAt || 'Today, Batch Recorded',
    }));
    const updatedHomework = { ...selectedHomeworkForRoster, submissions: updatedSubmissions };
    const updatedList = homeworks.map(h => (h.id === updatedHomework.id ? updatedHomework : h));
    updateAndPersist(updatedList);
    setSelectedHomeworkForRoster(updatedHomework);
    toast.success('All pending students marked as Submitted!');
  };

  // Batch action: Full marks to all submitted
  const handleBatchGradeFullMarks = () => {
    if (!selectedHomeworkForRoster) return;
    const updatedSubmissions = selectedHomeworkForRoster.submissions.map(sub => ({
      ...sub,
      status: 'EVALUATED' as const,
      marksObtained: sub.marksObtained !== undefined ? sub.marksObtained : sub.totalMarks,
      feedback: sub.feedback || 'Good work, all exercises completed.',
    }));
    const updatedHomework = { ...selectedHomeworkForRoster, submissions: updatedSubmissions };
    const updatedList = homeworks.map(h => (h.id === updatedHomework.id ? updatedHomework : h));
    updateAndPersist(updatedList);
    setSelectedHomeworkForRoster(updatedHomework);
    toast.success('All students graded with full marks!');
  };

  // Filter Computation
  const now = new Date();

  const totalAssigned = homeworks.length;
  const totalSubmissions = homeworks.reduce((a, h) => a + h.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'EVALUATED').length, 0);
  const totalExpected = homeworks.reduce((a, h) => a + h.submissions.length, 0);
  const submissionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;
  const overdueCount = homeworks.filter(h => new Date(h.dueDate) < now && h.status === 'ACTIVE').length;

  const filteredHomeworks = homeworks.filter(hw => {
    const isOverdue = new Date(hw.dueDate) < now;
    const matchesSearch =
      hw.title.toLowerCase().includes(search.toLowerCase()) ||
      hw.description.toLowerCase().includes(search.toLowerCase()) ||
      hw.subject.toLowerCase().includes(search.toLowerCase()) ||
      hw.className.toLowerCase().includes(search.toLowerCase()) ||
      hw.teacherName.toLowerCase().includes(search.toLowerCase());

    const matchesSubject = selectedSubject === 'ALL' || hw.subject === selectedSubject;
    const matchesClass = selectedClass === 'ALL' || hw.className === selectedClass;
    const matchesTeacher = selectedTeacher === 'ALL' || hw.teacherId === selectedTeacher || hw.teacherName === selectedTeacher;

    let matchesTab = true;
    if (activeTab === 'ACTIVE') matchesTab = !isOverdue && hw.status === 'ACTIVE';
    if (activeTab === 'OVERDUE') matchesTab = isOverdue && hw.status === 'ACTIVE';
    if (activeTab === 'EVALUATED') matchesTab = hw.status === 'EVALUATED' || hw.submissions.every(s => s.status === 'EVALUATED');
    if (activeTab === 'PENDING') matchesTab = hw.submissions.some(s => s.status === 'PENDING');

    return matchesSearch && matchesSubject && matchesClass && matchesTeacher && matchesTab;
  });

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
              Academic Assignment & Faculty Task Center
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Homework & Study Plans</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track teacher assignments by class, live student submissions, notebook checking & parent alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const rows = homeworks.map(h => `"${h.title}","${h.subject}","${h.className}","${h.teacherName}","${h.dueDate}","${h.totalMarks}"`).join('\n');
              const blob = new Blob([`Title,Subject,Class,Teacher,Due Date,Total Marks\n${rows}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Faculty_Homework_Report_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              toast.success('Homework Report exported!');
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> Export Sheet
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Assign Homework
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Tasks</p>
            <p className="text-2xl font-black text-foreground">{totalAssigned}</p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">Assigned by Faculty</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Submission Rate</p>
            <p className="text-2xl font-black text-foreground">{submissionRate}%</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">{totalSubmissions}/{totalExpected} Returned</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Faculty</p>
            <p className="text-2xl font-black text-foreground">{FACULTY_LIST.length}</p>
            <p className="text-[10px] text-blue-400 font-semibold mt-0.5">Teaching Staff</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Overdue Tasks</p>
            <p className="text-2xl font-black text-foreground">{overdueCount}</p>
            <p className="text-[10px] text-rose-400 font-semibold mt-0.5">Past Due Date</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Dedicated Teacher Filter Bar */}
      <div className="space-y-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search homework by topic, title, teacher or class..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Teacher Selector Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="ALL">👨‍🏫 All Faculty</option>
              {FACULTY_LIST.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="ALL">🏫 All Classes</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 7">Class 7</option>
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="ALL">📚 All Subjects</option>
              {DEFAULT_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/50 text-xs">
          {[
            { id: 'ALL', label: 'All Homework' },
            { id: 'ACTIVE', label: 'Active & Due' },
            { id: 'PENDING', label: 'Needs Submission' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'EVALUATED', label: 'Evaluated' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Homework Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading homework...</p>
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card">
          <FileText size={52} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-black text-foreground">No Assignments Found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Try adjusting your search, class or teacher filters.
          </p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
          >
            + Assign First Homework
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHomeworks.map((hw, idx) => {
            const isOverdue = new Date(hw.dueDate) < now;
            const submittedCount = hw.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'EVALUATED').length;
            const totalStudents = hw.submissions.length;
            const pct = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

            return (
              <motion.div
                key={hw.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card border border-border rounded-3xl p-5 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {hw.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground border border-border">
                        {hw.className} ({hw.sectionName})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-muted text-muted-foreground">
                        {hw.submissionMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOverdue ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(hw.id, hw.title)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {hw.title}
                  </h3>

                  {/* Description preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {hw.description}
                  </p>

                  {/* Teacher & Due Date Details */}
                  <div className="p-3 rounded-2xl bg-accent/25 border border-border/60 mb-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><User size={12} className="text-primary" /> Teacher:</span>
                      <strong className="text-foreground">{hw.teacherName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Calendar size={12} className="text-primary" /> Due Deadline:</span>
                      <strong className="text-foreground">{hw.dueDate} ({hw.dueTime || '08:00 PM'})</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Award size={12} className="text-primary" /> Total Marks:</span>
                      <strong className="text-foreground">{hw.totalMarks} Marks (Pass: {hw.passingMarks || 8})</strong>
                    </div>
                  </div>

                  {/* Submission Progress Bar */}
                  <div className="p-3 rounded-2xl bg-background/80 border border-border/70 mb-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-muted-foreground">Submission Progress:</span>
                      <span className="font-mono text-foreground">
                        {submittedCount} / {totalStudents} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedHomeworkForRoster(hw)}
                    className="col-span-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all"
                  >
                    <Users size={13} />
                    <span>Submissions ({hw.submissions.length})</span>
                  </button>

                  <button
                    onClick={() => setShowBroadcastModal(hw)}
                    className="py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-bold text-xs flex items-center justify-center gap-1 border border-border"
                    title="Send WhatsApp/SMS reminder to parents"
                  >
                    <Send size={13} className="text-emerald-400" />
                    <span>Alert</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 5. ASSIGN HOMEWORK MODAL */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="max-w-3xl">
        <ModalHeader
          icon={<BookOpen size={20} />}
          title="Assign Homework to Class"
          subtitle="Specify teacher, instructions, deadline & grading criteria"
          onClose={() => setShowAssignModal(false)}
        />
        <form onSubmit={handleAssignHomework} className="space-y-4 text-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Teacher Assigned *</label>
                    <select
                      value={form.teacherId}
                      onChange={e => setForm({ ...form, teacherId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      {FACULTY_LIST.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} — {teacher.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">Class *</label>
                      <select
                        value={form.className}
                        onChange={e => setForm({ ...form, className: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                      >
                        <option value="Class 10">Class 10</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 7">Class 7</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">Section *</label>
                      <select
                        value={form.sectionName}
                        onChange={e => setForm({ ...form, sectionName: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                      >
                        <option value="Section A (Alpha)">A (Alpha)</option>
                        <option value="Section B (Beta)">B (Beta)</option>
                        <option value="Section C">C</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">Subject *</label>
                      <select
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                      >
                        {DEFAULT_SUBJECTS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Assignment Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Chapter 4 Quadratic Formula Exercises 4.1 to 4.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Detailed Task Instructions *</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    required
                    placeholder="Describe specific questions, page numbers, rubric guidelines..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Due Date *</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Due Time</label>
                    <input
                      value={form.dueTime}
                      onChange={e => setForm({ ...form, dueTime: e.target.value })}
                      placeholder="08:00 PM"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Total Marks</label>
                    <input
                      type="number"
                      value={form.totalMarks}
                      onChange={e => setForm({ ...form, totalMarks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Submission Mode</label>
                    <select
                      value={form.submissionMode}
                      onChange={e => setForm({ ...form, submissionMode: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      <option value="NOTEBOOK">Physical Notebook</option>
                      <option value="ONLINE_UPLOAD">Online Portal Upload</option>
                      <option value="ORAL_PRESENTATION">Oral Presentation</option>
                      <option value="PROJECT_FILE">Project File</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Assign Homework</span>
                  </button>
                </div>
          </form>
      </Modal>

      {/* 6. SUBMISSIONS ROSTER & EVALUATION DRAWER */}
      <Modal isOpen={!!selectedHomeworkForRoster} onClose={() => setSelectedHomeworkForRoster(null)} maxWidth="max-w-4xl">
        {selectedHomeworkForRoster && (
          <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                    {selectedHomeworkForRoster.subject.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">{selectedHomeworkForRoster.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      Teacher: <strong className="text-foreground">{selectedHomeworkForRoster.teacherName}</strong> · {selectedHomeworkForRoster.className} ({selectedHomeworkForRoster.totalMarks} Marks)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowPrintModal(selectedHomeworkForRoster);
                    }}
                    className="p-2 rounded-xl border border-border hover:bg-accent text-foreground text-xs font-bold"
                    title="Print Task Sheet"
                  >
                    <Printer size={16} />
                  </button>
                  <button onClick={() => setSelectedHomeworkForRoster(null)}>
                    <X size={20} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchMarkSubmitted}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  >
                    <Check size={13} /> Mark All Submitted
                  </button>
                  <button
                    onClick={handleBatchGradeFullMarks}
                    className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold hover:bg-violet-500/20 transition-all flex items-center gap-1"
                  >
                    <Award size={13} /> Quick Grade Full Marks
                  </button>
                </div>

                <button
                  onClick={() => setShowBroadcastModal(selectedHomeworkForRoster)}
                  className="px-3 py-1.5 rounded-xl bg-accent text-foreground font-bold hover:bg-accent/80 transition-all flex items-center gap-1 border border-border"
                >
                  <Send size={13} className="text-emerald-400" /> Parent WhatsApp Alert
                </button>
              </div>

              {/* Student Table */}
              <div className="flex-1 overflow-y-auto border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-accent/40 text-muted-foreground font-black uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="p-3">Roll</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {selectedHomeworkForRoster.submissions.map(sub => (
                      <tr key={sub.studentId} className="hover:bg-accent/20 transition-colors">
                        <td className="p-3 font-mono font-bold">{sub.rollNo}</td>
                        <td className="p-3 font-bold text-foreground">{sub.studentName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              sub.status === 'EVALUATED'
                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                : sub.status === 'SUBMITTED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : sub.status === 'LATE'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-extrabold text-foreground">
                          {sub.marksObtained !== undefined ? (
                            <span className="text-emerald-400">{sub.marksObtained} / {sub.totalMarks}</span>
                          ) : (
                            <span className="text-muted-foreground">— / {sub.totalMarks}</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground text-[11px] truncate max-w-[200px]">
                          {sub.feedback || '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setGradingStudent(sub);
                              setGradeMarks(sub.marksObtained !== undefined ? String(sub.marksObtained) : '');
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] border border-primary/20 transition-all"
                          >
                            Grade Marks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grade Input Overlay */}
              <AnimatePresence>
                {gradingStudent && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="p-4 rounded-2xl bg-accent/40 border border-primary/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs text-foreground flex items-center gap-1.5">
                        <Award size={14} className="text-amber-400" /> Grade: {gradingStudent.studentName} (Roll {gradingStudent.rollNo})
                      </h4>
                      <button onClick={() => setGradingStudent(null)} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveGrade} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground mb-1">
                          Marks (Max {gradingStudent.totalMarks}) *
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={gradingStudent.totalMarks}
                          value={gradeMarks}
                          onChange={e => setGradeMarks(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-foreground mb-1">
                          Teacher Feedback
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={gradeFeedback}
                            onChange={e => setGradeFeedback(e.target.value)}
                            placeholder="e.g. Excellent solutions, checked in notebook."
                            className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs whitespace-nowrap shadow-sm hover:bg-primary/90"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2 border-t border-border shrink-0">
                <button
                  onClick={() => setSelectedHomeworkForRoster(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  Done
                </button>
              </div>
          </div>
        )}
      </Modal>

      {/* 7. PARENT BROADCAST MODAL */}
      <Modal isOpen={!!showBroadcastModal} onClose={() => setShowBroadcastModal(null)} maxWidth="max-w-lg">
        {showBroadcastModal && (
          <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base">Broadcast WhatsApp / SMS Reminder</h3>
                    <p className="text-xs text-muted-foreground">{showBroadcastModal.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowBroadcastModal(null)}>
                  <X size={18} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-accent/30 border border-border text-xs space-y-2">
                <span className="font-bold text-foreground">Message Preview to Parents:</span>
                <p className="text-muted-foreground italic bg-background p-3 rounded-xl border border-border/60">
                  "Dear Parent, your child in {showBroadcastModal.className} has homework in {showBroadcastModal.subject} due on {showBroadcastModal.dueDate}. Please ensure completion. — {showBroadcastModal.teacherName}"
                </p>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Ready to dispatch to {showBroadcastModal.submissions.filter(s => s.status === 'PENDING').length} parents of pending students.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBroadcastModal(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('WhatsApp & SMS Broadcast dispatched to all parents!');
                    setShowBroadcastModal(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Send size={13} /> Send Broadcast
                </button>
              </div>
          </div>
        )}
      </Modal>

      {/* 8. PRINTABLE HOMEWORK TASK SHEET MODAL */}
      <Modal isOpen={!!showPrintModal} onClose={() => setShowPrintModal(null)} maxWidth="max-w-4xl">
        {showPrintModal && (
          <div className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base">Printable Homework Assignment Sheet</h3>
                    <p className="text-xs text-muted-foreground">{showPrintModal.subject} · {showPrintModal.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Printer size={13} /> Print Sheet
                  </button>
                  <button onClick={() => setShowPrintModal(null)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Document */}
              <div className="flex-1 overflow-y-auto py-6 bg-white text-slate-900 p-8 rounded-2xl my-4 space-y-6 font-sans">
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h1 className="text-2xl font-black uppercase">EDUSPHERE INTERNATIONAL ACADEMY</h1>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                    Official Student Homework Assignment & Task Sheet
                  </p>
                  <div className="mt-3 grid grid-cols-3 text-xs font-bold border-t border-slate-300 pt-2 text-slate-700">
                    <span>Subject: <strong>{showPrintModal.subject}</strong></span>
                    <span>Class: <strong>{showPrintModal.className} ({showPrintModal.sectionName})</strong></span>
                    <span>Due: <strong>{showPrintModal.dueDate}</strong></span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-black text-slate-900 border-b border-slate-300 pb-1">
                    Topic / Assignment Title: {showPrintModal.title}
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Instructions for Students:</span>
                    <p className="text-slate-800 whitespace-pre-wrap">{showPrintModal.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-300">
                  <div>
                    <span>Assigned By: <strong>{showPrintModal.teacherName}</strong></span><br />
                    <span>Submission Mode: <strong>{showPrintModal.submissionMode}</strong></span>
                  </div>
                  <div className="text-right">
                    <span>Total Marks: <strong>{showPrintModal.totalMarks} Marks</strong></span><br />
                    <span>Passing Criteria: <strong>{showPrintModal.passingMarks || 8} Marks</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold text-slate-700">
                  <div className="border-t border-slate-400 pt-2">Subject Teacher Signature</div>
                  <div className="border-t border-slate-400 pt-2">Parent / Guardian Signature</div>
                </div>
              </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
