import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ArrowUpRight, Camera, Download, FileUp, Loader2, Pencil, Plus, Printer, RefreshCw, Trash2, UserRound, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = any;
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity?: number; teacher?: Teacher | null; className: string; classId: string };
type FacilityAvailability = { transport: boolean; hostel: boolean };

type FormState = {
  name: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  bFormNumber: string;
  email: string;
  phone: string;
  admissionType: 'NEW' | 'TRANSFER';
  sectionId: string;
  session: string;
  previousSchool: string;
  previousClass: string;
  leavingCertificateUrl: string;
  previousAcademicRecord: string;
  fatherName: string;
  fatherStatus: 'ALIVE' | 'DECEASED';
  fatherMobile1: string;
  fatherWhatsapp: string;
  fatherCnic: string;
  fatherOccupation: string;
  motherName: string;
  motherMobile: string;
  motherOccupation: string;
  guardianName: string;
  guardianRelation: string;
  guardianMobile: string;
  currentAddress: string;
  permanentAddress: string;
  transportRequired: boolean;
  hostelRequired: boolean;
  avatarUrl: string;
};

const input = 'w-full rounded-2xl border border-border/70 bg-background/80 px-3.5 py-3 text-sm text-foreground outline-none shadow-sm transition placeholder:text-muted-foreground/60 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110 disabled:opacity-60';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const religions = ['Muslim', 'Christian', 'Hindu', 'Sikh', 'Buddhist', 'Other'];
const guardianRelations = ['UNCLE', 'AUNT', 'GRANDPARENT', 'SIBLING', 'OTHER'];
const fatherOccupations = ['Business', 'Government Job', 'Private Job', 'Self Employed', 'Farmer', 'Overseas', 'Driver', 'Shopkeeper', 'Labour', 'Doctor', 'Engineer', 'Teacher', 'Other'];
const motherOccupations = ['Housewife', 'Government Job', 'Private Job', 'Business', 'Self Employed', 'Teacher', 'Doctor', 'Engineer', 'Other'];

const emptyForm = (): FormState => ({
  name: '', dateOfBirth: '', gender: 'MALE', religion: 'Muslim', bFormNumber: '', email: '', phone: '',
  admissionType: 'NEW', sectionId: '', session: currentSession,
  previousSchool: '', previousClass: '', leavingCertificateUrl: '', previousAcademicRecord: '',
  fatherName: '', fatherStatus: 'ALIVE', fatherMobile1: '', fatherWhatsapp: '', fatherCnic: '', fatherOccupation: '',
  motherName: '', motherMobile: '', motherOccupation: '',
  guardianName: '', guardianRelation: '', guardianMobile: '',
  currentAddress: '', permanentAddress: '',
  transportRequired: false, hostelRequired: false, avatarUrl: '',
});

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

function formatCnic(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function phoneValid(value: string) { return !value || /^\d{4}-\d{7}$/.test(value); }
function cnicValid(value: string) { return !value || /^\d{5}-\d{7}-\d$/.test(value); }

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [] as Record<string, string>[];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:[^\\"]*\\"[^\\"]*\\")*[^\\"]*$)/).map((v) => v.trim().replace(/^"|"$/g, '').replace(/""/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? '']));
  }).filter((row) => Object.values(row).some(Boolean));
}

async function compressPhoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file');
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read image')); };
    image.src = url;
  });
  const maxSide = 320;
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image compression is unavailable');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  let smallest = '';
  for (const quality of [0.72, 0.62, 0.52, 0.44, 0.36, 0.3, 0.24]) {
    const data = canvas.toDataURL('image/webp', quality);
    smallest = data;
    const bytes = Math.ceil((data.length * 3) / 4);
    if (bytes <= 20 * 1024) return data;
  }
  return smallest;
}

export default function StudentsFull() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<FacilityAvailability>({ transport: false, hostel: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [profile, setProfile] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [credentials, setCredentials] = useState<any>(null);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const facilityPromise = apiClient.get('/people/student-facilities').catch(() => ({ data: {} }));
      const [studentRes, classRes, facilityRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes'),
        facilityPromise,
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setFacilities({ transport: facilityRes.data?.transport === true, hostel: facilityRes.data?.hostel === true });
      setSelectedIds([]);
    } catch (error: any) {
      setStudents([]); setClasses([]);
      toast.error(error?.response?.data?.message || 'Unable to load live student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sections = useMemo<Section[]>(() => classes.flatMap((item) => (item.sections || []).map((section: any) => ({ ...section, className: item.name, classId: item.id }))), [classes]);
  const selectedSection = sections.find((section) => section.id === form.sectionId) || null;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => [student.name, student.admissionNo, student.rollNo, student.email, student.phone, student.religion, student.admissionType, student.previousSchool, student.section?.name, student.section?.class?.name, student.fatherName, student.fatherMobile1].some((value) => String(value ?? '').toLowerCase().includes(query)));
  }, [students, search]);

  const activeCount = students.filter((student) => String(student.status || 'ACTIVE') === 'ACTIVE').length;
  const transferCount = students.filter((student) => student.admissionType === 'TRANSFER').length;
  const allSelected = filtered.length > 0 && filtered.every((student) => selectedIds.includes(student.id));
  const update = (key: keyof FormState, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm()); setCredentials(null); setFormOpen(true); };
  const openEdit = (student: Student) => {
    setEditing(student); setCredentials(null);
    setForm({
      ...emptyForm(),
      ...student,
      phone: formatPhone(student.phone || ''),
      bFormNumber: formatCnic(student.bFormNumber || ''),
      avatarUrl: student.avatarUrl || '',
      sectionId: student.sectionId || '',
      session: student.session || currentSession,
      admissionType: student.admissionType === 'TRANSFER' ? 'TRANSFER' : 'NEW',
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
    });
    setFormOpen(true);
  };
  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setCompressing(true);
    try { update('avatarUrl', await compressPhoto(file)); toast.success('Student photo prepared'); } catch (error: any) { toast.error(error?.message || 'Unable to process photo'); } finally { setCompressing(false); }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.sectionId) return toast.error('Student name and Class / Section are required');
    if (form.admissionType === 'TRANSFER' && (!form.previousSchool.trim() || !form.previousClass.trim())) return toast.error('Previous School and Previous Class are required for transfer students');
    if (!cnicValid(form.bFormNumber) || (form.bFormNumber && form.bFormNumber.replace(/\D/g, '').length !== 13)) return toast.error('Student CNIC / B-Form must contain exactly 13 digits: 35202-1234567-1');
    for (const [label, value] of [['Student Mobile', form.phone], ['Father Mobile', form.fatherMobile1], ['Father WhatsApp', form.fatherWhatsapp], ['Mother Mobile', form.motherMobile], ['Guardian Mobile', form.guardianMobile]] as const) {
      if (!phoneValid(value) || (value && value.replace(/\D/g, '').length !== 11)) return toast.error(`${label} must contain 11 digits: 0300-1234567`);
    }
    if (!cnicValid(form.fatherCnic) || (form.fatherCnic && form.fatherCnic.replace(/\D/g, '').length !== 13)) return toast.error('Father CNIC must contain exactly 13 digits: 35202-1234567-1');
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        name: form.name.trim(),
        phone: form.phone || undefined,
        studentMobile: form.phone || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        address: form.currentAddress.trim() || undefined,
        bFormNumber: form.bFormNumber || undefined,
        fatherMobile1: form.fatherMobile1 || undefined,
        fatherWhatsapp: form.fatherWhatsapp || undefined,
        fatherCnic: form.fatherCnic || undefined,
        motherMobile: form.motherMobile || undefined,
        guardianMobile: form.guardianMobile || undefined,
        avatarUrl: form.avatarUrl || undefined,
        admissionType: form.admissionType,
        parentPassword: `${form.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9`,
      };
      if (editing) {
        await apiClient.patch(`/people/students/${editing.id}`, payload);
        toast.success('Student profile updated');
        setFormOpen(false);
      } else {
        const response = await apiClient.post('/people/students', payload);
        setCredentials(response.data?.credentials || null);
        toast.success(`Student admitted — ${response.data?.student?.admissionNo || 'Admission created'}`);
      }
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to save student');
    } finally { setSaving(false); }
  };

  const archive = async (id: string) => {
    if (!window.confirm('Archive this student? Existing school records will remain stored.')) return;
    try { await apiClient.delete(`/people/students/${id}`); setProfile(null); await load(); toast.success('Student archived'); } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to archive student'); }
  };

  const move = async (event: React.FormEvent) => {
    event.preventDefault(); if (!moveMode || !targetSection || !selectedIds.length) return;
    try { await apiClient.post(`/people/students/${moveMode}`, { studentIds: selectedIds, sectionId: targetSection, ...(moveMode === 'promote' ? { session: currentSession } : {}) }); toast.success(`${selectedIds.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'}`); setMoveMode(null); setTargetSection(''); await load(); } catch (error: any) { toast.error(error?.response?.data?.message || `Unable to ${moveMode} students`); }
  };

  const exportCsv = () => {
    const rows = [['Admission No', 'Name', 'Class', 'Section', 'Roll No', 'Religion', 'Admission Type', 'Previous School', 'Previous Class', 'Father Name', 'Father Mobile'], ...students.map((student) => [student.admissionNo, student.name, student.section?.class?.name, student.section?.name, student.rollNo, student.religion, student.admissionType, student.previousSchool, student.previousClass, student.fatherName, student.fatherMobile1])];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'edusphere-students.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const rows = parseCsv(await file.text()); if (!rows.length) throw new Error('CSV contains no student rows'); let created = 0;
      for (const row of rows) {
        if (!row.name || !row.sectionid) continue;
        await apiClient.post('/people/students', { name: row.name, sectionId: row.sectionid, email: row.email || undefined, studentMobile: row.studentmobile || row.phone || undefined, fatherName: row.fathername || undefined, fatherMobile1: row.fathermobile1 || row.fathermobile || undefined, dateOfBirth: row.dateofbirth || row.dob || undefined, gender: String(row.gender || 'MALE').toUpperCase(), religion: row.religion || 'Muslim', bFormNumber: row.bformnumber || row.cnic || undefined, session: row.session || currentSession, admissionType: row.admissiontype === 'TRANSFER' ? 'TRANSFER' : 'NEW', previousSchool: row.previousschool || undefined, previousClass: row.previousclass || undefined, previousAcademicRecord: row.previousacademicrecord || undefined, parentPassword: `${row.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9` });
        created += 1;
      }
      await load(); toast.success(`${created} student(s) imported`);
    } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Student import failed'); } finally { setImporting(false); }
  };

  const printId = (student: Student) => {
    const popup = window.open('', '_blank', 'width=540,height=760'); if (!popup) return toast.error('Please allow popups to print the ID card'); const photo = student.avatarUrl || '';
    popup.document.write(`<!doctype html><html><head><title>${student.name} - ID Card</title><style>body{font-family:Arial;background:#f1f5f9;padding:28px}.card{max-width:420px;margin:auto;border-radius:24px;overflow:hidden;background:#fff;border:1px solid #dbe3ee}.head{padding:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff}.body{padding:22px}.photo{width:82px;height:82px;border-radius:18px;object-fit:cover;background:#e2e8f0}.muted{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin-top:13px}.value{font-weight:700;margin-top:4px}</style></head><body><div class='card'><div class='head'>${photo ? `<img class='photo' src='${photo}'/>` : ''}<div style='font-size:11px;margin-top:12px;opacity:.8'>EDUSPHERE STUDENT ID</div><h1 style='margin:5px 0 0'>${student.name}</h1></div><div class='body'><div class='muted'>Admission No</div><div class='value'>${student.admissionNo || '—'}</div><div class='muted'>Class / Section</div><div class='value'>${student.section?.class?.name || '—'} / ${student.section?.name || '—'}</div><div class='muted'>Roll No</div><div class='value'>${student.rollNo || '—'}</div><div class='muted'>Session</div><div class='value'>${student.session || currentSession}</div></div></div><script>window.onload=()=>window.print()</script></body></html>`); popup.document.close();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">People Management</p><h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Students</h1><p className="mt-1 text-sm text-muted-foreground">Live admissions, student records and academic movement.</p></div><div className="flex flex-wrap gap-2"><button className={button} onClick={() => void load()}><RefreshCw size={15}/></button><button className={button} onClick={exportCsv}><Download size={15}/> Export</button><label className={`${button} cursor-pointer`}><FileUp size={15}/>{importing ? 'Importing…' : 'Import CSV'}<input type="file" accept=".csv,text/csv" className="hidden" disabled={importing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.currentTarget.value = ''; }}/></label><button className={primary} onClick={openCreate}><Plus size={16}/> Add Student</button></div></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat label="Total Students" value={students.length}/><Stat label="Active" value={activeCount}/><Stat label="Transfers" value={transferCount}/><Stat label="Used Sections" value={new Set(students.map((student) => student.sectionId).filter(Boolean)).size}/></div>
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><input className={input} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, admission no, class, section or parent..."/>{selectedIds.length > 0 && <div className="flex flex-wrap gap-2"><button className={button} onClick={() => setMoveMode('promote')}><ArrowUpRight size={15}/> Promote</button><button className={button} onClick={() => setMoveMode('transfer')}><ArrowRightLeft size={15}/> Transfer</button><button className={button} onClick={() => selectedIds.map((id) => students.find((student) => student.id === id)).filter(Boolean).forEach((student) => printId(student))}><Printer size={15}/> Print ID</button></div>}</div></div>
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="border-b border-border bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><tr><th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : filtered.map((student) => student.id))}/></th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Admission No</th><th className="px-4 py-3">Class / Section</th><th className="px-4 py-3">Class Teacher</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={8} className="p-14 text-center"><Loader2 className="mx-auto animate-spin text-violet-500" size={26}/><p className="mt-3 text-sm text-muted-foreground">Loading student records…</p></td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="p-14 text-center text-sm text-muted-foreground">No student records found.</td></tr> : filtered.map((student) => <tr key={student.id} className="hover:bg-violet-500/[0.03]"><td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => setSelectedIds((current) => current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])}/></td><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-violet-600 flex items-center justify-center font-black">{student.avatarUrl ? <img src={student.avatarUrl} alt="" className="h-full w-full object-cover"/> : String(student.name || 'S').charAt(0)}</div><div><div className="font-bold">{student.name}</div><div className="text-xs text-muted-foreground">{student.religion || 'Religion —'}</div></div></div></td><td className="px-4 py-3 font-semibold">{student.admissionNo || '—'}</td><td className="px-4 py-3">{student.section?.class?.name || '—'} / {student.section?.name || '—'}</td><td className="px-4 py-3">{student.section?.teacher?.name || '—'}</td><td className="px-4 py-3">{student.rollNo || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${student.admissionType === 'TRANSFER' ? 'bg-amber-500/10 text-amber-600' : 'bg-violet-500/10 text-violet-600'}`}>{student.admissionType === 'TRANSFER' ? 'Transfer' : 'New'}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 hover:bg-muted" onClick={() => setProfile(student)} title="Profile"><UserRound size={15}/></button><button className="rounded-lg p-2 hover:bg-muted" onClick={() => openEdit(student)} title="Edit"><Pencil size={15}/></button><button className="rounded-lg p-2 text-red-500 hover:bg-red-500/10" onClick={() => void archive(student.id)} title="Archive"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></div>

    {formOpen && <AdmissionModal title={editing ? 'Edit Student Profile' : 'Student Admission'} onClose={() => setFormOpen(false)}>
      <form onSubmit={save} className="space-y-6">
        <div className="rounded-3xl border border-violet-500/15 bg-gradient-to-r from-violet-600/[0.08] via-indigo-500/[0.06] to-fuchsia-500/[0.05] p-3 shadow-sm"><div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]"><span className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-white shadow-md">01 Student</span><span className="rounded-full border border-violet-500/15 bg-background/70 px-3.5 py-2">02 Academic</span><span className="rounded-full border border-violet-500/15 bg-background/70 px-3.5 py-2">03 Family</span><span className="rounded-full border border-violet-500/15 bg-background/70 px-3.5 py-2">04 Guardian</span><span className="rounded-full border border-violet-500/15 bg-background/70 px-3.5 py-2">05 Address</span></div></div>

        <Section title="Student Information" subtitle="Identity, admission reference, contact and photo." />
        <div className="rounded-3xl border border-violet-500/10 bg-gradient-to-br from-card via-card to-violet-500/[0.04] p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Admission No"><input className={input} readOnly value={editing?.admissionNo || 'Auto-generated by server'}/></Field>
              <Field label="Student Name" required><input required className={input} value={form.name} onChange={(event) => update('name', event.target.value)}/></Field>
              <Field label="Date of Birth"><input type="date" className={input} value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)}/></Field>
              <Field label="Gender"><select className={input} value={form.gender} onChange={(event) => update('gender', event.target.value)}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></Field>
              <Field label="Religion"><select className={input} value={form.religion} onChange={(event) => update('religion', event.target.value)}>{religions.map((religion) => <option key={religion}>{religion}</option>)}</select></Field>
              <Field label="B-Form / CNIC"><input inputMode="numeric" maxLength={15} className={input} placeholder="35202-1234567-1" value={form.bFormNumber} onChange={(event) => update('bFormNumber', formatCnic(event.target.value))}/></Field>
              <Field label="Student Email"><input type="email" className={input} disabled={Boolean(editing)} value={form.email} onChange={(event) => update('email', event.target.value)}/></Field>
              <Field label="Student Mobile"><input inputMode="numeric" maxLength={12} className={input} placeholder="0300-1234567" value={form.phone} onChange={(event) => update('phone', formatPhone(event.target.value))}/></Field>
            </div>
            <label className="mx-auto flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.06] shadow-inner"><input type="file" accept="image/*" className="hidden" disabled={compressing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handlePhoto(file); event.currentTarget.value = ''; }}/>{form.avatarUrl ? <img src={form.avatarUrl} alt="Student" className="h-full w-full object-cover"/> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Camera size={26}/><span className="text-[10px] font-black uppercase tracking-wider">Upload Photo</span></div>}</label>
          </div>
        </div>

        <Section title="Academic & Class" subtitle="Link the student to the live class and section structure." />
        <div className="rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-card via-card to-indigo-500/[0.04] p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Class / Section" required><select required className={input} value={form.sectionId} onChange={(event) => update('sectionId', event.target.value)}><option value="">Select class / section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.className} / Section {section.name}</option>)}</select></Field>
            <Field label="Session"><input className={input} value={form.session} onChange={(event) => update('session', event.target.value)}/></Field>
            <Field label="Admission Type"><select className={input} value={form.admissionType} onChange={(event) => update('admissionType', event.target.value as 'NEW' | 'TRANSFER')}><option value="NEW">New Admission</option><option value="TRANSFER">Transfer Student</option></select></Field>
          </div>
          {selectedSection?.teacher?.name && <div className="mt-4 rounded-2xl border border-violet-500/15 bg-gradient-to-r from-violet-600/[0.08] via-indigo-500/[0.04] to-transparent p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Class Teacher</p><p className="mt-1 text-base font-black">{selectedSection.teacher.name}</p></div>}
        </div>

        {form.admissionType === 'TRANSFER' && <><Section title="Previous School" subtitle="Required only for transfer admissions." /><div className="rounded-3xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.07] via-card to-orange-500/[0.03] p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><Field label="Previous School" required><input required className={input} value={form.previousSchool} onChange={(event) => update('previousSchool', event.target.value)}/></Field><Field label="Previous Class" required><input required className={input} value={form.previousClass} onChange={(event) => update('previousClass', event.target.value)}/></Field><Field label="Leaving Certificate / URL"><input className={input} value={form.leavingCertificateUrl} onChange={(event) => update('leavingCertificateUrl', event.target.value)}/></Field><Field label="Previous Academic Record"><input className={input} value={form.previousAcademicRecord} onChange={(event) => update('previousAcademicRecord', event.target.value)}/></Field></div></div></>}

        <Section title="Father Details" subtitle="Primary father information and current family status." />
        <div className="rounded-3xl border border-blue-500/10 bg-gradient-to-br from-card via-card to-blue-500/[0.04] p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Father Name"><input className={input} value={form.fatherName} onChange={(event) => update('fatherName', event.target.value)}/></Field><Field label="Father Status"><select className={input} value={form.fatherStatus} onChange={(event) => update('fatherStatus', event.target.value as 'ALIVE' | 'DECEASED')}><option value="ALIVE">Alive</option><option value="DECEASED">Deceased</option></select></Field><Field label="Father Mobile"><input inputMode="numeric" maxLength={12} className={input} placeholder="0300-1234567" value={form.fatherMobile1} onChange={(event) => update('fatherMobile1', formatPhone(event.target.value))}/></Field><Field label="Father WhatsApp"><input inputMode="numeric" maxLength={12} className={input} placeholder="0300-1234567" value={form.fatherWhatsapp} onChange={(event) => update('fatherWhatsapp', formatPhone(event.target.value))}/></Field><Field label="Father CNIC"><input inputMode="numeric" maxLength={15} className={input} placeholder="35202-1234567-1" value={form.fatherCnic} onChange={(event) => update('fatherCnic', formatCnic(event.target.value))}/></Field><Field label="Father Occupation"><select className={input} value={form.fatherOccupation} onChange={(event) => update('fatherOccupation', event.target.value)}><option value="">Select occupation</option>{fatherOccupations.map((occupation) => <option key={occupation}>{occupation}</option>)}</select></Field></div></div>

        <Section title="Mother Details" subtitle="Mother contact and occupation information." />
        <div className="rounded-3xl border border-pink-500/10 bg-gradient-to-br from-card via-card to-pink-500/[0.04] p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Mother Name"><input className={input} value={form.motherName} onChange={(event) => update('motherName', event.target.value)}/></Field><Field label="Mother Mobile"><input inputMode="numeric" maxLength={12} className={input} placeholder="0300-1234567" value={form.motherMobile} onChange={(event) => update('motherMobile', formatPhone(event.target.value))}/></Field><Field label="Mother Occupation"><select className={input} value={form.motherOccupation} onChange={(event) => update('motherOccupation', event.target.value)}><option value="">Select occupation</option>{motherOccupations.map((occupation) => <option key={occupation}>{occupation}</option>)}</select></Field></div></div>

        <Section title="Guardian Details" subtitle="Optional alternate guardian information." />
        <div className="rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Guardian Name"><input className={input} value={form.guardianName} onChange={(event) => update('guardianName', event.target.value)}/></Field><Field label="Relation"><select className={input} value={form.guardianRelation} onChange={(event) => update('guardianRelation', event.target.value)}><option value="">Select relation</option>{guardianRelations.map((relation) => <option key={relation} value={relation}>{relation === 'GRANDPARENT' ? 'Grandparent' : relation.charAt(0) + relation.slice(1).toLowerCase()}</option>)}</select></Field><Field label="Guardian Mobile"><input inputMode="numeric" maxLength={12} className={input} placeholder="0300-1234567" value={form.guardianMobile} onChange={(event) => update('guardianMobile', formatPhone(event.target.value))}/></Field></div></div>

        <Section title="Address" subtitle="Current and permanent residence details." />
        <div className="rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-card via-card to-cyan-500/[0.04] p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><Field label="Current Address"><textarea rows={3} className={input} value={form.currentAddress} onChange={(event) => update('currentAddress', event.target.value)}/></Field><Field label="Permanent Address"><textarea rows={3} className={input} value={form.permanentAddress} onChange={(event) => update('permanentAddress', event.target.value)}/></Field></div></div>

        {(facilities.transport || facilities.hostel) && <><Section title="School Services" subtitle="Only services currently configured for this school are available." /><div className="grid gap-4 md:grid-cols-2">{facilities.transport && <ServiceToggle label="Transport Service" active={form.transportRequired} onChange={(value) => update('transportRequired', value)} tone="violet" />}{facilities.hostel && <ServiceToggle label="Hostel Service" active={form.hostelRequired} onChange={(value) => update('hostelRequired', value)} tone="indigo" />}</div></>}

        {!editing && <div className="rounded-3xl border border-violet-500/15 bg-gradient-to-r from-violet-600/[0.08] via-indigo-500/[0.06] to-fuchsia-500/[0.04] p-4 text-xs text-muted-foreground"><span className="font-bold text-foreground">Automatic:</span> Admission No and Roll No are generated by the server. Student login credentials are created automatically.</div>}
        {credentials && <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-teal-500/[0.04] p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Student account created</p><p className="mt-2 text-sm">Login: <strong>{credentials.loginId}</strong></p><p className="text-sm">Password: <strong>{credentials.password}</strong></p></div>}
        <div className="flex justify-end gap-2 border-t border-border/70 pt-5"><button type="button" className={button} onClick={() => setFormOpen(false)}>Cancel</button><button className={primary} disabled={saving || compressing}>{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? 'Save Changes' : 'Create Student'}</button></div>
      </form>
    </AdmissionModal>}

    {moveMode && <Modal title={moveMode === 'promote' ? 'Promote Students' : 'Transfer Students'} onClose={() => setMoveMode(null)}><form onSubmit={move} className="space-y-4"><p className="text-sm text-muted-foreground">Move {selectedIds.length} selected student(s) to a verified section.</p><select required className={input} value={targetSection} onChange={(event) => setTargetSection(event.target.value)}><option value="">Select target section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.className} / Section {section.name}</option>)}</select><div className="flex justify-end gap-2"><button type="button" className={button} onClick={() => setMoveMode(null)}>Cancel</button><button className={primary}>Confirm</button></div></form></Modal>}
    {profile && <Modal title="Student Profile" onClose={() => setProfile(null)}><div className="space-y-5"><div className="flex items-center gap-4 rounded-3xl border border-violet-500/15 bg-gradient-to-r from-violet-600/[0.08] via-indigo-500/[0.04] to-fuchsia-500/[0.03] p-4"><div className="h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-black text-white flex items-center justify-center">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Student" className="h-full w-full object-cover"/> : String(profile.name || 'S').charAt(0)}</div><div><h2 className="text-lg font-black">{profile.name}</h2><p className="text-xs text-muted-foreground">{profile.admissionNo || 'No admission no.'} • {profile.section?.class?.name || '—'} / {profile.section?.name || '—'}</p>{profile.section?.teacher?.name && <p className="text-xs text-violet-600">Class Teacher: {profile.section.teacher.name}</p>}</div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Info label="Admission No" value={profile.admissionNo}/><Info label="Roll No" value={profile.rollNo}/><Info label="Class / Section" value={`${profile.section?.class?.name || '—'} / ${profile.section?.name || '—'}`}/>{profile.section?.teacher?.name && <Info label="Class Teacher" value={profile.section.teacher.name}/>}<Info label="Religion" value={profile.religion}/><Info label="B-Form / CNIC" value={profile.bFormNumber}/><Info label="Father" value={profile.fatherName}/><Info label="Father Mobile" value={profile.fatherMobile1}/><Info label="Mother" value={profile.motherName}/><Info label="Mother Mobile" value={profile.motherMobile}/><Info label="Previous School" value={profile.previousSchool}/><Info label="Previous Class" value={profile.previousClass}/><Info label="Current Address" value={profile.currentAddress || profile.address}/></div><div className="flex justify-end gap-2"><button className={button} onClick={() => printId(profile)}><Printer size={15}/> Print ID</button><button className={button} onClick={() => { setProfile(null); openEdit(profile); }}><Pencil size={15}/> Edit</button><button className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white" onClick={() => void archive(profile.id)}><Trash2 size={15}/> Archive</button></div></div></Modal>}
  </div>;
}

function Section({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-sm"><div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500"/><div className="bg-gradient-to-r from-violet-600/[0.08] via-indigo-500/[0.04] to-transparent px-5 py-3.5"><h3 className="text-base font-black text-foreground">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div></div>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}{required ? ' *' : ''}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-violet-500/[0.03] p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{String(value ?? '—') || '—'}</p></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-violet-500/[0.04] p-4 shadow-sm"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div>; }
function ServiceToggle({ label, active, onChange, tone }: { label: string; active: boolean; onChange: (value: boolean) => void; tone: 'violet' | 'indigo' }) { const gradient = tone === 'violet' ? 'from-violet-600 via-indigo-600 to-fuchsia-600' : 'from-indigo-600 via-blue-600 to-cyan-500'; return <label className="flex cursor-pointer items-center justify-between rounded-3xl border border-border/70 bg-gradient-to-br from-card to-violet-500/[0.04] p-5 shadow-sm"><div><p className="text-sm font-black">{label}</p><p className="mt-1 text-xs text-muted-foreground">Enabled because this service is configured for the school.</p></div><span className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition ${active ? `bg-gradient-to-r ${gradient}` : 'bg-muted'}`}><input type="checkbox" className="sr-only" checked={active} onChange={(event) => onChange(event.target.checked)}/><span className={`h-5 w-5 rounded-full bg-white shadow transition ${active ? 'translate-x-5' : 'translate-x-0'}`} /></span></label>; }
function AdmissionModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-5"><div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-[32px] border border-white/10 bg-card shadow-[0_30px_120px_rgba(76,29,149,0.35)]"><div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-950 via-violet-950 to-indigo-950 px-6 py-6 text-white sm:px-8"><div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_top_right,_rgba(168,85,247,0.35),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.25),_transparent_30%)]"/><div className="relative flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">EduSphere Admissions</p><h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2><p className="mt-1 text-xs text-violet-100/70">Build a complete student record with live academic and family information.</p></div><button onClick={onClose} className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/15"><X size={18}/></button></div></div><div className="bg-gradient-to-br from-violet-500/[0.025] via-card to-indigo-500/[0.03] p-4 sm:p-8">{children}</div></div></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"><div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-6 py-4"><h2 className="text-lg font-black">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18}/></button></div><div className="p-6">{children}</div></div></div>; }
