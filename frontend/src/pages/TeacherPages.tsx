import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, FileSpreadsheet, CheckCircle, XCircle, Clock, Loader2, Users } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

function MyClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/classes').then(r => setClasses(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">My Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">Classes and sections you are assigned to</p>
      </div>
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls: any, i: number) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">{cls.sections?.length || 0} section(s)</p>
                </div>
              </div>
              {cls.sections?.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 border-t border-border mt-2">
                  <Users size={13} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{s.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Cap: {s.capacity}</span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Attendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/classes').then(r => setClasses(r.data)).catch(() => {});
  }, []);

  const sections = classes.flatMap((c: any) => (c.sections || []).map((s: any) => ({ ...s, className: c.name })));

  const loadAttendance = () => {
    if (!selectedSection || !date) return;
    setLoading(true);
    apiClient.get(`/attendance?sectionId=${selectedSection}&date=${date}`)
      .then(r => setRecords(r.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAttendance(); }, [selectedSection, date]);

  const toggleStatus = (idx: number) => {
    setRecords(prev => prev.map((r, i) => i === idx ? {
      ...r,
      status: r.status === 'PRESENT' ? 'ABSENT' : r.status === 'ABSENT' ? 'LATE' : 'PRESENT'
    } : r));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await apiClient.post('/attendance', { sectionId: selectedSection, date, records });
      toast.success('Attendance saved!');
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    PRESENT: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    ABSENT: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    LATE: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Mark daily attendance for your sections</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">-- Select Section --</option>
          {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : !selectedSection ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p>Select a section to mark attendance</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p>No students in this section</p></div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="font-bold text-foreground">{records.length} Students</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-emerald-600 font-semibold">{records.filter(r => r.status === 'PRESENT').length} Present</span>
                <span className="text-red-500 font-semibold">{records.filter(r => r.status === 'ABSENT').length} Absent</span>
                <span className="text-yellow-600 font-semibold">{records.filter(r => r.status === 'LATE').length} Late</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {records.map((r, i) => {
                const cfg = statusConfig[r.status] || statusConfig.PRESENT;
                const StatusIcon = cfg.icon;
                return (
                  <motion.div key={r.studentId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">Roll: {r.rollNo || '—'}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleStatus(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon size={13} />{r.status}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveAttendance} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 transition-all">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Grades() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Grades & Report Cards</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage student grades</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
        <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-semibold">Grade entry is available after exams are created</p>
        <p className="text-sm mt-1">Contact the School Admin to schedule exams</p>
      </div>
    </div>
  );
}

export { MyClasses, Attendance, Grades };
