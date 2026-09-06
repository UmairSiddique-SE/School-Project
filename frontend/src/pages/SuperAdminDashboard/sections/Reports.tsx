import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Loader2, RefreshCw, School, TrendingUp, Users, DollarSign, BarChart2, CheckCircle, type LucideIcon } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const PLAN_COLORS: Record<string, string> = {
  FREE_TRIAL: '#64748b',
  PROFESSIONAL: '#7c3aed',
  PREMIUM: '#f59e0b',
};

type ReportData = {
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
  recentSchools: { id: string; name: string; createdAt: string }[];
  expiringSchools: { id: string; name: string; expiryDate: string; daysLeft: number }[];
};

type ReportCard = {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
};

const reportCards: ReportCard[] = [
  { id: 'school-summary', name: 'School Summary Report', desc: 'All schools with status, plan and subscription expiry.', icon: School, tone: 'violet' },
  { id: 'revenue-report', name: 'Revenue Report', desc: 'Approved and recorded onboarding subscription payments.', icon: DollarSign, tone: 'emerald' },
  { id: 'user-report', name: 'User Activity Report', desc: 'Platform users and their account activity.', icon: Users, tone: 'blue' },
  { id: 'plan-report', name: 'Plan Distribution Report', desc: 'Schools grouped by their actual subscription plan.', icon: BarChart2, tone: 'amber' },
  { id: 'expiry-report', name: 'Expiry Alert Report', desc: 'Schools whose subscriptions expire within 30 days.', icon: TrendingUp, tone: 'rose' },
  { id: 'audit-report', name: 'Audit Trail Report', desc: 'Administrative actions and system changes.', icon: FileText, tone: 'indigo' },
];

function formatPlan(plan: string) {
  if (plan === 'FREE_TRIAL') return 'Free Trial';
  if (plan === 'PROFESSIONAL') return 'Professional';
  if (plan === 'PREMIUM') return 'Premium';
  return plan.replace(/_/g, ' ');
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const toneClasses: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/10 text-amber-400',
  rose: 'bg-rose-500/10 text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
};

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadReports = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const response = await apiClient.get<ReportData>('/admin/overview');
      setData(response.data);
    } catch (err) {
      console.error('Failed to load live reports', err);
      setError('Unable to load live report data from the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadReports(); }, []);

  const growthData = useMemo(() => (data?.schoolGrowth ?? []).map((item) => ({ month: formatMonth(item.month), schools: item.count })), [data]);
  const revenueData = useMemo(() => (data?.revenueTimeline ?? []).map((item) => ({ month: formatMonth(item.month), revenue: item.amount })), [data]);
  const planData = useMemo(() => (data?.planDistribution ?? []).map((item) => ({ name: formatPlan(item.plan), value: item.count, plan: item.plan })), [data]);

  const metricCards: { label: string; value: number; Icon: LucideIcon }[] = data ? [
    { label: 'Schools', value: data.totalSchools, Icon: School },
    { label: 'Students', value: data.totalStudents, Icon: Users },
    { label: 'Teachers', value: data.totalTeachers, Icon: Users },
    { label: 'Active Subscriptions', value: data.activeSubscriptions, Icon: TrendingUp },
  ] : [];

  const handleDownload = async (id: string) => {
    try {
      setDownloading(id);
      const response = await apiClient.get(`/admin/reports/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${id}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloaded((previous) => new Set(previous).add(id));
      toast.success('Live report downloaded successfully.');
    } catch (err) {
      console.error(`Failed to download ${id}`, err);
      toast.error('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" />Loading live reports...</div></div>;
  }

  if (error || !data) {
    return <div className="min-h-[400px] flex items-center justify-center"><div className="text-center"><p className="text-sm font-semibold text-destructive">{error ?? 'No report data available.'}</p><button onClick={() => void loadReports()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><RefreshCw size={14} />Retry</button></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-2xl font-black text-foreground tracking-tight">Reports & Analytics</h2><p className="text-muted-foreground text-sm mt-0.5">Live platform analytics from the production database.</p></div>
        <button onClick={() => void loadReports(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-60"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, Icon }) => <div key={label} className="bg-card border border-border rounded-2xl p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">{label}</span><Icon size={16} className="text-primary" /></div><p className="mt-2 text-2xl font-black text-foreground">{value.toLocaleString()}</p></div>)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6"><h3 className="font-black text-foreground text-[15px]">School Growth</h3><p className="text-xs text-muted-foreground mb-5">Schools created per month from the database.</p>{growthData.length === 0 ? <div className="h-[230px] flex items-center justify-center text-sm text-muted-foreground">No school growth data yet.</div> : <ResponsiveContainer width="100%" height={230}><AreaChart data={growthData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="schools" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.12} strokeWidth={2.5} name="Schools" /></AreaChart></ResponsiveContainer>}</div>
        <div className="bg-card border border-border rounded-2xl p-6"><h3 className="font-black text-foreground text-[15px]">Plan Distribution</h3><p className="text-xs text-muted-foreground mb-5">Actual subscriptions in the database.</p>{planData.length === 0 ? <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No subscriptions yet.</div> : <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={planData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4} strokeWidth={0}>{planData.map((entry, index) => <Cell key={`${entry.plan}-${index}`} fill={PLAN_COLORS[entry.plan] ?? '#64748b'} />)}</Pie><Tooltip /><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /></PieChart></ResponsiveContainer>}<div className="mt-3 space-y-2">{planData.map((item) => <div key={item.plan} className="flex items-center justify-between text-xs"><span className="text-muted-foreground font-medium">{item.name}</span><span className="font-black text-foreground">{item.value.toLocaleString()}</span></div>)}</div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-6"><h3 className="font-black text-foreground text-[15px]">Revenue Timeline</h3><p className="text-xs text-muted-foreground mb-5">Approved payment revenue by month.</p>{revenueData.length === 0 ? <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No approved revenue yet.</div> : <ResponsiveContainer width="100%" height={200}><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`PKR ${Number(value ?? 0).toLocaleString()}`, 'Revenue']} /><Bar dataKey="revenue" radius={[6, 6, 0, 0]} name="Revenue" fill="#10b981" /></BarChart></ResponsiveContainer>}</div>
        <div className="bg-card border border-border rounded-2xl p-6"><h3 className="font-black text-foreground text-[15px]">Recent Schools</h3><p className="text-xs text-muted-foreground mb-5">Newest real school records.</p><div className="space-y-2">{data.recentSchools.length === 0 ? <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">No schools registered yet.</div> : data.recentSchools.slice(0, 6).map((school) => <div key={school.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-bold text-foreground">{school.name}</p><p className="text-[10px] text-muted-foreground">Created {new Date(school.createdAt).toLocaleDateString()}</p></div><School size={14} className="shrink-0 text-primary" /></div>)}</div></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['Active Schools', data.activeSchools], ['Free Trials', data.trialSchools], ['Expired', data.expiredSchools], ['Pending Requests', data.pendingSchoolRequests], ['Pending Payments', data.pendingPayments]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{String(label)}</p><p className="mt-1 text-xl font-black text-foreground">{Number(value).toLocaleString()}</p></div>)}</div>

      <div className="bg-card border border-border rounded-2xl p-6"><div className="flex items-center justify-between mb-5"><div><h3 className="font-black text-foreground text-[15px]">Expiry Alerts</h3><p className="text-xs text-muted-foreground mt-0.5">Live subscriptions expiring within 30 days.</p></div><span className="text-xs font-black text-rose-400">{data.expiringSchools.length}</span></div>{data.expiringSchools.length === 0 ? <p className="text-sm text-muted-foreground">No schools are expiring within the next 30 days.</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{data.expiringSchools.map((school) => <div key={school.id} className="flex items-center justify-between rounded-xl bg-rose-500/5 px-3 py-2.5"><span className="text-xs font-bold text-foreground truncate">{school.name}</span><span className="ml-3 shrink-0 text-[10px] font-black text-rose-400">{school.daysLeft}d left</span></div>)}</div>}</div>

      <div><h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Download size={13} className="text-primary" />Downloadable Reports</h3><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{reportCards.map((report) => { const Icon = report.icon; const isLoading = downloading === report.id; const isDone = downloaded.has(report.id); return <div key={report.id} className="group bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-all"><div className="flex items-start justify-between"><div className={`h-11 w-11 rounded-xl flex items-center justify-center ${toneClasses[report.tone]}`}><Icon size={20} /></div><span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Live DB</span></div><div className="flex-1"><p className="font-black text-foreground text-[13px] leading-snug">{report.name}</p><p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{report.desc}</p></div><button onClick={() => void handleDownload(report.id)} disabled={isLoading} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 ${isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'}`}>{isLoading ? <><Loader2 size={13} className="animate-spin" />Generating…</> : isDone ? <><CheckCircle size={13} />Downloaded</> : <><Download size={13} />Download CSV</>}</button></div>; })}</div></div>
    </div>
  );
}
