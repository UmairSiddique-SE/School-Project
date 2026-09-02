import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  DollarSign,
  Clock,
  CheckCircle,
  GraduationCap,
  UserCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  Hourglass,
  Ban,
  FlaskConical,
  Wallet,
  BadgeCheck,
  ReceiptText,
  Users,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BellRing,
  CalendarClock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import apiClient from "@/api/apiClient";

/* ─── Shared chart config ─────────────────────────────────────────────────── */
const CT = {
  grid: "rgba(255,255,255,0.04)",
  tick: "#64748b",
  tooltip: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    fontSize: 12,
    color: "#f8fafc",
  },
};

/* ─── Pie colours ──────────────────────────────────────────────────────────── */
const PIE_COLORS: Record<string, string> = {
  FREE_TRIAL: "#64748b",
  BASIC: "#3b82f6",
  STANDARD: "#8b5cf6",
  PREMIUM: "#f59e0b",
  Active: "#10b981",
  Inactive: "#ef4444",
};

/* ─── Formatters ──────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n ?? 0);

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/* ─── KPI Card ────────────────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  trendUp,
  loading,
  delay,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<any>;
  accent: string;
  trend?: string;
  trendUp?: boolean;
  loading: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="relative group overflow-hidden rounded-[22px] border border-white/[0.06] bg-slate-900/50
        p-5 backdrop-blur-xl hover:border-white/20 hover:shadow-xl transition-all duration-500"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 15% 15%, ${accent}22 0%, transparent 55%)`,
        }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center ring-1 ring-white/10
          group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg"
          style={{ background: `${accent}18` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter
            ${
              trendUp
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-rose-500/10   text-rose-400   ring-1 ring-rose-500/20"
            }`}
          >
            {trendUp ? (
              <ArrowUpRight size={10} />
            ) : (
              <ArrowDownRight size={10} />
            )}
            {trend}
          </span>
        )}
      </div>

      <div className="relative">
        <p
          className={`text-3xl font-black tracking-tight leading-none text-white ${loading ? "animate-pulse" : ""}`}
        >
          {loading ? "—" : value}
        </p>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
          {label}
        </p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ─── Section Label ───────────────────────────────────────────────────────── */
function SectionLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-3 pl-1">
      {emoji} {text}
    </p>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function Overview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient
      .get("/admin/overview")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    load();
    setTimeout(() => setSpinning(false), 1200);
  };

  /* ── Derived values ── */
  const totalSchools = data?.totalSchools ?? 0;
  const activeSchools = data?.activeSchools ?? 0;
  const inactiveSchools = totalSchools - activeSchools;
  const trialSchools = data?.trialSchools ?? 0;
  const expiredSchools = data?.expiredSchools ?? 0;

  const monthRevenue = data?.monthRevenue ?? 0;
  const todayRevenue = data?.todayRevenue ?? 0;
  const pendingPayments = data?.pendingPayments ?? 0;

  const totalStudents = data?.totalStudents ?? 0;
  const totalTeachers = data?.totalTeachers ?? 0;
  const activeSubs = data?.activeSubscriptions ?? 0;
  const pendingRequests = data?.pendingSchoolRequests ?? 0;

  /* Growth chart: merge schoolGrowth + revenueTimeline by month */
  const growthRaw: any[] = data?.schoolGrowth ?? [];
  const revRaw: any[] = data?.revenueTimeline ?? [];
  const revMap: Record<string, number> = {};
  revRaw.forEach((r) => {
    revMap[r.month] = r.amount;
  });
  const growthChart = growthRaw.map((r) => ({
    month: r.month.slice(5),
    schools: r.count,
    revenue: revMap[r.month] ?? 0,
  }));

  const planDist: any[] = data?.planDistribution ?? [];
  const expiringList: any[] = data?.expiringSchools ?? [];
  const activities: any[] = data?.recentActivities ?? [];
  const recentPayments: any[] = data?.recentPayments ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-violet-500/15
          bg-gradient-to-br from-violet-600/15 via-slate-900/60 to-slate-950/40
          p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-24 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/25
              bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300"
            >
              <Sparkles size={11} />
              Super Admin Dashboard
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Platform Intelligence Dashboard
            </h2>
            <p className="mt-1.5 text-sm text-slate-400 font-medium">
              Real-time overview — schools, revenue, subscriptions &amp;
              platform health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5
                px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <RefreshCw
                size={14}
                className={
                  spinning ? "animate-spin text-violet-400" : "text-slate-400"
                }
              />
              Refresh
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
              px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02]"
            >
              Generate Report <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Schools KPIs ──────────────────────────────────────────────────── */}
      <div>
        <SectionLabel emoji="🏫" text="Institutional Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            label="Total Schools"
            value={fmt(totalSchools)}
            sub="All registered"
            icon={School}
            accent="#8b5cf6"
            trend="+MoM"
            trendUp
            loading={loading}
            delay={0.0}
          />
          <KpiCard
            label="Active Schools"
            value={fmt(activeSchools)}
            sub="Currently live"
            icon={CheckCircle}
            accent="#10b981"
            trend="Live"
            trendUp
            loading={loading}
            delay={0.06}
          />
          <KpiCard
            label="Inactive Schools"
            value={fmt(inactiveSchools)}
            sub="Suspended / off"
            icon={Ban}
            accent="#ef4444"
            trend="Review"
            trendUp={false}
            loading={loading}
            delay={0.12}
          />
          <KpiCard
            label="Trial Schools"
            value={fmt(trialSchools)}
            sub="Free / 14-day"
            icon={FlaskConical}
            accent="#f59e0b"
            loading={loading}
            delay={0.18}
          />
          <KpiCard
            label="Expired Subs"
            value={fmt(expiredSchools)}
            sub="Needs renewal"
            icon={Hourglass}
            accent="#f97316"
            trend="Urgent"
            trendUp={false}
            loading={loading}
            delay={0.24}
          />
        </div>
      </div>

      {/* ── Revenue / Income KPIs ─────────────────────────────────────────── */}
      <div>
        <SectionLabel emoji="💰" text="Revenue & Income" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            label="Total Month Revenue"
            value={fmtMoney(monthRevenue)}
            sub="Collected this month"
            icon={DollarSign}
            accent="#10b981"
            trend="+12%"
            trendUp
            loading={loading}
            delay={0.05}
          />
          <KpiCard
            label="Today's Income"
            value={fmtMoney(todayRevenue)}
            sub="Collected today"
            icon={Wallet}
            accent="#3b82f6"
            loading={loading}
            delay={0.1}
          />
          <KpiCard
            label="Pending Payments"
            value={fmt(pendingPayments)}
            sub="Awaiting collection"
            icon={ReceiptText}
            accent="#f59e0b"
            trend="Action"
            trendUp={false}
            loading={loading}
            delay={0.15}
          />
          <KpiCard
            label="Active Subs"
            value={fmt(activeSubs)}
            sub="Paid subscriptions"
            icon={BadgeCheck}
            accent="#8b5cf6"
            trend="Stable"
            trendUp
            loading={loading}
            delay={0.2}
          />
          <KpiCard
            label="Pending Requests"
            value={fmt(pendingRequests)}
            sub="School reg. queue"
            icon={Clock}
            accent="#06b6d4"
            loading={loading}
            delay={0.25}
          />
        </div>
      </div>

      {/* ── People KPIs ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel emoji="👥" text="People on Platform" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Students"
            value={fmt(totalStudents)}
            sub="Across all schools"
            icon={GraduationCap}
            accent="#6366f1"
            trend="+8%"
            trendUp
            loading={loading}
            delay={0.05}
          />
          <KpiCard
            label="Total Teachers"
            value={fmt(totalTeachers)}
            sub="All educators"
            icon={UserCheck}
            accent="#0ea5e9"
            trend="+5%"
            trendUp
            loading={loading}
            delay={0.1}
          />
          <KpiCard
            label="Total Platform Users"
            value={fmt(totalStudents + totalTeachers)}
            sub="Combined headcount"
            icon={Users}
            accent="#a855f7"
            loading={loading}
            delay={0.15}
          />
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Growth + Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 rounded-[26px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Growth & Revenue Timeline
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Monthly school registrations & collected revenue
              </p>
            </div>
          </div>
          {growthChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={growthChart}>
                <defs>
                  <linearGradient id="gSchool" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CT.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: CT.tick, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CT.tick, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={CT.tooltip as any}
                  cursor={{ stroke: "rgba(255,255,255,0.05)" }}
                />
                <Area
                  type="monotone"
                  dataKey="schools"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#gSchool)"
                  dot={{
                    r: 4,
                    fill: "#8b5cf6",
                    stroke: "#0f172a",
                    strokeWidth: 2,
                  }}
                  name="Schools"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gRevenue)"
                  dot={false}
                  name="Revenue (PKR)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-600 text-sm font-medium">
              {loading
                ? "Loading chart…"
                : "No growth data yet — register schools to see trends"}
            </div>
          )}
        </motion.div>

        {/* Plan Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-[26px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BadgeCheck size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Plan Distribution
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Subscriptions by tier
              </p>
            </div>
          </div>
          {planDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={planDist}
                    dataKey="count"
                    nameKey="plan"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {planDist.map((entry: any, i: number) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[entry.plan] ?? "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CT.tooltip as any} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {planDist.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: PIE_COLORS[p.plan] ?? "#6366f1" }}
                      />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                        {p.plan.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-white">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-600 text-sm">
              {loading ? "Loading…" : "No subscription data yet"}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Expiring Soon + Pending Payments ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expiring Schools */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-[26px] border border-amber-500/15 bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <CalendarClock size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Expiring Soon
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Schools expiring within 30 days
              </p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : expiringList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <CheckCircle size={28} className="text-emerald-500" />
              <p className="text-sm text-slate-500">
                No schools expiring soon 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expiringList.slice(0, 6).map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5
                    hover:bg-amber-500/5 hover:border-amber-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20
                      flex items-center justify-center text-amber-400 font-black text-xs"
                    >
                      {s.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[180px]">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {s.expiryDate
                          ? new Date(s.expiryDate).toLocaleDateString("en-PK")
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight
                    ${
                      s.daysLeft <= 7
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {s.daysLeft}d left
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Payments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-[26px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ReceiptText size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Pending Payments
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Fee payments awaiting collection
              </p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <CheckCircle size={28} className="text-emerald-500" />
              <p className="text-sm text-slate-500">No pending payments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.slice(0, 6).map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5
                    hover:bg-blue-500/5 hover:border-blue-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <DollarSign size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[160px]">
                        {p.schoolName || "Unknown"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString("en-PK")
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">
                      {fmtMoney(p.amount)}
                    </p>
                    <span
                      className="text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20
                      px-1.5 py-0.5 rounded-md uppercase"
                    >
                      Pending
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── School Status Bars + Activity Feed ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status Progress Bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-[26px] border border-white/[0.06] bg-slate-900/40 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity size={16} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                School Status
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Active vs inactive breakdown
              </p>
            </div>
          </div>
          <div className="space-y-5">
            {[
              { label: "Active", value: activeSchools, color: "#10b981" },
              { label: "Inactive", value: inactiveSchools, color: "#ef4444" },
              { label: "Trial", value: trialSchools, color: "#f59e0b" },
              { label: "Expired", value: expiredSchools, color: "#f97316" },
            ].map((item) => {
              const pct =
                totalSchools > 0
                  ? Math.round((item.value / totalSchools) * 100)
                  : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-black text-white">
                      {item.value}{" "}
                      <span className="text-slate-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary mini-cards */}
          <div className="mt-6 pt-5 border-t border-white/[0.04] grid grid-cols-2 gap-3">
            {[
              {
                label: "Total Schools",
                val: totalSchools,
                color: "text-violet-400",
              },
              {
                label: "Paid Subs",
                val: activeSubs,
                color: "text-emerald-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/[0.02] rounded-xl p-3 border border-white/5"
              >
                <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="xl:col-span-2 rounded-[26px] border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Activity size={16} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Recent Activity
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Live platform audit trail
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
          </div>

          <div className="divide-y divide-white/[0.03]">
            <AnimatePresence>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
                      <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                  No recent activity yet
                </div>
              ) : (
                activities.slice(0, 6).map((item: any, i: number) => (
                  <motion.div
                    key={item.id ?? i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 + i * 0.05 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div
                      className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20
                      flex items-center justify-center shrink-0
                      group-hover:scale-105 group-hover:rotate-2 transition-all duration-300"
                    >
                      <Activity size={16} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                        {item.action}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.detail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-600">
                        {item.time
                          ? new Date(item.time).toLocaleTimeString("en-PK", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                      <p className="text-[9px] text-violet-600 font-bold mt-0.5">
                        {item.user ?? "System"}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
