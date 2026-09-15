import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, School, MapPin, Globe2 } from "lucide-react";
import apiClient from "../lib/apiClient";

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
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <School size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">School Login</h1>
          <p className="mt-2 text-slate-500">Select your school to continue.</p>
        </div>

        <div className="mx-auto mb-8 flex max-w-xl items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <Search size={20} className="text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search school..." className="w-full bg-transparent outline-none" />
        </div>

        {loading && <div className="text-center text-slate-500">Loading schools...</div>}
        {!loading && error && <div className="text-center text-red-600">{error}</div>}
        {!loading && !error && filteredSchools.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">No schools found.</div>
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
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {school.logoUrl ? (
                    <img src={school.logoUrl} alt={school.name} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><School size={26} /></div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{school.name}</h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {school.city || ""}</div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Globe2 size={14} /> {school.country || ""}</div>
                  </div>
                </div>
                <div className="mt-5 text-sm font-medium text-blue-600">Open school login →</div>
                {!school.isActive && <div className="mt-2 text-xs font-medium text-amber-600">Approval pending — portal remains locked</div>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
