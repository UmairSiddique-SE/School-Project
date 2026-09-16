import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ArrowUpRight, Camera, Download, Edit3, FileUp, Loader2, Printer, RefreshCw, Search, Trash2, UserRound, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = any;
type Section = any;

const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-violet-500';
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-accent';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:opacity-60';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const initialForm = () => ({
  name: '', email: '', studentMobile: '', gender: 'MALE', dateOfBirth: '', bloodGroup: '', religion: '', bFormNumber: '',
  sectionId: '', session: currentSession, status: 'ACTIVE', photoUrl: '',
  fatherName: '', fatherMobile1: '', fatherMobile2: '', fatherWhatsapp: '', fatherCnic: '', fatherOccupation: '',
  motherName: '', motherMobile: '', motherCnic: '', motherOccupation: '',
  guardianName: '', guardianRelation: '', guardianMobile: '', relation: 'FATHER',
  country: 'Pakistan', province: 'Punjab', district: '', tehsil: '', city: '', address: '', currentAddress: '', permanentAddress: '', emergencyContact: '',
  previousSchool: '', previousClass: '', leavingCertificateUrl: '', admissionType: 'NEW', previousAcademicRecord: '',
  medicalNotes: '', specialRequirements: '', transportRequired: false, hostelRequired: false, remarks: '',
});

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Please select a JPG, PNG or WEBP image'));
    if (file.size > 2 * 1024 * 1024) return reject(new Error('Student photo must be 2 MB or smaller'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Invalid image file'));
      image.onload = () => {
        const max = 700;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Image processor is unavailable'));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.86;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 140000 && quality > 0.25) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function fieldLabel(text: string, required = false) {
  return <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{text}{required ? ' *' : ''}</span>;
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><div className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm font-semibold text-foreground">{String(value ?? '—') || '—'}</div></div>;
}

export default function StudentsFull() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [profile, setProfile] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(initialForm());
  const [credentials, setCredentials] = useState<any>(null);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([apiClient.get('/people/students'), apiClient.get('/classes')]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSelectedIds([]);
    } catch (error: any) {
      setStudents([]);
      setClasses([]);
      toast.error(error?.response?.data?.message || 'Unable to load live student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sections = useMemo<Section[]>(() => classes.flatMap((item) => (item.sections || []).map((section: any) => ({ ...section, className: item.name, classId: item.id }))), [classes]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => [s.name, s.admissionNo, s.rollNo, s.email, s.phone, s.bFormNumber, s.section?.name, s.section?.class?.name, s.fatherName, s.fatherMobile1].some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [students, search]);
  const active = students.filter((s) => String(s.status || 'ACTIVE') === 'ACTIVE').length;
  const selected = students.filter((s) => selectedIds.includes(s.id));
  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm());
    setCredentials(null);
    setFormOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setCredentials(null);
    setForm({ ...initialForm(), ...student, studentMobile: student.phone || '', address: student.address || student.currentAddress || '', currentAddress: student.currentAddress || student.address || '', permanentAddress: student.permanentAddress || '', photoUrl: student.avatarUrl || student.photoUrl || '', sectionId: student.sectionId || '', country: 'Pakistan', session: student.session || currentSession });
    setFormOpen(true);
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    try {
      update('photoUrl', await compressImage(file));
      toast.success('Student photo ready and compressed');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to process photo');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.sectionId) {
      toast.error('Student name and class/section are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, phone: form.studentMobile || undefined, address: form.currentAddress || form.address || undefined, avatarUrl: form.photoUrl || undefined, parentPassword: `${form.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9` };
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
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id: string) => {
    if (!window.confirm('Archive this student? Existing school records will remain stored.')) return;
    try {
      await apiClient.delete(`/people/students/${id}`);
      setProfile(null);
      await load();
      toast.success('Student archived');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive student');
    }
  };

  const move = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moveMode || !targetSection || !selectedIds.length) return;
    try {
      await apiClient.post(`/people/students/${moveMode}`, { studentIds: selectedIds, sectionId: targetSection, ...(moveMode === 'promote' ? { session: currentSession } : {}) });
      toast.success(`${selectedIds.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'}`);
      setMoveMode(null);
      setTargetSection('');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Unable to ${moveMode} students`);
    }
  };

  const exportCsv = () => {
    const rows = [['Admission No','Name','Class','Section','Roll No','Status','Father Name','Father Mobile','Student Mobile','Email'], ...students.map((s) => [s.admissionNo,s.name,s.section?.class?.name,s.section?.name,s.rollNo,s.status,s.fatherName,s.fatherMobile1,s.phone,s.email])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'edusphere-students.csv'; a.click(); URL.revokeObjectURL(url);
    toast.success('Students exported');
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('CSV contains no student rows');
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, ''));
      let count = 0;
      for (const line of lines.slice(1)) {
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '').trim());
        const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] || '']));
        if (!row.name || !row.sectionid) continue;
        await apiClient.post('/people/students', { name: row.name, sectionId: row.sectionid, email: row.email || undefined, studentMobile: row.studentmobile || row.phone || undefined, fatherName: row.fathername || undefined, fatherMobile1: row.fathermobile1 || row.fathermobile || undefined, dateOfBirth: row.dateofbirth || row.dob || undefined, gender: String(row.gender || 'MALE').toUpperCase(), bFormNumber: row.bformnumber || row.cnic || undefined, currentAddress: row.currentaddress || row.address || undefined, session: row.session || currentSession, admissionType: row.admissiontype || 'NEW', parentPassword: `${row.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9` });
        count += 1;
      }
      await load();
      toast.success(`${count} student(s) imported`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Student import failed');
    } finally {
      setImporting(false);
    }
  };

  const printId = (student: Student) => {
    const popup = window.open('', '_blank', 'width=540,height=760');
    if (!popup) return toast.error('Please allow popups to print the ID card');
    const photo = student.avatarUrl || student.photoUrl || '';
    popup.document.write(`<!doctype html><html><head><title>${student.name} - ID Card</title><style>body{font-family:Arial;background:#f1f5f9;padding:28px}.card{max-width:420px;margin:auto;border-radius:24px;overflow:hidden;background:#fff;border:1px solid #dbe3ee}.head{padding:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff}.body{padding:22px}.photo{width:82px;height:82px;border-radius:18px;object-fit:cover;background:#e2e8f0}.muted{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin-top:13px}.value{font-weight:700;margin-top:4px}</style></head><body><div class='card'><div class='head'>${photo ? `<img class='photo' src='${photo}'/>` : ''}<div style='font-size:11px;margin-top:12px;opacity:.8'>EDUSPHERE STUDENT ID</div><h1 style='margin:5px 0 0'>${student.name}</h1></div><div class='body'><div class='muted'>Admission No</div><div class='value'>${student.admissionNo || '—'}</div><div class='muted'>Class / Section</div><div class='value'>${student.section?.class?.name || '—'} / ${student.section?.name || '—'}</div><div class='muted'>Roll No</div><div class='value'>${student.rollNo || '—'}</div><div class='muted'>Session</div><div class='value'>${student.session || currentSession}</div></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">People Management</p><h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Students</h1><p className="mt-1 text-sm text-muted-foreground">Complete live student admissions, profiles, family details and academic records.</p></div>
      <div className="flex flex-wrap gap-2"><button className={btn} onClick={() => void load()}><RefreshCw size={15}/></button><button className={btn} onClick={exportCsv}><Download size={15}/>Export</button><label className={`${btn} cursor-pointer`}><FileUp size={15}/>{importing ? 'Importing…' : 'Import CSV'}<input className="hidden" type="file" accept=".csv,text/csv" disabled={importing} onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCsv(f); e.currentTarget.value=''; }}/></label><button className={primary} onClick={openCreate}><Users size={15}/> Add Student</button></div>
    </div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat label="Total Students" value={students.length}/><Stat label="Active" value={active}/><Stat label="Sections Used" value={new Set(students.map((s) => s.sectionId).filter(Boolean)).size}/><Stat label="Selected" value={selectedIds.length}/></div>

    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><input className={`${input} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, admission, roll, class, section, CNIC or contact…"/></div>{selectedIds.length>0 && <div className="flex flex-wrap gap-2"><button className={btn} onClick={() => setMoveMode('promote')}><ArrowUpRight size={15}/>Promote</button><button className={btn} onClick={() => setMoveMode('transfer')}><ArrowRightLeft size={15}/>Transfer</button><button className={btn} onClick={() => selected.forEach(printId)}><Printer size={15}/>Print ID</button></div>}</div></div>

    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><tr><th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : filtered.map((s) => s.id))}/></th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Admission No</th><th className="px-4 py-3">Class / Section</th><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Father</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={8} className="p-14 text-center"><Loader2 className="mx-auto animate-spin text-violet-500"/></td></tr> : filtered.length===0 ? <tr><td colSpan={8} className="p-14 text-center"><Users size={30} className="mx-auto text-muted-foreground/40"/><p className="mt-3 text-sm font-semibold text-muted-foreground">No live students found</p></td></tr> : filtered.map((s) => <tr key={s.id} className="hover:bg-muted/30"><td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => setSelectedIds((ids) => ids.includes(s.id) ? ids.filter((id) => id!==s.id) : [...ids,s.id])}/></td><td className="px-4 py-3"><button className="flex items-center gap-3 text-left" onClick={() => setProfile(s)}>{s.avatarUrl ? <img src={s.avatarUrl} className="h-10 w-10 rounded-xl object-cover" alt=""/> : <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-600"><UserRound size={17}/></span>}<span><span className="block font-bold text-foreground hover:text-violet-500">{s.name}</span><span className="block text-xs text-muted-foreground">{s.email || s.phone || 'No contact'}</span></span></button></td><td className="px-4 py-3 font-mono text-xs">{s.admissionNo || '—'}</td><td className="px-4 py-3 text-sm">{s.section?.class?.name || '—'} <span className="text-muted-foreground">/ {s.section?.name || '—'}</span></td><td className="px-4 py-3 font-semibold">{s.rollNo || '—'}</td><td className="px-4 py-3 text-sm">{s.fatherName || '—'}<div className="text-xs text-muted-foreground">{s.fatherMobile1 || ''}</div></td><td className="px-4 py-3"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-600">{s.status || 'ACTIVE'}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 hover:bg-muted" title="Profile" onClick={() => setProfile(s)}><UserRound size={15}/></button><button className="rounded-lg p-2 hover:bg-muted" title="Edit" onClick={() => openEdit(s)}><Edit3 size={15}/></button><button className="rounded-lg p-2 hover:bg-muted" title="Print ID" onClick={() => printId(s)}><Printer size={15}/></button><button className="rounded-lg p-2 text-rose-500 hover:bg-muted" title="Archive" onClick={() => void archive(s.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></div>

    {formOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">{editing ? 'Student Profile' : 'New Admission'}</p><h2 className="text-xl font-black text-foreground">{editing ? 'Edit Student' : 'Add Student'}</h2></div><button className="rounded-xl p-2 hover:bg-muted" onClick={() => setFormOpen(false)}><X size={18}/></button></div><form onSubmit={save} className="p-5 space-y-7">
      <section className="grid gap-5 lg:grid-cols-[180px_1fr]"><div className="flex flex-col items-center"><div className="relative h-36 w-32 overflow-hidden rounded-2xl border-2 border-dashed border-violet-500/30 bg-muted/30">{form.photoUrl ? <img src={form.photoUrl} alt="Student" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-center text-muted-foreground"><Camera size={28} className="mx-auto"/><span className="mt-2 block text-[10px] font-bold uppercase tracking-wide">Student Photo</span></div>}{form.photoUrl && <button type="button" className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white" onClick={() => update('photoUrl','')}><X size={13}/></button>}</div><label className="mt-3 cursor-pointer rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white"><Camera size={13} className="mr-1 inline"/> Upload Photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>void handlePhoto(e.target.files?.[0])}/></label><p className="mt-2 text-center text-[10px] text-muted-foreground">JPG/PNG/WEBP • max 2 MB<br/>compressed before saving</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><label>{fieldLabel('Student Name', true)}<input required className={input} value={form.name} onChange={(e)=>update('name',e.target.value)} /></label><label>{fieldLabel('Date of Birth')}<input type="date" className={input} value={form.dateOfBirth ? String(form.dateOfBirth).slice(0,10):''} onChange={(e)=>update('dateOfBirth',e.target.value)} /></label><label>{fieldLabel('Gender')}<select className={input} value={form.gender} onChange={(e)=>update('gender',e.target.value)}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label><label>{fieldLabel('Blood Group')}<input className={input} value={form.bloodGroup} onChange={(e)=>update('bloodGroup',e.target.value)} placeholder="B+"/></label><label>{fieldLabel('Religion')}<input className={input} value={form.religion} onChange={(e)=>update('religion',e.target.value)} /></label><label>{fieldLabel('B-Form / CNIC')}<input className={input} value={form.bFormNumber} onChange={(e)=>update('bFormNumber',e.target.value)} placeholder="35202-1234567-1" /></label><label>{fieldLabel('Student Email')}<input type="email" className={input} value={form.email} disabled={Boolean(editing)} onChange={(e)=>update('email',e.target.value)} /></label><label>{fieldLabel('Student Mobile')}<input className={input} value={form.studentMobile} onChange={(e)=>update('studentMobile',e.target.value)} /></label><label>{fieldLabel('Class / Section', true)}<select required className={input} value={form.sectionId} onChange={(e)=>update('sectionId',e.target.value)}><option value="">Select class / section</option>{sections.map((s)=><option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}</select></label><label>{fieldLabel('Session')}<input className={input} value={form.session} onChange={(e)=>update('session',e.target.value)}/></label><label>{fieldLabel('Admission Type')}<select className={input} value={form.admissionType} onChange={(e)=>update('admissionType',e.target.value)}><option value="NEW">New</option><option value="TRANSFER">Transfer</option></select></label><label>{fieldLabel('Status')}<select className={input} value={form.status} onChange={(e)=>update('status',e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="GRADUATED">Graduated</option><option value="LEFT">Left</option></select></label></div></section>
      {!editing && <div className="grid gap-3 sm:grid-cols-3"><Detail label="Admission No" value="Auto-generated by server"/><Detail label="Class Roll No" value={form.sectionId ? 'Auto-generated in selected section' : 'Select section first'}/><Detail label="Student Login" value="Created automatically after admission"/></div>}
      <Section title="Father / Guardian"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label>{fieldLabel('Father Name')}<input className={input} value={form.fatherName} onChange={(e)=>update('fatherName',e.target.value)}/></label><label>{fieldLabel('Father Mobile')}<input className={input} value={form.fatherMobile1} onChange={(e)=>update('fatherMobile1',e.target.value)}/></label><label>{fieldLabel('Father WhatsApp')}<input className={input} value={form.fatherWhatsapp} onChange={(e)=>update('fatherWhatsapp',e.target.value)}/></label><label>{fieldLabel('Father CNIC')}<input className={input} value={form.fatherCnic} onChange={(e)=>update('fatherCnic',e.target.value)}/></label><label>{fieldLabel('Father Occupation')}<input className={input} value={form.fatherOccupation} onChange={(e)=>update('fatherOccupation',e.target.value)}/></label><label>{fieldLabel('Guardian Name')}<input className={input} value={form.guardianName} onChange={(e)=>update('guardianName',e.target.value)}/></label><label>{fieldLabel('Guardian Relation')}<input className={input} value={form.guardianRelation} onChange={(e)=>update('guardianRelation',e.target.value)}/></label><label>{fieldLabel('Guardian Mobile')}<input className={input} value={form.guardianMobile} onChange={(e)=>update('guardianMobile',e.target.value)}/></label></div></Section>
      <Section title="Mother Details"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label>{fieldLabel('Mother Name')}<input className={input} value={form.motherName} onChange={(e)=>update('motherName',e.target.value)}/></label><label>{fieldLabel('Mother Mobile')}<input className={input} value={form.motherMobile} onChange={(e)=>update('motherMobile',e.target.value)}/></label><label>{fieldLabel('Mother CNIC')}<input className={input} value={form.motherCnic} onChange={(e)=>update('motherCnic',e.target.value)}/></label><label>{fieldLabel('Mother Occupation')}<input className={input} value={form.motherOccupation} onChange={(e)=>update('motherOccupation',e.target.value)}/></label></div></Section>
      <Section title="Address & Contact"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label>{fieldLabel('Country')}<input className={input} value={form.country} onChange={(e)=>update('country',e.target.value)}/></label><label>{fieldLabel('Province')}<input className={input} value={form.province} onChange={(e)=>update('province',e.target.value)}/></label><label>{fieldLabel('District')}<input className={input} value={form.district} onChange={(e)=>update('district',e.target.value)}/></label><label>{fieldLabel('Tehsil')}<input className={input} value={form.tehsil} onChange={(e)=>update('tehsil',e.target.value)}/></label><label>{fieldLabel('City')}<input className={input} value={form.city} onChange={(e)=>update('city',e.target.value)}/></label><label>{fieldLabel('Emergency Contact')}<input className={input} value={form.emergencyContact} onChange={(e)=>update('emergencyContact',e.target.value)}/></label><label className="md:col-span-2 xl:col-span-3">{fieldLabel('Current Address')}<textarea className={`${input} min-h-20`} value={form.currentAddress} onChange={(e)=>update('currentAddress',e.target.value)}/></label><label className="md:col-span-2 xl:col-span-3">{fieldLabel('Permanent Address')}<textarea className={`${input} min-h-20`} value={form.permanentAddress} onChange={(e)=>update('permanentAddress',e.target.value)}/></label></div></Section>
      <Section title="Previous Academic Record"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><label>{fieldLabel('Previous School')}<input className={input} value={form.previousSchool} onChange={(e)=>update('previousSchool',e.target.value)}/></label><label>{fieldLabel('Previous Class')}<input className={input} value={form.previousClass} onChange={(e)=>update('previousClass',e.target.value)}/></label><label>{fieldLabel('Leaving Certificate URL')}<input className={input} value={form.leavingCertificateUrl} onChange={(e)=>update('leavingCertificateUrl',e.target.value)}/></label><label className="md:col-span-2 xl:col-span-3">{fieldLabel('Previous Academic Record')}<textarea className={`${input} min-h-24`} value={form.previousAcademicRecord} onChange={(e)=>update('previousAcademicRecord',e.target.value)}/></label></div></Section>
      <Section title="Medical, Transport & Notes"><div className="grid gap-4 md:grid-cols-2"><label>{fieldLabel('Medical Notes')}<textarea className={`${input} min-h-24`} value={form.medicalNotes} onChange={(e)=>update('medicalNotes',e.target.value)}/></label><label>{fieldLabel('Special Requirements')}<textarea className={`${input} min-h-24`} value={form.specialRequirements} onChange={(e)=>update('specialRequirements',e.target.value)}/></label><label className="md:col-span-2">{fieldLabel('Remarks')}<textarea className={`${input} min-h-20`} value={form.remarks} onChange={(e)=>update('remarks',e.target.value)}/></label><label className="flex items-center gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={Boolean(form.transportRequired)} onChange={(e)=>update('transportRequired',e.target.checked)}/><span className="text-sm font-semibold">Transport required</span></label><label className="flex items-center gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={Boolean(form.hostelRequired)} onChange={(e)=>update('hostelRequired',e.target.checked)}/><span className="text-sm font-semibold">Hostel required</span></label></div></Section>
      {credentials && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Accounts Created</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><Detail label="Admission No" value={students.find((s)=>s.id === profile?.id)?.admissionNo || 'See student record after refresh'}/><Detail label="Student Login ID" value={credentials.loginId}/><Detail label="Temporary Student Password" value={credentials.password}/></div></div>}
      <div className="flex justify-end gap-2 border-t border-border pt-5"><button type="button" className={btn} onClick={()=>setFormOpen(false)}>Cancel</button><button className={primary} disabled={saving}>{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? 'Save Full Profile' : 'Create Student & Account'}</button></div>
    </form></div></div>}

    {profile && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">Student Profile</p><h2 className="text-2xl font-black">{profile.name}</h2></div><button className="rounded-xl p-2 hover:bg-muted" onClick={()=>setProfile(null)}><X size={18}/></button></div><div className="p-5 space-y-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="h-28 w-24 overflow-hidden rounded-2xl bg-muted">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-muted-foreground"><UserRound/></div>}</div><div><h3 className="text-xl font-black">{profile.name}</h3><p className="text-sm text-muted-foreground">{profile.section?.class?.name || '—'} / {profile.section?.name || '—'}</p><p className="mt-1 font-mono text-xs text-violet-500">{profile.admissionNo || '—'} • Roll {profile.rollNo || '—'}</p></div><div className="ml-auto flex gap-2"><button className={btn} onClick={()=>openEdit(profile)}><Edit3 size={15}/>Edit</button><button className={btn} onClick={()=>printId(profile)}><Printer size={15}/>Print ID</button></div></div><div className="grid gap-3 md:grid-cols-3"><Detail label="Date of Birth" value={profile.dateOfBirth?.slice?.(0,10) || profile.dateOfBirth}/><Detail label="Gender" value={profile.gender}/><Detail label="B-Form / CNIC" value={profile.bFormNumber}/><Detail label="Student Mobile" value={profile.phone}/><Detail label="Email" value={profile.email}/><Detail label="Session" value={profile.session}/><Detail label="Father" value={profile.fatherName}/><Detail label="Father Mobile" value={profile.fatherMobile1}/><Detail label="Father WhatsApp" value={profile.fatherWhatsapp}/><Detail label="Mother" value={profile.motherName}/><Detail label="Guardian" value={profile.guardianName}/><Detail label="Current Address" value={profile.currentAddress || profile.address}/><Detail label="Permanent Address" value={profile.permanentAddress}/><Detail label="Previous School" value={profile.previousSchool}/><Detail label="Previous Class" value={profile.previousClass}/><Detail label="Admission Type" value={profile.admissionType}/><Detail label="Transport" value={profile.transportRequired ? 'Required' : 'No'}/><Detail label="Hostel" value={profile.hostelRequired ? 'Required' : 'No'}/><Detail label="Status" value={profile.status}/></div></div></div></div>}

    {moveMode && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3"><form onSubmit={move} className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{moveMode==='promote'?'Promote':'Transfer'} Students</h3><button type="button" onClick={()=>setMoveMode(null)}><X size={18}/></button></div><p className="mt-2 text-sm text-muted-foreground">Move {selectedIds.length} selected student(s) to a new section.</p><select required className={`${input} mt-4`} value={targetSection} onChange={(e)=>setTargetSection(e.target.value)}><option value="">Select target section</option>{sections.map((s)=><option key={s.id} value={s.id}>{s.className} / {s.name}</option>)}</select><div className="mt-4 flex justify-end gap-2"><button type="button" className={btn} onClick={()=>setMoveMode(null)}>Cancel</button><button className={primary}>Confirm</button></div></form></div>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black text-foreground">{value}</p></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-border p-4"><h3 className="mb-4 text-sm font-black text-foreground">{title}</h3>{children}</section>; }
