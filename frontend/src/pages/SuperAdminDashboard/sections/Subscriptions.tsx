import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Zap, Award, Sparkles, Edit2, Loader2,
  Calendar, RefreshCw, X, CircleDashed, CheckCircle2, ArrowUpRight, AlertTriangle
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const planMeta: Record<string, { gradient: string; icon: React.ComponentType<any>; badge?: string }> = {
  FREE_TRIAL:   { gradient: 'from-slate-500 to-slate-600', icon: Zap },
  PROFESSIONAL: { gradient: 'from-violet-600 to-purple-600', icon: Award, badge: 'Popular' },
  PREMIUM:      { gradient: 'from-amber-500 to-orange-600', icon: Sparkles, badge: 'Enterprise' },
};

interface Plan {
  id: string;
  planKey: string;
  name: string;
  price: number;
  period: string;
  maxStudents: number;
  maxTeachers: number;
  storageMb: number;
  supportTier: string;
  features: string[];
}

const inputCls = 'w-full rounded-xl border border-border bg-background text-foreground text-sm p-3 focus:outline-none focus:border-primary/50 transition-all';
const labelCls = 'block text-xs font-bold text-muted-foreground mb-1';

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState<'plans' | 'active' | 'expiring' | 'expired'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({ price: '', maxStudents: '', maxTeachers: '' });
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [extendModal, setExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState('PROFESSIONAL');
  const [savingAction, setSavingAction] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/plans').catch(() => ({ data: [] })),
      apiClient.get('/schools').catch(() => ({ data: [] })),
    ]).then(([pRes, sRes]) => {
      setPlans(Array.isArray(pRes.data) ? pRes.data : []);
      setSchools(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const activeSchools  = schools.filter(s => s.isActive && (!s.subscription?.endDate || new Date(s.subscription.endDate) > now));
  const expiringSchools = schools.filter(s => { if (!s.subscription?.endDate) return false; const end = new Date(s.subscription.endDate); return s.isActive && end > now && end <= thirtyDaysLater; });
  const expiredSchools  = schools.filter(s => !s.isActive || (s.subscription?.endDate && new Date(s.subscription.endDate) <= now));

  const handleEditPlan = (plan: Plan) => { setEditingPlan(plan); setEditForm({ price: plan.price.toString(), maxStudents: plan.maxStudents.toString(), maxTeachers: plan.maxTeachers.toString() }); };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      await apiClient.put(`/admin/plans/${editingPlan.id}`, { price: Number(editForm.price), maxStudents: Number(editForm.maxStudents), maxTeachers: Number(editForm.maxTeachers) });
      toast.success(`${editingPlan.name} plan updated`);
      setEditingPlan(null);
      fetchData();
    } catch { toast.error('Failed to update plan'); }
    finally { setSavingPlan(false); }
  };

  const handleExtendExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !Number.isInteger(Number(extendDays)) || Number(extendDays) < 1) return;
    setSavingAction(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}/extend-expiry`, { days: Number(extendDays) });
      toast.success(`Subscription extended by ${extendDays} days`);
      setExtendModal(false); fetchData();
    } catch { toast.error('Failed to extend subscription'); }
    finally { setSavingAction(false); }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSavingAction(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}/change-plan`, { plan: newPlan });
      toast.success(`Plan changed to ${plans.find(p => p.planKey === newPlan)?.name || newPlan}`);
      setChangePlanModal(false); fetchData();
    } catch { toast.error('Failed to change plan'); }
    finally { setSavingAction(false); }
  };

  const tabList = [
    ['plans', 'Plans & Pricing', plans.length],
    ['active', 'Active', activeSchools.length],
    ['expiring', 'Expiring Soon', expiringSchools.length],
    ['expired', 'Expired', expiredSchools.length],
  ] as const;

  const schoolList = activeTab === 'active' ? activeSchools : activeTab === 'expiring' ? expiringSchools : expiredSchools;

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Monetization &amp; License Tiers</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Subscriptions &amp; Plans</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage PKR pricing, school subscriptions, renewals, and expiration dates.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold shadow-sm transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Plans',      value: plans.length,           color: 'text-violet-400',  bg: 'border-violet-500/20' },
          { label: 'Active Schools',   value: activeSchools.length,   color: 'text-emerald-400', bg: 'border-emerald-500/20' },
          { label: 'Expiring Soon',    value: expiringSchools.length, color: 'text-amber-400',   bg: 'border-amber-500/20' },
          { label: 'Expired',          value: expiredSchools.length,  color: 'text-rose-400',    bg: 'border-rose-500/20' },
        ].map(c => (
          <div key={c.label} className={`p-4 rounded-2xl bg-card border shadow-sm ${c.bg}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${c.color} mb-1`}>{c.label}</p>
            <p className="text-2xl font-black text-foreground">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        {tabList.map(([id, label, count]) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              <span>{label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Plans Grid ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {loading ? (
              <div className="flex h-48 items-center justify-center"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <CircleDashed size={32} className="opacity-40" />
                <p className="text-sm font-semibold">No plans found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan, i) => {
                  const meta = planMeta[plan.planKey] ?? planMeta.PROFESSIONAL;
                  const Icon = meta.icon;
                  return (
                    <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-primary/30 transition-all">
                      <div>
                        <div className={`bg-gradient-to-br ${meta.gradient} p-6 relative`}>
                          {meta.badge && <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">{meta.badge}</span>}
                          <Icon size={26} className="text-white/80 mb-3" />
                          <h3 className="text-xl font-black text-white">{plan.name}</h3>
                          <div className="mt-3 text-3xl font-black text-white">
                            PKR {plan.price.toLocaleString()}
                            <span className="text-xs font-semibold text-white/60"> {plan.period === 'forever' ? 'forever' : '/ month'}</span>
                          </div>
                          <div className="mt-2 flex gap-3 text-[11px] text-white/70 font-semibold">
                            <span>Max {plan.maxStudents} students</span>
                            <span>·</span>
                            <span>Max {plan.maxTeachers} teachers</span>
                          </div>
                        </div>
                        <div className="p-5 space-y-2.5">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        <button onClick={() => handleEditPlan(plan)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold transition-all">
                          <Edit2 size={13} /> Edit Plan
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── School Subscription Lists ── */}
        {activeTab !== 'plans' && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {loading ? (
              <div className="flex h-48 items-center justify-center"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
            ) : schoolList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <CircleDashed size={32} className="opacity-40" />
                <p className="text-sm font-semibold">No subscriptions in this category</p>
              </div>
            ) : (
              schoolList.map((s, i) => {
                const isExpiring = activeTab === 'expiring';
                const isExpired = activeTab === 'expired';
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 transition-all">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground truncate">{s.name}</p>
                        {isExpiring && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">⚠ Expiring</span>}
                        {isExpired  && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">Expired</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.subscription?.plan || 'No plan'} · {s.subscription?.endDate ? new Date(s.subscription.endDate).toLocaleDateString('en-PK') : 'No expiry'}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setSelectedSchool(s); setExtendModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all"
                      >
                        <Calendar size={12} /> Extend
                      </button>
                      <button
                        onClick={() => { setSelectedSchool(s); setNewPlan(s.subscription?.plan === 'PROFESSIONAL' ? 'PREMIUM' : 'PROFESSIONAL'); setChangePlanModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all"
                      >
                        Change Plan
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Plan Modal ── */}
      <AnimatePresence>
        {editingPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Edit {editingPlan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Update pricing and capacity limits</p>
                </div>
                <button onClick={() => setEditingPlan(null)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div><label className={labelCls}>Price (PKR / month)</label><input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className={inputCls} type="number" min="0" /></div>
                <div><label className={labelCls}>Max Students</label><input value={editForm.maxStudents} onChange={e => setEditForm({ ...editForm, maxStudents: e.target.value })} className={inputCls} type="number" min="0" /></div>
                <div><label className={labelCls}>Max Staff / Teachers</label><input value={editForm.maxTeachers} onChange={e => setEditForm({ ...editForm, maxTeachers: e.target.value })} className={inputCls} type="number" min="0" /></div>
                <button disabled={savingPlan} onClick={handleSavePlan}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3 text-sm font-black shadow-lg shadow-violet-500/25 disabled:opacity-60 transition-all">
                  {savingPlan ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={15} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Extend Expiry Modal ── */}
      <AnimatePresence>
        {extendModal && selectedSchool && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.form initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onSubmit={handleExtendExpiry} className="w-full max-w-md bg-card border border-border rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-foreground">Extend Subscription</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedSchool.name}</p>
                </div>
                <button type="button" onClick={() => setExtendModal(false)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-all"><X size={18} /></button>
              </div>
              <label className={labelCls}>Extension Period (days)</label>
              <input type="number" min="1" max="3660" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} className={inputCls} />
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setExtendModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-accent transition-all">Cancel</button>
                <button disabled={savingAction} type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-sm disabled:opacity-60 transition-all">
                  {savingAction ? 'Saving…' : 'Extend'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Change Plan Modal ── */}
      <AnimatePresence>
        {changePlanModal && selectedSchool && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.form initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onSubmit={handleChangePlan} className="w-full max-w-md bg-card border border-border rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-foreground">Change Subscription Plan</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedSchool.name}</p>
                </div>
                <button type="button" onClick={() => setChangePlanModal(false)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-all"><X size={18} /></button>
              </div>
              <label className={labelCls}>Select New Plan</label>
              <select value={newPlan} onChange={e => setNewPlan(e.target.value)} className={inputCls + ' cursor-pointer'}>
                {plans.map(p => <option key={p.planKey} value={p.planKey}>{p.name} — PKR {p.price.toLocaleString()}</option>)}
              </select>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setChangePlanModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-accent transition-all">Cancel</button>
                <button disabled={savingAction} type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-sm shadow-violet-500/25 disabled:opacity-60 transition-all">
                  {savingAction ? 'Saving…' : 'Change Plan'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
