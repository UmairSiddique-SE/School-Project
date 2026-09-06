import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Calendar, Star, Upload, X, CreditCard, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

const MAX_PROOF_BYTES = 2 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_750_000;

async function preparePaymentProof(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please select a valid image file.');
  const source = await fileToDataUrl(file);
  if (file.size <= 1_800_000) return source;
  const image = await loadImage(source);
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare the image.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > MAX_DATA_URL_LENGTH && quality > 0.5) { quality -= 0.08; result = canvas.toDataURL('image/jpeg', quality); }
  if (result.length > MAX_DATA_URL_LENGTH) throw new Error('This screenshot is too large. Please choose a smaller image.');
  return result;
}

function fileToDataUrl(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('Unable to read the screenshot.')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); }); }
function loadImage(source: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Unable to process the screenshot.')); image.src = source; }); }

export default function Subscription() {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState(user?.plan || 'FREE_TRIAL');
  const [plans, setPlans] = useState<any[]>([]);
  const [proof, setProof] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');

  useEffect(() => setActivePlan(user?.plan || 'FREE_TRIAL'), [user?.plan]);
  useEffect(() => { apiClient.get('/public/plans').then(({ data }) => setPlans(Array.isArray(data) ? data.filter((plan: any) => plan.isActive) : [])).catch(() => toast.error('Unable to load subscription plans')); }, []);

  const fallbackPlans = [
    { planKey: 'FREE_TRIAL', name: 'Free Trial', price: 0, period: '1 day', features: ['Up to 20 students', 'Core modules', 'Attendance & fees', 'Basic reports'] },
    { planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, period: 'per month', features: ['Up to 500 students', 'Unlimited staff', 'Full reports', 'Fee management', 'Exams + results'], badge: 'Most Popular', star: true },
    { planKey: 'PREMIUM', name: 'Premium', price: 5000, period: 'per month', features: ['Unlimited students', 'Unlimited staff', 'All modules', 'Advanced reports', 'School website', 'Custom domain'], badge: 'Best Value' },
  ];
  const visiblePlans = plans.length ? plans : fallbackPlans;

  const handleProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > MAX_PROOF_BYTES) { toast.error('Screenshot must be 2 MB or smaller.'); return; }
    setProofBusy(true);
    try { const prepared = await preparePaymentProof(file); setProof(prepared); setProofName(file.name); toast.success('Payment screenshot attached.'); }
    catch (error) { setProof(''); setProofName(''); toast.error(error instanceof Error ? error.message : 'Unable to attach screenshot.'); }
    finally { setProofBusy(false); }
  };

  const clearProof = () => { setProof(''); setProofName(''); };

  const handleUpgrade = async (plan: any) => {
    const planKey = String(plan.planKey || plan.name || '').toUpperCase();
    const isFreeTrial = planKey === 'FREE_TRIAL';
    const isCurrentActivePlan = planKey === activePlan && user?.activationStatus === 'ACTIVE';
    if (isCurrentActivePlan && isFreeTrial) return;
    if (user?.role !== 'SCHOOL_ADMIN' || !user.schoolId) { toast.info(`Selected ${plan.name} plan.`); return; }
    if (!isFreeTrial && !proof) { toast.error('Attach the actual payment screenshot before submitting.'); return; }
    if (!isFreeTrial && !reference.trim()) { toast.error('Enter the real bank/mobile-wallet transaction or reference ID.'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/auth/onboarding-payment', {
        schoolId: user.schoolId,
        plan: planKey,
        method: isFreeTrial ? 'Free Trial' : method,
        reference: isFreeTrial ? undefined : reference.trim(),
        amount: Number(plan.price) || 0,
        screenshotUrl: isFreeTrial ? undefined : proof,
      });
      toast.success(isFreeTrial ? 'Free trial request submitted.' : isCurrentActivePlan ? 'Renewal payment submitted for verification.' : 'Payment submitted. Super Admin will verify it.');
      if (!isFreeTrial) { clearProof(); setReference(''); }
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'Unable to submit payment.');
    } finally { setSubmitting(false); }
  };

  return <div className="space-y-8">
    <div><h1 className="text-3xl font-black text-foreground">Subscription & Billing</h1><p className="mt-1 text-sm text-muted-foreground">Select a plan and submit the real payment reference and proof. Amount, school, plan, dates and approval status are recorded automatically.</p></div>

    <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between md:p-8"><div><div className="flex items-center gap-2"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest">{user?.activationStatus === 'PAYMENT_PENDING' ? 'Payment Pending' : 'Active Plan'}</span><ShieldCheck size={18} /></div><h2 className="mt-3 text-3xl font-black">{activePlan} Plan</h2><p className="mt-1 text-sm text-white/70">Billing changes become active after Super Admin payment verification.</p></div><div className="flex items-center gap-2 text-sm font-bold text-white/80"><Calendar size={18} /> Live subscription status</div></div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{visiblePlans.map((plan, index) => { const planKey = String(plan.planKey || plan.name || '').toUpperCase(); const isCurrent = planKey === activePlan; const isRenewableCurrent = isCurrent && planKey !== 'FREE_TRIAL' && user?.role === 'SCHOOL_ADMIN' && user?.activationStatus === 'ACTIVE'; const price = Number(plan.price) || 0; return <motion.div key={planKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className={`relative flex flex-col justify-between rounded-3xl border-2 ${planKey === 'PROFESSIONAL' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} bg-card p-6`}>
      {plan.badge && <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground">{plan.badge}</span>}
      <div><h3 className="flex items-center gap-1.5 text-lg font-extrabold text-foreground">{plan.star && <Star size={16} className="fill-amber-500 text-amber-500" />}{plan.name}</h3><div className="my-4 flex items-baseline gap-1"><span className="text-3xl font-black text-foreground">{price === 0 ? 'Free' : `PKR ${price.toLocaleString()}`}</span><span className="text-xs text-muted-foreground">{plan.period}</span></div><ul className="my-5 space-y-2 text-xs text-muted-foreground">{(plan.features || []).map((feature: string) => <li key={feature} className="flex items-center gap-2"><CheckCircle2 size={13} className="shrink-0 text-primary" />{feature}</li>)}</ul></div>
      <button onClick={() => handleUpgrade(plan)} disabled={(!isRenewableCurrent && isCurrent) || submitting || proofBusy} className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground disabled:cursor-default disabled:bg-accent disabled:text-accent-foreground">{submitting ? 'Submitting...' : isRenewableCurrent ? 'Renew Plan' : isCurrent ? 'Current Active Plan' : 'Select Plan'}</button>
    </motion.div>; })}</div>

    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-2"><CreditCard size={17} className="text-primary" /><h3 className="font-black text-foreground">Payment details — entered once, stored automatically</h3></div><p className="mt-1 text-xs text-muted-foreground">For paid plans, enter the actual method and transaction/reference ID from your payment receipt. The system automatically records school, plan, amount, submission time and proof.</p><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-xs font-bold text-foreground">Payment Method<select value={method} onChange={(e) => setMethod(e.target.value)} disabled={submitting} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none"><option>Bank Transfer</option><option>JazzCash</option><option>Easypaisa</option><option>Raast QR</option><option>Other</option></select></label><label className="text-xs font-bold text-foreground">Transaction / Reference ID<input value={reference} onChange={(e) => setReference(e.target.value)} disabled={submitting} placeholder="Enter the actual transaction/reference ID" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none" /></label></div><div className="mt-4"><label className="flex items-center gap-2 text-sm font-bold text-foreground"><Upload size={16} /> Payment Proof</label><p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WebP, maximum 2 MB. Required for Professional and Premium.</p><input type="file" accept="image/png,image/jpeg,image/webp" disabled={proofBusy || submitting} onChange={handleProofChange} className="mt-3 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary-foreground" />{proofBusy && <p className="mt-2 text-xs text-primary">Preparing screenshot...</p>}{proof && !proofBusy && <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /><div><p className="max-w-[260px] truncate text-xs font-bold text-foreground">{proofName}</p><p className="text-[11px] text-emerald-600">Proof ready</p></div></div><button type="button" onClick={clearProof} className="rounded-lg p-2 text-muted-foreground hover:bg-accent"><X size={15} /></button></div>}</div></div>

    <div className="rounded-2xl border border-border bg-card p-6 text-center"><ReceiptText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm font-black text-foreground">Payment history is managed by Super Admin</p><p className="mt-1 text-xs text-muted-foreground">After approval, your payment is automatically recorded in the platform ledger and the subscription expiry is calculated from the plan period.</p></div>
  </div>;
}
