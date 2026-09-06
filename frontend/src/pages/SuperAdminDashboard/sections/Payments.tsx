import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, Download, Eye, History, RefreshCw, Search, WalletCards, X, Building2, CalendarDays, ReceiptText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

type PaymentStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | string;
type TabType = 'PENDING' | 'APPROVED' | 'FIRST_PAYMENT' | 'RECURRING' | 'REJECTED' | 'ALL';

type Payment = {
  id: string;
  schoolId: string;
  plan: string;
  amount: number;
  method: string;
  reference?: string | null;
  screenshotUrl?: string | null;
  status: PaymentStatus;
  paymentType: string;
  submittedAt?: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  school?: { name?: string; slug?: string } | null;
};

type Accounting = {
  monthRevenue: number; todayRevenue: number; allTimeRevenue: number; monthFirstTimeRevenue: number; monthRecurringRevenue: number;
  firstTimePaymentCount: number; recurringPaymentCount: number; pendingRevenue: number; pendingCount: number;
  rejectedRevenue: number; rejectedCount: number; expectedNext7Revenue: number; expectedNext30Revenue: number;
  expectedNext7Count: number; expectedNext30Count: number; overdueRevenue: number; overdueCount: number;
};

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
const dateTime = (value?: string | null) => !value ? '—' : new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
const planLabel = (plan: string) => plan === 'FREE_TRIAL' ? 'Free Trial' : plan === 'PROFESSIONAL' ? 'Professional' : plan === 'PREMIUM' ? 'Premium' : plan.replace(/_/g, ' ');
const typeLabel = (type: string) => type === 'FIRST_PAYMENT' ? 'First Payment' : type === 'RECURRING' ? 'Recurring / Renewal' : type === 'RENEWAL_PENDING' ? 'Renewal Pending' : type === 'FIRST_PAYMENT_PENDING' ? 'First Payment Pending' : type;

function Metric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-2 text-lg font-black text-foreground">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{caption}</p></div>;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounting, setAccounting] = useState<Accounting | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('PENDING');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const load = async (nextPage = page) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: nextPage, limit: 25 };
      if (tab === 'PENDING' || tab === 'APPROVED' || tab === 'REJECTED') params.status = tab;
      if (tab === 'FIRST_PAYMENT' || tab === 'RECURRING') params.type = tab;
      if (search.trim()) params.search = search.trim();
      if (dateFilter) params.date = dateFilter;
      const response = await apiClient.get('/admin/payments', { params });
      setPayments(response.data?.data || []);
      setMeta(response.data?.meta || { page: nextPage, limit: 25, total: 0, totalPages: 0 });
      setAccounting(response.data?.accounting || null);
    } catch { toast.error('Failed to load payment accounting'); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); void load(1); }, [tab, dateFilter]);
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); void load(1); }, 350); return () => window.clearTimeout(timer); }, [search]);

  const approve = async (id: string) => {
    setProcessing(id);
    try { await apiClient.patch(`/admin/payments/${id}/approve`); toast.success('Payment verified and approved'); await load(page); setViewPayment(null); }
    catch { toast.error('Payment approval failed'); }
    finally { setProcessing(null); }
  };

  const reject = async (id: string) => {
    setProcessing(id);
    try { await apiClient.patch(`/admin/payments/${id}/reject`); toast.success('Payment rejected'); await load(page); setViewPayment(null); }
    catch { toast.error('Payment rejection failed'); }
    finally { setProcessing(null); }
  };

  const generatePdf = () => {
    const rows = payments.map((p) => `<tr><td>${p.school?.name || '—'}</td><td>${typeLabel(p.paymentType)}</td><td>${planLabel(p.plan)}</td><td>${money(p.amount)}</td><td>${p.method || '—'}</td><td>${p.reference || p.id}</td><td>${dateTime(p.submittedAt || p.createdAt)}</td><td>${dateTime(p.reviewedAt)}</td><td>${p.status}</td></tr>`).join('');
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) { toast.error('Allow pop-ups to generate the PDF'); return; }
    win.document.write(`<!doctype html><html><head><title>EduSphere Accounting Report</title><style>body{font-family:Arial;padding:24px;color:#172033}h1{margin-bottom:4px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.card{border:1px solid #d8dee8;padding:12px;border-radius:8px}.label{font-size:10px;color:#697586}.value{font-size:17px;font-weight:700;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:9px;margin-top:20px}th,td{border:1px solid #d8dee8;padding:7px;text-align:left}th{background:#f3f5f8}@media print{body{padding:0}}</style></head><body><h1>EduSphere — Accountant Payment Report</h1><p>Generated ${new Date().toLocaleString('en-PK')} · Page ${meta.page} of ${meta.totalPages}</p><div class="cards"><div class="card"><div class="label">This Month Collected</div><div class="value">${money(accounting?.monthRevenue || 0)}</div></div><div class="card"><div class="label">First-Time This Month</div><div class="value">${money(accounting?.monthFirstTimeRevenue || 0)}</div></div><div class="card"><div class="label">Recurring This Month</div><div class="value">${money(accounting?.monthRecurringRevenue || 0)}</div></div><div class="card"><div class="label">Expected Next 30 Days</div><div class="value">${money(accounting?.expectedNext30Revenue || 0)}</div></div></div><table><thead><tr><th>School</th><th>Type</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Submitted</th><th>Verified</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="9">No payments found</td></tr>'}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
    win.document.close();
  };

  const tabs: { label: string; value: TabType; icon: React.ComponentType<any> }[] = [
    { label: 'Pending', value: 'PENDING', icon: Clock },
    { label: 'Approved', value: 'APPROVED', icon: CheckCircle },
    { label: 'First-Time', value: 'FIRST_PAYMENT', icon: WalletCards },
    { label: 'Recurring / Renewals', value: 'RECURRING', icon: RefreshCw },
    { label: 'Rejected', value: 'REJECTED', icon: X },
    { label: 'All History', value: 'ALL', icon: History },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary"><WalletCards size={12} /> Accountant / Payments</div><h2 className="text-2xl font-black tracking-tight text-foreground">Payment Ledger & Verification</h2><p className="mt-1 text-sm text-muted-foreground">First-time onboarding payments and recurring renewals are tracked separately. Every transaction keeps its proof, reference, dates and approval trail.</p></div><div className="flex flex-wrap gap-2"><button onClick={generatePdf} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground"><Download size={14} />PDF Report</button><button onClick={() => void load(page)} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button></div></div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric title="Month Collected" value={money(accounting?.monthRevenue || 0)} caption="Approved revenue" /><Metric title="First-Time" value={money(accounting?.monthFirstTimeRevenue || 0)} caption="New school payments" /><Metric title="Recurring" value={money(accounting?.monthRecurringRevenue || 0)} caption="Renewals / repeat" /><Metric title="Expected 30 Days" value={money(accounting?.expectedNext30Revenue || 0)} caption={`${accounting?.expectedNext30Count || 0} renewals due`} /><Metric title="Pending Money" value={money(accounting?.pendingRevenue || 0)} caption={`${accounting?.pendingCount || 0} awaiting verification`} /><Metric title="Overdue" value={money(accounting?.overdueRevenue || 0)} caption={`${accounting?.overdueCount || 0} expired paid-plan schools`} /><Metric title="All-Time Earned" value={money(accounting?.allTimeRevenue || 0)} caption="All approved payments" /><Metric title="Next 7 Days" value={money(accounting?.expectedNext7Revenue || 0)} caption={`${accounting?.expectedNext7Count || 0} renewals due soon`} /></div>

    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-[11px] text-muted-foreground"><strong className="text-foreground">Automatic record:</strong> school name, plan, exact amount, payment method, transaction/reference ID, proof screenshot, submission time, verification time and status are stored from the payment submission. Super Admin only verifies or rejects it.</div>

    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">{tabs.map((t) => { const Icon = t.icon; const count = t.value === 'PENDING' ? accounting?.pendingCount : t.value === 'REJECTED' ? accounting?.rejectedCount : t.value === 'FIRST_PAYMENT' ? accounting?.firstTimePaymentCount : t.value === 'RECURRING' ? accounting?.recurringPaymentCount : t.value === 'ALL' ? meta.total : undefined; return <button key={t.value} onClick={() => setTab(t.value)} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold ${tab === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={14} /><span>{t.label}</span>{count !== undefined && <span className="rounded-full bg-muted/70 px-1.5 py-0.5 text-[9px] font-black">{count}</span>}</button>; })}</div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]"><div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school, plan, method, reference..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></div><label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold text-muted-foreground"><CalendarDays size={15} /><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="min-w-0 flex-1 bg-transparent text-foreground outline-none" /></label></div>

    <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">{loading ? <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 size={22} className="animate-spin text-primary" />Loading live ledger...</div> : payments.length === 0 ? <div className="p-14 text-center"><ReceiptText size={38} className="mx-auto mb-3 text-muted-foreground" /><p className="font-black text-foreground">No transactions found</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-xs"><thead><tr className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4">School</th><th className="px-5 py-4">Payment Type</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Method</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Verified</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Details</th></tr></thead><tbody className="divide-y divide-border">{payments.map((p) => <tr key={p.id} className="hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 size={14} /></div><div><p className="font-bold text-foreground">{p.school?.name || 'Unknown School'}</p><p className="text-[10px] text-muted-foreground">{p.school?.slug || p.schoolId}</p></div></div></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${p.paymentType.includes('FIRST') ? 'bg-cyan-500/10 text-cyan-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{typeLabel(p.paymentType)}</span></td><td className="px-5 py-4 font-bold">{planLabel(p.plan)}</td><td className="px-5 py-4 font-black">{money(p.amount)}</td><td className="px-5 py-4 text-muted-foreground">{p.method || '—'}</td><td className="px-5 py-4 font-mono text-[10px] text-primary">{p.reference || p.id.slice(0, 12)}</td><td className="px-5 py-4 text-muted-foreground">{dateTime(p.submittedAt || p.createdAt)}</td><td className="px-5 py-4 text-muted-foreground">{dateTime(p.reviewedAt)}</td><td className="px-5 py-4"><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-black">{p.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setViewPayment(p)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[10px] font-black"><Eye size={13} />Full Detail</button></td></tr>)}</tbody></table></div>}</div>

    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>Showing page {meta.page} of {meta.totalPages || 1} · {meta.total.toLocaleString()} transaction(s)</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => { const next = page - 1; setPage(next); void load(next); }} className="rounded-xl border border-border bg-card px-3 py-2 font-bold disabled:opacity-40">Previous</button><button disabled={page >= meta.totalPages || loading} onClick={() => { const next = page + 1; setPage(next); void load(next); }} className="rounded-xl border border-border bg-card px-3 py-2 font-bold disabled:opacity-40">Next</button></div></div>

    <AnimatePresence>{viewPayment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={() => setViewPayment(null)}><motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} onMouseDown={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-border pb-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Complete Payment Detail</p><h3 className="mt-1 text-xl font-black text-foreground">{viewPayment.school?.name || 'Payment'}</h3></div><button onClick={() => setViewPayment(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{[['Payment Type', typeLabel(viewPayment.paymentType)], ['Plan', planLabel(viewPayment.plan)], ['Amount', money(viewPayment.amount)], ['Payment Method', viewPayment.method || '—'], ['Reference / Transaction ID', viewPayment.reference || viewPayment.id], ['School ID', viewPayment.schoolId], ['Submitted', dateTime(viewPayment.submittedAt || viewPayment.createdAt)], ['Verified', dateTime(viewPayment.reviewedAt)], ['Created', dateTime(viewPayment.createdAt)], ['Last Updated', dateTime(viewPayment.updatedAt)], ['Status', viewPayment.status]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-muted/30 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-black text-foreground">{value}</p></div>)}</div>{viewPayment.screenshotUrl && <div className="mt-4"><p className="mb-2 text-xs font-black">Payment Proof</p><a href={viewPayment.screenshotUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border bg-black/20"><img src={viewPayment.screenshotUrl} alt="Payment proof" className="max-h-80 w-full object-contain" /></a></div>}<div className="mt-5 flex flex-wrap justify-end gap-2">{viewPayment.status === 'PENDING' && <><button onClick={() => void reject(viewPayment.id)} disabled={processing === viewPayment.id} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-black text-rose-500">Reject</button><button onClick={() => void approve(viewPayment.id)} disabled={processing === viewPayment.id} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white">{processing === viewPayment.id ? 'Processing…' : 'Verify & Approve'}</button></>}<button onClick={() => setViewPayment(null)} className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-black">Close</button></div></motion.div></div>}</AnimatePresence>
  </div>;
}
