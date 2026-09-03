import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Clock, MapPin, X, Loader2, BookOpen, Trash2, Calendar,
  Printer, Download, AlertTriangle, UserCheck, Sparkles, Filter,
  Layers, CheckCircle2, ChevronRight, RefreshCw, Eye, HelpCircle, Edit3
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  periodNumber: number; // 1 to 8
  startTime: string;
  endTime: string;
  room: string;
  sectionId: string;
  className: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  color?: string;
}

interface PeriodConfig {
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

// ─── Defaults & Seed Data ──────────────────────────────────────────────────────

const DAYS_MAP = [
  { num: 1, name: 'Monday', short: 'Mon' },
  { num: 2, name: 'Tuesday', short: 'Tue' },
  { num: 3, name: 'Wednesday', short: 'Wed' },
  { num: 4, name: 'Thursday', short: 'Thu' },
  { num: 5, name: 'Friday', short: 'Fri' },
  { num: 6, name: 'Saturday', short: 'Sat' },
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
  Physics: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300' },
  Chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
  Biology: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', badge: 'bg-teal-500/20 text-teal-300' },
  'Computer Science': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  'English Literature': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300' },
  'Urdu Language': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  'Pakistan Studies': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-300' },
  'Islamic Studies': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30', badge: 'bg-lime-500/20 text-lime-300' },
  'General Science': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300' },
};

const ROOMS_LIST = [
  'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Physics Lab', 'Chem Lab', 'Bio Lab', 'CS Lab 1', 'CS Lab 2', 'Library Hall'
];

export default function Timetable() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || '';
  const storageKey = `edusphere_timetables_${schoolSlug}`;

  // State
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);

  const [classesList, setClassesList] = useState<any[]>([
    { id: 'cls-10', name: 'Class 10', sections: [{ id: 'sec-1', name: 'Section A (Alpha)' }, { id: 'sec-2', name: 'Section B (Beta)' }] },
    { id: 'cls-9', name: 'Class 9', sections: [{ id: 'sec-3', name: 'Section A' }, { id: 'sec-4', name: 'Section B' }] },
    { id: 'cls-8', name: 'Class 8', sections: [{ id: 'sec-5', name: 'Section A' }] },
  ]);

  // View Mode & Filters
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [filterType, setFilterType] = useState<'section' | 'teacher' | 'room'>('section');
  const [selectedSection, setSelectedSection] = useState<string>('sec-1');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('t-1');
  const [selectedRoom, setSelectedRoom] = useState<string>('Room 101');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [quickAddSlot, setQuickAddSlot] = useState<{ day: number; period: number; start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: '08:00',
    endTime: '08:45',
    room: 'Room 101',
    sectionId: 'sec-1',
    subjectName: 'Mathematics',
    teacherId: 't-1',
  });

  // Sync with Classes if available
  useEffect(() => {
    const savedClasses = localStorage.getItem(`edusphere_classes_${schoolSlug}`);
    if (savedClasses) {
      try {
        const parsed = JSON.parse(savedClasses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClassesList(parsed);
          const firstSec = parsed[0]?.sections?.[0]?.id;
          if (firstSec && !selectedSection) setSelectedSection(firstSec);
        }
      } catch {
        // Ignore malformed cached class data.
      }
    }
  }, [schoolSlug]);

  const updateAndPersist = (updated: TimetableSlot[]) => {
    setTimetables(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Flattened sections for dropdown
  const allSections = useMemo(() => {
    return classesList.flatMap(c => (c.sections || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      className: c.name,
      label: `${c.name} — ${s.name}`,
    })));
  }, [classesList]);

  // Current active section label
  const currentSectionLabel = useMemo(() => {
    const found = allSections.find(s => s.id === selectedSection);
    return found ? found.label : 'Class 10 — Section A (Alpha)';
  }, [allSections, selectedSection]);

  // Current active teacher label
  const currentTeacherLabel = useMemo(() => {
    const found = [].find(t => t.id === selectedTeacher);
    return found ? `${found.name} (${found.subject})` : 'All Teachers';
  }, [selectedTeacher]);

  // Filtered Slots according to chosen perspective
  const displayedSlots = useMemo(() => {
    if (filterType === 'section') {
      return timetables.filter(t => t.sectionId === selectedSection);
    } else if (filterType === 'teacher') {
      return timetables.filter(t => t.teacherId === selectedTeacher);
    } else {
      return timetables.filter(t => t.room === selectedRoom);
    }
  }, [timetables, filterType, selectedSection, selectedTeacher, selectedRoom]);

  // Conflict Detector Check
  const checkConflict = (newSlot: Partial<TimetableSlot>, excludeId?: string) => {
    const conflicts: string[] = [];
    timetables.forEach(t => {
      if (excludeId && t.id === excludeId) return;
      if (t.dayOfWeek === newSlot.dayOfWeek && t.periodNumber === newSlot.periodNumber) {
        // Same teacher collision
        if (t.teacherId === newSlot.teacherId && t.sectionId !== newSlot.sectionId) {
          conflicts.push(`Teacher conflict: ${t.teacherName} is already assigned to ${t.className} (${t.sectionName}) in Period ${t.periodNumber}`);
        }
        // Same room collision
        if (t.room && newSlot.room && t.room === newSlot.room && t.sectionId !== newSlot.sectionId) {
          conflicts.push(`Room collision: ${t.room} is already booked by ${t.className} (${t.sectionName}) in Period ${t.periodNumber}`);
        }
      }
    });
    return conflicts;
  };

  // Add / Save Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const secObj = allSections.find(s => s.id === form.sectionId);
    const teacherObj = [].find(t => t.id === form.teacherId);
    const periodObj = [].find(p => p.periodNumber === Number(form.periodNumber));

    const newSlot: TimetableSlot = {
      id: `tt-${Date.now()}`,
      dayOfWeek: Number(form.dayOfWeek),
      periodNumber: Number(form.periodNumber),
      startTime: periodObj?.startTime || form.startTime,
      endTime: periodObj?.endTime || form.endTime,
      room: form.room,
      sectionId: form.sectionId,
      className: secObj?.className || 'Class 10',
      sectionName: secObj?.name || 'Section A',
      subjectId: `sub-${form.subjectName.toLowerCase().slice(0, 4)}`,
      subjectName: form.subjectName,
      teacherId: form.teacherId,
      teacherName: teacherObj?.name || 'Teacher',
    };

    const conflicts = checkConflict(newSlot);
    if (conflicts.length > 0) {
      toast.warning(conflicts[0], { duration: 5000 });
    }

    // Replace if slot already exists in same section, day, and period
    const filtered = timetables.filter(
      t => !(t.sectionId === newSlot.sectionId && t.dayOfWeek === newSlot.dayOfWeek && t.periodNumber === newSlot.periodNumber)
    );
    const updated = [...filtered, newSlot];
    updateAndPersist(updated);

    toast.success(`Schedule slot added for ${newSlot.subjectName}!`);
    setShowAddModal(false);
    setQuickAddSlot(null);
    setSaving(false);
  };

  // Delete Slot
  const handleDeleteSlot = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Remove this class slot from schedule?')) return;
    const updated = timetables.filter(t => t.id !== id);
    updateAndPersist(updated);
    toast.success('Slot removed from timetable.');
  };

  // Auto Generate Standard Schedule
  const handleAutoGenerateTemplate = () => {
    if (!confirm(`Auto-fill a full balanced weekly timetable for ${currentSectionLabel}?`)) return;

    const subjectsCycle = [
      { name: 'Mathematics', teacher: [][0], room: 'Room 101' },
      { name: 'Physics', teacher: [][0], room: 'Physics Lab' },
      { name: 'Chemistry', teacher: [][1], room: 'Chem Lab' },
      { name: 'Biology', teacher: [][1], room: 'Bio Lab' },
      { name: 'English Literature', teacher: [][3], room: 'Room 101' },
      { name: 'Computer Science', teacher: [][4], room: 'CS Lab 2' },
      { name: 'Urdu Language', teacher: [][3], room: 'Room 101' },
      { name: 'Islamic Studies', teacher: [][5], room: 'Room 101' },
      { name: 'Pakistan Studies', teacher: [][5], room: 'Room 101' },
    ];

    const secObj = allSections.find(s => s.id === selectedSection);
    const generated: TimetableSlot[] = [];

    DAYS_MAP.forEach((day, dIdx) => {
      [].filter(p => !p.isBreak).forEach((period, pIdx) => {
        const itemIdx = (dIdx * 3 + pIdx) % subjectsCycle.length;
        const item = subjectsCycle[itemIdx];

        generated.push({
          id: `tt-gen-${day.num}-${period.periodNumber}-${Date.now()}`,
          dayOfWeek: day.num,
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          room: item.room,
          sectionId: selectedSection,
          className: secObj?.className || 'Class 10',
          sectionName: secObj?.name || 'Section A',
          subjectId: `sub-${item.name.toLowerCase().slice(0, 4)}`,
          subjectName: item.name,
          teacherId: item.teacher.id,
          teacherName: item.teacher.name,
        });
      });
    });

    const otherSectionsSlots = timetables.filter(t => t.sectionId !== selectedSection);
    const combined = [...otherSectionsSlots, ...generated];
    updateAndPersist(combined);
    toast.success(`Standard 6-day timetable generated for ${currentSectionLabel}!`);
  };

  // Reset to seed schedule
  const handleResetSchedule = () => {
    if (confirm('Reset entire timetable schedule to standard template?')) {
      setTimetables([]);
      localStorage.setItem(storageKey, JSON.stringify([]));
      toast.success('Standard schedule template restored successfully!');
    }
  };

  // Open Quick Add Modal for specific cell
  const handleCellClick = (dayNum: number, period: PeriodConfig, existingSlot?: TimetableSlot) => {
    if (period.isBreak) return;
    if (existingSlot) {
      // Slot already exists
      return;
    }
    setQuickAddSlot({
      day: dayNum,
      period: period.periodNumber,
      start: period.startTime,
      end: period.endTime,
    });
    setForm({
      dayOfWeek: dayNum,
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      room: selectedRoom || 'Room 101',
      sectionId: selectedSection || 'sec-1',
      subjectName: 'Mathematics',
      teacherId: 't-1',
    });
    setShowAddModal(true);
  };

  // Workload and Stats Calculation
  const totalWeeklyPeriods = displayedSlots.length;
  const uniqueSubjects = new Set(displayedSlots.map(s => s.subjectName)).size;
  const uniqueTeachers = new Set(displayedSlots.map(s => s.teacherId)).size;

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
              Master Academic Scheduling & Timetable Matrix
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Timetable & Bell Schedule</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Weekly interactive period scheduling matrix, smart clash detector & printable official date sheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetSchedule}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-bold transition-all shadow-sm"
            title="Reset to Standard Template"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={handleAutoGenerateTemplate}
            className="px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Sparkles size={14} className="text-amber-400" /> Auto-Fill Schedule
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Printer size={14} /> Print / Export Timetable
          </button>

          <button
            onClick={() => {
              setQuickAddSlot(null);
              setForm({
                dayOfWeek: 1,
                periodNumber: 1,
                startTime: '08:00',
                endTime: '08:45',
                room: 'Room 101',
                sectionId: selectedSection || 'sec-1',
                subjectName: 'Mathematics',
                teacherId: 't-1',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Add Class Slot
          </button>
        </div>
      </div>

      {/* 2. Metric Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Weekly Slots</p>
            <p className="text-2xl font-black text-foreground">{totalWeeklyPeriods}</p>
            <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">Active Periods</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subjects</p>
            <p className="text-2xl font-black text-foreground">{uniqueSubjects}</p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">Taught this week</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Faculty Assigned</p>
            <p className="text-2xl font-black text-foreground">{uniqueTeachers}</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Specialized Teachers</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">School Bell</p>
            <p className="text-xl font-black text-foreground">08:00 – 01:45</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">7 Periods + Recess</p>
          </div>
        </div>
      </div>

      {/* 3. Perspective Switcher & Filter Controls */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Filter Type Radio / Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 self-start">
            <button
              onClick={() => setFilterType('section')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'section'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏫 By Class & Section
            </button>
            <button
              onClick={() => setFilterType('teacher')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'teacher'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              👨‍🏫 By Teacher
            </button>
            <button
              onClick={() => setFilterType('room')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'room'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏢 By Room / Lab
            </button>
          </div>

          {/* Active Perspective Dropdown Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {filterType === 'section' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Select Class:</span>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
                >
                  {allSections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.label}</option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'teacher' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Select Faculty:</span>
                <select
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
                >
                  {[].map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'room' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Select Room / Lab:</span>
                <select
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
                >
                  {ROOMS_LIST.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Toggle (Matrix vs List) */}
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'matrix' ? 'bg-accent text-foreground font-black' : 'text-muted-foreground'
                }`}
              >
                Weekly Matrix
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-accent text-foreground font-black' : 'text-muted-foreground'
                }`}
              >
                Day Cards
              </button>
            </div>
          </div>
        </div>

        {/* Current View Scope Banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>
              Currently viewing schedule for:{' '}
              <strong className="text-foreground">
                {filterType === 'section' ? currentSectionLabel : filterType === 'teacher' ? currentTeacherLabel : selectedRoom}
              </strong>
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-primary">
            {displayedSlots.length} Periods Scheduled
          </span>
        </div>
      </div>

      {/* 4. MAIN SCHEDULE DISPLAY (MATRIX OR CARDS) */}
      {viewMode === 'matrix' ? (
        /* ─── WEEKLY MATRIX GRID VIEW ─── */
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              {/* Header Row: Days */}
              <thead>
                <tr className="bg-accent/40 border-b border-border text-foreground">
                  <th className="p-4 text-xs font-black uppercase tracking-wider w-36 border-r border-border/60">
                    Period & Time
                  </th>
                  {DAYS_MAP.map(day => (
                    <th key={day.num} className="p-4 text-xs font-black text-center border-r border-border/60 last:border-r-0">
                      <div className="font-extrabold text-foreground">{day.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{day.short}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Periods */}
              <tbody className="divide-y divide-border">
                {[].map(period => {
                  if (period.isBreak) {
                    return (
                      <tr key={period.periodNumber} className="bg-amber-500/5 border-y-2 border-amber-500/20">
                        <td className="p-3.5 text-xs font-bold text-amber-400 border-r border-border/60 flex items-center gap-2">
                          <Clock size={13} />
                          <div>
                            <div>{period.label}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{period.startTime} - {period.endTime}</div>
                          </div>
                        </td>
                        <td colSpan={DAYS_MAP.length} className="p-3 text-center text-xs font-black uppercase tracking-widest text-amber-400/80">
                          ☕ Morning Recess & Snack Break (30 Mins)
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={period.periodNumber} className="hover:bg-accent/10 transition-colors">
                      {/* Period Time Header */}
                      <td className="p-3.5 text-xs font-bold text-foreground border-r border-border/60 bg-muted/10">
                        <div className="font-black text-primary">{period.label}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {period.startTime} - {period.endTime}
                        </div>
                      </td>

                      {/* Day Cells */}
                      {DAYS_MAP.map(day => {
                        const slot = displayedSlots.find(
                          s => s.dayOfWeek === day.num && s.periodNumber === period.periodNumber
                        );
                        const colors = slot ? SUBJECT_COLORS[slot.subjectName] || { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', badge: 'bg-primary/20 text-primary' } : null;

                        return (
                          <td
                            key={day.num}
                            onClick={() => handleCellClick(day.num, period, slot)}
                            className={`p-2 border-r border-border/60 last:border-r-0 align-top transition-all ${
                              !slot ? 'hover:bg-accent/40 cursor-pointer group/cell' : ''
                            }`}
                          >
                            {slot ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-2.5 rounded-2xl border ${colors?.bg} ${colors?.border} relative group shadow-sm transition-all hover:shadow-md`}
                              >
                                {/* Delete Action */}
                                <button
                                  onClick={(e) => handleDeleteSlot(slot.id, e)}
                                  className="absolute top-1.5 right-1.5 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Delete slot"
                                >
                                  <Trash2 size={12} />
                                </button>

                                <div className="pr-4">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${colors?.badge} inline-block mb-1`}>
                                    {slot.subjectName}
                                  </span>
                                  <div className="text-xs font-bold text-foreground line-clamp-1">
                                    {filterType === 'teacher' ? `${slot.className} (${slot.sectionName})` : slot.teacherName}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 font-mono">
                                    <MapPin size={10} className="text-primary" />
                                    <span>{slot.room || 'Room 101'}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="h-16 rounded-xl border border-dashed border-border/50 group-hover/cell:border-primary/50 flex flex-col items-center justify-center text-muted-foreground/40 group-hover/cell:text-primary transition-all">
                                <Plus size={14} className="mb-0.5" />
                                <span className="text-[10px] font-bold">Add Slot</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── DAY CARDS VIEW ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DAYS_MAP.map(day => {
            const daySlots = displayedSlots.filter(s => s.dayOfWeek === day.num);
            daySlots.sort((a, b) => a.periodNumber - b.periodNumber);

            return (
              <div key={day.num} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm">
                      {day.short}
                    </div>
                    <div>
                      <h3 className="font-black text-foreground">{day.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{daySlots.length} Classes Assigned</p>
                    </div>
                  </div>
                </div>

                {daySlots.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                    <p className="text-xs text-muted-foreground italic">No classes scheduled for {day.name}.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {daySlots.map(slot => {
                      const colors = SUBJECT_COLORS[slot.subjectName] || { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', badge: 'bg-primary/20 text-primary' };
                      return (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-2xl border ${colors.bg} ${colors.border} flex items-center justify-between group`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/80 font-mono text-muted-foreground">
                                Period {slot.periodNumber} ({slot.startTime})
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${colors.badge}`}>
                                {slot.subjectName}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground mt-1">
                              {filterType === 'teacher' ? `${slot.className} · ${slot.sectionName}` : slot.teacherName}
                            </h4>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {slot.room}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD / EDIT SLOT MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="max-w-xl">
        <ModalHeader
          icon={<Clock size={20} />}
          title="Add Class Slot to Schedule"
          subtitle="Assign subject, teacher, day & period"
          onClose={() => setShowAddModal(false)}
        />
        <form onSubmit={handleSaveSlot} className="space-y-4 text-sm p-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Day of Week */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Day of Week *</label>
                    <select
                      value={form.dayOfWeek}
                      onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      {DAYS_MAP.map(d => (
                        <option key={d.num} value={d.num}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Period Slot *</label>
                    <select
                      value={form.periodNumber}
                      onChange={e => {
                        const pNum = Number(e.target.value);
                        const cfg = [].find(p => p.periodNumber === pNum);
                        setForm({
                          ...form,
                          periodNumber: pNum,
                          startTime: cfg?.startTime || form.startTime,
                          endTime: cfg?.endTime || form.endTime,
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      {[].filter(p => !p.isBreak).map(p => (
                        <option key={p.periodNumber} value={p.periodNumber}>
                          {p.label} ({p.startTime} - {p.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Class & Section */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Target Class & Section *</label>
                  <select
                    value={form.sectionId}
                    onChange={e => setForm({ ...form, sectionId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    {allSections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.label}</option>
                    ))}
                  </select>
                </div>

                {/* Subject & Teacher */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Subject *</label>
                    <select
                      value={form.subjectName}
                      onChange={e => setForm({ ...form, subjectName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      {[].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Teacher Assigned *</label>
                    <select
                      value={form.teacherId}
                      onChange={e => setForm({ ...form, teacherId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                    >
                      {[].map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Classroom / Lab Room *</label>
                  <select
                    value={form.room}
                    onChange={e => setForm({ ...form, room: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
                  >
                    {ROOMS_LIST.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Save Slot</span>
                  </button>
                </div>
        </form>
      </Modal>

      {/* 6. PRINT PREVIEW MODAL */}
      <Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} maxWidth="max-w-5xl">
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Official Timetable Schedule Printout</h2>
                    <p className="text-xs text-muted-foreground">{currentSectionLabel} · Academic Year 2026-2027</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md"
                  >
                    <Printer size={14} /> Print Now
                  </button>
                  <button onClick={() => setShowPrintModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Document Preview Area */}
              <div className="flex-1 overflow-y-auto py-6 bg-white text-slate-900 p-8 rounded-2xl my-4 space-y-6 font-sans">
                {/* Official School Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h1 className="text-2xl font-black tracking-wider uppercase">EDUSPHERE INTERNATIONAL ACADEMY</h1>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                    Official Master Class Timetable · Session 2026-2027
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold border-t border-slate-300 pt-2 text-slate-700">
                    <span>Class & Section: <strong>{currentSectionLabel}</strong></span>
                    <span>Room: <strong>Room 101</strong></span>
                    <span>Class Teacher: <strong>Dr. Ananya Roy</strong></span>
                  </div>
                </div>

                {/* Timetable Matrix */}
                <table className="w-full text-center border-collapse border border-slate-800 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 font-black">
                      <th className="p-2 border border-slate-800">Time / Period</th>
                      {DAYS_MAP.map(d => (
                        <th key={d.num} className="p-2 border border-slate-800">{d.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[].map(period => {
                      if (period.isBreak) {
                        return (
                          <tr key={period.periodNumber} className="bg-slate-200 font-bold">
                            <td className="p-2 border border-slate-800 font-mono text-[10px]">{period.startTime}-{period.endTime}</td>
                            <td colSpan={DAYS_MAP.length} className="p-2 border border-slate-800 tracking-widest text-[11px]">
                              *** RECESS & BREAK (10:15 - 10:45) ***
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={period.periodNumber} className="border-b border-slate-800">
                          <td className="p-2 border border-slate-800 font-bold bg-slate-50 font-mono text-[10px]">
                            {period.label}<br />
                            <span className="text-slate-500 font-normal">{period.startTime}-{period.endTime}</span>
                          </td>
                          {DAYS_MAP.map(d => {
                            const slot = displayedSlots.find(s => s.dayOfWeek === d.num && s.periodNumber === period.periodNumber);
                            return (
                              <td key={d.num} className="p-2 border border-slate-800 align-middle">
                                {slot ? (
                                  <div>
                                    <div className="font-extrabold text-slate-900">{slot.subjectName}</div>
                                    <div className="text-[10px] text-slate-600">{slot.teacherName}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">{slot.room}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs font-bold text-slate-700">
                  <div className="border-t border-slate-400 pt-2">Academic Coordinator</div>
                  <div className="border-t border-slate-400 pt-2">Class Incharge Teacher</div>
                  <div className="border-t border-slate-400 pt-2">Principal / Vice Principal</div>
                </div>
              </div>
      </Modal>

    </div>
  );
}
