import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  CreditCard,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  School,
  Lock,
  ArrowLeft,
  Clock,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolOfflineData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  adminContact?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  offlineNotice?: {
    id?: string;
    type: "MAINTENANCE" | "PAYMENT" | "SUSPENSION" | "VACATION" | "EMERGENCY" | "CUSTOM" | string;
    title: string;
    message: string;
    actionType?: string | null;
    actionUrl?: string | null;
    priority?: string;
    expiresAt?: string | null;
    createdAt?: string;
  } | null;
}

const THEME_CONFIGS: Record<
  string,
  {
    badge: string;
    badgeIcon: React.ElementType;
    badgeBg: string;
    bgGradient: string;
    glowColor: string;
    borderGlow: string;
    iconBg: string;
    iconColor: string;
    MainIcon: React.ElementType;
    actionButtonText: string;
    accentColor: string;
  }
> = {
  MAINTENANCE: {
    badge: "Scheduled Maintenance",
    badgeIcon: Wrench,
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bgGradient: "from-amber-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-amber-500/10",
    borderGlow: "border-amber-500/25",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-amber-400",
    MainIcon: Wrench,
    actionButtonText: "Check Server Status",
    accentColor: "from-amber-400 to-amber-600",
  },
  PAYMENT: {
    badge: "Subscription / Payment Required",
    badgeIcon: CreditCard,
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    bgGradient: "from-rose-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-rose-500/10",
    borderGlow: "border-rose-500/25",
    iconBg: "bg-rose-500/15 border-rose-500/30",
    iconColor: "text-rose-400",
    MainIcon: CreditCard,
    actionButtonText: "Renew / Pay Subscription",
    accentColor: "from-rose-500 to-red-600",
  },
  SUSPENSION: {
    badge: "Institutional Account Suspended",
    badgeIcon: ShieldAlert,
    badgeBg: "bg-red-500/15 text-red-300 border-red-500/30",
    bgGradient: "from-red-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-red-500/10",
    borderGlow: "border-red-500/25",
    iconBg: "bg-red-500/15 border-red-500/30",
    iconColor: "text-red-400",
    MainIcon: ShieldAlert,
    actionButtonText: "Contact Platform Compliance",
    accentColor: "from-red-500 to-rose-700",
  },
  VACATION: {
    badge: "Academic Break / Closed",
    badgeIcon: Calendar,
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bgGradient: "from-emerald-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-emerald-500/10",
    borderGlow: "border-emerald-500/25",
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-400",
    MainIcon: Calendar,
    actionButtonText: "View Academic Calendar",
    accentColor: "from-emerald-400 to-teal-600",
  },
  EMERGENCY: {
    badge: "Emergency / Weather Closure",
    badgeIcon: AlertTriangle,
    badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    bgGradient: "from-violet-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-violet-500/10",
    borderGlow: "border-violet-500/25",
    iconBg: "bg-violet-500/15 border-violet-500/30",
    iconColor: "text-violet-400",
    MainIcon: AlertTriangle,
    actionButtonText: "Emergency Helpline",
    accentColor: "from-violet-500 to-purple-600",
  },
  CUSTOM: {
    badge: "Important School Notice",
    badgeIcon: Sparkles,
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    bgGradient: "from-cyan-950/40 via-slate-950 to-slate-950",
    glowColor: "bg-cyan-500/10",
    borderGlow: "border-cyan-500/25",
    iconBg: "bg-cyan-500/15 border-cyan-500/30",
    iconColor: "text-cyan-400",
    MainIcon: Sparkles,
    actionButtonText: "Contact Administration",
    accentColor: "from-cyan-400 to-blue-600",
  },
};

export default function SchoolOfflinePage() {
  const { schoolSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolOfflineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolStatus = async (isRefresh = false) => {
    if (!schoolSlug) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get(`/public/tenant/slug/${encodeURIComponent(schoolSlug)}`);
      const data: SchoolOfflineData = res.data;
      setSchoolData(data);

      // If school is active, auto-redirect back to dashboard/login
      if (data.isActive && isRefresh) {
        navigate(`/${schoolSlug}/login`, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to fetch school notice at this moment.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchoolStatus();
  }, [schoolSlug]);

  const notice = schoolData?.offlineNotice;
  const noticeType = (notice?.type || searchParams.get("type") || "MAINTENANCE").toUpperCase();
  const theme = THEME_CONFIGS[noticeType] || THEME_CONFIGS.MAINTENANCE;
  const BadgeIcon = theme.badgeIcon;
  const MainIcon = theme.MainIcon;

  const adminInfo = schoolData?.adminContact || {
    name: "School Administration / Principal Office",
    email: schoolData?.email || "admin@school.pk",
    phone: schoolData?.phone || "+92 300 1234567",
    address: schoolData?.address || (schoolData?.city ? `${schoolData.city}, Pakistan` : "Campus Address"),
  };

  const whatsappNumber = adminInfo.phone ? adminInfo.phone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${schoolData?.name || 'School'}, I am contacting regarding the portal notice: ${notice?.title || 'School Portal Status'}`)}` : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-400/20 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full blur-[140px] opacity-40 ${theme.glowColor}`} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-3.5 py-2 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[.07]"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${theme.accentColor} font-black text-white shadow-lg`}>
            E
          </span>
          <span className="hidden text-sm font-black sm:block">
            EduSphere <span className="opacity-70">ERP</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSchoolStatus(true)}
            disabled={refreshing}
            title="Check if school is back online"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-slate-300 backdrop-blur-xl transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-400" : ""} />
            <span className="hidden sm:inline">Refresh Status</span>
          </button>

          <Link
            to="/school-login"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-slate-300 backdrop-blur-xl transition hover:border-white/20 hover:text-white"
          >
            <ArrowLeft size={14} />
            <span>All Schools</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex flex-1 w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full space-y-6"
        >
          {/* Main Card */}
          <div className={`overflow-hidden rounded-3xl border ${theme.borderGlow} bg-slate-900/90 shadow-2xl backdrop-blur-2xl`}>
            {/* Top Banner with Notice Badge */}
            <div className={`border-b border-white/10 bg-gradient-to-r ${theme.bgGradient} px-6 py-5 sm:px-8`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {schoolData?.logoUrl ? (
                    <img
                      src={schoolData.logoUrl}
                      alt={schoolData.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/10 shadow-lg"
                    />
                  ) : (
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${theme.iconBg} ${theme.iconColor} shadow-lg`}>
                      <School size={28} />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {schoolData?.name || schoolSlug?.replace(/-/g, " ") || "School Portal"}
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {adminInfo.address || "Pakistan"}
                    </p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 self-start sm:self-center rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wider ${theme.badgeBg}`}>
                  <BadgeIcon size={14} className="animate-pulse" />
                  <span>{theme.badge}</span>
                </div>
              </div>
            </div>

            {/* Notice Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Notice Title & Message */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl border ${theme.iconBg} ${theme.iconColor} shrink-0 mt-0.5`}>
                    <MainIcon size={24} />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {notice?.title || "School Portal Temporarily Offline"}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                      {notice?.message || "This school portal is currently offline. Please check back later or contact the administration."}
                    </p>

                    {notice?.expiresAt && (
                      <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-amber-300">
                        <Clock size={13} />
                        <span>Expected Resumption: <strong>{new Date(notice.expiresAt).toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* School Admin & Contact Information (Rabta Karne Ke Liye) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300 flex items-center gap-2">
                    <HelpCircle size={15} /> School Admin Contact & Support (رابطہ کریں)
                  </h3>
                  <span className="text-[11px] text-slate-500">Official Campus Helpdesk</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Admin Name & Office */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <School size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin / Principal</p>
                      <p className="text-xs font-bold text-white truncate">{adminInfo.name}</p>
                    </div>
                  </div>

                  {/* Phone / Call */}
                  <a
                    href={adminInfo.phone ? `tel:${adminInfo.phone}` : "#"}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Phone size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Helpline</p>
                      <p className="text-xs font-bold text-emerald-300 truncate">{adminInfo.phone || "Not Provided"}</p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={adminInfo.email ? `mailto:${adminInfo.email}?subject=${encodeURIComponent(`Query regarding ${schoolData?.name || 'School'} Portal Notice`)}` : "#"}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 hover:border-blue-500/30 hover:bg-blue-500/[0.04] transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</p>
                      <p className="text-xs font-bold text-blue-300 truncate">{adminInfo.email || "admin@school.pk"}</p>
                    </div>
                  </a>
                </div>

                {/* WhatsApp Quick Link if phone is present */}
                {whatsappUrl && (
                  <div className="flex justify-end pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl transition"
                    >
                      <MessageSquare size={14} />
                      <span>Chat on WhatsApp with School Admin</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div className="text-xs text-slate-500">
                  Are you the School Administrator? Sign in below to resolve pending actions.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    to={`/${schoolSlug}/login`}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition shadow-sm"
                  >
                    <Lock size={14} />
                    <span>School Admin Sign In</span>
                  </Link>

                  {noticeType === "PAYMENT" && (
                    <Link
                      to={`/${schoolSlug}/subscription`}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-xs font-black text-white transition shadow-lg shadow-rose-950/40"
                    >
                      <CreditCard size={14} />
                      <span>Renew Subscription</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Support Footer */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              EduSphere Platform Support Desk: <strong className="text-slate-300">support@edusphere.pk</strong>
            </span>
            <div className="flex items-center gap-3">
              <Link to="/school-login" className="text-cyan-400 hover:underline">
                Find another school
              </Link>
              <span>•</span>
              <Link to="/" className="text-cyan-400 hover:underline">
                EduSphere Home
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
