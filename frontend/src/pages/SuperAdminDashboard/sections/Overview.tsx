import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  School, TrendingUp, AlertTriangle, DollarSign, Clock, CheckCircle,
  Users, GraduationCap, UserCheck, Activity, ArrowUpRight, ArrowDownRight,
  Settings, FileText, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import apiClient from '@/api/apiClient';



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
      label: 'Total Schools',
      value: analytics?.totalSchools ?? 0,
      icon: School,
      gradient: 'from-violet-600 to-purple-700',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      change: 'Active & suspended',
      up: true,
    },
    {
      label: 'Active Schools',
      value: analytics?.activeSchools ?? 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      change: `${analytics?.totalSchools - analytics?.activeSchools || 0} suspended`,
      up: true,
    },
    {
      label: 'Trial Schools',
      value: analytics?.trialSchools ?? 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      change: 'Needs conversion',
      up: false,
    },
    {
      label: 'Expired Schools',
      value: analytics?.expiredSchools ?? 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      change: 'Subscription ended',
      up: false,
    },
    {
      label: 'Monthly Revenue',
      value: `$${(analytics?.monthRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      change: `$${(analytics?.todayRevenue ?? 0).toLocaleString()} today`,
      up: true,
    },
    {
      label: 'Total Students',
      value: analytics?.totalStudents ?? 0,
      icon: GraduationCap,
      gradient: 'from-pink-500 to-fuchsia-600',
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      change: 'Across all schools',
      up: true,
    },
    {
      label: 'Total Teachers',
      value: analytics?.totalTeachers ?? 0,
      icon: UserCheck,
      gradient: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      change: 'Across all schools',
      up: true,
    },
    {
      label: 'Pending School Requests',
      value: analytics?.pendingSchoolRequests ?? 0,
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      change: 'Needs review',
      up: false,
    },
  ];

  // Map database timeline growth, or default fallback if empty
  const schoolGrowthTimeline = analytics?.schoolGrowth && analytics.schoolGrowth.length > 0
    ? analytics.schoolGrowth.map((item: any) => ({ month: item.month, schools: item.count }))
    : [{ month: 'Current', schools: analytics?.totalSchools || 0 }];

  // Map database revenue timeline, or default fallback if empty
  const revenueTimeline = analytics?.revenueTimeline && analytics.revenueTimeline.length > 0
    ? analytics.revenueTimeline.map((item: any) => ({ month: item.month, revenue: item.amount }))
    : [{ month: 'Current', revenue: analytics?.monthRevenue || 0 }];

  const recentActivityList = analytics?.recentActivities && analytics.recentActivities.length > 0
    ? analytics.recentActivities.map((item: any) => ({
        id: item.id,
        action: item.action,
        detail: item.detail,
        time: new Date(item.time).toLocaleTimeString(),
        type: item.action === 'APPROVE' || item.action === 'CREATE' ? 'success' : item.action === 'DELETE' ? 'warning' : 'info'
      }))
    : [
        { id: 1, action: 'No activity yet', detail: 'Events will list here', time: '—', type: 'info' }
      ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Real-time metrics across all schools on EduSphere</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={20} className={s.text} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${s.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </span>
            </div>
            <p className="text-3xl font-black text-foreground">
              {loading ? <span className="animate-pulse">—</span> : s.value}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">{s.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><FileText size={18} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Review Requests</p>
              <p className="text-xs text-muted-foreground">{analytics?.pendingSchoolRequests || 0} pending</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><School size={18} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Manage Schools</p>
              <p className="text-xs text-muted-foreground">{analytics?.activeSchools || 0} active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><Shield size={18} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Platform Plans</p>
              <p className="text-xs text-muted-foreground">Configure subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500"><Settings size={18} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">System Settings</p>
              <p className="text-xs text-muted-foreground">Platform configuration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* School Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground">School Growth</h3>
              <p className="text-xs text-muted-foreground">Cumulative registrations</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <TrendingUp size={12} />
              Platform Growth
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={schoolGrowthTimeline}>
              <defs>
                <linearGradient id="schoolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 27.9% 16.9%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(224 71.4% 4.1%)', border: '1px solid hsl(215 27.9% 16.9%)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="schools" stroke="hsl(262.1 83.3% 57.8%)" strokeWidth={2.5} fill="url(#schoolGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Monthly subscription revenue</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
              <DollarSign size={12} />
              Live Ledger
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 27.9% 16.9%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(224 71.4% 4.1%)', border: '1px solid hsl(215 27.9% 16.9%)', borderRadius: 12, fontSize: 12 }}
                formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Activity size={18} className="text-primary" />
          <h3 className="font-bold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {recentActivityList.map((item: any) => {
            const dots: Record<string, string> = {
              success: 'bg-emerald-400',
              warning: 'bg-amber-400',
              info: 'bg-blue-400',
            };
            return (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-all">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dots[item.type] || 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
