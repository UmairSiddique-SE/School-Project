import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock, Users, BarChart3, Download } from 'lucide-react';

const CLASSES = [
  { id: '1', name: 'Class 1-A', total: 35 },
  { id: '2', name: 'Class 2-A', total: 38 },
  { id: '3', name: 'Class 3-A', total: 40 },
  { id: '4', name: 'Class 5-B', total: 32 },
  { id: '5', name: 'Class 8-A', total: 36 },
  { id: '6', name: 'Class 9-A', total: 42 },
  { id: '7', name: 'Class 10-A', total: 45 },
  { id: '8', name: 'Class 10-B', total: 40 },
];

function generateMockData() {
  return CLASSES.map(c => {
    const present = Math.floor(c.total * (0.82 + Math.random() * 0.15));
    const absent = c.total - present;
    const late = Math.floor(absent * 0.3);
    return { ...c, present, absent: absent - late, late, percentage: Math.round((present / c.total) * 100) };
  });
}

const MONTHLY_DAYS = Array.from({ length: 26 }, (_, i) => i + 1);

export default function AttendanceAdmin() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [filter, setFilter] = useState('all');
  const data = generateMockData();

  const totalStudents = data.reduce((s, c) => s + c.total, 0);
  const totalPresent = data.reduce((s, c) => s + c.present, 0);
  const totalAbsent = data.reduce((s, c) => s + c.absent, 0);
  const totalLate = data.reduce((s, c) => s + c.late, 0);
  const overallPercentage = Math.round((totalPresent / totalStudents) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Attendance Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor daily and monthly attendance across all classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'daily' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
          >Daily</button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'monthly' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
          >Monthly</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'from-violet-500 to-purple-600' },
          { label: 'Present Today', value: totalPresent, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          { label: 'Absent', value: totalAbsent, icon: XCircle, color: 'from-red-500 to-rose-600' },
          { label: 'Late Arrivals', value: totalLate, icon: Clock, color: 'from-yellow-500 to-amber-600' },
          { label: 'Overall %', value: `${overallPercentage}%`, icon: BarChart3, color: 'from-blue-500 to-cyan-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden group">
            <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br ${s.color} blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />
            <div className="relative">
              <s.icon size={18} className="text-muted-foreground mb-2" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {view === 'daily' ? (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 premium-input" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 premium-input" />
          </div>
        )}
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 premium-input">
          <option value="all">All Classes</option>
          {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Daily View — Class-wise table */}
      {view === 'daily' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Class-wise Attendance — {selectedDate}</h2>
            <span className="text-xs text-muted-foreground">{data.length} classes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full premium-table">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  {['Class', 'Total', 'Present', 'Absent', 'Late', 'Percentage', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{row.name}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.total}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-emerald-500">{row.present}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-red-500">{row.absent}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-yellow-500">{row.late}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${row.percentage >= 90 ? 'bg-emerald-500' : row.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${row.percentage}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground">{row.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        row.percentage >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                        row.percentage >= 75 ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {row.percentage >= 90 ? 'Excellent' : row.percentage >= 75 ? 'Average' : 'Low'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Monthly View — Heatmap Grid */}
      {view === 'monthly' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-6">Monthly Attendance Heatmap — {selectedMonth}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-2 py-2 sticky left-0 bg-card">Class</th>
                  {MONTHLY_DAYS.map(d => (
                    <th key={d} className="text-center text-[10px] font-semibold text-muted-foreground px-1 py-2 w-8">{d}</th>
                  ))}
                  <th className="text-center text-xs font-semibold text-muted-foreground px-2 py-2">Avg</th>
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((cls, _ci) => {
                  const dailyValues = MONTHLY_DAYS.map(() => Math.floor(70 + Math.random() * 30));
                  const avg = Math.round(dailyValues.reduce((a, b) => a + b) / dailyValues.length);
                  return (
                    <tr key={cls.id} className="border-t border-border/50">
                      <td className="text-xs font-semibold text-foreground px-2 py-2 sticky left-0 bg-card whitespace-nowrap">{cls.name}</td>
                      {dailyValues.map((v, di) => (
                        <td key={di} className="px-0.5 py-1 text-center">
                          <div
                            title={`${v}%`}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold mx-auto transition-all hover:scale-110 cursor-default ${
                              v >= 95 ? 'bg-emerald-500 text-white' :
                              v >= 85 ? 'bg-emerald-500/30 text-emerald-500' :
                              v >= 75 ? 'bg-yellow-500/30 text-yellow-600' :
                              'bg-red-500/30 text-red-500'
                            }`}
                          >
                            {v}
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center">
                        <span className={`text-xs font-black ${avg >= 85 ? 'text-emerald-500' : avg >= 75 ? 'text-yellow-500' : 'text-red-500'}`}>{avg}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /> 95%+</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/30" /> 85-94%</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500/30" /> 75-84%</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/30" /> &lt;75%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
