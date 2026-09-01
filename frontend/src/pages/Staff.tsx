import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShieldAlert, X, Loader2, Search, UserCheck, Phone, Mail, Award, DollarSign } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export default function Staff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeNo: '',
    phone: '',
    designation: 'Receptionist',
    department: 'Administration',
    salary: '',
    password: 'staffpassword'
  });

  const fetchStaff = () => {
    setLoading(true);
    apiClient.get('/people/staff')
      .then(res => setStaff(res.data))
      .catch(() => toast.error('Failed to load staff list'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/staff', form);
      toast.success('Staff member registered successfully!');
      setShowAdd(false);
      setForm({
        name: '',
        email: '',
        employeeNo: '',
        phone: '',
        designation: 'Receptionist',
        department: 'Administration',
        salary: '',
        password: 'staffpassword'
      });
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add staff member');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member? This will also disable their login portal access.')) return;
    try {
      await apiClient.delete(`/people/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch { toast.error('Failed to remove staff member'); }
  };

  const filtered = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
                          s.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDesignation = designationFilter === 'ALL' || s.designation === designationFilter;
    return matchesSearch && matchesDesignation;
  });

  const designations = ['Receptionist', 'Accountant', 'Librarian', 'Driver', 'Peon', 'Cleaner', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{staff.length} registered staff member(s)</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Stats Cards */}
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
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Monthly Payroll</p>
            <p className="text-2xl font-black text-foreground">
              ${staff.reduce((acc, curr) => acc + (curr.salary || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Administrators</p>
            <p className="text-2xl font-black text-foreground">
              {staff.filter(s => ['Accountant', 'Librarian'].includes(s.designation)).length}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold">Support Staff</p>
            <p className="text-2xl font-black text-foreground">
              {staff.filter(s => ['Driver', 'Peon', 'Cleaner'].includes(s.designation)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, employee code..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
          />
        </div>
        <select value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="ALL">All Roles</option>
          {designations.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Grid List */}
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
              className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 hover:shadow-lg transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base uppercase">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{s.employeeNo}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">
                  {s.designation}
                </span>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail size={13} />
                  <span>{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} />
                    <span>{s.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border/40 mt-3 pt-2">
                  <span className="font-semibold text-foreground/80">Salary:</span>
                  <span className="font-bold text-foreground">${s.salary || '—'}</span>
                </div>
              </div>

              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(s.id)}
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
              <p className="text-xs mt-1">Try expanding your search query or add a new staff member.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} 
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Add New Staff Member</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Jane Doe" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Email Address (Login Username)</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="jane.doe@school.edu" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Employee Code</label>
                    <input value={form.employeeNo} onChange={e => setForm(p => ({ ...p, employeeNo: e.target.value }))}
                      placeholder="STF042" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Phone Number</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 019-2834"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Designation</label>
                    <select value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {designations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Monthly Salary</label>
                    <input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                      placeholder="3500" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Temporary Password</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Enter a default password" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Registering...' : 'Register Staff Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
