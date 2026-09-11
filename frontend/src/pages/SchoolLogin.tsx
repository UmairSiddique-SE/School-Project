import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, MapPin, Search, School, X } from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolItem {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  subscription?: { plan?: string; status?: string; endDate?: string } | null;
}

export default function SchoolLogin() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient
      .get("/public/schools")
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.schools || [];
        setSchools(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setSchools([]);
        setError(err.response?.data?.message || "Unable to load registered schools. Please try again.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(q) ||
        school.slug.toLowerCase().includes(q) ||
        (school.city || "").toLowerCase().includes(q),
    );
  }, [schools, search]);

  const openLogin = (slug: string) => navigate(`/${slug}/login`);

  return (
    <div className="min-h-screen bg-[#030817] text-white relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black shadow-lg">E</div>
          <div>
            <p className="font-black text-lg">EduSphere <span className="text-cyan-300">ERP</span></p>
            <p className="text-[9px] tracking-[0.2em] text-slate-500 font-bold">SCHOOL PORTAL</p>
          </div>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            <Building2 size={13} /> Secure school access
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight">Find your school</h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base leading-7 text-slate-400">
            Select your registered school. You will then sign in with the credentials created during school registration.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-[#09111f]/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search registered school by name, city, or school code..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-4 pl-12 pr-12 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {loading ? "Checking registered schools..." : `${filteredSchools.length} active school${filteredSchools.length === 1 ? "" : "s"} available`}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active schools only</span>
          </div>

          {error && !loading && (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {!loading && filteredSchools.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {filteredSchools.map((school) => (
                <button
                  key={school.id || school.slug}
                  type="button"
                  onClick={() => openLogin(school.slug)}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                    {school.logoUrl ? (
                      <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <School size={21} className="text-cyan-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate group-hover:text-cyan-300">{school.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-cyan-400/80 truncate">{school.slug}</span>
                      {school.city && <span className="flex items-center gap-1 shrink-0"><MapPin size={11} />{school.city}</span>}
                    </div>
                  </div>
                  <ArrowRight size={17} className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                </button>
              ))}
            </div>
          )}

          {!loading && filteredSchools.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <School size={35} className="mx-auto text-slate-600" />
              <p className="mt-3 font-semibold text-slate-300">{schools.length ? "No school matches your search." : "No active school is available yet."}</p>
              <p className="mt-1 text-xs text-slate-500">A school appears here only after its registration has been approved and activated.</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          School Admin and Teachers sign in with their registered email. Students use their school-issued Login ID. The role is detected automatically.
        </p>
      </main>
    </div>
  );
}
