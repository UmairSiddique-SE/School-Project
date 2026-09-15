import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, Users, WalletCards, ClipboardCheck, GraduationCap, CalendarCheck } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type AttendanceSummary = { total: number; present: number; absent: number; late: number; leave: number };

export default function ReportsLive() {
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary>({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [s, p, e, a] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/finance/payments'),
        apiClient.get('/exams'),
        apiClient.get('/attendance/summary'),
      ]);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setPayments(Array.isArray(p.data) ? p.data : []);
      setExams(Array.isArray(e.data) ? e.data : []);
      setAttendance({
        total: Number(a.data?.total || 0),
        present: Number(a.data?.present || 0),
        absent: Number(a.data?.absent || 0),
        late: Number(a.data?.late || 0),
        leave: Number(a.data?.leave || 0),
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const collected = useMemo(() => payments.reduce((n, p) => n + Number(p.totalPaid || 0), 0), [payments]);
  const paid = payments.filter((p) => p.status === 'PAID').length;
  const paymentRate = payments.length ? Math.round((paid / payments.length) * 100) : 0;
  const attendanceRate = attendance.total ? Math.round((attendance.present / attendance.total) * 100) : 0;

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', students.length],
      ['Fee Records', payments.length],
      ['Total Collected PKR', collected],
      ['Paid Records %', paymentRate],
      ['Exams', exams.length],
      ['Attendance Records', attendance.total],
      ['Present Attendance %', attendanceRate],
      ['Absent', attendance.absent],
      ['Late', attendance.late],
      ['Leave', attendance.leave],
    ];
    const blob = new Blob([rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edusphere-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const cards = [
    ['Students', students.length, Users],
    ['Collected', `PKR ${collected.toLocaleString()}`, WalletCards],
    ['Payment completion', `${paymentRate}%`, ClipboardCheck],
    ['Attendance rate', `${attendanceRate}%`, CalendarCheck],
    ['Exams', exams.length, GraduationCap],
  ] as const;

  return <div className="space-y-6 pb-10">
    <div className="rounded-[28px] border border-border bg-card p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div><div className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Live Analytics</div><h1 className="text-3xl font-black mt-2">Reports</h1><p className="text-sm text-muted-foreground mt-1">Reports are calculated from current school records.</p></div>
      <div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold"><RefreshCw size={16} className="inline mr-2" />Refresh</button><button onClick={exportCsv} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold"><Download size={16} className="inline mr-2" />Export CSV</button></div>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><Icon size={19} className="text-primary" /><p className="text-xs text-muted-foreground mt-4">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-3xl border border-border bg-card p-6"><h2 className="font-black text-lg">Finance snapshot</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Payment records</span><b>{payments.length}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Collected</span><b>PKR {collected.toLocaleString()}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Paid completion</span><b>{paymentRate}%</b></div></div></section>
      <section className="rounded-3xl border border-border bg-card p-6"><h2 className="font-black text-lg">Attendance snapshot</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-muted-foreground block">Total records</span><b>{attendance.total}</b></div><div><span className="text-muted-foreground block">Present</span><b>{attendance.present}</b></div><div><span className="text-muted-foreground block">Absent</span><b>{attendance.absent}</b></div><div><span className="text-muted-foreground block">Late / Leave</span><b>{attendance.late} / {attendance.leave}</b></div></div></section>
    </div>
    <section className="rounded-3xl border border-border bg-card p-6"><h2 className="font-black text-lg">Academic snapshot</h2><div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Active students</span><b>{students.length}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Exams</span><b>{exams.length}</b></div></div></section>
  </div>;
}
