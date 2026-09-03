import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";

type School = { id: string; name: string; slug: string; logoUrl?: string | null; city?: string | null; country?: string | null };
type Props = { isOpen: boolean; onClose: () => void };

export default function SchoolSearchModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    apiClient.get('/public/schools').then(r => setSchools(Array.isArray(r.data) ? r.data : [])).catch(() => setSchools([])).finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = useMemo(() => schools.filter(s => `${s.name} ${s.slug} ${s.city || ''}`.toLowerCase().includes(search.toLowerCase().trim())), [schools, search]);
  if (!isOpen) return null;
  const select = (slug: string) => { onClose(); navigate(`/${slug}/login`); };

  return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => e.currentTarget === e.target && onClose()}><div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl overflow-hidden"><div className="p-4 border-b flex items-center gap-3"><Search size={18}/><input autoFocus className="flex-1 bg-transparent outline-none" placeholder="Search active schools..." value={search} onChange={e => setSearch(e.target.value)}/><button onClick={onClose}><X size={20}/></button></div>{loading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin"/></div> : filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground">No active schools found.</div> : <div className="max-h-[60vh] overflow-y-auto p-2">{filtered.map(s => <button key={s.id} onClick={() => select(s.slug)} className="w-full p-3 rounded-xl text-left hover:bg-muted flex items-center gap-3">{s.logoUrl ? <img src={s.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover"/> : <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold">{s.name.charAt(0)}</div>}<div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.city || ''}{s.city && s.country ? ', ' : ''}{s.country || ''}</div></div></button>)}</div>}</div></div>;
}
