import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit2, X, Loader2, Zap, Star, Award, Sparkles, Users, GraduationCap, HardDrive, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

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

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({ price: '', maxStudents: '', maxTeachers: '' });
  const [saving, setSaving] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    apiClient.get('/admin/plans')
      .then(r => setPlans(r.data))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan: Plan) => {
    setEditing(plan);
    setEditForm({
      price: plan.price.toString(),
      maxStudents: plan.maxStudents.toString(),
      maxTeachers: plan.maxTeachers.toString(),
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/plans/${editing.id}`, {
        price: parseFloat(editForm.price) || 0,
        maxStudents: parseInt(editForm.maxStudents) || 0,
        maxTeachers: parseInt(editForm.maxTeachers) || 0,
      });
      toast.success(`${editing.name} plan updated!`);
      setEditing(null);
      fetchPlans();
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Subscription Plans</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage pricing and feature limits for each plan tier</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const meta = planMeta[plan.planKey] || planMeta['PROFESSIONAL'];
          const Icon = meta.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className={`bg-gradient-to-br ${meta.gradient} p-6 relative`}>
                {meta.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {meta.badge}
                  </span>
                )}
                <Icon size={28} className="text-white/80 mb-3" />
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
                {plan.price === 0 && <p className="text-white/70 text-xs mt-0.5">{plan.period}</p>}
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Students', value: plan.maxStudents >= 999999 ? '∞' : plan.maxStudents.toLocaleString(), icon: GraduationCap },
                    { label: 'Teachers', value: plan.maxTeachers >= 999999 ? '∞' : plan.maxTeachers.toLocaleString(), icon: Users },
                    { label: 'Storage', value: plan.storageMb >= 512000 ? '500 GB' : `${plan.storageMb / 1024} GB`, icon: HardDrive },
                    { label: 'Support', value: plan.supportTier, icon: Headphones },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-foreground">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>

                <ul className="space-y-1.5">
                  {(plan.features || []).map((f, idx) => (
                    <li key={idx} className={`flex items-start gap-2 text-xs text-muted-foreground`}>
                      <Check size={11} className={`mt-0.5 shrink-0 ${meta.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleEdit(plan)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                >
                  <Edit2 size={12} /> Edit Pricing
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground">Edit {editing.name} Plan</h3>
                <button onClick={() => setEditing(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Monthly Price (USD)', key: 'price', type: 'number' },
                  { label: 'Max Students', key: 'maxStudents', type: 'number' },
                  { label: 'Max Teachers', key: 'maxTeachers', type: 'number' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-foreground">{field.label}</label>
                    <input
                      type={field.type}
                      value={(editForm as any)[field.key]}
                      onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-5 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
