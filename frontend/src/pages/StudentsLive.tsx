import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileUp, Loader2, Plus, RefreshCw, Search, Trash2, Users, X, ArrowUpRight, ArrowRightLeft, Printer } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const input = 'w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400';

function csvCell(value: unknown) {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function parseCsv(text: string) {
  const rows = text.trim().split(/\r?\n/).map(line => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()));
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
  return rows.slice(1).filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

export default function StudentsLive() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer'>('promote');
  const [targetSection, setTargetSection] = useState('');
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: 'MALE', bFormNumber: '', email: '', phone: '', fatherName: '', fatherMobile1: '', address: '', sectionId: '', session: '2026-2027' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([apiClient.get('/people/students'), apiClient.get('/classes')]);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setClasses(Array.isArray(c.data) ? c.data : []);
      setSelected([]);
    } catch (e: any) {
      setStudents([]); setClasses([]);
      toast.error(e?.response?.data?.message || 'Unable to load live student data');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sections = useMemo(() => classes.flatMap((c: any) => (c.sections || []).map((s: any) => ({ ...s, className: c.name, classId: c.id }))), [classes]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter(s => !q || [s.name, s.admissionNo, s.rollNo, s.section?.name, s.section?.class?.name].some(v => String(v ?? '').toLowerCase().includes(q)));
  }, [students, search]);

  const resetForm = () => setForm({ name: '', dateOfBirth: '', gender: 'MALE', bFormNumber: '', email: '', phone: '', fatherName: '', fatherMobile1: '', address: '', sectionId: '', session: '2026-2027' });

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const next = students.reduce((m, s) => Math.max(m, Number(String(s.admissionNo || '').replace(/\D/g, '')) || 0), 0) + 1;
      await apiClient.post('/people/students', { ...form, studentMobile: form.phone, admissionNo: `STD${String(next).padStart(3, '0')}`, rollNo: '', parentPassword: `Parent${Date.now()}!` });
      toast.success('Student added successfully'); setShowAdd(false); resetForm(); await load();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to add student'); }
    finally { setSaving(false); }
  };

  const removeStudent = async (id: string) => {
    if (!confirm('Archive this student?')) return;
    try { await apiClient.delete(`/people/students/${id}`); toast.success('Student archived'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to archive student'); }
  };

  const moveStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected.length || !targetSection) return toast.warning('Select students and a target section');
    try {
      await apiClient.post(`/people/students/${moveMode}`, { studentIds: selected, sectionId: targetSection, session: moveMode === 'promote' ? '2026-2027' : undefined });
      toast.success(`${selected.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'} successfully`); setShowMove(false); setSelected([]); setTargetSection(''); await load();
    } catch (e: any) { toast.error(e?.response?.data?.message || `Failed to ${moveMode} students`); }
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      const payload = rows.map(r => ({ name: r.name || r.studentname, sectionId: r.sectionid || r.section, fatherName: r.fathername, fatherMobile1: r.fathermobile1 || r.fathermobile || r.fatherphone, address: r.address, email: r.email, studentMobile: r.phone || r.studentmobile, dateOfBirth: r.dateofbirth || r.dob, gender: (r.gender || 'MALE').toUpperCase(), bFormNumber: r.bformnumber || r.cnic, session: r.session || '2026-2027' }));
      if (!payload.length || payload.some(r => !r.name || !r.sectionId || !r.fatherName || !r.fatherMobile1 || !r.address)) throw new Error('CSV must contain name, sectionId, fatherName, fatherMobile1 and address for every row');
      const res = await apiClient.post('/people/students/import', { students: payload });
      toast.success(`${res.data?.created ?? payload.length} student(s) imported`); await load();
    } catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Import failed'); }
    finally { setImporting(false); }
  };

  const exportCsv = () => {
    const rows = [['Admission No', 'Name', 'Class', 'Section', 'Roll No', 'Status', 'Father', 'Father Mobile']];
    students.forEach(s => rows.push([s.admissionNo, s.name, s.section?.class?.name, s.section?.name, s.rollNo, s.status, s.fatherName, s.fatherMobile1]));
    const blob = new Blob([rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'edusphere-students.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast.success('Student CSV exported');
  };

  const print = () => window.print();
  const allSelected = filtered.length > 0 && filtered.every(s => selected.includes(s.id));

  return <div className="space-y-5 p-1">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">People Management</p><h1 className="mt-1 text-2xl font-black text-white">Students</h1><p className="mt-1 text-sm text-slate-400">Live database records — no demo students.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={load} className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5"><RefreshCw size={16}/></button>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><Download size={15}/> Export</button>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"><FileUp size={15}/> {importing ? 'Importing…' : 'Import CSV'}<input type="file" accept=".csv,text/csv" className="hidden" disabled={importing} onChange={e => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.currentTarget.value = ''; }}/></label>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"><Plus size={16}/> Add Student</button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><Users size={17} className="text-cyan-400"/><p className="mt-2 text-2xl font-black text-white">{students.length}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Total Students</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-2xl font-black text-white">{students.filter(s => s.status === 'ACTIVE').length}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Active</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-2xl font-black text-white">{sections.length}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Sections</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-2xl font-black text-white">{selected.length}</p><p className="text-[10px] uppercase tracking-widest text-slate-500">Selected</p></div>
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:flex-row">
      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-500"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission no, class, section or roll no…" className={`${input} pl-9`}/></div>
      {selected.length > 0 && <><button onClick={() => { setMoveMode('promote'); setShowMove(true); }} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><ArrowUpRight size={15}/> Promote</button><button onClick={() => { setMoveMode('transfer'); setShowMove(true); }} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"><ArrowRightLeft size={15}/> Transfer</button><button onClick={print} className="rounded-xl border border-white/10 px-3 text-slate-200"><Printer size={15}/></button></>}
    </div>

    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-widest text-slate-500"><tr><th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(s => s.id))}/></th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Admission</th><th className="px-4 py-3">Class / Section</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-white/5">{loading ? <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-cyan-400"/></td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-sm text-slate-500">No students found in the live database.</td></tr> : filtered.map(s => <tr key={s.id} className="hover:bg-white/[0.025]"><td className="px-4 py-3"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => setSelected(v => v.includes(s.id) ? v.filter(id => id !== s.id) : [...v, s.id])}/></td><td className="px-4 py-3"><div className="font-bold text-white">{s.name}</div><div className="text-xs text-slate-500">{s.email || s.phone || '—'}</div></td><td className="px-4 py-3 font-mono text-xs text-slate-300">{s.admissionNo || '—'}</td><td className="px-4 py-3 text-sm text-slate-300">{s.section?.class?.name || '—'} <span className="text-slate-500">/ {s.section?.name || '—'}</span></td><td className="px-4 py-3 text-sm text-slate-300">{s.rollNo || '—'}</td><td className="px-4 py-3"><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-slate-300">{s.status || 'ACTIVE'}</span></td><td className="px-4 py-3"><button onClick={() => void removeStudent(s.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>
    </div>

    {showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={addStudent} className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-white">Add Student</h2><p className="text-xs text-slate-500">Creates the student and parent records in the database.</p></div><button type="button" onClick={() => setShowAdd(false)} className="text-slate-500"><X/></button></div><div className="grid gap-3 md:grid-cols-2"><input required className={input} placeholder="Student name *" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/><input required type="date" className={input} value={form.dateOfBirth} onChange={e => setForm({...form,dateOfBirth:e.target.value})}/><select className={input} value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select><select required className={input} value={form.sectionId} onChange={e => setForm({...form,sectionId:e.target.value})}><option value="">Select class / section *</option>{sections.map(s => <option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}</select><input className={input} placeholder="B-Form / CNIC" value={form.bFormNumber} onChange={e => setForm({...form,bFormNumber:e.target.value})}/><input className={input} placeholder="Student email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/><input className={input} placeholder="Student mobile" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/><input required className={input} placeholder="Father name *" value={form.fatherName} onChange={e => setForm({...form,fatherName:e.target.value})}/><input required className={input} placeholder="Father mobile *" value={form.fatherMobile1} onChange={e => setForm({...form,fatherMobile1:e.target.value})}/><input required className={`${input} md:col-span-2`} placeholder="Address *" value={form.address} onChange={e => setForm({...form,address:e.target.value})}/></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950">{saving && <Loader2 size={15} className="animate-spin"/>}Save Student</button></div></form></div>}

    {showMove && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={moveStudents} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-white">{moveMode === 'promote' ? 'Promote' : 'Transfer'} Students</h2><p className="text-xs text-slate-500">{selected.length} selected</p></div><button type="button" onClick={() => setShowMove(false)} className="text-slate-500"><X/></button></div><select required className={input} value={targetSection} onChange={e => setTargetSection(e.target.value)}><option value="">Select target class / section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}</select><button className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-bold text-slate-950">Confirm</button></form></div>}
  </div>;
}
