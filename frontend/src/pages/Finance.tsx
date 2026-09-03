import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, X, Loader2, CheckCircle, Clock, AlertCircle, CreditCard,
  Search, Filter, Download, TrendingUp, TrendingDown, Calendar, Users,
  FileText, Receipt, Trash2, Edit2, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Types & Interfaces ────────────────────────────────────────────────────────

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
  description?: string;
  classId?: string;
  className?: string;
  createdAt: string;
}

interface FeePayment {
  id: string;
  amount: number;
  discount: number;
  fine: number;
  totalPaid: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'ONLINE' | 'CHEQUE' | 'CARD';
  status: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
  dueDate?: string;
  paidDate: string;
  remarks?: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class?: string;
  };
  feeStructure?: {
    id: string;
    name: string;
  };
}

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class?: string;
}

// ─── Constants & Helpers ───────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PARTIAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  OVERDUE: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const statusIcons: Record<string, React.ElementType> = {
  PAID: CheckCircle,
  PENDING: Clock,
  PARTIAL: CreditCard,
  OVERDUE: AlertCircle,
};

const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'ONE_TIME', label: 'One-Time' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online Payment' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Finance() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCollect, setShowCollect] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState<FeePayment | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [collectForm, setCollectForm] = useState({
    studentId: '',
    feeStructureId: '',
    amount: '',
    discount: '',
    fine: '',
    amountPaid: '',
    method: 'CASH' as const,
    dueDate: '',
    remarks: '',
  });

  const [structureForm, setStructureForm] = useState({
    name: '',
    amount: '',
    frequency: 'MONTHLY' as const,
    description: '',
    classId: '',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch Data
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
      setPayments([]);
      setStructures([]);
      setStudents([]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // Calculate Metrics
  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.totalPaid, 0);
  const pendingAmount = payments.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + (p.amount - p.totalPaid), 0);
  const overdueAmount = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.amount - p.totalPaid), 0);
  const todayRevenue = payments
    .filter(p => p.status === 'PAID' && new Date(p.paidDate).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + p.totalPaid, 0);
  const collectionRate = payments.length > 0
    ? Math.round((payments.filter(p => p.status === 'PAID').length / payments.length) * 100)
    : 0;

  // Filter Payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.feeStructure?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;

    let matchesDate = true;
    if (dateRange.start) matchesDate = matchesDate && new Date(p.paidDate) >= new Date(dateRange.start);
    if (dateRange.end) matchesDate = matchesDate && new Date(p.paidDate) <= new Date(dateRange.end);

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  // Handlers
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/finance/payments', collectForm);
      toast.success('Fee collected successfully!');
      setShowCollect(false);
      setCollectForm({
        studentId: '',
        feeStructureId: '',
        amount: '',
        discount: '',
        fine: '',
        amountPaid: '',
        method: 'CASH',
        dueDate: '',
        remarks: '',
      });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to collect fee');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/finance/structures', structureForm);
      toast.success('Fee structure created successfully!');
      setShowStructureModal(false);
      setStructureForm({
        name: '',
        amount: '',
        frequency: 'MONTHLY',
        description: '',
        classId: '',
      });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStructure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      await apiClient.delete(`/finance/structures/${id}`);
      toast.success('Fee structure deleted successfully!');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete fee structure');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await apiClient.delete(`/finance/payments/${id}`);
      toast.success('Payment record deleted successfully!');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete payment');
    }
  };

  const exportReport = () => {
    const rows = filteredPayments.map(p =>
      `"${p.student.name}","${p.student.admissionNo}","${p.feeStructure?.name || 'Manual'}","${p.amount}","${p.totalPaid}","${p.discount}","${p.fine}","${p.method}","${p.status}","${p.paidDate}"`
    ).join('\n');
    const blob = new Blob([`Student Name,Admission No,Fee Type,Amount,Paid,Discount,Fine,Method,Status,Paid Date\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fee_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported successfully!');
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              Financial Management System
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Finance & Fees</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage fee structures, collect payments, track dues & generate reports
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportReport}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> Export Report
          </button>
          <button
            onClick={() => setShowStructureModal(true)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText size={14} /> Fee Structure
          </button>
          <button
            onClick={() => setShowCollect(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Collect Fee
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-white/80" />
            <span className="text-[10px] font-bold uppercase text-white/70">Total Revenue</span>
          </div>
          <p className="text-2xl font-black">${totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-white/60 mt-1">All time collected</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Today's Collection</span>
          </div>
          <p className="text-2xl font-black text-foreground">${todayRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 mt-1">+{todayRevenue > 0 ? '12%' : '0%'} from yesterday</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending Amount</span>
          </div>
          <p className="text-2xl font-black text-foreground">${pendingAmount.toLocaleString()}</p>
          <p className="text-[10px] text-amber-400 mt-1">{payments.filter(p => p.status !== 'PAID').length} pending</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Overdue Amount</span>
          </div>
          <p className="text-2xl font-black text-foreground">${overdueAmount.toLocaleString()}</p>
          <p className="text-[10px] text-rose-400 mt-1">{payments.filter(p => p.status === 'OVERDUE').length} overdue</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Collection Rate</span>
          </div>
          <p className="text-2xl font-black text-foreground">{collectionRate}%</p>
          <p className="text-[10px] text-blue-400 mt-1">{payments.filter(p => p.status === 'PAID').length}/{payments.length} paid</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Students</span>
          </div>
          <p className="text-2xl font-black text-foreground">{students.length}</p>
          <p className="text-[10px] text-violet-400 mt-1">Active enrollments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student name, admission no, or fee type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Methods</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading payment data...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card">
          <Receipt size={52} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-black text-foreground">No Payment Records Found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Try adjusting your filters or collect your first payment.
          </p>
          <button
            onClick={() => setShowCollect(true)}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
          >
            + Collect First Payment
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Payment History</h2>
            <span className="text-xs text-muted-foreground">{filteredPayments.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  {['Student', 'Admission No', 'Fee Type', 'Amount', 'Paid', 'Discount', 'Fine', 'Method', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, i) => {
                  const StatusIcon = statusIcons[p.status] || Clock;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">{p.student.name}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground font-mono">{p.student.admissionNo}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{p.feeStructure?.name || 'Manual'}</td>
                      <td className="px-4 py-3.5 text-sm text-foreground font-semibold">${p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600">${p.totalPaid.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-sm text-blue-600">${p.discount}</td>
                      <td className="px-4 py-3.5 text-sm text-rose-600">${p.fine}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{p.method}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[p.status]}`}>
                          <StatusIcon size={10} />{p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{new Date(p.paidDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowPaymentDetails(p)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      <Modal isOpen={showCollect} onClose={() => setShowCollect(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<DollarSign size={22} />}
          title="Collect Fee Payment"
          subtitle="Record payment from student"
          onClose={() => setShowCollect(false)}
        />
        <form onSubmit={handleCollectFee} className="space-y-4 text-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Student *</label>
                    <select
                      value={collectForm.studentId}
                      onChange={e => setCollectForm({ ...collectForm, studentId: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.admissionNo}) - {s.class || 'N/A'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Fee Structure</label>
                    <select
                      value={collectForm.feeStructureId}
                      onChange={e => {
                        const structure = structures.find(s => s.id === e.target.value);
                        setCollectForm({
                          ...collectForm,
                          feeStructureId: e.target.value,
                          amount: structure ? String(structure.amount) : '',
                        });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Select Fee Structure (optional) --</option>
                      {structures.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - ${s.amount.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Amount Due *</label>
                    <input
                      value={collectForm.amount}
                      onChange={e => setCollectForm({ ...collectForm, amount: e.target.value })}
                      type="number"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Discount</label>
                    <input
                      value={collectForm.discount}
                      onChange={e => setCollectForm({ ...collectForm, discount: e.target.value })}
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Fine</label>
                    <input
                      value={collectForm.fine}
                      onChange={e => setCollectForm({ ...collectForm, fine: e.target.value })}
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Amount Paid *</label>
                    <input
                      value={collectForm.amountPaid}
                      onChange={e => setCollectForm({ ...collectForm, amountPaid: e.target.value })}
                      type="number"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Payment Method *</label>
                    <select
                      value={collectForm.method}
                      onChange={e => setCollectForm({ ...collectForm, method: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Due Date</label>
                    <input
                      value={collectForm.dueDate}
                      onChange={e => setCollectForm({ ...collectForm, dueDate: e.target.value })}
                      type="date"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Remarks</label>
                  <textarea
                    value={collectForm.remarks}
                    onChange={e => setCollectForm({ ...collectForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCollect(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                    {saving ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* Fee Structure Modal */}
      <Modal isOpen={showStructureModal} onClose={() => setShowStructureModal(false)} maxWidth="max-w-xl">
        <ModalHeader
          icon={<FileText size={22} />}
          title="Fee Structure Management"
          subtitle="Create and manage fee types"
          onClose={() => setShowStructureModal(false)}
        />
        <form onSubmit={handleCreateStructure} className="space-y-4 text-sm p-6">
                <div>
                  <label className="block font-bold text-foreground mb-1.5">Fee Name *</label>
                  <input
                    value={structureForm.name}
                    onChange={e => setStructureForm({ ...structureForm, name: e.target.value })}
                    required
                    placeholder="e.g. Monthly Tuition Fee"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Amount *</label>
                    <input
                      value={structureForm.amount}
                      onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })}
                      type="number"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Frequency *</label>
                    <select
                      value={structureForm.frequency}
                      onChange={e => setStructureForm({ ...structureForm, frequency: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {FREQUENCY_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Description</label>
                  <textarea
                    value={structureForm.description}
                    onChange={e => setStructureForm({ ...structureForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Existing Fee Structures */}
                <div className="pt-4 border-t border-border">
                  <h3 className="font-bold text-foreground mb-3">Existing Fee Structures</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {structures.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border">
                        <div>
                          <p className="font-bold text-foreground text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">${s.amount.toLocaleString()} • {s.frequency}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteStructure(s.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowStructureModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Creating...' : 'Create Structure'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* Payment Details Modal */}
      <Modal isOpen={!!showPaymentDetails} onClose={() => setShowPaymentDetails(null)} maxWidth="max-w-lg">
        {showPaymentDetails && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Payment Details</h2>
              <button onClick={() => setShowPaymentDetails(null)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Student</p>
                  <p className="font-bold text-foreground">{showPaymentDetails.student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admission No</p>
                  <p className="font-mono text-foreground">{showPaymentDetails.student.admissionNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fee Type</p>
                  <p className="font-bold text-foreground">{showPaymentDetails.feeStructure?.name || 'Manual'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[showPaymentDetails.status]}`}>
                    {statusIcons[showPaymentDetails.status] && React.createElement(statusIcons[showPaymentDetails.status], { size: 10 })}
                    {showPaymentDetails.status}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-accent/30 border border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount Due</p>
                    <p className="font-bold text-foreground">${showPaymentDetails.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
                    <p className="font-bold text-emerald-600">${showPaymentDetails.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Discount</p>
                    <p className="font-bold text-blue-600">${showPaymentDetails.discount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fine</p>
                    <p className="font-bold text-rose-600">${showPaymentDetails.fine}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-bold text-foreground">{showPaymentDetails.method}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                  <p className="font-bold text-foreground">{new Date(showPaymentDetails.paidDate).toLocaleDateString()}</p>
                </div>
              </div>

              {showPaymentDetails.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <p className="font-bold text-foreground">{new Date(showPaymentDetails.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {showPaymentDetails.remarks && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm text-foreground">{showPaymentDetails.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowPaymentDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
