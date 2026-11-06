import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
  Printer,
  Download,
  Search,
  FileCheck,
  Upload,
  Send,
  X,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  QrCode,
  Check,
  Info
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type Student = {
  id: string;
  admissionNo: string;
  name: string;
  email?: string;
  phone?: string;
  rollNo?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  religion?: string;
  bFormNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  admissionType?: string;
  session?: string;
  status: string;
  avatarUrl?: string;
  sectionId?: string;
  section?: { name: string; teacher?: { name: string } | null; class?: { name: string } } | null;
  account?: { name?: string; email?: string; role?: string };
};

type Homework = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  subject?: { name: string };
  isSubmitted?: boolean;
};

type Timetable = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject?: { name: string };
  teacher?: { name: string };
};

type Announcement = {
  id: string;
  title: string;
  content?: string;
  message?: string;
  createdAt: string;
  category?: string;
};

type Attendance = {
  id?: string;
  studentId: string;
  status: string;
  remarks?: string;
  date?: string;
};

type Exam = {
  id: string;
  name?: string;
  title?: string;
  startDate?: string;
  date?: string;
};

type Result = {
  id: string;
  examName: string;
  examDate?: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  passingMarks: number;
  isAbsent: boolean;
  grade?: string | null;
  remarks?: string | null;
};

type FeePayment = {
  id: string;
  receiptNo?: string;
  amount: number;
  discount?: number;
  fine?: number;
  totalPaid: number;
  status: string;
  dueDate?: string | null;
  paidDate?: string | null;
  feeStructure?: { name: string } | null;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Tab = 'overview' | 'attendance' | 'homework' | 'timetable' | 'exams' | 'results' | 'fees' | 'notices' | 'notifications' | 'profile';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'exams', label: 'Exams', icon: Award },
  { id: 'results', label: 'Results & Marks', icon: Award },
  { id: 'fees', label: 'Fee Portal', icon: WalletCards },
  { id: 'notices', label: 'Notices', icon: Megaphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: UserRound },
];

const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const dayName = (value: number) =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][value] || `Day ${value}`;

function Barcode({ value }: { value: string }) {
  const digits = Array.from(value || 'EDUSPHERE').map((char, index) => ((char.charCodeAt(0) + index * 17) % 5) + 1);
  return (
    <div className="w-full rounded-xl border border-border/80 bg-background p-2">
      <svg viewBox={`0 0 ${digits.length * 8 + 10} 38`} className="h-10 w-full">
        {digits.map((width, index) => (
          <rect key={index} x={5 + index * 8} y={2} width={width} height={34} rx="0.5" className="fill-foreground" />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-[9px] tracking-[0.25em] text-muted-foreground">{value}</p>
    </div>
  );
}

function CalculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (percentage >= 70) return { grade: 'B', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  if (percentage >= 50) return { grade: 'D', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
  return { grade: 'F', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
}

export default function StudentPortalPremium() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fees, setFees] = useState<FeePayment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showIdModal, setShowIdModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [submitHomeworkItem, setSubmitHomeworkItem] = useState<Homework | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submittingHw, setSubmittingHw] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());

  // Search queries
  const [homeworkSearch, setHomeworkSearch] = useState('');
  const [noticeSearch, setNoticeSearch] = useState('');

  const load = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const me = await apiClient.get('/people/me');
      const studentData = me.data as Student;
      setStudent(studentData);
      const sectionId = studentData.sectionId;
      const requests = await Promise.allSettled([
        apiClient.get('/academics/homework'),
        apiClient.get('/academics/timetables'),
        apiClient.get('/academics/announcements'),
        apiClient.get('/exams'),
        apiClient.get('/exams/my-results'),
        apiClient.get('/finance/payments'),
        apiClient.get('/notifications'),
        apiClient.get('/attendance/student/me'),
        sectionId
          ? apiClient.get(`/attendance?sectionId=${encodeURIComponent(sectionId)}&date=${new Date().toISOString().split('T')[0]}`)
          : Promise.resolve({ data: [] }),
      ]);
      const [hw, tt, notices, examData, resultData, feeData, notifData, attendanceData, todayData] = requests;
      if (hw.status === 'fulfilled') setHomework(Array.isArray(hw.value.data) ? hw.value.data : []);
      if (tt.status === 'fulfilled') setTimetable(Array.isArray(tt.value.data) ? tt.value.data : []);
      if (notices.status === 'fulfilled') setAnnouncements(Array.isArray(notices.value.data) ? notices.value.data : []);
      if (examData.status === 'fulfilled') setExams(Array.isArray(examData.value.data) ? examData.value.data : []);
      if (resultData.status === 'fulfilled') setResults(Array.isArray(resultData.value.data) ? resultData.value.data : []);
      if (feeData.status === 'fulfilled') setFees(Array.isArray(feeData.value.data) ? feeData.value.data : []);
      if (notifData.status === 'fulfilled') setNotifications(Array.isArray(notifData.value.data) ? notifData.value.data : []);
      if (attendanceData.status === 'fulfilled') setAttendance(Array.isArray(attendanceData.value.data) ? attendanceData.value.data : []);
      if (todayData.status === 'fulfilled' && Array.isArray(todayData.value.data)) {
        const today = todayData.value.data.find((row: Attendance) => row.studentId === studentData.id);
        if (today)
          setAttendance(previous =>
            previous.some(row => row.date === today.date) ? previous : [{ ...today, date: new Date().toISOString() }, ...previous]
          );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load student portal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(item => item.status === 'PRESENT').length;
    const late = attendance.filter(item => item.status === 'LATE').length;
    const absent = attendance.filter(item => item.status === 'ABSENT').length;
    return { total, present, late, absent, percentage: total ? Math.round((present / total) * 100) : 0 };
  }, [attendance]);

  const pendingFees = useMemo(
    () =>
      fees.reduce(
        (sum, fee) =>
          sum + Math.max(0, Number(fee.amount || 0) - Number(fee.discount || 0) + Number(fee.fine || 0) - Number(fee.totalPaid || 0)),
        0
      ),
    [fees]
  );

  const totalFeePaid = useMemo(() => fees.reduce((sum, fee) => sum + Number(fee.totalPaid || 0), 0), [fees]);

  const resultStats = useMemo(() => {
    if (!results.length) return { totalObtained: 0, totalMax: 0, percentage: 0, gpa: 'N/A' };
    const valid = results.filter(r => !r.isAbsent);
    const totalObtained = valid.reduce((sum, r) => sum + Number(r.marksObtained || 0), 0);
    const totalMax = valid.reduce((sum, r) => sum + Number(r.totalMarks || 100), 0);
    const percentage = totalMax ? Math.round((totalObtained / totalMax) * 100) : 0;
    let gpa = '4.0';
    if (percentage < 50) gpa = '0.0';
    else if (percentage < 60) gpa = '2.0';
    else if (percentage < 70) gpa = '2.7';
    else if (percentage < 80) gpa = '3.3';
    else if (percentage < 90) gpa = '3.7';
    return { totalObtained, totalMax, percentage, gpa };
  }, [results]);

  const unread = notifications.filter(item => !item.isRead).length;
  const schoolName = user?.schoolName || 'EduSphere ERP Academy';
  const initials = (student?.name || user?.name || 'S')
    .split(/\s+/)
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleHomeworkSubmit = () => {
    if (!submitHomeworkItem) return;
    setSubmittingHw(true);
    setTimeout(() => {
      setSubmittedIds(prev => [...prev, submitHomeworkItem.id]);
      setSubmittingHw(false);
      setSubmitHomeworkItem(null);
      setSubmissionNote('');
      toast.success('Homework submitted successfully!');
    }, 600);
  };

  const handlePrintIdCard = () => {
    window.print();
  };

  const filteredHomework = useMemo(() => {
    if (!homeworkSearch.trim()) return homework;
    return homework.filter(
      h =>
        h.title.toLowerCase().includes(homeworkSearch.toLowerCase()) ||
        h.subject?.name?.toLowerCase().includes(homeworkSearch.toLowerCase()) ||
        h.description?.toLowerCase().includes(homeworkSearch.toLowerCase())
    );
  }, [homework, homeworkSearch]);

  const filteredNotices = useMemo(() => {
    if (!noticeSearch.trim()) return announcements;
    return announcements.filter(
      n =>
        n.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
        n.content?.toLowerCase().includes(noticeSearch.toLowerCase()) ||
        n.message?.toLowerCase().includes(noticeSearch.toLowerCase())
    );
  }, [announcements, noticeSearch]);

  const dayTimetable = useMemo(() => {
    return timetable.filter(t => t.dayOfWeek === selectedDayIndex);
  }, [timetable, selectedDayIndex]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={38} />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading Student LMS Portal…</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border/80 bg-card p-10 text-center shadow-lg">
        <GraduationCap className="mx-auto mb-4 text-primary" size={48} />
        <h2 className="text-2xl font-black">Student Profile Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please contact your School Admin to map your user account to a valid student record.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-16 px-2 sm:px-4">
      {/* Top Banner Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-violet-600/10 via-card to-indigo-600/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative group cursor-pointer" onClick={() => setShowIdModal(true)}>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/15 text-2xl font-black text-primary shadow-xl transition group-hover:scale-105">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] shadow">
                <QrCode size={12} />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={13} /> Active Student
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                  <Sparkles size={11} className="text-amber-500" /> Session {student.session || '2025-2026'}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">{student.name}</h1>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {schoolName} • <span className="text-foreground">{student.section?.class?.name || 'Class'}</span>
                {student.section?.name ? ` • Section ${student.section.name}` : ''} • Roll No: <span className="text-primary font-bold">{student.rollNo || '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowIdModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/20 shadow-sm"
            >
              <QrCode size={15} /> Digital Student ID
            </button>

            {results.length > 0 && (
              <button
                onClick={() => setShowReportCardModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold transition hover:bg-muted shadow-sm"
              >
                <Printer size={15} /> Report Card
              </button>
            )}

            <button
              onClick={() => void load(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold transition hover:bg-muted shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="sticky top-2 z-30 overflow-x-auto rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-lg backdrop-blur-xl scrollbar-thin">
        <div className="flex min-w-max gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {label}
              {id === 'notifications' && unread > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">{unread}</span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      {/* TAB CONTENT: OVERVIEW */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              icon={<CheckCircle2 size={20} className="text-emerald-500" />}
              label="Attendance Rate"
              value={`${attendanceStats.percentage}%`}
              subtext={`${attendanceStats.present}/${attendanceStats.total} days present`}
            />
            <MetricCard
              icon={<BookOpen size={20} className="text-indigo-500" />}
              label="Active Homework"
              value={`${homework.length}`}
              subtext={`${submittedIds.length} submitted online`}
            />
            <MetricCard
              icon={<Award size={20} className="text-amber-500" />}
              label="Academic GPA"
              value={resultStats.gpa}
              subtext={`${resultStats.percentage}% aggregate score`}
            />
            <MetricCard
              icon={<WalletCards size={20} className="text-rose-500" />}
              label="Pending Fee"
              value={`PKR ${pendingFees.toLocaleString()}`}
              subtext={pendingFees > 0 ? 'Unpaid Balance' : 'Fully Cleared'}
              onClick={pendingFees > 0 ? () => setShowPayModal(true) : undefined}
            />
            <MetricCard
              icon={<Bell size={20} className="text-violet-500" />}
              label="Notifications"
              value={`${unread} New`}
              subtext={`${notifications.length} total received`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
            <div className="space-y-6">
              {/* Quick Info & Class Teacher Banner */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" /> Class & Academic Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoBox label="Class & Section" value={`${student.section?.class?.name || '—'} / ${student.section?.name || '—'}`} />
                  <InfoBox label="Class Teacher" value={student.section?.teacher?.name || 'Not assigned'} />
                  <InfoBox label="Admission No" value={student.admissionNo} />
                  <InfoBox label="Registered Roll No" value={student.rollNo || '—'} />
                  <InfoBox label="Total Exams Published" value={String(exams.length)} />
                  <InfoBox label="Fee Status" value={pendingFees > 0 ? `PKR ${pendingFees.toLocaleString()} Pending` : 'All Paid'} highlight={pendingFees > 0} />
                </div>
              </div>

              {/* Latest Homework & Announcements */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Recent Homework" icon={<BookOpen size={18} className="text-indigo-500" />}>
                  <HomeworkList
                    items={homework.slice(0, 4)}
                    submittedIds={submittedIds}
                    onSubmit={(hw) => setSubmitHomeworkItem(hw)}
                  />
                </Panel>

                <Panel title="School Announcements" icon={<Megaphone size={18} className="text-fuchsia-500" />}>
                  <NoticeList items={announcements.slice(0, 4)} />
                </Panel>
              </div>

              {/* Latest Results Summary */}
              <Panel
                title="Latest Published Results"
                icon={<Award size={18} className="text-amber-500" />}
                action={
                  results.length > 0 ? (
                    <button
                      onClick={() => setShowReportCardModal(true)}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Printer size={13} /> View Full Report
                    </button>
                  ) : undefined
                }
              >
                <ResultList items={results.slice(0, 5)} />
              </Panel>
            </div>

            {/* Sidebar Digital Student ID Card */}
            <DigitalIdSidebar student={student} schoolName={schoolName} onOpenModal={() => setShowIdModal(true)} />
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: ATTENDANCE */}
      {tab === 'attendance' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel title="Attendance Performance & Record" icon={<CheckCircle2 size={18} className="text-emerald-500" />}>
            {/* Visual Attendance Progress */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Total Recorded Days" value={String(attendanceStats.total)} />
              <StatBox label="Present Days" value={String(attendanceStats.present)} color="text-emerald-500" />
              <StatBox label="Late Days" value={String(attendanceStats.late)} color="text-amber-500" />
              <StatBox label="Absent Days" value={String(attendanceStats.absent)} color="text-rose-500" />
            </div>

            {/* Progress Bar */}
            <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Overall Attendance Rate</span>
                <span className="text-emerald-500 font-black">{attendanceStats.percentage}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div style={{ width: `${attendanceStats.percentage}%` }} className="bg-emerald-500 h-full transition-all" />
                <div style={{ width: `${attendanceStats.total ? (attendanceStats.late / attendanceStats.total) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all" />
                <div style={{ width: `${attendanceStats.total ? (attendanceStats.absent / attendanceStats.total) * 100 : 0}%` }} className="bg-rose-500 h-full transition-all" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Minimum required attendance for examination eligibility is 75%.
              </p>
            </div>

            <div className="space-y-2.5">
              {attendance.length ? (
                attendance.map((item, index) => (
                  <div
                    key={`${item.id || item.date}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm">{dateText(item.date)}</p>
                      {item.remarks && <p className="mt-0.5 text-xs text-muted-foreground">{item.remarks}</p>}
                    </div>
                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                        item.status === 'PRESENT'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : item.status === 'ABSENT'
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <Empty text="No attendance history has been recorded yet." />
              )}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: HOMEWORK */}
      {tab === 'homework' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel
            title="Assigned Homework & Submissions"
            icon={<BookOpen size={18} className="text-indigo-500" />}
            action={
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search subject or topic..."
                  value={homeworkSearch}
                  onChange={e => setHomeworkSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            }
          >
            <HomeworkList
              items={filteredHomework}
              submittedIds={submittedIds}
              onSubmit={(hw) => setSubmitHomeworkItem(hw)}
            />
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: TIMETABLE */}
      {tab === 'timetable' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel title="Class Schedule & Timetable" icon={<CalendarDays size={18} className="text-cyan-500" />}>
            {/* Day Selector Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6].map(dayNum => (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayIndex(dayNum)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    selectedDayIndex === dayNum
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {dayName(dayNum)}
                </button>
              ))}
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
              {dayTimetable.length ? (
                dayTimetable.map(item => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-primary">{dayName(item.dayOfWeek)}</span>
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {item.startTime} – {item.endTime}
                      </span>
                    </div>
                    <p className="font-black text-base">{item.subject?.name || 'Subject'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Teacher: <span className="text-foreground font-semibold">{item.teacher?.name || 'Assigned Staff'}</span>
                      {item.room ? ` • Room: ${item.room}` : ''}
                    </p>
                  </div>
                ))
              ) : (
                <Empty text={`No timetable slots scheduled for ${dayName(selectedDayIndex)}.`} />
              )}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: EXAMS */}
      {tab === 'exams' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel title="Upcoming Examinations & Date Sheet" icon={<Award size={18} className="text-amber-500" />}>
            <div className="space-y-3">
              {exams.length ? (
                exams.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div>
                      <p className="font-bold text-base">{item.name || item.title || 'Examination'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Date: {dateText(item.startDate || item.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5">
                        <Clock3 size={14} /> Scheduled
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="No upcoming examinations published at this moment." />
              )}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: RESULTS & MARKS */}
      {tab === 'results' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel
            title="Published Exam Results & Transcripts"
            icon={<Award size={18} className="text-violet-500" />}
            action={
              results.length > 0 ? (
                <button
                  onClick={() => setShowReportCardModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
                >
                  <Printer size={14} /> Generate Official Report Card
                </button>
              ) : undefined
            }
          >
            {/* Result Summary Strip */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total Marks Obtained" value={`${resultStats.totalObtained} / ${resultStats.totalMax}`} />
              <StatBox label="Aggregate Percentage" value={`${resultStats.percentage}%`} color="text-primary" />
              <StatBox label="Overall Grade Point" value={resultStats.gpa} color="text-emerald-500" />
              <StatBox label="Total Subjects" value={String(results.length)} />
            </div>

            <ResultList items={results} />
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: FEES */}
      {tab === 'fees' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel
            title="Fee Payments & Outstanding Voucher"
            icon={<WalletCards size={18} className="text-emerald-500" />}
            action={
              pendingFees > 0 ? (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow hover:bg-emerald-700 transition"
                >
                  <CreditCard size={14} /> Pay Pending Fee
                </button>
              ) : undefined
            }
          >
            {/* Balance Highlight Banner */}
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Current Outstanding Balance</p>
                <p className="mt-1 text-3xl font-black">PKR {pendingFees.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Fee Paid to Date: PKR {totalFeePaid.toLocaleString()}</p>
              </div>
              {pendingFees > 0 ? (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold shadow hover:bg-emerald-700 transition shrink-0"
                >
                  Pay Online / Print Voucher
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} /> All Fees Paid
                </span>
              )}
            </div>

            <div className="space-y-3">
              {fees.length ? (
                fees.map(item => (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-base">{item.feeStructure?.name || 'Monthly Tuition Fee'}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Receipt #: <span className="font-mono text-foreground font-semibold">{item.receiptNo || 'Pending'}</span> • Date:{' '}
                          {dateText(item.paidDate || item.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`rounded-xl border px-3 py-1 text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                          item.status === 'PAID'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'PARTIAL'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <span>
                        Paid Amount: <strong className="text-foreground">PKR {Number(item.totalPaid || 0).toLocaleString()}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Total Voucher: PKR {(Number(item.amount || 0) - Number(item.discount || 0) + Number(item.fine || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="No fee vouchers or payment history recorded." />
              )}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: NOTICES */}
      {tab === 'notices' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel
            title="School Announcements & Notice Board"
            icon={<Megaphone size={18} className="text-fuchsia-500" />}
            action={
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={noticeSearch}
                  onChange={e => setNoticeSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            }
          >
            <NoticeList items={filteredNotices} />
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {tab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel title="Personal Notifications" icon={<Bell size={18} className="text-violet-500" />}>
            <div className="space-y-3">
              {notifications.length ? (
                notifications.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      item.isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                        <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{dateText(item.createdAt)}</p>
                      </div>
                      {!item.isRead && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="No notifications received yet." />
              )}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Panel title="Complete Student Information" icon={<UserRound size={18} className="text-primary" />}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['Full Name', student.name],
                  ['Admission No', student.admissionNo],
                  ['Roll No', student.rollNo || '—'],
                  ['Class', student.section?.class?.name || '—'],
                  ['Section', student.section?.name || '—'],
                  ['Academic Session', student.session || '—'],
                  ['Date of Birth', dateText(student.dateOfBirth)],
                  ['Gender', student.gender || '—'],
                  ['Blood Group', student.bloodGroup || '—'],
                  ['Religion', student.religion || '—'],
                  ['B-Form / CNIC No', student.bFormNumber || '—'],
                  ['Admission Type', student.admissionType || 'NEW'],
                  ['Contact Phone', student.phone || '—'],
                  ['Email Address', student.email || '—'],
                  ['Account Status', student.status || 'ACTIVE'],
                ].map(([label, value]) => (
                  <InfoBox key={label} label={label} value={value} />
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <InfoBox label="Current Address" value={student.currentAddress || '—'} />
                <InfoBox label="Permanent Address" value={student.permanentAddress || '—'} />
              </div>

              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <Info size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Student Security & Password Notice</p>
                  <p className="text-muted-foreground mt-0.5">
                    Your portal account credentials are standardly assigned and managed by your School Administration office. If you require password updates or contact info revisions, please visit the School Admin office.
                  </p>
                </div>
              </div>
            </Panel>

            <DigitalIdSidebar student={student} schoolName={schoolName} onOpenModal={() => setShowIdModal(true)} />
          </div>
        </motion.div>
      )}

      {/* --- MODALS --- */}

      {/* DIGITAL STUDENT ID MODAL */}
      <AnimatePresence>
        {showIdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowIdModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>

              <div className="text-center pb-4 border-b border-border">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Official Student ID Card</p>
                <h2 className="text-xl font-black text-foreground mt-0.5">{schoolName}</h2>
              </div>

              <div className="my-6 flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/10 text-2xl font-black text-primary">
                  {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" /> : initials}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-lg font-black text-foreground">{student.name}</p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {student.section?.class?.name || 'Class'} / {student.section?.name || 'Section'}
                  </p>
                  <p className="mt-1 text-xs text-primary font-bold">Roll No: {student.rollNo || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="rounded-xl border border-border bg-background p-2.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Admission No</p>
                  <p className="font-mono font-bold mt-0.5">{student.admissionNo}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-2.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Session</p>
                  <p className="font-bold mt-0.5">{student.session || '2025-2026'}</p>
                </div>
              </div>

              <Barcode value={student.admissionNo} />

              <div className="mt-6 flex gap-2">
                <button
                  onClick={handlePrintIdCard}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-bold shadow hover:opacity-90 transition"
                >
                  <Printer size={14} /> Print ID Card
                </button>
                <button
                  onClick={() => setShowIdModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOMEWORK SUBMISSION MODAL */}
      <AnimatePresence>
        {submitHomeworkItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl"
            >
              <button
                onClick={() => setSubmitHomeworkItem(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-black text-foreground mb-1">Submit Homework</h2>
              <p className="text-xs text-muted-foreground mb-4">Subject: {submitHomeworkItem.subject?.name || 'General'}</p>

              <div className="rounded-2xl border border-border bg-muted/20 p-4 mb-4">
                <p className="font-bold text-sm text-foreground">{submitHomeworkItem.title}</p>
                {submitHomeworkItem.description && <p className="text-xs text-muted-foreground mt-1">{submitHomeworkItem.description}</p>}
                {submitHomeworkItem.dueDate && <p className="text-[11px] font-semibold text-primary mt-2">Due Date: {dateText(submitHomeworkItem.dueDate)}</p>}
              </div>

              <div className="space-y-3 mb-5">
                <label className="text-xs font-bold text-foreground">Submission Remarks / Text Answer</label>
                <textarea
                  rows={4}
                  value={submissionNote}
                  onChange={e => setSubmissionNote(e.target.value)}
                  placeholder="Enter your answers or submission comments here..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSubmitHomeworkItem(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHomeworkSubmit}
                  disabled={submittingHw}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                >
                  {submittingHw ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Mark & Submit Homework
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL REPORT CARD TRANSCRIPT MODAL */}
      <AnimatePresence>
        {showReportCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl my-8"
            >
              <button
                onClick={() => setShowReportCardModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground print:hidden"
              >
                <X size={18} />
              </button>

              <div className="text-center border-b border-border pb-6 mb-6">
                <div className="inline-flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-1">
                  <GraduationCap size={18} /> Official Academic Progress Report
                </div>
                <h2 className="text-2xl font-black text-foreground">{schoolName}</h2>
                <p className="text-xs text-muted-foreground mt-1">Student Performance Transcript & Grade Sheet</p>
              </div>

              {/* Student Header */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/20 p-4 mb-6 text-xs">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-bold text-foreground text-sm">{student.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class & Section</p>
                  <p className="font-bold text-foreground text-sm">{student.section?.class?.name || '—'} ({student.section?.name || '—'})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admission No</p>
                  <p className="font-mono font-bold text-foreground">{student.admissionNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-bold text-foreground">{student.rollNo || '—'}</p>
                </div>
              </div>

              {/* Marks Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Exam Name</th>
                      <th className="py-2.5 px-3 text-center">Marks</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => {
                      const perc = r.totalMarks ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0;
                      const g = CalculateGrade(perc);
                      return (
                        <tr key={r.id} className="border-b border-border/60">
                          <td className="py-3 px-3 font-bold text-foreground">{r.subjectName}</td>
                          <td className="py-3 px-3 text-muted-foreground">{r.examName}</td>
                          <td className="py-3 px-3 text-center font-bold">{r.isAbsent ? 'ABS' : r.marksObtained}</td>
                          <td className="py-3 px-3 text-center text-muted-foreground">{r.totalMarks}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${g.color}`}>
                              {r.isAbsent ? 'F' : r.grade || g.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="flex justify-between items-center rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Aggregate Percentage</p>
                  <p className="text-xl font-black text-primary">{resultStats.percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Grade Point Average (GPA)</p>
                  <p className="text-xl font-black text-emerald-500">{resultStats.gpa} / 4.0</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow hover:opacity-90 transition"
                >
                  <Printer size={14} /> Print Report Sheet
                </button>
                <button
                  onClick={() => setShowReportCardModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ONLINE FEE PAYMENT MODAL */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowPayModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-black text-foreground mb-1">Fee Payment Portal</h2>
              <p className="text-xs text-muted-foreground mb-4">Pay student dues online or generate printable bank challenger</p>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 mb-5">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Total Outstanding Dues</p>
                <p className="text-2xl font-black mt-0.5">PKR {pendingFees.toLocaleString()}</p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-foreground">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {['JazzCash / EasyPaisa', 'Bank Transfer (IBFT)', 'Credit / Debit Card', 'Print Bank Slip'].map((method, idx) => (
                    <button
                      key={method}
                      onClick={() => {
                        toast.info(`Selected ${method}. You can pay directly at the bank counter or use Online Banking IBFT.`);
                      }}
                      className={`rounded-xl border border-border bg-background p-3 text-left text-xs font-bold hover:border-primary transition ${
                        idx === 0 ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
                >
                  <Printer size={14} /> Print Fee Voucher
                </button>
                <button
                  onClick={() => {
                    toast.success('Payment simulation successful! Status updated.');
                    setShowPayModal(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow hover:bg-emerald-700 transition"
                >
                  <Check size={14} /> Confirm Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Helper Components */

function DigitalIdSidebar({ student, schoolName, onOpenModal }: { student: Student; schoolName: string; onOpenModal: () => void }) {
  const initials = student.name
    .split(/\s+/)
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <aside className="self-start xl:sticky xl:top-20 rounded-[32px] border border-border bg-card p-5 shadow-xl">
      <div className="rounded-[24px] border border-border bg-muted/20 p-5">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Official Digital Student ID</p>
            <p className="mt-0.5 text-base font-black text-foreground">{schoolName}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-base font-black">
            E
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/25 bg-primary/10 text-xl font-black text-primary">
            {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-foreground">{student.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground font-semibold">
              {student.section?.class?.name || 'Class'} / {student.section?.name || 'Section'}
            </p>
            <p className="mt-1 text-xs font-bold text-primary">Roll No: {student.rollNo || '—'}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-background p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Admission No</p>
            <p className="mt-0.5 truncate text-xs font-mono font-bold text-foreground">{student.admissionNo}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Session</p>
            <p className="mt-0.5 truncate text-xs font-bold text-foreground">{student.session || '2025-2026'}</p>
          </div>
        </div>

        <div className="mt-4">
          <Barcode value={student.admissionNo} />
        </div>

        <button
          onClick={onOpenModal}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
        >
          <Printer size={14} /> Full ID Badge & Print
        </button>
      </div>
    </aside>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm transition ${
        onClick ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''
      }`}
    >
      <div className="mb-2.5">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-black text-foreground break-words">{value}</p>
      {subtext && <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{subtext}</p>}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black ${color || 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function InfoBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-rose-500/30 bg-rose-500/10' : 'border-border bg-muted/20'}`}>
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xs font-bold break-words ${highlight ? 'text-rose-500 font-black' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-foreground">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs font-semibold text-muted-foreground">
      {text}
    </div>
  );
}

function HomeworkList({
  items,
  submittedIds,
  onSubmit,
}: {
  items: Homework[];
  submittedIds: string[];
  onSubmit: (hw: Homework) => void;
}) {
  return items.length ? (
    <div className="space-y-3">
      {items.map(item => {
        const isDone = submittedIds.includes(item.id) || item.isSubmitted;
        return (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary mb-1">
                  {item.subject?.name || 'General'}
                </span>
                <p className="font-bold text-sm text-foreground">{item.title}</p>
                {item.dueDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due Date: <span className="font-semibold text-foreground">{dateText(item.dueDate)}</span>
                  </p>
                )}
              </div>
              {isDone ? (
                <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} /> Submitted
                </span>
              ) : (
                <button
                  onClick={() => onSubmit(item)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold shadow hover:opacity-90 transition"
                >
                  <Upload size={13} /> Submit
                </button>
              )}
            </div>
            {item.description && <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>}
          </div>
        );
      })}
    </div>
  ) : (
    <Empty text="No homework assigned." />
  );
}

function NoticeList({ items }: { items: Announcement[] }) {
  return items.length ? (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{dateText(item.createdAt)}</p>
            </div>
            <Megaphone size={16} className="text-fuchsia-500 shrink-0" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{item.content || item.message || 'School announcement'}</p>
        </div>
      ))}
    </div>
  ) : (
    <Empty text="No school notices published yet." />
  );
}

function ResultList({ items }: { items: Result[] }) {
  return items.length ? (
    <div className="space-y-3">
      {items.map(item => {
        const perc = item.totalMarks ? Math.round((item.marksObtained / item.totalMarks) * 100) : 0;
        const g = CalculateGrade(perc);
        return (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-foreground">{item.subjectName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.examName} {item.examDate ? `• ${dateText(item.examDate)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-primary">
                  {item.isAbsent ? 'Absent' : `${item.marksObtained} / ${item.totalMarks}`}
                </span>
                {!item.isAbsent && (
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${g.color}`}>
                      Grade {item.grade || g.grade} ({perc}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
            {item.remarks && <p className="mt-2 text-xs text-muted-foreground border-t border-border/60 pt-2">{item.remarks}</p>}
          </div>
        );
      })}
    </div>
  ) : (
    <Empty text="No published exam results found." />
  );
}
