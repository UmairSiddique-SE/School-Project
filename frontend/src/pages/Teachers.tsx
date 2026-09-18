import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, BookOpen, Briefcase, Edit2, Loader2, Mail, Phone, Plus, RefreshCw,
  Search, Trash2, UserCheck, Users, X, Check, ArrowUpRight, Shield,
  GraduationCap, Fingerprint, Calendar, Save, CheckCircle, AlertCircle, User
} from 'lucide-react';
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
  specialization?: string | null;
  dateOfBirth?: string | null;
  cnic?: string | null;
  address?: string | null;
}

const initialForm = {
  name: '', email: '', employeeNo: '', phone: '', gender: 'MALE',
  qualification: '', experience: '', salary: '', password: '',
  specialization: '', cnic: '', address: '', dateOfBirth: '',
};

const phoneFormat = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
};
const cnicFormat = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
};

const money = (value?: number | null) => value == null ? '—' : `PKR ${Number(value).toLocaleString('en-PK')}`;
const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ ...initialForm });
  const [step, setStep] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/people/teachers');
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      const matchesSearch = !q || [t.name, t.email, t.employeeNo, t.phone, t.qualification]
        .some((v) => String(v ?? '').toLowerCase().includes(q));
      const matchesStatus = !filterStatus ||
        (filterStatus === 'ACTIVE' ? t.isActive !== false : t.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [teachers, query, filterStatus]);

  const activeCount = teachers.filter((t) => t.isActive !== false).length;
  const qualifiedCount = teachers.filter((t) => Boolean(t.qualification)).length;
  const payroll = teachers.reduce((sum, t) => sum + Number(t.salary || 0), 0);

  const openAdd = () => {
    setEditing(null);
    const nextNo = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
    setForm({ ...initialForm, employeeNo: nextNo });
    setStep(1);
    setShowForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name || '', email: t.email || '', employeeNo: t.employeeNo || '',
      phone: t.phone || '', gender: t.gender || 'MALE', qualification: t.qualification || '',
      experience: t.experience == null ? '' : String(t.experience),
      salary: t.salary == null ? '' : String(t.salary), password: '',
      specialization: t.specialization || '', cnic: t.cnic || '',
      address: t.address || '', dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : '',
    });
    setStep(1);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/people/teachers/${editing.id}`, {
          name: form.name, phone: form.phone, gender: form.gender,
          qualification: form.qualification, specialization: form.specialization,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          cnic: form.cnic || undefined, address: form.address || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
        });
        toast.success('Teacher profile updated successfully');
      } else {
        if (form.password.length < 12) throw new Error('Portal password must be at least 12 characters');
        await apiClient.post('/people/teachers', {
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
        });
        toast.success('Teacher added and portal credentials created!');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...initialForm });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Unable to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Teacher) => {
    if (!window.confirm(`Archive ${t.name}?`)) return;
    try {
      await apiClient.delete(`/people/teachers/${t.id}`);
      toast.success('Teacher archived successfully');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to archive teacher');
    }
  };

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Employment', icon: Briefcase },
    { id: 3, title: 'Review', icon: CheckCircle },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase tracking-widest">Faculty Registry</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {teachers.length} Total Faculty Members
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <Plus size={14} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Faculty',
            value: teachers.length,
            icon: Users,
            gradient: 'from-violet-950/40 via-slate-900/90 to-slate-950',
            border: 'border-violet-500/30 hover:border-violet-400/50',
            iconBg: 'bg-violet-500/15 border-violet-500/30',
            iconColor: 'text-violet-400',
            labelColor: 'text-violet-400/90',
            shadow: 'shadow-violet-950/20',
          },
          {
            label: 'Active Staff',
            value: activeCount,
            icon: UserCheck,
            gradient: 'from-emerald-950/40 via-slate-900/90 to-slate-950',
            border: 'border-emerald-500/30 hover:border-emerald-400/50',
            iconBg: 'bg-emerald-500/15 border-emerald-500/30',
            iconColor: 'text-emerald-400',
            labelColor: 'text-emerald-400/90',
            shadow: 'shadow-emerald-950/20',
          },
          {
            label: 'Qualified',
            value: qualifiedCount,
            icon: Award,
            gradient: 'from-cyan-950/40 via-slate-900/90 to-slate-950',
            border: 'border-cyan-500/30 hover:border-cyan-400/50',
            iconBg: 'bg-cyan-500/15 border-cyan-500/30',
            iconColor: 'text-cyan-400',
            labelColor: 'text-cyan-400/90',
            shadow: 'shadow-cyan-950/20',
          },
          {
            label: 'Monthly Payroll',
            value: money(payroll),
            icon: Briefcase,
            raw: true,
            gradient: 'from-amber-950/40 via-slate-900/90 to-slate-950',
            border: 'border-amber-500/30 hover:border-amber-400/50',
            iconBg: 'bg-amber-500/15 border-amber-500/30',
            iconColor: 'text-amber-400',
            labelColor: 'text-amber-400/90',
            shadow: 'shadow-amber-950/20',
          },
        ].map(({ label, value, icon: Icon, gradient, border, iconBg, iconColor, labelColor, shadow, raw }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className={`mt-2 ${raw ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black text-white tracking-tight`}>
                  {value}
                </h4>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg} border ${iconColor} shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${iconColor.replace('text-', 'bg-')}`} />
              Faculty record
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/[0.02] p-4 rounded-[24px] border border-white/[0.06]">
        <div className="relative lg:col-span-8">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee ID, email, phone or qualification..."
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          />
        </div>
        <div className="lg:col-span-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary outline-none transition-all font-bold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Faculty</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={48} className="animate-spin text-primary" /></div>
      ) : (
        <div className="glass-elevated border border-white/[0.06] rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
          {filtered.length === 0 ? (
            <div className="text-center py-40 space-y-6">
              <div className="h-24 w-24 rounded-[32px] bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto border border-violet-500/20">
                <GraduationCap size={48} className="opacity-40" />
              </div>
              <div className="space-y-2">
                <p className="font-black text-3xl text-white tracking-tighter">No faculty records</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Add a teacher to get started</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    <th className="text-left px-8 py-8">Identity</th>
                    <th className="text-left px-8 py-8">Employee ID</th>
                    <th className="text-left px-8 py-8 hidden lg:table-cell">Contact</th>
                    <th className="text-left px-8 py-8 hidden lg:table-cell">Qualification</th>
                    <th className="text-left px-8 py-8 hidden xl:table-cell">Experience</th>
                    <th className="text-left px-8 py-8">Salary</th>
                    <th className="text-left px-8 py-8 hidden xl:table-cell">Status</th>
                    <th className="px-8 py-8"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-violet-500"
                      onClick={() => setSelectedTeacher(t)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10">
                            {t.name.charAt(0)}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-lg font-black text-white group-hover:text-violet-400 transition-colors tracking-tight truncate">{t.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              <Calendar size={10} /> Joined {dateText(t.joiningDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-xl font-mono text-xs font-black text-violet-400 bg-violet-400/5 border border-violet-400/10 tracking-widest">
                          {t.employeeNo || '—'}
                        </span>
                      </td>
                      <td className="px-8 py-6 hidden lg:table-cell">
                        <div className="space-y-1.5 text-[11px] text-slate-400 font-bold">
                          <div className="flex items-center gap-2"><Mail size={11} />{t.email}</div>
                          <div className="flex items-center gap-2"><Phone size={11} />{t.phone || '—'}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 hidden lg:table-cell">
                        <span className="text-white font-black text-sm">{t.qualification || 'Not added'}</span>
                        {t.specialization && <p className="text-[10px] text-slate-500 mt-1">{t.specialization}</p>}
                      </td>
                      <td className="px-8 py-6 hidden xl:table-cell">
                        <span className="text-slate-300 font-bold text-sm">
                          {t.experience == null ? '—' : `${t.experience} yrs`}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-amber-400 font-black text-sm">{money(t.salary)}</span>
                      </td>
                      <td className="px-8 py-6 hidden xl:table-cell">
                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border shadow-lg ${
                          t.isActive !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {t.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(t)}
                            className="h-11 w-11 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-violet-600 transition-all flex items-center justify-center border border-white/5"
                            title="Edit Teacher"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => void remove(t)}
                            className="h-11 w-11 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-600 transition-all flex items-center justify-center border border-white/5"
                            title="Archive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Teacher Detail Modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedTeacher(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-8 border-b border-white/[0.06] flex items-center gap-6">
                <div className="absolute top-0 right-0 h-40 w-40 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black border border-white/10">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedTeacher.name}</h2>
                  <p className="text-xs font-mono text-violet-400 font-black tracking-widest mt-1 uppercase bg-violet-500/10 px-3 py-1 rounded-lg inline-block border border-violet-500/20">
                    {selectedTeacher.employeeNo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelectedTeacher(null); openEdit(selectedTeacher); }}
                    className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center hover:bg-violet-500 hover:text-white transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setSelectedTeacher(null)}
                    className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Email', value: selectedTeacher.email, icon: Mail },
                  { label: 'Phone', value: selectedTeacher.phone || '—', icon: Phone },
                  { label: 'Gender', value: selectedTeacher.gender || '—', icon: User },
                  { label: 'CNIC', value: selectedTeacher.cnic || '—', icon: Fingerprint },
                  { label: 'Qualification', value: selectedTeacher.qualification || '—', icon: GraduationCap },
                  { label: 'Specialization', value: selectedTeacher.specialization || '—', icon: BookOpen },
                  { label: 'Experience', value: selectedTeacher.experience != null ? `${selectedTeacher.experience} years` : '—', icon: Award },
                  { label: 'Monthly Salary', value: money(selectedTeacher.salary), icon: Briefcase },
                  { label: 'Status', value: selectedTeacher.isActive !== false ? 'Active' : 'Inactive', icon: Shield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <Icon size={10} />{label}
                    </div>
                    <p className="text-sm font-bold text-white truncate">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Faculty Management</p>
                  <h2 className="text-2xl font-black text-white mt-1">{editing ? 'Edit Teacher Profile' : 'Register New Teacher'}</h2>
                </div>
                <button type="button" onClick={() => setShowForm(false)}
                  className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 px-8 py-4 border-b border-white/[0.04]">
                {steps.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        step >= s.id ? 'bg-primary text-white' : 'bg-white/[0.03] text-slate-700 opacity-50'
                      } ${step === s.id ? 'scale-110 shadow-lg shadow-primary/20' : ''}`}
                    >
                      <s.icon size={12} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${step === s.id ? 'text-white' : 'text-slate-600'}`}>{s.title}</span>
                    {idx < steps.length - 1 && <div className={`h-[1px] w-8 rounded-full mx-1 ${step > s.id ? 'bg-primary' : 'bg-white/[0.05]'}`} />}
                  </div>
                ))}
              </div>

              <form onSubmit={save} className="p-8 space-y-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Personal Info */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <User size={12} className="text-primary" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Personal Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                          <input required disabled={!!editing} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Teacher's full name" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email *</label>
                          <input required type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="name@school.edu" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: phoneFormat(e.target.value) }))}
                            placeholder="0300-0000000" maxLength={12} className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                          <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold">
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">CNIC</label>
                          <input value={form.cnic} onChange={(e) => setForm((p) => ({ ...p, cnic: cnicFormat(e.target.value) }))}
                            placeholder="35202-xxxxxxx-x" maxLength={15} className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Birth</label>
                          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
                          <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                            placeholder="Residential address" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Employment */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <Briefcase size={12} className="text-emerald-400" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Employment Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee No *</label>
                          <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-amber-500 font-mono font-black text-sm">
                            {form.employeeNo || 'Generating...'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Qualification *</label>
                          <input value={form.qualification} onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))}
                            placeholder="e.g. M.Ed, B.Sc, MA" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Specialization</label>
                          <input value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                            placeholder="e.g. Mathematics, Physics" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Experience (years)</label>
                          <input type="number" min="0" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                            placeholder="0" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Salary (PKR)</label>
                          <input type="number" min="0" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
                            placeholder="0" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                        </div>
                        {!editing && (
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Portal Password (12+ chars) *</label>
                            <input required minLength={12} type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                              placeholder="Minimum 12 characters" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <CheckCircle size={12} className="text-primary" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Final Review</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Name', value: form.name },
                          { label: 'Email', value: form.email },
                          { label: 'Employee No', value: form.employeeNo },
                          { label: 'Phone', value: form.phone || '—' },
                          { label: 'Gender', value: form.gender },
                          { label: 'Qualification', value: form.qualification || '—' },
                          { label: 'Specialization', value: form.specialization || '—' },
                          { label: 'Experience', value: form.experience ? `${form.experience} yrs` : '—' },
                          { label: 'Salary', value: form.salary ? `PKR ${Number(form.salary).toLocaleString()}` : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                            <p className="text-sm font-bold text-white mt-1 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                        <AlertCircle size={20} className="text-primary shrink-0" />
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          By confirming, a teacher portal account will be created for <strong className="text-white">{form.name}</strong> and credentials saved to the database.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <button type="button"
                    onClick={() => { if (step > 1) setStep(step - 1); else setShowForm(false); }}
                    className="px-6 py-2.5 rounded-xl border border-white/[0.1] text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-white/[0.05] hover:text-white transition-all flex items-center gap-2">
                    <X size={14} />{step === 1 ? 'Cancel' : 'Previous'}
                  </button>
                  {step < 3 ? (
                    <button type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && !form.name}
                      className="px-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:border-primary transition-all duration-300 disabled:opacity-30 flex items-center gap-2">
                      Proceed Next <ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <button type="submit" disabled={saving}
                      className="px-14 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center gap-3">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {editing ? 'Save Changes' : 'Create Teacher'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
