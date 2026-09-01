import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, Users, School, DollarSign, BarChart2, FileText } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const monthlyData = [
  { month: 'Jan', schools: 4, students: 320, revenue: 4200 },
  { month: 'Feb', schools: 7, students: 580, revenue: 7800 },
  { month: 'Mar', schools: 10, students: 840, revenue: 11200 },
  { month: 'Apr', schools: 12, students: 990, revenue: 9800 },
  { month: 'May', schools: 16, students: 1340, revenue: 14600 },
  { month: 'Jun', schools: 19, students: 1680, revenue: 17200 },
  { month: 'Jul', schools: 24, students: 2100, revenue: 21500 },
];

const planDistribution = [
  { name: 'Free Trial', value: 6, color: '#64748b' },
  { name: 'Basic', value: 8, color: '#3b82f6' },
  { name: 'Standard', value: 7, color: '#7c3aed' },
  { name: 'Premium', value: 3, color: '#f59e0b' },
];

const topSchools = [
  { name: 'Beacon House', students: 450, teachers: 38, revenue: 199 },
  { name: 'City High', students: 320, teachers: 27, revenue: 99 },
  { name: 'Army Public', students: 290, teachers: 24, revenue: 199 },
  { name: 'Roots International', students: 180, teachers: 18, revenue: 99 },
  { name: 'LGS', students: 150, teachers: 14, revenue: 49 },
];

const reports = [
  { id: 'school-summary', name: 'School Summary Report', desc: 'All schools with status, plan, and student counts', icon: School },
  { id: 'revenue-report', name: 'Revenue Report', desc: 'Monthly subscription revenue breakdown', icon: DollarSign },
  { id: 'user-report', name: 'User Activity Report', desc: 'Login activity and engagement metrics', icon: Users },
  { id: 'plan-report', name: 'Plan Distribution Report', desc: 'Breakdown of schools by subscription plan', icon: BarChart2 },
  { id: 'expiry-report', name: 'Expiry Alert Report', desc: 'Schools with plans expiring in next 30 days', icon: TrendingUp },
  { id: 'audit-report', name: 'Audit Trail Report', desc: 'All admin actions and system changes', icon: FileText },
];

const TOOLTIP_STYLE = {
  background: 'hsl(224 71.4% 4.1%)',
  border: '1px solid hsl(215 27.9% 16.9%)',
  borderRadius: 12,
  fontSize: 12,
};

export default function Reports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const response = await apiClient.get(`/admin/reports/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${id}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully!');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide insights and downloadable reports</p>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Growth Trends */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-1">Growth Trends</h3>
          <p className="text-xs text-muted-foreground mb-5">Schools & students over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="rSchool" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rStudent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 27.9% 16.9%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="schools" stroke="#7c3aed" strokeWidth={2} fill="url(#rSchool)" name="Schools" />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} fill="url(#rStudent)" name="Students" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution Pie */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-1">Plan Distribution</h3>
          <p className="text-xs text-muted-foreground mb-5">Schools by subscription tier</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {planDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Schools */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-1">Top Schools by Students</h3>
        <p className="text-xs text-muted-foreground mb-5">Largest schools on the platform</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topSchools} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 27.9% 16.9%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(217.9 10.6% 64.9%)' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="students" fill="#7c3aed" radius={[0, 6, 6, 0]} name="Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Downloadable Reports */}
      <div>
        <h3 className="font-bold text-foreground mb-4">Downloadable Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((r, i) => {
            const Icon = r.icon;
            const isLoading = downloading === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <button
                  onClick={() => handleDownload(r.id)}
                  disabled={isLoading}
                  className="shrink-0 p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60"
                  title="Download"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={15} />
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
