import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

type Props = { open: boolean; onClose: () => void; onSaved: () => void };
type Option = { id?: string; name: string; slug?: string; planKey?: string; price: number; currency: string };

export default function ManualPaymentDialog({ open, onClose, onSaved }: Props) {
  const [schools, setSchools] = useState<Option[]>([]);
  const [plans, setPlans] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ schoolId: '', plan: '', amount: '', paymentDate: '', expiryDate: '', method: 'Bank Transfer', reference: '', screenshotUrl: '', notes: '' });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiClient.get('/admin/payments/manual-options')
      .then((response) => {
        const data = response.data || {};
        setSchools(data.schools || []);
        setPlans(data.plans || []);
        const firstPlan = (data.plans || [])[0];
        setForm((current) => ({ ...current, paymentDate: current.paymentDate || new Date().toISOString().slice(0, 10), plan: current.plan || firstPlan?.planKey || '', amount: current.amount || (firstPlan ? String(firstPlan.price) : '') }));
      })
      .catch(() => toast.error('Failed to load schools and plans'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const selectedPlan = plans.find((plan) => plan.planKey === form.plan);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.schoolId || !form.plan || !form.amount || !form.paymentDate || !form.expiryDate || !form.method) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/admin/payments/manual', { ...form, amount: Number(form.amount) });
      toast.success('Manual payment added and subscription activated');
      onSaved();
      onClose();
      setForm({ schoolId: '', plan: '', amount: '', paymentDate: '', expiryDate: '', method: 'Bank Transfer', reference: '', screenshotUrl: '', notes: '' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Manual payment could not be saved');
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <form onSubmit={save} onMouseDown={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
      <div className="flex items-start justify-between border-b border-border pb-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Accountant / Manual Entry</p><h3 className="mt-1 text-xl font-black text-foreground">Add Payment</h3><p className="mt-1 text-xs text-muted-foreground">For direct payments received by Super Admin. Set the exact expiry date.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div>
      {loading ? <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={20} />Loading options...</div> : <>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold">School *<select value={form.schoolId} onChange={(e) => set('schoolId', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none"><option value="">Select school</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}{school.slug ? ` (${school.slug})` : ''}</option>)}</select></label>
          <label className="text-xs font-bold">Plan *<select value={form.plan} onChange={(e) => { const plan = plans.find((item) => item.planKey === e.target.value); setForm((current) => ({ ...current, plan: e.target.value, amount: plan ? String(plan.price) : '' })); }} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none"><option value="">Select plan</option>{plans.map((plan) => <option key={plan.planKey} value={plan.planKey}>{plan.name} — {plan.currency} {plan.price.toLocaleString()}</option>)}</select></label>
          <label className="text-xs font-bold">Amount *<input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none" /></label>
          <label className="text-xs font-bold">Payment Date *<input type="date" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none" /></label>
          <label className="text-xs font-bold md:col-span-2"><span className="inline-flex items-center gap-1.5">New Expiry Date * <CalendarDays size={13} className="text-primary" /></span><input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className="mt-1.5 w-full rounded-xl border border-primary/30 bg-background px-3 py-2.5 text-sm font-normal outline-none" /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">This date is stored and becomes the subscription end date after saving.</span></label>
          <label className="text-xs font-bold">Payment Method *<select value={form.method} onChange={(e) => set('method', e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none"><option>Bank Transfer</option><option>Cash</option><option>JazzCash</option><option>EasyPaisa</option><option>Cheque</option><option>Other</option></select></label>
          <label className="text-xs font-bold">Transaction ID / Reference<input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="Optional" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none" /></label>
          <label className="text-xs font-bold md:col-span-2">Screenshot / Proof URL<input value={form.screenshotUrl} onChange={(e) => set('screenshotUrl', e.target.value)} placeholder="Cloudinary or other stored proof URL (optional)" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none" /></label>
          <label className="text-xs font-bold md:col-span-2">Notes<textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Optional accounting note" className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal outline-none" /></label>
        </div>
        {selectedPlan && <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground"><strong className="text-foreground">Plan price:</strong> {selectedPlan.currency} {selectedPlan.price.toLocaleString()}. The backend will reject an amount that does not match the current plan price.</div>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-black">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-50"><Plus size={14} />{saving ? 'Saving…' : 'Save Payment & Activate'}</button></div>
      </>}
    </form>
  </div>;
}
