import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  School,
  ArrowRight,
  Sparkles,
  MapPin,
  GraduationCap,
  Building2,
  ArrowLeft,
  BookOpen,
  X,
  ChevronRight,
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

export default function SchoolLogin() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get("/schools?limit=30")
      .then((res) => {
        const list = res.data?.data || res.data?.schools || res.data;
        if (Array.isArray(list)) {
          const mapped = list.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug || item.id,
            city: item.city || item.district || "Pakistan",
            country: item.country || "Pakistan",
            studentsCount: item._count?.students || item.studentCount,
            teachersCount: item._count?.teachers || item.teacherCount,
            plan: item.subscription?.plan || item.plan,
            isPopular: false,
          }));
          setSchools(mapped);
        }
      })
      .catch(() => {
        setSchools([]);
      });
  }, []);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSelectSchool = (slug: string) => {
    navigate(`/${slug}/login`);
  };

  const roles = [
    {
      id: "ADMIN",
      title: "School Admin",
      subtitle: "Principal & Management",
      description:
        "Full control over institution academics, staff, fee collection, admissions, and settings.",
      icon: Building2,
      badge: "Administration",
      gradient: "from-violet-600 to-indigo-700",
      borderGlow: "hover:border-violet-400/60 hover:shadow-violet-600/30",
      tagColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
      buttonColor: "bg-gradient-to-r from-violet-600 to-indigo-600",
    },
    {
      id: "TEACHER",
      title: "Teacher Portal",
      subtitle: "Faculty & Instructors",
      description:
        "Take attendance, grade assignments & exams, share homework, and manage class schedules.",
      icon: BookOpen,
      badge: "Academics",
      gradient: "from-blue-600 to-cyan-700",
      borderGlow: "hover:border-blue-400/60 hover:shadow-blue-600/30",
      tagColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      buttonColor: "bg-gradient-to-r from-blue-600 to-cyan-600",
    },
    {
      id: "STUDENT",
      title: "Student Portal",
      subtitle: "Learners",
      description:
        "Access homework, track attendance, view published exam results, notices, and fee history.",
      icon: GraduationCap,
      badge: "Student Life",
      gradient: "from-emerald-600 to-teal-700",
      borderGlow: "hover:border-emerald-400/60 hover:shadow-emerald-600/30",
      tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      buttonColor: "bg-gradient-to-r from-emerald-600 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030817] text-white flex flex-col justify-between relative overflow-hidden selection:bg-violet-500/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

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
          className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-extrabold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            School Login Portal
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Select Your{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              Login Portal
            </span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            Select your role and then choose your registered school campus to continue.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {roles.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`relative group rounded-3xl bg-[#0a0f26]/90 border border-white/10 ${r.borderGlow} p-7 flex flex-col justify-between shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden`}
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${r.tagColor}`}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight group-hover:text-violet-300 transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-xs font-semibold text-violet-400/80 mb-3">
                    {r.subtitle}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {r.description}
                  </p>
                </div>
                <div className={`w-full py-3.5 px-4 rounded-xl ${r.buttonColor} text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg`}>
                  <span>Select a School Below</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#080d22]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <School className="w-5 h-5 text-violet-400" />
              <span>Search Your School Campus</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Search a registered school by name, city, or campus code.
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-violet-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by school name, city, or campus code..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 text-sm md:text-base font-medium focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredSchools.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {filteredSchools.map((s) => (
                <div
                  key={s.slug}
                  onClick={() => handleSelectSchool(s.slug)}
                  className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-bold text-violet-300 text-sm shrink-0 group-hover:scale-105 transition-transform">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate group-hover:text-violet-300 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-violet-400 shrink-0" />
                        <span className="truncate">{s.city || "Pakistan"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-violet-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <School className="w-9 h-9 mx-auto text-white/20 mb-3" />
              <p className="text-sm font-semibold text-white/70">
                {schools.length === 0
                  ? "No registered schools are available yet."
                  : "No school matches your search."}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Make sure your school has completed registration and approval.
              </p>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-500">
        EduSphere ERP — Multi-Campus Educational Management System
      </footer>
    </div>
  );
}
