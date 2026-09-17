import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Calendar, Clock, RefreshCw, Search, Trash2, Plus,
  Loader2, ShieldCheck, Download, Paperclip, CheckCircle2,
  AlertCircle, UserCheck, ChevronRight, FileText, X
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
type Section = { id: string; name: string; class?: { id: string; name: string } | null };
type SchoolClass = { id: string; name: string; sections?: Section[] };

export default function Homework() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

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
      const [homeworkRes, classesRes, subjectsRes] = await Promise.all([
        apiClient.get('/academics/homework').catch(() => ({ data: [] })),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/classes/subjects').catch(() => ({ data: [] })),
      ]);
      setItems(Array.isArray(homeworkRes.data) ? homeworkRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
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

  const sections = useMemo(
    () => classes.flatMap((c) => (c.sections || []).map((s) => ({ ...s, className: c.name }))),
    [classes]
  );

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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShieldCheck size={12} /> Academic Coursework
            </span>
            <span className="text-xs text-muted-foreground">• Assignments & Submissions</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Homework & Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curriculum assignments, syllabus deadlines, and digital study resources for all classes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{items.length}</p>
          <span className="text-xs text-muted-foreground font-semibold">Active assignments</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Due Soon (3 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{dueSoonCount}</p>
          <span className="text-xs text-amber-500 font-semibold">Approaching deadlines</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Curriculum Subjects</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{subjects.length}</p>
          <span className="text-xs text-muted-foreground font-semibold">Registered disciplines</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Covered Sections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{sections.length}</p>
          <span className="text-xs text-emerald-600 font-semibold">Classrooms connected</span>
        </div>
      </div>

      {/* ─── Search & Subject Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search homework title, subject, class, teacher..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
          />
        </div>

        {subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground outline-none"
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
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Loading assignments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <BookOpen className="mx-auto mb-3 text-muted-foreground/40" size={44} />
          <h3 className="font-bold text-foreground">No Homework Tasks Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-500 border border-violet-500/20">
                      {h.subject?.name || 'General Core'}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => void remove(h.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                        title="Delete homework"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <h2 className="font-bold text-base text-foreground mt-2">{h.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.section?.class?.name || 'Class'} {h.section?.name ? `— ${h.section.name}` : ''}
                  </p>

                  {h.description && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isDueSoon ? 'text-amber-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Calendar size={13} />
                      <span>Due: {new Date(h.dueDate).toLocaleDateString('en-PK')}</span>
                    </span>

                    {h.teacher?.name && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
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
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Target Section *</label>
              <select
                required
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
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
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
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
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Attachment Link</label>
              <input
                type="url"
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
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
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary resize-none"
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
    </div>
  );
}
