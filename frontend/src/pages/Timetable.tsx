import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Clock, Edit2, Loader2, Plus, Printer, RefreshCw,
  Sparkles, Trash2, UserCheck, Users, X, BookOpen, AlertCircle, CheckCircle,
  LayoutGrid, ListFilter, SlidersHorizontal, ChevronRight, Layers3
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Section = { id: string; name: string; classId?: string; class?: { id?: string; name?: string } };
type Subject = { id: string; name: string; code?: string | null };
type Teacher = { id: string; name: string; email?: string };
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
  ['1', 'Monday'],
  ['2', 'Tuesday'],
  ['3', 'Wednesday'],
  ['4', 'Thursday'],
  ['5', 'Friday'],
  ['6', 'Saturday'],
];

const input = 'w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium transition';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold transition hover:bg-accent';
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

  // Filter state
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'daily' | 'matrix'>('daily');

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [form, setForm] = useState({
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '08:45',
    room: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
  });

  // Auto-generator settings state
  const [autoConfig, setAutoConfig] = useState({
    targetSectionId: '',
    startTime: '08:00',
    periodMinutes: '45',
    periodsPerDay: '6',
    breakAfterPeriod: '3',
    breakMinutes: '20',
    daysCount: '5', // 5 for Mon-Fri, 6 for Mon-Sat
  });

  const load = async () => {
    try {
      const [tRes, classRes, subRes, trRes] = await Promise.all([
        apiClient.get('/academics/timetables'),
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/teachers'),
      ]);
      const classData = Array.isArray(classRes.data) ? classRes.data : [];
      setClasses(classData);
      setSlots(Array.isArray(tRes.data) ? tRes.data : []);
      const allSections = classData.flatMap((item: any) =>
        (item.sections || []).map((sec: any) => ({
          ...sec,
          class: { id: item.id, name: item.name },
        }))
      );
      setSections(allSections);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      setTeachers(Array.isArray(trRes.data) ? trRes.data : []);
      if (!selectedSection && allSections.length > 0) {
        setSelectedSection(allSections[0].id);
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
    return slots
      .filter((s) => (!selectedSection || s.sectionId === selectedSection) && s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, selectedSection, selectedDay]);

  // Handle Add Single Period
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.post('/academics/timetables', {
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
      });
      setSlots((prev) => [...prev, data]);
      setShowAdd(false);
      toast.success('Period added to timetable!');
      setForm({
        dayOfWeek: String(selectedDay),
        startTime: '08:00',
        endTime: '08:45',
        room: '',
        sectionId: selectedSection,
        subjectId: '',
        teacherId: '',
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add timetable period');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal
  const openEdit = (slot: Slot) => {
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

  // Handle Update Period
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch(`/academics/timetables/${editingSlot.id}`, {
        ...form,
        dayOfWeek: Number(form.dayOfWeek),
      });
      setSlots((prev) => prev.map((s) => (s.id === editingSlot.id ? { ...s, ...data, ...form, dayOfWeek: Number(form.dayOfWeek) } : s)));
      setShowEdit(false);
      setEditingSlot(null);
      toast.success('Timetable period updated successfully!');
      void load();
    } catch (e: any) {
      // Fallback: If PATCH isn't supported, delete and create
      try {
        await apiClient.delete(`/academics/timetables/${editingSlot.id}`);
        const res = await apiClient.post('/academics/timetables', {
          ...form,
          dayOfWeek: Number(form.dayOfWeek),
        });
        setSlots((prev) => [...prev.filter((s) => s.id !== editingSlot.id), res.data]);
        setShowEdit(false);
        setEditingSlot(null);
        toast.success('Timetable period updated!');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || e?.response?.data?.message || 'Failed to update period');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Period
  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this period from timetable?')) return;
    try {
      await apiClient.delete(`/academics/timetables/${id}`);
      setSlots((prev) => prev.filter((x) => x.id !== id));
      toast.success('Period removed from schedule');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to delete period');
    }
  };

  // ── Auto Generate Timetable Algorithm ──
  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSec = autoConfig.targetSectionId || selectedSection;
    if (!targetSec) {
      return toast.error('Please select a target section for auto generation');
    }
    const secObj = sections.find((s) => s.id === targetSec);
    if (!secObj) return toast.error('Section not found');

    const classObj = classes.find((c) => c.id === secObj.class?.id || (c.sections || []).some((s: any) => s.id === targetSec));
    const assignments: { subjectId: string; teacherId?: string }[] = classObj?.subjects?.map((a: any) => ({
      subjectId: a.subject?.id || a.subjectId,
      teacherId: a.teacher?.id || a.teacherId,
    })) || [];

    if (assignments.length === 0) {
      return toast.error('No subjects assigned to this class. Please assign subjects & teachers in Academic Structure first.');
    }

    setGenerating(true);
    try {
      const periodsPerDay = Number(autoConfig.periodsPerDay) || 6;
      const periodDuration = Number(autoConfig.periodMinutes) || 45;
      const breakAfter = Number(autoConfig.breakAfterPeriod) || 3;
      const breakDuration = Number(autoConfig.breakMinutes) || 20;
      const totalDays = Number(autoConfig.daysCount) || 5;

      const [startH, startM] = autoConfig.startTime.split(':').map(Number);
      let createdCount = 0;

      // Generate for each day
      for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
        let currentMinutes = startH * 60 + startM;

        for (let p = 1; p <= periodsPerDay; p++) {
          // If recess
          if (p === breakAfter + 1 && breakDuration > 0) {
            currentMinutes += breakDuration;
          }

          const slotStartH = Math.floor(currentMinutes / 60);
          const slotStartM = currentMinutes % 60;
          const endMinutes = currentMinutes + periodDuration;
          const slotEndH = Math.floor(endMinutes / 60);
          const slotEndM = endMinutes % 60;

          const startTimeStr = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`;
          const endTimeStr = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`;

          // Pick subject & teacher cyclically with offset per day to balance
          const assignmentIndex = (dayIndex * 2 + p - 1) % assignments.length;
          const assignment = assignments[assignmentIndex];

          // If teacher is missing, pick default teacher
          const teacherId = assignment.teacherId || teachers[0]?.id;
          const subjectId = assignment.subjectId;

          if (subjectId && teacherId) {
            try {
              await apiClient.post('/academics/timetables', {
                dayOfWeek: dayIndex,
                startTime: startTimeStr,
                endTime: endTimeStr,
                room: `Room ${p + 100}`,
                sectionId: targetSec,
                subjectId: subjectId,
                teacherId: teacherId,
              });
              createdCount++;
            } catch {
              // Ignore individual period conflict errors during bulk fill
            }
          }

          currentMinutes = endMinutes + 5; // 5 min transition buffer
        }
      }

      toast.success(`Smart Timetable generated successfully! (${createdCount} periods added)`);
      setShowAuto(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error generating timetable');
    } finally {
      setGenerating(false);
    }
  };

  // Print Timetable
  const printTimetable = () => {
    const secObj = sections.find((s) => s.id === selectedSection);
    const title = secObj ? `${secObj.class?.name || ''} - Section ${secObj.name}` : 'All Sections';
    const popup = window.open('', '_blank', 'width=900,height=650');
    if (!popup) return toast.error('Please allow popups to print');

    const html = `<!doctype html><html><head><title>Timetable - ${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;background:#fff;color:#1e293b}h1{font-size:22px;margin:0 0 4px}p{font-size:12px;color:#64748b;margin:0 0 16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:12px}th{background:#f1f5f9;font-weight:bold}.time{font-family:monospace;font-weight:bold;color:#4338ca}</style></head><body><h1>EduSphere Academic Schedule</h1><p>${title} • Generated on ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead><tbody>${slots.filter((s) => !selectedSection || s.sectionId === selectedSection).map((s) => `<tr><td>${days.find((d) => Number(d[0]) === s.dayOfWeek)?.[1] || ''}</td><td class='time'>${s.startTime} - ${s.endTime}</td><td><strong>${s.subject?.name || '—'}</strong></td><td>${s.teacher?.name || '—'}</td><td>${s.room || '—'}</td></tr>`).join('')}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    popup.document.write(html);
    popup.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={36} />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading Academic Timetable…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-[1500px] mx-auto">
      {/* ── Top Header ── */}
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Academic Management</p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Class Timetables & Schedules</h1>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Manage weekly periods, auto-generate conflict-free timetables, and assign classroom periods.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                void load();
              }}
              className={button}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={printTimetable} className={button}>
              <Printer size={15} /> Print Timetable
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => setShowAuto(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
                >
                  <Sparkles size={16} /> Auto Timetable
                </button>
                <button
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      dayOfWeek: String(selectedDay),
                      sectionId: selectedSection,
                    }));
                    setShowAdd(true);
                  }}
                  className={primaryBtn}
                >
                  <Plus size={16} /> Add Period
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter & View Mode Controls ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
        {/* Section Selector */}
        <div className="lg:col-span-5 flex items-center gap-3">
          <Layers3 className="text-violet-400 shrink-0" size={18} />
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground focus:border-violet-500 outline-none"
          >
            <option value="">All Academic Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class?.name ? `${s.class.name} — ` : ''}Section {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="flex rounded-xl bg-background border border-border p-1 gap-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'daily' ? 'bg-violet-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays size={14} /> Daily View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'matrix' ? 'bg-violet-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid size={14} /> Weekly Matrix
            </button>
          </div>
        </div>

        {/* Stats Indicator */}
        <div className="lg:col-span-4 text-right text-xs text-muted-foreground font-medium flex items-center justify-end gap-3">
          <span className="bg-violet-500/10 px-3 py-1.5 rounded-xl border border-violet-500/20 text-violet-400 font-bold">
            {slots.length} Total Periods Active
          </span>
        </div>
      </div>

      {/* ── Main Timetable Layout ── */}
      {viewMode === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Day Selection Sidebar */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">Days of Week</p>
            {days.map(([num, name]) => {
              const dayNum = Number(num);
              const count = slots.filter((s) => (!selectedSection || s.sectionId === selectedSection) && s.dayOfWeek === dayNum).length;
              const isSelected = selectedDay === dayNum;
              return (
                <button
                  key={num}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left font-bold transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border-violet-500 text-foreground shadow-lg'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <CalendarDays size={16} />
                    </div>
                    <span>{name}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-muted text-muted-foreground'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Timeline Cards */}
          <div className="rounded-3xl border border-border bg-card p-6 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  {days.find((d) => Number(d[0]) === selectedDay)?.[1]} Schedule
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {visibleSlots.length} periods programmed for this day
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => {
                    setForm((p) => ({ ...p, dayOfWeek: String(selectedDay), sectionId: selectedSection }));
                    setShowAdd(true);
                  }}
                  className={button}
                >
                  <Plus size={14} /> Add Period
                </button>
              )}
            </div>

            {visibleSlots.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-8">
                <Clock className="mx-auto text-muted-foreground mb-3 opacity-40" size={40} />
                <p className="font-bold text-foreground text-lg">No periods scheduled for {days.find((d) => Number(d[0]) === selectedDay)?.[1]}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Click 'Add Period' to create one manually or click 'Auto Timetable' to generate a full weekly timetable automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="group rounded-2xl border border-border bg-gradient-to-r from-background via-background to-violet-500/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-violet-500/40 hover:shadow-md transition-all duration-300"
                  >
                    {/* Time & Period Order */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono font-black text-sm flex items-center justify-center">
                        P{index + 1}
                      </div>
                      <div>
                        <p className="font-mono font-black text-sm text-foreground flex items-center gap-1.5">
                          <Clock size={13} className="text-violet-400" />
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {slot.room ? `Room: ${slot.room}` : 'No Room Specified'}
                        </p>
                      </div>
                    </div>

                    {/* Subject & Teacher */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-foreground truncate">
                          {slot.subject?.name || 'Subject Period'}
                        </span>
                        {slot.subject?.code && (
                          <span className="text-[10px] font-mono font-black bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {slot.subject.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{slot.section?.class?.name ? `${slot.section.class.name} • ` : ''}Sec {slot.section?.name || '—'}</span>
                        <span>•</span>
                        <span className="text-violet-400 font-bold">{slot.teacher?.name || 'Teacher Not Assigned'}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button
                          onClick={() => openEdit(slot)}
                          className="h-9 w-9 rounded-xl border border-border bg-background hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center text-muted-foreground"
                          title="Edit Period"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleRemove(slot.id)}
                          className="h-9 w-9 rounded-xl border border-border bg-background hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center text-muted-foreground"
                          title="Delete Period"
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
        </div>
      ) : (
        /* ── Weekly Matrix Grid View ── */
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 text-left w-32">Day</th>
                  <th className="p-4 text-left">Periods & Time Slots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {days.map(([num, dayName]) => {
                  const dayNum = Number(num);
                  const daySlots = slots
                    .filter((s) => (!selectedSection || s.sectionId === selectedSection) && s.dayOfWeek === dayNum)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  return (
                    <tr key={num} className="hover:bg-muted/10 transition">
                      <td className="p-4 font-black text-sm text-foreground bg-muted/20 align-top">
                        {dayName}
                        <span className="block text-[10px] text-muted-foreground font-mono mt-1">
                          {daySlots.length} periods
                        </span>
                      </td>
                      <td className="p-4">
                        {daySlots.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No periods programmed</span>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {daySlots.map((s, idx) => (
                              <div
                                key={s.id}
                                className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-background p-3 relative group"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-violet-400 mb-1">
                                  <span>{s.startTime} - {s.endTime}</span>
                                  {canEdit && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-white" title="Edit">
                                        <Edit2 size={12} />
                                      </button>
                                      <button onClick={() => handleRemove(s.id)} className="text-muted-foreground hover:text-rose-400" title="Delete">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="font-black text-sm text-foreground truncate">{s.subject?.name || 'Subject'}</p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{s.teacher?.name || 'Teacher'}</p>
                                {s.room && <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">{s.room}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Period Modal ── */}
      {(showAdd || showEdit) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center">
          <form
            onSubmit={showEdit ? handleUpdate : handleCreate}
            className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">
                {showEdit ? 'Edit Timetable Period' : 'Add Period to Schedule'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setShowEdit(false);
                  setEditingSlot(null);
                }}
                className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Day of Week *</label>
                <select
                  required
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
                  className={input}
                >
                  {days.map(([n, name]) => (
                    <option key={n} value={n}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Class & Section *</label>
                <select
                  required
                  value={form.sectionId}
                  onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
                  className={input}
                >
                  <option value="">Select section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name ? `${s.class.name} • ` : ''}Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Subject *</label>
                <select
                  required
                  value={form.subjectId}
                  onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
                  className={input}
                >
                  <option value="">Select subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Assigned Teacher *</label>
                <select
                  required
                  value={form.teacherId}
                  onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className={input}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Start Time *</label>
                <input
                  required
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  className={input}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">End Time *</label>
                <input
                  required
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  className={input}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Classroom / Room No</label>
                <input
                  placeholder="e.g. Room 204 or Science Lab"
                  value={form.room}
                  onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                  className={input}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                className={button}
                onClick={() => {
                  setShowAdd(false);
                  setShowEdit(false);
                  setEditingSlot(null);
                }}
              >
                Cancel
              </button>
              <button disabled={saving} className={primaryBtn}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {showEdit ? 'Save Changes' : 'Add Period'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Auto Timetable Generator Modal ── */}
      {showAuto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center">
          <form
            onSubmit={handleAutoGenerate}
            className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-card p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Smart Auto Timetable Generator</h2>
                  <p className="text-xs text-muted-foreground">
                    Automatically balance periods, assigned teachers, and break slots across the week.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuto(false)}
                className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Target Section *</label>
                <select
                  required
                  value={autoConfig.targetSectionId || selectedSection}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, targetSectionId: e.target.value }))}
                  className={input}
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class?.name ? `${s.class.name} • ` : ''}Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Day Start Time</label>
                <input
                  type="time"
                  value={autoConfig.startTime}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, startTime: e.target.value }))}
                  className={input}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Period Duration (Minutes)</label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  value={autoConfig.periodMinutes}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, periodMinutes: e.target.value }))}
                  className={input}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Periods Per Day</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={autoConfig.periodsPerDay}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, periodsPerDay: e.target.value }))}
                  className={input}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Days Per Week</label>
                <select
                  value={autoConfig.daysCount}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, daysCount: e.target.value }))}
                  className={input}
                >
                  <option value="5">5 Days (Monday to Friday)</option>
                  <option value="6">6 Days (Monday to Saturday)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Recess / Break After Period</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={autoConfig.breakAfterPeriod}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, breakAfterPeriod: e.target.value }))}
                  className={input}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Break Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={autoConfig.breakMinutes}
                  onChange={(e) => setAutoConfig((p) => ({ ...p, breakMinutes: e.target.value }))}
                  className={input}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> How Auto Generator Works:
              </p>
              <p className="mt-1 opacity-80">
                It uses the subjects and teacher assignments configured for this class, distributes them across Monday to Friday/Saturday evenly, computes period start and finish timestamps with the break interval, and publishes them directly to the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button type="button" className={button} onClick={() => setShowAuto(false)}>
                Cancel
              </button>
              <button
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-60"
              >
                {generating && <Loader2 size={16} className="animate-spin" />}
                Generate & Publish Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
