import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  FileBarChart2, TrendingUp, DollarSign, Award, Users, Calendar,
  Download, Printer, Filter, CheckCircle, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Layers, Sparkles, BookOpen, GraduationCap, X, Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal from '@/component/ui/Modal';

// ─── Realistic Analytics Data ──────────────────────────────────────────────────

const ATTENDANCE_WEEKLY = [
  { name: 'Monday', rate: 96.4, boys: 95.8, girls: 97.1 },
  { name: 'Tuesday', rate: 94.8, boys: 94.2, girls: 95.5 },
  { name: 'Wednesday', rate: 97.2, boys: 96.9, girls: 97.6 },
  { name: 'Thursday', rate: 95.1, boys: 94.5, girls: 95.8 },
  { name: 'Friday', rate: 91.5, boys: 90.2, girls: 93.0 },
  { name: 'Saturday', rate: 89.2, boys: 88.0, girls: 90.5 },
];

const MONTHLY_REVENUE = [
  { month: 'Jan', collected: 245000, expected: 260000, expenses: 140000 },
  { month: 'Feb', collected: 252000, expected: 260000, expenses: 145000 },
  { month: 'Mar', collected: 268000, expected: 275000, expenses: 150000 },
  { month: 'Apr', collected: 285000, expected: 290000, expenses: 155000 },
  { month: 'May', collected: 295000, expected: 300000, expenses: 160000 },
  { month: 'Jun', collected: 275000, expected: 300000, expenses: 158000 },
  { month: 'Jul', collected: 310000, expected: 320000, expenses: 165000 },
];

const FEE_BREAKDOWN = [
  { name: 'Tuition Fees', value: 68, color: '#8b5cf6' },
  { name: 'Transport', value: 16, color: '#3b82f6' },
  { name: 'Lab & Library', value: 9, color: '#10b981' },
  { name: 'Admission & Reg', value: 7, color: '#f59e0b' },
];

const GRADE_DISTRIBUTION = [
  { grade: 'A+ (90-100%)', count: 48, percentage: '29%' },
  { grade: 'A (80-89%)', count: 56, percentage: '34%' },
  { grade: 'B (70-79%)', count: 35, percentage: '21%' },
  { grade: 'C (60-69%)', count: 18, percentage: '11%' },
  { grade: 'D (50-59%)', count: 6, percentage: '4%' },
  { grade: 'F (<50%)', count: 2, percentage: '1%' },
];

const CLASS_PERFORMANCE = [
  { className: 'Class 10-A', avgMarks: 88.4, passRate: 98, attendance: 96 },
  { className: 'Class 10-B', avgMarks: 84.1, passRate: 95, attendance: 93 },
  { className: 'Class 9-A', avgMarks: 86.7, passRate: 96, attendance: 95 },
  { className: 'Class 9-B', avgMarks: 79.8, passRate: 91, attendance: 91 },
  { className: 'Class 8-A', avgMarks: 82.5, passRate: 94, attendance: 94 },
  { className: 'Class 7-A', avgMarks: 85.0, passRate: 97, attendance: 96 },
];

const REPORT_TEMPLATES = [
  { id: 'rep-1', title: 'Monthly Fee Realization & Dues Summary', category: 'Finance', type: 'Financial Ledger', records: '165 Students', updated: 'Today, 02:00 PM' },
  { id: 'rep-2', title: 'Academic Term Examination Merit Matrix', category: 'Academics', type: 'Result Gazette', records: '6 Classes', updated: 'Yesterday' },
  { id: 'rep-3', title: 'Student Attendance & Defaulter Audit', category: 'Attendance', type: 'Compliance', records: 'Daily Matrix', updated: 'Today, 09:00 AM' },
  { id: 'rep-4', title: 'Faculty Workload & Staff Roster Report', category: 'Staff', type: 'HR Directory', records: '28 Faculty', updated: '3 days ago' },
  { id: 'rep-5', title: 'Transport Route Occupancy & Fleet Safety', category: 'Operations', type: 'Logistics', records: '8 Routes', updated: 'Weekly' },
];

export default function Reports() {
  const { user } = useAuth();
  const schoolName = user?.schoolName || 'Edusphere Model School';
  
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'academic' | 'attendance' | 'exports'>('overview');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'session'>('month');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Quick export function
  const handleExportCSV = (reportName: string) => {
    const csvContent = `data:text/csv;charset=utf-8,Report Name: ${reportName}\nGenerated On: ${new Date().toLocaleString()}\nSchool: ${schoolName}\n\nMetric,Value\nTotal Enrollment,165\nAverage Attendance,95.2%\nRevenue Collected,Rs 310,000\nAcademic Pass Rate,96.4%`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported "${reportName}" to CSV successfully!`);
  };

  return (
    <div className="space-y-7 max-w-screen-2xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
              Executive Analytics & Business Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">System Reports & Insights</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time visual telemetry, financial ledgers, academic audits, and instant multi-format data exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-card border border-border p-1 rounded-xl shadow-sm text-xs font-bold">
            {(['month', 'quarter', 'session'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  timeRange === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'month' ? 'This Month' : t === 'quarter' ? 'Quarter' : 'Full Session'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm"
          >
            <Printer size={15} /> Print Executive Dossier
          </button>

          <button
            onClick={() => handleExportCSV('Master_School_Report')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Download size={16} /> Export Master CSV
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Collection</p>
            <p className="text-2xl font-black text-foreground">Rs 310K</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight size={12} /> +12.4% vs last mo
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
            <p className="text-2xl font-black text-foreground">95.2%</p>
            <p className="text-[10px] text-blue-400 font-semibold mt-0.5">High Stability</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Academic Pass Rate</p>
            <p className="text-2xl font-black text-foreground">96.4%</p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Midterm Benchmark</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Roster</p>
            <p className="text-2xl font-black text-foreground">165</p>
            <p className="text-[10px] text-violet-400 font-semibold mt-0.5">91% Seat Capacity</p>
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
          { id: 'exports', label: 'Report Generator & Exports', icon: Download },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Chart */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-500" /> Revenue vs Operating Expenses
                    </h3>
                    <p className="text-xs text-muted-foreground">Monthly cash flow and profit margins (PKR)</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Net Surplus: +46%
                  </span>
                </div>
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MONTHLY_REVENUE}>
                      <defs>
                        <linearGradient id="colRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="collected" name="Fee Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colRevenue)" />
                      <Area type="monotone" dataKey="expenses" name="Expenditures" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <TrendingUp size={18} className="text-violet-500" /> Weekly Attendance Distribution
                    </h3>
                    <p className="text-xs text-muted-foreground">Gender-wise daily attendance comparison</p>
                  </div>
                  <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                    Average: 95.2%
                  </span>
                </div>
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ATTENDANCE_WEEKLY}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Bar dataKey="boys" name="Boys Attendance %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="girls" name="Girls Attendance %" fill="#ec4899" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Matrix Table */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Grade-wise Performance Benchmarks
                  </h3>
                  <p className="text-xs text-muted-foreground">Classroom comparative rankings and exam readiness</p>
                </div>
                <button
                  onClick={() => handleExportCSV('Class_Performance_Report')}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Export Table
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Class & Section</th>
                      <th className="py-3 px-4">Average Exam Score</th>
                      <th className="py-3 px-4">Pass Rate</th>
                      <th className="py-3 px-4">Attendance Average</th>
                      <th className="py-3 px-4 text-right">Academic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {CLASS_PERFORMANCE.map(c => (
                      <tr key={c.className} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-foreground">{c.className}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">{c.avgMarks}%</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.passRate}%` }} />
                            </div>
                            <span className="font-bold text-emerald-400">{c.passRate}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-muted-foreground">{c.attendance}%</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Exemplary
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'finance' && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fee Streams Donut */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-500" /> Revenue Stream Composition
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Percentage breakdown by billing type</p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={FEE_BREAKDOWN} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {FEE_BREAKDOWN.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  {FEE_BREAKDOWN.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-black text-foreground font-mono">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Realization Trend */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" /> Target vs Actual Fee Realization
                    </h3>
                    <p className="text-xs text-muted-foreground">Expected revenue invoices vs settled student dues</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    96.8% Collection Index
                  </span>
                </div>
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Bar dataKey="expected" name="Expected Dues (PKR)" fill="#64748b" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="collected" name="Settled Collections (PKR)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'academic' && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Bell Curve */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                  <Award size={18} className="text-amber-400" /> Exam Grade Distribution
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Student performance curve across latest examinations</p>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={GRADE_DISTRIBUTION}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Bar dataKey="count" name="Total Students" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                        {GRADE_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#8b5cf6' : index === 2 ? '#3b82f6' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Proficiency Matrix */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-500" /> Key Subject Proficiency Index
                </h3>
                <p className="text-xs text-muted-foreground mb-5">Average student mastery across core curriculum</p>
                <div className="space-y-4 text-xs">
                  {[
                    { subject: 'Mathematics & Algebra', score: 88, color: 'bg-violet-500' },
                    { subject: 'Physics & Applied Mechanics', score: 84, color: 'bg-blue-500' },
                    { subject: 'Chemistry & Lab Work', score: 81, color: 'bg-emerald-500' },
                    { subject: 'Computer Science & Python', score: 92, color: 'bg-indigo-500' },
                    { subject: 'English Literature & Grammar', score: 86, color: 'bg-pink-500' },
                  ].map(sub => (
                    <div key={sub.subject} className="space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{sub.subject}</span>
                        <span className="font-mono text-primary">{sub.score}% Mastery</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" /> Daily School Attendance Trend (Last 7 Days)
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Percentage of active students present in morning assembly</p>
              <div className="h-80 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ATTENDANCE_WEEKLY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="rate" name="Overall Rate %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'exports' && (
          <motion.div
            key="exports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {REPORT_TEMPLATES.map(rep => (
                <div key={rep.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {rep.category}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{rep.updated}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground mb-1">{rep.title}</h4>
                    <p className="text-xs text-muted-foreground">{rep.type} · {rep.records}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleExportCSV(rep.title)}
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:scale-102 transition-all flex items-center justify-center gap-1.5"
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

      {/* 5. Print Modal (Executive Dossier Preview) */}
      <Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} maxWidth="max-w-2xl">
        <div className="bg-white text-slate-900 rounded-3xl p-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{schoolName}</h2>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">EXECUTIVE PERFORMANCE AUDIT & AUDIT DOSSIER</p>
                </div>
                <button onClick={() => setShowPrintModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600">
                  <X size={20} />
                </button>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-100 mb-6 text-xs">
                <div>
                  <span className="block text-slate-500 font-bold uppercase text-[10px]">Reporting Period</span>
                  <strong className="text-slate-900">Academic Term Fall 2026</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase text-[10px]">Generated Date</span>
                  <strong className="text-slate-900">{new Date().toLocaleDateString('en-PK')}</strong>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold uppercase text-[10px]">Security Status</span>
                  <strong className="text-emerald-700">Official Certified</strong>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs mb-6 border border-slate-200">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-2.5">Key Performance Indicator</th>
                    <th className="p-2.5 text-right">Achieved Metric</th>
                    <th className="p-2.5 text-right">Target Benchmark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-bold">Student Enrollment</td>
                    <td className="p-2.5 text-right font-mono font-bold">165 Active</td>
                    <td className="p-2.5 text-right text-slate-500 font-mono">180 Capacity</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Average Daily Attendance</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">95.2%</td>
                    <td className="p-2.5 text-right text-slate-500 font-mono">90.0% Minimum</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Fee Collection Realization</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">Rs 310,000</td>
                    <td className="p-2.5 text-right text-slate-500 font-mono">Rs 320,000 Target</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Midterm Academic Pass Index</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">96.4%</td>
                    <td className="p-2.5 text-right text-slate-500 font-mono">92.0% Standard</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 text-xs border-t border-slate-200">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="text-slate-600 font-bold uppercase text-[10px]">Academic Coordinator</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="text-slate-600 font-bold uppercase text-[10px]">Principal Signature & Stamp</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    window.print();
                    toast.success('Printing executive dossier...');
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
