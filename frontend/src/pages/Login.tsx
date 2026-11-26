import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, GraduationCap, LockKeyhole, Loader2,
  Mail, ShieldCheck, AlertTriangle, Users, School, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

type PortalRole = "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";

function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+)@student\.edu\.pk$/i);
  return match ? match[1].trim() : trimmed;
}

export default function LoginPage() {
  const { schoolSlug: urlSchoolSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoleParam = searchParams.get("role")?.toUpperCase();

  const [activeRole, setActiveRole] = useState<PortalRole>(() => {
    if (initialRoleParam === "TEACHER") return "TEACHER";
    if (initialRoleParam === "STUDENT") return "STUDENT";
    return "SCHOOL_ADMIN";
  });

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schoolStatus, setSchoolStatus] = useState<any>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const schoolName = schoolStatus?.name || (urlSchoolSlug ? urlSchoolSlug.replace(/-/g, " ") : "your school");

  useEffect(() => {
    const roleParam = searchParams.get("role")?.toUpperCase();
    if (roleParam === "TEACHER") setActiveRole("TEACHER");
    else if (roleParam === "STUDENT") setActiveRole("STUDENT");
    else if (roleParam === "SCHOOL_ADMIN" || roleParam === "ADMIN") setActiveRole("SCHOOL_ADMIN");
  }, [searchParams]);

  useEffect(() => {
    if (urlSchoolSlug) {
      apiClient
        .get(`/public/tenant/slug/${encodeURIComponent(urlSchoolSlug)}`)
        .then((res) => {
          setSchoolStatus(res.data);
          if (res.data && res.data.isActive === false) {
            toast.warning(`Note: ${res.data.name} is currently offline.`, {
              action: {
                label: "View Notice",
                onClick: () => navigate(`/${urlSchoolSlug}/offline`),
              },
            });
          }
        })
        .catch(() => {});
    }
  }, [urlSchoolSlug, navigate]);

  const handleRoleChange = (role: PortalRole) => {
    setActiveRole(role);
    setSearchParams({ role: role.toLowerCase() }, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    try {
      const loginIdentifier = normalizeLoginIdentifier(identifier);
      const res = await apiClient.post("/auth/login", {
        email: loginIdentifier,
        password,
        schoolSlug: urlSchoolSlug,
        portalRole: activeRole,
      });

      const { user, accessToken, refreshToken } = res.data;

      // Strict role check on frontend
      if (activeRole === "TEACHER" && user.role !== "TEACHER") {
        toast.error("Access Denied: This portal is strictly for Teachers. Please select School Admin or Student LMS tab above.");
        return;
      }
      if (activeRole === "STUDENT" && user.role !== "STUDENT") {
        toast.error("Access Denied: This portal is strictly for Students. Please select the correct tab above.");
        return;
      }
      if (activeRole === "SCHOOL_ADMIN" && !["SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        toast.error("Access Denied: This portal is strictly for School Administrators.");
        return;
      }

      login(accessToken, user, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      const slug = user.schoolSlug || urlSchoolSlug || "school";

      if (user.role === "STUDENT") {
        navigate(`/${slug}/student-portal`, { replace: true });
      } else if (user.role === "TEACHER") {
        navigate(`/${slug}/teacher/classes`, { replace: true });
      } else if (user.activationStatus === "ACTIVE") {
        navigate(`/${slug}/dashboard`, { replace: true });
      } else {
        toast.info("Your school portal is locked until approval. You can continue from onboarding.");
        navigate("/onboarding", { replace: true });
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.isSchoolOffline) {
        const slug = data.school?.slug || urlSchoolSlug || "school";
        toast.error(data.message || "This school is currently offline or suspended.");
        navigate(`/${slug}/offline`, { replace: true });
        return;
      }
      toast.error(err.response?.data?.message || "Invalid Login ID or password. Please verify your credentials and selected portal role.");
    } finally {
      setLoading(false);
    }
  };

  const roleConfigs = {
    SCHOOL_ADMIN: {
      badge: "School Admin",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      accentGradient: "from-cyan-500 to-blue-600",
      btnGradient: "from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700",
      btnShadow: "shadow-cyan-500/25",
      icon: School,
      title: "School Admin Portal",
      subtitle: "Institutional administration, staff and academic governance",
      placeholder: "Admin email (e.g. admin@school.edu)",
      helpText: "School Admins: Use your registered administrator email address and secure password.",
      btnText: "Sign In as School Admin",
    },
    TEACHER: {
      badge: "Teacher Faculty",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentGradient: "from-emerald-500 to-teal-600",
      btnGradient: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
      btnShadow: "shadow-emerald-500/25",
      icon: Users,
      title: "Teacher Faculty Portal",
      subtitle: "Classes, student records, marks entry, homework & attendance",
      placeholder: "Teacher Login ID (e.g. ali001), Employee No (e.g. EMP-2026-001) or Gmail",
      helpText: "Teachers: Use your assigned Login ID (e.g. ali001), Employee Code, or personal Gmail.",
      btnText: "Sign In to Teacher Portal",
    },
    STUDENT: {
      badge: "Student LMS",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      accentGradient: "from-indigo-500 via-purple-600 to-violet-600",
      btnGradient: "from-indigo-500 via-purple-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700",
      btnShadow: "shadow-indigo-500/25",
      icon: GraduationCap,
      title: "Student LMS Portal",
      subtitle: "View exam results, daily homework, attendance, fees & timetable",
      placeholder: "Admission ID (e.g. ADM-2026-0001), B-Form No, or Login ID",
      helpText: "Students: Use your Admission No (e.g. ADM-2026-0001), B-Form or student login ID.",
      btnText: "Sign In to Student LMS",
    },
  };

  const currentConfig = roleConfigs[activeRole];
  const ConfigIcon = currentConfig.icon;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 selection:bg-cyan-500/20">
      {/* Background ambient decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute -right-40 bottom-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-2 shadow-sm backdrop-blur-xl transition hover:border-cyan-400/40 hover:bg-white hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-white shadow-md shadow-cyan-500/25">
            S
          </span>
          <span className="text-sm font-black text-slate-900">
            SchoolOS <span className="text-cyan-600">Cloud</span>
          </span>
        </Link>
        <Link
          to={`/school-login?role=${activeRole.toLowerCase()}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={15} /> Back to Schools
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-86px)] w-full max-w-6xl items-center justify-center px-4 pb-12 pt-2 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-xl"
        >
          {/* School Header Badge / Identity */}
          <div className="mb-6 text-center">
            {urlSchoolSlug && (
              <div className="mb-4 flex flex-col items-center justify-center gap-2.5">
                {schoolStatus?.logoUrl ? (
                  <img
                    src={schoolStatus.logoUrl}
                    alt={schoolName + " logo"}
                    className="h-20 w-20 rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-lg shadow-slate-200/60"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-cyan-50 text-cyan-600 shadow-md">
                    <School size={36} />
                  </div>
                )}
                <div className="max-w-full">
                  <p className="text-xl font-black capitalize tracking-tight text-slate-900 sm:text-2xl">
                    {schoolName}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[.22em] text-slate-400">
                    School Portal
                  </p>
                </div>
              </div>
            )}

            <div
              className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${currentConfig.accentGradient} text-2xl font-black text-white shadow-xl ${currentConfig.btnShadow}`}
            >
              <ConfigIcon size={26} className="text-white" />
            </div>

            <div
              className={`mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[11px] font-black uppercase tracking-[.18em] ${currentConfig.badgeColor}`}
            >
              <ShieldCheck size={13} /> {currentConfig.badge}
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {currentConfig.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {urlSchoolSlug
                ? "Secure sign in to your school workspace"
                : "Sign in to your SchoolOS workspace"}
            </p>
          </div>

          {/* School Offline Alert */}
          {schoolStatus && schoolStatus.isActive === false && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 shadow-sm">
              <div className="flex min-w-0 items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                <span className="truncate font-semibold">This school is currently offline by admin.</span>
              </div>
              <Link
                to={`/${urlSchoolSlug}/offline`}
                className="shrink-0 font-bold underline hover:text-amber-950"
              >
                View Notice
              </Link>
            </div>
          )}

          {/* 3-Way Portal Selector Tabs */}
          <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => handleRoleChange("SCHOOL_ADMIN")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                activeRole === "SCHOOL_ADMIN"
                  ? "bg-white text-cyan-700 border border-cyan-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <School size={14} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("TEACHER")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                activeRole === "TEACHER"
                  ? "bg-white text-emerald-700 border border-emerald-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Users size={14} />
              <span>Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("STUDENT")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                activeRole === "STUDENT"
                  ? "bg-white text-indigo-700 border border-indigo-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <GraduationCap size={14} />
              <span>Student LMS</span>
            </button>
          </div>

          {/* Main Login Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            {/* Role Header Banner */}
            <div className={`bg-gradient-to-r ${currentConfig.accentGradient} px-6 py-4 text-white`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner">
                  <ConfigIcon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{currentConfig.title}</p>
                  <p className="text-[11px] text-white/80">{currentConfig.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[.14em] text-slate-700">
                  {activeRole === "TEACHER"
                    ? "Teacher Login ID / Employee No / Gmail"
                    : activeRole === "STUDENT"
                    ? "Student Admission No / B-Form / Login ID"
                    : "School Admin Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    placeholder={currentConfig.placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>
                <p className="text-[11px] leading-5 text-slate-500">{currentConfig.helpText}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[.14em] text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${currentConfig.btnGradient} py-3.5 text-sm font-black text-white shadow-lg ${currentConfig.btnShadow} transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? "Verifying Credentials..." : currentConfig.btnText}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            SchoolOS Cloud · Strict Role-Based Portal Security &amp; Multi-Tenant Access
          </p>
        </motion.div>
      </main>
    </div>
  );
}
