import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Shield, Zap, Star, Award, Sparkles, Check, Edit2, X,
  Loader2, Calendar, AlertTriangle, CheckCircle, RefreshCw, Filter,
  Users, GraduationCap, ArrowRight, DollarSign, Clock
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const planMeta: Record<string, { color: string; gradient: string; icon: React.ComponentType<any>; badge?: string }> = {
  FREE_TRIAL: { color: 'text-slate-400', gradient: 'from-slate-600 to-slate-700', icon: Zap },
  PROFESSIONAL: { color: 'text-violet-400', gradient: 'from-violet-600 to-purple-600', icon: Award, badge: 'Popular' },
  PREMIUM: { color: 'text-amber-400', gradient: 'from-amber-500 to-orange-600', icon: Sparkles, badge: 'Enterprise' },
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

  // Extend & Plan Modals
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
    ])
      .then(([pRes, sRes]) => {
        setPlans(Array.isArray(pRes.data) ? pRes.data : []);
        setSchools(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000);

  const activeSchools = schools.filter((s) => {
    if (!s.subscription?.endDate) return s.isActive;
    return new Date(s.subscription.endDate) > now && s.isActive;
  });

  const expiringSchools = schools.filter((s) => {
    if (!s.subscription?.endDate) return false;
    const end = new Date(s.subscription.endDate);
    return end > now && end <= thirtyDaysLater;
  });

  const expiredSchools = schools.filter((s) => {
    if (!s.subscription?.endDate) return !s.isActive;
    return new Date(s.subscription.endDate) <= now || !s.isActive;
  });

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({
      price: plan.price.toString(),
      maxStudents: plan.maxStudents.toString(),
      maxTeachers: plan.maxTeachers.toString(),
    });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      await apiClient.put(`/admin/plans/${editingPlan.id}`, {
        price: parseFloat(editForm.price) || 0,
        maxStudents: parseInt(editForm.maxStudents) || 0,
        maxTeachers: parseInt(editForm.maxTeachers) || 0,
      });
      toast.success(`${editingPlan.name} plan pricing updated!`);
      setEditingPlan(null);
      fetchData();
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleExtendExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSavingAction(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}/extend-expiry`, {
        days: Number(extendDays),
      });
      toast.success(`Subscription extended by ${extendDays} days!`);
      setExtendModal(false);
      fetchData();
    } catch {
      toast.error('Failed to extend subscription');
    } finally {
      setSavingAction(false);
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSavingAction(true);
    try {
      await apiClient.patch(`/schools/${selectedSchool.id}/change-plan`, {
        plan: newPlan,
      });
      toast.success(`Plan updated to ${newPlan}!`);
      setChangePlanModal(false);
      fetchData();
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5">
            <CreditCard size={12} />
            <span>Monetization & License Tiers</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Subscriptions &amp; Plans</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage SaaS pricing packages, active campus subscriptions, renewals, and expiration dates.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 flex-wrap">
        {[
          { id: 'plans', label: 'Plans & Pricing', count: plans.length },
          { id: 'active', label: 'Active Subscriptions', count: activeSchools.length },
          { id: 'expiring', label: 'Expiring Soon (30d)', count: expiringSchools.length },
          { id: 'expired', label: 'Expired / Suspended', count: expiredSchools.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === t.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: Plans & Pricing */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan, i) => {
            const meta = planMeta[plan.planKey] || planMeta['PROFESSIONAL'];
            const Icon = meta.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/40 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl hover:border-violet-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`bg-gradient-to-br ${meta.gradient} p-6 relative`}>
                    {meta.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                        {meta.badge}
                      </span>
                    )}
                    <Icon size={26} className="text-white/80 mb-3" />
                    <p className="text-white font-black text-lg">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      {plan.price === 0 ? (
                        <span className="text-white text-3xl font-black">Free</span>
                      ) : (
                        <>
                          <span className="text-white/70 text-sm">$</span>
                          <span className="text-white text-3xl font-black">{plan.price}</span>
                          <span className="text-white/70 text-xs">{plan.period}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                        <p className="font-black text-white">
                          {plan.maxStudents >= 999999 ? 'Unlimited' : plan.maxStudents}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Max Students</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                        <p className="font-black text-white">
                          {plan.maxTeachers >= 999999 ? 'Unlimited' : plan.maxTeachers}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Max Staff</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {(plan.features || []).map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Edit2 size={13} />
                    <span>Edit Tier Limits &amp; Price</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* TAB 2, 3, 4: Schools Subscriptions List */}
      {activeTab !== 'plans' && (
        <div className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-violet-500" />
            </div>
          ) : (activeTab === 'active' ? activeSchools : activeTab === 'expiring' ? expiringSchools : expiredSchools).length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-white font-bold text-base">No Campuses in this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Campus</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Students Enrolled</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {(activeTab === 'active' ? activeSchools : activeTab === 'expiring' ? expiringSchools : expiredSchools).map((s) => {
                    const plan = s.subscription?.plan || 'PROFESSIONAL';
                    const expiry = s.subscription?.endDate ? new Date(s.subscription.endDate) : null;
                    const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-sm">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.slug}.edusphere.app</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-violet-300 uppercase">{plan.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{s._count?.students ?? 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">
                            {expiry ? expiry.toLocaleDateString('en-PK') : 'N/A'}
                          </div>
                          {expiry && (
                            <span
                              className={`text-[10px] font-bold ${
                                daysLeft <= 7 ? 'text-rose-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-slate-500'
                              }`}
                            >
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d expired` : `${daysLeft}d remaining`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {s.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedSchool(s);
                                setExtendModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white border border-white/10 font-bold transition-all"
                            >
                              Extend
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSchool(s);
                                setNewPlan(s.subscription?.plan || 'PROFESSIONAL');
                                setChangePlanModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-white border border-white/10 font-bold transition-all"
                            >
                              Change Plan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Plan Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="font-bold text-white text-base">Edit {editingPlan.name} Plan</h3>
                <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Monthly Price (USD)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Max Students Limit</label>
                  <input
                    type="number"
                    value={editForm.maxStudents}
                    onChange={(e) => setEditForm((p) => ({ ...p, maxStudents: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Max Teachers / Staff</label>
                  <input
                    type="number"
                    value={editForm.maxTeachers}
                    onChange={(e) => setEditForm((p) => ({ ...p, maxTeachers: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={savingPlan}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs disabled:opacity-50"
                >
                  {savingPlan ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Save Plan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Extend Modal */}
        {extendModal && selectedSchool && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-bold text-white">Extend Expiry</h3>
                <button onClick={() => setExtendModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleExtendExpiry} className="space-y-3.5 text-xs">
                <p className="text-slate-400">
                  Extending subscription for <strong className="text-white">{selectedSchool.name}</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        extendDays === d ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Custom Days</label>
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setExtendModal(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                  <button type="submit" disabled={savingAction} className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50">
                    {savingAction ? 'Saving...' : 'Apply'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Change Plan Modal */}
        {changePlanModal && selectedSchool && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-bold text-white">Change Subscription Plan</h3>
                <button onClick={() => setChangePlanModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleChangePlan} className="space-y-3.5 text-xs">
                <p className="text-slate-400">
                  Update plan for <strong className="text-white">{selectedSchool.name}</strong>.
                </p>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Select Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-white text-xs"
                  >
                    <option value="FREE_TRIAL">Free Trial</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setChangePlanModal(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                  <button type="submit" disabled={savingAction} className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50">
                    {savingAction ? 'Saving...' : 'Update Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
