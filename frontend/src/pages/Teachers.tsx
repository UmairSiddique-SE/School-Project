import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Briefcase, Edit3, Loader2, Mail, Phone, Plus, RefreshCw, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  qualification?: string | null;
  experience?: number | null;
  salary?: number | null;
  joiningDate?: string;
  isActive?: boolean;
}

const initialForm = {
  name: '', email: '', employeeNo: '', phone: '', gender: 'MALE',
  qualification: '', experience: '', salary: '', password: '',
};

const phoneFormat = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const money = (value?: number | null) => value == null ? '—' : `PKR ${Number(value).toLocaleString('en-PK')}`;
const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ ...initialForm });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/people/teachers');
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setTeachers([]);
      toast.error(error?.response?.data?.message || 'Unable to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((teacher) => [teacher.name, teacher.email, teacher.employeeNo, teacher.phone, teacher.qualification]
      .some((value) => String(value ?? '').toLowerCase().includes(q)));
  }, [teachers, query]);

  const activeCount = teachers.filter((teacher) => teacher.isActive !== false).length;
  const qualifiedCount = teachers.filter((teacher) => Boolean(teacher.qualification)).length;
  const payroll = teachers.reduce((sum, teacher) => sum + Number(teacher.salary || 0), 0);

  const openAdd = () => {
    setEditing(null);
    const nextNo = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
    setForm({ ...initialForm, employeeNo: nextNo });
    setShowForm(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setForm({
      name: teacher.name || '', email: teacher.email || '', employeeNo: teacher.employeeNo || '',
      phone: teacher.phone || '', gender: teacher.gender || 'MALE', qualification: teacher.qualification || '',
      experience: teacher.experience == null ? '' : String(teacher.experience),
      salary: teacher.salary == null ? '' : String(teacher.salary), password: '',
    });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/people/teachers/${editing.id}`, {
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          qualification: form.qualification,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
        });
        toast.success('Teacher profile updated');
      } else {
        if (form.password.length < 12) throw new Error('Teacher portal password must be at least 12 characters');
        await apiClient.post('/people/teachers', {
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
        });
        toast.success('Teacher added successfully');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...initialForm });
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (teacher: Teacher) => {
    if (!window.confirm(`Archive ${teacher.name}?`)) return;
    try {
      await apiClient.delete(`/people/teachers/${teacher.id}`);
      toast.success('Teacher archived');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive teacher');
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
              <Award size={12} /> Faculty Management
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Teachers</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Live teacher records, portal credentials and faculty profiles for this school.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-muted-foreground"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button>
            <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"><Plus size={15}/> Add Teacher</button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[['Total Teachers', teachers.length, Users], ['Active Faculty', activeCount, UserCheck], ['Qualified Profiles', qualifiedCount, Award], ['Monthly Payroll', money(payroll), Briefcase]].map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"><Icon size={16}/></span></div>
            <p className="mt-3 text-2xl font-black text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teacher, employee ID, email, phone or qualification…" className="h-10 w-full rounded-xl border-0 bg-background pl-9 pr-3 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr><th className="px-5 py-4">Teacher</th><th className="px-5 py-4">Employee</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Qualification</th><th className="px-5 py-4">Experience</th><th className="px-5 py-4">Salary</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-primary"/></td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="p-14 text-center"><Users className="mx-auto mb-3 text-muted-foreground/50" size={28}/><p className="text-sm font-semibold text-muted-foreground">No teacher records found in the live database.</p><p className="mt-1 text-xs text-muted-foreground/70">Add a teacher and the record will appear here automatically.</p></td></tr> : filtered.map((teacher) => (
                <tr key={teacher.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 font-black text-violet-600 dark:text-violet-400"><BookOpen size={17}/></span><div><p className="text-sm font-bold text-foreground">{teacher.name}</p><p className="text-[11px] text-muted-foreground">Joined {dateText(teacher.joiningDate)}</p></div></div></td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{teacher.employeeNo || '—'}</td>
                  <td className="px-5 py-4"><div className="space-y-1 text-xs text-muted-foreground"><div className="flex items-center gap-1.5"><Mail size={12}/>{teacher.email}</div><div className="flex items-center gap-1.5"><Phone size={12}/>{teacher.phone || '—'}</div></div></td>
                  <td className="px-5 py-4 text-xs font-semibold text-foreground">{teacher.qualification || 'Not added'}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{teacher.experience == null ? '—' : `${teacher.experience} yrs`}</td>
                  <td className="px-5 py-4 text-xs font-bold text-foreground">{money(teacher.salary)}</td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${teacher.isActive === false ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>{teacher.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-5 py-4"><div className="flex gap-1.5"><button onClick={() => openEdit(teacher)} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit"><Edit3 size={14}/></button><button onClick={() => void remove(teacher)} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" title="Archive"><Trash2 size={14}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <form onSubmit={save} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Live faculty record</p><h2 className="mt-1 text-2xl font-black text-foreground">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2><p className="mt-1 text-xs text-muted-foreground">Changes are written directly to this school's database.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border p-2 text-muted-foreground"><X size={18}/></button></div>
          <div className="grid gap-4 md:grid-cols-2">
            <input required disabled={Boolean(editing)} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Work email *" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <input required disabled={Boolean(editing)} value={form.employeeNo} onChange={(e) => setForm((p) => ({ ...p, employeeNo: e.target.value }))} placeholder="Employee No *" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: phoneFormat(e.target.value) }))} placeholder="0300-0000000" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
            <input value={form.qualification} onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))} placeholder="Qualification" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <input type="number" min="0" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} placeholder="Experience (years)" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            <input type="number" min="0" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))} placeholder="Monthly salary (PKR)" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none" />
            {!editing && <input required minLength={12} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Portal password (12+ chars) *" className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none md:col-span-2" />}
          </div>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">{saving && <Loader2 size={14} className="animate-spin"/>}{editing ? 'Save Changes' : 'Create Teacher'}</button></div>
        </form>
      </div>}
    </div>
  );
}
