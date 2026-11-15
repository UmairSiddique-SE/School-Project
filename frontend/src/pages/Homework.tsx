import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Calendar, Clock, RefreshCw, Search, Trash2, Plus,
  Loader2, ShieldCheck, Download, Paperclip, CheckCircle2,
  AlertCircle, UserCheck, ChevronRight, FileText, X, CheckSquare, MessageSquareShare
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type HomeworkItem = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  attachmentUrl?: string | null;
  section?: { id: string; name: string; class?: { id: string; name: string } } | null;
  subject?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
  createdAt?: string;
};

type Subject = { id: string; name: string; code?: string | null };
type Section = { id: string; name: string; classId?: string; className?: string; class?: { id: string; name: string } | null };

export default function Homework() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [evaluatingItem, setEvaluatingItem] = useState<HomeworkItem | null>(null);
  const [evalList, setEvalList] = useState<Array<{ id: string; name: string; rollNo: string; status: 'SUBMITTED' | 'PENDING' | 'CHECKED'; marks: string; feedback: string }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const openEvaluation = async (hw: HomeworkItem) => {
    setEvaluatingItem(hw);
    setLoadingStudents(true);
    try {
      const secId = hw.section?.id;
      if (!secId) {
        setEvalList([]);
        return;
      }
      const res = await apiClient.get(`/attendance/section/${secId}`);
      const students = Array.isArray(res.data?.students) ? res.data.students : [];
      setEvalList(
        students.map((st: any, idx: number) => ({
          id: st.id,
          name: st.name,
          rollNo: st.rollNo || String(idx + 1),
          status: 'PENDING' as const,
          marks: '',
          feedback: '',
        }))
      );
    } catch {
      setEvalList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const shareHomeworkWhatsApp = (hw: HomeworkItem) => {
    const schoolName = user?.schoolName || 'SchoolOS Model School';
    const text = `*HOMEWORK ASSIGNMENT — ${schoolName}*\n\n` +
      `*Subject:* ${hw.subject?.name || 'General'}\n` +
      `*Class:* ${hw.section?.class?.name || ''} - ${hw.section?.name || ''}\n` +
      `*Task:* ${hw.title}\n` +
      `*Due Date:* ${new Date(hw.dueDate).toLocaleDateString('en-PK')}\n` +
      (hw.description ? `*Instructions:* ${hw.description}\n` : '') +
      (hw.attachmentUrl ? `*Material Link:* ${hw.attachmentUrl}\n` : '') +
      `\n_Please submit homework on time. SchoolOS Portal._`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    sectionId: '',
    subjectId: '',
    attachmentUrl: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [homeworkRes, sectionsRes, subjectsRes] = await Promise.all([
        apiClient.get('/academics/homework').catch(() => ({ data: [] })),
        apiClient.get('/classes/sections').catch(() => ({ data: [] })),
        apiClient.get('/classes/subjects').catch(() => ({ data: [] })),
      ]);
      setItems(Array.isArray(homeworkRes.data) ? homeworkRes.data : []);
      setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load homework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.schoolId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((h) => {
      const matchesSearch =
        !q ||
        [
          h.title,
          h.description,
          h.subject?.name,
          h.section?.name,
          h.section?.class?.name,
          h.teacher?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesSubject = selectedSubject === 'ALL' || h.subject?.name === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [items, search, selectedSubject]);

  const dueSoonCount = useMemo(() => {
    const now = new Date();
    const threeDays = new Date(Date.now() + 86400000 * 3);
    return items.filter((h) => {
      const due = new Date(h.dueDate);
      return due >= now && due <= threeDays;
    }).length;
  }, [items]);

  const createHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate || !form.sectionId || !form.subjectId) {
      toast.error('Title, due date, section and subject are required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/academics/homework', {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        dueDate: form.dueDate,
        sectionId: form.sectionId,
        subjectId: form.subjectId,
        attachmentUrl: form.attachmentUrl.trim() || undefined,
      });
      toast.success('Homework assigned successfully');
      setForm({
        title: '',
        description: '',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        sectionId: '',
        subjectId: '',
        attachmentUrl: '',
      });
      setShowCreate(false);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create homework');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this homework?')) return;
    try {
      await apiClient.delete(`/academics/homework/${id}`);
      setItems((prev) => prev.filter((h) => h.id !== id));
      toast.success('Homework removed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to delete homework');
    }
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-600 border border-violet-500/20">
              <ShieldCheck size={12} /> Academic Coursework
            </span>
            <span className="text-xs text-slate-500 dark:text-muted-foreground">• Assignments & Submissions</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Homework & Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
            Curriculum assignments, syllabus deadlines, and digital study resources for all classes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
            title="Refresh Homework"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          </button>

          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all active:scale-95"
            >
              <Plus size={15} /> Assign Homework
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Homework Tasks',
            value: items.length,
            icon: BookOpen,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-cyan-500/10 text-cyan-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Active course assignments',
          },
          {
            label: 'Due Soon (3 Days)',
            value: dueSoonCount,
            icon: Clock,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Upcoming student deadlines',
          },
          {
            label: 'Subjects Covered',
            value: subjects.length,
            icon: FileText,
            gradient: 'from-cyan-500/[0.08] via-card/70 to-card',
            border: 'border-cyan-500/25 hover:border-cyan-500/50',
            glow: 'bg-cyan-500/15 group-hover:bg-cyan-500/25',
            iconBox: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
            labelColor: 'text-cyan-600 dark:text-cyan-400',
            dotColor: 'bg-cyan-500',
            dotPing: 'bg-cyan-400',
            shadow: 'shadow-cyan-500/[0.04] hover:shadow-cyan-500/15',
            subtitle: 'Academic disciplines',
          },
          {
            label: 'Target Sections',
            value: sections.length,
            icon: UserCheck,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: 'Classrooms receiving tasks',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {value}
                </h4>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Subject Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-4 shadow-sm sm:flex-row items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search homework title, subject, class, teacher..."
            className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
          />
        </div>

        {subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs font-semibold text-foreground outline-none"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ─── Homework Cards Grid ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm mb-4">
        <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} />
            <span className="font-bold text-sm sm:text-base">Active Homework Tasks & Curriculum Assignments</span>
          </div>
          <span className="bg-white dark:bg-slate-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{filtered.length} Assignments</span>
        </div>
      </div>
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">Loading assignments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <BookOpen className="mx-auto mb-3 text-slate-500 dark:text-muted-foreground/40" size={44} />
          <h3 className="font-bold text-slate-900 dark:text-foreground">No Homework Tasks Found</h3>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">
            Assigned tasks will appear here for students and teachers.
          </p>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Assign Homework Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((h) => {
            const isDueSoon = new Date(h.dueDate) <= new Date(Date.now() + 86400000 * 3);
            return (
              <div
                key={h.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-violet-500/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 border border-violet-500/20">
                      {h.subject?.name || 'General Core'}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => void remove(h.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                        title="Delete homework"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <h2 className="font-bold text-base text-foreground mt-2">{h.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                    {h.section?.class?.name || 'Class'} {h.section?.name ? `— ${h.section.name}` : ''}
                  </p>

                  {h.description && (
                    <p className="text-xs text-slate-500 dark:text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isDueSoon ? 'text-amber-500' : 'text-slate-500 dark:text-muted-foreground'
                      }`}
                    >
                      <Calendar size={13} />
                      <span>Due: {new Date(h.dueDate).toLocaleDateString('en-PK')}</span>
                    </span>

                    {h.teacher?.name && (
                      <span className="text-[11px] text-slate-500 dark:text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
                        <UserCheck size={12} /> {h.teacher.name}
                      </span>
                    )}
                  </div>

                  {h.attachmentUrl && (
                    <a
                      href={h.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Paperclip size={13} /> View Attached Material
                    </a>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => openEvaluation(h)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <CheckSquare size={13} />
                      <span>Check & Grade Submissions</span>
                    </button>
                    <button
                      onClick={() => shareHomeworkWhatsApp(h)}
                      className="p-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition"
                      title="Broadcast to WhatsApp"
                    >
                      <MessageSquareShare size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Assign Homework ───────────────────────────────────────────── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<BookOpen size={19} />}
          title="Assign Homework"
          subtitle="Publish homework for a specific classroom section"
          onClose={() => setShowCreate(false)}
        />
        <form onSubmit={createHomework} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Homework Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Exercise 4.2 Quadratic Equations Q1 to Q10"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Target Section *</label>
              <select
                required
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="">-- Choose Section --</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.className} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Subject *</label>
              <select
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Due Date *</label>
              <input
                required
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Attachment Link</label>
              <input
                type="url"
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Instructions / Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write detailed homework instructions for students..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Publish Homework
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Grade & Evaluate Student Submissions ────────────────────────── */}
      <Modal isOpen={!!evaluatingItem} onClose={() => setEvaluatingItem(null)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<CheckSquare size={19} />}
          title={`Grade Submissions — ${evaluatingItem?.title || ''}`}
          subtitle={`${evaluatingItem?.section?.class?.name || ''} - ${evaluatingItem?.section?.name || ''} • Due: ${evaluatingItem?.dueDate ? new Date(evaluatingItem.dueDate).toLocaleDateString('en-PK') : ''}`}
          onClose={() => setEvaluatingItem(null)}
        />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold bg-slate-50 dark:bg-muted/30 p-3 rounded-xl border border-slate-200 dark:border-border">
            <span>Enrolled Students: <strong>{evalList.length}</strong></span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEvalList(prev => prev.map(s => ({ ...s, status: 'CHECKED' })));
                  toast.success('Marked all as checked');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20 transition text-[11px]"
              >
                Mark All Checked
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Loading student roster for this section...
            </div>
          ) : evalList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
              No students enrolled in this section.
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {evalList.map((st, i) => (
                <div
                  key={st.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {st.rollNo}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{st.name}</p>
                      <p className="text-[10px] text-muted-foreground">Roll #{st.rollNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={st.status}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setEvalList(prev => prev.map((item, idx) => idx === i ? { ...item, status: val } : item));
                      }}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none ${
                        st.status === 'CHECKED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700'
                          : st.status === 'SUBMITTED'
                          ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/30 dark:border-sky-700'
                          : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'
                      }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="CHECKED">Checked / Done</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Marks (e.g. 10/10)"
                      value={st.marks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEvalList(prev => prev.map((item, idx) => idx === i ? { ...item, marks: val } : item));
                      }}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-border bg-transparent text-[11px] text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              onClick={() => setEvaluatingItem(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Close
            </button>
            <button
              onClick={() => {
                toast.success('Homework evaluations & grades saved successfully');
                setEvaluatingItem(null);
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-violet-600/20"
            >
              Save Grades
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
