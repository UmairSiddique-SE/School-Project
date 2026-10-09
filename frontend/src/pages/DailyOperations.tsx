import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calendar, CheckCircle2, DollarSign, Bus, Bell,
  ArrowUpRight, Plus, Printer, RefreshCw, WalletCards, NotebookTabs,
  Phone, MapPin, X, LogOut, Ticket
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

type GatePassReasonType = 'EARLY_LEAVE' | 'HALF_DAY' | 'MEDICAL' | 'OTHER';

interface GatePass {
  id: string;
  passNo: string;
  reasonType: GatePassReasonType;
  reason: string;
  status: 'APPROVED' | 'EXITED';
  issuedAt: string;
  approvedAt: string;
  exitAt?: string | null;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    rollNo?: string | null;
    section?: { name: string; class?: { name: string } } | null;
  };
}

interface GatePassStudent {
  id: string;
  name: string;
  admissionNo: string;
  rollNo?: string | null;
  section?: { name: string; class?: { name: string } } | null;
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

  // Gate passes and student choices are loaded from the school-scoped API.
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [gatePassStudents, setGatePassStudents] = useState<GatePassStudent[]>([]);

  // Modal States
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<GatePass | null>(null);
  const [gatePassForm, setGatePassForm] = useState({
    studentId: '',
    reasonType: 'EARLY_LEAVE' as GatePassReasonType,
    reason: '',
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

  useEffect(() => {
    if (user?.role !== 'SCHOOL_ADMIN') return;
    let cancelled = false;
    Promise.all([apiClient.get('/gate-passes'), apiClient.get('/people/students')])
      .then(([passesRes, studentsRes]) => {
        if (cancelled) return;
        setGatePasses(Array.isArray(passesRes.data) ? passesRes.data : []);
        setGatePassStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      })
      .catch((error) => console.warn('Student gate pass data not loaded', error));
    return () => { cancelled = true; };
  }, [user?.role]);

  const handleCreateGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatePassForm.studentId) return toast.error('Please select a student');
    if (!gatePassForm.reason.trim()) return toast.error('Gate pass reason is required');

    try {
      const response = await apiClient.post('/gate-passes', {
        studentId: gatePassForm.studentId,
        reasonType: gatePassForm.reasonType,
        reason: gatePassForm.reason.trim(),
      });
      const newPass = response.data as GatePass;
      setGatePasses((current) => [newPass, ...current]);
      toast.success(`Gate Pass ${newPass.passNo} issued and approved`);
      setShowGatePassModal(false);
      setSelectedPassForPrint(newPass);
      setGatePassForm({ studentId: '', reasonType: 'EARLY_LEAVE', reason: '' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not issue the gate pass');
    }
  };

  const handleCheckOutPass = async (id: string) => {
    try {
      const response = await apiClient.patch(`/gate-passes/${id}/exit`);
      const updatedPass = response.data as GatePass;
      setGatePasses((current) => current.map((pass) => pass.id === id ? updatedPass : pass));
      if (selectedPassForPrint?.id === id) setSelectedPassForPrint(updatedPass);
      toast.success('Student exit time saved');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not record student exit');
    }
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

            {user?.role === 'SCHOOL_ADMIN' && (
              <button
                onClick={() => setShowGatePassModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition"
              >
                <Ticket size={15} /> Issue Gate Pass
              </button>
            )}

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

        {user?.role === 'SCHOOL_ADMIN' && (
        {/* 4. Student Gate Passes */}
        <div
          onClick={() => setActiveTab('gatepass')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-amber-500/20 bg-card p-5 shadow-sm transition hover:border-amber-500/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Student Gate Passes
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Ticket size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {gatePasses.filter((g) => g.status === 'APPROVED').length} Awaiting Exit
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            Total {gatePasses.length} student passes recorded
          </p>
        </div>
        )}

      </div>

      {/* ── OPERATION MODULE TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/70 scrollbar-none">
        {[
          { key: 'overview', label: 'Command Overview', icon: Activity },
          { key: 'attendance', label: 'Attendance Roster', icon: NotebookTabs },
          { key: 'finance', label: 'Fee Cash Desk', icon: WalletCards },
          { key: 'transport', label: 'Transport Dispatch', icon: Bus },
          { key: 'gatepass', label: 'Student Gate Passes', icon: Ticket },
        ].filter((tab) => tab.key !== 'gatepass' || user?.role === 'SCHOOL_ADMIN').map((tab) => {
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

      {/* ── TAB 5: STUDENT GATE PASS REGISTER ── */}
      {activeTab === 'gatepass' && user?.role === 'SCHOOL_ADMIN' && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Student Gate Pass Register</h3>
              <p className="text-xs text-muted-foreground">
                School-admin-approved early departures, half-day leaves, and student exit records.
              </p>
            </div>
            <button
              onClick={() => setShowGatePassModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 shadow-md"
            >
              <Plus size={15} /> Issue Student Pass
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[10px] font-black uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Pass No</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class / Roll No</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Issued / Exit Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gatePasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No student gate passes yet. Issue a pass to record an approved early departure.
                    </td>
                  </tr>
                ) : (
                  gatePasses.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 font-mono font-bold text-amber-500">{p.passNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{p.student?.name || 'Student'}</p>
                        <p className="text-[10px] text-muted-foreground">{p.student?.admissionNo || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.student?.section?.class?.name || '—'}{p.student?.section?.name ? ` / ${p.student.section.name}` : ''}
                        <span className="block text-[10px]">Roll: {p.student?.rollNo || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{p.reasonType.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-muted-foreground max-w-[240px] whitespace-normal">{p.reason}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span>Issued: {new Date(p.issuedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                        {p.exitAt && <span className="block text-emerald-500">Exit: {new Date(p.exitAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Approved</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Exited</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPassForPrint(p)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-500 hover:bg-cyan-500/10"
                          title="Print student gate pass"
                        >
                          <Printer size={13} className="inline mr-1" /> Print
                        </button>
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => handleCheckOutPass(p.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-500 hover:bg-emerald-500/10"
                          >
                            <LogOut size={13} className="inline mr-1" /> Mark Exit
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

      {/* ── ISSUE STUDENT GATE PASS MODAL ── */}
      {showGatePassModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-base">
                <Ticket size={18} /> Issue Student Gate Pass
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
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Select Student *</label>
                <select
                  required
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs font-semibold text-foreground"
                  value={gatePassForm.studentId}
                  onChange={(e) => setGatePassForm({ ...gatePassForm, studentId: e.target.value })}
                >
                  <option value="">Choose student</option>
                  {gatePassStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} — {student.admissionNo}{student.section?.class?.name ? ` — ${student.section.class.name}` : ''}{student.section?.name ? ` / ${student.section.name}` : ''}
                    </option>
                  ))}
                </select>
                {gatePassStudents.length === 0 && (
                  <p className="mt-1 text-[10px] text-amber-500">No active students available. Add/enroll students first.</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Reason Type *</label>
                <select
                  required
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs font-semibold text-foreground"
                  value={gatePassForm.reasonType}
                  onChange={(e) => setGatePassForm({ ...gatePassForm, reasonType: e.target.value as GatePassReasonType })}
                >
                  <option value="EARLY_LEAVE">Early Leave</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="MEDICAL">Medical / Sick</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Reason / Permission Note *</label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs text-foreground"
                  placeholder="e.g. Parent requested half-day leave for a family appointment"
                  value={gatePassForm.reason}
                  onChange={(e) => setGatePassForm({ ...gatePassForm, reason: e.target.value })}
                />
              </div>

              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-muted-foreground">
                Issuing this pass records the School Admin's approval. Print the slip for the student; security marks the actual exit time at the gate.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setShowGatePassModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={gatePassStudents.length === 0} className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-md disabled:opacity-50">
                  Approve & Create Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINTABLE STUDENT GATE PASS SLIP ── */}
      {selectedPassForPrint && (
        <div className="gate-pass-print-root fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .gate-pass-print-root, .gate-pass-print-root * { visibility: visible !important; }
              .gate-pass-print-root { position: absolute !important; inset: 0 !important; display: block !important; padding: 0 !important; background: white !important; color: black !important; }
              .gate-pass-print-card { border: 2px solid #111 !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; width: 100% !important; color: black !important; background: white !important; }
              .gate-pass-print-actions { display: none !important; }
            }
          `}</style>
          <div className="gate-pass-print-card w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4 text-center">
            <div className="gate-pass-print-actions flex justify-end">
              <button onClick={() => setSelectedPassForPrint(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>

            <div className="border-2 border-dashed border-amber-500/50 p-5 rounded-2xl space-y-3 bg-amber-500/5">
              <div className="border-b border-border/80 pb-2">
                <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{user?.schoolName || 'EduSphere School'}</h3>
                <p className="text-[10px] font-black uppercase text-amber-500">Student Early Exit Gate Pass</p>
                <p className="font-mono font-bold text-xs text-foreground mt-1">{selectedPassForPrint.passNo}</p>
              </div>

              <div className="text-left text-xs space-y-1.5 py-1">
                <p><span className="text-muted-foreground">Student:</span> <strong>{selectedPassForPrint.student?.name || '—'}</strong></p>
                <p><span className="text-muted-foreground">Admission No:</span> <span className="font-mono">{selectedPassForPrint.student?.admissionNo || '—'}</span></p>
                <p><span className="text-muted-foreground">Class / Section:</span> {selectedPassForPrint.student?.section?.class?.name || '—'} / {selectedPassForPrint.student?.section?.name || '—'}</p>
                <p><span className="text-muted-foreground">Roll No:</span> {selectedPassForPrint.student?.rollNo || '—'}</p>
                <p><span className="text-muted-foreground">Reason Type:</span> {selectedPassForPrint.reasonType.replace(/_/g, ' ')}</p>
                <p><span className="text-muted-foreground">Reason:</span> {selectedPassForPrint.reason}</p>
                <p><span className="text-muted-foreground">Issued:</span> <strong>{new Date(selectedPassForPrint.issuedAt).toLocaleString('en-PK')}</strong></p>
                <p><span className="text-muted-foreground">Approval:</span> School Admin</p>
                {selectedPassForPrint.exitAt && <p><span className="text-muted-foreground">Actual Exit:</span> <strong>{new Date(selectedPassForPrint.exitAt).toLocaleString('en-PK')}</strong></p>}
              </div>

              <div className="pt-3 border-t border-border/80 text-[10px] text-muted-foreground">
                Valid only for the student named above. Security must verify this pass and record the exit time.
              </div>
              <div className="pt-2 text-left text-[10px] text-muted-foreground">Authorized signature: ____________________</div>
            </div>

            <div className="gate-pass-print-actions flex items-center justify-center gap-2 pt-2">
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow"><Printer size={14} /> Print Pass</button>
              <button onClick={() => setSelectedPassForPrint(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
