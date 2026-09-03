import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  School,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  GraduationCap,
  X,
  CheckCircle2,
  Building2,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/api/apiClient";

export interface SchoolItem {
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

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolSearchModal({ isOpen, onClose }: SchoolSearchModalProps) {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customSlug, setCustomSlug] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load from backend if available
  useEffect(() => {
    if (isOpen) {
      apiClient
        .get("/schools?limit=20")
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
              plan: item.subscription?.plan || item.plan || "PROFESSIONAL",
              isPopular: item.slug === "demo",
            }));
            setSchools(mapped);
          }
        })
        .catch(() => {
          // fallback to []
          setSchools([]);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectSchool = (slug: string) => {
    onClose();
    navigate(`/${slug}/login`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlug.trim()) return;
    const clean = customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    onClose();
    navigate(`/${clean}/login`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop with rich blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#030817]/80 backdrop-blur-xl transition-all"
          />

          {/* Glowing background ambient lights */}
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" />
          </div>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-[#090e24]/95 border border-white/15 rounded-3xl shadow-[0_0_80px_rgba(124,58,237,0.25)] overflow-hidden z-10 flex flex-col max-h-[88vh]"
          >
            {/* Top VIP Header Badge */}
            <div className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white tracking-tight">
                        Find Your School
                      </h2>
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300">
                        VIP Portal
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Search campus name or enter domain to log in
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* VIP Search Input */}
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-violet-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search school by name, campus, or city..."
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/[0.07] border border-violet-500/30 text-white placeholder-white/40 text-sm md:text-base font-medium focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 shadow-inner transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-white/40 font-medium whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Quick:
                </span>
                <button
                  onClick={() => handleSelectSchool("edusphere-international")}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 border border-violet-500/30 text-violet-300 font-semibold whitespace-nowrap transition-all flex items-center gap-1.5"
                >
                  🏫 EduSphere Central
                </button>
                <button
                  onClick={() => setSearch("Beaconhouse")}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
                >
                  Beaconhouse
                </button>
                <button
                  onClick={() => setSearch("City")}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
                >
                  City School
                </button>
                <button
                  onClick={() => setSearch("Lahore")}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white whitespace-nowrap transition-all"
                >
                  📍 Lahore
                </button>
              </div>
            </div>

            {/* School Results List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5 custom-scrollbar">
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school, index) => {
                  return (
                    <motion.div
                      key={school.slug || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelectSchool(school.slug)}
                      className="group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Logo avatar */}
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg transition-transform group-hover:scale-105 shadow-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-500/20">
                            {school.name.charAt(0)}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-bold text-base group-hover:text-violet-300 transition-colors truncate">
                                {school.name}
                              </h3>
                              {school.plan && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 hidden sm:inline-block">
                                  {school.plan}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                              <span className="font-mono text-violet-400/90 truncate">
                                edusphere.com/{school.slug}
                              </span>
                              {school.city && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <MapPin className="w-3 h-3 text-white/40" />
                                  {school.city}
                                </span>
                              )}
                              {school.studentsCount && (
                                <span className="hidden md:flex items-center gap-1 shrink-0">
                                  <GraduationCap className="w-3 h-3 text-white/40" />
                                  {school.studentsCount} Students
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action CTA button */}
                        <div className="shrink-0">
                          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/80 group-hover:bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40 group-hover:translate-x-0.5 transition-all">
                            <span>Open Portal</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
                    <School className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">
                    No school found matching "{search}"
                  </h4>
                  <p className="text-white/40 text-xs max-w-sm mx-auto mb-4">
                    Check spelling or directly enter your school code below to
                    access your login page.
                  </p>
                  <button
                    onClick={() => {
                      setCustomSlug(search.toLowerCase().replace(/\s+/g, "-"));
                      setShowCustomInput(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg hover:bg-violet-500 transition-all"
                  >
                    Use "{search}" as School Code →
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Custom Subdomain or Direct Slug Option */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {!showCustomInput ? (
                <>
                  <div className="text-white/50 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-violet-400" />
                    <span>Have a direct School Slug / Subdomain?</span>
                  </div>
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4"
                  >
                    Enter Code Manually
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
        </div>
      )}
    </AnimatePresence>
  );
}
