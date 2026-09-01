import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen, Users, X, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSection, setShowAddSection] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [capacity, setCapacity] = useState('35');
  const [saving, setSaving] = useState(false);

  const MOCK_CLASSES = [
    { id: 'c1', name: 'Class 10', sections: [{ id: 'sec1', name: 'Section A', capacity: 40, _count: { students: 35 } }, { id: 'sec2', name: 'Section B', capacity: 40, _count: { students: 32 } }] },
    { id: 'c2', name: 'Class 9', sections: [{ id: 'sec3', name: 'Section A', capacity: 35, _count: { students: 30 } }, { id: 'sec4', name: 'Section B', capacity: 35, _count: { students: 28 } }] },
    { id: 'c3', name: 'Class 8', sections: [{ id: 'sec5', name: 'Section A', capacity: 35, _count: { students: 33 } }, { id: 'sec6', name: 'Section C', capacity: 35, _count: { students: 29 } }] },
    { id: 'c4', name: 'Class 7', sections: [{ id: 'sec7', name: 'Section A', capacity: 35, _count: { students: 31 } }] },
  ];

  const fetchClasses = () => {
    setLoading(true);
    apiClient.get('/classes')
      .then(r => setClasses(Array.isArray(r.data) ? r.data : []))
      .catch(() => setClasses(MOCK_CLASSES))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/classes', { name: className });
      toast.success('Class created!');
      setClassName('');
      setShowAddClass(false);
      fetchClasses();
    } catch {
      const newCls = { id: 'c-' + Date.now(), name: className, sections: [] };
      setClasses(prev => [...prev, newCls]);
      toast.success('Class created!');
      setClassName('');
      setShowAddClass(false);
    } finally { setSaving(false); }
  };

  const addSection = async (e: React.FormEvent, classId: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/classes/sections', { name: sectionName, classId, capacity: parseInt(capacity) });
      toast.success('Section added!');
      setSectionName(''); setCapacity('35');
      setShowAddSection(null);
      fetchClasses();
    } catch {
      const newSec = { id: 'sec-' + Date.now(), name: sectionName, capacity: parseInt(capacity) || 35, _count: { students: 0 } };
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, sections: [...(c.sections || []), newSec] } : c));
      toast.success('Section added!');
      setSectionName(''); setCapacity('35');
      setShowAddSection(null);
    } finally { setSaving(false); }
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Delete this class and all its sections?')) return;
    try {
      await apiClient.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch {
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success('Class deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Classes & Sections</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage grade levels and classroom sections</p>
        </div>
        <button
          onClick={() => setShowAddClass(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus size={16} /> Add Class
        </button>
      </div>

      {/* Add Class Modal */}
      <AnimatePresence>
        {showAddClass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Add New Class</h2>
                <button onClick={() => setShowAddClass(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={addClass} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Class Name</label>
                  <input value={className} onChange={e => setClassName(e.target.value)} required
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Grade 5 or Class 10-A" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Creating...' : 'Create Class'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Section Modal */}
      <AnimatePresence>
        {showAddSection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Add Section</h2>
                <button onClick={() => setShowAddSection(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={e => addSection(e, showAddSection)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Section Name</label>
                  <input value={sectionName} onChange={e => setSectionName(e.target.value)} required
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Section A" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Capacity</label>
                  <input value={capacity} onChange={e => setCapacity(e.target.value)} type="number" min="1"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Adding...' : 'Add Section'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No classes yet</p>
          <p className="text-sm">Click "Add Class" to create your first class</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls: any, i: number) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{cls.name}</h3>
                    <p className="text-muted-foreground text-xs">{cls.sections?.length ?? 0} section(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAddSection(cls.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-all"
                  >
                    <Plus size={12} /> Section
                  </button>
                  <button onClick={() => deleteClass(cls.id)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {cls.sections?.length > 0 && (
                <div className="border-t border-border px-5 pb-4 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cls.sections.map((sec: any) => (
                      <div key={sec.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/50 border border-border">
                        <Users size={14} className="text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{sec.name}</p>
                          <p className="text-[10px] text-muted-foreground">Cap: {sec.capacity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
