import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe2, MapPin, Search, School, ShieldCheck } from "lucide-react";
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

const getLoginPath = (slug: string) => `/school-login/${encodeURIComponent(String(slug || "").trim().replace(/^\/+|\/+$/g, "").split("/")[0])}`;

export default function SchoolLogin() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiClient.get(`/public/schools?_=${Date.now()}`).then((response) => {
      if (!mounted) return;
      const data = response?.data;
      setSchools(Array.isArray(data) ? data : Array.isArray(data?.schools) ? data.schools : []);
    }).catch(() => mounted && setError("Unable to load schools right now.")).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredSchools = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return schools;
    return schools.filter((school) => [school.name, school.slug, school.city, school.country].some((field) => String(field || "").toLowerCase().includes(value)));
  }, [schools, query]);

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

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/20">
            <School size={30} />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">
            <ShieldCheck size={13} /> Secure school portal
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Choose your school</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">Find your school and continue to its secure EduSphere login.</p>
        </div>

        <div className="mx-auto mt-9 max-w-2xl rounded-2xl border border-white/10 bg-white/[.05] p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-xl bg-white/[.03] px-4 py-3">
            <Search size={19} className="shrink-0 text-cyan-300" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by school name, city or country..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>

        <div className="mt-10">
          {loading && <div className="py-16 text-center text-sm text-slate-400">Loading schools...</div>}
          {!loading && error && <div className="mx-auto max-w-xl rounded-2xl border border-red-400/15 bg-red-400/5 p-8 text-center text-sm text-red-300">{error}</div>}
          {!loading && !error && filteredSchools.length === 0 && <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-12 text-center"><School size={34} className="mx-auto text-slate-500" /><p className="mt-4 font-bold text-slate-300">No schools found</p><p className="mt-1 text-sm text-slate-500">Try another school name or location.</p></div>}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <Link key={school.id || school.slug} to={school.slug ? getLoginPath(school.slug) : "#"} onClick={(event) => { if (!school.slug) event.preventDefault(); }} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-white/[.065] hover:shadow-cyan-950/30">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/5 blur-2xl transition group-hover:bg-cyan-400/10" />
                <div className="relative flex items-center gap-4">
                  {school.logoUrl ? <img src={school.logoUrl} alt={school.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300"><School size={26} /></div>}
                  <div className="min-w-0"><h2 className="truncate font-black text-white">{school.name}</h2><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} /> {school.city || "Location unavailable"}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Globe2 size={13} /> {school.country || "Pakistan"}</div></div>
                </div>
                <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-xs font-black text-cyan-300">Continue to school login</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:translate-x-1"><ArrowRight size={16} /></span></div>
                {(!school.isActive || school.status === "PENDING_APPROVAL") && <p className="mt-2 text-[11px] leading-4 text-amber-300">Login may remain available, but portal modules unlock after approval.</p>}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
