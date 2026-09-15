import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, School, MapPin, Globe2, ArrowRight, ShieldCheck } from "lucide-react";
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

const getLoginPath = (slug: string) => {
  const cleanSlug = String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  return `/school-login/${encodeURIComponent(cleanSlug)}`;
};

export default function SchoolLogin() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiClient
      .get(`/public/schools?_=${Date.now()}`)
      .then((response) => {
        if (!mounted) return;
        const data = response?.data;
        setSchools(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.schools)
              ? data.schools
              : [],
        );
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
        String(field || "").toLowerCase().includes(value),
      ),
    );
  }, [schools, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
            <School size={30} className="text-blue-300" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
            <ShieldCheck size={14} /> Secure school portal
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">School Login</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
            Select your school to access the EduSphere portal.
          </p>
        </div>

        <div className="mx-auto mb-9 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <Search size={20} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search school by name, city or country..."
            className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
          />
        </div>

        {loading && <div className="text-center text-slate-300">Loading schools...</div>}
        {!loading && error && <div className="text-center text-red-300">{error}</div>}
        {!loading && !error && filteredSchools.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-10 text-center text-slate-300 backdrop-blur-xl">
            No schools found.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => {
            const loginPath = getLoginPath(school.slug);
            return (
              <Link
                key={school.id || school.slug}
                to={school.slug ? loginPath : "#"}
                onClick={(event) => {
                  if (!school.slug) event.preventDefault();
                }}
                className="group rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/10 hover:shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={school.name} className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-blue-500/15 text-blue-300">
                      <School size={26} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">{school.name}</h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-400"><MapPin size={14} /> {school.city || "Location unavailable"}</div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-400"><Globe2 size={14} /> {school.country || ""}</div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold text-blue-300">
                  <span>{school.isActive ? "Continue to login" : "Login available — pending approval"}</span>
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </div>
                {!school.isActive && <div className="mt-2 text-xs text-amber-300">Portal modules unlock after Super Admin approval.</div>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
