import { useEffect, useState } from "react";
import { Loader2, Mail, Phone, Search, UserRound, UsersRound } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

type Parent = { id: string; name: string; email?: string; phone?: string; relation?: string; students?: Array<{ student?: { id: string; name: string; admissionNo?: string; section?: { name?: string; class?: { name?: string } } } }> };

export default function Parents() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/people/parents")
      .then(({ data }) => setParents(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(error?.response?.data?.message || "Unable to load parents"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = parents.filter((parent) => `${parent.name} ${parent.email || ""} ${parent.phone || ""}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-400"><UsersRound size={12} /> People</div><h1 className="mt-3 text-3xl font-black tracking-tight">Parents</h1><p className="mt-1 text-sm text-muted-foreground">Manage parent records and their linked students.</p></div><div className="rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold">{parents.length} parents</div></div>
    <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2"><Search size={17} className="text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parents..." className="w-full bg-transparent outline-none text-sm" /></div>
    {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-violet-500" /></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((parent) => <div key={parent.id} className="rounded-3xl border border-border bg-card p-5 hover:border-violet-500/25 transition-colors"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><UserRound size={22} /></div><div className="min-w-0"><h2 className="font-black truncate">{parent.name}</h2><p className="text-[11px] text-muted-foreground">{parent.relation || "Parent"}</p></div></div><div className="mt-4 space-y-2 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Mail size={13} /> <span className="truncate">{parent.email || "No email"}</span></div><div className="flex items-center gap-2"><Phone size={13} /> <span>{parent.phone || "No phone"}</span></div></div><div className="mt-4 pt-4 border-t border-border"><p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground mb-2">Linked students</p>{parent.students?.length ? parent.students.map(({ student }) => student ? <div key={student.id} className="rounded-xl bg-background/60 px-3 py-2 mb-2"><p className="text-xs font-bold">{student.name}</p><p className="text-[10px] text-muted-foreground">{student.admissionNo || "No admission no."}{student.section?.class?.name ? ` • ${student.section.class.name}` : ""}{student.section?.name ? ` • ${student.section.name}` : ""}</p></div> : null) : <p className="text-xs text-muted-foreground">No linked student.</p>}</div></div>)}{filtered.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No parent records found.</div>}</div>}
  </div>;
}
