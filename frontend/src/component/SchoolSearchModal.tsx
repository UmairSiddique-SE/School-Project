import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, MapPin, ExternalLink, School, ArrowRight } from "lucide-react";
import apiClient from "@/api/apiClient";

interface SchoolItem {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  phone?: string | null;
  email?: string | null;
}

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolSearchModal({ isOpen, onClose }: SchoolSearchModalProps) {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    apiClient
      .get<SchoolItem[]>("/public/schools")
      .then((r) => setSchools(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.name, s.slug, s.city].some((f) => String(f || "").toLowerCase().includes(q))
    );
  }, [schools, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#070e1e]/95 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <Search size={18} className="text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search school by name or city..."
            className="flex-1 bg-transparent text-white text-sm font-medium placeholder-slate-500 outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400 animate-pulse">Loading campuses...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {query ? `No schools found for "${query}"` : "No registered schools yet."}
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-400/20 p-4 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-white/5 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{s.name}</p>
                    {s.city && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-cyan-400" />
                        {s.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/school/${s.slug}`}
                    onClick={onClose}
                    className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-cyan-400 transition"
                    title="School Website"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <Link
                    to={`/school-login/${s.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
                  >
                    Login <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-500">{filtered.length} campus{filtered.length !== 1 ? 'es' : ''} found</span>
          <Link to="/register-school/plans" onClick={onClose} className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
            <School size={12} /> Register your school
          </Link>
        </div>
      </div>
    </div>
  );
}
