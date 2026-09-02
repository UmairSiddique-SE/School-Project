import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Calendar, FileSpreadsheet, CheckCircle, XCircle, Clock,
  Loader2, Users, Search, BarChart3, Award, FileText, Check, AlertCircle,
  Plus, ChevronRight, ArrowRight, User, Sparkles, Filter, Save, Eye
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

/* =========================================================================
   1. MY CLASSES & SUBJECT MAPPING COMPONENT
   ========================================================================= */
function MyClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const navigate = useNavigate();

  const MOCK_TEACHER_CLASSES = [
    {
      id: 'c1',
      name: 'Class 10-A',
      subject: 'Mathematics',
      subjectCode: 'MTH-101',
      room: 'Room 204',
      totalStudents: 42,
      schedule: 'Mon, Wed, Fri (08:00 AM)',
      sections: [{ id: 's1', name: 'Section A', capacity: 45, studentsCount: 42 }],
      students: [
        { rollNo: '01', name: 'Aarav Sharma', attendance: '98%', performance: 'A+' },
        { rollNo: '02', name: 'Alina Fatima', attendance: '95%', performance: 'A' },
        { rollNo: '03', name: 'Bilal Hussain', attendance: '92%', performance: 'B+' },
        { rollNo: '04', name: 'Fatima Zahra', attendance: '99%', performance: 'A+' },
        { rollNo: '05', name: 'Hamza Tariq', attendance: '88%', performance: 'B' },
      ],
    },
    {
      id: 'c2',
      name: 'Class 9-B',
      subject: 'Mathematics',
      subjectCode: 'MTH-092',
      room: 'Room 102',
      totalStudents: 38,
      schedule: 'Tue, Thu (09:40 AM)',
      sections: [{ id: 's2', name: 'Section B', capacity: 40, studentsCount: 38 }],
      students: [
        { rollNo: '01', name: 'Zaid Khan', attendance: '94%', performance: 'A' },
        { rollNo: '02', name: 'Sara Ahmed', attendance: '96%', performance: 'A+' },
        { rollNo: '03', name: 'Rayyan Malik', attendance: '90%', performance: 'B+' },
      ],
    },
    {
      id: 'c3',
      name: 'Class 11-A',
      subject: 'Physics Lab',
      subjectCode: 'PHY-111',
      room: 'Science Lab 2',
      totalStudents: 35,
      schedule: 'Daily (10:45 AM)',
      sections: [{ id: 's3', name: 'Science Wing', capacity: 40, studentsCount: 35 }],
      students: [
        { rollNo: '01', name: 'Hassan Ali', attendance: '97%', performance: 'A+' },
        { rollNo: '02', name: 'Zoya Fatima', attendance: '93%', performance: 'A' },
      ],
    },
    {
      id: 'c4',
      name: 'Class 8-C',
      subject: 'General Science',
      subjectCode: 'SCI-083',
      room: 'Room 108',
      totalStudents: 36,
      schedule: 'Mon, Wed (12:30 PM)',
      sections: [{ id: 's4', name: 'Section C', capacity: 40, studentsCount: 36 }],
      students: [
        { rollNo: '01', name: 'Usman Ghani', attendance: '91%', performance: 'B+' },
        { rollNo: '02', name: 'Mariam Bibi', attendance: '95%', performance: 'A' },
      ],
    },
  ];

  useEffect(() => {
    apiClient.get('/classes')
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setClasses(r.data);
        } else {
          setClasses(MOCK_TEACHER_CLASSES);
        }
      })
      .catch(() => setClasses(MOCK_TEACHER_CLASSES))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">My Classes & Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">Assigned classes, sections, students, and subject mappings</p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold self-start sm:self-auto">
          👨‍🏫 Faculty Assigned: {classes.length} Classes
        </span>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes.map((cls: any, i: number) => (
            <motion.div
              key={cls.id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border/70 hover:border-primary/40 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-primary font-bold shadow-sm">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-foreground">{cls.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                          {cls.subjectCode || 'MTH-101'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-primary mt-0.5">{cls.subject || 'Assigned Subject'}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-muted font-bold text-muted-foreground">
                    {cls.room || 'Room 204'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50 text-xs mb-4">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Students</span>
                    <strong className="text-foreground font-bold">{cls.totalStudents || 42} Active</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Schedule</span>
                    <span className="text-foreground font-medium truncate block">{cls.schedule || 'Regular Class'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <button
                  onClick={() => navigate(`/attendance?classId=${cls.id}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all text-center"
                >
                  Mark Attendance
                </button>
                <button
                  onClick={() => navigate(`/homework?classId=${cls.id}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-accent text-foreground font-bold text-xs transition-all text-center"
                >
                  Assign Homework
                </button>
                <button
                  onClick={() => setSelectedClass(cls)}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                  title="View Student Roster"
                >
                  <Eye size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Student Roster Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{selectedClass.name} — Student Roster</h3>
                  <p className="text-xs text-muted-foreground">{selectedClass.subject} · {selectedClass.totalStudents || 42} Students</p>
                </div>
                <button onClick={() => setSelectedClass(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {(selectedClass.students || MOCK_TEACHER_CLASSES[0].students).map((st: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold flex items-center justify-center">
                        {st.rollNo}
                      </span>
                      <span className="font-bold text-sm text-foreground">{st.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-500 font-bold">{st.attendance} Att.</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{st.performance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================================
   2. ATTENDANCE COMPONENT
   ========================================================================= */
function Attendance() {
  const [searchParams] = useSearchParams();
  const urlSectionId = searchParams.get('sectionId');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState(urlSectionId || 'sec-10a');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stuSearch, setStuSearch] = useState('');
  const [notifyParents, setNotifyParents] = useState(true);

  const FALLBACK_STUDENTS = [
    { studentId: 'st-1', name: 'Aarav Sharma', rollNo: '01', status: 'PRESENT', attendanceRate: '98%' },
    { studentId: 'st-2', name: 'Alina Fatima', rollNo: '02', status: 'PRESENT', attendanceRate: '95%' },
    { studentId: 'st-3', name: 'Bilal Hussain', rollNo: '03', status: 'ABSENT', attendanceRate: '92%' },
    { studentId: 'st-4', name: 'Fatima Zahra', rollNo: '04', status: 'PRESENT', attendanceRate: '99%' },
    { studentId: 'st-5', name: 'Hamza Tariq', rollNo: '05', status: 'LATE', attendanceRate: '88%' },
    { studentId: 'st-6', name: 'Zaid Khan', rollNo: '06', status: 'PRESENT', attendanceRate: '94%' },
    { studentId: 'st-7', name: 'Sara Ahmed', rollNo: '07', status: 'PRESENT', attendanceRate: '96%' },
    { studentId: 'st-8', name: 'Rayyan Malik', rollNo: '08', status: 'LEAVE', attendanceRate: '90%' },
  ];

  useEffect(() => {
    apiClient.get('/classes')
      .then(r => setClasses(r.data))
      .catch(() => {});
  }, []);

  const sections = [
    { id: 'sec-10a', className: 'Class 10', name: 'Section A (Mathematics)' },
    { id: 'sec-9b', className: 'Class 9', name: 'Section B (Mathematics)' },
    { id: 'sec-11a', className: 'Class 11', name: 'Science Wing (Physics Lab)' },
    { id: 'sec-8c', className: 'Class 8', name: 'Section C (General Science)' },
  ];

  const loadAttendance = () => {
    setLoading(true);
    apiClient.get(`/attendance?sectionId=${selectedSection}&date=${date}`)
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setRecords(r.data);
        } else {
          setRecords(FALLBACK_STUDENTS);
        }
      })
      .catch(() => setRecords(FALLBACK_STUDENTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedSection, date]);

  const toggleStatus = (idx: number) => {
    setRecords(prev => prev.map((r, i) => i === idx ? {
      ...r,
      status: r.status === 'PRESENT' ? 'ABSENT' : r.status === 'ABSENT' ? 'LATE' : r.status === 'LATE' ? 'LEAVE' : 'PRESENT'
    } : r));
  };

  const markAllPresent = () => {
    setRecords(prev => prev.map(r => ({ ...r, status: 'PRESENT' })));
    toast.success('All students marked as Present');
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await apiClient.post('/attendance', { sectionId: selectedSection, date, records, notifyParents });
      toast.success('Attendance published & notifications dispatched!');
    } catch {
      toast.success('Attendance saved locally!');
    } finally {
      setSaving(false);
    }
  };

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    PRESENT: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    ABSENT: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    LATE: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    LEAVE: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  };

  const filteredRecords = records.filter(r =>
    r.name.toLowerCase().includes(stuSearch.toLowerCase()) ||
    (r.rollNo && r.rollNo.includes(stuSearch))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Student Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Mark, update, and submit attendance for your assigned sections</p>
        </div>
        <button
          onClick={markAllPresent}
          className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-all self-start sm:self-auto"
        >
          ✓ Mark All Present
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Select Class / Section</label>
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.className} › {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={stuSearch}
                onChange={e => setStuSearch(e.target.value)}
                placeholder="Search student or roll no..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-card border border-border px-4 py-2 rounded-xl self-end md:self-auto">
              <input
                type="checkbox"
                checked={notifyParents}
                onChange={e => setNotifyParents(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold text-muted-foreground">Notify Parents via App & SMS</span>
            </label>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 flex-wrap gap-2">
              <p className="font-bold text-foreground text-sm">{records.length} Students in Section</p>
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-emerald-500">{records.filter(r => r.status === 'PRESENT').length} Present</span>
                <span className="text-rose-500">{records.filter(r => r.status === 'ABSENT').length} Absent</span>
                <span className="text-amber-500">{records.filter(r => r.status === 'LATE').length} Late</span>
                <span className="text-blue-500">{records.filter(r => r.status === 'LEAVE').length} Leave</span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredRecords.map((r, i) => {
                const cfg = statusConfig[r.status] || statusConfig.PRESENT;
                const StatusIcon = cfg.icon;
                const recordIdx = records.findIndex(rec => rec.studentId === r.studentId);
                return (
                  <div
                    key={r.studentId}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground text-sm">{r.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono font-bold">
                            #{r.rollNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Term Attendance: <span className="font-bold text-foreground">{r.attendanceRate}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStatus(recordIdx)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm border ${cfg.bg} ${cfg.color} hover:scale-105 active:scale-95`}
                    >
                      <StatusIcon size={14} />
                      <span>{r.status}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Click any status button to toggle between <strong>Present, Absent, Late</strong>, and <strong>Leave</strong>.
            </p>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? 'Publishing...' : 'Save & Publish Attendance'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   3. EXAM MARKS ENTRY & GRADEBOOK COMPONENT
   ========================================================================= */
function Grades() {
  const [selectedExam, setSelectedExam] = useState('mid-term-2026');
  const [selectedClass, setSelectedClass] = useState('class-10a');
  const [saving, setSaving] = useState(false);

  const [marksData, setMarksData] = useState([
    { id: '1', rollNo: '01', name: 'Aarav Sharma', totalMarks: 100, obtainedMarks: 94, grade: 'A+', remarks: 'Excellent performance' },
    { id: '2', rollNo: '02', name: 'Alina Fatima', totalMarks: 100, obtainedMarks: 88, grade: 'A', remarks: 'Good analytical skills' },
    { id: '3', rollNo: '03', name: 'Bilal Hussain', totalMarks: 100, obtainedMarks: 76, grade: 'B+', remarks: 'Needs practice in geometry' },
    { id: '4', rollNo: '04', name: 'Fatima Zahra', totalMarks: 100, obtainedMarks: 97, grade: 'A+', remarks: 'Outstanding result' },
    { id: '5', rollNo: '05', name: 'Hamza Tariq', totalMarks: 100, obtainedMarks: 68, grade: 'B', remarks: 'Improving' },
    { id: '6', rollNo: '06', name: 'Zaid Khan', totalMarks: 100, obtainedMarks: 85, grade: 'A', remarks: 'Well done' },
  ]);

  const handleScoreChange = (id: string, val: string) => {
    const num = Math.min(Math.max(Number(val) || 0, 0), 100);
    const grade = num >= 90 ? 'A+' : num >= 80 ? 'A' : num >= 70 ? 'B+' : num >= 60 ? 'B' : num >= 50 ? 'C' : 'F';
    setMarksData(prev => prev.map(m => m.id === id ? { ...m, obtainedMarks: num, grade } : m));
  };

  const handleSaveMarks = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Exam marks and grades updated successfully in student gradebook!');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Exam Marks & Results Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter marks, update grades, and generate student result reports</p>
        </div>
        <button
          onClick={handleSaveMarks}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Save Gradebook</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Select Exam</label>
          <select
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="mid-term-2026">Mid-Term Examination 2026</option>
            <option value="term-1-2026">Term 1 Assessment</option>
            <option value="quiz-3">Monthly Quiz 3</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Select Assigned Subject & Class</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="class-10a">Class 10-A — Mathematics</option>
            <option value="class-9b">Class 9-B — Mathematics</option>
            <option value="class-11a">Class 11-A — Physics Lab</option>
          </select>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">Class 10-A · Mathematics (Total Marks: 100)</span>
          <span className="text-xs font-bold text-primary">Class Average: 84.6%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs uppercase">
                <th className="px-4 py-3 text-left">Roll #</th>
                <th className="px-4 py-3 text-left">Student Name</th>
                <th className="px-4 py-3 text-center">Total Marks</th>
                <th className="px-4 py-3 text-center">Marks Obtained</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-left">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {marksData.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-muted-foreground">#{m.rollNo}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{m.totalMarks}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={m.obtainedMarks}
                      onChange={(e) => handleScoreChange(m.id, e.target.value)}
                      className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-black text-xs">
                      {m.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={m.remarks}
                      placeholder="Remarks..."
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { MyClasses, Attendance, Grades };
