import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, TrendingUp, Users, School, DollarSign, BarChart2,
  FileText, CheckCircle, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const CHART_COLORS = {
  grid: 'rgba(255,255,255,0.04)',
  tick: 'hsl(217 10% 54%)',
  tooltip: {
    background: 'hsl(224 71% 5%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    fontSize: 12,
    color: '#fff',
  },
};

const monthlyData = [
  { month: 'Jan', schools: 4,  students: 320,  revenue: 4200 },
  { month: 'Feb', schools: 7,  students: 580,  revenue: 7800 },
  { month: 'Mar', schools: 10, students: 840,  revenue: 11200 },
  { month: 'Apr', schools: 12, students: 990,  revenue: 9800 },
  { month: 'May', schools: 16, students: 1340, revenue: 14600 },
  { month: 'Jun', schools: 19, students: 1680, revenue: 17200 },
  { month: 'Jul', schools: 24, students: 2100, revenue: 21500 },
];

const planDistribution = [
  { name: 'Free Trial', value: 6,  color: '#64748b' },
  { name: 'Basic',      value: 8,  color: '#3b82f6' },
  { name: 'Standard',   value: 7,  color: '#7c3aed' },
  { name: 'Premium',    value: 3,  color: '#f59e0b' },
];

const topSchools = [
  { name: 'Beacon House',       students: 450, revenue: 199 },
  { name: 'City High',          students: 320, revenue: 99 },
  { name: 'Army Public',        students: 290, revenue: 199 },
  { name: 'Roots International',students: 180, revenue: 99 },
  { name: 'LGS',                students: 150, revenue: 49 },
];

const reports = [
  {
    id: 'school-summary',
    name: 'School Summary Report',
    desc: 'All schools with status, plan, and student counts',
    icon: School,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500/20',
    tag: 'Management',
    tagColor: 'bg-violet-500/10 text-violet-400',
  },
  {
    id: 'revenue-report',
    name: 'Revenue Report',
    desc: 'Monthly subscription revenue breakdown',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    tag: 'Finance',
    tagColor: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'user-report',
    name: 'User Activity Report',
    desc: 'Login activity and engagement metrics',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
    tag: 'Analytics',
    tagColor: 'bg-blue-500/10 text-blue-400',
  },
  {
    id: 'plan-report',
    name: 'Plan Distribution Report',
    desc: 'Breakdown of schools by subscription plan',
    icon: BarChart2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    tag: 'Finance',
    tagColor: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'expiry-report',
    name: 'Expiry Alert Report',
    desc: 'Schools with plans expiring in next 30 days',
    icon: TrendingUp,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    ring: 'ring-rose-500/20',
    tag: 'Alerts',
    tagColor: 'bg-rose-500/10 text-rose-400',
  },
  {
    id: 'audit-report',
    name: 'Audit Trail Report',
    desc: 'All admin actions and system changes',
    icon: FileText,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/20',
    tag: 'System',
    tagColor: 'bg-indigo-500/10 text-indigo-400',
  },
];

export default function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const response = await apiClient.get(`/admin/reports/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${id}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloaded(prev => new Set([...prev, id]));
      toast.success('Report downloaded successfully!');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Platform-wide insights and downloadable reports</p>
      </div>

      {/* ── Charts: Growth + Plan Distribution ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Growth Trends (2/3 width) */}
        <div className="xl:col-span-2 bg-card border border-white/[0.06] rounded-2xl p-6 hover:border-violet-500/15 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-foreground text-[15px]">Growth Trends</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />Schools</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />Students</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Monthly growth of schools & students</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gSchool" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gStudent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_COLORS.tooltip as any} />
              <Area type="monotone" dataKey="schools"  stroke="#7c3aed" strokeWidth={2.5} fill="url(#gSchool)"  name="Schools"  dot={false} />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2}   fill="url(#gStudent)" name="Students" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution Donut (1/3 width) */}
        <div className="bg-card border border-white/[0.06] rounded-2xl p-6 hover:border-amber-500/15 transition-colors">
          <h3 className="font-black text-foreground text-[15px] mb-0.5">Plan Distribution</h3>
          <p className="text-xs text-muted-foreground mb-5">Schools by subscription tier</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%" cy="45%"
                innerRadius={50} outerRadius={75}
                dataKey="value"
                paddingAngle={4}
                strokeWidth={0}
              >
                {planDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_COLORS.tooltip as any} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Breakdown list */}
          <div className="mt-3 space-y-2">
            {planDistribution.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-muted-foreground font-medium">{p.name}</span>
                </div>
                <span className="font-black text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Schools Bar Chart ── */}
      <div className="bg-card border border-white/[0.06] rounded-2xl p-6 hover:border-blue-500/15 transition-colors">
        <h3 className="font-black text-foreground text-[15px] mb-0.5">Top Schools by Students</h3>
        <p className="text-xs text-muted-foreground mb-5">Largest schools on the platform</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topSchools} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="name" type="category"
              tick={{ fontSize: 11, fill: CHART_COLORS.tick }}
              axisLine={false} tickLine={false} width={120}
            />
            <Tooltip contentStyle={CHART_COLORS.tooltip as any} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
            <Bar dataKey="students" radius={[0, 6, 6, 0]} name="Students">
              {topSchools.map((_, i) => (
                <Cell key={i} fill={`url(#topBar${i})`} />
              ))}
            </Bar>
            <defs>
              {topSchools.map((_, i) => (
                <linearGradient key={i} id={`topBar${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Downloadable Reports ── */}
      <div>
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Download size={13} className="text-violet-400" />
          Downloadable Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((r, i) => {
            const Icon = r.icon;
            const isLoading = downloading === r.id;
            const isDone = downloaded.has(r.id);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -2 }}
                className="group bg-card border border-white/[0.06] rounded-2xl p-5
                  hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/8
                  transition-all duration-200 flex flex-col gap-4"
              >
                {/* Top row: icon + tag */}
                <div className="flex items-start justify-between">
                  <div className={`h-11 w-11 rounded-xl ${r.bg} ring-1 ${r.ring} flex items-center justify-center
                    group-hover:scale-105 transition-transform duration-200`}>
                    <Icon size={20} className={r.color} />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${r.tagColor}`}>
                    {r.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="font-black text-foreground text-[13px] leading-snug">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                </div>

                {/* Download button */}
                <button
                  onClick={() => handleDownload(r.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold
                    transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                    ${isDone
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                      : 'bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/25 group-hover:bg-violet-500/15 group-hover:text-violet-400'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Generating…
                    </>
                  ) : isDone ? (
                    <>
                      <CheckCircle size={13} />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      Download CSV
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
