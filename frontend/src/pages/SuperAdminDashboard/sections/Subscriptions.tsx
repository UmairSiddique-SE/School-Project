import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Zap, Award, Sparkles, Edit2, Loader2, Calendar, RefreshCw } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const planMeta: Record<string, { gradient: string; icon: React.ComponentType<any>; badge?: string }> = {
  FREE_TRIAL: { gradient: 'from-slate-600 to-slate-700', icon: Zap },
  PROFESSIONAL: { gradient: 'from-violet-600 to-purple-600', icon: Award, badge: 'Popular' },
  PREMIUM: { gradient: 'from-amber-500 to-orange-600', icon: Sparkles, badge: 'Enterprise' },
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
  const activeSchools = schools.filter(s => s.isActive && (!s.subscription?.endDate || new Date(s.subscription.endDate) > now));
  const expiringSchools = schools.filter(s => {
    if (!s.subscription?.endDate) return false;
    const end = new Date(s.subscription.endDate);
    return s.isActive && end > now && end <= thirtyDaysLater;
  });
  const expiredSchools = schools.filter(s => !s.isActive || (s.subscription?.endDate && new Date(s.subscription.endDate) <= now));

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({ price: plan.price.toString(), maxStudents: plan.maxStudents.toString(), maxTeachers: plan.maxTeachers.toString() });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      await apiClient.put(`/admin/plans/${editingPlan.id}`, {
        price: Number(editForm.price), maxStudents: Number(editForm.maxStudents), maxTeachers: Number(editForm.maxTeachers),
      });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5"><CreditCard size={12} /><span>Monetization & License Tiers</span></div>
          <h2 className="text-2xl font-black text-white tracking-tight">Subscriptions & Plans</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage PKR pricing, school subscriptions, renewals, and expiration dates.</p>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /><span>Refresh</span></button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/5 pb-2 flex-wrap">
        {[['plans', 'Plans & Pricing', plans.length], ['active', 'Active Subscriptions', activeSchools.length], ['expiring', 'Expiring Soon (30d)', expiringSchools.length], ['expired', 'Expired / Suspended', expiredSchools.length]].map(([id, label, count]) => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ${activeTab === id ? 'bg-violet-600/20 border border-violet-500/40 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><span>{label}</span><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === id ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400'}`}>{count}</span></button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const meta = planMeta[plan.planKey] || planMeta.PROFESSIONAL; const Icon = meta.icon;
            return <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-slate-900/40 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className={`bg-gradient-to-br ${meta.gradient} p-6 relative`}>{meta.badge && <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">{meta.badge}</span>}<Icon size={26} className="text-white/80 mb-3" /><h3 className="text-xl font-black text-white">{plan.name}</h3><div className="mt-3 text-3xl font-black text-white">PKR {plan.price.toLocaleString()}<span className="text-xs font-semibold text-white/60"> {plan.period === 'forever' ? 'forever' : '/ month'}</span></div></div>
                <div className="p-5 space-y-3">{plan.features.map((feature, idx) => <div key={idx} className="flex gap-2 text-xs text-slate-300"><span className="text-emerald-400">✓</span>{feature}</div>)}</div>
              </div>
              <div className="p-5 pt-0"><button onClick={() => handleEditPlan(plan)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"><Edit2 size={13} />Edit Plan</button></div>
            </motion.div>;
          })}
        </div>
      )}

      {activeTab !== 'plans' && (
        <div className="space-y-3">
          {(activeTab === 'active' ? activeSchools : activeTab === 'expiring' ? expiringSchools : expiredSchools).map(s => <div key={s.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/[0.06]"><div><div className="font-bold text-white">{s.name}</div><div className="text-xs text-slate-400 mt-1">{s.subscription?.plan || 'No plan'} · {s.subscription?.endDate ? new Date(s.subscription.endDate).toLocaleDateString() : 'No expiry'}</div></div><div className="flex gap-2"><button onClick={() => { setSelectedSchool(s); setExtendModal(true); }} className="px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-white"><Calendar size={12} className="inline mr-1" />Extend</button><button onClick={() => { setSelectedSchool(s); setNewPlan(s.subscription?.plan === 'PROFESSIONAL' ? 'PREMIUM' : 'PROFESSIONAL'); setChangePlanModal(true); }} className="px-3 py-2 rounded-lg bg-violet-600/20 text-xs font-bold text-white">Change Plan</button></div></div>)}
          {!loading && (activeTab === 'active' ? activeSchools : activeTab === 'expiring' ? expiringSchools : expiredSchools).length === 0 && <div className="p-10 text-center text-slate-500">No subscriptions found.</div>}
        </div>
      )}

      {editingPlan && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6"><div className="flex justify-between"><h3 className="font-black text-white">Edit {editingPlan.name}</h3><button onClick={() => setEditingPlan(null)} className="text-slate-400">×</button></div><div className="space-y-4 mt-5"><label className="block text-xs font-bold text-slate-300">Price (PKR)<input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" type="number" /></label><label className="block text-xs font-bold text-slate-300">Max Students<input value={editForm.maxStudents} onChange={e => setEditForm({ ...editForm, maxStudents: e.target.value })} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" type="number" /></label><label className="block text-xs font-bold text-slate-300">Max Staff<input value={editForm.maxTeachers} onChange={e => setEditForm({ ...editForm, maxTeachers: e.target.value })} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" type="number" /></label><button disabled={savingPlan} onClick={handleSavePlan} className="w-full rounded-xl bg-violet-600 p-3 text-sm font-black text-white">{savingPlan ? <Loader2 className="mx-auto animate-spin" size={16} /> : 'Save Changes'}</button></div></div></div>}

      {extendModal && selectedSchool && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={handleExtendExpiry} className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6"><h3 className="font-black text-white">Extend Subscription</h3><p className="text-xs text-slate-400 mt-1">{selectedSchool.name}</p><input type="number" min="1" max="3660" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))} className="mt-5 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" /><button disabled={savingAction} className="mt-4 w-full rounded-xl bg-violet-600 p-3 text-sm font-black text-white">{savingAction ? 'Saving...' : 'Extend'}</button></form></div>}

      {changePlanModal && selectedSchool && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={handleChangePlan} className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6"><h3 className="font-black text-white">Change Subscription Plan</h3><p className="text-xs text-slate-400 mt-1">{selectedSchool.name}</p><select value={newPlan} onChange={e => setNewPlan(e.target.value)} className="mt-5 w-full rounded-xl bg-slate-800 border border-white/10 p-3 text-white">{plans.map(p => <option key={p.planKey} value={p.planKey}>{p.name} — PKR {p.price.toLocaleString()}</option>)}</select><button disabled={savingAction} className="mt-4 w-full rounded-xl bg-violet-600 p-3 text-sm font-black text-white">{savingAction ? 'Saving...' : 'Change Plan'}</button></form></div>}
    </div>
  );
}
