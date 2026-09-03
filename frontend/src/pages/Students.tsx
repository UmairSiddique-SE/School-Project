import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Search, Trash2, Users, X, UserRound, GraduationCap, KeyRound } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Student = {
  id: string; admissionNo: string; rollNo?: string | null; name: string; gender?: string | null;
  dateOfBirth?: string | null; bFormNumber?: string | null; phone?: string | null; email?: string | null;
  status?: string; session?: string | null; section?: { id: string; name: string; class?: { name: string } } | null;
};
type Section = { id: string; name: string; class?: { id: string; name: string } };
type Form = {
  name: string; gender: string; dateOfBirth: string; bFormNumber: string; phone: string; email: string;
  sectionId: string; session: string; status: string; password: string;
};
const emptyForm: Form = {
  name: '', gender: 'MALE', dateOfBirth: '', bFormNumber: '', phone: '', email: '',
  sectionId: '', session: '', status: 'ACTIVE', password: '',
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className = '' }) => (
  <label className={`erp-form-label ${className}`}>
    {label}{required && <span className="required">*</span>}
    <div className="mt-1.5">{children}</div>
  </label>
);

export default function Students() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [studentRes, classRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes'),
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      const allSections: Section[] = [];
      (Array.isArray(classRes.data) ? classRes.data : []).forEach((c: any) =>
        (c.sections || []).forEach((s: any) => allSections.push({ ...s, class: { id: c.id, name: c.name } })),
      );
      setSections(allSections);
    } catch (e: any) {
      setStudents([]); setSections([]);
      setError(e?.response?.data?.message || 'Unable to load students.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => [
      s.name, s.admissionNo, s.rollNo, s.phone, s.email, s.section?.name, s.section?.class?.name,
    ].some(v => String(v || '').toLowerCase().includes(q)));
  }, [students, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      gender: s.gender || 'MALE',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
      bFormNumber: s.bFormNumber || '',
      phone: s.phone || '',
      email: s.email || '',
      sectionId: s.section?.id || '',
      session: s.session || '',
      status: s.status || 'ACTIVE',
      password: '',
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Student name is required');
    if (!editing && form.password.length < 12) return toast.error('Student password must be at least 12 characters');
    setSaving(true);
    const payload: any = {
      name: form.name.trim(), gender: form.gender,
      dateOfBirth: form.dateOfBirth || undefined,
      bFormNumber: form.bFormNumber || undefined,
      phone: form.phone || undefined, email: form.email || undefined,
      sectionId: form.sectionId || undefined, session: form.session || undefined,
      status: form.status,
    };
    if (!editing) payload.password = form.password;
    try {
      if (editing) await apiClient.patch(`/people/students/${editing.id}`, payload);
      else await apiClient.post('/people/students', payload);
      toast.success(editing ? 'Student updated successfully' : 'Student added successfully');
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save student');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this student?')) return;
    try { await apiClient.delete(`/people/students/${id}`); toast.success('Student deleted'); await load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete student'); }
  };
  const set = (key: keyof Form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student records, class assignments and login access.</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="erp-primary-btn w-fit">
            <Plus size={17} /> Add Student
          </button>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-3 sm:p-4 flex items-center gap-3">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input className="flex-1 !min-h-10 !border-0 !shadow-none !bg-transparent outline-none" placeholder="Search by name, admission no, roll no, class..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{filtered.length} records</span>
      </div>

      {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> :
       error ? <div className="rounded-xl border p-6 text-destructive bg-card">{error}<button className="underline ml-2" onClick={load}>Retry</button></div> :
       filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground bg-card"><Users className="mx-auto mb-2" />No students found.</div> :
       <div className="rounded-xl border overflow-x-auto bg-card shadow-sm">
         <table className="w-full text-sm">
           <thead className="bg-slate-50 border-b"><tr className="text-left"><th className="p-3">Admission</th><th className="p-3">Name</th><th className="p-3">Class / Section</th><th className="p-3">Roll</th><th className="p-3">Gender</th><th className="p-3">Status</th>{canManage && <th className="p-3">Actions</th>}</tr></thead>
           <tbody>{filtered.map(s => <tr key={s.id} className="border-b last:border-0">
             <td className="p-3 font-semibold">{s.admissionNo}</td><td className="p-3">{s.name}</td>
             <td className="p-3">{s.section?.class?.name || '—'}{s.section?.name ? ` / ${s.section.name}` : ''}</td>
             <td className="p-3">{s.rollNo || '—'}</td><td className="p-3">{s.gender || '—'}</td><td className="p-3">{s.status || 'ACTIVE'}</td>
             {canManage && <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-blue-50 text-primary"><Edit2 size={15} /></button><button onClick={() => remove(s.id)} className="p-2 rounded-lg text-destructive hover:bg-red-50"><Trash2 size={15} /></button></div></td>}
           </tr>)}</tbody>
         </table>
       </div>}

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-6xl">
        <ModalHeader icon={editing ? <Edit2 size={19} /> : <UserRound size={19} />} title={editing ? 'Edit Student' : 'Add Student'} subtitle="Student Profile • Academic Assignment • Account Access" onClose={() => setOpen(false)} />
        <form onSubmit={save} className="p-4 sm:p-6 space-y-5 bg-slate-50/60">
          <section className="erp-section">
            <div className="erp-section-title"><span>Personal Information</span><span className="text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-lg border border-blue-100">Student Profile</span></div>
            <div className="erp-section-body grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Student Name" required className="lg:col-span-2"><input required className="w-full px-3 py-2.5 bg-white" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter full student name" /></Field>
              <Field label="Gender" required><select className="w-full px-3 py-2.5 bg-white" value={form.gender} onChange={e => set('gender', e.target.value)}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field>
              <Field label="Date of Birth"><input type="date" className="w-full px-3 py-2.5 bg-white" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></Field>
              <Field label="B-Form Number"><input className="w-full px-3 py-2.5 bg-white" value={form.bFormNumber} onChange={e => set('bFormNumber', e.target.value)} placeholder="e.g. 38402-1234567-1" /></Field>
              <Field label="Mobile Number"><input className="w-full px-3 py-2.5 bg-white" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03XXXXXXXXX" /></Field>
              <Field label="Email Address" className="lg:col-span-2"><input type="email" className="w-full px-3 py-2.5 bg-white" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" /></Field>
            </div>
          </section>

          <section className="erp-section">
            <div className="erp-section-title indigo"><span>Academic Information</span><span className="text-xs font-semibold text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-purple-100">Class & Section</span></div>
            <div className="erp-section-body grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Class / Section" className="lg:col-span-2"><select className="w-full px-3 py-2.5 bg-white" value={form.sectionId} onChange={e => set('sectionId', e.target.value)}><option value="">Not assigned</option>{sections.map(s => <option key={s.id} value={s.id}>{s.class?.name} / {s.name}</option>)}</select></Field>
              <Field label="Academic Session"><input placeholder="2026-2027" className="w-full px-3 py-2.5 bg-white" value={form.session} onChange={e => set('session', e.target.value)} /></Field>
              <Field label="Student Status"><select className="w-full px-3 py-2.5 bg-white" value={form.status} onChange={e => set('status', e.target.value)}><option>ACTIVE</option><option>INACTIVE</option><option>GRADUATED</option><option>LEFT</option></select></Field>
              <div className="lg:col-span-2 flex items-end text-xs text-slate-500"><GraduationCap size={17} className="mr-2 text-primary" /> Admission and roll numbers are generated by the school system.</div>
            </div>
          </section>

          {!editing && <section className="erp-section">
            <div className="erp-section-title green"><span>Login & Account Access</span><span className="text-xs font-semibold text-green-700 bg-white px-3 py-1.5 rounded-lg border border-green-100">Secure Access</span></div>
            <div className="erp-section-body grid sm:grid-cols-2 gap-4">
              <Field label="Student Login Password" required><div className="relative"><KeyRound size={17} className="absolute left-3 top-3 text-slate-400" /><input required type="password" minLength={12} className="w-full pl-10 pr-3 py-2.5 bg-white" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 12 characters" /></div></Field>
              <div className="flex items-center text-xs text-slate-500 pt-6">Use a strong password. The student can change it after signing in.</div>
            </div>
          </section>}

          <div className="erp-action-bar -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
            <button type="button" onClick={() => setOpen(false)} className="erp-secondary-btn">Cancel</button>
            <button disabled={saving} className="erp-primary-btn">{saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? 'Saving...' : editing ? 'Update Student' : 'Create Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
