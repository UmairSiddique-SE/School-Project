import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Save, Users } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Section = { id: string; name: string; class?: { name: string } };
type RecordItem = { studentId: string; name: string; rollNo?: string | null; admissionNo?: string; status: string; remarks?: string };

const statuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export default function Attendance() {
  const { user } = useAuth();
  const canMark = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSections = async () => {
    try {
      const res = await apiClient.get('/classes');
      const list: Section[] = [];
      (Array.isArray(res.data) ? res.data : []).forEach((c: any) => (c.sections || []).forEach((s: any) => list.push({ ...s, class: { name: c.name } })));
      setSections(list); if (!sectionId && list[0]) setSectionId(list[0].id);
    } catch (e: any) { setError(e?.response?.data?.message || 'Unable to load sections.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadSections(); }, []);

  const loadAttendance = async () => {
    if (!sectionId) { setRecords([]); return; }
    setLoadingRecords(true); setError('');
    try { const res = await apiClient.get(`/attendance/section/${sectionId}`, { params: { date } }); setRecords(Array.isArray(res.data) ? res.data : []); }
    catch (e: any) { setRecords([]); setError(e?.response?.data?.message || 'Unable to load attendance.'); }
    finally { setLoadingRecords(false); }
  };
  useEffect(() => { loadAttendance(); }, [sectionId, date]);

  const counts = useMemo(() => records.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {} as Record<string, number>), [records]);
  const updateStatus = (studentId: string, status: string) => setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  const markAll = (status: string) => setRecords(prev => prev.map(r => ({ ...r, status })));
  const save = async () => {
    if (!sectionId || !records.length) return;
    setSaving(true);
    try { await apiClient.post('/attendance/mark', { sectionId, date, records: records.map(r => ({ studentId: r.studentId, status: r.status, remarks: r.remarks || undefined })) }); toast.success('Attendance saved'); await loadAttendance(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save attendance'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div>;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Attendance</h1><p className="text-sm text-muted-foreground">Mark attendance from live student records.</p></div>
    <div className="rounded-xl border p-4 grid md:grid-cols-3 gap-4"><label className="text-sm">Class / Section<select className="mt-1 w-full rounded-lg border p-3 bg-background" value={sectionId} onChange={e => setSectionId(e.target.value)}><option value="">Select section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} / {s.name}</option>)}</select></label><label className="text-sm">Date<input type="date" className="mt-1 w-full rounded-lg border p-3 bg-background" value={date} onChange={e => setDate(e.target.value)}/></label><div className="flex items-end gap-2"><button onClick={() => markAll('PRESENT')} disabled={!records.length} className="px-3 py-2 rounded-lg border">All Present</button>{canMark && <button onClick={save} disabled={saving || !records.length} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2"><Save size={16}/>{saving ? 'Saving...' : 'Save'}</button>}</div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{statuses.map(s => <div key={s} className="rounded-xl border p-3"><div className="text-xl font-bold">{counts[s] || 0}</div><div className="text-xs text-muted-foreground">{s}</div></div>)}</div>
    {error && <div className="rounded-lg border border-destructive/30 p-4 text-destructive">{error}</div>}
    {loadingRecords ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin"/></div> : records.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground"><Users className="mx-auto mb-2"/>No students in this section.</div> : <div className="rounded-xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Roll</th><th className="p-3">Admission</th><th className="p-3">Student</th><th className="p-3">Status</th></tr></thead><tbody>{records.map(r => <tr key={r.studentId} className="border-b last:border-0"><td className="p-3">{r.rollNo || '—'}</td><td className="p-3">{r.admissionNo || '—'}</td><td className="p-3 font-medium">{r.name}</td><td className="p-3">{canMark ? <select className="rounded-lg border p-2 bg-background" value={r.status} onChange={e => updateStatus(r.studentId, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select> : <span className="inline-flex items-center gap-1"><Check size={14}/>{r.status}</span>}</td></tr>)}</tbody></table></div>}
  </div>;
}
