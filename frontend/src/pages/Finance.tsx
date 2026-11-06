import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Clock, CreditCard, DollarSign, Download, Eye,
  FileText, Loader2, Plus, Receipt, Search, Users, X, RefreshCw, Printer,
  ArrowUpRight, ShieldCheck, Check, Building2, ChevronRight, TrendingUp,
  Percent, AlertTriangle, Layers, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type Frequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'ONLINE';
type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  description?: string | null;
  classId?: string | null;
  class?: { name: string } | null;
  createdAt: string;
}

interface FeePayment {
  id: string;
  amount: number;
  discount: number;
  fine: number;
  totalPaid: number;
  method: PaymentMethod;
  status: PaymentStatus;
  dueDate?: string | null;
  paidDate?: string | null;
  receiptNo: string;
  remarks?: string | null;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    section?: { name: string; class?: { name: string } | null } | null;
    class?: { name: string } | null;
  };
  feeStructure?: { id: string; name: string } | null;
}

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  section?: { name: string; class?: { name: string } | null } | null;
  class?: { name: string } | null;
}

interface SchoolClass {
  id: string;
  name: string;
}

const FREQUENCIES: Array<{ value: Frequency; label: string }> = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One-Time' },
];

const METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online Gateway' },
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'CHEQUE', label: 'Bank Cheque' },
];

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;

const statusConfig: Record<PaymentStatus, { label: string; badge: string; border: string }> = {
  PAID: {
    label: 'Fully Paid',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
  },
  PARTIAL: {
    label: 'Partial',
    badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    border: 'border-sky-500/20 hover:border-sky-500/40',
  },
  PENDING: {
    label: 'Overdue / Pending',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    border: 'border-amber-500/20 hover:border-amber-500/40',
  },
};

export default function Finance() {
  const { user, previewRole } = useAuth();
  const role = previewRole ?? user?.role;
  const isAdmin = role === 'SCHOOL_ADMIN';

  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'collections' | 'structures' | 'defaulters'>('collections');
  const [showCollect, setShowCollect] = useState(false);
  const [collectStep, setCollectStep] = useState(1);
  const [showStructure, setShowStructure] = useState(false);
  const [details, setDetails] = useState<FeePayment | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const emptyPayment = {
    studentId: '',
    feeStructureId: '',
    amount: '',
    discount: '0',
    fine: '0',
    amountPaid: '',
    method: 'CASH' as PaymentMethod,
    dueDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  };

  const emptyStructure = {
    name: '',
    amount: '',
    frequency: 'MONTHLY' as Frequency,
    classId: '',
    description: '',
  };

  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [structureForm, setStructureForm] = useState(emptyStructure);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const requests: Promise<any>[] = [
        apiClient.get('/finance/payments'),
        apiClient.get('/finance/structures'),
      ];
      if (isAdmin) {
        requests.push(apiClient.get('/people/students'));
        requests.push(apiClient.get('/academic/classes').catch(() => ({ data: [] })));
      }
      const [paymentRes, structureRes, studentRes, classRes] = await Promise.all(requests);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setStructures(Array.isArray(structureRes.data) ? structureRes.data : []);
      setStudents(isAdmin && Array.isArray(studentRes?.data) ? studentRes.data : []);
      setClasses(isAdmin && Array.isArray(classRes?.data) ? classRes.data : []);
    } catch (err: any) {
      setPayments([]);
      setStructures([]);
      setStudents([]);
      setError(err?.response?.data?.message || 'Unable to load finance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [isAdmin]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const studentName = p.student?.name?.toLowerCase() || '';
      const admNo = p.student?.admissionNo?.toLowerCase() || '';
      const receipt = p.receiptNo?.toLowerCase() || '';
      const feeName = p.feeStructure?.name?.toLowerCase() || '';
      const matchesSearch = !q || studentName.includes(q) || admNo.includes(q) || receipt.includes(q) || feeName.includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const defaulters = useMemo(() => {
    return payments.filter((p) => p.status === 'PENDING' || p.status === 'PARTIAL');
  }, [payments]);

  // Aggregate stats
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
  const totalOutstanding = payments.reduce(
    (sum, p) => sum + Math.max(0, Number(p.amount || 0) - Number(p.discount || 0) + Number(p.fine || 0) - Number(p.totalPaid || 0)),
    0
  );
  const paidCount = payments.filter((p) => p.status === 'PAID').length;
  const collectionRate = payments.length ? Math.round((paidCount / payments.length) * 100) : 0;

  // Selected student in collect modal
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === paymentForm.studentId);
  }, [students, paymentForm.studentId]);

  // Net payable calculation in collect fee modal
  const calculatedPayable = useMemo(() => {
    const base = Number(paymentForm.amount) || 0;
    const disc = Number(paymentForm.discount) || 0;
    const fine = Number(paymentForm.fine) || 0;
    return Math.max(0, base - disc + fine);
  }, [paymentForm.amount, paymentForm.discount, paymentForm.fine]);

  const openCollectModal = (presetStudentId?: string) => {
    setPaymentForm({
      ...emptyPayment,
      studentId: presetStudentId || '',
    });
    setCollectStep(1);
    setShowCollect(true);
  };

  const handleStructureSelect = (structId: string) => {
    const selected = structures.find((s) => s.id === structId);
    setPaymentForm((prev) => ({
      ...prev,
      feeStructureId: structId,
      amount: selected ? String(selected.amount) : prev.amount,
      amountPaid: selected ? String(selected.amount) : prev.amountPaid,
    }));
  };

  const submitCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('Amount due must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/finance/payments', {
        studentId: paymentForm.studentId,
        feeStructureId: paymentForm.feeStructureId || undefined,
        amount: Number(paymentForm.amount),
        amountDue: Number(paymentForm.amount),
        discount: Number(paymentForm.discount || 0),
        fine: Number(paymentForm.fine || 0),
        amountPaid: Number(paymentForm.amountPaid || 0),
        method: paymentForm.method,
        dueDate: paymentForm.dueDate || undefined,
        remarks: paymentForm.remarks.trim() || undefined,
      });
      toast.success('Fee payment recorded successfully!');
      setShowCollect(false);
      setPaymentForm(emptyPayment);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record fee payment');
    } finally {
      setSaving(false);
    }
  };

  const submitCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.name.trim()) {
      toast.error('Fee structure name is required');
      return;
    }
    if (!structureForm.amount || Number(structureForm.amount) <= 0) {
      toast.error('Amount must be positive');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/finance/structures', {
        name: structureForm.name.trim(),
        amount: Number(structureForm.amount),
        frequency: structureForm.frequency,
        classId: structureForm.classId || undefined,
        description: structureForm.description.trim() || undefined,
      });
      toast.success('Fee structure created successfully!');
      setShowStructure(false);
      setStructureForm(emptyStructure);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredPayments.map((p) =>
      [
        p.student?.name,
        p.student?.admissionNo,
        p.receiptNo,
        p.feeStructure?.name || 'Custom Fee',
        p.amount,
        p.discount,
        p.fine,
        p.totalPaid,
        p.method,
        p.status,
        p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-PK') : '',
        p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-PK') : '',
      ]
        .map(escape)
        .join(',')
    );
    const csv = [
      'Student Name,Admission No,Receipt No,Fee Structure,Amount Due,Discount,Fine,Total Paid,Method,Status,Paid Date,Due Date',
      ...rows,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Fee_Collection_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Finance statement exported successfully');
  };

  const printBankChallan = (payment: FeePayment) => {
    const popup = window.open('', '_blank', 'width=1100,height=750');
    if (!popup) {
      toast.error('Please allow pop-ups to print the bank fee challan.');
      return;
    }

    const schoolName = user?.schoolName || 'EduSphere Model School';
    const admNo = payment.student?.admissionNo || 'ADM-2026';
    const studentName = payment.student?.name || 'Student Name';
    const className = payment.student?.class?.name || payment.student?.section?.class?.name || 'Class 10';
    const sectionName = payment.student?.section?.name || 'A';
    const challanNo = payment.receiptNo || 'CH-2026-001';
    const issueDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const dueDate = payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '10th of Month';
    const feeName = payment.feeStructure?.name || 'Tuition & Academic Fee';
    const amount = Number(payment.amount || 0);
    const discount = Number(payment.discount || 0);
    const fine = Number(payment.fine || 0);
    const totalPaid = Number(payment.totalPaid || 0);
    const netPayable = Math.max(0, amount - discount + fine);
    const status = payment.status;

    const copyTypes = ['BANK COPY', 'SCHOOL ACCOUNTS COPY', 'STUDENT / PARENT COPY'];

    const slipHtml = (type: string) => `
      <div style="flex: 1; border: 1.5px dashed #64748b; padding: 14px; border-radius: 8px; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; background: #fff; min-width: 0;">
        <div style="text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-size: 9px; font-weight: 800; color: #0891b2; letter-spacing: 1px; text-transform: uppercase;">Habib Bank Limited / Meezan Bank</div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px;">${schoolName}</div>
          <div style="font-size: 9px; color: #64748b;">A/C Title: ${schoolName} Collection | A/C: 0142-7901-2345-03</div>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 9px; padding: 2px 8px; border-radius: 4px; margin-top: 4px; text-transform: uppercase;">
            ${type}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px;">
          <tr>
            <td style="color: #64748b; font-weight: 600;">Challan No:</td>
            <td style="font-weight: 800; font-family: monospace; text-align: right; color: #0f172a;">${challanNo}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Issue Date:</td>
            <td style="font-weight: 700; text-align: right;">${issueDate}</td>
          </tr>
          <tr>
            <td style="color: #e11d48; font-weight: 700;">Due Date:</td>
            <td style="font-weight: 800; color: #e11d48; text-align: right;">${dueDate}</td>
          </tr>
        </table>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 10px; font-size: 10px;">
          <div><span style="color: #64748b;">Student:</span> <strong>${studentName}</strong></div>
          <div style="margin-top: 2px;"><span style="color: #64748b;">Adm No:</span> <strong style="font-family: monospace;">${admNo}</strong></div>
          <div style="margin-top: 2px;"><span style="color: #64748b;">Class & Sec:</span> <strong>${className} - ${sectionName}</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px;">
          <thead>
            <tr style="border-bottom: 1.5px solid #cbd5e1; background: #f1f5f9;">
              <th style="text-align: left; padding: 4px;">Particulars</th>
              <th style="text-align: right; padding: 4px;">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 4px 0; border-bottom: 1px solid #f1f5f9;">${feeName}</td>
              <td style="text-align: right; padding: 4px 0; font-weight: 600;">${amount.toLocaleString()}</td>
            </tr>
            ${discount > 0 ? `
            <tr style="color: #059669;">
              <td style="padding: 3px 0; border-bottom: 1px solid #f1f5f9;">Scholarship / Concession</td>
              <td style="text-align: right; padding: 3px 0; font-weight: 600;">- ${discount.toLocaleString()}</td>
            </tr>` : ''}
            ${fine > 0 ? `
            <tr style="color: #dc2626;">
              <td style="padding: 3px 0; border-bottom: 1px solid #f1f5f9;">Late Payment Surcharge</td>
              <td style="text-align: right; padding: 3px 0; font-weight: 600;">+ ${fine.toLocaleString()}</td>
            </tr>` : ''}
            <tr style="border-top: 1.5px solid #0f172a; font-weight: 800; font-size: 11px;">
              <td style="padding: 6px 0;">Total Payable</td>
              <td style="text-align: right; padding: 6px 0; color: #0f172a;">PKR ${netPayable.toLocaleString()}</td>
            </tr>
            <tr style="background: #f0fdf4; color: #166534; font-weight: 800; font-size: 10px;">
              <td style="padding: 4px;">Amount Paid (${status})</td>
              <td style="text-align: right; padding: 4px;">PKR ${totalPaid.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 8px; color: #64748b; line-height: 1.3; margin-bottom: 16px;">
          • Payment accepted at any online banking app or bank counter.<br/>
          • Late surcharge applied strictly after due date.<br/>
          • Fee once paid is non-refundable and non-transferable.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 9px; color: #475569;">
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">Depositor Signature</div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">Bank Officer / Cashier</div>
          </div>
        </div>
      </div>
    `;

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Challan - ${challanNo} - ${studentName}</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 12px; background: #fff; }
          .challan-container { display: flex; gap: 12px; max-width: 100%; height: auto; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;" class="no-print">
          <span style="font-family: sans-serif; font-size: 12px; color: #475569;">
            Standard 3-Part Bank Challan for <strong>${studentName}</strong> (${admNo})
          </span>
          <button onclick="window.print()" style="padding: 6px 16px; background: #0891b2; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">
            🖨️ Print / Save as PDF
          </button>
        </div>
        <div class="challan-container">
          ${copyTypes.map(slipHtml).join('')}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck size={12} /> Institutional Treasury
            </span>
            <span className="text-xs text-slate-500 dark:text-muted-foreground">• Live Fiscal Ledger</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            Fees & Financial Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
            Track student tuition, manage automated fee structures, and disburse digital receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/60 hover:bg-accent text-foreground transition-all duration-150 active:scale-95"
            title="Refresh Ledger"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          </button>

          <button
            onClick={exportCsv}
            disabled={!filteredPayments.length}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-foreground text-xs font-bold flex items-center gap-2 hover:bg-accent transition-all duration-150 active:scale-95 shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowStructure(true)}
                className="px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-bold flex items-center gap-2 hover:bg-primary/20 transition-all duration-150 active:scale-95"
              >
                <FileText size={14} /> Add Structure
              </button>

              <button
                onClick={() => openCollectModal()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-150 active:scale-95"
              >
                <Plus size={15} /> Collect Fee
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-xs font-bold underline hover:opacity-80">
            Try again
          </button>
        </div>
      )}

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Collected',
            value: money(totalCollected),
            icon: DollarSign,
            gradient: 'from-slate-50 via-white to-slate-50/50 dark:from-slate-900/40 dark:via-card dark:to-card',
            border: 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30',
            glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/15',
            iconBox: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50',
            labelColor: 'text-slate-600 dark:text-slate-400',
            dotColor: 'bg-emerald-600',
            dotPing: 'bg-emerald-500',
            shadow: 'shadow-sm hover:shadow-md',
            subtitle: 'Verified bank & cash receipts',
          },
          {
            label: 'Outstanding Dues',
            value: money(totalOutstanding),
            icon: Clock,
            gradient: 'from-slate-50 via-white to-slate-50/50 dark:from-slate-900/40 dark:via-card dark:to-card',
            border: 'border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30',
            glow: 'bg-amber-500/10 group-hover:bg-amber-500/15',
            iconBox: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50',
            labelColor: 'text-slate-600 dark:text-slate-400',
            dotColor: 'bg-amber-600',
            dotPing: 'bg-amber-500',
            shadow: 'shadow-sm hover:shadow-md',
            subtitle: `${defaulters.length} pending vouchers`,
          },
          {
            label: 'Collection Rate',
            value: `${collectionRate}%`,
            icon: Percent,
            gradient: 'from-slate-50 via-white to-slate-50/50 dark:from-slate-900/40 dark:via-card dark:to-card',
            border: 'border-slate-200/80 dark:border-slate-800 hover:border-sky-500/30',
            glow: 'bg-sky-500/10 group-hover:bg-sky-500/15',
            iconBox: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/60 dark:border-sky-900/50',
            labelColor: 'text-slate-600 dark:text-slate-400',
            dotColor: 'bg-sky-600',
            dotPing: 'bg-sky-500',
            shadow: 'shadow-sm hover:shadow-md',
            subtitle: `${paidCount} of ${payments.length} fully settled`,
          },
          {
            label: 'Fee Structures',
            value: structures.length,
            icon: Layers,
            gradient: 'from-slate-50 via-white to-slate-50/50 dark:from-slate-900/40 dark:via-card dark:to-card',
            border: 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/30',
            glow: 'bg-indigo-500/10 group-hover:bg-indigo-500/15',
            iconBox: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/50',
            labelColor: 'text-slate-600 dark:text-slate-400',
            dotColor: 'bg-indigo-600',
            dotPing: 'bg-indigo-500',
            shadow: 'shadow-sm hover:shadow-md',
            subtitle: 'Configured billing plans',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5 ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-125`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight">
                  {value}
                </h4>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBox} border shadow-xs transition-transform duration-300 group-hover:scale-105`}>
                <Icon size={19} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Navigation Tabs & Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 bg-accent/30 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt size={14} /> Transactions ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'structures'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={14} /> Fee Structures ({structures.length})
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'defaulters'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle size={14} /> Defaulters ({defaulters.length})
          </button>
        </div>

        {activeTab === 'collections' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, receipt..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs font-semibold text-foreground outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-xs font-semibold text-foreground outline-none"
            >
              <option value="ALL">All Methods</option>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Tab 1: Fee Collections / Transactions ────────────────────────────── */}
      {activeTab === 'collections' && (
        <>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">Loading financial ledger...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-20 rounded-2xl border border-dashed border-border bg-card/50 text-center p-8">
              <Receipt size={46} className="mx-auto text-slate-500 dark:text-muted-foreground/30 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-foreground">No Transactions Found</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1 max-w-sm mx-auto">
                No fee payment records match your filters. Record a new fee payment to populate this ledger.
              </p>
              {isAdmin && (
                <button
                  onClick={() => openCollectModal()}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-2 hover:bg-emerald-500 shadow-md"
                >
                  <Plus size={14} /> Collect Fee Now
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-accent/40 border-b border-border">
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Student Details
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Receipt No
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Fee Head
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Payable
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Paid
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Method
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-center">
                        Status
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map((p) => {
                      const payable = Math.max(0, Number(p.amount) - Number(p.discount || 0) + Number(p.fine || 0));
                      const cfg = statusConfig[p.status] || statusConfig.PENDING;
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-accent/30 transition-colors duration-150 group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                {p.student?.name ? p.student.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                  {p.student?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">
                                  {p.student?.admissionNo} • {p.student?.section?.class?.name || p.student?.class?.name || 'Class N/A'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-foreground font-semibold">
                            {p.receiptNo}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-muted-foreground">
                            {p.feeStructure?.name || 'Standard Tuition'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-foreground text-right">
                            {money(payable)}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-emerald-600 text-right">
                            {money(p.totalPaid)}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                            <span className="px-2 py-1 rounded-md bg-accent/60 text-foreground font-semibold">
                              {p.method}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${cfg.badge}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-muted-foreground">
                            {p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-PK') : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setDetails(p)}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                              title="View Official Receipt"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Tab 2: Fee Structures ────────────────────────────────────────────── */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Configured Fee Schedules</h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Institutional fee templates and periodic billing rules.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowStructure(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-sm"
              >
                <Plus size={14} /> New Structure
              </button>
            )}
          </div>

          {structures.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/40">
              <FileText size={40} className="mx-auto text-slate-500 dark:text-muted-foreground/30 mb-2" />
              <p className="text-sm font-bold text-slate-900 dark:text-foreground">No Fee Structures Configured</p>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">Create tuition, admission, or lab fee templates.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {structures.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {s.frequency}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-muted-foreground font-mono">
                        {s.class?.name ? `Class ${s.class.name}` : 'All Classes'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {s.name}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase">Base Fee</span>
                      <p className="text-lg font-black text-slate-900 dark:text-foreground">{money(s.amount)}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setPaymentForm({ ...emptyPayment, feeStructureId: s.id, amount: String(s.amount) });
                          setCollectStep(1);
                          setShowCollect(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                      >
                        Collect This
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 3: Defaulters / Overdue ──────────────────────────────────────── */}
      {activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Defaulters & Pending Dues</h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Students with unpaid or partially settled fee receipts.</p>
            </div>
          </div>

          {defaulters.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-emerald-500/30 rounded-2xl bg-emerald-500/5 p-8">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-2" />
              <h3 className="font-bold text-lg text-emerald-600">All Accounts Reconciled</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">There are no pending or overdue fee records in the system.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-accent/40 border-b border-border">
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Student
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Receipt
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                        Fee Type
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Total Due
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Balance Unpaid
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-center">
                        Due Date
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {defaulters.map((p) => {
                      const payable = Math.max(0, Number(p.amount) - Number(p.discount || 0) + Number(p.fine || 0));
                      const balance = Math.max(0, payable - Number(p.totalPaid || 0));
                      return (
                        <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-foreground">{p.student?.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">{p.student?.admissionNo}</p>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono">{p.receiptNo}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-muted-foreground">
                            {p.feeStructure?.name || 'Custom Fee'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-foreground text-right">
                            {money(payable)}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-black text-rose-500 text-right">
                            {money(balance)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-center text-slate-500 dark:text-muted-foreground">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-PK') : 'Overdue'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {isAdmin && (
                              <button
                                onClick={() => openCollectModal(p.student?.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm"
                              >
                                Settle Due
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal 1: Collect Fee (Multi-step Wizard) ─────────────────────────── */}
      <Modal isOpen={showCollect} onClose={() => setShowCollect(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<DollarSign size={20} />}
          title="Collect Student Fee"
          subtitle="Record an authenticated fiscal receipt into institutional accounts"
          onClose={() => setShowCollect(false)}
        />

        {/* Wizard Steps indicator */}
        <div className="flex border-b border-border px-6 pt-3 pb-3 gap-3 bg-accent/20">
          {[
            { step: 1, title: 'Student & Head' },
            { step: 2, title: 'Amounts & Net' },
            { step: 3, title: 'Payment & Receipt' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCollectStep(s.step)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                collectStep === s.step
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  collectStep === s.step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-slate-500 dark:text-muted-foreground'
                }`}
              >
                {s.step}
              </span>
              {s.title}
            </button>
          ))}
        </div>

        <form onSubmit={submitCollectFee} className="p-6 space-y-4">
          {collectStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Student *
                </label>
                <select
                  required
                  value={paymentForm.studentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">-- Choose student from roster --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNo}) — {s.section?.class?.name || s.class?.name || 'Class'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="p-3.5 rounded-xl bg-accent/40 border border-border text-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-foreground">{selectedStudent.name}</p>
                    <p className="text-slate-500 dark:text-muted-foreground">
                      Roll / Adm: {selectedStudent.admissionNo} • Class:{' '}
                      {selectedStudent.section?.class?.name || selectedStudent.class?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Fee Structure (Optional Template)
                </label>
                <select
                  value={paymentForm.feeStructureId}
                  onChange={(e) => handleStructureSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Custom / Manual Fee Head</option>
                  {structures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.frequency}) — {money(st.amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!paymentForm.studentId}
                  onClick={() => setCollectStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-40"
                >
                  Next: Amounts <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {collectStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Amount Due (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: e.target.value,
                        amountPaid: e.target.value,
                      })
                    }
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Scholarship / Discount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paymentForm.discount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, discount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Late Fine / Surcharge (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paymentForm.fine}
                    onChange={(e) => setPaymentForm({ ...paymentForm, fine: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Amount Paid Today (PKR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground font-bold text-emerald-600 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-500 dark:text-muted-foreground uppercase text-[10px]">Net Payable</span>
                  <p className="text-xl font-black text-slate-900 dark:text-foreground">{money(calculatedPayable)}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-500 dark:text-muted-foreground uppercase text-[10px]">Settlement Status</span>
                  <p className="text-sm font-bold text-emerald-600">
                    {Number(paymentForm.amountPaid) >= calculatedPayable
                      ? 'Full Payment'
                      : Number(paymentForm.amountPaid) > 0
                      ? 'Partial Payment'
                      : 'Unpaid Voucher'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCollectStep(1)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCollectStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90"
                >
                  Next: Payment Method <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {collectStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                  >
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Remarks / Cheque No / Reference
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  placeholder="e.g. Bank Challan #4489, Paid on time"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="p-4 rounded-xl bg-accent/40 border border-border space-y-1.5 text-xs">
                <p className="font-bold text-slate-900 dark:text-foreground">Summary Confirmation</p>
                <p className="text-slate-500 dark:text-muted-foreground">
                  Student:{' '}
                  <span className="font-bold text-slate-900 dark:text-foreground">
                    {selectedStudent?.name || 'Selected Student'}
                  </span>
                </p>
                <p className="text-slate-500 dark:text-muted-foreground">
                  Amount Paid:{' '}
                  <span className="font-bold text-emerald-600">{money(Number(paymentForm.amountPaid))}</span>{' '}
                  via <span className="font-bold text-slate-900 dark:text-foreground">{paymentForm.method}</span>
                </p>
              </div>

              <div className="flex justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCollectStep(2)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Confirm & Generate Receipt
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ─── Modal 2: Create Fee Structure ─────────────────────────────────────── */}
      <Modal isOpen={showStructure} onClose={() => setShowStructure(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<FileText size={20} />}
          title="Create Fee Structure"
          subtitle="Define recurring or one-time institutional fee schedules"
          onClose={() => setShowStructure(false)}
        />
        <form onSubmit={submitCreateStructure} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Fee Name *
            </label>
            <input
              required
              type="text"
              value={structureForm.name}
              onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
              placeholder="e.g. Monthly Tuition Fee (Class 10)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Amount (PKR) *
              </label>
              <input
                required
                type="number"
                min="1"
                step="1"
                value={structureForm.amount}
                onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                placeholder="e.g. 7500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Frequency
              </label>
              <select
                value={structureForm.frequency}
                onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value as Frequency })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Target Class (Optional)
            </label>
            <select
              value={structureForm.classId}
              onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">All Classes (Institutional)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Description / Memo
            </label>
            <textarea
              rows={2}
              value={structureForm.description}
              onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
              placeholder="Additional policy details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowStructure(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-md"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Create Fee Structure
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 3: Official Receipt Details ─────────────────────────────────── */}
      <Modal isOpen={Boolean(details)} onClose={() => setDetails(null)} maxWidth="max-w-lg">
        {details && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold">
                  Official Institutional Receipt
                </span>
                <h2 className="text-xl font-black text-foreground tracking-tight">Receipt {details.receiptNo}</h2>
              </div>
              <button
                onClick={() => setDetails(null)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-muted-foreground hover:bg-accent hover:text-slate-900 dark:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-accent/30 border border-border grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-muted-foreground uppercase text-[10px] font-bold">Student Name</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{details.student?.name}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-muted-foreground uppercase text-[10px] font-bold">Admission Number</span>
                <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                  {details.student?.admissionNo}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-muted-foreground uppercase text-[10px] font-bold">Fee Category</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {details.feeStructure?.name || 'Custom Tuition'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-muted-foreground uppercase text-[10px] font-bold">Payment Method</span>
                <p className="font-semibold text-foreground mt-0.5">{details.method}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs border-y border-border py-3">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Original Due Amount:</span>
                <span className="font-semibold text-slate-900 dark:text-foreground">{money(details.amount)}</span>
              </div>
              {Number(details.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Scholarship / Discount:</span>
                  <span>- {money(details.discount)}</span>
                </div>
              )}
              {Number(details.fine) > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Late Fee / Fine:</span>
                  <span>+ {money(details.fine)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-border/60">
                <span>Net Payable:</span>
                <span className="text-slate-900 dark:text-foreground">
                  {money(Math.max(0, Number(details.amount) - Number(details.discount || 0) + Number(details.fine || 0)))}
                </span>
              </div>
              <div className="flex justify-between font-black text-sm text-emerald-600 pt-1">
                <span>Total Amount Paid:</span>
                <span>{money(details.totalPaid)}</span>
              </div>
            </div>

            {details.remarks && (
              <div className="p-3 rounded-xl bg-accent/40 text-xs">
                <span className="text-slate-500 dark:text-muted-foreground font-bold uppercase text-[10px]">Auditor Remarks</span>
                <p className="text-foreground mt-0.5">{details.remarks}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Date: {details.paidDate ? new Date(details.paidDate).toLocaleString('en-PK') : 'Pending'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => printBankChallan(details)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm"
                >
                  <Printer size={14} /> Print 3-Part Bank Challan
                </button>
                <button
                  onClick={() => setDetails(null)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
