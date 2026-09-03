import React, { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle, Clock, Loader2, Save, Users, X, BookOpen } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Section = { id: string; name: string; classId: string; className?: string; students?: any[] };
type AttendanceRow = { studentId: string; name: string; rollNo?: string; status: string; remarks?: string };

export default function TeacherPortal() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'classes' | 'attendance'>('classes');

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/classes');
      const data = Array.isArray(res.data) ? res.data : [];
      setClasses(data);
      const mapped: Section[] = data.flatMap((c: any) =>
        (Array.isArray(c.sections) ? c.sections : []).map((s: any) => ({
          id: s.id,
          name: s.name,
          classId: c.id,
          className: c.name,
          students: s.students,
        }))
      );
      setSections(mapped);
      if (!selectedSection && mapped[0]) setSelectedSection(mapped[0].id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load assigned classes');
      setClasses([]);
      setSections([]);
    } finally { setLoading(false); }
  };

  const loadAttendance = async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/attendance', { params: { sectionId: selectedSection, date } });
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setRecords([]);
      toast.error(err?.response?.data?.message || 'Unable to load attendance');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { if (tab === 'attendance') loadAttendance(); }, [tab, selectedSection, date]);

  const selected = sections.find(s => s.id === selectedSection);
  const counts = useMemo(() => ({
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    leave: records.filter(r => r.status === 'LEAVE').length,
  }), [records]);

  const cycle = (index: number) => {
    const order = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];
    setRecords(prev => prev.map((r, i) => i === index ? { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] } : r));
  };

  const save = async () => {
    if (!selectedSection || !records.length) return;
    setSaving(true);
    try {
      await apiClient.post('/attendance', { sectionId: selectedSection, date, records });
      toast.success('Attendance saved. Admin will see the same records.');
      await loadAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Attendance could not be saved');
    } finally { setSaving(false); }
  };

  if (loading && !classes.length && !records.length) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Teacher Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Your assigned classes and attendance. All saved data is shared with the school admin.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setTab('classes')} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${tab === 'classes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>My Classes</button>
        <button onClick={() => setTab('attendance')} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${tab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Attendance</button>
      </div>

      {tab === 'classes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.length === 0 ? <div className="md:col-span-2 rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No classes are assigned to this teacher yet.</div> : classes.map((c: any) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3"><BookOpen className="text-primary" size={22} /><div><h2 className="font-bold">{c.name}</h2><p className="text-xs text-muted-foreground">{(c.sections || []).length} section(s)</p></div></div>
              <div className="mt-4 space-y-2">
                {(c.sections || []).map((s: any) => <button key={s.id} onClick={() => { setSelectedSection(s.id); setTab('attendance'); }} className="w-full flex items-center justify-between rounded-xl border border-border p-3 hover:bg-accent text-left"><span className="text-sm font-semibold">{s.name}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={13} /> {s.students?.length ?? 0}</span></button>)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
              <option value="">Select section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.className} — {s.name}</option>)}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm" />
          </div>

          {!selectedSection ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No section selected.</div> : loading ? <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : (
            <>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold"><div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">{counts.present}<br />Present</div><div className="rounded-xl bg-rose-500/10 p-3 text-rose-600">{counts.absent}<br />Absent</div><div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">{counts.late}<br />Late</div><div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">{counts.leave}<br />Leave</div></div>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {records.length === 0 ? <div className="p-10 text-center text-muted-foreground">No students found in this section.</div> : records.map((r, i) => {
                  const cls = r.status === 'PRESENT' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : r.status === 'ABSENT' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : r.status === 'LATE' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 'text-blue-600 bg-blue-500/10 border-blue-500/20';
                  return <div key={r.studentId} className="flex items-center justify-between gap-3 p-4 border-b border-border last:border-0"><div className="flex items-center gap-3 min-w-0"><div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">{String(r.name || '?')[0]}</div><div className="min-w-0"><p className="font-semibold text-sm truncate">{r.name}</p><p className="text-xs text-muted-foreground">Roll No: {r.rollNo || '-'}</p></div></div><button onClick={() => cycle(i)} className={`px-3 py-2 rounded-lg border text-xs font-black ${cls}`}>{r.status === 'PRESENT' ? <CheckCircle size={14} className="inline mr-1" /> : r.status === 'ABSENT' ? <X size={14} className="inline mr-1" /> : <Clock size={14} className="inline mr-1" />}{r.status}</button></div>;
                })}
              </div>
              <div className="flex justify-end"><button onClick={save} disabled={saving || !records.length} className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-50"><Save size={16} />{saving ? 'Saving...' : 'Save Attendance'}</button></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
