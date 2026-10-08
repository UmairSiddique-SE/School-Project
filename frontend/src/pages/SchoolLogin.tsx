import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe2, MapPin, Search, School, ShieldCheck, Users, GraduationCap } from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolItem {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  loginAvailable: boolean;
  status: "ACTIVE" | "PENDING_APPROVAL" | string;
  subscription?: { plan?: string; status?: string; endDate?: string } | null;
}

type PortalRole = "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";

const getLoginPath = (slug: string, role?: string) =>
  `/school-login/${encodeURIComponent(String(slug || "").trim().replace(/^\/+|\/+$/g, "").split("/")[0])}${role ? `?role=${encodeURIComponent(role)}` : ""}`;

export default function SchoolLogin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawRole = searchParams.get("role")?.toUpperCase();
  const [portalRole, setPortalRole] = useState<PortalRole>(() => {
    if (rawRole === "TEACHER") return "TEACHER";
    if (rawRole === "STUDENT") return "STUDENT";
    return "SCHOOL_ADMIN";
  });

  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role")?.toUpperCase();
    if (roleParam === "TEACHER") setPortalRole("TEACHER");
    else if (roleParam === "STUDENT") setPortalRole("STUDENT");
    else if (roleParam === "SCHOOL_ADMIN" || roleParam === "ADMIN") setPortalRole("SCHOOL_ADMIN");
  }, [searchParams]);

  const selectRole = (role: PortalRole) => {
    setPortalRole(role);
    setSearchParams({ role: role.toLowerCase() }, { replace: true });
  };

  useEffect(() => {
    let mounted = true;
    apiClient
      .get(`/public/schools?_=${Date.now()}`)
      .then((response) => {
        if (!mounted) return;
        const data = response?.data;
        setSchools(Array.isArray(data) ? data : Array.isArray(data?.schools) ? data.schools : []);
      })
      .catch(() => mounted && setError("Unable to load schools right now."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filteredSchools = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return schools;
    return schools.filter((school) =>
      [school.name, school.slug, school.city, school.country].some((field) =>
        String(field || "").toLowerCase().includes(value)
      )
    );
  }, [schools, query]);

  const roleMeta = {
    SCHOOL_ADMIN: {
      badge: "School Admin Gateway",
      title: "School Admin Login",
      subtitle: "Select your school campus to sign in as School Administrator.",
      accent: "from-cyan-400 to-blue-600",
      cta: "Open School Admin Login",
      cardBorder: "hover:border-cyan-400/40",
      btnText: "text-cyan-300",
      btnBg: "bg-cyan-500/10",
      icon: School,
    },
    TEACHER: {
      badge: "Teacher Faculty Gateway",
      title: "Teacher Faculty Portal",
      subtitle: "Select your school campus to access classes, marks & attendance.",
      accent: "from-emerald-400 to-teal-600",
      cta: "Open Teacher Portal",
      cardBorder: "hover:border-emerald-400/40",
      btnText: "text-emerald-300",
      btnBg: "bg-emerald-500/10",
      icon: Users,
    },
    STUDENT: {
      badge: "Student LMS Gateway",
      title: "Student LMS Portal",
      subtitle: "Select your school campus to view grades, homework, timetable & fees.",
      accent: "from-indigo-400 via-purple-500 to-violet-600",
      cta: "Open Student LMS",
      cardBorder: "hover:border-indigo-400/40",
      btnText: "text-indigo-300",
      btnBg: "bg-indigo-500/10",
      icon: GraduationCap,
    },
  }[portalRole];

  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 backdrop-blur-xl transition hover:border-cyan-400/30 hover:bg-white/[.07]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black shadow-lg shadow-cyan-500/20">E</span>
          <span className="hidden text-sm font-black sm:block">EduSphere <span className="text-cyan-300">ERP</span></span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-white/20 hover:text-white">
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${roleMeta.accent} shadow-2xl`}>
            <RoleIcon size={30} className="text-white" />
          </div>

          {/* Interactive Role Switcher Pills */}
          <div className="mx-auto mb-6 inline-flex max-w-md items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => selectRole("SCHOOL_ADMIN")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "SCHOOL_ADMIN"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <School size={14} /> School Admin
            </button>
            <button
              type="button"
              onClick={() => selectRole("TEACHER")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "TEACHER"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users size={14} /> Teacher Portal
            </button>
            <button
              type="button"
              onClick={() => selectRole("STUDENT")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "STUDENT"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <GraduationCap size={14} /> Student LMS
            </button>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{roleMeta.title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            {roleMeta.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[.05] p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-xl bg-white/[.03] px-4 py-3">
            <Search size={19} className="shrink-0 text-cyan-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your school name, campus, or city..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-8">
          {loading && <div className="py-16 text-center text-sm text-slate-400">Loading schools...</div>}
          {!loading && error && <div className="mx-auto max-w-xl rounded-2xl border border-red-400/15 bg-red-400/5 p-8 text-center text-sm text-red-300">{error}</div>}
          {!loading && !error && filteredSchools.length === 0 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-12 text-center">
              <School size={34} className="mx-auto text-slate-500" />
              <p className="mt-4 font-bold text-slate-300">No schools found</p>
              <p className="mt-1 text-sm text-slate-500">Try searching with a different campus or city name.</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <Link
                key={school.id || school.slug}
                to={school.slug ? getLoginPath(school.slug, portalRole.toLowerCase()) : "#"}
                onClick={(event) => {
                  if (!school.slug) event.preventDefault();
                }}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${roleMeta.cardBorder} hover:bg-white/[.065]`}
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/5 blur-2xl transition group-hover:bg-cyan-400/10" />
                <div className="relative flex items-center gap-4">
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={school.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
                      <School size={26} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-black text-white">{school.name}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={13} /> {school.city || "Location unavailable"}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Globe2 size={13} /> {school.country || "Pakistan"}
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className={`text-xs font-black ${roleMeta.btnText}`}>{roleMeta.cta}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${roleMeta.btnBg} ${roleMeta.btnText} transition group-hover:translate-x-1`}>
                    <ArrowRight size={16} />
                  </span>
                </div>
                {(!school.isActive || school.status === "PENDING_APPROVAL") && (
                  <p className="mt-2 text-[11px] leading-4 text-amber-300">
                    Login may remain available, but portal modules unlock after approval.
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
