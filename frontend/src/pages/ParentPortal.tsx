import { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, CalendarDays, CheckCircle2, CreditCard, GraduationCap, Loader2, Megaphone, UserRound } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Child = { id: string; admissionNo: string; rollNo?: string; name: string; gender?: string; dob?: string; status: string; section?: { id: string; name: string; class?: { id: string; name: string } } | null };
type Parent = { id: string; name: string; email: string; phone?: string; address?: string; children: Child[] };
type Payment = { id: string; amount: number; discount: number; fine: number; totalPaid: number; status: string; dueDate?: string; paidDate?: string; receiptNo: string; feeStructure?: { name: string } | null; student?: { name: string; admissionNo: string } };
type Notice = { id: string; title: string; content?: string; message?: string; createdAt: string };
type Notification = { id: string; title: string; message: string; isRead: boolean; createdAt: string };

export default function ParentPortal() {
  const [parent, setParent] = useState<Parent | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const results = await Promise.allSettled([
          apiClient.get('/people/parent/me'),
          apiClient.get('/finance/payments'),
          apiClient.get('/academics/announcements'),
          apiClient.get('/notifications'),
        ]);
        if (!mounted) return;
        const [p, f, n, notif] = results;
        if (p.status === 'fulfilled') setParent(p.value.data || null);
        if (f.status === 'fulfilled') setPayments(Array.isArray(f.value.data) ? f.value.data : []);
        if (n.status === 'fulfilled') setNotices(Array.isArray(n.value.data) ? n.value.data : []);
        if (notif.status === 'fulfilled') setNotifications(Array.isArray(notif.value.data) ? notif.value.data : []);
        if (p.status === 'rejected') toast.error(p.reason?.response?.data?.message || 'Unable to load parent profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const outstanding = useMemo(() => payments.reduce((sum, p) => {
    const payable = Math.max(0, Number(p.amount || 0) - Number(p.discount || 0) + Number(p.fine || 0));
    return sum + Math.max(0, payable - Number(p.totalPaid || 0));
  }, 0), [payments]);
  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!parent) return <div className="rounded-3xl border border-dashed p-10 text-center bg-card"><UserRound className="mx-auto mb-3 text-primary" /><h2 className="font-bold text-xl">Parent profile not found</h2><p className="text-muted-foreground mt-2">Your school admin needs to link this login email with a parent record.</p></div>;

  return <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-violet-500/10 p-6 md:p-8 shadow-xl">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary"><UserRound size={30} /></div><div><p className="text-xs uppercase tracking-widest font-black text-primary mb-1">Parent Portal</p><h1 className="text-3xl font-black">Welcome, {parent.name}</h1><p className="text-muted-foreground mt-1">{parent.email}{parent.phone ? ` • ${parent.phone}` : ''}</p></div></div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400"><CheckCircle2 size={16} /> Account Active</div>
      </div>
    </section>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border bg-card p-5"><GraduationCap className="text-primary mb-3" size={20} /><p className="text-xs text-muted-foreground">Children</p><p className="font-black text-xl mt-1">{parent.children.length}</p></div>
      <div className="rounded-2xl border bg-card p-5"><CreditCard className="text-amber-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-black text-xl mt-1">Rs. {outstanding.toLocaleString()}</p></div>
      <div className="rounded-2xl border bg-card p-5"><BookOpen className="text-sky-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Fee Records</p><p className="font-black text-xl mt-1">{payments.length}</p></div>
      <div className="rounded-2xl border bg-card p-5"><Bell className="text-violet-400 mb-3" size={20} /><p className="text-xs text-muted-foreground">Unread Alerts</p><p className="font-black text-xl mt-1">{unread}</p></div>
    </div>

    <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><GraduationCap size={18} className="text-primary" /> My Children</h2>{parent.children.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{parent.children.map(child => <div key={child.id} className="rounded-2xl border p-5"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><UserRound size={20} /></div><div><p className="font-black">{child.name}</p><p className="text-xs text-muted-foreground">{child.section?.class?.name || 'Class'}{child.section?.name ? ` • Section ${child.section.name}` : ''}</p></div></div><div className="grid grid-cols-2 gap-3 mt-4 text-xs"><div className="rounded-xl bg-muted/40 p-3"><p className="text-muted-foreground">Admission No</p><p className="font-bold mt-1">{child.admissionNo}</p></div><div className="rounded-xl bg-muted/40 p-3"><p className="text-muted-foreground">Roll No</p><p className="font-bold mt-1">{child.rollNo || '—'}</p></div></div><p className="text-xs mt-3 text-emerald-400 font-bold">Status: {child.status}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No linked children found.</p>}</section>

    <div className="grid lg:grid-cols-2 gap-6">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><CreditCard size={18} className="text-amber-400" /> Fee History</h2>{payments.length ? <div className="space-y-3">{payments.slice(0, 12).map(p => <div key={p.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"><div><p className="font-bold">{p.feeStructure?.name || 'Fee Payment'}</p><p className="text-xs text-muted-foreground mt-1">{p.student?.name || 'Child'} • {p.receiptNo}</p></div><div className="text-right"><p className="font-black">Rs. {Number(p.totalPaid || 0).toLocaleString()}</p><span className="text-[11px] font-black uppercase text-muted-foreground">{p.status}</span></div></div>)}</div> : <p className="text-sm text-muted-foreground">No fee records available.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Bell size={18} className="text-violet-400" /> Notifications</h2>{notifications.length ? <div className="space-y-3">{notifications.slice(0, 8).map(n => <div key={n.id} className={`rounded-xl border p-4 ${!n.isRead ? 'border-primary/25 bg-primary/5' : ''}`}><p className="font-bold">{n.title}</p><p className="text-sm text-muted-foreground mt-1">{n.message}</p><p className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No notifications.</p>}</section>
    </div>

    <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><Megaphone size={18} className="text-cyan-400" /> School Notices</h2>{notices.length ? <div className="grid md:grid-cols-2 gap-3">{notices.slice(0, 8).map(n => <div key={n.id} className="rounded-xl border p-4"><p className="font-semibold">{n.title}</p><p className="text-sm mt-1.5 text-muted-foreground">{n.content || n.message}</p><p className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No new notices.</p>}</section>

    <section className="rounded-2xl border bg-card p-5"><h2 className="font-black text-lg mb-4 flex gap-2 items-center"><CalendarDays size={18} className="text-sky-400" /> Parent Access</h2><p className="text-sm text-muted-foreground">This portal shows only children linked to your parent account and school-scoped financial records. Academic and attendance details remain limited to the linked children by the corresponding school services.</p></section>
  </div>;
}
