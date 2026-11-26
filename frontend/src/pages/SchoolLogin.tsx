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
      accent: "from-cyan-500 to-blue-600",
      cta: "Open School Admin Login",
      cardBorder: "hover:border-cyan-400 hover:shadow-cyan-500/10",
      btnText: "text-cyan-700",
      btnBg: "bg-cyan-50",
      icon: School,
    },
    TEACHER: {
      badge: "Teacher Faculty Gateway",
      title: "Teacher Faculty Portal",
      subtitle: "Select your school campus to access classes, marks & attendance.",
      accent: "from-emerald-500 to-teal-600",
      cta: "Open Teacher Portal",
      cardBorder: "hover:border-emerald-400 hover:shadow-emerald-500/10",
      btnText: "text-emerald-700",
      btnBg: "bg-emerald-50",
      icon: Users,
    },
    STUDENT: {
      badge: "Student LMS Gateway",
      title: "Student LMS Portal",
      subtitle: "Select your school campus to view grades, homework, timetable & fees.",
      accent: "from-indigo-500 via-purple-600 to-violet-600",
      cta: "Open Student LMS",
      cardBorder: "hover:border-indigo-400 hover:shadow-indigo-500/10",
      btnText: "text-indigo-700",
      btnBg: "bg-indigo-50",
      icon: GraduationCap,
    },
  }[portalRole];

  const RoleIcon = roleMeta.icon;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 selection:bg-cyan-500/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.04)_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm backdrop-blur-xl transition hover:border-cyan-400/40 hover:shadow-md">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-white shadow-md shadow-cyan-500/25">S</span>
          <span className="text-sm font-black text-slate-900">SchoolOS <span className="text-cyan-600">Cloud</span></span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${roleMeta.accent} shadow-2xl`}>
            <RoleIcon size={30} className="text-white" />
          </div>

          {/* Interactive Role Switcher Pills */}
          <div className="mx-auto mb-6 inline-flex max-w-md items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => selectRole("SCHOOL_ADMIN")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "SCHOOL_ADMIN"
                  ? "bg-white text-cyan-700 border border-cyan-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <School size={14} /> School Admin
            </button>
            <button
              type="button"
              onClick={() => selectRole("TEACHER")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "TEACHER"
                  ? "bg-white text-emerald-700 border border-emerald-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Users size={14} /> Teacher Portal
            </button>
            <button
              type="button"
              onClick={() => selectRole("STUDENT")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                portalRole === "STUDENT"
                  ? "bg-white text-indigo-700 border border-indigo-200 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <GraduationCap size={14} /> Student LMS
            </button>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{roleMeta.title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            {roleMeta.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <Search size={19} className="shrink-0 text-cyan-600" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your school name, campus, or city..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-8">
          {loading && <div className="py-16 text-center text-sm text-slate-500">Loading schools...</div>}
          {!loading && error && <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>}
          {!loading && !error && filteredSchools.length === 0 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <School size={34} className="mx-auto text-slate-400" />
              <p className="mt-4 font-bold text-slate-800">No schools found</p>
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
                className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${roleMeta.cardBorder}`}
              >
                <div className="relative flex items-center gap-4">
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={school.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600">
                      <School size={26} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-black text-slate-900">{school.name}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={13} /> {school.city || "Location unavailable"}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Globe2 size={13} /> {school.country || "Pakistan"}
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className={`text-xs font-black ${roleMeta.btnText}`}>{roleMeta.cta}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${roleMeta.btnBg} ${roleMeta.btnText} transition group-hover:translate-x-1`}>
                    <ArrowRight size={16} />
                  </span>
                </div>
                {(!school.isActive || school.status === "PENDING_APPROVAL") && (
                  <p className="mt-2 text-[11px] leading-4 text-amber-600 font-medium">
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
