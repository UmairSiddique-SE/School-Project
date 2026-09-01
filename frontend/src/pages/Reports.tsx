import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileBarChart2, TrendingUp, DollarSign, Award, Users } from 'lucide-react';

export default function Reports() {
  const attendanceData = [
    { name: 'Mon', rate: 96 },
    { name: 'Tue', rate: 94 },
    { name: 'Wed', rate: 98 },
    { name: 'Thu', rate: 95 },
    { name: 'Fri', rate: 91 },
  ];

  const feeData = [
    { name: 'Collected', value: 14000 },
    { name: 'Pending', value: 4500 },
  ];

  const gradeDistribution = [
    { name: 'Grade A', count: 18 },
    { name: 'Grade B', count: 32 },
    { name: 'Grade C', count: 12 },
    { name: 'Grade D', count: 4 },
    { name: 'Grade F', count: 1 },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground">Analytics & System Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time attendance trends, fee allocations, and academic grades</p>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary" /> Attendance Rate Trend (%)
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Weekly summary of student attendance ratios</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fee Collection status */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-1.5">
              <DollarSign size={16} className="text-primary" /> Fee Payments Overview ($)
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Proportion of collected vs pending fees this term</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={feeData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 shrink-0 pr-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="font-bold text-foreground">Collected: $14,000</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="font-bold text-foreground">Pending: $4,500</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Academic Grade Distribution */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between xl:col-span-2"
        >
          <div>
            <h3 className="font-extrabold text-base text-foreground mb-1 flex items-center gap-1.5">
              <Award size={16} className="text-primary" /> Academic Grade Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Distribution chart of student counts across exam grades</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
