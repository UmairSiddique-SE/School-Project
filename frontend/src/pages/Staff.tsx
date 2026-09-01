import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Loader2, Search, UserCheck, Phone, Mail,
  Award, DollarSign, Edit2, Save, Briefcase, Calendar, Building2,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

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
  personType?: 'teacher' | 'staff';
  joiningDate?: string;
  isActive?: boolean;
}

const DESIGNATIONS = [
  'Teacher',
  'Principal',
  'Vice Principal',
  'Coordinator',
  'Accountant',
  'Librarian',
  'Receptionist',
  'IT Administrator',
  'Lab Assistant',
  'Other',
] as const;

const DEPARTMENTS = ['Academics', 'Administration', 'Finance', 'Library', 'IT'] as const;

const DEPARTMENT_BY_DESIGNATION: Record<string, string> = {
  Teacher: 'Academics',
  Principal: 'Administration',
  'Vice Principal': 'Administration',
  Coordinator: 'Academics',
  Accountant: 'Finance',
  Librarian: 'Library',
  Receptionist: 'Administration',
  'IT Administrator': 'IT',
  'Lab Assistant': 'Academics',
  Other: 'Administration',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  employeeNo: '',
  phone: '',
  designation: 'Teacher',
  department: 'Academics',
  salary: '',
  qualification: '',
  gender: 'MALE',
  experience: '',
  password: 'staffpassword',
};

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

function formatSalary(amount?: number | null): string {
  if (amount == null) return '—';
  return `₹${amount.toLocaleString('en-PK')}`;
}

function formatDate(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function nextEmployeeNo(staff: StaffMember[], designation: string): string {
  const prefix = designation === 'Teacher' ? 'TCH' : 'STF';
  const pattern = new RegExp(`^${prefix}-?(\\d+)$`, 'i');
  const nums = staff.map((s) => {
    const match = s.employeeNo?.match(pattern);
    return match ? parseInt(match[1], 10) : 0;
  });
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

function designationBadgeClass(designation: string): string {
  if (designation === 'Teacher') return 'bg-violet-500/10 text-violet-600';
  if (['Principal', 'Vice Principal'].includes(designation)) return 'bg-amber-500/10 text-amber-600';
  if (['Accountant', 'Librarian'].includes(designation)) return 'bg-emerald-500/10 text-emerald-600';
  return 'bg-accent text-accent-foreground';
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchStaff = () => {
    setLoading(true);
    apiClient.get('/people/staff')
      .then(res => setStaff(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load staff list'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    if (showAdd) {
      setForm(prev => ({
        ...prev,
        employeeNo: nextEmployeeNo(staff, prev.designation),
      }));
    }
  }, [showAdd, staff]);

  const teacherCount = staff.filter(s => s.designation === 'Teacher').length;
  const officeCount = staff.filter(s => s.designation !== 'Teacher').length;
  const activeCount = staff.filter(s => s.isActive !== false).length;
  const totalPayroll = staff.reduce((acc, curr) => acc + (curr.salary || 0), 0);

  const filtered = useMemo(() => staff.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.employeeNo.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      (s.department?.toLowerCase().includes(q) ?? false) ||
      s.email.toLowerCase().includes(q);
    const matchesDesignation = designationFilter === 'ALL' || s.designation === designationFilter;
    const matchesDepartment = departmentFilter === 'ALL' || s.department === departmentFilter;
    return matchesSearch && matchesDesignation && matchesDepartment;
  }), [staff, search, designationFilter, departmentFilter]);

  const handleDesignationChange = (designation: string, mode: 'add' | 'edit') => {
    const autoDept = DEPARTMENT_BY_DESIGNATION[designation] || 'Administration';
    if (mode === 'add') {
      setForm(prev => ({
        ...prev,
        designation,
        department: autoDept,
        employeeNo: nextEmployeeNo(staff, designation),
      }));
    } else {
      setEditForm(prev => ({ ...prev, designation, department: autoDept }));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/staff', form);
      toast.success('Staff member registered successfully!');
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
      fetchStaff();
    } catch {
      toast.error('Failed to register staff');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member: StaffMember) => {
    setEditMember(member);
    setEditForm({
      name: member.name || '',
      phone: member.phone || '',
      designation: member.designation || 'Teacher',
      department: member.department || 'Academics',
      qualification: member.qualification || '',
      experience: member.experience != null ? String(member.experience) : '',
      gender: member.gender || 'MALE',
      salary: member.salary != null ? String(member.salary) : '',
      isActive: String(member.isActive !== false),
    });
  };

  const handleEdit = async () => {
    if (!editMember) return;
    setEditSaving(true);
    try {
      await apiClient.patch(`/people/staff/${editMember.id}`, {
        ...editForm,
        salary: editForm.salary ? parseFloat(editForm.salary) : undefined,
        experience: editForm.experience ? parseInt(editForm.experience, 10) : undefined,
        isActive: editForm.isActive === 'true',
      });
      toast.success('Staff details updated!');
      setEditMember(null);
      fetchStaff();
    } catch {
      toast.error('Failed to update staff');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name}?`)) return;
    try {
      await apiClient.delete(`/people/staff/${member.id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  if (showAdd) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glass-elevated border border-white/[0.08] rounded-[32px] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-bg-primary opacity-50" />
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/5">
                <Briefcase size={28} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Staff Registration</h2>
                <p className="text-sm text-slate-400">Onboard new teachers and administrative faculty</p>
             </div>
          </div>
          <button
            onClick={() => setShowAdd(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.05] text-slate-300 font-bold text-xs hover:bg-white/[0.1] transition-all"
          >
            <X size={16} /> Back to Directory
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-6">
          <div className="glass-card rounded-[32px] p-8 border border-white/[0.06] space-y-8 shadow-xl">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm">1</span>
                  <h3 className="text-sm font-black text-white tracking-[0.1em] uppercase">Professional Profile</h3>
                </div>
                <span className="text-xs font-black text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-full border border-primary/15 uppercase">
                  Employee ID: {form.employeeNo}
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Dr. Ananya Roy" className="premium-input-large w-full px-5 py-3.5 rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="name@school.edu.pk" className="premium-input-large w-full px-5 py-3.5 rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))} placeholder="0300-0000000" maxLength={12} className="premium-input-large w-full px-5 py-3.5 rounded-2xl font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation *</label>
                  <select value={form.designation} onChange={e => handleDesignationChange(e.target.value, 'add')} className="premium-input-large w-full px-5 py-3.5 rounded-2xl bg-slate-900">
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department *</label>
                  <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="premium-input-large w-full px-5 py-3.5 rounded-2xl bg-slate-900">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Salary (PKR) *</label>
                  <input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} required placeholder="65000" className="premium-input-large w-full px-5 py-3.5 rounded-2xl text-emerald-400 font-black" />
                </div>
             </div>

             {form.designation === 'Teacher' && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/[0.04]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Qualification</label>
                    <input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} placeholder="M.Sc. Physics" className="premium-input-large w-full px-5 py-3.5 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input type="number" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} placeholder="5" className="premium-input-large w-full px-5 py-3.5 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="premium-input-large w-full px-5 py-3.5 rounded-2xl bg-slate-900">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
               </div>
             )}

             <div className="pt-4 border-t border-white/[0.04] space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Portal Security Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required className="premium-input-large w-full px-5 py-3.5 rounded-2xl" />
                <p className="text-[10px] text-amber-500/80 italic ml-1">This will be the employee's initial login password for the EduSphere Staff Portal.</p>
             </div>
          </div>

          <div className="flex items-center justify-end gap-4 p-8 border-t border-white/[0.08] mt-8 pb-12">
             <button type="button" onClick={() => setShowAdd(false)} className="px-10 py-4 rounded-2xl border border-white/[0.1] text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/[0.05] transition-all">Cancel</button>
             <button type="submit" disabled={saving} className="btn-primary px-12 py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2">
               {saving ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
               <span>Register Staff Member</span>
             </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {staff.length} total · {teacherCount} teachers · {officeCount} office staff · {activeCount} active
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Total Staff</p>
            <p className="text-2xl font-black text-foreground">{staff.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Teachers</p>
            <p className="text-2xl font-black text-foreground">{teacherCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Office Staff</p>
            <p className="text-2xl font-black text-foreground">{officeCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Monthly Payroll</p>
            <p className="text-2xl font-black text-foreground">{formatSalary(totalPayroll)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={designationFilter}
          onChange={e => setDesignationFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All Designations</option>
          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 hover:shadow-lg transition-all relative group"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base uppercase shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-sm truncate">{s.name}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{s.employeeNo}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${designationBadgeClass(s.designation)}`}>
                    {s.designation}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    s.isActive === false ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {s.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="shrink-0" />
                  <span>{s.department || '—'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.qualification && (
                  <div className="flex items-center gap-2">
                    <Award size={13} className="shrink-0" />
                    <span>{s.qualification}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="shrink-0" />
                  <span>Joined {formatDate(s.joiningDate)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 mt-3 pt-2">
                  <span className="font-semibold text-foreground/80">Monthly Salary</span>
                  <span className="font-bold text-foreground">{formatSalary(s.salary)}</span>
                </div>
              </div>

              <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                  title="Edit staff member"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                  title="Remove staff member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <UserCheck size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">No staff members found</p>
              <p className="text-xs mt-1">Adjust your filters or add a new staff member.</p>
            </div>
          )}
        </div>
      )}



      {/* Edit Modal */}
      <Modal isOpen={!!editMember} onClose={() => setEditMember(null)} maxWidth="max-w-lg">
        {editMember && (
          <div className="p-6">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <div>
                  <h2 className="text-lg font-black text-foreground">Edit Staff Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{editMember.employeeNo} · {editMember.email}</p>
                </div>
                <button onClick={() => setEditMember(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Status</label>
                    <select
                      value={editForm.isActive}
                      onChange={e => setEditForm(p => ({ ...p, isActive: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  {editMember.personType === 'staff' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Designation</label>
                        <select
                          value={editForm.designation}
                          onChange={e => handleDesignationChange(e.target.value, 'edit')}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {DESIGNATIONS.filter(d => d !== 'Teacher').map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Department</label>
                        <select
                          value={editForm.department}
                          onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  {(editMember.personType === 'teacher' || editMember.designation === 'Teacher') && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Qualification</label>
                        <input
                          value={editForm.qualification}
                          onChange={e => setEditForm(p => ({ ...p, qualification: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Experience (years)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.experience}
                          onChange={e => setEditForm(p => ({ ...p, experience: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Gender</label>
                        <select
                          value={editForm.gender}
                          onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Monthly Salary (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.salary}
                      onChange={e => setEditForm(p => ({ ...p, salary: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditMember(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-accent transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={editSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
                  >
                    {editSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
