import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle, XCircle, Clock, Calendar, Users, Save, Download, Search,
  Filter, ChevronLeft, ChevronRight, MoreVertical, AlertCircle, Info,
  CheckSquare, XSquare, Timer, FileText, BarChart3, TrendingUp, ShieldCheck,
  User, RotateCcw, SkipForward, SkipBack, X
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal from '@/component/ui/Modal';

// ─── Types & Interfaces ────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  sectionId: string;
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

// ─── Constants & Helpers ───────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' },
  { value: 'ABSENT', label: 'Absent', icon: XCircle, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20' },
  { value: 'LATE', label: 'Late', icon: Clock, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' },
  { value: 'LEAVE', label: 'Leave', icon: Timer, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20' },
];

const MOCK_CLASSES: ClassSection[] = [
  { id: 'sec-1', name: 'Section A (Alpha)', classId: 'cls-10', className: 'Class 10', totalStudents: 45 },
  { id: 'sec-2', name: 'Section B (Beta)', classId: 'cls-10', className: 'Class 10', totalStudents: 42 },
  { id: 'sec-3', name: 'Section C (Gamma)', classId: 'cls-10', className: 'Class 10', totalStudents: 40 },
  { id: 'sec-4', name: 'Section A (Alpha)', classId: 'cls-9', className: 'Class 9', totalStudents: 38 },
  { id: 'sec-5', name: 'Section B (Beta)', classId: 'cls-9', className: 'Class 9', totalStudents: 36 },
];

const MOCK_STUDENTS: Student[] = [
  { id: 'st-1', name: 'Aarav Sharma', rollNo: '01', admissionNo: 'STD001', sectionId: 'sec-1' },
  { id: 'st-2', name: 'Ayesha Siddiqui', rollNo: '02', admissionNo: 'STD002', sectionId: 'sec-1' },
  { id: 'st-3', name: 'Bilal Hussain', rollNo: '03', admissionNo: 'STD003', sectionId: 'sec-1' },
  { id: 'st-4', name: 'Fatima Noor', rollNo: '04', admissionNo: 'STD004', sectionId: 'sec-1' },
  { id: 'st-5', name: 'Hamza Tariq', rollNo: '05', admissionNo: 'STD005', sectionId: 'sec-1' },
  { id: 'st-6', name: 'Zoya Khan', rollNo: '06', admissionNo: 'STD006', sectionId: 'sec-1' },
  { id: 'st-7', name: 'Daniyal Khan', rollNo: '07', admissionNo: 'STD007', sectionId: 'sec-1' },
  { id: 'st-8', name: 'Maham Ali', rollNo: '08', admissionNo: 'STD008', sectionId: 'sec-1' },
  { id: 'st-9', name: 'Usman Farooq', rollNo: '09', admissionNo: 'STD009', sectionId: 'sec-1' },
  { id: 'st-10', name: 'Sana Malik', rollNo: '10', admissionNo: 'STD010', sectionId: 'sec-1' },
  { id: 'st-11', name: 'Rohan Mehmood', rollNo: '11', admissionNo: 'STD011', sectionId: 'sec-1' },
  { id: 'st-12', name: 'Sara Qasim', rollNo: '12', admissionNo: 'STD012', sectionId: 'sec-1' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Attendance() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || 'demo';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionIdParam = searchParams.get('sectionId');

  const [classes, setClasses] = useState<ClassSection[]>(MOCK_CLASSES);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selection
  const [selectedClass, setSelectedClass] = useState<string>(sectionIdParam || 'sec-1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRemarks, setShowRemarks] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  const loadStudentsForClass = async (sectionId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/attendance/section/${sectionId}?date=${selectedDate}`);
      const studentsData = Array.isArray(res.data?.students) ? res.data.students : MOCK_STUDENTS.filter(s => s.sectionId === sectionId);
      setStudents(studentsData);

      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      studentsData.forEach((student: Student) => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: 'PRESENT',
          remarks: '',
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      // Use mock data
      const mockStudents = MOCK_STUDENTS.filter(s => s.sectionId === sectionId);
      setStudents(mockStudents);
      const initialAttendance: Record<string, AttendanceRecord> = {};
      mockStudents.forEach(student => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: 'PRESENT',
          remarks: '',
        };
      });
      setAttendance(initialAttendance);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleBulkStatus = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    const updatedAttendance = { ...attendance };
    Object.keys(updatedAttendance).forEach(studentId => {
      updatedAttendance[studentId] = {
        ...updatedAttendance[studentId],
        status,
      };
    });
    setAttendance(updatedAttendance);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance);
      await apiClient.post('/attendance/mark', {
        sectionId: selectedClass,
        date: selectedDate,
        records,
      });
      toast.success('Attendance saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRemarks = () => {
    if (showRemarks) {
      setAttendance(prev => ({
        ...prev,
        [showRemarks]: {
          ...prev[showRemarks],
          remarks: remarksText,
        },
      }));
      setShowRemarks(null);
      setRemarksText('');
      toast.success('Remarks saved');
    }
  };

  // Calculate statistics
  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(r => r.status === 'PRESENT').length,
    absent: Object.values(attendance).filter(r => r.status === 'ABSENT').length,
    late: Object.values(attendance).filter(r => r.status === 'LATE').length,
    leave: Object.values(attendance).filter(r => r.status === 'LEAVE').length,
  };

  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClassData = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/${schoolSlug}/attendance`)}
            className="p-2 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Class Attendance Management
              </span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Mark Attendance</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Record daily attendance for {selectedClassData?.className} - {selectedClassData?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleBulkStatus('PRESENT')}
            className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold transition-all flex items-center gap-2 hover:bg-emerald-500/20"
          >
            <CheckSquare size={14} /> Mark All Present
          </button>
          <button
            onClick={() => {
              if (confirm('Reset all attendance to Present?')) {
                handleBulkStatus('PRESENT');
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-bold transition-all flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all disabled:opacity-70"
          >
            {saving ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Selection Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold focus:outline-none focus:border-primary"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.className} - {c.name} ({c.totalStudents} students)
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll no, or admission no..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Students</span>
          </div>
          <p className="text-2xl font-black text-foreground">{stats.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase text-emerald-600">Present</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.present}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase text-rose-600">Absent</span>
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.absent}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase text-amber-600">Late</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.late}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Timer size={16} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase text-blue-600">Leave</span>
          </div>
          <p className="text-2xl font-black text-blue-600">{stats.leave}</p>
        </div>
      </div>

      {/* Attendance Progress */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">Today's Attendance Rate</span>
          <span className="text-2xl font-black text-foreground">{attendancePercentage}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              attendancePercentage >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              attendancePercentage >= 75 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
              'bg-gradient-to-r from-rose-500 to-pink-400'
            }`}
            style={{ width: `${attendancePercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{stats.present} present out of {stats.total}</span>
          <span className={attendancePercentage >= 90 ? 'text-emerald-400' : attendancePercentage >= 75 ? 'text-amber-400' : 'text-rose-400'}>
            {attendancePercentage >= 90 ? 'Excellent' : attendancePercentage >= 75 ? 'Good' : 'Needs Attention'}
          </span>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Clock size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card">
          <Users size={52} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-black text-foreground">No Students Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or select a different class.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Student List</h2>
            <span className="text-xs text-muted-foreground">{filteredStudents.length} students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Roll No</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Student Name</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Admission No</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const record = attendance[student.id] || { status: 'PRESENT', remarks: '' };
                  const statusConfig = STATUS_OPTIONS.find(s => s.value === record.status) || STATUS_OPTIONS[0];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm font-mono font-bold text-foreground">{student.rollNo}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground font-mono">{student.admissionNo}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {STATUS_OPTIONS.map(status => {
                            const Icon = status.icon;
                            return (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(student.id, status.value as any)}
                                className={`p-2 rounded-lg border transition-all ${
                                  record.status === status.value
                                    ? status.color
                                    : 'bg-background text-muted-foreground border-border hover:bg-accent'
                                }`}
                                title={status.label}
                              >
                                <Icon size={16} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {record.remarks ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText size={12} />
                              <span className="truncate max-w-[150px]">{record.remarks}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No remarks</span>
                          )}
                          <button
                            onClick={() => {
                              setShowRemarks(student.id);
                              setRemarksText(record.remarks || '');
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Add Remarks"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      <Modal isOpen={!!showRemarks} onClose={() => setShowRemarks(null)} maxWidth="max-w-md">
        <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Add Remarks</h3>
                <button onClick={() => setShowRemarks(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={remarksText}
                onChange={e => setRemarksText(e.target.value)}
                placeholder="Enter remarks for this student..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRemarks(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRemarks}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
        </div>
      </Modal>
    </div>
  );
}
