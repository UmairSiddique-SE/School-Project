import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  School, TrendingUp, AlertTriangle, DollarSign, Clock, CheckCircle,
  GraduationCap, UserCheck, Activity, ArrowUpRight, ArrowDownRight,
  Settings, FileText, Shield, Zap, ExternalLink, Server, Database, Globe,
  Cpu, HardDrive, Award, Sparkles, ArrowRight, BellRing, WalletCards, Target
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import apiClient from '@/api/apiClient';

const CHART_COLORS = {
  grid: 'rgba(255,255,255,0.04)',
  tick: 'hsl(217.9 10.6% 54%)',
  tooltip: {
    background: 'hsl(224 71% 4%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
  },
};

function StatCard({
  label, value, icon: Icon, gradient, bg, textColor, change, up, loading, delay, subValue
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  gradient: string;
  bg: string;
  textColor: string;
  change: string;
  up: boolean;
  loading: boolean;
  delay: number;
  subValue?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative group overflow-hidden rounded-[24px] border border-white/[0.05] bg-slate-900/40 p-5 backdrop-blur-xl
        hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        style={{ background: `radial-gradient(circle at 10% 10%, ${up ? 'rgba(124,58,237,0.08)' : 'rgba(239,68,68,0.06)'} 0%, transparent 50%)` }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center
          ring-1 ring-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg`}>
          <Icon size={22} className={textColor} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter
            ${up
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'}`}>
            {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {up ? 'Optimal' : 'Review'}
          </span>
          {subValue && <span className="text-[10px] font-bold text-white/30">{subValue}</span>}
        </div>
      </div>

      <div className="relative mt-2">
        <p className={`text-3xl font-black tracking-tight leading-none ${loading ? 'animate-pulse' : ''} text-white`}>
          {loading ? '—' : value}
        </p>
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-2">{label}</p>
        <div className="flex items-center gap-2 mt-3">
           <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div
               initial={{ width: 0 }}
               animate={{ width: up ? '75%' : '40%' }}
               transition={{ delay: delay + 0.5, duration: 1 }}
               className={`h-full bg-gradient-to-r ${gradient}`}
             />
           </div>
           <span className="text-[10px] font-bold text-slate-500">{change}</span>
        </div>
      </div>
    </motion.div>
  );
}

function SystemHealthItem({ icon: Icon, label, value, status, color }: { icon: any; label: string; value: string; status: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-800 border border-white/5 ${color}`}>
          <Icon size={14} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{label}</p>
          <p className="text-xs font-black text-white">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">{status}</span>
        <div className={`h-1.5 w-1.5 rounded-full ${status === 'Healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'} pulse-dot`} />
      </div>
    </div>
  );
}

export default function Overview() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/overview')
      .then(r => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Active Schools',
      value: analytics?.activeSchools ?? 0,
      subValue: `${analytics?.totalSchools ?? 0} Global`,
      icon: School,
      gradient: 'from-violet-500 to-indigo-600',
      bg: 'bg-violet-500/10',
      textColor: 'text-violet-400',
      change: '+12% MoM',
      up: true,
    },
    {
      label: 'Platform Revenue',
      value: `$${(analytics?.monthRevenue ?? 0).toLocaleString()}`,
      subValue: 'Current Month',
      icon: DollarSign,
      gradient: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      change: '92% Target',
      up: true,
    },
    {
      label: 'Trial Conversion',
      value: '64.2%',
      subValue: 'Paid Upgrades',
      icon: TrendingUp,
      gradient: 'from-blue-400 to-cyan-500',
      bg: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      change: 'Benchmark',
      up: true,
    },
    {
      label: 'Renewal Risk',
      value: analytics?.expiredSchools ?? 0,
      subValue: 'Action Needed',
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
      bg: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      change: 'Critical',
      up: false,
    },
  ];

  const topSchools = [
    { name: 'Beacon House System', engagement: '98%', status: 'Premium', color: 'text-violet-400' },
    { name: 'City School Network', engagement: '94%', status: 'Active', color: 'text-blue-400' },
    { name: 'Army Public Academy', engagement: '89%', status: 'Active', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 pb-10">

      {/* ── Page Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-violet-500/15 bg-gradient-to-br from-violet-600/15 via-slate-900/60 to-slate-950/40 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              <Sparkles size={12} />
              Enterprise Command Center
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
              Platform Intelligence
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300 font-medium leading-relaxed">
              Global platform telemetry, institutional governance, and high-level
              business intelligence from one premium control room.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 group">
              <BellRing size={14} className="text-violet-300 group-hover:scale-110 transition-transform" />
              Platform Alerts
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] active:scale-[0.98]">
              Generate BI Report
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Main Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} loading={loading} delay={i * 0.08} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── System Health & Performance ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-1 space-y-6"
        >
          <div className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Cpu size={16} className="text-violet-400" />
                 System Health
               </h3>
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">99.9% Uptime</span>
             </div>
             <div className="space-y-3">
               <SystemHealthItem icon={Server} label="Compute Load" value="14.2%" status="Healthy" color="text-violet-400" />
               <SystemHealthItem icon={Database} label="DB Latency" value="12ms" status="Healthy" color="text-blue-400" />
               <SystemHealthItem icon={HardDrive} label="Object Storage" value="482 GB" status="Healthy" color="text-emerald-400" />
               <SystemHealthItem icon={Globe} label="CDN Delivery" value="Active" status="Healthy" color="text-amber-400" />
             </div>

             <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Security Shield</span>
                  <span className="text-[11px] font-bold text-emerald-400">Level 4 Enabled</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[95%]" />
                </div>
             </div>
          </div>

          <div className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl">
             <h3 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
               <Target size={16} className="text-amber-400" />
               Leading Schools
             </h3>
             <div className="space-y-4">
               {topSchools.map((sch, i) => (
                 <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-slate-400 border border-white/5">0{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{sch.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{sch.status} Institution</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-black ${sch.color}`}>{sch.engagement}</p>
                       <p className="text-[9px] font-bold text-slate-600 uppercase">Growth</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </motion.div>

        {/* ── Growth Matrix Chart ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-2 rounded-[28px] border border-white/[0.06] bg-slate-900/40 p-8 backdrop-blur-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Institutional Growth Matrix</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Platform-wide registration and student enrollment trends</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jan', schools: 45, enrollment: 2400 },
                { month: 'Feb', schools: 52, enrollment: 3100 },
                { month: 'Mar', schools: 48, enrollment: 4200 },
                { month: 'Apr', schools: 61, enrollment: 4800 },
                { month: 'May', schools: 75, enrollment: 5900 },
                { month: 'Jun', schools: 82, enrollment: 7200 },
                { month: 'Jul', schools: 94, enrollment: 8800 },
              ]}>
                <defs>
                  <linearGradient id="gradSchools" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_COLORS.tick, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.tick, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_COLORS.tooltip as any} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="schools" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradSchools)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="enrollment" stroke="#3b82f6" strokeWidth={2} fill="url(#gradEnroll)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Punjab', val: '45%', color: 'bg-violet-500' },
               { label: 'Sindh', val: '28%', color: 'bg-blue-500' },
               { label: 'KPK', val: '15%', color: 'bg-emerald-500' },
               { label: 'Other', val: '12%', color: 'bg-slate-500' },
             ].map(reg => (
               <div key={reg.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-default">
                 <div className="flex items-center gap-2 mb-1">
                   <div className={`h-2 w-2 rounded-full ${reg.color}`} />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{reg.label}</span>
                 </div>
                 <p className="text-xl font-black text-white">{reg.val}</p>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* ── Security & Governance Activity Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 shadow-lg">
               <Activity size={18} />
             </div>
             <div>
               <h3 className="font-black text-white text-lg leading-none tracking-tight">Security & Governance Intelligence</h3>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-2">Global Platform Audit Trail</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/50 uppercase tracking-widest hover:bg-white/10 transition-colors">
              Refresh Feed
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-[10px] font-black text-violet-400 uppercase tracking-widest hover:bg-violet-600/20 transition-colors">
              Live Logs
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/[0.03]">
          {[
            { action: 'Institutional Onboarding', detail: 'Elite International High-School network verified', time: '2 mins ago', type: 'success', icon: Plus },
            { action: 'Policy Synchronization', detail: 'Cross-tenant resource quota updated (500GB Standard)', time: '14 mins ago', type: 'info', icon: Settings },
            { action: 'Revenue Settlement', detail: 'Transactional volume disbursement finalized for Q3', time: '1 hour ago', type: 'revenue', icon: DollarSign },
            { action: 'Anomaly Detected', detail: 'Unusual IP pattern in Super-Admin subnet (Auto-blocked)', time: '3 hours ago', type: 'warning', icon: Shield },
          ].map((item, i) => {
            const colors: any = {
              success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              warning: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              revenue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              info: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
            };
            const Icon = (item as any).icon || Activity;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="flex items-center gap-6 px-8 py-5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${colors[item.type]} shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white group-hover:text-violet-300 transition-colors">{item.action}</p>
                  <p className="text-[12px] text-slate-500 mt-1.5 font-medium leading-relaxed">{item.detail}</p>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-[11px] font-black text-white/20 uppercase tracking-widest">{item.time}</p>
                   <div className="flex items-center justify-end gap-1.5 mt-1.5">
                      <span className="text-[9px] font-black text-violet-500 uppercase tracking-tighter bg-violet-500/5 px-1.5 py-0.5 rounded border border-violet-500/10">Verified</span>
                      <div className="h-1 w-1 rounded-full bg-violet-500" />
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
