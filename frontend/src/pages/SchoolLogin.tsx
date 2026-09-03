import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Search, School, Sparkles, X } from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolItem {
  id?: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
}

export default function SchoolLogin() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .get("/schools?limit=30")
      .then((res) => {
        const list = res.data?.data || res.data?.schools || res.data;
        if (!active) return;
        setSchools(
          Array.isArray(list)
            ? list.map((item: any) => ({
                id: item.id,
                name: item.name,
                slug: item.slug || item.id,
                city: item.city || item.district || "",
                country: item.country || "",
              }))
            : [],
        );
      })
      .catch(() => {
        if (active) setSchools([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSchools = schools.filter((school) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      school.name.toLowerCase().includes(q) ||
      school.slug.toLowerCase().includes(q) ||
      school.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#030817] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-indigo-950/20 pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-xl">E</div>
          <span className="font-bold text-xl">EduSphere <span className="text-violet-400">ERP</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-12 flex-1">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" /> School Login
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Select Your School</h1>
          <p className="text-white/55 mt-3 max-w-xl mx-auto">Search an approved school and continue to its secure login page.</p>
        </motion.div>

        <div className="bg-[#080d22]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-lg font-bold mb-5">
            <School className="w-5 h-5 text-violet-400" /> Approved Schools
          </div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school name, campus code or city..."
              className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/35 focus:outline-none focus:border-violet-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-white/50">Loading approved schools...</div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl">
              <School className="w-10 h-10 mx-auto text-white/20 mb-3" />
              <p className="font-semibold text-white/70">No approved schools found.</p>
              <p className="text-xs text-white/40 mt-1">A school will appear here after Super Admin approval.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSchools.map((school) => (
                <button key={school.slug} onClick={() => navigate(`/${school.slug}/login`)} className="text-left group p-4 rounded-2xl bg-white/[0.03] hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/40 transition-all flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-bold truncate group-hover:text-violet-300">{school.name}</span>
                    <span className="text-[11px] text-white/40 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {school.city || school.country || ""}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-violet-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-white/35 py-6">EduSphere ERP — Multi-School Management System</footer>
    </div>
  );
}
