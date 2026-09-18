import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Loader2, Mail, Phone, Plus, RefreshCw, Search,
  UserRound, UsersRound, X, User, Heart, Link, Users,
  Check, ArrowUpRight, AlertCircle, GraduationCap, CheckCircle
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Parent = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relation?: string;
  students?: Array<{
    student?: {
      id: string;
      name: string;
      admissionNo?: string;
      section?: { name?: string; class?: { name?: string } };
    };
  }>;
};

const phoneFormat = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

export default function Parents() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Parent | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', relation: 'FATHER', password: '', studentId: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        apiClient.get('/people/parents'),
        apiClient.get('/people/students'),
      ]);
      setParents(Array.isArray(pRes.data) ? pRes.data : []);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load parent data');
      setParents([]); setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parents.filter((p) =>
      !q || `${p.name} ${p.email || ''} ${p.phone || ''} ${p.relation || ''}`.toLowerCase().includes(q)
    );
  }, [parents, query]);

  const linkedChildren = parents.reduce((sum, p) => sum + (p.students?.length || 0), 0);
  const withChildren = parents.filter((p) => (p.students?.length || 0) > 0).length;

  const createParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/parents', {
        ...form,
        password: form.password || `${form.name.replace(/\s+/g, '').slice(0, 5)}${Math.random().toString(36).slice(2, 8)}!9a`,
      });
      toast.success('Parent account created and synced to the database!');
      setForm({ name: '', email: '', phone: '', relation: 'FATHER', password: '', studentId: '' });
      setShowAdd(false);
      setStep(1);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to create parent');
    } finally {
      setSaving(false);
    }
  };

  const formSteps = [
    { id: 1, title: 'Parent Info', icon: User },
    { id: 2, title: 'Link & Access', icon: Link },
    { id: 3, title: 'Review', icon: CheckCircle },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase tracking-widest">Parent Registry</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {parents.length} Total Parent Accounts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => void load()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { setStep(1); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <Plus size={14} /> Add Parent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Parents',
            value: parents.length,
            icon: UsersRound,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Registered accounts',
          },
          {
            label: 'With Children',
            value: withChildren,
            icon: Heart,
            gradient: 'from-rose-500/[0.08] via-card/70 to-card',
            border: 'border-rose-500/25 hover:border-rose-500/50',
            glow: 'bg-rose-500/15 group-hover:bg-rose-500/25',
            iconBox: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
            labelColor: 'text-rose-600 dark:text-rose-400',
            dotColor: 'bg-rose-500',
            dotPing: 'bg-rose-400',
            shadow: 'shadow-rose-500/[0.04] hover:shadow-rose-500/15',
            subtitle: 'Family profiles active',
          },
          {
            label: 'Linked Students',
            value: linkedChildren,
            icon: GraduationCap,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: 'Enrolled wards linked',
          },
          {
            label: 'Unlinked Parents',
            value: parents.length - withChildren,
            icon: UserRound,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Pending student link',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">
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

      {/* Search Bar */}
      <div className="bg-card/60 p-4 rounded-[24px] border border-border/80 shadow-sm backdrop-blur-xl">
        <div className="relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone or relation..."
            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-background/80 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium outline-none"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={48} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-40 space-y-6">
          <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20">
            <UsersRound size={48} className="opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="font-black text-3xl text-white tracking-tighter">No parent records</p>
            <p className="text-sm text-slate-500 uppercase tracking-widest">Add a parent account to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(p)}
              className="text-left glass-elevated p-6 rounded-[28px] border border-white/[0.06] bg-white/[0.01] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Card Header */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-rose-600 flex items-center justify-center text-white text-2xl font-black border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-lg tracking-tight truncate group-hover:text-violet-400 transition-colors">{p.name}</p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.06]">
                    {p.relation || 'Parent'}
                  </span>
                </div>
                <Eye size={16} className="text-slate-600 group-hover:text-primary transition-colors shrink-0" />
              </div>

              {/* Contact */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                  <Mail size={12} className="text-slate-600 shrink-0" />
                  <span className="truncate">{p.email || 'No email on record'}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                  <Phone size={12} className="text-slate-600 shrink-0" />
                  <span>{p.phone || 'No phone on record'}</span>
                </div>
              </div>

              {/* Linked Students */}
              <div className="mt-5 pt-4 border-t border-white/[0.05]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Linked Students ({p.students?.length || 0})
                </p>
                {p.students?.slice(0, 2).map(({ student }) =>
                  student ? (
                    <div key={student.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-2">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-black text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{student.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold">
                          {student.admissionNo || '—'} • {student.section?.class?.name || 'Not assigned'}
                        </p>
                      </div>
                    </div>
                  ) : null
                )}
                {!p.students?.length && (
                  <p className="text-xs text-slate-600 font-bold">No linked student yet</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Parent Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-8 border-b border-white/[0.06] flex items-center gap-6">
                <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 to-rose-600 flex items-center justify-center text-white text-3xl font-black border border-white/10">
                  {selected.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-white tracking-tight">{selected.name}</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {selected.relation || 'Parent'} • {selected.email || 'No email'}
                  </p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="h-10 w-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Info Grid */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Phone', value: selected.phone || '—' },
                    { label: 'Relation', value: selected.relation || '—' },
                    { label: 'Email', value: selected.email || '—' },
                    { label: 'Children', value: String(selected.students?.length || 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-bold text-white mt-1 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Linked Students</p>
                  {selected.students?.length ? (
                    <div className="space-y-3">
                      {selected.students.map(({ student }) =>
                        student ? (
                          <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-black">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm text-white">{student.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold">
                                {student.admissionNo || '—'} • {student.section?.class?.name || 'Not assigned'} / {student.section?.name || '—'}
                              </p>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-white/[0.08] text-center text-sm text-slate-500 font-bold">
                      No linked students yet
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Parent Modal (Multi-step) */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-slate-950/95 border border-white/[0.08] rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">People Management</p>
                  <h2 className="text-2xl font-black text-white mt-1">Register Parent Account</h2>
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

              <form onSubmit={createParent} className="p-8 space-y-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Parent Info */}
                  {step === 1 && (
                    <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <User size={12} className="text-primary" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Parent Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Parent's full name" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Relation</label>
                          <select value={form.relation} onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold">
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="GUARDIAN">Guardian</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: phoneFormat(e.target.value) }))}
                            placeholder="0300-0000000" maxLength={12} className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="parent@example.com" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Link & Access */}
                  {step === 2 && (
                    <motion.div key="p2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <Link size={12} className="text-violet-400" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Link & Portal Access</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Student (Optional)</label>
                          <select value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold">
                            <option value="">No student yet</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>{s.name} {s.admissionNo ? `• ${s.admissionNo}` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Portal Password (12+ chars)</label>
                          <input type="password" minLength={12} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                            placeholder="Leave blank to auto-generate" className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold" />
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                          <AlertCircle size={18} className="text-amber-400 shrink-0" />
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            If password is left blank, a secure password will be auto-generated and displayed after creation.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <motion.div key="p3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                        <CheckCircle size={12} className="text-primary" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Final Review</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Name', value: form.name },
                          { label: 'Relation', value: form.relation },
                          { label: 'Email', value: form.email || '—' },
                          { label: 'Phone', value: form.phone || '—' },
                          { label: 'Linked Student', value: form.studentId ? (students.find((s) => s.id === form.studentId)?.name || '—') : 'None' },
                          { label: 'Password', value: form.password ? '••••••••••••' : 'Auto-generated' },
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
                          A portal account will be created for <strong className="text-white">{form.name}</strong> and saved to the database.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <button type="button"
                    onClick={() => { if (step > 1) setStep(step - 1); else setShowAdd(false); }}
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
                      Create Parent
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
