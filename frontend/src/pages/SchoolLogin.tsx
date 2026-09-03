import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Search, School, MapPin, X, Loader2 } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

interface SchoolItem {
  id: string;
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
    apiClient.get("/schools?limit=50")
      .then(res => {
        const list = res.data?.data || res.data?.schools || res.data;
        if (!active) return;
        setSchools(Array.isArray(list) ? list.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug || item.id,
          city: item.city || item.district,
          country: item.country,
        })).filter((s: SchoolItem) => s.id && s.name && s.slug) : []);
      })
      .catch(err => {
        if (active) {
          setSchools([]);
          toast.error(err?.response?.data?.message || "Unable to load schools.");
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filteredSchools = useMemo(() => schools.filter(s => {
    const q = search.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || (s.city || "").toLowerCase().includes(q);
  }), [schools, search]);

  return (
    <div className="min-h-screen bg-[#030817] text-white flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl">EduSphere <span className="text-violet-400">ERP</span></Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16}/> Home</Link>
      </header>
      <main className="max-w-5xl mx-auto w-full px-4 py-12 flex-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider mb-4"><School size={14}/> School Login</div>
          <h1 className="text-4xl sm:text-5xl font-black">Select Your <span className="text-violet-400">School</span></h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">Search for your registered school and continue to its secure login.</p>
        </motion.div>
        <div className="bg-[#090e24] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-violet-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school name, city or campus code" className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-400" />
            {search && <button onClick={() => setSearch("")} className="absolute right-4 top-3.5 text-white/40 hover:text-white"><X size={18}/></button>}
          </div>
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-violet-400"/></div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <School className="mx-auto mb-3 opacity-50" size={36}/>
              <p className="font-semibold text-white">No registered school found</p>
              <p className="text-sm mt-1">Check the school name or campus code and try again.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map(s => (
                <button key={s.id} onClick={() => navigate(`/${s.slug}/login`)} className="text-left p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-300 font-bold">{s.name.charAt(0)}</div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-violet-300"/>
                  </div>
                  <h2 className="font-bold mt-4 truncate">{s.name}</h2>
                  {s.city && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={12}/>{s.city}{s.country ? `, ${s.country}` : ""}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
