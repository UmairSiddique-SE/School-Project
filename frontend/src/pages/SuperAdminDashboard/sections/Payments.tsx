import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Clock, History, Search, Download, Loader2, RefreshCw,
  DollarSign, Eye, CreditCard, School, Calendar, CheckCircle, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', label: 'Pending' },
  PAID: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Approved' },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Approved' },
  REJECTED: { color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', label: 'Rejected' },
  OVERDUE: { color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', label: 'Overdue' },
};

type TabType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('PENDING');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<any | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    apiClient
      .get('/admin/payments')
      .then((r) => setPayments(r.data || []))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/approve`);
      toast.success('Payment verified & approved successfully!');
      fetchPayments();
      if (viewPayment?.id === id) setViewPayment(null);
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.patch(`/admin/payments/${id}/reject`);
      toast.success('Payment rejected');
      fetchPayments();
      if (viewPayment?.id === id) setViewPayment(null);
    } catch {
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = payments.filter((p) => {
    const isApproved = p.status === 'PAID' || p.status === 'APPROVED';
    const isPending = p.status === 'PENDING';
    const isRejected = p.status === 'REJECTED';

    let matchTab = true;
    if (tab === 'PENDING') matchTab = isPending;
    else if (tab === 'APPROVED') matchTab = isApproved;
    else if (tab === 'REJECTED') matchTab = isRejected;

    const matchSearch =
      !search ||
      (p.school?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.receiptNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.method || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.student?.name || '').toLowerCase().includes(search.toLowerCase());

    return matchTab && matchSearch;
  });

  const totalApproved = payments
    .filter((p) => p.status === 'PAID' || p.status === 'APPROVED')
    .reduce((s, p) => s + (p.totalPaid || p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((s, p) => s + (p.amount || 0), 0);

  const tabs: { label: string; value: TabType; icon: React.ComponentType<any>; color: string }[] = [
    { label: 'Pending Verification', value: 'PENDING', icon: Clock, color: 'text-amber-400' },
    { label: 'Approved Invoices', value: 'APPROVED', icon: Check, color: 'text-emerald-400' },
    { label: 'Rejected', value: 'REJECTED', icon: X, color: 'text-rose-400' },
    { label: 'All History', value: 'ALL', icon: History, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5">
            <CreditCard size={12} />
            <span>Treasury &amp; Invoices</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Payments &amp; Receipts</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Verify subscription fee slips, approve bank transfers, and manage institutional revenue records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-base font-black text-emerald-400">PKR {totalApproved.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Approved Revenue</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-base font-black text-amber-400">PKR {totalPending.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Verification</p>
          </div>
          <button
            onClick={fetchPayments}
            className="p-3 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const count =
            t.value === 'ALL'
              ? payments.length
              : t.value === 'APPROVED'
              ? payments.filter((p) => p.status === 'PAID' || p.status === 'APPROVED').length
              : payments.filter((p) => p.status === t.value).length;

          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.value
                  ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} className={tab === t.value ? 'text-violet-400' : t.color} />
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  tab === t.value ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-[20px] border border-white/[0.05] bg-slate-900/40 backdrop-blur-xl group focus-within:border-violet-500/40 transition-all">
        <Search size={16} className="text-slate-500 group-focus-within:text-violet-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by school name, receipt number, student, or payment method..."
          className="bg-transparent border-none text-sm outline-none flex-1 text-white placeholder:text-slate-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} className="animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-white font-bold text-base">No Payments Found</p>
            <p className="text-slate-500 text-xs mt-1">No transaction slips match the current tab filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Campus</th>
                  <th className="px-6 py-4">Payer / Student</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference / Receipt</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((p) => {
                  const isPending = p.status === 'PENDING';
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {p.school?.name || 'EduSphere Platform'}
                      </td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {p.student?.name || 'School Owner'}
                      </td>
                      <td className="px-6 py-4 font-black text-white whitespace-nowrap">
                        PKR {(p.totalPaid || p.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {p.method || 'Online / Transfer'}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-violet-300">
                        {p.receiptNo ? p.receiptNo.slice(0, 14) : 'REF-' + p.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-PK') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight ${(statusConfig[p.status] || statusConfig.PENDING).color}`}>
                          {(statusConfig[p.status] || statusConfig.PENDING).label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewPayment(p)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white transition-all"
                            title="Inspect Receipt Slip"
                          >
                            <Eye size={13} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(p.id)}
                                disabled={processing === p.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold transition-all disabled:opacity-50"
                                title="Approve Payment"
                              >
                                {processing === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                disabled={processing === p.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-bold transition-all disabled:opacity-50"
                                title="Reject Payment"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Slip Modal */}
      <AnimatePresence>
        {viewPayment && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <h3 className="font-bold text-white text-base">Payment Receipt</h3>
                </div>
                <button onClick={() => setViewPayment(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">Campus:</span>
                  <span className="font-bold text-white">{viewPayment.school?.name || 'EduSphere Platform'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payer Name:</span>
                  <span className="font-bold text-white">{viewPayment.student?.name || 'Campus Principal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    PKR {(viewPayment.totalPaid || viewPayment.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="font-medium text-white">{viewPayment.method || 'Online Bank Transfer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Ref:</span>
                  <span className="font-mono text-violet-300">{viewPayment.receiptNo || 'REF-' + viewPayment.id.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submission Date:</span>
                  <span className="text-white font-medium">{new Date(viewPayment.createdAt).toLocaleDateString('en-PK')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-slate-400">Verification Status:</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${(statusConfig[viewPayment.status] || statusConfig.PENDING).color}`}>
                    {(statusConfig[viewPayment.status] || statusConfig.PENDING).label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {viewPayment.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleReject(viewPayment.id)}
                      disabled={processing === viewPayment.id}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-bold text-xs"
                    >
                      Reject Slip
                    </button>
                    <button
                      onClick={() => handleApprove(viewPayment.id)}
                      disabled={processing === viewPayment.id}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Verify &amp; Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setViewPayment(null)}
                    className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Receipt(props: any) {
  return <DollarSign {...props} />;
}
