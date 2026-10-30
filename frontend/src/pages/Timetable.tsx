import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Clock, Edit2, Loader2, Plus, Printer, RefreshCw,
  Sparkles, Trash2, UserCheck, Users, X, BookOpen, AlertCircle, CheckCircle2,
  LayoutGrid, ListFilter, SlidersHorizontal, ChevronRight, Layers3,
  DoorOpen, ShieldAlert, GraduationCap, ArrowRight, User
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Section = { id: string; name: string; classId?: string; class?: { id?: string; name?: string } };
type Subject = { id: string; name: string; code?: string | null };
type Teacher = { id: string; name: string; employeeNo?: string; email?: string };
type Slot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  section?: Section;
  subject?: Subject;
  teacher?: Teacher;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
};

const days = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

const input = 'w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 font-medium transition';
const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:brightness-110 transition disabled:opacity-60';

export default function Timetable() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const [slots, setSlots] = useState<Slot[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Mode state
  const [filterMode, setFilterMode] = useState<'section' | 'teacher'>('section');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [viewLayout, setViewLayout] = useState<'matrix' | 'timeline'>('matrix');

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '08:45',
    room: 'Room 101',
    sectionId: '',
    subjectId: '',
    teacherId: '',
  });

  const load = async () => {
    try {
      const [tRes, classRes, sectionRes, subRes, trRes] = await Promise.all([
        apiClient.get('/academics/timetables'),
        apiClient.get('/classes'),
        apiClient.get('/classes/sections'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      const classData = Array.isArray(classRes.data) ? classRes.data : [];
      setClasses(classData);
      setSlots(Array.isArray(tRes.data) ? tRes.data : []);
      const allSections = Array.isArray(sectionRes.data) ? sectionRes.data : [];
      setSections(allSections);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      const allTeachers = Array.isArray(trRes.data) ? trRes.data : [];
      setTeachers(allTeachers);

      if (!selectedSection && allSections.length > 0) {
        setSelectedSection(allSections[0].id);
        setForm(f => ({ ...f, sectionId: allSections[0].id }));
      }
      if (!selectedTeacher && allTeachers.length > 0) {
        setSelectedTeacher(allTeachers[0].id);
      }
      if (allTeachers.length > 0) {
        setForm(f => ({ ...f, teacherId: allTeachers[0].id }));
      }
      if (Array.isArray(subRes.data) && subRes.data.length > 0) {
        setForm(f => ({ ...f, subjectId: subRes.data[0].id }));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to load timetable database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Filtered slots for current view
  const visibleSlots = useMemo(() => {
    if (filterMode === 'section') {
      return slots.filter(s => !selectedSection || s.sectionId === selectedSection);
    } else {
      return slots.filter(s => !selectedTeacher || s.teacherId === selectedTeacher);
    }
  }, [slots, filterMode, selectedSection, selectedTeacher]);

  const daySlots = useMemo(() => {
    return visibleSlots
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [visibleSlots, selectedDay]);

  // Live Conflict Detection for current form
  const currentConflict = useMemo(() => {
    if (!form.startTime || !form.endTime || !form.dayOfWeek) return null;
    const day = Number(form.dayOfWeek);

    // 1. Check section conflict
    if (form.sectionId) {
      const sConflict = slots.find(
        s => (!editingSlot || s.id !== editingSlot.id) &&
             s.sectionId === form.sectionId &&
             s.dayOfWeek === day &&
             s.startTime < form.endTime &&
             s.endTime > form.startTime
      );
      if (sConflict) {
        return {
          type: 'SECTION',
          message: `Section already has "${sConflict.subject?.name || 'Period'}" (${sConflict.startTime} - ${sConflict.endTime})`,
        };
      }
    }

    // 2. Check teacher double booking
    if (form.teacherId) {
      const tConflict = slots.find(
        s => (!editingSlot || s.id !== editingSlot.id) &&
             s.teacherId === form.teacherId &&
             s.dayOfWeek === day &&
             s.startTime < form.endTime &&
             s.endTime > form.startTime
      );
      if (tConflict) {
        return {
          type: 'TEACHER',
          message: `Teacher ${tConflict.teacher?.name || 'Faculty'} is already booked with ${tConflict.section?.class?.name || 'Class'} (${tConflict.section?.name || 'Sec'}) at ${tConflict.startTime} - ${tConflict.endTime}`,
        };
      }
    }

    return null;
  }, [form, slots, editingSlot]);

  // Handle Add Single Period
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentConflict) {
      toast.error(`Schedule Conflict: ${currentConflict.message}`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post('/academics/timetables', {
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
      });
      setSlots((prev) => [...prev, data]);
      setShowAdd(false);
      toast.success('Period added to timetable ✓');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Conflict or error creating timetable slot');
    } finally {
      setSaving(false);
    }
  };

  // Handle Update Period
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    if (currentConflict) {
      toast.error(`Schedule Conflict: ${currentConflict.message}`);
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.patch(`/academics/timetables/${editingSlot.id}`, {
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
      });
      setSlots((prev) => prev.map((s) => (s.id === editingSlot.id ? data : s)));
      setShowEdit(false);
      setEditingSlot(null);
      toast.success('Period updated successfully ✓');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error updating slot');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Period
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await apiClient.delete(`/academics/timetables/${id}`);
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success('Period removed');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error deleting slot');
    }
  };

  const openEditModal = (slot: Slot) => {
    setEditingSlot(slot);
    setForm({
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || '',
      sectionId: slot.sectionId || slot.section?.id || '',
      subjectId: slot.subjectId || slot.subject?.id || '',
      teacherId: slot.teacherId || slot.teacher?.id || '',
    });
    setShowEdit(true);
  };

  const currentSectionObj = sections.find(s => s.id === selectedSection);
  const currentTeacherObj = teachers.find(t => t.id === selectedTeacher);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-600/10 via-card to-indigo-600/5 p-6 shadow-sm">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Master Schedule Engine</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-foreground">Timetable & Schedule</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
              Conflict-free class periods, teacher allocation, room assignments, and printable routines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={() => {
                  setEditingSlot(null);
                  setForm(f => ({
                    ...f,
                    dayOfWeek: String(selectedDay),
                    sectionId: selectedSection || sections[0]?.id || '',
                    teacherId: selectedTeacher || teachers[0]?.id || '',
                    subjectId: subjects[0]?.id || '',
                  }));
                  setShowAdd(true);
                }}
                className={primaryBtn}
              >
                <Plus size={16} /> Add Class Period
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition"
            >
              <Printer size={14} /> Print Schedule
            </button>

            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── FILTER SWITCHER: Class Schedule vs Teacher Schedule ── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border">
            <button
              onClick={() => setFilterMode('section')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                filterMode === 'section'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap size={15} /> Class Timetable
            </button>
            {canEdit && (
              <button
                onClick={() => setFilterMode('teacher')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                  filterMode === 'teacher'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                    : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck size={15} /> Teacher Timetable
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {filterMode === 'section' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Select Section:</span>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-cyan-500/15"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name ? `${s.class.name} — Section ${s.name}` : `Section ${s.name}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Select Faculty:</span>
                <select
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employeeNo || t.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1 border border-slate-200 dark:border-border bg-white dark:bg-card p-1 rounded-xl">
              <button
                onClick={() => setViewLayout('matrix')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${viewLayout === 'matrix' ? 'bg-muted text-foreground' : 'text-slate-500 dark:text-muted-foreground'}`}
                title="Weekly Matrix"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewLayout('timeline')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${viewLayout === 'timeline' ? 'bg-muted text-foreground' : 'text-slate-500 dark:text-muted-foreground'}`}
                title="Daily Timeline"
              >
                <ListFilter size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active View Summary Banner ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black">
              {filterMode === 'section' ? <GraduationCap size={18} /> : <User size={18} />}
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white">
                {filterMode === 'section'
                  ? `Class Routine: ${currentSectionObj?.class?.name || 'Class'} (Section ${currentSectionObj?.name || 'A'})`
                  : `Faculty Routine: ${currentTeacherObj?.name || 'Teacher'} (${currentTeacherObj?.employeeNo || 'Staff'})`}
              </h2>
              <p className="text-[11px] text-white/85">
                Total {visibleSlots.length} weekly periods scheduled • Automatic teacher double-booking check active
              </p>
            </div>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{visibleSlots.length} Periods</span>
        </div>
      </div>
      <div className="hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 border border-violet-500/20 flex items-center justify-center font-black">
            {filterMode === 'section' ? <GraduationCap size={20} /> : <User size={20} />}
          </div>
          <div>
            <h2 className="font-black text-base text-slate-900 dark:text-foreground">
              {filterMode === 'section'
                ? `Class Routine: ${currentSectionObj?.class?.name || 'Class'} (Section ${currentSectionObj?.name || 'A'})`
                : `Faculty Routine: ${currentTeacherObj?.name || 'Teacher'} (${currentTeacherObj?.employeeNo || 'Staff'})`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Total {visibleSlots.length} weekly periods scheduled • Automatic teacher double-booking check active
            </p>
          </div>
        </div>

        {/* Day Selector (for Timeline View) */}
        {viewLayout === 'timeline' && (
          <div className="flex flex-wrap gap-1.5">
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  selectedDay === d.id
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'bg-muted/50 text-slate-500 dark:text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. WEEKLY MATRIX VIEW (MON-SAT GRID)                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewLayout === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {days.map((day) => {
            const dayPeriods = visibleSlots
              .filter(s => s.dayOfWeek === day.id)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={day.id} className="rounded-3xl border border-border/80 bg-card p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-600 font-black text-xs flex items-center justify-center">
                      {day.id}
                    </div>
                    <h3 className="font-black text-base text-slate-900 dark:text-foreground">{day.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                    {dayPeriods.length} {dayPeriods.length === 1 ? 'Period' : 'Periods'}
                  </span>
                </div>

                {dayPeriods.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 dark:text-muted-foreground/60 italic">
                    No periods scheduled
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayPeriods.map((slot) => (
                      <div
                        key={slot.id}
                        className="group relative rounded-2xl border border-border/70 bg-slate-50 dark:bg-muted/20 p-3.5 hover:border-violet-500/40 hover:bg-slate-100/70 dark:bg-muted/40 transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-black text-sm text-foreground block">
                              {slot.subject?.name || 'Subject'}
                            </span>
                            {filterMode === 'section' ? (
                              <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-0.5">
                                <UserCheck size={12} /> {slot.teacher?.name || 'No Faculty'}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-cyan-500 flex items-center gap-1 mt-0.5">
                                <GraduationCap size={12} /> {slot.section?.class?.name} ({slot.section?.name})
                              </span>
                            )}
                          </div>

                          {canEdit && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => openEditModal(slot)}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500"
                                title="Edit Slot"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => void handleDelete(slot.id)}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                title="Delete Slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-muted-foreground border-t border-border/50 pt-2">
                          <span className="inline-flex items-center gap-1 font-mono text-slate-900 dark:text-foreground">
                            <Clock size={11} className="text-violet-500" />
                            {slot.startTime} — {slot.endTime}
                          </span>
                          {slot.room && (
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-muted-foreground">
                              <DoorOpen size={11} /> {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. DAILY TIMELINE VIEW                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewLayout === 'timeline' && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-foreground">
              {days.find(d => d.id === selectedDay)?.name} Schedule Timeline
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-muted-foreground">
              {daySlots.length} Periods Scheduled
            </span>
          </div>

          {daySlots.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-muted-foreground space-y-2">
              <CalendarDays size={36} className="mx-auto opacity-40" />
              <p className="font-bold text-sm">No periods scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-4 rounded-2xl border border-border/80 bg-slate-50 dark:bg-muted/20 p-4 hover:border-violet-500/40 transition group"
                >
                  <div className="h-10 w-10 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-violet-600/20">
                    P{index + 1}
                  </div>

                  <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <div>
                      <h4 className="font-black text-base text-foreground truncate">{slot.subject?.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground font-mono">{slot.subject?.code || 'Core'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <UserCheck size={14} className="text-emerald-500" /> {slot.teacher?.name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <GraduationCap size={14} className="text-cyan-500" /> {slot.section?.class?.name} ({slot.section?.name})
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
                        <Clock size={12} className="text-violet-500" /> {slot.startTime} — {slot.endTime}
                      </span>
                      {slot.room && (
                        <span className="text-[11px] text-slate-500 dark:text-muted-foreground block mt-1">Room: {slot.room}</span>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={() => openEditModal(slot)}
                        className="p-2 rounded-xl text-slate-500 dark:text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => void handleDelete(slot.id)}
                        className="p-2 rounded-xl text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT PERIOD MODAL                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(showAdd || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAdd(false); setShowEdit(false); }} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                  <CalendarDays size={18} />
                </div>
                <h2 className="font-black text-base text-slate-900 dark:text-foreground">
                  {showEdit ? 'Edit Timetable Period' : 'Add Class Period'}
                </h2>
              </div>
              <button onClick={() => { setShowAdd(false); setShowEdit(false); }} className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={showEdit ? handleUpdate : handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Conflict Warning banner */}
              {currentConflict && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-500 font-semibold">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[10px]">Conflict Detected</span>
                    {currentConflict.message}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Day of Week *</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                    className={input}
                  >
                    {days.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Classroom / Hall</label>
                  <input
                    value={form.room}
                    onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                    placeholder="e.g. Room 102"
                    className={input}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Start Time *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className={input}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">End Time *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className={input}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Class & Section *</label>
                <select
                  value={form.sectionId}
                  onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                  className={input}
                  required
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name} — Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Curriculum Subject *</label>
                <select
                  value={form.subjectId}
                  onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  className={input}
                  required
                >
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code || 'NO-CODE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase mb-1 block">Assigned Faculty Teacher *</label>
                <select
                  value={form.teacherId}
                  onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className={input}
                  required
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.employeeNo || t.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || Boolean(currentConflict)}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-violet-500/25 hover:brightness-110 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : showEdit ? 'Update Period' : 'Save to Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
