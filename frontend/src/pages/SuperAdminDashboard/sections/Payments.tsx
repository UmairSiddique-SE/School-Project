import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Clock, History, Search, Download, Loader2, RefreshCw,
  DollarSign, Eye, CreditCard, CalendarDays, CheckCircle, FileText,
  ReceiptText, Building2, WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

type PaymentStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | string;
type TabType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

type Payment = {
  id: string;
  schoolId: string;
  plan: string;
  amount: number;
  method: string;
  reference?: string | null;
  screenshotUrl?: string | null;
  status: PaymentStatus;
  submittedAt?: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  school?: { name?: string; slug?: string } | null;
};

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', label: 'Pending' },
  PAID: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Approved' },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Approved' },
  REJECTED: { color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', label: 'Rejected' },
};

function money(value: number) {
  return `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
}

function dateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
}

function dateOnly(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-PK');
}

function planLabel(plan: string) {
  return plan === 'FREE_TRIAL' ? 'Free Trial' : plan === 'PROFESSIONAL' ? 'Professional' : plan === 'PREMIUM' ? 'Premium' : plan.replace(/_/g, ' ');
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('PENDING');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Payment[]>('/admin/payments');
      setPayments(response.data || []);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPayments(); }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/approve`);
      toast.success('Payment verified & approved successfully');
      await fetchPayments();
      setViewPayment(null);
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/reject`);
      toast.success('Payment rejected');
      await fetchPayments();
      setViewPayment(null);
    } catch {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = useMemo(() => payments.filter((p) => {
    const approved = p.status === 'PAID' || p.status === 'APPROVED';
    const tabMatch = tab === 'ALL' || (tab === 'APPROVED' ? approved : p.status === tab);
    const q = search.trim().toLowerCase();
    const searchMatch = !q || [
      p.school?.name,
      p.school?.slug,
      p.plan,
      p.method,
      p.reference,
      p.id,
    ].some((v) => String(v || '').toLowerCase().includes(q));
    const paymentDate = p.submittedAt || p.createdAt;
    const dateMatch = !dateFilter || paymentDate.slice(0, 10) === dateFilter;
    return tabMatch && searchMatch && dateMatch;
  }), [payments, tab, search, dateFilter]);

  const approvedPayments = payments.filter((p) => p.status === 'PAID' || p.status === 'APPROVED');
  const totalApproved = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalRejected = payments.filter((p) => p.status === 'REJECTED').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRevenue = approvedPayments.filter((p) => (p.reviewedAt || p.createdAt).slice(0, 10) === todayKey).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const generatePdfReport = () => {
    const reportRows = filtered.map((p) => `
      <tr>
        <td>${p.school?.name || '—'}</td>
        <td>${planLabel(p.plan)}</td>
        <td>${money(p.amount)}</td>
        <td>${p.method || '—'}</td>
        <td>${p.reference || p.id}</td>
        <td>${dateTime(p.submittedAt || p.createdAt)}</td>
        <td>${dateTime(p.reviewedAt)}</td>
        <td>${statusConfig[p.status]?.label || p.status}</td>
      </tr>`).join('');

    const win = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
    if (!win) {
      toast.error('Please allow pop-ups to generate the PDF report.');
      return;
    }
    win.document.write(`<!doctype html><html><head><title>EduSphere Payment Report</title><style>
      body{font-family:Arial,sans-serif;color:#172033;padding:28px}h1{margin:0 0 6px;font-size:24px}p{color:#5f6b7a}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.card{border:1px solid #d9dee8;border-radius:10px;padding:12px}.label{font-size:11px;color:#697586}.value{font-size:18px;font-weight:700;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:10px}th,td{border:1px solid #d9dee8;padding:8px;text-align:left}th{background:#f4f6f9}.footer{margin-top:20px;font-size:10px;color:#697586}@media print{body{padding:0}.no-print{display:none}}
    </style></head><body><h1>EduSphere — Payment & Revenue Report</h1><p>Generated ${new Date().toLocaleString('en-PK')} · ${filtered.length} transaction(s)</p>
      <div class="summary"><div class="card"><div class="label">Approved Revenue</div><div class="value">${money(totalApproved)}</div></div><div class="card"><div class="label">Today's Revenue</div><div class="value">${money(todayRevenue)}</div></div><div class="card"><div class="label">Pending</div><div class="value">${money(totalPending)}</div></div><div class="card"><div class="label">Rejected</div><div class="value">${money(totalRejected)}</div></div></div>
      <table><thead><tr><th>School</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Paid / Submitted</th><th>Verified</th><th>Status</th></tr></thead><tbody>${reportRows || '<tr><td colspan="8">No transactions found.</td></tr>'}</tbody></table>
      <div class="footer">This report is generated from the live EduSphere payment records. Use the browser Print dialog and select “Save as PDF”.</div>
      <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`);
    win.document.close();
  };

  const tabs: { label: string; value: TabType; icon: React.ComponentType<any>; color: string }[] = [
    { label: 'Pending Verification', value: 'PENDING', icon: Clock, color: 'text-amber-400' },
    { label: 'Approved History', value: 'APPROVED', icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Rejected', value: 'REJECTED', icon: X, color: 'text-rose-400' },
    { label: 'Full Payment History', value: 'ALL', icon: History, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary"><CreditCard size={12} /><span>Payments & Billing</span></div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Payment History & Revenue</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every payment, date, plan, method, reference, verification time and revenue total is kept in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={generatePdfReport} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-sm hover:opacity-90"><Download size={14} />Generate PDF</button>
          <button onClick={() => void fetchPayments()} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Total Earned', totalApproved, 'text-emerald-600 dark:text-emerald-300', WalletCards],
          ["Today's Earned", todayRevenue, 'text-blue-600 dark:text-blue-300', CalendarDays],
          ['Pending', totalPending, 'text-amber-600 dark:text-amber-300', Clock],
          ['Rejected', totalRejected, 'text-rose-600 dark:text-rose-300', X],
        ].map(([label, value, color, Icon]) => (
          <div key={label as string} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label as string}</span><Icon size={16} className={color as string} /></div>
            <p className={`mt-2 text-xl font-black ${color as string}`}>{money(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const count = t.value === 'ALL' ? payments.length : t.value === 'APPROVED' ? approvedPayments.length : payments.filter((p) => p.status === t.value).length;
          const Icon = t.icon;
          return <button key={t.value} onClick={() => setTab(t.value)} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${tab === t.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={14} /><span>{t.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${tab === t.value ? 'bg-white/20' : 'bg-muted'}`}>{count}</span></button>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school, plan, method, reference..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></div>
        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold text-muted-foreground"><CalendarDays size={15} /><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="min-w-0 flex-1 bg-transparent text-foreground outline-none" /></label>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        {loading ? <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 size={22} className="animate-spin text-primary" />Loading payment history...</div> : filtered.length === 0 ? <div className="p-14 text-center"><ReceiptText size={38} className="mx-auto mb-3 text-muted-foreground" /><p className="font-black text-foreground">No payments found</p><p className="mt-1 text-xs text-muted-foreground">Try Full Payment History or clear the date/search filter.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead><tr className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4">School</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Method</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Paid / Submitted</th><th className="px-5 py-4">Verified</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Details</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((p) => <tr key={p.id} className="transition hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 size={14} /></div><div><p className="font-bold text-foreground">{p.school?.name || 'Unknown School'}</p><p className="text-[10px] text-muted-foreground">{p.school?.slug || p.schoolId}</p></div></div></td><td className="px-5 py-4 font-bold text-foreground">{planLabel(p.plan)}</td><td className="px-5 py-4 font-black text-foreground">{money(p.amount)}</td><td className="px-5 py-4 font-medium text-muted-foreground">{p.method || '—'}</td><td className="px-5 py-4 font-mono text-[10px] text-primary">{p.reference || p.id.slice(0, 12)}</td><td className="px-5 py-4 text-muted-foreground">{dateTime(p.submittedAt || p.createdAt)}</td><td className="px-5 py-4 text-muted-foreground">{dateTime(p.reviewedAt)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusConfig[p.status]?.color || 'border border-border text-muted-foreground'}`}>{statusConfig[p.status]?.label || p.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setViewPayment(p)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[10px] font-black text-foreground hover:bg-muted"><Eye size={13} />Full Detail</button></td></tr>)}</tbody></table></div>}
      </div>

      <AnimatePresence>
        {viewPayment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={() => setViewPayment(null)}><motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} onMouseDown={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <div className="flex items-start justify-between border-b border-border pb-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Transaction Detail</p><h3 className="mt-1 text-xl font-black text-foreground">{viewPayment.school?.name || 'Payment'}</h3></div><button onClick={() => setViewPayment(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              ['Plan', planLabel(viewPayment.plan)],
              ['Amount', money(viewPayment.amount)],
              ['Payment Method', viewPayment.method || '—'],
              ['Reference / Transaction ID', viewPayment.reference || viewPayment.id],
              ['Submitted / Paid Date', dateTime(viewPayment.submittedAt || viewPayment.createdAt)],
              ['Verified Date', dateTime(viewPayment.reviewedAt)],
              ['Created Date', dateTime(viewPayment.createdAt)],
              ['Last Updated', dateTime(viewPayment.updatedAt)],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-muted/30 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-black text-foreground">{value}</p></div>)}
          </div>
          {viewPayment.screenshotUrl && <div className="mt-4"><p className="mb-2 text-xs font-black text-foreground">Payment Proof</p><a href={viewPayment.screenshotUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border bg-black/20"><img src={viewPayment.screenshotUrl} alt="Payment proof" className="max-h-72 w-full object-contain" /></a></div>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {viewPayment.status === 'PENDING' && <><button onClick={() => void handleReject(viewPayment.id)} disabled={processing === viewPayment.id} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-black text-rose-500 disabled:opacity-50">Reject</button><button onClick={() => void handleApprove(viewPayment.id)} disabled={processing === viewPayment.id} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{processing === viewPayment.id ? 'Processing…' : 'Verify & Approve'}</button></>}
            <button onClick={() => setViewPayment(null)} className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-black text-foreground">Close</button>
          </div>
        </motion.div></div>}
      </AnimatePresence>
    </div>
  );
}
