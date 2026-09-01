import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, X, Loader2, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-600',
  PENDING: 'bg-yellow-500/10 text-yellow-600',
  PARTIAL: 'bg-blue-500/10 text-blue-600',
  OVERDUE: 'bg-red-500/10 text-red-600',
};

const statusIcons: Record<string, React.ElementType> = {
  PAID: CheckCircle,
  PENDING: Clock,
  PARTIAL: CreditCard,
  OVERDUE: AlertCircle,
};

export default function Finance() {
  const [payments, setPayments] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollect, setShowCollect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ studentId: '', feeStructureId: '', amountDue: '', amountPaid: '', method: 'CASH', dueDate: '' });

  const MOCK_PAYMENTS = [
    { id: 'p1', student: { name: 'Aarav Sharma', admissionNo: 'STD001' }, feeStructure: { title: 'Q2 Tuition Fee' }, amountDue: 15000, amountPaid: 15000, status: 'PAID', method: 'ONLINE', createdAt: '2026-07-25' },
    { id: 'p2', student: { name: 'Priya Patel', admissionNo: 'STD002' }, feeStructure: { title: 'Q2 Tuition Fee' }, amountDue: 15000, amountPaid: 10000, status: 'PARTIAL', method: 'CASH', createdAt: '2026-07-24' },
    { id: 'p3', student: { name: 'Rohan Mehta', admissionNo: 'STD003' }, feeStructure: { title: 'Annual Lab Fee' }, amountDue: 5000, amountPaid: 0, status: 'PENDING', method: 'CASH', createdAt: '2026-07-20' },
    { id: 'p4', student: { name: 'Sneha Gupta', admissionNo: 'STD004' }, feeStructure: { title: 'Library Security' }, amountDue: 3000, amountPaid: 0, status: 'OVERDUE', method: 'ONLINE', createdAt: '2026-07-10' },
  ];

  const MOCK_STRUCTURES = [
    { id: 'fs1', title: 'Q2 Tuition Fee', amount: 15000, frequency: 'QUARTERLY' },
    { id: 'fs2', title: 'Annual Lab Fee', amount: 5000, frequency: 'ANNUAL' },
    { id: 'fs3', title: 'Library Security', amount: 3000, frequency: 'ONE_TIME' },
  ];

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/finance/payments'),
      apiClient.get('/finance/structures'),
      apiClient.get('/people/students'),
    ]).then(([pRes, sRes, stRes]) => {
      setPayments(Array.isArray(pRes.data) ? pRes.data : []);
      setStructures(Array.isArray(sRes.data) ? sRes.data : []);
      setStudents(Array.isArray(stRes.data) ? stRes.data : []);
    }).catch(() => {
      setPayments(MOCK_PAYMENTS);
      setStructures(MOCK_STRUCTURES);
      setStudents([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.totalPaid, 0);
  const pending = payments.filter(p => p.status !== 'PAID').length;

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/finance/payments', form);
      toast.success('Fee collected!');
      setShowCollect(false);
      setForm({ studentId: '', feeStructureId: '', amountDue: '', amountPaid: '', method: 'CASH', dueDate: '' });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to collect fee');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Finance & Fees</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage fee structures and payments</p>
        </div>
        <button onClick={() => setShowCollect(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all">
          <Plus size={16} /> Collect Fee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20">
          <p className="text-white/70 text-xs font-medium">Total Collected</p>
          <p className="text-3xl font-black mt-1">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-muted-foreground text-xs font-medium">Pending Payments</p>
          <p className="text-3xl font-black mt-1 text-foreground">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-muted-foreground text-xs font-medium">Total Transactions</p>
          <p className="text-3xl font-black mt-1 text-foreground">{payments.length}</p>
        </div>
      </div>

      <AnimatePresence>
        {showCollect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Collect Fee Payment</h2>
                <button onClick={() => setShowCollect(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleCollect} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">Student</label>
                  <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select Student --</option>
                    {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Fee Structure</label>
                  <select value={form.feeStructureId} onChange={e => {
                    const str = structures.find(s => s.id === e.target.value);
                    setForm(p => ({ ...p, feeStructureId: e.target.value, amountDue: str ? String(str.amount) : '' }));
                  }}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select Fee Structure (optional) --</option>
                    {structures.map((s: any) => <option key={s.id} value={s.id}>{s.name} — ${s.amount}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">Amount Due ($)</label>
                    <input value={form.amountDue} onChange={e => setForm(p => ({ ...p, amountDue: e.target.value }))} type="number" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Amount Paid ($)</label>
                    <input value={form.amountPaid} onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} type="number" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">Payment Method</label>
                    <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {['CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'CARD'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Due Date</label>
                    <input value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} type="date"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                  {saving ? 'Processing...' : 'Record Payment'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    {['Student', 'Fee Type', 'Amount', 'Paid', 'Method', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any, i: number) => {
                    const StatusIcon = statusIcons[p.status] || Clock;
                    return (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-foreground">{p.student?.name || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.feeStructure?.name || 'Manual'}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground">${p.amount}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">${p.totalPaid}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{p.method}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                            <StatusIcon size={11} />{p.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
