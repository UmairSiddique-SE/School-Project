import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  FileBarChart2, TrendingUp, DollarSign, Award, Users, Calendar,
  Download, Printer, CheckCircle, AlertTriangle, ArrowUpRight,
  Layers, Sparkles, BookOpen, GraduationCap, X, RefreshCw,
  CircleDashed
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal from '@/component/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeopleStats {
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
  staffCount: number;
  classesCount: number;
  totalRevenue: number;
  pendingFees: number;
  pendingFeePaymentsCount: number;
  todayAttendancePercentage: number;
  presentToday: number;
  absentToday: number;
  announcements: { id: string; title: string; publishedAt: string }[];
}

interface FinanceSummary {
  totalCollected: number;
  totalExpected: number;
  totalExpenses: number;
  collectionRate: number;
  monthlyBreakdown?: { month: string; collected: number; expected: number; expenses: number }[];
  feeTypeBreakdown?: { name: string; value: number; color: string }[];
}

interface AttendanceSummary {
  schoolId: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyTrend?: { name: string; rate: number; boys?: number; girls?: number }[];
}

interface ClassRow {
  id: string;
  name: string;
  sections?: { id: string; name: string; students?: unknown[] }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const money = (v: number) =>
  `PKR ${Number(v || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const pct = (v: number) => `${Number(v || 0).toFixed(1)}%`;

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-muted-foreground">
    <CircleDashed size={28} className="opacity-40" />
    <p className="text-xs font-semibold text-center">{label}</p>
    <p className="text-[11px] opacity-60">Data will appear as records are added.</p>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const schoolName = user?.schoolName || 'Your School';

  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'academic' | 'attendance' | 'exports'>('overview');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Live state
  const [stats, setStats] = useState<PeopleStats | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  // ─── Load Data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [peopleRes, financeRes, attendanceRes, classesRes] = await Promise.allSettled([
          apiClient.get<PeopleStats>('/people/stats'),
          apiClient.get<FinanceSummary>('/finance/summary'),
          apiClient.get<AttendanceSummary>('/attendance/summary'),
          apiClient.get<ClassRow[]>('/classes'),
        ]);

        if (peopleRes.status === 'fulfilled') setStats(peopleRes.value.data);
        if (financeRes.status === 'fulfilled') setFinanceSummary(financeRes.value.data);
        if (attendanceRes.status === 'fulfilled') setAttendanceSummary(attendanceRes.value.data);
        if (classesRes.status === 'fulfilled') {
          const raw = classesRes.value.data;
          setClasses(Array.isArray(raw) ? raw : []);
        }
      } catch (e) {
        // Individual errors handled by allSettled
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.schoolId, refreshKey]);

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const collectionRate = financeSummary
    ? financeSummary.collectionRate ?? (
        financeSummary.totalExpected > 0
          ? (financeSummary.totalCollected / financeSummary.totalExpected) * 100
          : 0
      )
    : 0;

  // Build monthly breakdown chart data from finance summary or attendance
  const revenueChartData = financeSummary?.monthlyBreakdown ?? [];
  const attendanceTrend = attendanceSummary?.weeklyTrend ?? [];

  // Classes performance matrix (use live class data: student counts per section)
  const classPerformance = classes.slice(0, 8).map(cls => {
    const totalStudents = cls.sections?.reduce((s, sec) => s + (sec.students?.length ?? 0), 0) ?? 0;
    const sectionCount = cls.sections?.length ?? 0;
    return {
      className: cls.name,
      sections: sectionCount,
      students: totalStudents,
    };
  });

  // Fee type breakdown
  const feeBreakdown = financeSummary?.feeTypeBreakdown ?? [];

  // ─── Export Helpers ─────────────────────────────────────────────────────────

  const handleExportCSV = (reportName: string) => {
    const rows = [
      ['Metric', 'Value'],
      ['School', schoolName],
      ['Generated', new Date().toLocaleString()],
      ['Total Students', stats?.studentsCount ?? '—'],
      ['Total Teachers', stats?.teachersCount ?? '—'],
      ['Total Classes', stats?.classesCount ?? '—'],
      ['Today Attendance', stats ? `${stats.todayAttendancePercentage}%` : '—'],
      ['Fee Collected', money(stats?.totalRevenue ?? 0)],
      ['Pending Fees', money(stats?.pendingFees ?? 0)],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported "${reportName}" to CSV`);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7 max-w-screen-2xl mx-auto pb-12">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
              Executive Analytics &amp; Business Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">System Reports &amp; Insights</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Live telemetry, financial ledgers, academic audits, and instant data exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm"
          >
            <Printer size={15} /> Print Dossier
          </button>

          <button
            onClick={() => handleExportCSV('Master_School_Report')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Fee Collection */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fee Collected</p>
            <p className="text-xl font-black text-foreground">
              {loading ? '—' : money(stats?.totalRevenue ?? 0)}
            </p>
            {stats?.totalRevenue ? (
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <ArrowUpRight size={12} /> Live finance data
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">No payments yet</p>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Today Attendance</p>
            <p className="text-xl font-black text-foreground">
              {loading ? '—' : pct(stats?.todayAttendancePercentage ?? 0)}
            </p>
            <p className="text-[10px] text-blue-400 font-semibold mt-0.5">
              {stats ? `${stats.presentToday} present · ${stats.absentToday} absent` : 'No records yet'}
            </p>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Fees</p>
            <p className="text-xl font-black text-foreground">
              {loading ? '—' : money(stats?.pendingFees ?? 0)}
            </p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
              {stats?.pendingFeePaymentsCount ? `${stats.pendingFeePaymentsCount} invoices` : 'All clear'}
            </p>
          </div>
        </div>

        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Students</p>
            <p className="text-xl font-black text-foreground">
              {loading ? '—' : (stats?.studentsCount ?? 0)}
            </p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">
              {stats?.classesCount ? `${stats.classesCount} classes` : 'No classes yet'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Overview', icon: FileBarChart2 },
          { id: 'finance', label: 'Financial Realization', icon: DollarSign },
          { id: 'academic', label: 'Academic & Grades', icon: Award },
          { id: 'attendance', label: 'Attendance Telemetry', icon: TrendingUp },
          { id: 'exports', label: 'Report Generator', icon: Download },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}
      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Revenue Chart */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-500" /> Revenue vs Expenses
                    </h3>
                    <p className="text-xs text-muted-foreground">Monthly cash flow (PKR)</p>
                  </div>
                  {collectionRate > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      {pct(collectionRate)} collected
                    </span>
                  )}
                </div>
                <div className="h-72 w-full text-xs">
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="collected" name="Fee Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colRevenue)" />
                        <Area type="monotone" dataKey="expenses" name="Expenditures" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colExpenses)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="No monthly revenue data yet" />
                  )}
                </div>
              </div>

              {/* Attendance Trend */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <TrendingUp size={18} className="text-violet-500" /> Attendance Distribution
                    </h3>
                    <p className="text-xs text-muted-foreground">Weekly attendance trend</p>
                  </div>
                  {stats?.todayAttendancePercentage ? (
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                      Today: {pct(stats.todayAttendancePercentage)}
                    </span>
                  ) : null}
                </div>
                <div className="h-72 w-full text-xs">
                  {attendanceTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Bar dataKey="rate" name="Attendance %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    // Show today's snapshot as a simple bar when no weekly trend
                    stats && (stats.presentToday + stats.absentToday) > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Present', value: stats.presentToday },
                          { name: 'Absent', value: stats.absentToday },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                          <Bar dataKey="value" name="Students" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label="No attendance records yet" />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Class Performance Matrix */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Grade-wise Academic Overview
                  </h3>
                  <p className="text-xs text-muted-foreground">Class roster and section enrollment</p>
                </div>
                <button
                  onClick={() => handleExportCSV('Class_Performance_Report')}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Export
                </button>
              </div>

              {classPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Sections</th>
                        <th className="py-3 px-4">Enrolled Students</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classPerformance.map(c => (
                        <tr key={c.className} className="hover:bg-accent/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground">{c.className}</td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">{c.sections}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(c.students * 3, 100)}%` }} />
                              </div>
                              <span className="font-bold text-foreground">{c.students}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <CircleDashed size={28} className="opacity-40" />
                  <p className="text-xs font-semibold">No classes found</p>
                  <p className="text-[11px] opacity-60">Add classes to see academic overview.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FINANCE ──────────────────────────────────────────────────────── */}
        {activeTab === 'finance' && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Collected',
                  value: money(financeSummary?.totalCollected ?? stats?.totalRevenue ?? 0),
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                  icon: CheckCircle,
                },
                {
                  label: 'Total Expected',
                  value: money(financeSummary?.totalExpected ?? 0),
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                  icon: Layers,
                },
                {
                  label: 'Pending Collection',
                  value: money(stats?.pendingFees ?? 0),
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10 border-amber-500/20',
                  icon: AlertTriangle,
                },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className={`h-12 w-12 rounded-2xl ${card.bg} border flex items-center justify-center shrink-0 ${card.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                      <p className="text-lg font-black text-foreground">{loading ? '—' : card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fee Breakdown Donut */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-500" /> Revenue Streams
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Fee type composition</p>
                </div>
                <div className="h-56 w-full">
                  {feeBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={feeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                          {feeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="No fee breakdown data yet" />
                  )}
                </div>
                {feeBreakdown.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {feeBreakdown.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="font-black text-foreground font-mono">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Realization Chart */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" /> Target vs Actual Realization
                    </h3>
                    <p className="text-xs text-muted-foreground">Expected invoices vs settled dues</p>
                  </div>
                  {collectionRate > 0 && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      {pct(collectionRate)} Index
                    </span>
                  )}
                </div>
                <div className="h-72 w-full text-xs">
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Bar dataKey="expected" name="Expected (PKR)" fill="#64748b" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="collected" name="Collected (PKR)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="No monthly breakdown available" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ACADEMIC ─────────────────────────────────────────────────────── */}
        {activeTab === 'academic' && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Enrollment Chart */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary" /> Class Enrollment Distribution
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Students enrolled per class</p>
                <div className="h-64 w-full text-xs">
                  {classPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="className" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Bar dataKey="students" name="Students" radius={[8, 8, 0, 0]}>
                          {classPerformance.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label="No class data yet" />
                  )}
                </div>
              </div>

              {/* School Summary Panel */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-500" /> School Snapshot
                </h3>
                <p className="text-xs text-muted-foreground mb-5">Live institutional metrics</p>
                <div className="space-y-5">
                  {[
                    {
                      label: 'Total Students',
                      value: stats?.studentsCount ?? 0,
                      max: Math.max(stats?.studentsCount ?? 1, 1),
                      color: 'bg-violet-500',
                    },
                    {
                      label: 'Total Teachers',
                      value: stats?.teachersCount ?? 0,
                      max: Math.max(stats?.studentsCount ?? 1, 1),
                      color: 'bg-blue-500',
                    },
                    {
                      label: 'Total Staff',
                      value: stats?.staffCount ?? 0,
                      max: Math.max(stats?.studentsCount ?? 1, 1),
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Total Parents',
                      value: stats?.parentsCount ?? 0,
                      max: Math.max(stats?.studentsCount ?? 1, 1),
                      color: 'bg-pink-500',
                    },
                    {
                      label: 'Total Classes',
                      value: stats?.classesCount ?? 0,
                      max: Math.max(stats?.classesCount ?? 1, 1),
                      color: 'bg-amber-500',
                    },
                  ].map(row => (
                    <div key={row.label} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{row.label}</span>
                        <span className="font-mono text-primary">{loading ? '—' : row.value}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all duration-700`}
                          style={{ width: `${row.max > 0 ? Math.min((row.value / row.max) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ATTENDANCE ───────────────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Students',
                  value: attendanceSummary?.totalStudents ?? stats?.studentsCount ?? 0,
                  color: 'text-violet-400',
                  bg: 'bg-violet-500/10 border-violet-500/20',
                },
                {
                  label: 'Present Today',
                  value: attendanceSummary?.presentToday ?? stats?.presentToday ?? 0,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                },
                {
                  label: 'Absent Today',
                  value: attendanceSummary?.absentToday ?? stats?.absentToday ?? 0,
                  color: 'text-red-400',
                  bg: 'bg-red-500/10 border-red-500/20',
                },
                {
                  label: 'Attendance Rate',
                  value: pct(attendanceSummary?.attendanceRate ?? stats?.todayAttendancePercentage ?? 0),
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                },
              ].map(card => (
                <div key={card.label} className={`bg-card border rounded-2xl p-5 shadow-sm ${card.bg.split(' ')[1]}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${card.color} mb-1`}>{card.label}</p>
                  <p className="text-2xl font-black text-foreground">{loading ? '—' : card.value}</p>
                </div>
              ))}
            </div>

            {/* Attendance Line Chart */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" /> Daily Attendance Trend
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Weekly attendance percentage</p>
              <div className="h-80 w-full text-xs">
                {attendanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="rate" name="Attendance %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (stats && (stats.presentToday + stats.absentToday) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Present', value: stats.presentToday },
                      { name: 'Absent', value: stats.absentToday },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Bar dataKey="value" name="Students" radius={[6, 6, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No attendance records yet. Mark attendance to see the trend." />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── EXPORTS ──────────────────────────────────────────────────────── */}
        {activeTab === 'exports' && (
          <motion.div
            key="exports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  id: 'rpt-1',
                  title: 'Student Enrollment & Roster',
                  category: 'Academic',
                  description: `${stats?.studentsCount ?? 0} students across ${stats?.classesCount ?? 0} classes`,
                },
                {
                  id: 'rpt-2',
                  title: 'Fee Collection Ledger',
                  category: 'Finance',
                  description: `Collected ${money(stats?.totalRevenue ?? 0)} · Pending ${money(stats?.pendingFees ?? 0)}`,
                },
                {
                  id: 'rpt-3',
                  title: 'Attendance Summary Report',
                  category: 'Attendance',
                  description: `Today: ${stats?.presentToday ?? 0} present, ${stats?.absentToday ?? 0} absent`,
                },
                {
                  id: 'rpt-4',
                  title: 'Faculty & Staff Directory',
                  category: 'HR',
                  description: `${stats?.teachersCount ?? 0} teachers · ${stats?.staffCount ?? 0} staff members`,
                },
                {
                  id: 'rpt-5',
                  title: 'Parent & Guardian Registry',
                  category: 'Admin',
                  description: `${stats?.parentsCount ?? 0} registered parents`,
                },
                {
                  id: 'rpt-6',
                  title: 'Full School Analytics Export',
                  category: 'Master',
                  description: 'All metrics combined in one master CSV',
                },
              ].map(rep => (
                <div
                  key={rep.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {rep.category}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">Live data</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground mb-1">{rep.title}</h4>
                    <p className="text-xs text-muted-foreground">{rep.description}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleExportCSV(rep.title)}
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download size={13} /> Export CSV
                    </button>
                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-3 py-2 rounded-xl border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                      title="Print Report"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Print Modal */}
      <Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} maxWidth="max-w-2xl">
        <div className="bg-white text-slate-900 rounded-3xl p-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{schoolName}</h2>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">EXECUTIVE PERFORMANCE DOSSIER</p>
            </div>
            <button onClick={() => setShowPrintModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-100 mb-6 text-xs">
            <div>
              <span className="block text-slate-500 font-bold uppercase text-[10px]">Generated</span>
              <strong className="text-slate-900">{new Date().toLocaleDateString('en-PK')}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-bold uppercase text-[10px]">Total Students</span>
              <strong className="text-slate-900">{stats?.studentsCount ?? '—'}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-bold uppercase text-[10px]">Status</span>
              <strong className="text-emerald-700">Live Data</strong>
            </div>
          </div>

          <table className="w-full text-left text-xs mb-6 border border-slate-200">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="p-2.5">Key Performance Indicator</th>
                <th className="p-2.5 text-right">Achieved Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-bold">Student Enrollment</td>
                <td className="p-2.5 text-right font-mono font-bold">{stats?.studentsCount ?? '—'} Active</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Today Attendance Rate</td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                  {stats?.todayAttendancePercentage ? pct(stats.todayAttendancePercentage) : '—'}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Fee Collection</td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                  {money(stats?.totalRevenue ?? 0)}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Pending Fees</td>
                <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                  {money(stats?.pendingFees ?? 0)}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Total Teachers</td>
                <td className="p-2.5 text-right font-mono font-bold">{stats?.teachersCount ?? '—'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Total Classes</td>
                <td className="p-2.5 text-right font-mono font-bold">{stats?.classesCount ?? '—'}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end pt-12 text-xs border-t border-slate-200">
            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-1" />
              <span className="text-slate-600 font-bold uppercase text-[10px]">Academic Coordinator</span>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-1" />
              <span className="text-slate-600 font-bold uppercase text-[10px]">Principal &amp; Stamp</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowPrintModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.print();
                toast.success('Printing executive dossier…');
              }}
              className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-lg hover:bg-slate-800 flex items-center gap-2"
            >
              <Printer size={15} /> Print Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
