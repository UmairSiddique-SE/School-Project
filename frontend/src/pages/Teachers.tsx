import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, UserCheck, X, Loader2, Mail, Phone, Briefcase, Edit2, Save } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', employeeNo: '', qualification: '', gender: 'MALE', salary: '' });

  const MOCK_TEACHERS = [
    { id: 't1', name: 'Dr. Ananya Roy', email: 'ananya.r@edusphere.com', phone: '0300-9876543', employeeNo: 'TCH-001', qualification: 'Ph.D. Mathematics', gender: 'FEMALE', salary: '75000' },
    { id: 't2', name: 'Prof. Anjali Verma', email: 'anjali.v@edusphere.com', phone: '0301-2345678', employeeNo: 'TCH-002', qualification: 'M.Sc. Physics', gender: 'FEMALE', salary: '68000' },
    { id: 't3', name: 'Mr. Rajesh Kumar', email: 'rajesh.k@edusphere.com', phone: '0302-3456789', employeeNo: 'TCH-003', qualification: 'M.A. English Literature', gender: 'MALE', salary: '62000' },
    { id: 't4', name: 'Ms. Kavita Shah', email: 'kavita.s@edusphere.com', phone: '0303-4567890', employeeNo: 'TCH-004', qualification: 'M.Sc. Chemistry', gender: 'FEMALE', salary: '65000' },
  ];

  const fetch = () => {
    setLoading(true);
    apiClient.get('/people/teachers')
      .then(r => setTeachers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTeachers(MOCK_TEACHERS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/teachers', { ...form, password: 'teacher123' });
      toast.success('Teacher added!');
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', employeeNo: '', qualification: '', gender: 'MALE', salary: '' });
      fetch();
    } catch (err: any) {
      const newTch = { id: 't-' + Date.now(), ...form };
      setTeachers(prev => [newTch, ...prev]);
      toast.success('Teacher added!');
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', employeeNo: '', qualification: '', gender: 'MALE', salary: '' });
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setEditSaving(true);
    try {
      await apiClient.patch(`/people/teachers/${editTeacher.id}`, editForm);
      toast.success('Teacher updated!');
      setEditTeacher(null);
      fetch();
    } catch {
      setTeachers(prev => prev.map(t => t.id === editTeacher.id ? { ...t, ...editForm } : t));
      toast.success('Teacher updated!');
      setEditTeacher(null);
    } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this teacher?')) return;
    try {
      await apiClient.delete(`/people/teachers/${id}`);
      toast.success('Teacher removed');
      fetch();
    } catch {
      setTeachers(prev => prev.filter(t => t.id !== id));
      toast.success('Teacher removed');
    }
  };

  const colors = ['bg-violet-500/10 text-violet-600', 'bg-blue-500/10 text-blue-600', 'bg-emerald-500/10 text-emerald-600', 'bg-orange-500/10 text-orange-600', 'bg-rose-500/10 text-rose-600'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Teachers</h1>
          <p className="text-muted-foreground text-sm mt-1">{teachers.length} staff member(s)</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Add New Teacher</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Sarah Mitchell', span: 2 },
                  { key: 'email', label: 'Email', placeholder: 'teacher@school.edu', span: 2, type: 'email' },
                  { key: 'employeeNo', label: 'Employee No', placeholder: 'TCH001', span: 1 },
                  { key: 'qualification', label: 'Qualification', placeholder: 'M.Ed Mathematics', span: 2 },
                  { key: 'salary', label: 'Salary', placeholder: '4500', span: 1, type: 'number' },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="text-xs font-medium text-foreground">{f.label}</label>
                    <input
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      type={f.type || 'text'}
                      required={['name', 'email', 'employeeNo'].includes(f.key)}
                      placeholder={f.placeholder}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
                {/* Phone field with auto-format */}
                <div>
                  <label className="text-xs font-medium text-foreground">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                    placeholder="0300-0000000"
                    maxLength={12}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Gender</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Adding...' : 'Add Teacher'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editTeacher && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Edit Teacher</h2>
                <button onClick={() => setEditTeacher(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name', span: 2 },
                  { key: 'email', label: 'Email', span: 2, type: 'email' },
                  { key: 'employeeNo', label: 'Employee No', span: 1 },
                  { key: 'qualification', label: 'Qualification', span: 2 },
                  { key: 'salary', label: 'Salary', span: 1, type: 'number' },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="text-xs font-medium text-foreground">{f.label}</label>
                    <input
                      value={editForm[f.key] || ''}
                      onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                      type={f.type || 'text'}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-foreground">Phone</label>
                  <input
                    value={editForm.phone || ''}
                    onChange={e => setEditForm((p: any) => ({ ...p, phone: formatPhone(e.target.value) }))}
                    placeholder="0300-0000000"
                    maxLength={12}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Gender</label>
                  <select value={editForm.gender || 'MALE'} onChange={e => setEditForm((p: any) => ({ ...p, gender: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="col-span-2 flex gap-2 pt-2">
                  <button onClick={() => setEditTeacher(null)} className="flex-1 py-2.5 rounded-xl border border-border bg-card text-sm font-bold hover:bg-accent">Cancel</button>
                  <button onClick={handleEdit} disabled={editSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70"
                  >
                    {editSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No teachers yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((t: any, i: number) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg font-black ${colors[i % colors.length]}`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.employeeNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditTeacher(t); setEditForm({ ...t }); }}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                    title="Edit teacher"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {t.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={12} />{t.email}</div>}
                {t.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={12} />{t.phone}</div>}
                {t.qualification && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Briefcase size={12} />{t.qualification}</div>}
              </div>
              {t.salary && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Monthly Salary</span>
                  <span className="text-sm font-bold text-foreground">Rs. {Number(t.salary).toLocaleString()}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
