import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type School = { id: string; name: string; slug: string; logoUrl?: string | null; city?: string | null; country?: string | null };

export default function SchoolLogin() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/public/schools').then(r => setSchools(Array.isArray(r.data) ? r.data : [])).catch(e => { setError(e?.response?.data?.message || 'Unable to load schools.'); setSchools([]); }).finally(() => setLoading(false));
  }, []);
  const filtered = schools.filter(s => `${s.name} ${s.slug} ${s.city || ''}`.toLowerCase().includes(search.toLowerCase().trim()));

  return <div className="min-h-screen flex items-center justify-center p-6 bg-background"><div className="w-full max-w-3xl space-y-6"><div className="text-center"><h1 className="text-3xl font-bold">School Login</h1><p className="text-muted-foreground mt-2">Select your school to continue.</p></div><div className="rounded-xl border p-3 flex items-center gap-3"><Search size={18} className="text-muted-foreground"/><input className="flex-1 bg-transparent outline-none" placeholder="Search school..." value={search} onChange={e => setSearch(e.target.value)}/></div>{loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div> : error ? <div className="rounded-xl border p-6 text-center text-destructive">{error}<button className="underline ml-2" onClick={() => window.location.reload()}>Retry</button></div> : filtered.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No active schools are available.</div> : <div className="grid sm:grid-cols-2 gap-4">{filtered.map(s => <button key={s.id} onClick={() => navigate(`/${s.slug}/login`)} className="rounded-xl border p-5 text-left hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3">{s.logoUrl ? <img src={s.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover"/> : <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold">{s.name.charAt(0).toUpperCase()}</div>}<div className="min-w-0"><div className="font-semibold truncate">{s.name}</div><div className="text-xs text-muted-foreground">{s.city || ''}{s.city && s.country ? ', ' : ''}{s.country || ''}</div></div></div></button>)}</div>}<div className="text-center text-sm text-muted-foreground">New school? <button onClick={() => { toast.info('Opening school registration'); navigate('/register-school'); }} className="underline">Register here</button></div></div></div>;
}
