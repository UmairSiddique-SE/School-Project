import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileUp, Loader2, Plus, RefreshCw, Search, Trash2, Users, X, ArrowUpRight, ArrowRightLeft, Printer, GraduationCap, UserCheck, BookOpen, CheckSquare } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const input = 'w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder:text-muted-foreground transition-all';

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

  return <div className="space-y-6 p-1">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400">People Management</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black text-foreground tracking-tight">Students</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Live database records — registered campus students.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={load} title="Refresh student records" className="p-2.5 rounded-xl border border-border bg-card/70 text-foreground hover:bg-accent transition-all shadow-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-500' : ''}/>
        </button>
        <button onClick={exportCsv} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card/70 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm">
          <Download size={14} className="text-emerald-500"/>
          <span>Export CSV</span>
        </button>
        <label className="flex cursor-pointer items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card/70 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm">
          <FileUp size={14} className="text-violet-500"/>
          <span>{importing ? 'Importing…' : 'Import CSV'}</span>
          <input type="file" accept=".csv,text/csv" className="hidden" disabled={importing} onChange={e => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.currentTarget.value = ''; }}/>
        </label>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 text-xs font-black text-white transition-all shadow-lg shadow-cyan-500/20 cursor-pointer">
          <Plus size={16}/>
          <span>Add Student</span>
        </button>
      </div>
    </div>

    {/* Rich & Vibrant Stat KPI Cards */}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* 1. Total Students */}
      <div className="group relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] via-card/70 to-card p-5 shadow-lg shadow-cyan-500/[0.04] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-500/15 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Total Students</span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">{students.length}</h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <GraduationCap size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>Enrolled in campus</span>
        </div>
      </div>

      {/* 2. Active Students */}
      <div className="group relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-card/70 to-card p-5 shadow-lg shadow-emerald-500/[0.04] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active</span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {students.filter(s => s.status === 'ACTIVE').length}
            </h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <UserCheck size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Active attendance & study</span>
        </div>
      </div>

      {/* 3. Sections / Classes */}
      <div className="group relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] via-card/70 to-card p-5 shadow-lg shadow-violet-500/[0.04] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Sections</span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">{sections.length}</h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <span>Across {classes.length} class grades</span>
        </div>
      </div>

      {/* 4. Selected */}
      <div className="group relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-card/70 to-card p-5 shadow-lg shadow-amber-500/[0.04] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/15 blur-2xl transition-all duration-500 group-hover:scale-150" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Selected</span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">{selected.length}</h3>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <CheckSquare size={22} strokeWidth={2.2} />
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>{selected.length > 0 ? 'Batch actions ready' : 'Select for batch action'}</span>
        </div>
      </div>
    </div>

    {/* Search & Actions Bar */}
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission no, class, section or roll no…" className={`${input} pl-10`}/>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setMoveMode('promote'); setShowMove(true); }} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm">
            <ArrowUpRight size={15} className="text-emerald-500"/> Promote
          </button>
          <button onClick={() => { setMoveMode('transfer'); setShowMove(true); }} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm">
            <ArrowRightLeft size={15} className="text-cyan-500"/> Transfer
          </button>
          <button onClick={print} title="Print student roster" className="rounded-xl border border-border bg-card/70 p-2.5 text-foreground hover:bg-accent transition-all shadow-sm">
            <Printer size={15}/>
          </button>
        </div>
      )}
    </div>

    {/* Table */}
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-5 py-4"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(s => s.id))} className="rounded accent-primary"/></th>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Admission</th>
              <th className="px-5 py-4">Class / Section</th>
              <th className="px-5 py-4">Roll</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-16 text-center"><Loader2 className="mx-auto animate-spin text-primary" size={32}/><p className="mt-2 text-xs font-semibold text-muted-foreground">Loading student records…</p></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-16 text-center text-sm font-semibold text-muted-foreground">No students found in the live database.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-4"><input type="checkbox" checked={selected.includes(s.id)} onChange={() => setSelected(v => v.includes(s.id) ? v.filter(id => id !== s.id) : [...v, s.id])} className="rounded accent-primary"/></td>
                <td className="px-5 py-4">
                  <div className="font-bold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.email || s.phone || '—'}</div>
                </td>
                <td className="px-5 py-4 font-mono text-xs font-semibold text-foreground/80">{s.admissionNo || '—'}</td>
                <td className="px-5 py-4 text-sm font-medium text-foreground">
                  {s.section?.class?.name || '—'} <span className="text-muted-foreground">/ {s.section?.name || '—'}</span>
                </td>
                <td className="px-5 py-4 text-sm font-mono text-foreground/80">{s.rollNo || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${s.status === 'ACTIVE' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                    {s.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => void removeStudent(s.id)} title="Delete student record" className="rounded-xl p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Proper Add Student Modal */}
    {showAdd && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <form onSubmit={addStudent} className="w-full max-w-3xl rounded-[32px] border border-border bg-card shadow-2xl overflow-hidden my-8 animate-fade-in">
          {/* Proper, Stunning Modal Header */}
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-cyan-500/15 via-card/80 to-card p-6 sm:p-7">
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-md">
                  <GraduationCap size={28} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      New Student Admission
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold">Session 2026-2027</span>
                  </div>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-black text-foreground tracking-tight">Add New Student</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Register student record, classroom section, and parent/guardian contact details.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-2xl border border-border bg-card/60 p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Section 1: Academic & Personal Info */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">1. Student Information</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Student Full Name *</label>
                  <input required className={input} placeholder="e.g. Muhammad Ali" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Date of Birth *</label>
                  <input required type="date" className={input} value={form.dateOfBirth} onChange={e => setForm({...form,dateOfBirth:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Gender *</label>
                  <select className={input} value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Class / Section Assignment *</label>
                  <select required className={input} value={form.sectionId} onChange={e => setForm({...form,sectionId:e.target.value})}>
                    <option value="">Select class / section *</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">B-Form / CNIC (Optional)</label>
                  <input className={input} placeholder="35201-xxxxxxx-x" value={form.bFormNumber} onChange={e => setForm({...form,bFormNumber:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Student Email (Optional)</label>
                  <input className={input} placeholder="student@school.edu" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/>
                </div>
              </div>
            </div>

            {/* Section 2: Parent / Guardian Info */}
            <div className="space-y-3 pt-3 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">2. Guardian & Contact Details</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Father / Guardian Name *</label>
                  <input required className={input} placeholder="e.g. Tariq Mehmood" value={form.fatherName} onChange={e => setForm({...form,fatherName:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Guardian Mobile Number *</label>
                  <input required className={input} placeholder="0300-1234567" value={form.fatherMobile1} onChange={e => setForm({...form,fatherMobile1:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Student Mobile (Optional)</label>
                  <input className={input} placeholder="0300-xxxxxxx" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Residential Address *</label>
                  <input required className={input} placeholder="House / Street, Area, City" value={form.address} onChange={e => setForm({...form,address:e.target.value})}/>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 p-5 sm:px-7">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-2xl border border-border bg-card/80 px-5 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-all"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin"/>}
              Save Student Admission
            </button>
          </div>
        </form>
      </div>
    )}

    {/* Proper Move / Promote Modal */}
    {showMove && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <form onSubmit={moveStudents} className="w-full max-w-md rounded-[32px] border border-border bg-card shadow-2xl overflow-hidden animate-fade-in">
          <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-cyan-500/15 via-card/80 to-card p-6">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-sm">
                  {moveMode === 'promote' ? <ArrowUpRight size={20} /> : <ArrowRightLeft size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">{moveMode === 'promote' ? 'Promote' : 'Transfer'} Students</h2>
                  <p className="text-xs text-muted-foreground font-medium">{selected.length} students selected for batch action</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowMove(false)} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground mb-1.5">Select Destination Class / Section *</label>
              <select required className={input} value={targetSection} onChange={e => setTargetSection(e.target.value)}>
                <option value="">Select target class / section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}
              </select>
            </div>
            <button className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all">
              Confirm {moveMode === 'promote' ? 'Promotion' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    )}
  </div>;
}
