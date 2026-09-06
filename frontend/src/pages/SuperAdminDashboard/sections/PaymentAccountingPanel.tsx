import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, RefreshCw, TrendingUp, WalletCards, AlertTriangle, Users, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

type Accounting = {
  monthRevenue: number;
  todayRevenue: number;
  allTimeRevenue: number;
  monthFirstTimeRevenue: number;
  monthRecurringRevenue: number;
  firstTimePaymentCount: number;
  recurringPaymentCount: number;
  pendingRevenue: number;
  pendingCount: number;
  rejectedRevenue: number;
  rejectedCount: number;
  expectedNext7Revenue: number;
  expectedNext30Revenue: number;
  expectedNext7Count: number;
  expectedNext30Count: number;
  overdueRevenue: number;
  overdueCount: number;
  timeline: { month: string; firstTime: number; recurring: number; total: number }[];
};

const empty: Accounting = {
  monthRevenue: 0, todayRevenue: 0, allTimeRevenue: 0, monthFirstTimeRevenue: 0, monthRecurringRevenue: 0,
  firstTimePaymentCount: 0, recurringPaymentCount: 0, pendingRevenue: 0, pendingCount: 0, rejectedRevenue: 0,
  rejectedCount: 0, expectedNext7Revenue: 0, expectedNext30Revenue: 0, expectedNext7Count: 0,
  expectedNext30Count: 0, overdueRevenue: 0, overdueCount: 0, timeline: [],
};

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;

function Card({ title, value, caption, icon: Icon, tone }: { title: string; value: string; caption: string; icon: React.ComponentType<any>; tone: string }) {
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{title}</span><span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon size={15} /></span></div>
    <p className="mt-3 text-xl font-black text-foreground">{value}</p>
    <p className="mt-1 text-[10px] text-muted-foreground">{caption}</p>
  </div>;
}

export default function PaymentAccountingPanel() {
  const [data, setData] = useState<Accounting>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Accounting>('/admin/payment-accounting');
      setData(response.data || empty);
    } catch {
      toast.error('Unable to load accounting summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const maxTimeline = Math.max(1, ...data.timeline.map((x) => x.total));

  return <section className="space-y-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary"><WalletCards size={12} /> Accountant Console</div>
        <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">Revenue, Collections & Expected Billing</h3>
        <p className="mt-1 text-xs text-muted-foreground">Collected money is separated from pending, first-time onboarding, recurring renewals, upcoming renewals and overdue billing.</p>
      </div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-foreground hover:bg-muted disabled:opacity-60"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} />Refresh accounting</button>
    </div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Card title="This Month Collected" value={money(data.monthRevenue)} caption="Verified / approved payments" icon={WalletCards} tone="bg-emerald-500/10 text-emerald-500" />
      <Card title="First-Time Payments" value={money(data.monthFirstTimeRevenue)} caption={`${data.firstTimePaymentCount} onboarding payment(s) all time`} icon={Users} tone="bg-cyan-500/10 text-cyan-500" />
      <Card title="Recurring / Renewals" value={money(data.monthRecurringRevenue)} caption={`${data.recurringPaymentCount} recurring payment(s) all time`} icon={RefreshCw} tone="bg-indigo-500/10 text-indigo-500" />
      <Card title="All-Time Collected" value={money(data.allTimeRevenue)} caption="All approved revenue" icon={TrendingUp} tone="bg-violet-500/10 text-violet-500" />
      <Card title="Pending to Verify" value={money(data.pendingRevenue)} caption={`${data.pendingCount} payment(s) waiting`} icon={Clock3} tone="bg-amber-500/10 text-amber-500" />
      <Card title="Expected Next 7 Days" value={money(data.expectedNext7Revenue)} caption={`${data.expectedNext7Count} renewal(s) due`} icon={CalendarClock} tone="bg-blue-500/10 text-blue-500" />
      <Card title="Expected Next 30 Days" value={money(data.expectedNext30Revenue)} caption={`${data.expectedNext30Count} renewal(s) due`} icon={ArrowUpRight} tone="bg-sky-500/10 text-sky-500" />
      <Card title="Overdue Billing" value={money(data.overdueRevenue)} caption={`${data.overdueCount} expired paid-plan school(s)`} icon={AlertTriangle} tone="bg-rose-500/10 text-rose-500" />
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
        <div className="mb-4 flex items-center justify-between"><div><h4 className="font-black text-foreground">Monthly Revenue Split</h4><p className="text-[10px] text-muted-foreground">First-time vs recurring verified payments</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black text-primary">LIVE DB</span></div>
        {data.timeline.length ? <div className="space-y-3">{data.timeline.map((item) => <div key={item.month} className="grid grid-cols-[72px_1fr_100px] items-center gap-3 text-xs"><span className="font-bold text-muted-foreground">{item.month}</span><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (item.total / maxTimeline) * 100)}%` }} /></div><span className="text-right font-black text-foreground">{money(item.total)}</span></div>)}</div> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No approved payment history yet.</div>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h4 className="font-black text-foreground">Accountant Checklist</h4>
        <div className="mt-4 space-y-3">
          {[
            ['Revenue recognized', 'Only after Super Admin approval'],
            ['First payment', 'Separated from recurring renewals'],
            ['Pending money', 'Tracked but not counted as earned'],
            ['Expected money', 'Based on active subscriptions due soon'],
            ['Overdue money', 'Expired paid subscriptions tracked'],
            ['Audit trail', 'Payment approval/rejection is logged'],
          ].map(([title, text]) => <div key={title} className="flex gap-2.5 rounded-xl bg-muted/30 p-3"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" /><div><p className="text-[11px] font-black text-foreground">{title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{text}</p></div></div>)}
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-[11px] text-muted-foreground">
      <strong className="text-foreground">Payment details are automatic:</strong> when a school submits a payment, EduSphere stores the school, selected plan, exact plan amount, payment method, transaction/reference ID, payment proof, submitted time and status. Super Admin only needs to verify it; approval time and the subscription activation/expiry are recorded automatically.
    </div>
  </section>;
}
