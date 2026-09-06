import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";

type OverviewData = {
  totalSchools: number;
  activeSchools: number;
  trialSchools: number;
  expiredSchools: number;
  pendingSchoolRequests: number;
  pendingPayments: number;
  monthRevenue: number;
  todayRevenue: number;
  totalStudents: number;
  totalTeachers: number;
  activeSubscriptions: number;
  schoolGrowth: { month: string; count: number }[];
  revenueTimeline: { month: string; amount: number }[];
  planDistribution: { plan: string; count: number }[];
  expiringSchools: { id: string; name: string; expiryDate: string; daysLeft: number }[];
  recentActivities: { id: string; action: string; detail: string; time: string; user: string }[];
};

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const number = (value: number) => Number(value || 0).toLocaleString();

function StatCard({ title, value, caption, icon: Icon, tone }: { title: string; value: string; caption: string; icon: React.ComponentType<any>; tone: string }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="group rounded-[22px] border border-border bg-card p-5 shadow-sm transition-all hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon size={20} /></div>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Live</span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wider text-foreground">{title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{caption}</p>
    </motion.div>
  );
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await apiClient.get<OverviewData>("/admin/overview");
      setData(response.data);
    } catch {
      toast.error("Could not load live dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const chartData = useMemo(() => {
    const revenue = new Map((data?.revenueTimeline || []).map((x) => [x.month, x.amount]));
    return (data?.schoolGrowth || []).map((x) => ({ month: x.month.slice(0, 7), schools: x.count, revenue: revenue.get(x.month) || 0 }));
  }, [data]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      const response = await apiClient.get("/admin/reports/school-summary/download", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `edusphere-platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Live platform report generated successfully.");
    } catch {
      toast.error("Report generation failed. Please retry.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !data) {
    return <div className="min-h-[420px] flex items-center justify-center"><div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-muted-foreground shadow-sm"><Loader2 size={18} className="animate-spin text-primary" />Loading live platform intelligence…</div></div>;
  }

  const d = data || {
    totalSchools: 0, activeSchools: 0, trialSchools: 0, expiredSchools: 0, pendingSchoolRequests: 0, pendingPayments: 0,
    monthRevenue: 0, todayRevenue: 0, totalStudents: 0, totalTeachers: 0, activeSubscriptions: 0,
    schoolGrowth: [], revenueTimeline: [], planDistribution: [], expiringSchools: [], recentActivities: [],
  };

  const inactiveSchools = Math.max(0, d.totalSchools - d.activeSchools);

  return (
    <div className="space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[30px] border border-border bg-gradient-to-br from-cyan-500/10 via-card to-indigo-500/10 p-7 shadow-sm">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary"><BarChart3 size={12} /> Super Admin Intelligence</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">Platform Dashboard</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Real database overview for schools, subscriptions, revenue, people and operational alerts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
            <button onClick={() => void generateReport()} disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-95 disabled:opacity-60">{generating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}{generating ? "Generating…" : "Generate Report"}<ArrowRight size={14} /></button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Institutional overview</p><span className="text-[10px] font-bold text-muted-foreground">Live DB metrics</span></div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard title="Total Schools" value={number(d.totalSchools)} caption="All registered schools" icon={School} tone="bg-cyan-500/10 text-cyan-600 dark:text-cyan-300" />
          <StatCard title="Active Schools" value={number(d.activeSchools)} caption="Currently operational" icon={CheckCircle2} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
          <StatCard title="Inactive" value={number(inactiveSchools)} caption="Not currently active" icon={XCircle} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
          <StatCard title="Free Trials" value={number(d.trialSchools)} caption="Trial subscriptions" icon={Clock3} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" />
          <StatCard title="Expired" value={number(d.expiredSchools)} caption="Needs renewal" icon={CalendarClock} tone="bg-orange-500/10 text-orange-600 dark:text-orange-300" />
        </div>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Revenue & platform people</div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard title="Month Revenue" value={money(d.monthRevenue)} caption="Approved payments" icon={WalletCards} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
          <StatCard title="Today's Income" value={money(d.todayRevenue)} caption="Approved today" icon={WalletCards} tone="bg-blue-500/10 text-blue-600 dark:text-blue-300" />
          <StatCard title="Pending Payments" value={number(d.pendingPayments)} caption="Awaiting review" icon={BellRing} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" />
          <StatCard title="Students" value={number(d.totalStudents)} caption="Across all schools" icon={GraduationCap} tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" />
          <StatCard title="Teachers" value={number(d.totalTeachers)} caption="Across all schools" icon={Users} tone="bg-violet-500/10 text-violet-600 dark:text-violet-300" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-black text-foreground">Growth & Revenue</h3><p className="mt-0.5 text-xs text-muted-foreground">Monthly records from the production database</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">LIVE</span></div>
          {chartData.length ? <ResponsiveContainer width="100%" height={250}><AreaChart data={chartData}><defs><linearGradient id="schoolFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,.14)" /><XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="schools" stroke="#0284c7" strokeWidth={3} fill="url(#schoolFill)" name="Schools" /></AreaChart></ResponsiveContainer> : <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No school growth data yet.</div>}
        </div>

        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm">
          <div className="mb-5"><h3 className="font-black text-foreground">Subscription Mix</h3><p className="mt-0.5 text-xs text-muted-foreground">Actual subscription records</p></div>
          <div className="space-y-4">
            {d.planDistribution.length ? d.planDistribution.map((item) => { const total = d.planDistribution.reduce((sum, x) => sum + x.count, 0); const pct = total ? Math.round((item.count / total) * 100) : 0; const label = item.plan === "FREE_TRIAL" ? "Free Trial" : item.plan.charAt(0) + item.plan.slice(1).toLowerCase(); return <div key={item.plan}><div className="mb-1.5 flex justify-between text-xs"><span className="font-bold text-foreground">{label}</span><span className="font-black text-muted-foreground">{item.count} · {pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${pct}%` }} /></div></div>; }) : <div className="py-12 text-center text-sm text-muted-foreground">No subscription records yet.</div>}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2"><div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-black text-foreground">{number(d.activeSubscriptions)}</p><p className="text-[10px] text-muted-foreground">Active subscriptions</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-black text-foreground">{number(d.pendingSchoolRequests)}</p><p className="text-[10px] text-muted-foreground">Pending requests</p></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-black text-foreground">Expiry Watch</h3><p className="mt-0.5 text-xs text-muted-foreground">Schools expiring within 30 days</p></div><span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-600 dark:text-rose-300">{d.expiringSchools.length} alerts</span></div>
          {d.expiringSchools.length ? <div className="space-y-2">{d.expiringSchools.slice(0, 7).map((school) => <div key={school.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-3"><div className="min-w-0"><p className="truncate text-xs font-black text-foreground">{school.name}</p><p className="text-[10px] text-muted-foreground">{school.expiryDate ? new Date(school.expiryDate).toLocaleDateString("en-PK") : "No date"}</p></div><span className={`ml-3 shrink-0 rounded-lg px-2 py-1 text-[10px] font-black ${school.daysLeft <= 7 ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}>{school.daysLeft}d left</span></div>)}</div> : <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">No schools are expiring soon.</div>}
        </div>

        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm">
          <div className="mb-5"><h3 className="font-black text-foreground">Recent Activity</h3><p className="mt-0.5 text-xs text-muted-foreground">Latest platform audit events</p></div>
          {d.recentActivities.length ? <div className="space-y-2">{d.recentActivities.slice(0, 7).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 size={14} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-foreground">{item.action}</p><p className="truncate text-[10px] text-muted-foreground">{item.detail}</p></div><span className="shrink-0 text-[9px] font-bold text-muted-foreground">{item.time ? new Date(item.time).toLocaleDateString("en-PK") : "—"}</span></div>)}</div> : <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">No audit activity yet.</div>}
        </div>
      </div>
    </div>
  );
}
