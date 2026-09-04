import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard, DollarSign, Download, Eye, FileText, Loader2, Plus, Receipt, Search, Users, X } from 'lucide-react';
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
  student: { id: string; name: string; admissionNo: string; class?: { name: string } | null };
  feeStructure?: { id: string; name: string } | null;
}

interface Student { id: string; name: string; admissionNo: string; class?: { name: string } | null }

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
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'ONLINE', label: 'Online' },
];

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const statusClass: Record<PaymentStatus, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PARTIAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export default function Finance() {
  const { user, previewRole } = useAuth();
  const role = previewRole ?? user?.role;
  const isAdmin = role === 'SCHOOL_ADMIN';

  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCollect, setShowCollect] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [details, setDetails] = useState<FeePayment | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');

  const emptyPayment = { studentId: '', feeStructureId: '', amount: '', discount: '', fine: '', amountPaid: '', method: 'CASH' as PaymentMethod, dueDate: '', remarks: '' };
  const emptyStructure = { name: '', amount: '', frequency: 'MONTHLY' as Frequency, description: '' };
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [structureForm, setStructureForm] = useState(emptyStructure);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const requests: Promise<any>[] = [apiClient.get('/finance/payments'), apiClient.get('/finance/structures')];
      if (isAdmin) requests.push(apiClient.get('/people/students'));
      const [paymentRes, structureRes, studentRes] = await Promise.all(requests);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setStructures(Array.isArray(structureRes.data) ? structureRes.data : []);
      setStudents(isAdmin && Array.isArray(studentRes?.data) ? studentRes.data : []);
    } catch (err: any) {
      setPayments([]); setStructures([]); setStudents([]);
      setError(err?.response?.data?.message || 'Unable to load finance data. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [isAdmin]);

  const filtered = useMemo(() => payments.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.student?.name?.toLowerCase().includes(q) || p.student?.admissionNo?.toLowerCase().includes(q) || p.receiptNo?.toLowerCase().includes(q) || p.feeStructure?.name?.toLowerCase().includes(q);
    return matchesSearch && (status === 'ALL' || p.status === status) && (method === 'ALL' || p.method === method);
  }), [payments, search, status, method]);

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
  const outstanding = payments.reduce((sum, p) => sum + Math.max(0, Number(p.amount || 0) - Number(p.discount || 0) + Number(p.fine || 0) - Number(p.totalPaid || 0)), 0);
  const paidCount = payments.filter((p) => p.status === 'PAID').length;
  const collectionRate = payments.length ? Math.round((paidCount / payments.length) * 100) : 0;

  const collectFee = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/finance/payments', {
        ...paymentForm,
        amountDue: paymentForm.amount,
        discount: paymentForm.discount || 0,
        fine: paymentForm.fine || 0,
        amountPaid: paymentForm.amountPaid || 0,
      });
      toast.success('Fee payment recorded successfully');
      setPaymentForm(emptyPayment); setShowCollect(false); await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  const createStructure = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/finance/structures', {
        ...structureForm,
        amount: Number(structureForm.amount),
      });
      toast.success('Fee structure created successfully');
      setStructureForm(emptyStructure); setShowStructure(false); await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee structure');
    } finally { setSaving(false); }
  };

  const exportCsv = () => {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map((p) => [p.student?.name, p.student?.admissionNo, p.receiptNo, p.feeStructure?.name || 'Manual', p.amount, p.discount, p.fine, p.totalPaid, p.method, p.status, p.paidDate || ''].map(escape).join(','));
    const csv = ['Student,Admission No,Receipt No,Fee Type,Amount,Discount,Fine,Paid,Method,Status,Paid Date', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `EduSphere-Fee-Report-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Finance report exported');
  };

  const selectStructure = (id: string) => {
    const selected = structures.find((s) => s.id === id);
    setPaymentForm((prev) => ({ ...prev, feeStructureId: id, amount: selected ? String(selected.amount) : prev.amount }));
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Financial Management</p>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Fees & Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time fee structures, collections and outstanding balances.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-bold flex items-center gap-2 hover:bg-accent"><Download size={14}/> Export</button>
          {isAdmin && <>
            <button onClick={() => setShowStructure(true)} className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-bold flex items-center gap-2 hover:bg-accent"><FileText size={14}/> Fee Structure</button>
            <button onClick={() => setShowCollect(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"><Plus size={15}/> Collect Fee</button>
          </>}
        </div>
      </div>

      {error && <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-600 text-sm flex items-center gap-2"><AlertCircle size={17}/>{error}<button onClick={fetchData} className="ml-auto font-bold underline">Retry</button></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<DollarSign size={17}/>} label="Collected" value={money(totalCollected)} />
        <Metric icon={<Clock size={17}/>} label="Outstanding" value={money(outstanding)} />
        <Metric icon={<CheckCircle size={17}/>} label="Collection Rate" value={`${collectionRate}%`} />
        <Metric icon={<Users size={17}/>} label={isAdmin ? 'Students' : 'Payments'} value={isAdmin ? students.length.toLocaleString() : payments.length.toLocaleString()} />
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, admission no, receipt or fee..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary"/></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground"><option value="ALL">All Status</option><option value="PAID">Paid</option><option value="PARTIAL">Partial</option><option value="PENDING">Pending</option></select>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground"><option value="ALL">All Methods</option>{METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
      </div>

      {loading ? <div className="py-20 flex justify-center"><Loader2 size={34} className="animate-spin text-primary"/></div> : filtered.length === 0 ? <EmptyState isAdmin={isAdmin} onCollect={() => setShowCollect(true)}/> : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex justify-between"><h2 className="font-bold">Payment History</h2><span className="text-xs text-muted-foreground">{filtered.length} records</span></div>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-accent/30 border-b border-border">{['Student','Receipt','Fee Type','Amount','Paid','Method','Status','Date',''].map((h) => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{filtered.map((p) => <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/20">
              <td className="px-4 py-3 text-sm"><p className="font-semibold">{p.student?.name}</p><p className="text-xs text-muted-foreground">{p.student?.admissionNo}</p></td>
              <td className="px-4 py-3 text-xs font-mono">{p.receiptNo}</td><td className="px-4 py-3 text-sm text-muted-foreground">{p.feeStructure?.name || 'Manual'}</td>
              <td className="px-4 py-3 text-sm font-semibold">{money(p.amount)}</td><td className="px-4 py-3 text-sm font-semibold text-emerald-600">{money(p.totalPaid)}</td><td className="px-4 py-3 text-xs">{p.method}</td>
              <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusClass[p.status]}`}>{p.status}</span></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3"><button onClick={() => setDetails(p)} className="p-2 rounded-lg hover:bg-accent" title="View details"><Eye size={14}/></button></td>
            </tr>)}</tbody></table></div>
        </div>
      )}

      <Modal isOpen={showCollect} onClose={() => setShowCollect(false)} maxWidth="max-w-2xl">
        <ModalHeader icon={<DollarSign size={21}/>} title="Collect Fee Payment" subtitle="Record a verified school fee payment" onClose={() => setShowCollect(false)}/>
        <form onSubmit={collectFee} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Student *"><select required value={paymentForm.studentId} onChange={(e) => setPaymentForm({...paymentForm, studentId: e.target.value})} className="input"><option value="">Select student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}</select></Field>
          <Field label="Fee Structure"><select value={paymentForm.feeStructureId} onChange={(e) => selectStructure(e.target.value)} className="input"><option value="">Manual fee</option>{structures.map((s) => <option key={s.id} value={s.id}>{s.name} — {money(s.amount)}</option>)}</select></Field></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Field label="Amount Due *"><input required min="0.01" step="0.01" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="input"/></Field><Field label="Discount"><input min="0" step="0.01" type="number" value={paymentForm.discount} onChange={(e) => setPaymentForm({...paymentForm, discount: e.target.value})} className="input"/></Field><Field label="Fine"><input min="0" step="0.01" type="number" value={paymentForm.fine} onChange={(e) => setPaymentForm({...paymentForm, fine: e.target.value})} className="input"/></Field><Field label="Amount Paid *"><input required min="0" step="0.01" type="number" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm({...paymentForm, amountPaid: e.target.value})} className="input"/></Field></div>
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Payment Method"><select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as PaymentMethod})} className="input">{METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field><Field label="Due Date"><input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm({...paymentForm, dueDate: e.target.value})} className="input"/></Field></div>
          <Field label="Remarks"><textarea rows={2} value={paymentForm.remarks} onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})} className="input"/></Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-border"><button type="button" onClick={() => setShowCollect(false)} className="px-5 py-2.5 rounded-xl border border-border font-semibold">Cancel</button><button disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2">{saving && <Loader2 size={15} className="animate-spin"/>}Record Payment</button></div>
        </form>
      </Modal>

      <Modal isOpen={showStructure} onClose={() => setShowStructure(false)} maxWidth="max-w-xl">
        <ModalHeader icon={<FileText size={21}/>} title="Create Fee Structure" subtitle="Define a reusable fee for your school" onClose={() => setShowStructure(false)}/>
        <form onSubmit={createStructure} className="p-6 space-y-4"><Field label="Fee Name *"><input required value={structureForm.name} onChange={(e) => setStructureForm({...structureForm, name: e.target.value})} placeholder="e.g. Monthly Tuition Fee" className="input"/></Field><div className="grid sm:grid-cols-2 gap-4"><Field label="Amount *"><input required min="0.01" step="0.01" type="number" value={structureForm.amount} onChange={(e) => setStructureForm({...structureForm, amount: e.target.value})} className="input"/></Field><Field label="Frequency"><select value={structureForm.frequency} onChange={(e) => setStructureForm({...structureForm, frequency: e.target.value as Frequency})} className="input">{FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field></div><Field label="Description"><textarea rows={3} value={structureForm.description} onChange={(e) => setStructureForm({...structureForm, description: e.target.value})} className="input"/></Field><div className="pt-3 border-t border-border flex justify-end gap-2"><button type="button" onClick={() => setShowStructure(false)} className="px-5 py-2.5 rounded-xl border border-border font-semibold">Cancel</button><button disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2">{saving && <Loader2 size={15} className="animate-spin"/>}Create Structure</button></div></form>
      </Modal>

      <Modal isOpen={!!details} onClose={() => setDetails(null)} maxWidth="max-w-lg">
        {details && <div className="p-6 space-y-5"><div className="flex items-center justify-between border-b border-border pb-4"><div><h2 className="text-xl font-black">Payment Details</h2><p className="text-xs text-muted-foreground">Receipt {details.receiptNo}</p></div><button onClick={() => setDetails(null)}><X size={20}/></button></div><div className="grid grid-cols-2 gap-4 text-sm"><Info label="Student" value={details.student?.name}/><Info label="Admission No" value={details.student?.admissionNo}/><Info label="Fee Type" value={details.feeStructure?.name || 'Manual'}/><Info label="Method" value={details.method}/><Info label="Amount Due" value={money(details.amount)}/><Info label="Paid" value={money(details.totalPaid)}/><Info label="Discount" value={money(details.discount)}/><Info label="Fine" value={money(details.fine)}/><Info label="Status" value={details.status}/><Info label="Payment Date" value={details.paidDate ? new Date(details.paidDate).toLocaleDateString() : '—'}/></div>{details.remarks && <div className="p-3 rounded-xl bg-accent/30 text-sm"><span className="text-xs text-muted-foreground">Remarks</span><p>{details.remarks}</p></div>}</div>}
      </Modal>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="p-4 rounded-2xl bg-card border border-border"><div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase"><span className="text-primary">{icon}</span>{label}</div><p className="mt-2 text-xl font-black text-foreground">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-foreground">{label}<div className="mt-1.5">{children}</div></label>; }
function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-semibold text-foreground break-words">{value || '—'}</p></div>; }
function EmptyState({ isAdmin, onCollect }: { isAdmin: boolean; onCollect: () => void }) { return <div className="py-20 rounded-2xl border border-dashed border-border bg-card text-center"><Receipt size={44} className="mx-auto text-muted-foreground/30 mb-3"/><h3 className="font-black text-lg">No finance records yet</h3><p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Create a fee structure or record your first payment.' : 'Your school has no fee payment records available.'}</p>{isAdmin && <button onClick={onCollect} className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Collect Fee</button>}</div>; }
