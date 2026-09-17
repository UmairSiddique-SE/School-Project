import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle, XCircle, Clock, Calendar, Users, Save, Download, Search,
  ChevronLeft, ChevronRight, AlertCircle, CheckSquare, XSquare, Timer,
  FileText, RotateCcw, X, ShieldCheck, RefreshCw, Printer, Sparkles,
  BookOpen, Plus
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal from '@/component/ui/Modal';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  sectionId?: string;
  photo?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  remarks?: string;
}

interface ClassSection {
  id: string;
  name: string;
  classId: string;
  className: string;
  totalStudents: number;
}

const STATUS_OPTIONS = [
  {
    value: 'PRESENT' as const,
    label: 'Present',
    icon: CheckCircle,
    color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25',
    activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30',
  },
  {
    value: 'ABSENT' as const,
    label: 'Absent',
    icon: XCircle,
    color: 'bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25',
    activeBg: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30',
  },
  {
    value: 'LATE' as const,
    label: 'Late',
    icon: Clock,
    color: 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25',
    activeBg: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/30',
  },
  {
    value: 'LEAVE' as const,
    label: 'Leave',
    icon: Timer,
    color: 'bg-sky-500/15 text-sky-500 border-sky-500/30 hover:bg-sky-500/25',
    activeBg: 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30',
  },
];

export default function Attendance() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || 'demo';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionIdParam = searchParams.get('sectionId');

  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState<string>(sectionIdParam || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showRemarks, setShowRemarks] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');

  // Fetch real classes from API
  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await apiClient.get('/classes');
      const data = Array.isArray(res.data) ? res.data : [];
      const extracted: ClassSection[] = [];
      data.forEach((c: any) => {
        if (Array.isArray(c.sections)) {
          c.sections.forEach((s: any) => {
            extracted.push({
              id: s.id,
              name: s.name,
              classId: c.id,
              className: c.name,
              totalStudents: s.enrolledCount || s.students?.length || 0,
            });
          });
        }
      });
      setClasses(extracted);
      if (extracted.length > 0) {
        if (!selectedClass || !extracted.some((s) => s.id === selectedClass)) {
          setSelectedClass(sectionIdParam || extracted[0].id);
        }
      }
    } catch (err) {
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    void fetchClasses();
  }, [sectionIdParam]);

  const loadStudentsForClass = async (sectionId: string) => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/attendance/section/${sectionId}?date=${selectedDate}`);
      const studentsData: Student[] = Array.isArray(res.data?.students) ? res.data.students : [];
      setStudents(studentsData);

      const initialAttendance: Record<string, AttendanceRecord> = {};
      studentsData.forEach((student: Student) => {
        const existingRecord = res.data?.records?.find((r: any) => r.studentId === student.id);
        initialAttendance[student.id] = {
          studentId: student.id,
          status: existingRecord?.status || 'PRESENT',
          remarks: existingRecord?.remarks || '',
        };
      });
      setAttendance(initialAttendance);
    } catch {
      setStudents([]);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      void loadStudentsForClass(selectedClass);
    }
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleBulkStatus = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    const updated = { ...attendance };
    Object.keys(updated).forEach((studentId) => {
      updated[studentId] = {
        ...updated[studentId],
        status,
      };
    });
    setAttendance(updated);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast.error('Please select a class section first');
      return;
    }
    if (students.length === 0) {
      toast.error('No students in this section to save attendance for');
      return;
    }
    setSaving(true);
    try {
      const records = Object.values(attendance);
      await apiClient.post('/attendance/mark', {
        sectionId: selectedClass,
        date: selectedDate,
        records,
      });
      toast.success('Attendance records saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRemarks = () => {
    if (showRemarks) {
      setAttendance((prev) => ({
        ...prev,
        [showRemarks]: {
          ...prev[showRemarks],
          remarks: remarksText,
        },
      }));
      setShowRemarks(null);
      setRemarksText('');
      toast.success('Student remark recorded');
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendance).filter((r) => r.status === 'PRESENT').length;
    const absent = Object.values(attendance).filter((r) => r.status === 'ABSENT').length;
    const late = Object.values(attendance).filter((r) => r.status === 'LATE').length;
    const leave = Object.values(attendance).filter((r) => r.status === 'LEAVE').length;
    return { total, present, absent, late, leave };
  }, [students, attendance]);

  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedClassData = classes.find((c) => c.id === selectedClass);

  const exportCsv = () => {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredStudents.map((s) => {
      const rec = attendance[s.id] || { status: 'PRESENT', remarks: '' };
      return [s.rollNo || '', s.name, s.admissionNo || '', rec.status, rec.remarks || ''].map(escape).join(',');
    });
    const csv = ['Roll No,Student Name,Admission No,Status,Remarks', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Attendance_${selectedClassData?.className || 'Class'}_${selectedDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance sheet exported');
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck size={12} /> Live Roll Call
            </span>
            <span className="text-xs text-muted-foreground">
              {selectedClassData ? `• ${selectedClassData.className} — ${selectedClassData.name}` : ''}
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Attendance Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mark daily student presence, log leave reasons, and generate compliance sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {students.length > 0 && (
            <>
              <button
                onClick={() => handleBulkStatus('PRESENT')}
                className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all active:scale-95"
              >
                <CheckSquare size={14} /> All Present
              </button>
              <button
                onClick={() => handleBulkStatus('ABSENT')}
                className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/20 transition-all active:scale-95"
              >
                <XSquare size={14} /> All Absent
              </button>
              <button
                onClick={exportCsv}
                className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-accent transition-all active:scale-95"
              >
                <Download size={14} /> Export CSV
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Clock size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Enrolled Students</span>
            <Users size={16} className="text-primary" />
          </div>
          <p className="mt-2.5 text-2xl font-black text-foreground">{stats.total}</p>
          <span className="text-[11px] text-muted-foreground font-semibold">In this section</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-[10px] font-black uppercase tracking-wider">
            <span>Present</span>
            <CheckCircle size={16} />
          </div>
          <p className="mt-2.5 text-2xl font-black text-emerald-600">{stats.present}</p>
          <span className="text-[11px] text-emerald-600 font-bold">{attendancePercentage}% turn-out</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 text-[10px] font-black uppercase tracking-wider">
            <span>Absent</span>
            <XCircle size={16} />
          </div>
          <p className="mt-2.5 text-2xl font-black text-rose-600">{stats.absent}</p>
          <span className="text-[11px] text-rose-500 font-semibold">Unexcused</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-[10px] font-black uppercase tracking-wider">
            <span>Late Entry</span>
            <Clock size={16} />
          </div>
          <p className="mt-2.5 text-2xl font-black text-amber-600">{stats.late}</p>
          <span className="text-[11px] text-amber-500 font-semibold">After bell</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
          <div className="flex items-center justify-between text-sky-600 text-[10px] font-black uppercase tracking-wider">
            <span>Approved Leave</span>
            <Timer size={16} />
          </div>
          <p className="mt-2.5 text-2xl font-black text-sky-600">{stats.leave}</p>
          <span className="text-[11px] text-sky-500 font-semibold">With notice</span>
        </div>
      </div>

      {/* ─── Filter & Date Control Bar ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Section dropdown */}
          {classes.length > 0 ? (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none focus:border-primary"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} — {c.name} ({c.totalStudents} students)
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => navigate(`/${schoolSlug}/classes`)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-primary text-primary text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Section in Classes
            </button>
          )}

          {/* Date Selector with Next / Prev */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-0.5 bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
            />
            <button
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl border border-border bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground"
          >
            Today
          </button>
        </div>

        {/* Search */}
        <div className="relative md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or roll no..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ─── Student Roll Call Table or Empty State ────────────────────────────── */}
      {classesLoading || loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Clock size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Loading class roster from database...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-border bg-card/50 text-center p-8">
          <BookOpen size={46} className="mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-bold text-lg text-foreground">No Academic Classes Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Your school database does not have any classes or sections registered yet. Create your first academic class to start recording attendance.
          </p>
          <button
            onClick={() => navigate(`/${schoolSlug}/classes`)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Setup Classes & Sections
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-border bg-card/50 text-center p-8">
          <Users size={46} className="mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-bold text-lg text-foreground">No Students in this Section</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            There are currently no students enrolled in {selectedClassData?.className} — {selectedClassData?.name}. Enroll students to record daily roll call.
          </p>
          <button
            onClick={() => navigate(`/${schoolSlug}/students`)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Enroll Students
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 rounded-2xl border border-dashed border-border bg-card/50 text-center p-8">
          <Search size={40} className="mx-auto text-muted-foreground/30 mb-2" />
          <h3 className="font-bold text-foreground">No matching students</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-accent/20">
            <span className="text-xs font-bold text-foreground">
              Class Roster ({filteredStudents.length} students)
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold">
              Click status button to toggle attendance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-accent/40 border-b border-border">
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Roll
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Student Name
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Admission No
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">
                    Attendance Status
                  </th>
                  <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((s) => {
                  const record = attendance[s.id] || { studentId: s.id, status: 'PRESENT' as const, remarks: '' };
                  return (
                    <tr key={s.id} className="hover:bg-accent/30 transition-colors duration-150">
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-foreground">
                        {s.rollNo || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <p className="text-xs font-bold text-foreground">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                        {s.admissionNo || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => {
                            const isSelected = record.status === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(s.id, opt.value)}
                                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-95 ${
                                  isSelected ? opt.activeBg : opt.color
                                }`}
                                title={opt.label}
                              >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setShowRemarks(s.id);
                            setRemarksText(record.remarks || '');
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all ${
                            record.remarks
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <FileText size={13} />
                          <span>{record.remarks ? 'Remarked' : 'Add note'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Remarks Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(showRemarks)} onClose={() => setShowRemarks(null)} maxWidth="max-w-md">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">Student Daily Remark</h3>
            <button onClick={() => setShowRemarks(null)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
              <X size={18} />
            </button>
          </div>
          <textarea
            rows={4}
            value={remarksText}
            onChange={(e) => setRemarksText(e.target.value)}
            placeholder="e.g. Medical excuse provided, late due to transport..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRemarks(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRemarks}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
            >
              Save Remark
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
