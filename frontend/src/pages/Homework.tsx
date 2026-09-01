import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, FileText, CheckCircle2, Clock, BookOpen, User, X, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Homework() {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    sectionId: '',
    subjectId: '',
  });

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SCHOOL_ADMIN';

  const MOCK_HOMEWORK = [
    { id: 'h1', title: 'Quadratic Equations & Polynomials', description: 'Solve exercises 4.1 to 4.5 from NCERT textbook Chapter 4.', dueDate: '2026-07-30', section: { name: 'A', class: { name: 'Class 10' } }, subject: { name: 'Mathematics' } },
    { id: 'h2', title: 'Atoms & Molecules Lab Notes', description: 'Write down chemical formula and balance chemical equations.', dueDate: '2026-07-31', section: { name: 'B', class: { name: 'Class 9' } }, subject: { name: 'Science' } },
    { id: 'h3', title: 'Essay: Modern Technology & Society', description: 'Write a 500-word essay on the impact of AI on education.', dueDate: '2026-08-02', section: { name: 'A', class: { name: 'Class 11' } }, subject: { name: 'English' } },
  ];

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/academics/homework').catch(() => null),
      apiClient.get('/classes').catch(() => null),
      apiClient.get('/academics/subjects').catch(() => null),
    ])
      .then(([hwRes, clsRes, subRes]) => {
        setHomeworks(hwRes && Array.isArray(hwRes.data) ? hwRes.data : []);
        if (clsRes && Array.isArray(clsRes.data)) setClasses(clsRes.data);
        if (subRes && Array.isArray(subRes.data)) setSubjects(subRes.data);
      })
      .catch(() => setHomeworks(MOCK_HOMEWORK))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/academics/homework', form);
      toast.success('Homework assigned successfully!');
      setShowAdd(false);
      setForm({ title: '', description: '', dueDate: '', sectionId: '', subjectId: '' });
      fetchData();
    } catch {
      toast.error('Failed to create homework assignment');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      await apiClient.delete(`/academics/homework/${id}`);
      toast.success('Homework deleted');
      fetchData();
    } catch { toast.error('Failed to delete homework'); }
  };

  const sections = classes.flatMap((c: any) => (c.sections || []).map((s: any) => ({ ...s, className: c.name })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Homework</h1>
          <p className="text-muted-foreground text-sm mt-1">Assignments, study plans, and due dates</p>
        </div>
        {(isTeacher || isAdmin) && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Assign Homework
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {homeworks.map((hw, idx) => {
            const isOverdue = new Date(hw.dueDate) < new Date();
            return (
              <motion.div
                key={hw.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border hover:border-primary/20 rounded-2xl p-6 hover:shadow-lg transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {hw.subject?.name || 'Subject'}
                      </span>
                      {hw.section && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                          {hw.section.class?.name} · {hw.section.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      {isOverdue ? (
                        <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                          <Clock size={12} /> Overdue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{hw.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{hw.description}</p>
                </div>

                <div className="border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                  {hw.teacher && (
                    <div className="flex items-center gap-1.5">
                      <User size={13} />
                      <span>By: {hw.teacher.name}</span>
                    </div>
                  )}
                  {(isTeacher || isAdmin) && (
                    <button onClick={() => handleDelete(hw.id)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                      title="Delete assignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {homeworks.length === 0 && (
            <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">No homework assigned yet</p>
              <p className="text-xs mt-1">Check back later or click the button to assign one.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Create Homework Assignment</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Assignment Title</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Chapter 4 Fractions Exercises" required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Description & Instructions</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Please complete exercises 1 to 10 on page 142..." required rows={3}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Target Section</label>
                    <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">-- Select Section --</option>
                      {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Subject</label>
                    <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">-- Select Subject --</option>
                      {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Due Date</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Creating...' : 'Assign Homework'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
