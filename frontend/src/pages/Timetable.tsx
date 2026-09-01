import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, MapPin, X, Loader2, BookOpen, Trash2, Calendar } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export default function Timetable() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filterSection, setFilterSection] = useState('');

  const [form, setForm] = useState({
    dayOfWeek: '1', // 1=Mon, 5=Fri
    startTime: '',
    endTime: '',
    room: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/academics/timetables'),
      apiClient.get('/classes'),
      apiClient.get('/classes/subjects'),
      apiClient.get('/people/teachers'),
    ])
      .then(([timeRes, clsRes, subRes, teachRes]) => {
        setTimetables(timeRes.data);
        setClasses(clsRes.data);
        setSubjects(subRes.data);
        setTeachers(teachRes.data);
        
        // Auto select first section for filter
        const sections = clsRes.data.flatMap((c: any) => c.sections || []);
        if (sections.length > 0) setFilterSection(sections[0].id);
      })
      .catch(() => toast.error('Failed to load timetables'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/academics/timetables', form);
      toast.success('Timetable slot added successfully!');
      setShowAdd(false);
      setForm({
        dayOfWeek: '1',
        startTime: '',
        endTime: '',
        room: '',
        sectionId: '',
        subjectId: '',
        teacherId: '',
      });
      fetchData();
    } catch {
      toast.error('Failed to add timetable slot');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this timetable slot?')) return;
    try {
      await apiClient.delete(`/academics/timetables/${id}`);
      toast.success('Slot removed');
      fetchData();
    } catch { toast.error('Failed to remove slot'); }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sections = classes.flatMap((c: any) => (c.sections || []).map((s: any) => ({ ...s, className: c.name })));

  // Filter timetables by selected section
  const filtered = timetables.filter(t => t.sectionId === filterSection);

  // Group by day of week
  const groupedByDay: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  filtered.forEach(slot => {
    if (groupedByDay[slot.dayOfWeek]) {
      groupedByDay[slot.dayOfWeek].push(slot);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Timetable & Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Weekly class scheduling calendar</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Add Class Slot
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-sm font-bold text-foreground shrink-0 flex items-center gap-1.5">
          <BookOpen size={16} className="text-primary" /> View Class Timetable:
        </label>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {days.map((dayName, dayIdx) => {
            const dayNum = dayIdx + 1;
            const slots = groupedByDay[dayNum] || [];
            
            // Sort slots by start time
            slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={dayNum} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-extrabold text-lg text-foreground border-b border-border/60 pb-2 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" /> {dayName}
                </h3>
                
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No classes scheduled.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {slots.map(slot => (
                      <motion.div
                        key={slot.id}
                        whileHover={{ y: -3 }}
                        className="bg-background border border-border/80 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all group relative"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {slot.subject?.name || 'Subject'}
                            </span>
                            <button onClick={() => handleDelete(slot.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-all absolute right-2 top-2"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                            <Clock size={12} /> {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.room && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin size={12} /> Room: {slot.room}
                            </p>
                          )}
                        </div>

                        {slot.teacher && (
                          <div className="border-t border-border/40 mt-3 pt-2 text-[11px] font-semibold text-foreground/80">
                            Teacher: {slot.teacher.name}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                <h2 className="text-lg font-black text-foreground">Add Weekly Timetable Slot</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Day of Week</label>
                    <select value={form.dayOfWeek} onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {days.map((d, i) => <option key={d} value={String(i + 1)}>{d}</option>)}
                    </select>
                  </div>
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
                  <div>
                    <label className="text-xs font-semibold text-foreground">Assign Teacher</label>
                    <select value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">-- Select Teacher --</option>
                      {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Start Time</label>
                    <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">End Time</label>
                    <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Classroom / Location</label>
                    <input value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                      placeholder="Room 102, Block B"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Adding...' : 'Add Timetable Slot'}
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
