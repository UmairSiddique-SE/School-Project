import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ArrowUpRight, Download, FileUp, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2, UserRound, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = any;
type Section = any;

const baseInput = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-violet-500';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const emptyForm = () => ({
  name: '', dateOfBirth: '', gender: 'MALE', bFormNumber: '', email: '', phone: '', fatherName: '', fatherMobile1: '', fatherWhatsapp: '', address: '', sectionId: '', session: currentSession,
});

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [] as Record<string, string>[];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.trim().replace(/^"|"$/g, '').replace(/""/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? '']));
  }).filter((row) => Object.values(row).some(Boolean));
}

export default function StudentsPremium() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [profile, setProfile] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [lastCredentials, setLastCredentials] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [studentRes, classRes] = await Promise.all([apiClient.get('/people/students'), apiClient.get('/classes')]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSelected([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load live student records');
      setStudents([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sections = useMemo<Section[]>(() => classes.flatMap((item) => (item.sections || []).map((section: any) => ({ ...section, className: item.name, classId: item.id }))), [classes]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => [student.name, student.admissionNo, student.rollNo, student.email, student.phone, student.section?.name, student.section?.class?.name].some((value) => String(value ?? '').toLowerCase().includes(query)));
  }, [students, search]);
  const activeCount = students.filter((student) => String(student.status || 'ACTIVE') === 'ACTIVE').length;
  const sectionCount = new Set(students.map((student) => student.sectionId).filter(Boolean)).size;
  const allSelected = filtered.length > 0 && filtered.every((student) => selected.includes(student.id));

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setLastCredentials(null); setFormOpen(true); };
  const openEdit = (student: Student) => {
    setEditing(student);
    setLastCredentials(null);
    setForm({
      name: student.name || '', dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '', gender: student.gender || 'MALE', bFormNumber: student.bFormNumber || '', email: student.email || '', phone: student.phone || '', fatherName: student.fatherName || '', fatherMobile1: student.fatherMobile1 || '', fatherWhatsapp: student.fatherWhatsapp || '', address: student.address || '', sectionId: student.sectionId || '', session: student.session || currentSession,
    });
    setFormOpen(true);
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form, phone: form.phone || undefined };
        delete (payload as any).email;
        await apiClient.patch(`/people/students/${editing.id}`, payload);
        toast.success('Student profile updated');
      } else {
        const passwordSeed = `${form.name.replace(/\s+/g, '').slice(0, 5)}${Math.random().toString(36).slice(2, 8)}!9a`;
        const response = await apiClient.post('/people/students', { ...form, studentMobile: form.phone || undefined, admissionType: 'NEW', parentPassword: passwordSeed });
        setLastCredentials(response.data?.credentials || null);
        toast.success('Student admitted successfully');
      }
      await load();
      if (editing) setFormOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to save student');
    } finally {
      setSaving(false);
    }
  };

  const archiveStudent = async (id: string) => {
    if (!window.confirm('Archive this student? Their school records will remain stored.')) return;
    try {
      await apiClient.delete(`/people/students/${id}`);
      toast.success('Student archived');
      setProfile(null);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive student');
    }
  };

  const moveStudents = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moveMode || !targetSection || !selected.length) return;
    try {
      await apiClient.post(`/people/students/${moveMode}`, {
        studentIds: selected,
        sectionId: targetSection,
        ...(moveMode === 'promote' ? { session: currentSession } : {}),
      });
      toast.success(`${selected.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'}`);
      setMoveMode(null);
      setTargetSection('');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Unable to ${moveMode} students`);
    }
  };

  const exportCsv = () => {
    const header = ['Admission No', 'Name', 'Class', 'Section', 'Roll No', 'Status', 'Father Name', 'Father Mobile'];
    const rows = students.map((student) => [student.admissionNo, student.name, student.section?.class?.name, student.section?.name, student.rollNo, student.status, student.fatherName, student.fatherMobile1]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'edusphere-students.csv'; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Student CSV exported');
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    let created = 0;
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error('CSV contains no student rows');
      for (const row of rows) {
        if (!row.name || !row.sectionid) throw new Error('Each row needs name and sectionId');
        const parentPassword = `${row.name.replace(/\s+/g, '').slice(0, 5)}${Math.random().toString(36).slice(2, 8)}!9a`;
        await apiClient.post('/people/students', {
          name: row.name,
          sectionId: row.sectionid,
          fatherName: row.fathername || undefined,
          fatherMobile1: row.fathermobile1 || row.fathermobile || row.fatherphone || undefined,
          address: row.address || undefined,
          email: row.email || undefined,
          studentMobile: row.studentmobile || row.phone || undefined,
          dateOfBirth: row.dateofbirth || row.dob || undefined,
          gender: String(row.gender || 'MALE').toUpperCase(),
          bFormNumber: row.bformnumber || row.cnic || undefined,
          session: row.session || currentSession,
          admissionType: row.admissiontype === 'TRANSFER' ? 'TRANSFER' : 'NEW',
          parentPassword,
        });
        created += 1;
      }
      toast.success(`${created} student(s) imported into the live database`);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || `Import stopped after ${created} record(s)`);
      if (created) await load();
    } finally {
      setImporting(false);
    }
  };

  const printStudentId = (student: Student) => {
    const popup = window.open('', '_blank', 'width=520,height=720');
    if (!popup) return toast.error('Please allow popups to print the student ID card');
    popup.document.write(`<!doctype html><html><head><title>${student.name} - Student ID</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;padding:28px}.card{max-width:420px;margin:auto;border:1px solid #dbe3ee;border-radius:22px;overflow:hidden;background:white;box-shadow:0 12px 35px rgba(15,23,42,.12)}.head{padding:22px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white}.body{padding:22px}.label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.14em;margin-top:14px}.value{font-weight:700;color:#0f172a;margin-top:3px}</style></head><body><div class='card'><div class='head'><div style='font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.8'>EduSphere Student ID</div><h1 style='margin:8px 0 0;font-size:24px'>${student.name}</h1></div><div class='body'><div class='label'>Admission No</div><div class='value'>${student.admissionNo || '—'}</div><div class='label'>Class / Section</div><div class='value'>${student.section?.class?.name || '—'} / ${student.section?.name || '—'}</div><div class='label'>Roll No</div><div class='value'>${student.rollNo || '—'}</div><div class='label'>Session</div><div class='value'>${student.session || currentSession}</div><div class='label'>Status</div><div class='value'>${student.status || 'ACTIVE'}</div></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">People Management</p><h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Students</h1><p className="mt-1 text-sm text-muted-foreground">Live school records, admission, profile management and academic movement.</p></div>
        <div className="flex flex-wrap gap-2">
          <button className={button} onClick={() => void load()} title="Refresh"><RefreshCw size={15} /></button>
          <button className={button} onClick={exportCsv}><Download size={15} /> Export</button>
          <label className={`${button} cursor-pointer`}><FileUp size={15} /> {importing ? 'Importing…' : 'Import CSV'}<input type="file" accept=".csv,text/csv" disabled={importing} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.currentTarget.value = ''; }} /></label>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500" onClick={openCreate}><Plus size={16} /> Add Student</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Users size={18} />} label="Total Students" value={students.length} tone="violet" />
        <StatCard icon={<UserRound size={18} />} label="Active" value={activeCount} tone="emerald" />
        <StatCard icon={<Users size={18} />} label="Used Sections" value={sectionCount} tone="blue" />
        <StatCard icon={<ArrowUpRight size={18} />} label="Selected" value={selected.length} tone="amber" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input className={`${baseInput} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, admission no, roll no, class, section or contact…" /></div>
          {selected.length > 0 && <div className="flex flex-wrap gap-2"><button className={button} onClick={() => setMoveMode('promote')}><ArrowUpRight size={15} /> Promote</button><button className={button} onClick={() => setMoveMode('transfer')}><ArrowRightLeft size={15} /> Transfer</button><button className={button} onClick={() => filtered.filter((s) => selected.includes(s.id)).forEach((s) => printStudentId(s))}><Printer size={15} /> Print ID</button></div>}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left"><thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><tr><th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map((s) => s.id))} /></th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Admission</th><th className="px-4 py-3">Class / Section</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={7} className="p-14 text-center"><Loader2 className="mx-auto animate-spin text-violet-500" /></td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-14 text-center"><Users size={30} className="mx-auto text-muted-foreground/40" /><p className="mt-3 text-sm font-semibold text-muted-foreground">No students found in the live database.</p><p className="mt-1 text-xs text-muted-foreground/70">Add the first student or adjust your search.</p></td></tr> : filtered.map((student) => <tr key={student.id} className="hover:bg-muted/30">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(student.id)} onChange={() => setSelected((current) => current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])} /></td>
                <td className="px-4 py-3"><button className="text-left" onClick={() => setProfile(student)}><p className="font-bold text-foreground hover:text-violet-500">{student.name}</p><p className="text-xs text-muted-foreground">{student.email || student.phone || 'No contact'}</p></button></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{student.admissionNo || '—'}</td>
                <td className="px-4 py-3 text-sm text-foreground">{student.section?.class?.name || '—'} <span className="text-muted-foreground">/ {student.section?.name || '—'}</span></td>
                <td className="px-4 py-3 text-sm font-semibold text-muted-foreground">{student.rollNo || '—'}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{student.status || 'ACTIVE'}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-violet-500" title="View profile" onClick={() => setProfile(student)}><UserRound size={15} /></button><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-violet-500" title="Edit" onClick={() => openEdit(student)}><Pencil size={15} /></button><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-rose-500" title="Archive" onClick={() => void archiveStudent(student.id)}><Trash2 size={15} /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && <Modal title={editing ? 'Edit Student' : 'Add Student'} onClose={() => setFormOpen(false)}>
        <form onSubmit={saveStudent} className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Student Name" required><input required className={baseInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Date of Birth"><input type="date" className={baseInput} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
            <Field label="Gender"><select className={baseInput} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></Field>
            <Field label="B-Form / CNIC"><input className={baseInput} placeholder="35202-1234567-1" value={form.bFormNumber} onChange={(e) => setForm({ ...form, bFormNumber: e.target.value })} /></Field>
            <Field label="Student Email"><input type="email" className={baseInput} value={form.email} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Mobile"><input className={baseInput} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Class / Section" required><select required className={baseInput} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}><option value="">Select section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.className} / {section.name}</option>)}</select></Field>
            <Field label="Session"><input className={baseInput} value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} /></Field>
            <Field label="Father Name"><input className={baseInput} value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></Field>
            <Field label="Father Mobile"><input className={baseInput} value={form.fatherMobile1} onChange={(e) => setForm({ ...form, fatherMobile1: e.target.value })} /></Field>
            <Field label="Father WhatsApp"><input className={baseInput} value={form.fatherWhatsapp} onChange={(e) => setForm({ ...form, fatherWhatsapp: e.target.value })} /></Field>
            <Field label="Address"><input className={baseInput} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </div>
          {!editing && <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-muted-foreground">Admission No and Roll No are generated by the server. A secure student password and parent account password are created during admission.</p>}
          {lastCredentials && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Student login created</p><p className="mt-2 text-sm">Login: <strong>{lastCredentials.loginId}</strong></p><p className="text-sm">Password: <strong>{lastCredentials.password}</strong></p></div>}
          <div className="flex justify-end gap-2"><button type="button" className={button} onClick={() => setFormOpen(false)}>Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin" />}{editing ? 'Save Changes' : 'Create Student'}</button></div>
        </form>
      </Modal>}

      {moveMode && <Modal title={`${moveMode === 'promote' ? 'Promote' : 'Transfer'} Students`} onClose={() => setMoveMode(null)}><form onSubmit={moveStudents} className="space-y-4"><p className="text-sm text-muted-foreground">Move {selected.length} selected student(s) to a verified section in this school.</p><select required className={baseInput} value={targetSection} onChange={(e) => setTargetSection(e.target.value)}><option value="">Select target section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.className} / {section.name}</option>)}</select><div className="flex justify-end gap-2"><button type="button" className={button} onClick={() => setMoveMode(null)}>Cancel</button><button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">Confirm</button></div></form></Modal>}

      {profile && <Modal title="Student Profile" onClose={() => setProfile(null)}><div className="space-y-5"><div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-lg font-black text-white">{String(profile.name || 'S').charAt(0)}</div><div className="min-w-0"><h2 className="font-black text-lg">{profile.name}</h2><p className="text-xs text-muted-foreground">{profile.admissionNo || 'No admission no.'} · {profile.status || 'ACTIVE'}</p></div></div><div className="grid gap-3 sm:grid-cols-2"><Info label="Class / Section" value={`${profile.section?.class?.name || '—'} / ${profile.section?.name || '—'}`} /><Info label="Roll No" value={profile.rollNo || '—'} /><Info label="Session" value={profile.session || '—'} /><Info label="Gender" value={profile.gender || '—'} /><Info label="DOB" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'} /><Info label="B-Form / CNIC" value={profile.bFormNumber || '—'} /><Info label="Mobile" value={profile.phone || '—'} /><Info label="Father" value={profile.fatherName || '—'} /><Info label="Father Mobile" value={profile.fatherMobile1 || '—'} /><Info label="Address" value={profile.address || '—'} /></div><div className="flex flex-wrap justify-end gap-2"><button className={button} onClick={() => printStudentId(profile)}><Printer size={15} /> Print ID</button><button className={button} onClick={() => { setProfile(null); openEdit(profile); }}><Pencil size={15} /> Edit</button><button className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white" onClick={() => void archiveStudent(profile.id)}><Trash2 size={15} /> Archive</button></div></div></Modal>}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  const toneClass: Record<string, string> = { violet: 'text-violet-500', emerald: 'text-emerald-500', blue: 'text-cyan-500', amber: 'text-amber-500' };
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className={toneClass[tone] || 'text-violet-500'}>{icon}</div><p className="mt-2 text-2xl font-black text-foreground">{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p></div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4"><h2 className="font-black text-foreground">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="p-6">{children}</div></div></div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}{required ? ' *' : ''}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/30 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground break-words">{value}</p></div>; }
