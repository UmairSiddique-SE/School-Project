import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Loader2, Search, UserCheck, Phone, Mail,
  Award, Edit2, Briefcase, Calendar, Building2, Users,
  ArrowUpRight, Check, CheckCircle, AlertCircle, User, DollarSign, ShieldCheck
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone?: string | null;
  designation: string;
  department?: string | null;
  salary?: number | null;
  qualification?: string | null;
  gender?: string | null;
  experience?: number | null;
  joiningDate?: string;
  isActive?: boolean;
}

const DESIGNATIONS = ['Teacher', 'Principal', 'Vice Principal', 'Coordinator', 'Accountant', 'Librarian', 'Receptionist', 'IT Administrator', 'Lab Assistant', 'Other'];
const DEPARTMENTS = ['Academics', 'Administration', 'Finance', 'Library', 'IT'];
const DEPT_BY_DESIG: Record<string, string> = {
  Teacher: 'Academics', Principal: 'Administration', 'Vice Principal': 'Administration',
  Coordinator: 'Academics', Accountant: 'Finance', Librarian: 'Library',
  Receptionist: 'Administration', 'IT Administrator': 'IT', 'Lab Assistant': 'Academics', Other: 'Administration',
};

const EMPTY_FORM = {
  name: '', email: '', employeeNo: '', phone: '', designation: 'Teacher',
  department: 'Academics', salary: '', qualification: '', gender: 'MALE', experience: '', password: '',
};

const fmtPhone = (raw: string) => { const d = raw.replace(/\D/g, '').slice(0, 11); return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4)}`; };
const fmtSalary = (v?: number | null) => v == null ? '—' : `PKR ${v.toLocaleString('en-PK')}`;
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const desigColor: Record<string, string> = {
  Teacher: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Principal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Vice Principal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Accountant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Librarian: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const nextNo = (staff: StaffMember[], desig: string) => {
  const prefix = desig === 'Teacher' ? 'TCH' : 'STF';
  const pattern = new RegExp(`^${prefix}-?(\\d+)$`, 'i');
  const nums = staff.map((s) => { const m = s.employeeNo?.match(pattern); return m ? parseInt(m[1], 10) : 0; });
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
};

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [step, setStep] = useState(1);

  const fetchStaff = () => {
    setLoading(true);
    apiClient.get('/people/staff')
      .then((res) => setStaff(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    if (showAdd) setForm((p) => ({ ...p, employeeNo: nextNo(staff, p.designation) }));
  }, [showAdd, staff]);

  const teacherCount = staff.filter((s) => s.designation === 'Teacher').length;
  const officeCount = staff.filter((s) => s.designation !== 'Teacher').length;
  const activeCount = staff.filter((s) => s.isActive !== false).length;
  const totalPayroll = staff.reduce((acc, s) => acc + (s.salary || 0), 0);

  const filtered = useMemo(() => staff.filter((s) => {
    const q = search.toLowerCase();
    const ms = !q || [s.name, s.employeeNo, s.designation, s.department, s.email].some((v) => String(v ?? '').toLowerCase().includes(q));
    const md = designationFilter === 'ALL' || s.designation === designationFilter;
    const mdp = departmentFilter === 'ALL' || s.department === departmentFilter;
    return ms && md && mdp;
  }), [staff, search, designationFilter, departmentFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/staff', {
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
        experience: form.experience ? Number(form.experience) : undefined,
      });
      toast.success('Staff member added successfully!');
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
      setStep(1);
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to add staff member');
    } finally { setSaving(false); }
  };

  const handleDelete = async (s: StaffMember) => {
    if (!window.confirm(`Archive ${s.name}?`)) return;
    try {
      await apiClient.delete(`/people/staff/${s.id}`);
      toast.success('Staff member archived');
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to archive');
    }
  };

  const formSteps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Employment', icon: Briefcase },
    { id: 3, title: 'Review', icon: CheckCircle },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase tracking-widest">Staff Management</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {staff.length} Total Staff Members
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchStaff} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            Refresh
          </button>
          <button onClick={() => { setStep(1); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Staff',
            value: staff.length,
            icon: Users,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Campus personnel',
          },
          {
            label: 'Teaching Faculty',
            value: teacherCount,
            icon: Award,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: 'Active educators',
          },
          {
            label: 'Office Staff',
            value: officeCount,
            icon: Building2,
            gradient: 'from-cyan-500/[0.08] via-card/70 to-card',
            border: 'border-cyan-500/25 hover:border-cyan-500/50',
            glow: 'bg-cyan-500/15 group-hover:bg-cyan-500/25',
            iconBox: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
            labelColor: 'text-cyan-600 dark:text-cyan-400',
            dotColor: 'bg-cyan-500',
            dotPing: 'bg-cyan-400',
            shadow: 'shadow-cyan-500/[0.04] hover:shadow-cyan-500/15',
            subtitle: 'Admin operations',
          },
          {
            label: 'Monthly Payroll',
            value: fmtSalary(totalPayroll),
            icon: DollarSign,
            raw: true,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Estimated monthly',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle, raw }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className={`mt-2 ${raw ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black text-foreground tracking-tight`}>
                  {value}
                </h4>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-card/60 p-4 rounded-[24px] border border-border/80 shadow-sm backdrop-blur-xl">
        <div className="relative lg:col-span-6">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employee ID, email, designation..."
            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-background/80 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium outline-none"
          />
        </div>
        <div className="lg:col-span-3">
          <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}
            className="w-full px-6 py-3.5 rounded-2xl bg-background/80 border border-border text-foreground text-sm focus:border-primary outline-none transition-all font-bold cursor-pointer">
            <option value="ALL">All Designations</option>
            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="lg:col-span-3">
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-6 py-3.5 rounded-2xl bg-background/80 border border-border text-foreground text-sm focus:border-primary outline-none transition-all font-bold cursor-pointer">
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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
              <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20">
                <Users size={48} className="opacity-40" />
              </div>
              <div className="space-y-2">
                <p className="font-black text-3xl text-white tracking-tighter">No staff records found</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Add a staff member to get started</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    <th className="text-left px-8 py-8">Identity</th>
                    <th className="text-left px-8 py-8">Employee ID</th>
                    <th className="text-left px-8 py-8 hidden lg:table-cell">Designation</th>
                    <th className="text-left px-8 py-8 hidden lg:table-cell">Contact</th>
                    <th className="text-left px-8 py-8 hidden xl:table-cell">Salary</th>
                    <th className="text-left px-8 py-8 hidden xl:table-cell">Status</th>
                    <th className="px-8 py-8"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary"
                      onClick={() => setSelectedStaff(s)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight truncate">{s.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              <Calendar size={10} /> Joined {fmtDate(s.joiningDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-xl font-mono text-xs font-black text-slate-400 bg-white/[0.03] border border-white/[0.08] tracking-widest">
                          {s.employeeNo || '—'}
                        </span>
                      </td>
                      <td className="px-8 py-6 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${desigColor[s.designation] || 'bg-white/5 text-slate-400 border-white/10'}`}>
                            {s.designation}
                          </span>
                          {s.department && <span className="text-[10px] text-slate-500 font-bold">{s.department}</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6 hidden lg:table-cell">
                        <div className="space-y-1.5 text-[11px] text-slate-400 font-bold">
                          <div className="flex items-center gap-2"><Mail size={11} />{s.email}</div>
                          <div className="flex items-center gap-2"><Phone size={11} />{s.phone || '—'}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 hidden xl:table-cell">
                        <span className="text-amber-400 font-black text-sm">{fmtSalary(s.salary)}</span>
                      </td>
                      <td className="px-8 py-6 hidden xl:table-cell">
                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border ${s.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {s.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(s)}
                          className="h-11 w-11 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-600 transition-all flex items-center justify-center border border-white/5"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Staff Detail Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedStaff(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="relative p-8 border-b border-white/[0.06] flex items-center gap-6">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-500 to-slate-800 flex items-center justify-center text-white text-3xl font-black border border-white/10">
                  {selectedStaff.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedStaff.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${desigColor[selectedStaff.designation] || 'bg-white/5 text-slate-400 border-white/10'}`}>
                      {selectedStaff.designation}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{selectedStaff.department || ''}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(null)}
                  className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Employee ID', value: selectedStaff.employeeNo },
                  { label: 'Email', value: selectedStaff.email },
                  { label: 'Phone', value: selectedStaff.phone || '—' },
                  { label: 'Gender', value: selectedStaff.gender || '—' },
                  { label: 'Qualification', value: selectedStaff.qualification || '—' },
                  { label: 'Experience', value: selectedStaff.experience != null ? `${selectedStaff.experience} yrs` : '—' },
                  { label: 'Salary', value: fmtSalary(selectedStaff.salary) },
                  { label: 'Joined', value: fmtDate(selectedStaff.joiningDate) },
                  { label: 'Status', value: selectedStaff.isActive !== false ? 'Active' : 'Inactive' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-white truncate">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden">

              <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Staff Management</p>
                  <h2 className="text-2xl font-black text-white mt-1">Register Staff Member</h2>
                </div>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 px-8 py-4 border-b border-white/[0.04]">
                {formSteps.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 ${step >= s.id ? 'bg-primary text-white' : 'bg-white/[0.03] text-slate-700 opacity-50'} ${step === s.id ? 'scale-110 shadow-lg shadow-primary/20' : ''}`}>
                      <s.icon size={12} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${step === s.id ? 'text-white' : 'text-slate-600'}`}>{s.title}</span>
                    {idx < formSteps.length - 1 && <div className={`h-[1px] w-8 rounded-full mx-1 ${step > s.id ? 'bg-primary' : 'bg-white/[0.05]'}`} />}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAdd} className="p-8 space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="st1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Staff member's full name" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email *</label>
                          <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="staff@school.edu" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: fmtPhone(e.target.value) }))}
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
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Qualification</label>
                          <input value={form.qualification} onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))}
                            placeholder="e.g. B.Com, MBA" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="st2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee No</label>
                          <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-amber-500 font-mono font-black text-sm">{form.employeeNo}</div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation *</label>
                          <select required value={form.designation} onChange={(e) => {
                            const d = e.target.value;
                            setForm((p) => ({ ...p, designation: d, department: DEPT_BY_DESIG[d] || 'Administration', employeeNo: nextNo(staff, d) }));
                          }} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold">
                            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                          <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold">
                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Salary (PKR)</label>
                          <input type="number" min="0" value={form.salary} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
                            placeholder="0" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Experience (years)</label>
                          <input type="number" min="0" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                            placeholder="0" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Portal Password (12+ chars) *</label>
                          <input required minLength={12} type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                            placeholder="Minimum 12 characters" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="st3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Name', value: form.name },
                          { label: 'Email', value: form.email },
                          { label: 'Designation', value: form.designation },
                          { label: 'Department', value: form.department },
                          { label: 'Employee No', value: form.employeeNo },
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
                          Staff member <strong className="text-white">{form.name}</strong> will be added and saved to the database.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <button type="button" onClick={() => { if (step > 1) setStep(step - 1); else setShowAdd(false); }}
                    className="px-6 py-2.5 rounded-xl border border-white/[0.1] text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-white/[0.05] hover:text-white transition-all flex items-center gap-2">
                    <X size={14} />{step === 1 ? 'Cancel' : 'Previous'}
                  </button>
                  {step < 3 ? (
                    <button type="button" onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name}
                      className="px-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:border-primary transition-all duration-300 disabled:opacity-30 flex items-center gap-2">
                      Proceed Next <ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <button type="submit" disabled={saving}
                      className="px-14 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center gap-3">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Add Staff Member
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
