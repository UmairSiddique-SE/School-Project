import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, X, Loader2, Zap, Award, Crown, Users, GraduationCap, HardDrive, Headphones, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const UNLIMITED = 999999;
type Plan = { id: string; planKey: string; name: string; price: number; currency: string; period: string; maxStudents: number; maxTeachers: number; storageMb: number; supportTier: string; features: string[]; isActive?: boolean };
type FormState = { name: string; price: string; period: string; maxStudents: string; maxTeachers: string; storageMb: string; supportTier: string; features: string };
const EMPTY: FormState = { name: '', price: '', period: 'per month', maxStudents: '', maxTeachers: '', storageMb: '', supportTier: '', features: '' };
const META: Record<string, { icon: React.ComponentType<any>; gradient: string; accent: string; badge?: string }> = {
  FREE_TRIAL: { icon: Zap, gradient: 'from-cyan-500 to-blue-600', accent: 'text-cyan-600 dark:text-cyan-300' },
  PROFESSIONAL: { icon: Award, gradient: 'from-blue-600 to-indigo-700', accent: 'text-blue-600 dark:text-blue-300', badge: 'MOST POPULAR' },
  PREMIUM: { icon: Crown, gradient: 'from-emerald-500 to-teal-700', accent: 'text-emerald-600 dark:text-emerald-300', badge: 'BEST VALUE' },
};
function storageLabel(mb: number) { return mb >= 512000 ? '500 GB' : mb >= 1024 ? `${Math.round(mb / 1024)} GB` : `${mb} MB`; }
function limitLabel(value: number) { return value >= UNLIMITED ? 'Unlimited' : value.toLocaleString(); }

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [unlimited, setUnlimited] = useState({ students: false, staff: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setLoading(true); const { data } = await apiClient.get<Plan[]>('/admin/plans'); setPlans(data || []); }
    catch { toast.error('Unable to load plans from the database.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const sorted = useMemo(() => [...plans].sort((a, b) => a.price - b.price), [plans]);

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({ name: plan.name, price: String(plan.price), period: plan.period, maxStudents: String(plan.maxStudents), maxTeachers: String(plan.maxTeachers), storageMb: String(plan.storageMb), supportTier: plan.supportTier, features: (plan.features || []).join('\n') });
    setUnlimited({ students: plan.maxStudents >= UNLIMITED, staff: plan.maxTeachers >= UNLIMITED });
  };

  const save = async () => {
    if (!editing) return;
    const payload = { name: form.name.trim(), price: Number(form.price), period: form.period.trim(), maxStudents: unlimited.students ? UNLIMITED : Number(form.maxStudents), maxTeachers: unlimited.staff ? UNLIMITED : Number(form.maxTeachers), storageMb: Number(form.storageMb), supportTier: form.supportTier.trim(), features: form.features.split('\n').map((x) => x.trim()).filter(Boolean) };
    if (!payload.name || !payload.period || !payload.supportTier || !Number.isFinite(payload.price) || payload.price < 0 || !Number.isFinite(payload.maxStudents) || payload.maxStudents < 1 || !Number.isFinite(payload.maxTeachers) || payload.maxTeachers < 1 || !Number.isFinite(payload.storageMb) || payload.storageMb < 1 || payload.features.length === 0) { toast.error('Please complete every plan field.'); return; }
    try { setSaving(true); await apiClient.put(`/admin/plan-catalog/${editing.id}`, payload); toast.success(`${payload.name} saved to the database.`); setEditing(null); await load(); }
    catch { toast.error('Plan could not be saved.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-[420px] flex items-center justify-center"><div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-muted-foreground"><Loader2 size={18} className="animate-spin text-primary"/>Loading live plans...</div></div>;

  return <div className="space-y-7 pb-10">
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-cyan-500/10 via-card to-indigo-500/10 p-7 shadow-sm"><div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"/><div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"/><div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-primary"><Plus size={11}/>Live catalogue</span><h2 className="mt-3 text-3xl font-black text-foreground">Plans & Pricing</h2><p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Price, period, student/staff limits, storage, support and landing-page feature lines are all editable.</p></div><div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-xs font-semibold text-muted-foreground">Saved values are used by the public pricing API.</div></div></div>

    {sorted.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">No plans found.</div> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">{sorted.map((plan, index) => { const style = META[plan.planKey] || META.PROFESSIONAL; const Icon = style.icon; return <motion.article key={plan.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }} className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-2xl"><div className={`relative bg-gradient-to-br ${style.gradient} p-6 text-white`}>{style.badge && <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black tracking-wider">{style.badge}</span>}<Icon size={30} className="mb-5"/><p className="text-xs font-bold uppercase tracking-[.2em] text-white/75">{plan.planKey.replace('_',' ')}</p><h3 className="mt-1 text-2xl font-black">{plan.name}</h3><div className="mt-4 flex items-end gap-1"><span className="text-4xl font-black">{plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}`}</span><span className="mb-1 text-xs text-white/70">{plan.price === 0 ? plan.period : `/${plan.period.replace(/^per /,'')}`}</span></div></div><div className="space-y-5 p-6"><div className="grid grid-cols-2 gap-2.5"><div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><GraduationCap className={`mx-auto mb-1 ${style.accent}`} size={16}/><p className="text-sm font-black text-foreground">{limitLabel(plan.maxStudents)}</p><p className="text-[10px] text-muted-foreground">Students</p></div><div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><Users className={`mx-auto mb-1 ${style.accent}`} size={16}/><p className="text-sm font-black text-foreground">{limitLabel(plan.maxTeachers)}</p><p className="text-[10px] text-muted-foreground">Staff</p></div><div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><HardDrive className={`mx-auto mb-1 ${style.accent}`} size={16}/><p className="text-sm font-black text-foreground">{storageLabel(plan.storageMb)}</p><p className="text-[10px] text-muted-foreground">Storage</p></div><div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><Headphones className={`mx-auto mb-1 ${style.accent}`} size={16}/><p className="truncate text-sm font-black text-foreground">{plan.supportTier}</p><p className="text-[10px] text-muted-foreground">Support</p></div></div><div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Landing page features</p><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{plan.features?.length || 0}</span></div><ul className="space-y-2">{(plan.features || []).map((feature, i) => <li key={`${feature}-${i}`} className="flex gap-2 text-xs leading-5 text-muted-foreground"><Check size={14} className={`mt-0.5 shrink-0 ${style.accent}`}/>{feature}</li>)}</ul></div><button onClick={() => openEdit(plan)} className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${style.accent} hover:bg-muted`}><Edit3 size={15}/>Full Edit — Price, Limits & Features</button></div></motion.article>;})}</div>}

    <AnimatePresence>{editing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"><motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-border pb-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Full plan editor</p><h3 className="mt-1 text-2xl font-black text-foreground">Edit {editing.name}</h3></div><button onClick={() => setEditing(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18}/></button></div><div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {([['Plan Name','name','text'],['Price (PKR)','price','number'],['Billing / Period','period','text'],['Support Tier','supportTier','text'],['Max Students','maxStudents','number'],['Max Staff','maxTeachers','number'],['Storage (MB)','storageMb','number']] as const).map(([label,key,type]) => <label key={key} className="text-xs font-bold text-foreground">{label}<input type={type} min={type === 'number' ? '0' : undefined} value={form[key]} disabled={(key === 'maxStudents' && unlimited.students) || (key === 'maxTeachers' && unlimited.staff)} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"/></label>)}
      <div className="flex items-end gap-2"><button type="button" onClick={() => setUnlimited((p) => ({ ...p, students: !p.students }))} className={`w-full rounded-xl border px-3 py-3 text-xs font-black ${unlimited.students ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>{unlimited.students ? 'Students: Unlimited' : 'Set Students Unlimited'}</button><button type="button" onClick={() => setUnlimited((p) => ({ ...p, staff: !p.staff }))} className={`w-full rounded-xl border px-3 py-3 text-xs font-black ${unlimited.staff ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>{unlimited.staff ? 'Staff: Unlimited' : 'Set Staff Unlimited'}</button></div>
      <label className="sm:col-span-2 text-xs font-bold text-foreground">Landing Page Feature Lines<textarea value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} rows={8} placeholder="One feature per line" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 text-foreground outline-none focus:ring-2 focus:ring-primary/20"/></label>
    </div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-3 text-xs font-bold text-muted-foreground">Cancel</button><button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black text-primary-foreground disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}Save Plan</button></div></motion.div></motion.div>}</AnimatePresence>
  </div>;
}
