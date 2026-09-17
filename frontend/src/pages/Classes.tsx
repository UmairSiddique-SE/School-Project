import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, BookOpen, Users, X, Loader2, Search, Filter,
  GraduationCap, UserCheck, MapPin, Layers, ChevronRight, Edit2,
  CheckCircle, AlertCircle, ShieldCheck, Sparkles, Building2,
  Tv, Wind, Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';
import { useNavigate } from 'react-router-dom';

interface Section {
  id: string;
  name: string;
  roomNo?: string;
  floor?: string;
  capacity: number;
  enrolledCount?: number;
  boysCount?: number;
  girlsCount?: number;
  classTeacher?: string;
  teacher?: { id: string; name: string; email?: string } | null;
  teacherSubject?: string;
  stream?: string;
  attendanceRate?: string;
  hasSmartBoard?: boolean;
  hasAC?: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  wing?: 'PRIMARY' | 'MIDDLE' | 'SENIOR' | 'COLLEGE';
  code?: string;
  monthlyFee?: string;
  coordinator?: string;
  sections: Section[];
  createdAt?: string;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
}

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schoolSlug = user?.schoolSlug || 'demo';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wing, setWing] = useState<'ALL' | 'PRIMARY' | 'MIDDLE' | 'SENIOR' | 'COLLEGE'>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [classForm, setClassForm] = useState({
    name: '',
    wing: 'SENIOR' as 'PRIMARY' | 'MIDDLE' | 'SENIOR' | 'COLLEGE',
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    capacity: '40',
    teacherId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/people/teachers').catch(() => ({ data: [] })),
      ]);
      const classData: ClassItem[] = Array.isArray(classRes.data) ? classRes.data : [];
      setClasses(classData);
      setExpanded(new Set(classData.map((c) => c.id)));
      setTeachers(Array.isArray(teacherRes.data) ? teacherRes.data : []);
    } catch {
      setClasses([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return classes.filter((item) => {
      const wingMatch = wing === 'ALL' || !item.wing || item.wing === wing;
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.sections || []).some((s) => s.name.toLowerCase().includes(query) || (s.teacher?.name || '').toLowerCase().includes(query));
      return wingMatch && searchMatch;
    });
  }, [classes, search, wing]);

  const totalSections = classes.reduce((sum, item) => sum + (item.sections?.length || 0), 0);
  const totalStudents = classes.reduce(
    (sum, item) =>
      sum +
      (item.sections || []).reduce((inner, section) => inner + (section.enrolledCount || 0), 0),
    0
  );
  const totalCapacity = classes.reduce(
    (sum, item) =>
      sum + (item.sections || []).reduce((inner, section) => inner + (section.capacity || 40), 0),
    0
  );
  const occupancy = totalCapacity ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addClass = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!classForm.name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/classes', {
        name: classForm.name.trim(),
      });
      toast.success(`${classForm.name} created successfully!`);
      setClassModal(false);
      setClassForm({ name: '', wing: 'SENIOR' });
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (item: ClassItem) => {
    if (!window.confirm(`Delete ${item.name} and all its sections from the database?`)) return;
    try {
      await apiClient.delete(`/classes/${item.id}`);
      toast.success(`${item.name} deleted`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete class');
    }
  };

  const openSectionModal = (classId: string) => {
    setSectionForm({
      name: '',
      capacity: '40',
      teacherId: teachers[0]?.id || '',
    });
    setSectionModal(classId);
  };

  const saveSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sectionModal || !sectionForm.name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/classes/sections', {
        classId: sectionModal,
        name: sectionForm.name.trim(),
        capacity: Number(sectionForm.capacity) || 40,
        teacherId: sectionForm.teacherId || undefined,
      });
      toast.success(`Section ${sectionForm.name} added successfully`);
      setSectionModal(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add section');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (section: Section) => {
    if (!window.confirm(`Delete section ${section.name}?`)) return;
    try {
      await apiClient.delete(`/classes/sections/${section.id}`);
      toast.success(`Section ${section.name} removed`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete section');
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShieldCheck size={12} /> Academic Curriculum & Sections
            </span>
            <span className="text-xs text-muted-foreground">• Live Institutional Database</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Classes & Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure grades, classroom sections, appointed class teachers, and student capacity.
          </p>
        </div>

        <button
          onClick={() => setClassModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          <Plus size={15} /> Add New Grade
        </button>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Academic Grades</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{classes.length}</p>
          <span className="text-xs text-muted-foreground font-semibold">Registered in database</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Classroom Sections</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{totalSections}</p>
          <span className="text-xs text-muted-foreground font-semibold">Operational classrooms</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Total Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{totalStudents}</p>
          <span className="text-xs text-emerald-600 font-semibold">Active students</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Seat Capacity</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{totalCapacity}</p>
          <span className="text-xs text-muted-foreground font-semibold">Configured student desks</span>
        </div>
      </div>

      {/* ─── Search & Wing Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search grade or section..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={14} className="mr-1 text-muted-foreground" />
          {(['ALL', 'SENIOR', 'MIDDLE', 'PRIMARY', 'COLLEGE'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setWing(option)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                wing === option
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {option === 'ALL' ? 'All' : option[0] + option.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Classes Accordion List ───────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Synchronizing academic classes...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <BookOpen size={46} className="mx-auto mb-3 text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-foreground">No Academic Classes Configured</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Your school database has no classes yet. Create your first academic grade level to start admitting students.
          </p>
          <button
            onClick={() => setClassModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-md hover:opacity-90"
          >
            <Plus size={15} /> Add First Grade
          </button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
          <Search size={30} className="mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-bold text-foreground">No classes found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search query or wing filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((item, index) => {
            const isOpen = expanded.has(item.id);
            const sections = item.sections || [];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:border-border/80"
              >
                {/* Class Header */}
                <div
                  className="flex cursor-pointer flex-col gap-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-transparent to-transparent p-5 sm:p-6 md:flex-row md:items-center md:justify-between"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-xl font-black text-white shadow-md shadow-violet-600/20">
                      {item.name.replace(/\D/g, '') || item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-foreground">{item.name}</h2>
                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-violet-500">
                          {sections.length} Section{sections.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Class ID: <span className="font-mono">{item.id.slice(0, 8)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openSectionModal(item.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-600 hover:bg-violet-500/20 transition-all"
                    >
                      <Plus size={14} /> Add Section
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteClass(item);
                      }}
                      className="rounded-xl p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight
                      size={19}
                      className={`text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-primary' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Sections Expansion */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                        {sections.length > 0 ? (
                          sections.map((section) => (
                            <div
                              key={section.id}
                              className="rounded-2xl border border-border bg-background/60 p-4 hover:border-violet-500/30 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-black text-foreground">{section.name}</h3>
                                    <p className="mt-0.5 text-[11px] text-violet-500 font-semibold">
                                      {item.name}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${section.id}`)}
                                      className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                                      title="Mark attendance"
                                    >
                                      <CheckCircle size={15} />
                                    </button>
                                    <button
                                      onClick={() => deleteSection(section)}
                                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                      title="Delete section"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                                  <div className="rounded-xl border border-border bg-card p-2.5">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                      <Users size={12} className="text-violet-500" />
                                      <span className="text-[10px] font-bold uppercase">Capacity</span>
                                    </div>
                                    <b className="text-foreground">{section.capacity || 40} Seats</b>
                                  </div>
                                  <div className="rounded-xl border border-border bg-card p-2.5">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                                      <UserCheck size={12} className="text-violet-500" />
                                      <span className="text-[10px] font-bold uppercase">Teacher</span>
                                    </div>
                                    <b className="block truncate text-foreground">
                                      {section.teacher?.name || 'Unassigned'}
                                    </b>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                                <button
                                  onClick={() => navigate(`/${schoolSlug}/students`)}
                                  className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Users size={14} /> Student Admissions
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-8 text-center bg-card/30">
                            <Layers size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                            <p className="font-bold text-foreground">No sections created yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Click "Add Section" above to open a classroom section in {item.name}.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Modal 1: Add New Grade ───────────────────────────────────────────── */}
      <Modal isOpen={classModal} onClose={() => setClassModal(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<BookOpen size={19} />}
          title="Add New Academic Grade"
          subtitle="Create a new grade level in the database"
          onClose={() => setClassModal(false)}
        />
        <form onSubmit={addClass} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Grade Name *</label>
            <input
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Class 10 or Grade 1"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClassModal(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : 'Create Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 2: Add Section ─────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(sectionModal)}
        onClose={() => setSectionModal(null)}
        maxWidth="max-w-lg"
      >
        <ModalHeader
          icon={<Layers size={19} />}
          title="Add Classroom Section"
          subtitle="Configure classroom capacity and appointed teacher"
          onClose={() => setSectionModal(null)}
        />
        <form onSubmit={saveSection} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Section Name *</label>
            <input
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. Section A (Alpha)"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Student Capacity</label>
            <input
              type="number"
              min="1"
              max="500"
              value={sectionForm.capacity}
              onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Class Teacher</label>
            <select
              value={sectionForm.teacherId}
              onChange={(e) => setSectionForm({ ...sectionForm, teacherId: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- No Assigned Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setSectionModal(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : 'Add Section'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
