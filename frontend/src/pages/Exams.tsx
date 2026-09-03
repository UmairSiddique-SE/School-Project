import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, FileSpreadsheet, Loader2, Award, Calendar, ClipboardList,
  X, RefreshCw, GraduationCap, BarChart4, ChevronRight, UserCircle2,
  Printer, Download, Trophy, AlertCircle, Sparkles, Filter, Search,
  CheckCircle2, BookOpen, Clock, MapPin, Eye, FileText, UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface DateSheetItem {
  id: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomNo: string;
  totalMarks: number;
  passingMarks: number;
  invigilator: string;
  syllabus: string;
}

interface ExamItem {
  id: string;
  name: string;
  type: 'MIDTERM' | 'FINAL' | 'MONTHLY_TEST' | 'QUIZ' | 'MOCK_BOARD';
  session: string;
  startDate: string;
  endDate: string;
  className: string;
  sectionName: string;
  sectionId: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED';
  dateSheet: DateSheetItem[];
}

interface StudentGradeRecord {
  studentId: string;
  rollNo: string;
  studentName: string;
  sectionId: string;
  gender: 'MALE' | 'FEMALE';
  subjectMarks: Record<string, { obtained: number; isAbsent?: boolean; remarks?: string }>;
  attendancePct: number;
  conductRemarks: string;
}

interface RankedStudentRecord extends StudentGradeRecord {
  totalObtained: number;
  totalPossible: number;
  percentage: number;
  grade: string;
  gpa: number;
  badgeColor: string;
  gradeLabel: string;
  rank: number;
}

// ─── Default Realistic Seed Data ───────────────────────────────────────────────



const DEFAULT_DATE_SHEET: DateSheetItem[] = [
  { id: 'ds-1', subject: 'Mathematics', examDate: '2026-10-15', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'Hall A (Main)', totalMarks: 100, passingMarks: 33, invigilator: 'Dr. Ananya Roy', syllabus: 'Chapters 1–5: Quadratic Equations, Matrices & Logarithms' },
  { id: 'ds-2', subject: 'Physics', examDate: '2026-10-17', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'Hall A (Main)', totalMarks: 100, passingMarks: 33, invigilator: 'Mr. Kamran Javed', syllabus: 'Chapters 1–4: Kinematics, Dynamics & Circular Motion' },
  { id: 'ds-3', subject: 'Chemistry', examDate: '2026-10-19', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'Hall B', totalMarks: 100, passingMarks: 33, invigilator: 'Dr. Farhana Siddiqui', syllabus: 'Chapters 1–6: Chemical Reactions, Periodic Table & Acids' },
  { id: 'ds-4', subject: 'Biology', examDate: '2026-10-21', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'Hall B', totalMarks: 100, passingMarks: 33, invigilator: 'Dr. Farhana Siddiqui', syllabus: 'Cell Biology, Photosynthesis & Human Physiology' },
  { id: 'ds-5', subject: 'English Literature', examDate: '2026-10-23', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'Hall A (Main)', totalMarks: 100, passingMarks: 33, invigilator: 'Mrs. Sabeen Shah', syllabus: 'Essay Writing, Comprehension & Poetry analysis' },
  { id: 'ds-6', subject: 'Computer Science', examDate: '2026-10-25', startTime: '09:00 AM', endTime: '12:00 PM', roomNo: 'CS Lab 1', totalMarks: 100, passingMarks: 33, invigilator: 'Mr. Asad Ali', syllabus: 'Programming in Python, Data Structures & Networking' },
];

const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: 'ex-mid-10a',
    name: 'Midterm Examination Fall 2026',
    type: 'MIDTERM',
    session: '2026-2027',
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    className: 'Class 10',
    sectionName: 'Section A (Alpha)',
    sectionId: 'sec-1',
    status: 'PUBLISHED',
    dateSheet: DEFAULT_DATE_SHEET,
  },
  {
    id: 'ex-final-10a',
    name: 'Annual Board Prep Exam 2027',
    type: 'FINAL',
    session: '2026-2027',
    startDate: '2027-03-10',
    endDate: '2027-03-24',
    className: 'Class 10',
    sectionName: 'Section A (Alpha)',
    sectionId: 'sec-1',
    status: 'UPCOMING',
    dateSheet: DEFAULT_DATE_SHEET.slice(0, 4),
  },
  {
    id: 'ex-quiz-9b',
    name: 'Monthly Science & Math Assessment',
    type: 'MONTHLY_TEST',
    session: '2026-2027',
    startDate: '2026-09-20',
    endDate: '2026-09-24',
    className: 'Class 9',
    sectionName: 'Section B (Beta)',
    sectionId: 'sec-4',
    status: 'PUBLISHED',
    dateSheet: DEFAULT_DATE_SHEET.slice(0, 3),
  },
];

const DEFAULT_STUDENTS_GRADES: StudentGradeRecord[] = [
  {
    studentId: 'st-01',
    rollNo: '101',
    studentName: 'Aarav Sharma',
    sectionId: 'sec-1',
    gender: 'MALE',
    attendancePct: 96,
    conductRemarks: 'Outstanding intellectual curiosity and exemplary discipline.',
    subjectMarks: {
      Mathematics: { obtained: 98, remarks: 'Top score, brilliant analytical logic.' },
      Physics: { obtained: 94, remarks: 'Excellent theoretical understanding.' },
      Chemistry: { obtained: 92, remarks: 'Great practical lab accuracy.' },
      Biology: { obtained: 90, remarks: 'Very thorough diagrams.' },
      'English Literature': { obtained: 91, remarks: 'Eloquent expression.' },
      'Computer Science': { obtained: 99, remarks: 'Perfect coding solutions.' },
    },
  },
  {
    studentId: 'st-02',
    rollNo: '102',
    studentName: 'Ayesha Siddiqui',
    sectionId: 'sec-1',
    gender: 'FEMALE',
    attendancePct: 98,
    conductRemarks: 'Highly dedicated, consistent class topper and attentive student.',
    subjectMarks: {
      Mathematics: { obtained: 96, remarks: 'Excellent performance.' },
      Physics: { obtained: 95, remarks: 'Top in numericals.' },
      Chemistry: { obtained: 96, remarks: 'Flawless equations.' },
      Biology: { obtained: 97, remarks: 'Outstanding biology paper.' },
      'English Literature': { obtained: 94, remarks: 'Superb essay.' },
      'Computer Science': { obtained: 95, remarks: 'Very good algorithms.' },
    },
  },
  {
    studentId: 'st-03',
    rollNo: '103',
    studentName: 'Bilal Hussain',
    sectionId: 'sec-1',
    gender: 'MALE',
    attendancePct: 92,
    conductRemarks: 'Good active participant in discussions, keep up the effort.',
    subjectMarks: {
      Mathematics: { obtained: 84, remarks: 'Strong algebra skills.' },
      Physics: { obtained: 80, remarks: 'Good grasp of concepts.' },
      Chemistry: { obtained: 78, remarks: 'Needs more practice in stoichiometry.' },
      Biology: { obtained: 82, remarks: 'Good performance.' },
      'English Literature': { obtained: 85, remarks: 'Creative writing.' },
      'Computer Science': { obtained: 88, remarks: 'Strong logic.' },
    },
  },
  {
    studentId: 'st-04',
    rollNo: '104',
    studentName: 'Fatima Noor',
    sectionId: 'sec-1',
    gender: 'FEMALE',
    attendancePct: 95,
    conductRemarks: 'Hardworking and well-mannered student.',
    subjectMarks: {
      Mathematics: { obtained: 89, remarks: 'Very consistent.' },
      Physics: { obtained: 87, remarks: 'Good work in optics.' },
      Chemistry: { obtained: 85, remarks: 'Neat equations.' },
      Biology: { obtained: 91, remarks: 'Very detailed answers.' },
      'English Literature': { obtained: 92, remarks: 'Well-structured grammar.' },
      'Computer Science': { obtained: 90, remarks: 'Clean code syntax.' },
    },
  },
  {
    studentId: 'st-05',
    rollNo: '105',
    studentName: 'Hamza Tariq',
    sectionId: 'sec-1',
    gender: 'MALE',
    attendancePct: 88,
    conductRemarks: 'Shows potential, recommended for extra math tutorials.',
    subjectMarks: {
      Mathematics: { obtained: 68, remarks: 'Review quadratic factoring.' },
      Physics: { obtained: 72, remarks: 'Satisfactory concepts.' },
      Chemistry: { obtained: 65, remarks: 'Focus on chemical bonding.' },
      Biology: { obtained: 74, remarks: 'Fair effort.' },
      'English Literature': { obtained: 76, remarks: 'Good vocabulary.' },
      'Computer Science': { obtained: 81, remarks: 'Good programming interest.' },
    },
  },
  {
    studentId: 'st-06',
    rollNo: '106',
    studentName: 'Zoya Khan',
    sectionId: 'sec-1',
    gender: 'FEMALE',
    attendancePct: 94,
    conductRemarks: 'Active in class activities and very organized.',
    subjectMarks: {
      Mathematics: { obtained: 91, remarks: 'Strong problem solving.' },
      Physics: { obtained: 88, remarks: 'Good results.' },
      Chemistry: { obtained: 89, remarks: 'Well prepared.' },
      Biology: { obtained: 93, remarks: 'Excellent botany diagrams.' },
      'English Literature': { obtained: 90, remarks: 'Great vocabulary.' },
      'Computer Science': { obtained: 92, remarks: 'Great debugging.' },
    },
  },
];

// Helper: Calculate Letter Grade & GPA based on Percentage
export function getGradeAndGPA(percentage: number): { grade: string; gpa: number; badgeColor: string; label: string } {
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0, badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Outstanding (With Distinction)' };
  if (percentage >= 80) return { grade: 'A', gpa: 3.7, badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', gpa: 3.0, badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', label: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', gpa: 2.3, badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Good' };
  if (percentage >= 50) return { grade: 'D', gpa: 1.7, badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30', label: 'Satisfactory / Pass' };
  return { grade: 'F', gpa: 0.0, badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30', label: 'Needs Remedial Support' };
}

export default function Exams() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || '';
  const examsStorageKey = `edusphere_exams_${schoolSlug}`;
  const gradesStorageKey = `edusphere_grades_${schoolSlug}`;

  // State
  const [exams, setExams] = useState<ExamItem[]>(() => {
    const saved = localStorage.getItem(examsStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_EXAMS;
  });

  const [gradesData, setGradesData] = useState<StudentGradeRecord[]>(() => {
    const saved = localStorage.getItem(gradesStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS_GRADES;
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<'schedules' | 'gradebook' | 'reportCards' | 'analytics'>('schedules');

  // Selection
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'ex-mid-10a');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showAddDateSheetModal, setShowAddDateSheetModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState<RankedStudentRecord | null>(null);
  const [showPrintDateSheetModal, setShowPrintDateSheetModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'MIDTERM' as ExamItem['type'],
    session: '2026-2027',
    startDate: '',
    endDate: '',
    className: 'Class 10',
    sectionName: 'Section A (Alpha)',
    sectionId: 'sec-1',
  });

  const [dateSheetForm, setDateSheetForm] = useState({
    subject: 'Mathematics',
    examDate: '',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    roomNo: 'Hall A (Main)',
    totalMarks: 100,
    passingMarks: 33,
    invigilator: 'Dr. Ananya Roy',
    syllabus: '',
  });

  // Persist handlers
  const saveExams = (updated: ExamItem[]) => {
    setExams(updated);
    localStorage.setItem(examsStorageKey, JSON.stringify(updated));
  };

  const saveGrades = (updated: StudentGradeRecord[]) => {
    setGradesData(updated);
    localStorage.setItem(gradesStorageKey, JSON.stringify(updated));
  };

  const currentExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || exams[0];
  }, [exams, selectedExamId]);

  // Handle Mark Change in Gradebook
  const handleMarkChange = (studentId: string, subject: string, val: string) => {
    const num = parseFloat(val);
    const updated = gradesData.map(st => {
      if (st.studentId !== studentId) return st;
      const currentSub = st.subjectMarks[subject] || { obtained: 0, remarks: '' };
      return {
        ...st,
        subjectMarks: {
          ...st.subjectMarks,
          [subject]: {
            ...currentSub,
            obtained: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)),
            isAbsent: false,
          },
        },
      };
    });
    saveGrades(updated);
  };

  // Toggle Absent Status
  const handleToggleAbsent = (studentId: string, subject: string) => {
    const updated = gradesData.map(st => {
      if (st.studentId !== studentId) return st;
      const currentSub = st.subjectMarks[subject] || { obtained: 0, remarks: '' };
      return {
        ...st,
        subjectMarks: {
          ...st.subjectMarks,
          [subject]: {
            ...currentSub,
            isAbsent: !currentSub.isAbsent,
            obtained: !currentSub.isAbsent ? 0 : currentSub.obtained,
          },
        },
      };
    });
    saveGrades(updated);
    toast.success('Attendance status updated.');
  };

  // Save new Exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) return;
    setSaving(true);

    const newExam: ExamItem = {
      id: `ex-${Date.now()}`,
      name: examForm.name.trim(),
      type: examForm.type,
      session: examForm.session,
      startDate: examForm.startDate,
      endDate: examForm.endDate,
      className: examForm.className,
      sectionName: examForm.sectionName,
      sectionId: examForm.sectionId,
      status: 'UPCOMING',
      dateSheet: DEFAULT_DATE_SHEET.slice(0, 4),
    };

    const updated = [newExam, ...exams];
    saveExams(updated);
    setSelectedExamId(newExam.id);
    toast.success(`Exam session "${newExam.name}" scheduled successfully!`);
    setShowAddExamModal(false);
    setSaving(false);
  };

  // Add Paper to Date Sheet
  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExam) return;

    const newPaper: DateSheetItem = {
      id: `ds-${Date.now()}`,
      subject: dateSheetForm.subject,
      examDate: dateSheetForm.examDate,
      startTime: dateSheetForm.startTime,
      endTime: dateSheetForm.endTime,
      roomNo: dateSheetForm.roomNo,
      totalMarks: Number(dateSheetForm.totalMarks) || 100,
      passingMarks: Number(dateSheetForm.passingMarks) || 33,
      invigilator: dateSheetForm.invigilator,
      syllabus: dateSheetForm.syllabus || 'As communicated in class curriculum.',
    };

    const updatedExams = exams.map(ex => {
      if (ex.id !== currentExam.id) return ex;
      return {
        ...ex,
        dateSheet: [...ex.dateSheet, newPaper],
      };
    });

    saveExams(updatedExams);
    toast.success(`${newPaper.subject} paper added to date sheet!`);
    setShowAddDateSheetModal(false);
  };

  // Delete Exam
  const handleDeleteExam = (id: string, name: string) => {
    if (!confirm(`Delete exam "${name}" and all scheduled date sheets?`)) return;
    const updated = exams.filter(e => e.id !== id);
    saveExams(updated);
    if (selectedExamId === id && updated.length > 0) setSelectedExamId(updated[0].id);
    toast.success('Exam removed.');
  };


  // Calculate Student Cumulative Totals & Ranks
  const rankedStudents = useMemo((): RankedStudentRecord[] => {
    const list = gradesData.map(st => {
      const subjectKeys = Object.keys(st.subjectMarks);
      const totalPossible = subjectKeys.length * 100;
      const totalObtained = subjectKeys.reduce((acc, sub) => {
        const item = st.subjectMarks[sub];
        return acc + (item?.isAbsent ? 0 : (item?.obtained || 0));
      }, 0);

      const percentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 1000) / 10 : 0;
      const { grade, gpa, badgeColor, label } = getGradeAndGPA(percentage);

      return {
        ...st,
        totalObtained,
        totalPossible,
        percentage,
        grade,
        gpa,
        badgeColor,
        gradeLabel: label,
        rank: 0,
      };
    });

    // Sort descending by percentage
    list.sort((a, b) => b.percentage - a.percentage);

    return list.map((st, idx) => ({
      ...st,
      rank: idx + 1,
    }));
  }, [gradesData]);

  // Overall Class Analytics
  const classStats = useMemo(() => {
    if (rankedStudents.length === 0) return { avgPct: 0, passPct: 0, highest: 0, lowest: 0 };
    const avg = Math.round(rankedStudents.reduce((a, s) => a + s.percentage, 0) / rankedStudents.length);
    const passed = rankedStudents.filter(s => s.percentage >= 33).length;
    const passPct = Math.round((passed / rankedStudents.length) * 100);
    const highest = rankedStudents[0]?.percentage || 0;
    const lowest = rankedStudents[rankedStudents.length - 1]?.percentage || 0;
    return { avgPct: avg, passPct, highest, lowest };
  }, [rankedStudents]);

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Examination & Academic Assessment Board
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Exams, Date Sheets & Gradebook</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage examination schedules, invigilation date sheets, live marks entry, and printable student DMC report cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetDemo}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-bold transition-all shadow-sm"
            title="Reset to Demo State"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setShowAddDateSheetModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} className="text-primary" /> Add Paper to Date Sheet
          </button>

          <button
            onClick={() => setShowAddExamModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Schedule New Exam
          </button>
        </div>
      </div>

      {/* 2. Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Exam Sessions</p>
            <p className="text-2xl font-black text-foreground">{exams.length}</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Scheduled Sessions</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Class Passing Rate</p>
            <p className="text-2xl font-black text-foreground">{classStats.passPct}%</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Class 10 Average</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Class Top Score</p>
            <p className="text-2xl font-black text-foreground">{classStats.highest}%</p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">Rank 1 · {rankedStudents[0]?.studentName || 'Student'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <BarChart4 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Class GPA Average</p>
            <p className="text-2xl font-black text-foreground">3.65</p>
            <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">Overall Grade A</p>
          </div>
        </div>
      </div>

      {/* 3. Exam Switcher & Navigation Tabs */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Main Tab Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 self-start">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'schedules'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={13} /> Date Sheets & Papers
            </button>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'gradebook'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet size={13} /> Marks Entry Gradebook
            </button>
            <button
              onClick={() => setActiveTab('reportCards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'reportCards'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award size={13} /> Merit List & Report Cards (DMC)
            </button>
          </div>

          {/* Active Exam Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground shrink-0">Selected Exam:</span>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} — {ex.className} ({ex.sectionName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exam Quick Status Strip */}
        {currentExam && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {currentExam.type}
              </span>
              <span>Class: <strong className="text-foreground">{currentExam.className} · {currentExam.sectionName}</strong></span>
              <span>Timeline: <strong className="text-foreground">{currentExam.startDate} to {currentExam.endDate}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ● {currentExam.status}
              </span>
              <button
                onClick={() => handleDeleteExam(currentExam.id, currentExam.name)}
                className="text-muted-foreground hover:text-destructive text-[11px] font-semibold underline ml-2"
              >
                Delete Exam
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT 1: DATE SHEET & EXAM SCHEDULE */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Examination Date Sheet & Invigilation Matrix
            </h3>
            <button
              onClick={() => setShowPrintDateSheetModal(true)}
              className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-accent text-foreground text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer size={14} /> Print Official Date Sheet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentExam?.dateSheet.map((paper, idx) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      Paper {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-foreground flex items-center gap-1">
                      <Calendar size={11} className="text-primary" /> {paper.examDate}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                    {paper.subject}
                  </h4>

                  <div className="space-y-2 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> Time:</span>
                      <strong className="text-foreground">{paper.startTime} - {paper.endTime}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> Exam Hall:</span>
                      <strong className="text-foreground">{paper.roomNo}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><UserCheck size={12} className="text-primary" /> Invigilator:</span>
                      <strong className="text-foreground">{paper.invigilator}</strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                      <span>Total Marks:</span>
                      <strong className="text-foreground">{paper.totalMarks} (Pass: {paper.passingMarks})</strong>
                    </div>
                  </div>

                  {paper.syllabus && (
                    <div className="mt-3 p-2.5 rounded-xl bg-accent/30 border border-border/60 text-[11px]">
                      <span className="font-bold text-foreground">Syllabus Scope: </span>
                      <span className="text-muted-foreground">{paper.syllabus}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: GRADEBOOK / LIVE MARKS ENTRY */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-primary" />
              <div>
                <h3 className="font-black text-foreground text-sm">Class Marks Entry & Assessment Sheet</h3>
                <p className="text-[11px] text-muted-foreground">Enter marks for each subject; GPA & overall grade compute instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const rows = rankedStudents.map(st => {
                    const math = st.subjectMarks['Mathematics']?.obtained || 0;
                    const phy = st.subjectMarks['Physics']?.obtained || 0;
                    const chem = st.subjectMarks['Chemistry']?.obtained || 0;
                    return `"${st.rollNo}","${st.studentName}","${math}","${phy}","${chem}","${st.totalObtained}","${st.percentage}%","${st.grade}"`;
                  }).join('\n');
                  const blob = new Blob([`Roll No,Student Name,Math,Physics,Chemistry,Total Obtained,Percentage,Grade\n${rows}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Marksheet_${currentExam.name.replace(/\s+/g, '_')}.csv`;
                  a.click();
                  toast.success('Marksheet exported as CSV!');
                }}
                className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground text-xs font-bold flex items-center gap-1.5"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* Gradebook Spreadsheet Matrix */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead className="bg-accent/40 text-foreground font-black border-b border-border text-[11px]">
                  <tr>
                    <th className="p-3.5">Roll</th>
                    <th className="p-3.5">Student Name</th>
                    {[].slice(0, 6).map(sub => (
                      <th key={sub} className="p-3.5 text-center">{sub} (100)</th>
                    ))}
                    <th className="p-3.5 text-center">Total Marks</th>
                    <th className="p-3.5 text-center">Percentage</th>
                    <th className="p-3.5 text-center">Grade</th>
                    <th className="p-3.5 text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {rankedStudents.map(st => (
                    <tr key={st.studentId} className="hover:bg-accent/15 transition-colors">
                      <td className="p-3.5 font-mono font-bold">{st.rollNo}</td>
                      <td className="p-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          {st.rank === 1 && <Trophy size={14} className="text-amber-400 shrink-0" />}
                          {st.rank === 2 && <Trophy size={14} className="text-slate-300 shrink-0" />}
                          {st.rank === 3 && <Trophy size={14} className="text-amber-600 shrink-0" />}
                          <span>{st.studentName}</span>
                        </div>
                      </td>

                      {/* Subject Mark Inputs */}
                      {[].slice(0, 6).map(sub => {
                        const rec = st.subjectMarks[sub] || { obtained: 0, isAbsent: false };
                        return (
                          <td key={sub} className="p-2 text-center">
                            {rec.isAbsent ? (
                              <button
                                onClick={() => handleToggleAbsent(st.studentId, sub)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]"
                              >
                                ABSENT
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={rec.obtained}
                                  onChange={e => handleMarkChange(st.studentId, sub, e.target.value)}
                                  className={`w-14 text-center px-1.5 py-1 rounded-lg border text-xs font-mono font-bold focus:outline-none focus:border-primary ${
                                    rec.obtained >= 80 ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' :
                                    rec.obtained >= 50 ? 'border-border bg-background text-foreground' :
                                    'border-rose-500/40 text-rose-400 bg-rose-500/5'
                                  }`}
                                />
                                <button
                                  onClick={() => handleToggleAbsent(st.studentId, sub)}
                                  title="Mark as absent"
                                  className="text-[9px] text-muted-foreground hover:text-rose-400 p-0.5"
                                >
                                  A
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Cumulative Total */}
                      <td className="p-3.5 text-center font-mono font-extrabold text-foreground">
                        {st.totalObtained} / {st.totalPossible}
                      </td>

                      {/* Percentage */}
                      <td className="p-3.5 text-center font-mono font-black text-foreground">
                        {st.percentage}%
                      </td>

                      {/* Grade Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${st.badgeColor}`}>
                          {st.grade} ({st.gpa})
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setShowReportCardModal(st)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border border-primary/20 transition-all inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> View DMC
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: MERIT LIST & REPORT CARDS */}
      {activeTab === 'reportCards' && (
        <div className="space-y-6">
          {/* Top 3 Position Holders Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rank 1 Gold */}
            {rankedStudents[0] && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-card border-2 border-amber-500/40 shadow-lg text-center space-y-3 relative overflow-hidden">
                <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-lg">
                  <Trophy size={32} />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest inline-block border border-amber-500/30">
                  🥇 1st Position (Gold)
                </span>
                <h4 className="text-lg font-black text-foreground">{rankedStudents[0].studentName}</h4>
                <p className="text-2xl font-black text-amber-400 font-mono">{rankedStudents[0].percentage}% · Grade {rankedStudents[0].grade}</p>
                <p className="text-xs text-muted-foreground">Roll No: {rankedStudents[0].rollNo} · {rankedStudents[0].totalObtained} Marks</p>
                <button
                  onClick={() => setShowReportCardModal(rankedStudents[0])}
                  className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-400"
                >
                  Generate Official Report Card
                </button>
              </div>
            )}

            {/* Rank 2 Silver */}
            {rankedStudents[1] && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-400/10 to-card border border-border shadow-sm text-center space-y-3">
                <div className="h-14 w-14 mx-auto rounded-full bg-slate-400/20 border border-slate-400 flex items-center justify-center text-slate-300">
                  <Trophy size={28} />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-400/20 text-slate-300 text-xs font-black uppercase tracking-widest inline-block">
                  🥈 2nd Position (Silver)
                </span>
                <h4 className="text-lg font-black text-foreground">{rankedStudents[1].studentName}</h4>
                <p className="text-2xl font-black text-foreground font-mono">{rankedStudents[1].percentage}% · Grade {rankedStudents[1].grade}</p>
                <p className="text-xs text-muted-foreground">Roll No: {rankedStudents[1].rollNo} · {rankedStudents[1].totalObtained} Marks</p>
                <button
                  onClick={() => setShowReportCardModal(rankedStudents[1])}
                  className="w-full py-2 rounded-xl bg-card border border-border text-foreground font-bold text-xs hover:bg-accent"
                >
                  Generate Official Report Card
                </button>
              </div>
            )}

            {/* Rank 3 Bronze */}
            {rankedStudents[2] && (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-700/10 to-card border border-border shadow-sm text-center space-y-3">
                <div className="h-14 w-14 mx-auto rounded-full bg-amber-700/20 border border-amber-700 flex items-center justify-center text-amber-600">
                  <Trophy size={28} />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-700/20 text-amber-500 text-xs font-black uppercase tracking-widest inline-block">
                  🥉 3rd Position (Bronze)
                </span>
                <h4 className="text-lg font-black text-foreground">{rankedStudents[2].studentName}</h4>
                <p className="text-2xl font-black text-foreground font-mono">{rankedStudents[2].percentage}% · Grade {rankedStudents[2].grade}</p>
                <p className="text-xs text-muted-foreground">Roll No: {rankedStudents[2].rollNo} · {rankedStudents[2].totalObtained} Marks</p>
                <button
                  onClick={() => setShowReportCardModal(rankedStudents[2])}
                  className="w-full py-2 rounded-xl bg-card border border-border text-foreground font-bold text-xs hover:bg-accent"
                >
                  Generate Official Report Card
                </button>
              </div>
            )}
          </div>

          {/* Full Merit List Table */}
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="font-black text-foreground text-sm flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" /> Full Class Merit Order & Performance Ranks
            </h4>

            <div className="divide-y divide-border">
              {rankedStudents.map(st => (
                <div key={st.studentId} className="py-3 flex items-center justify-between gap-4 hover:bg-accent/10 px-3 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                      #{st.rank}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-foreground">{st.studentName}</h5>
                      <p className="text-[11px] text-muted-foreground">Roll No: {st.rollNo} · Attendance: {st.attendancePct}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-mono font-black text-sm text-foreground">{st.percentage}%</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${st.badgeColor}`}>
                        Grade {st.grade} ({st.gpa} GPA)
                      </span>
                    </div>

                    <button
                      onClick={() => setShowReportCardModal(st)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer size={12} /> Print DMC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: OFFICIAL STUDENT DMC REPORT CARD */}
      <Modal isOpen={!!showReportCardModal} onClose={() => setShowReportCardModal(null)} maxWidth="max-w-4xl">
        {showReportCardModal && (
          <div className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Official Detailed Marks Certificate (DMC)</h2>
                  <p className="text-xs text-muted-foreground">{showReportCardModal.studentName} (Roll {showReportCardModal.rollNo})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Printer size={14} /> Print Report Card
                </button>
                <button onClick={() => setShowReportCardModal(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable DMC Document */}
            <div className="py-6 bg-white text-slate-900 p-8 rounded-2xl my-4 space-y-6 font-sans border border-slate-200">
              {/* Official School Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-black tracking-wider uppercase">EDUSPHERE INTERNATIONAL ACADEMY</h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                  Affiliated with Board of Intermediate & Secondary Education
                </p>
                <h3 className="text-sm font-black uppercase text-slate-900 mt-2 tracking-wide border-t border-slate-300 pt-2">
                  DETAILED MARKS CERTIFICATE (DMC) · {currentExam.name}
                </h3>
              </div>

              {/* Student Info Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{showReportCardModal.studentName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Roll Number:</span>
                  <p className="font-extrabold text-slate-900 text-sm font-mono">{showReportCardModal.rollNo}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Class & Section:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{currentExam.className} - {currentExam.sectionName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Class Rank:</span>
                  <p className="font-extrabold text-amber-600 text-sm">Position #{showReportCardModal.rank} in Class</p>
                </div>
              </div>

              {/* Subject-Wise Marks Breakdown Table */}
              <table className="w-full text-left border-collapse border border-slate-800 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 font-black text-slate-900">
                    <th className="p-2.5 border border-slate-800">Subject Name</th>
                    <th className="p-2.5 border border-slate-800 text-center">Max Marks</th>
                    <th className="p-2.5 border border-slate-800 text-center">Pass Marks</th>
                    <th className="p-2.5 border border-slate-800 text-center">Marks Obtained</th>
                    <th className="p-2.5 border border-slate-800 text-center">Grade</th>
                    <th className="p-2.5 border border-slate-800">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(showReportCardModal.subjectMarks).map(sub => {
                    const item = showReportCardModal.subjectMarks[sub];
                    const { grade } = getGradeAndGPA(item.obtained);
                    return (
                      <tr key={sub} className="border-b border-slate-800">
                        <td className="p-2.5 border border-slate-800 font-bold">{sub}</td>
                        <td className="p-2.5 border border-slate-800 text-center font-mono">100</td>
                        <td className="p-2.5 border border-slate-800 text-center font-mono">33</td>
                        <td className="p-2.5 border border-slate-800 text-center font-mono font-extrabold text-slate-900">
                          {item.isAbsent ? 'ABSENT' : item.obtained}
                        </td>
                        <td className="p-2.5 border border-slate-800 text-center font-extrabold">{grade}</td>
                        <td className="p-2.5 border border-slate-800 text-slate-600 text-[11px]">{item.remarks || 'Good effort.'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800 text-slate-900">
                    <td className="p-2.5 border border-slate-800 uppercase">Grand Total</td>
                    <td className="p-2.5 border border-slate-800 text-center font-mono">{showReportCardModal.totalPossible}</td>
                    <td className="p-2.5 border border-slate-800 text-center font-mono">198</td>
                    <td className="p-2.5 border border-slate-800 text-center font-mono text-sm">{showReportCardModal.totalObtained}</td>
                    <td className="p-2.5 border border-slate-800 text-center text-sm">{showReportCardModal.grade}</td>
                    <td className="p-2.5 border border-slate-800 font-bold text-emerald-700">{showReportCardModal.percentage}% · {showReportCardModal.gradeLabel}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Conduct & Remarks */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-900">Class Teacher Remarks: </span>
                <span className="text-slate-700 italic">"{showReportCardModal.conductRemarks}"</span>
              </div>

              {/* Official Stamp & Signatures */}
              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs font-bold text-slate-700">
                <div className="border-t border-slate-400 pt-2">Class Teacher Signature</div>
                <div className="border-t border-slate-400 pt-2">Controller of Examinations</div>
                <div className="border-t border-slate-400 pt-2">Principal Official Seal</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. MODAL: SCHEDULE NEW EXAM */}
      <Modal isOpen={showAddExamModal} onClose={() => setShowAddExamModal(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Calendar size={20} />}
          title="Schedule Examination Session"
          subtitle="Setup midterm, final or unit assessment"
          onClose={() => setShowAddExamModal(false)}
        />
        <form onSubmit={handleCreateExam} className="space-y-4 text-sm p-6">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Exam Title *</label>
                  <input
                    value={examForm.name}
                    onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                    required
                    placeholder="e.g. Midterm Examination Fall 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Exam Type *</label>
                    <select
                      value={examForm.type}
                      onChange={e => setExamForm({ ...examForm, type: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      <option value="MIDTERM">Midterm Exam</option>
                      <option value="FINAL">Final Board Exam</option>
                      <option value="MONTHLY_TEST">Monthly Unit Test</option>
                      <option value="QUIZ">Quiz Assessment</option>
                      <option value="MOCK_BOARD">Mock Board Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Academic Session *</label>
                    <input
                      value={examForm.session}
                      onChange={e => setExamForm({ ...examForm, session: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      value={examForm.startDate}
                      onChange={e => setExamForm({ ...examForm, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">End Date *</label>
                    <input
                      type="date"
                      value={examForm.endDate}
                      onChange={e => setExamForm({ ...examForm, endDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddExamModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Schedule Exam</span>
                  </button>
                </div>
        </form>
      </Modal>

      {/* 9. MODAL: ADD PAPER TO DATE SHEET */}
      <Modal isOpen={showAddDateSheetModal} onClose={() => setShowAddDateSheetModal(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<BookOpen size={20} />}
          title="Add Paper to Date Sheet"
          subtitle={currentExam?.name}
          onClose={() => setShowAddDateSheetModal(false)}
        />
        <form onSubmit={handleAddPaper} className="space-y-4 text-sm p-6">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Subject *</label>
                  <select
                    value={dateSheetForm.subject}
                    onChange={e => setDateSheetForm({ ...dateSheetForm, subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    {[].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Exam Date *</label>
                    <input
                      type="date"
                      value={dateSheetForm.examDate}
                      onChange={e => setDateSheetForm({ ...dateSheetForm, examDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Start Time</label>
                    <input
                      value={dateSheetForm.startTime}
                      onChange={e => setDateSheetForm({ ...dateSheetForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">End Time</label>
                    <input
                      value={dateSheetForm.endTime}
                      onChange={e => setDateSheetForm({ ...dateSheetForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Exam Hall / Room</label>
                    <input
                      value={dateSheetForm.roomNo}
                      onChange={e => setDateSheetForm({ ...dateSheetForm, roomNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Invigilator Teacher</label>
                    <input
                      value={dateSheetForm.invigilator}
                      onChange={e => setDateSheetForm({ ...dateSheetForm, invigilator: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Syllabus Scope</label>
                  <textarea
                    rows={2}
                    value={dateSheetForm.syllabus}
                    onChange={e => setDateSheetForm({ ...dateSheetForm, syllabus: e.target.value })}
                    placeholder="e.g. Chapters 1–4, derivations and numericals"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddDateSheetModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Paper
                  </button>
                </div>
        </form>
      </Modal>

      {/* 10. MODAL: PRINT OFFICIAL DATE SHEET */}
      <Modal isOpen={showPrintDateSheetModal} onClose={() => setShowPrintDateSheetModal(false)} maxWidth="max-w-4xl">
        <div className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Official Examination Date Sheet Printout</h2>
                    <p className="text-xs text-muted-foreground">{currentExam.name} · {currentExam.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md"
                  >
                    <Printer size={14} /> Print Now
                  </button>
                  <button onClick={() => setShowPrintDateSheetModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Date Sheet Document */}
              <div className="py-6 bg-white text-slate-900 p-8 rounded-2xl my-4 space-y-6 font-sans border border-slate-200">
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h1 className="text-2xl font-black tracking-wider uppercase">EDUSPHERE INTERNATIONAL ACADEMY</h1>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                    Controller of Examinations · Academic Session {currentExam.session}
                  </p>
                  <h3 className="text-sm font-black uppercase text-slate-900 mt-2 tracking-wide border-t border-slate-300 pt-2">
                    OFFICIAL DATE SHEET: {currentExam.name} ({currentExam.className} - {currentExam.sectionName})
                  </h3>
                </div>

                <table className="w-full text-left border-collapse border border-slate-800 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 font-black text-slate-900">
                      <th className="p-2.5 border border-slate-800">Date & Day</th>
                      <th className="p-2.5 border border-slate-800">Subject</th>
                      <th className="p-2.5 border border-slate-800">Exam Timing</th>
                      <th className="p-2.5 border border-slate-800">Room / Hall</th>
                      <th className="p-2.5 border border-slate-800">Invigilator</th>
                      <th className="p-2.5 border border-slate-800">Total Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentExam.dateSheet.map(p => (
                      <tr key={p.id} className="border-b border-slate-800">
                        <td className="p-2.5 border border-slate-800 font-bold font-mono">{p.examDate}</td>
                        <td className="p-2.5 border border-slate-800 font-extrabold text-slate-900">{p.subject}</td>
                        <td className="p-2.5 border border-slate-800 font-mono text-slate-700">{p.startTime} - {p.endTime}</td>
                        <td className="p-2.5 border border-slate-800">{p.roomNo}</td>
                        <td className="p-2.5 border border-slate-800">{p.invigilator}</td>
                        <td className="p-2.5 border border-slate-800 font-mono font-bold text-center">{p.totalMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-1 text-slate-700">
                  <p className="font-bold text-slate-900">Important Instructions for Candidates:</p>
                  <p>1. Candidates must arrive at the examination hall 15 minutes before the start time.</p>
                  <p>2. Electronic gadgets, mobile phones, and programmable calculators are strictly prohibited.</p>
                  <p>3. Roll Number Slip / Student ID card is mandatory for entrance to examination halls.</p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold text-slate-700">
                  <div className="border-t border-slate-400 pt-2">Controller of Examinations</div>
                  <div className="border-t border-slate-400 pt-2">Principal / Head of Institution</div>
                </div>
              </div>
        </div>
      </Modal>

    </div>
  );
}
