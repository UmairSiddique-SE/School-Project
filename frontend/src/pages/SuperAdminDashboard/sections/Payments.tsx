import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, History, Search, Download, Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-400', label: 'Pending' },
  PAID: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Paid' },
  OVERDUE: { color: 'bg-red-500/10 text-red-400', label: 'Overdue' },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Approved' },
  REJECTED: { color: 'bg-red-500/10 text-red-400', label: 'Rejected' },
};

type TabType = 'PENDING' | 'PAID' | 'ALL';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('PENDING');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    apiClient.get('/admin/payments')
      .then(r => setPayments(r.data))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this payment?')) return;
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/approve`);
      toast.success('Payment approved successfully');
      fetchPayments();
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this payment?')) return;
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/reject`);
      toast.success('Payment rejected successfully');
      fetchPayments();
    } catch {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(p => {
    const matchTab = tab === 'ALL' ? true : p.status === tab || (tab === 'PAID' && p.status === 'APPROVED');
    const matchSearch = !search ||
      (p.school?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.receiptNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.student?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalCollected = payments.filter(p => p.status === 'PAID' || p.status === 'APPROVED').reduce((s: number, p: any) => s + (p.totalPaid || p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s: number, p: any) => s + (p.amount || 0), 0);

  const tabs: { label: string; value: TabType; icon: React.ComponentType<any>; color: string }[] = [
    { label: 'Pending', value: 'PENDING', icon: Clock, color: 'text-amber-400' },
    { label: 'Paid', value: 'PAID', icon: Check, color: 'text-emerald-400' },
    { label: 'All History', value: 'ALL', icon: History, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-foreground">Payments</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all school and student fee payments across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-black text-emerald-400">PKR {totalCollected.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Collected</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-black text-amber-400">PKR {totalPending.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <button onClick={fetchPayments} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        {tabs.map(t => {
          const Icon = t.icon;
          const count = t.value === 'ALL' ? payments.length : payments.filter(p => p.status === t.value || (t.value === 'PAID' && p.status === 'APPROVED')).length;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} className={tab === t.value ? 'text-primary' : t.color} />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card">
        <Search size={15} className="text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by school, student or receipt…"
          className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['School', 'Student', 'Amount', 'Method', 'Receipt', 'Due Date', 'Paid Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p: any, i: number) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{p.school?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.student?.name || '—'}</td>
                    <td className="px-4 py-3 font-black text-foreground">PKR {(p.totalPaid || p.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.method || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.receiptNo ? p.receiptNo.slice(0, 12) + '...' : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(statusConfig[p.status] || statusConfig.PENDING).color}`}>
                        {(statusConfig[p.status] || statusConfig.PENDING).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all" title="Download Receipt">
                          <Download size={13} />
                        </button>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={processing === p.id}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              title="Approve Payment"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={processing === p.id}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Reject Payment"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <DollarSign size={32} className="mb-3 opacity-30" />
                <p className="font-semibold">No payments found</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length} of {payments.length} total payments
          </div>
        </div>
      )}
    </div>
  );
}
