import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, Calendar, CheckCircle, CheckCircle2, Clock, FileText,
  Layers3, Loader2, Plus, RefreshCw, Search, Upload, Users, X
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface Exam {
  id: string;
  name: string;
  type?: string;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  sectionId?: string | null;
  isPublished?: boolean;
  description?: string | null;
}

interface Section {
  id: string;
  name: string;
  class?: { name?: string };
}

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  rollNo?: string | null;
  sectionId?: string | null;
}

const TYPES = ['UNIT_TEST', 'MONTHLY_TEST', 'MIDTERM', 'FINAL', 'QUIZ', 'MOCK_BOARD'];

export default function ExamsLive() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Exam | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultSaving, setResultSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'UNIT_TEST',
    startDate: '',
    endDate: '',
    totalMarks: '100',
    passingMarks: '33',
    sectionId: '',
    description: '',
  });
  const [subjectId, setSubjectId] = useState('');
  const [resultRows, setResultRows] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const [e, classRes, sub, st] = await Promise.all([
        apiClient.get('/exams'),
        apiClient.get('/classes'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/students'),
      ]);
      const classes = Array.isArray(classRes.data) ? classRes.data : [];
      setExams(Array.isArray(e.data) ? e.data : []);
      setSections(
        classes.flatMap((item: any) =>
          (item.sections || []).map((itemSection: any) => ({ ...itemSection, class: { name: item.name } }))
        )
      );
      setSubjects(Array.isArray(sub.data) ? sub.data : []);
      setStudents(Array.isArray(st.data) ? st.data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load exam data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => exams.filter((e) => `${e.name} ${e.type || ''}`.toLowerCase().includes(search.toLowerCase())),
    [exams, search]
  );

  const publishedCount = exams.filter((e) => e.isPublished).length;
  const draftCount = exams.filter((e) => !e.isPublished).length;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.post('/exams', {
        ...form,
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        sectionId: form.sectionId || undefined,
      });
      setExams((p) => [data, ...p]);
      setSelected(data);
      setShowCreate(false);
      setForm({
        name: '',
        type: 'UNIT_TEST',
        startDate: '',
        endDate: '',
        totalMarks: '100',
        passingMarks: '33',
        sectionId: '',
        description: '',
      });
      toast.success('Exam created');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const publish = async (exam: Exam) => {
    try {
      const { data } = await apiClient.patch(`/exams/${exam.id}/publish`, { published: !exam.isPublished });
      setExams((p) => p.map((x) => (x.id === exam.id ? data : x)));
      setSelected(data);
      toast.success(data.isPublished ? 'Exam published' : 'Exam unpublished');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update publication status');
    }
  };

  const loadResults = async () => {
    if (!selected || !subjectId) return;
    try {
      const { data } = await apiClient.get('/exams/results', { params: { examId: selected.id, subjectId } });
      const next: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((r: any) => {
        next[r.studentId] = String(r.marksObtained ?? '');
      });
      setResultRows(next);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load results');
    }
  };

  const saveResults = async () => {
    if (!selected || !subjectId) return;
    setResultSaving(true);
    try {
      await apiClient.post('/exams/results', {
        examId: selected.id,
        results: Object.entries(resultRows)
          .filter(([, v]) => v !== '')
          .map(([studentId, v]) => ({ studentId, subjectId, marksObtained: Number(v), isAbsent: false })),
      });
      toast.success('Results saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save results');
    } finally {
      setResultSaving(false);
    }
  };

  const sectionStudents = selected?.sectionId ? students.filter((s) => s.sectionId === selected.sectionId) : students;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-screen-2xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Award size={12} /> Examination Office
            </span>
            <span className="text-xs text-muted-foreground">• Assessment Management</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Exams & Grade Records</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live examination schedules, grading structures, result publication and student marks entry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
            title="Refresh exams"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all active:scale-95"
          >
            <Plus size={15} /> Create Exam Term
          </button>
        </div>
      </div>

      {/* ── 4 High-Impact KPI Metric Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Exam Terms',
            value: exams.length,
            icon: Award,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Scheduled assessment terms',
          },
          {
            label: 'Published Results',
            value: publishedCount,
            icon: CheckCircle,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: `${draftCount} pending in draft`,
          },
          {
            label: 'Curriculum Subjects',
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
            subtitle: 'Academic assessment papers',
          },
          {
            label: 'Enrolled Candidates',
            value: students.length,
            icon: Users,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Eligible student examinees',
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
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">{value}</h4>
              </div>
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exam sessions by name or type..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ── Main Exam Management Section ── */}
      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-5">
        <div className="space-y-3">
          <div className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Exam Schedules ({filtered.length})
          </div>
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setSelected(ex);
                setSubjectId('');
                setResultRows({});
              }}
              className={`w-full text-left rounded-2xl border p-4 transition ${
                selected?.id === ex.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex justify-between gap-3 items-start">
                <div>
                  <h2 className="font-black text-foreground text-base">{ex.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ex.type || 'Exam'} • {new Date(ex.startDate).toLocaleDateString()} – {new Date(ex.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Total Marks: {ex.totalMarks} • Pass: {ex.passingMarks}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    ex.isPublished
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {ex.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No exams found. Click '+ Create Exam Term' above to schedule one.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 min-h-[400px]">
          {selected ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max Marks: <strong className="text-foreground">{selected.totalMarks}</strong> • Passing Threshold:{' '}
                    <strong className="text-foreground">{selected.passingMarks}</strong>
                  </p>
                </div>
                <button
                  onClick={() => void publish(selected)}
                  className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                    selected.isPublished
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {selected.isPublished ? 'Unpublish from Portal' : 'Publish to Students'}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                  >
                    <option value="">Select subject to enter marks</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void loadResults()}
                    disabled={!subjectId}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Load Student Sheet
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {sectionStudents.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{st.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">Roll: {st.rollNo || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={selected.totalMarks}
                          value={resultRows[st.id] || ''}
                          onChange={(e) => setResultRows((p) => ({ ...p, [st.id]: e.target.value }))}
                          placeholder={`/ ${selected.totalMarks}`}
                          className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground text-center outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  ))}
                  {!sectionStudents.length && (
                    <div className="p-8 text-center text-xs text-muted-foreground">No students enrolled in this section.</div>
                  )}
                </div>

                {sectionStudents.length > 0 && (
                  <button
                    onClick={() => void saveResults()}
                    disabled={resultSaving || !subjectId}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {resultSaving ? 'Saving Marks...' : 'Save Result Records'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
              <Award className="opacity-30 mb-3" size={48} />
              <p className="font-bold text-foreground text-base">Select an Examination Term</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Choose an exam from the left panel to record marks, view candidates, or toggle portal publication.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Exam Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <form
            onSubmit={create}
            className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <div>
                <h2 className="text-xl font-black text-foreground">Schedule Examination Term</h2>
                <p className="text-xs text-muted-foreground">Configure exam type, timeframe and passing marks</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Exam Title *</label>
                <input
                  required
                  placeholder="e.g. Midterm Examination 2026"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Exam Category</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold outline-none focus:border-primary"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Classroom Scope</label>
                  <select
                    value={form.sectionId}
                    onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold outline-none focus:border-primary"
                  >
                    <option value="">All School Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.class?.name ? `${s.class.name} • ` : ''}Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">End Date *</label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Total Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalMarks}
                    onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Passing Marks Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={form.passingMarks}
                    onChange={(e) => setForm((p) => ({ ...p, passingMarks: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Exam instructions for students & teachers..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 disabled:opacity-50"
              >
                {saving ? 'Creating Exam...' : 'Confirm & Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
