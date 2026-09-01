import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  School,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  GraduationCap,
  Building2,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Globe2,
  X,
} from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolItem {
  id?: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  studentsCount?: number | string;
  teachersCount?: number | string;
  plan?: string;
  isPopular?: boolean;
}

const DEFAULT_SCHOOLS: SchoolItem[] = [
  {
    name: "EduSphere Academy (Demo)",
    slug: "demo",
    city: "Lahore",
    country: "Pakistan",
    studentsCount: "1,250+",
    teachersCount: "85",
    plan: "PREMIUM",
    isPopular: true,
  },
  {
    name: "The Educators (Lahore Main)",
    slug: "the-educators",
    city: "Lahore",
    country: "Pakistan",
    studentsCount: "2,400+",
    teachersCount: "120",
    plan: "ENTERPRISE",
    isPopular: true,
  },
  {
    name: "Beaconhouse Grammar School",
    slug: "beacon-house",
    city: "Karachi",
    country: "Pakistan",
    studentsCount: "820+",
    teachersCount: "42",
    plan: "STANDARD",
    isPopular: true,
  },
  {
    name: "City School Campus",
    slug: "city-school",
    city: "Islamabad",
    country: "Pakistan",
    studentsCount: "650+",
    teachersCount: "38",
    plan: "STANDARD",
    isPopular: true,
  },
  {
    name: "Green Valley International",
    slug: "green-valley",
    city: "Rawalpindi",
    country: "Pakistan",
    studentsCount: "430+",
    teachersCount: "26",
    plan: "BASIC",
    isPopular: false,
  },
  {
    name: "Apex Model High School",
    slug: "apex-model",
    city: "Faisalabad",
    country: "Pakistan",
    studentsCount: "520+",
    teachersCount: "30",
    plan: "STANDARD",
    isPopular: false,
  },
  {
    name: "Roots Millennium Campus",
    slug: "roots-millennium",
    city: "Peshawar",
    country: "Pakistan",
    studentsCount: "780+",
    teachersCount: "48",
    plan: "PREMIUM",
    isPopular: false,
  },
];

export default function SchoolLogin() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>(DEFAULT_SCHOOLS);
  const [customSlug, setCustomSlug] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get("/schools?limit=30")
      .then((res) => {
        const list = res.data?.data || res.data?.schools || res.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug || item.id,
            city: item.city || "Pakistan",
            country: item.country || "Pakistan",
            studentsCount: item._count?.students || item.studentCount || "500+",
            teachersCount: item._count?.teachers || item.teacherCount || "35",
            plan: item.subscription?.plan || item.plan || "STANDARD",
            isPopular: item.slug === "demo",
          }));
          setSchools(mapped);
        }
      })
      .catch(() => {
        setSchools(DEFAULT_SCHOOLS);
      });
  }, []);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectSchool = (slug: string) => {
    navigate(`/${slug}/login`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlug.trim()) return;
    const clean = customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    navigate(`/${clean}/login`);
  };

  return (
    <div className="min-h-screen bg-[#030817] text-white flex flex-col justify-between relative overflow-hidden selection:bg-violet-500/30">
      {/* Background Animated Neon Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      {/* Grid background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            EduSphere <span className="text-violet-400">ERP</span>
          </span>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main VIP Search Container */}
      <main className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-extrabold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            VIP Multi-Campus System
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Select Your <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">School Campus</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            Search your institution below or use the <strong>Instant Demo</strong> to try all features.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
             <button
              onClick={() => handleSelectSchool("demo")}
              className="group relative w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all flex items-center justify-center gap-3 overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
              <Sparkles size={22} className="text-amber-300 animate-pulse" />
              <span>Login to Active Demo School</span>
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* VIP Search Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#090e24]/90 border border-white/15 rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.2)] overflow-hidden backdrop-blur-2xl"
        >
          {/* VIP Search Box Input */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-purple-950/40">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-violet-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type school name, city, or campus code..."
                autoFocus
                className="w-full pl-14 pr-12 py-4 rounded-2xl bg-white/[0.08] border border-violet-500/30 text-white placeholder-white/40 text-base md:text-lg font-medium focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 transition-all shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quick Pills */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-white/40 font-medium whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Fast Access:
              </span>
              <button
                onClick={() => handleSelectSchool("demo")}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold whitespace-nowrap shadow-md shadow-violet-600/30 transition-all flex items-center gap-1.5"
              >
                🚀 EduSphere Demo Campus
              </button>
              <button
                onClick={() => setSearch("Beaconhouse")}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
              >
                Beaconhouse
              </button>
              <button
                onClick={() => setSearch("City School")}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
              >
                City School
              </button>
              <button
                onClick={() => setSearch("Lahore")}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
              >
                📍 Lahore
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="p-4 sm:p-6 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school, index) => {
                const isDemo = school.slug === "demo";
                return (
                  <motion.div
                    key={school.slug || index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => handleSelectSchool(school.slug)}
                    className={`group p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isDemo
                        ? "bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-purple-900/30 border-violet-500/40 hover:border-violet-400 hover:shadow-[0_0_30px_rgba(124,58,237,0.25)]"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-md transition-transform group-hover:scale-105 ${
                            isDemo
                              ? "bg-gradient-to-tr from-violet-500 to-indigo-500 text-white shadow-violet-500/30"
                              : "bg-slate-800 text-slate-200 border border-white/10"
                          }`}
                        >
                          {school.name.charAt(0)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold text-base group-hover:text-violet-300 transition-colors truncate">
                              {school.name}
                            </h3>
                            {isDemo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500 text-white shadow-sm">
                                Verified Demo
                              </span>
                            )}
                            {school.plan && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white/70 border border-white/10 hidden sm:inline-block">
                                {school.plan}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                            <span className="font-mono text-violet-400">
                              /{school.slug}/login
                            </span>
                            {school.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-white/40" />
                                {school.city}
                              </span>
                            )}
                            {school.studentsCount && (
                              <span className="hidden md:flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-white/40" />
                                {school.studentsCount} Students
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right button */}
                      <button className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600/80 group-hover:bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40 group-hover:translate-x-0.5 transition-all">
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
                  <School className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold text-base mb-1">
                  No school found matching "{search}"
                </h4>
                <p className="text-white/40 text-xs max-w-sm mx-auto mb-4">
                  You can directly type your school code / slug below to log in.
                </p>
                <button
                  onClick={() => {
                    setCustomSlug(search.toLowerCase().replace(/\s+/g, "-"));
                    setShowCustomInput(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg hover:bg-violet-500 transition-all"
                >
                  Proceed with "{search}" →
                </button>
              </div>
            )}
          </div>

          {/* Bottom Card Footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {!showCustomInput ? (
              <>
                <div className="text-white/50 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-violet-400" />
                  <span>Know your exact school slug?</span>
                </div>
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4"
                >
                  Enter Slug Manually
                </button>
              </>
            ) : (
              <form
                onSubmit={handleCustomSubmit}
                className="w-full flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40 font-mono text-xs">
                    /
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="e.g. green-valley"
                    className="w-full pl-6 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-violet-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all"
                >
                  Go to Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-2 py-2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-white/40">
        <p>© 2026 EduSphere ERP. Enterprise Multi-School Management System.</p>
      </footer>
    </div>
  );
}