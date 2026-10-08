import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calendar, CheckCircle2, Clock, DollarSign, Users,
  Bus, Bell, ShieldCheck, ArrowUpRight, Search, Plus, Printer,
  RefreshCw, ChevronRight, XCircle, AlertCircle, FileText,
  UserCheck, Sparkles, Building2, WalletCards, NotebookTabs,
  BadgeAlert, Phone, MapPin, Check, X, LogIn, LogOut, Ticket
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ClassSection {
  id: string;
  name: string;
  classId: string;
  className: string;
  totalStudents: number;
}

interface FeePaymentItem {
  id: string;
  receiptNo: string;
  amount: number;
  totalPaid: number;
  method: string;
  status: string;
  paidDate?: string | null;
  student?: {
    name: string;
    admissionNo: string;
    section?: { name: string; class?: { name: string } };
  };
}

interface NoticeItem {
  id: string;
  title: string;
  message?: string;
  target?: string;
  priority?: string;
  createdAt?: string;
}

interface TransportRoute {
  id: string;
  name: string;
  startPoint?: string | null;
  endPoint?: string | null;
  vehicles?: Array<{
    id: string;
    vehicleNo: string;
    driverName?: string | null;
    driverPhone?: string | null;
    capacity?: number | null;
  }>;
  _count?: { assignments?: number };
}

interface GatePass {
  id: string;
  passNo: string;
  type: 'VISITOR' | 'STUDENT_EARLY_EXIT' | 'DELIVERY';
  personName: string;
  phone: string;
  cnic?: string;
  purpose: string;
  studentName?: string;
  studentRoll?: string;
  entryTime: string;
  exitTime?: string;
  status: 'INSIDE' | 'CHECKED_OUT';
}

const money = (val: number) => `PKR ${Number(val || 0).toLocaleString('en-PK')}`;

export default function DailyOperations() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || 'edusphere';
  const navigate = useNavigate();

  // Tab State: 'overview' | 'attendance' | 'finance' | 'transport' | 'gatepass'
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'finance' | 'transport' | 'gatepass'>('overview');

  // Loading & refresh states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [attendanceSummary, setAttendanceSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [recentPayments, setRecentPayments] = useState<FeePaymentItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState({ totalCollected: 0, pending: 0, todayCollected: 0 });
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  // Gate Passes State (Stored per school)
  const storageKey = `edusphere_gate_passes_${user?.schoolId || 'default'}`;
  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal States
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<GatePass | null>(null);
  const [gatePassForm, setGatePassForm] = useState({
    type: 'VISITOR' as GatePass['type'],
    personName: '',
    phone: '',
    cnic: '',
    purpose: '',
    studentName: '',
    studentRoll: '',
  });

  // Load All Daily Operations Data
  const loadDailyData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Attendance Summary
      try {
        const attRes = await apiClient.get('/attendance/summary');
        if (attRes.data) {
          setAttendanceSummary(attRes.data);
        }
      } catch (e) {
        console.warn('Attendance summary not loaded', e);
      }

      // 2. Class Sections
      try {
        const secRes = await apiClient.get('/classes/sections');
        if (Array.isArray(secRes.data)) {
          setSections(
            secRes.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              classId: s.classId || s.class?.id,
              className: s.className || s.class?.name || 'Class',
              totalStudents: s._count?.students || s.totalStudents || 0,
            }))
          );
        }
      } catch (e) {
        console.warn('Sections not loaded', e);
      }

      // 3. Finance & Payments
      try {
        const [payRes, finSumRes] = await Promise.allSettled([
          apiClient.get('/finance/payments'),
          apiClient.get('/finance/summary'),
        ]);

        if (payRes.status === 'fulfilled' && payRes.value.data) {
          const list = Array.isArray(payRes.value.data)
            ? payRes.value.data
            : payRes.value.data.payments || [];
          setRecentPayments(list.slice(0, 15));

          // Calculate today's collection
          const todayStr = new Date().toISOString().slice(0, 10);
          const todaySum = list.reduce((acc: number, p: any) => {
            const pDate = p.paidDate ? String(p.paidDate).slice(0, 10) : '';
            return pDate === todayStr ? acc + Number(p.totalPaid || p.amount || 0) : acc;
          }, 0);

          setFinanceSummary((prev) => ({
            ...prev,
            todayCollected: todaySum,
          }));
        }

        if (finSumRes.status === 'fulfilled' && finSumRes.value.data) {
          const fs = finSumRes.value.data;
          setFinanceSummary((prev) => ({
            ...prev,
            totalCollected: Number(fs.totalRevenue || fs.totalCollected || 0),
            pending: Number(fs.pendingDues || fs.pending || 0),
          }));
        }
      } catch (e) {
        console.warn('Finance data not loaded', e);
      }

      // 4. Notices
      try {
        const notRes = await apiClient.get('/notices');
        if (Array.isArray(notRes.data)) {
          setNotices(notRes.data.slice(0, 6));
        }
      } catch (e) {
        console.warn('Notices not loaded', e);
      }

      // 5. Transport
      try {
        const trRes = await apiClient.get('/transport/routes');
        if (Array.isArray(trRes.data)) {
          setRoutes(trRes.data);
        }
      } catch (e) {
        console.warn('Transport routes not loaded', e);
      }
    } catch (err: any) {
      toast.error('Could not refresh all daily operations data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDailyData();
  }, []);

  // Save Gate Passes to Local Storage
  const saveGatePasses = (list: GatePass[]) => {
    setGatePasses(list);
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleCreateGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatePassForm.personName.trim()) {
      return toast.error('Person name is required');
    }

    const newPass: GatePass = {
      id: `GP-${Date.now()}`,
      passNo: `PASS-${String(gatePasses.length + 1).padStart(4, '0')}`,
      type: gatePassForm.type,
      personName: gatePassForm.personName.trim(),
      phone: gatePassForm.phone.trim(),
      cnic: gatePassForm.cnic.trim(),
      purpose: gatePassForm.purpose.trim() || 'Official School Visit',
      studentName: gatePassForm.studentName.trim() || undefined,
      studentRoll: gatePassForm.studentRoll.trim() || undefined,
      entryTime: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      status: 'INSIDE',
    };

    const updated = [newPass, ...gatePasses];
    saveGatePasses(updated);
    toast.success(`Gate Pass ${newPass.passNo} issued for ${newPass.personName}`);
    setShowGatePassModal(false);
    setSelectedPassForPrint(newPass);
    setGatePassForm({
      type: 'VISITOR',
      personName: '',
      phone: '',
      cnic: '',
      purpose: '',
      studentName: '',
      studentRoll: '',
    });
  };

  const handleCheckOutPass = (id: string) => {
    const time = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const updated = gatePasses.map((p) =>
      p.id === id ? { ...p, status: 'CHECKED_OUT' as const, exitTime: time } : p
    );
    saveGatePasses(updated);
    toast.success('Visitor marked checked out');
  };

  // Date Formatting for Display
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const totalRegisteredStudents = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
  }, [sections]);

  const attendancePercent = useMemo(() => {
    if (!attendanceSummary.total) return 0;
    return Math.round((attendanceSummary.present / attendanceSummary.total) * 100);
  }, [attendanceSummary]);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-20">
      
      {/* ── TOP HERO COMMAND CENTER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-card to-blue-950/30 p-6 sm:p-8 shadow-sm">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
                School Command Center • روزمرہ کی کارروائیاں
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              Daily Operations Control
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={14} className="text-cyan-400" />
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="text-foreground font-semibold">{user?.schoolName || 'EduSphere School'}</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate(`/${schoolSlug}/attendance`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:brightness-110 transition"
            >
              <NotebookTabs size={15} /> Mark Attendance
            </button>

            <button
              onClick={() => navigate(`/${schoolSlug}/finance`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:brightness-110 transition"
            >
              <WalletCards size={15} /> Collect Fee
            </button>

            <button
              onClick={() => setShowGatePassModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition"
            >
              <Ticket size={15} /> Issue Gate Pass
            </button>

            <button
              onClick={() => loadDailyData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition"
              title="Refresh Live Operations Data"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 LIVE KPI STATUS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Student Attendance Today */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-500/20 bg-card p-5 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Today's Attendance
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {attendanceSummary.total ? `${attendancePercent}%` : 'Active'}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              ({attendanceSummary.present} Present)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="text-rose-500 font-bold">{attendanceSummary.absent} Absent</span>
            <span>•</span>
            <span className="text-amber-500 font-bold">{attendanceSummary.late} Late</span>
            <span>•</span>
            <span className="text-sky-500 font-bold">{attendanceSummary.leave} Leave</span>
          </div>
        </div>

        {/* 2. Today's Cash & Fee Desk */}
        <div
          onClick={() => setActiveTab('finance')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-cyan-500/20 bg-card p-5 shadow-sm transition hover:border-cyan-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Today's Fee Receipts
            </span>
            <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-500">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-foreground font-mono">
              {money(financeSummary.todayCollected)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            Pending Dues: <strong className="text-amber-500">{money(financeSummary.pending)}</strong>
          </p>
        </div>

        {/* 3. Transport & Bus Fleet */}
        <div
          onClick={() => setActiveTab('transport')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-purple-500/20 bg-card p-5 shadow-sm transition hover:border-purple-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Transport Fleet
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
              <Bus size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {routes.length} Active Routes
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            {routes.reduce((acc, r) => acc + (r.vehicles?.length || 0), 0)} Registered Vans & Buses
          </p>
        </div>

        {/* 4. Gate Passes & Visitors */}
        <div
          onClick={() => setActiveTab('gatepass')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-amber-500/20 bg-card p-5 shadow-sm transition hover:border-amber-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Visitors & Gate Passes
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Ticket size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {gatePasses.filter((g) => g.status === 'INSIDE').length} Inside Campus
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            Total {gatePasses.length} gate passes recorded today
          </p>
        </div>

      </div>

      {/* ── OPERATION MODULE TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/70 scrollbar-none">
        {[
          { key: 'overview', label: 'Command Overview', icon: Activity },
          { key: 'attendance', label: 'Attendance Roster', icon: NotebookTabs },
          { key: 'finance', label: 'Fee Cash Desk', icon: WalletCards },
          { key: 'transport', label: 'Transport Dispatch', icon: Bus },
          { key: 'gatepass', label: 'Visitor & Gate Pass Register', icon: Ticket },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                active
                  ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: COMMAND OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Active Class Sections & Attendance Status */}
            <div className="lg:col-span-2 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-foreground">Today's Class Sections</h3>
                  <p className="text-xs text-muted-foreground">
                    Class-wise strength and attendance readiness for {sections.length} active sections.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/${schoolSlug}/attendance`)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 hover:underline"
                >
                  Full Attendance Sheet <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {sections.slice(0, 8).map((sec) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-foreground">
                        {sec.className} — Section {sec.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {sec.totalStudents} Enrolled Students
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${sec.id}`)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                    >
                      Mark Sheet
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Today's Notices & Circulars */}
            <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Bell size={16} className="text-amber-500" /> Today's Notices
                </h3>
                <button
                  onClick={() => navigate(`/${schoolSlug}/notices`)}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  Notice Board
                </button>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
                {notices.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No notices published today. Click Notice Board to create announcements.
                  </div>
                ) : (
                  notices.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-2xl border border-border/60 bg-muted/15 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-foreground truncate">{n.title}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                          {n.priority || 'General'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {n.message || 'School notification'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Quick Receipts Table */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-foreground">Recent Fee Transactions Today</h3>
                <p className="text-xs text-muted-foreground">Live student tuition and admission collections</p>
              </div>
              <button
                onClick={() => navigate(`/${schoolSlug}/finance`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 hover:underline"
              >
                Open Fee Management <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[10px] font-black uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">
                        No transactions recorded yet today.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-500">{p.receiptNo}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{p.student?.name || 'Student'}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{p.student?.admissionNo || '—'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-500">{money(p.totalPaid || p.amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.method || 'CASH'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ✓ {p.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: ATTENDANCE ROSTER ── */}
      {activeTab === 'attendance' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Class Attendance Rosters</h3>
              <p className="text-xs text-muted-foreground">
                Select any class section to record or view student daily attendance marks.
              </p>
            </div>
            <button
              onClick={() => navigate(`/${schoolSlug}/attendance`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
            >
              <NotebookTabs size={15} /> Open Attendance Page
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="p-5 rounded-2xl border border-border bg-muted/20 hover:border-emerald-500/40 transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground">{sec.className}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      Section {sec.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Class Strength: <strong>{sec.totalStudents}</strong> students
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <button
                    onClick={() => navigate(`/${schoolSlug}/attendance?sectionId=${sec.id}`)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    Mark Today
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: FEE CASH DESK ── */}
      {activeTab === 'finance' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Fee Cash Desk & Receipts</h3>
              <p className="text-xs text-muted-foreground">
                Live payments recorded at the finance counter today.
              </p>
            </div>
            <button
              onClick={() => navigate(`/${schoolSlug}/finance`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 shadow-md"
            >
              <Plus size={15} /> Collect New Fee
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[10px] font-black uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Paid Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No fee payments recorded.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{p.receiptNo}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{p.student?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.student?.admissionNo || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">{money(p.totalPaid || p.amount)}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: TRANSPORT DISPATCH ── */}
      {activeTab === 'transport' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Transport Fleet & Active Routes</h3>
              <p className="text-xs text-muted-foreground">
                Driver contacts, vehicles, and student pick/drop details.
              </p>
            </div>
            <button
              onClick={() => navigate(`/${schoolSlug}/transport`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
            >
              <Bus size={15} /> Transport Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-xs text-muted-foreground">
                No transport routes registered yet. Open the Transport module to add routes and vehicles.
              </div>
            ) : (
              routes.map((r) => (
                <div key={r.id} className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-foreground">{r.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400">
                      {r._count?.assignments || 0} Students
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-purple-400" />
                      <span>{r.startPoint || 'School'} ➔ {r.endPoint || 'Destination'}</span>
                    </p>
                    {r.vehicles && r.vehicles.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/60">
                        <p className="font-bold text-foreground text-[11px]">
                          Vehicle: {r.vehicles[0].vehicleNo}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone size={11} /> Driver: {r.vehicles[0].driverName || 'Assigned Driver'} ({r.vehicles[0].driverPhone || '—'})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: VISITOR & GATE PASS REGISTER ── */}
      {activeTab === 'gatepass' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Visitor Log & Gate Pass Register</h3>
              <p className="text-xs text-muted-foreground">
                Digital campus security register for parents, visitors, and student early exit permissions.
              </p>
            </div>
            <button
              onClick={() => setShowGatePassModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 shadow-md"
            >
              <Plus size={15} /> Issue New Gate Pass
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[10px] font-black uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Pass No</th>
                  <th className="px-4 py-3">Visitor Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Purpose / Student</th>
                  <th className="px-4 py-3">Time In / Out</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gatePasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No gate passes issued yet today. Click "Issue New Gate Pass" above.
                    </td>
                  </tr>
                ) : (
                  gatePasses.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-mono font-bold text-amber-500">{p.passNo}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{p.personName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-foreground">
                          {p.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.phone}</td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{p.purpose}</p>
                        {p.studentName && (
                          <p className="text-[10px] text-muted-foreground">
                            Student: {p.studentName} ({p.studentRoll || '—'})
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span>In: {p.entryTime}</span>
                        {p.exitTime && <span className="block text-emerald-500">Out: {p.exitTime}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'INSIDE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            ● Inside Campus
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ✓ Checked Out
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedPassForPrint(p)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-500 hover:bg-cyan-500/10"
                          title="Print Pass Slip"
                        >
                          <Printer size={13} className="inline mr-1" /> Slip
                        </button>
                        {p.status === 'INSIDE' && (
                          <button
                            onClick={() => handleCheckOutPass(p.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-500 hover:bg-emerald-500/10"
                          >
                            <LogOut size={13} className="inline mr-1" /> Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ISSUE GATE PASS MODAL ── */}
      {showGatePassModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-base">
                <Ticket size={18} /> Issue Gate Pass / Visitor Entry
              </div>
              <button
                onClick={() => setShowGatePassModal(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGatePass} className="space-y-4 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                  Pass Type
                </label>
                <select
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs font-semibold text-foreground"
                  value={gatePassForm.type}
                  onChange={(e) => setGatePassForm({ ...gatePassForm, type: e.target.value as any })}
                >
                  <option value="VISITOR">Official Visitor / Parent Meeting</option>
                  <option value="STUDENT_EARLY_EXIT">Student Early Exit / Sick Leave</option>
                  <option value="DELIVERY">Vendor / Delivery / Service Person</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                    Visitor / Guardian Name *
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs text-foreground"
                    placeholder="e.g. Tariq Mehmood"
                    value={gatePassForm.personName}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, personName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    required
                    className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs font-mono text-foreground"
                    placeholder="0300-1234567"
                    value={gatePassForm.phone}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                    CNIC / National ID
                  </label>
                  <input
                    className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs font-mono text-foreground"
                    placeholder="35201-xxxxxxx-x"
                    value={gatePassForm.cnic}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, cnic: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                    Purpose of Visit
                  </label>
                  <input
                    className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs text-foreground"
                    placeholder="Fee submission / Parent meeting / Early pick"
                    value={gatePassForm.purpose}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, purpose: e.target.value })}
                  />
                </div>
              </div>

              {gatePassForm.type === 'STUDENT_EARLY_EXIT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">
                      Student Name
                    </label>
                    <input
                      className="w-full rounded-xl border border-amber-500/30 bg-card px-3 py-2 text-xs text-foreground"
                      placeholder="e.g. Muhammad Ali"
                      value={gatePassForm.studentName}
                      onChange={(e) => setGatePassForm({ ...gatePassForm, studentName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">
                      Class / Roll No
                    </label>
                    <input
                      className="w-full rounded-xl border border-amber-500/30 bg-card px-3 py-2 text-xs text-foreground"
                      placeholder="e.g. Class 5 (Roll #12)"
                      value={gatePassForm.studentRoll}
                      onChange={(e) => setGatePassForm({ ...gatePassForm, studentRoll: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowGatePassModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-md"
                >
                  Issue Pass & Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINTABLE GATE PASS SLIP MODAL ── */}
      {selectedPassForPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4 text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPassForPrint(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-2 border-dashed border-amber-500/50 p-5 rounded-2xl space-y-3 bg-amber-500/5">
              <div className="border-b border-border/80 pb-2">
                <h3 className="font-black text-sm text-foreground uppercase tracking-wider">
                  {user?.schoolName || 'EduSphere School'}
                </h3>
                <p className="text-[10px] font-black uppercase text-amber-500">Official Campus Gate Pass</p>
                <p className="font-mono font-bold text-xs text-foreground mt-1">{selectedPassForPrint.passNo}</p>
              </div>

              <div className="text-left text-xs space-y-1.5 py-1">
                <p><span className="text-muted-foreground">Visitor:</span> <strong>{selectedPassForPrint.personName}</strong></p>
                <p><span className="text-muted-foreground">Phone:</span> <span className="font-mono">{selectedPassForPrint.phone}</span></p>
                <p><span className="text-muted-foreground">Type:</span> {selectedPassForPrint.type.replace(/_/g, ' ')}</p>
                <p><span className="text-muted-foreground">Purpose:</span> {selectedPassForPrint.purpose}</p>
                {selectedPassForPrint.studentName && (
                  <p><span className="text-muted-foreground">Student:</span> {selectedPassForPrint.studentName} ({selectedPassForPrint.studentRoll || '—'})</p>
                )}
                <p><span className="text-muted-foreground">Time In:</span> <strong>{selectedPassForPrint.entryTime}</strong></p>
              </div>

              <div className="pt-3 border-t border-border/80 text-[10px] text-muted-foreground">
                Please return this slip to the security gate when leaving the school campus.
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow"
              >
                <Printer size={14} /> Print Pass
              </button>
              <button
                onClick={() => setSelectedPassForPrint(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
