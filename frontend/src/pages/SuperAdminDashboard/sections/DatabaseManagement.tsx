import React, { useEffect, useMemo, useState } from 'react';
import { Database, Search, RefreshCw, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Entity={key:string;label:string;sensitive?:boolean};
export default function DatabaseManagement(){
  const [entities,setEntities]=useState<Entity[]>([]);
  const [entity,setEntity]=useState('schools');
  const [schoolId,setSchoolId]=useState('');
  const [schools,setSchools]=useState<any[]>([]);
  const [rows,setRows]=useState<any[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [deleting,setDeleting]=useState<string|null>(null);
  const limit=25;
  const loadEntities=async()=>{const r=await apiClient.get('/admin/database/entities');setEntities(r.data||[]);};
  const loadSchools=async()=>{const r=await apiClient.get('/admin/schools');setSchools(r.data||[]);};
  const load=async()=>{setLoading(true);try{const r=await apiClient.get('/admin/database/'+entity,{params:{schoolId:schoolId||undefined,search:search||undefined,page,limit}});setRows(r.data?.data||[]);setTotal(Number(r.data?.total||0));}catch{toast.error('Failed to load database records')}finally{setLoading(false)}};
  useEffect(()=>{Promise.all([loadEntities(),loadSchools()]).catch(()=>toast.error('Failed to load database metadata'))},[]);
  useEffect(()=>{load()},[entity,schoolId,page,search]);
  const columns=useMemo(()=>{const set=new Set<string>();rows.slice(0,10).forEach(r=>Object.keys(r).forEach(k=>set.add(k)));return Array.from(set).filter(k=>!['passwordHash','token','otp','before','after'].includes(k)).slice(0,9)},[rows]);
  const remove=async(id:string)=>{if(!window.confirm('Delete this record? Soft delete is used where supported. Permanent delete is irreversible.'))return;setDeleting(id);try{await apiClient.delete('/admin/database/'+entity+'/'+id,{params:{permanent:true}});toast.success('Record deleted');load()}catch{toast.error('Delete failed — related records may need to be removed first')}finally{setDeleting(null)}};
  const totalPages=Math.max(1,Math.ceil(total/limit));
  return <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div><div className="flex items-center gap-2 mb-1"><Database size={15} className="text-violet-500"/><span className="text-[11px] font-black uppercase tracking-widest text-violet-500">Root Data Governance</span></div><h1 className="text-3xl font-black tracking-tight">Database Management</h1><p className="text-sm text-muted-foreground mt-1">Live production records across SchoolOS. Sensitive authentication secrets are never exposed.</p></div>
      <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-bold"><RefreshCw size={14} className={loading?'animate-spin':''}/> Refresh</button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5"><p className="text-[10px] font-black uppercase text-violet-500">Entities</p><p className="text-2xl font-black mt-1">{entities.length}</p></div>
      <div className="p-4 rounded-2xl border border-border bg-card"><p className="text-[10px] font-black uppercase text-muted-foreground">Current Records</p><p className="text-2xl font-black mt-1">{total.toLocaleString()}</p></div>
      <div className="p-4 rounded-2xl border border-border bg-card"><p className="text-[10px] font-black uppercase text-muted-foreground">Page</p><p className="text-2xl font-black mt-1">{page}/{totalPages}</p></div>
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5"><p className="text-[10px] font-black uppercase text-amber-600">Scope</p><p className="text-sm font-black mt-2">Super Admin</p></div>
    </div>
    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-2xl border border-border bg-card p-3 max-h-[620px] overflow-y-auto"><p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Entities</p>{entities.map(e=><button key={e.key} onClick={()=>{setEntity(e.key);setPage(1)}} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold mb-1 ${entity===e.key?'bg-violet-500 text-white':'hover:bg-accent text-muted-foreground'}`}>{e.label}</button>)}</div>
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"><Search size={14} className="text-muted-foreground"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search current records..." className="bg-transparent outline-none text-xs flex-1"/></div>
          <select value={schoolId} onChange={e=>{setSchoolId(e.target.value);setPage(1)}} className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold min-w-[220px]"><option value="">All Schools</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading?<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500"/></div>:rows.length===0?<div className="p-16 text-center text-sm text-muted-foreground">No records found.</div>:<div className="overflow-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-border bg-muted/30">{columns.map(c=><th key={c} className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">{c}</th>)}<th className="px-4 py-3 text-right text-[10px] font-black uppercase text-muted-foreground">Control</th></tr></thead><tbody className="divide-y divide-border">{rows.map(r=><tr key={r.id} className="hover:bg-accent/30">{columns.map(c=><td key={c} className="px-4 py-3 text-[11px] max-w-[260px] truncate">{typeof r[c]==='object'&&r[c]!==null?JSON.stringify(r[c]):String(r[c]??'—')}</td>)}<td className="px-4 py-3 text-right"><button onClick={()=>remove(r.id)} disabled={deleting===r.id} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-black text-rose-500 disabled:opacity-50"><Trash2 size={12}/>{deleting===r.id?'Deleting':'Delete'}</button></td></tr>)}</tbody></table></div>}
        </div>
        <div className="flex items-center justify-between"><p className="text-[11px] text-muted-foreground">Showing {rows.length} of {total.toLocaleString()} records</p><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="p-2 rounded-lg border border-border disabled:opacity-40"><ChevronLeft size={14}/></button><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="p-2 rounded-lg border border-border disabled:opacity-40"><ChevronRight size={14}/></button></div></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2 text-[11px] text-amber-700"><AlertTriangle size={15} className="shrink-0"/><span>Permanent deletion is irreversible and may fail when other records depend on the selected record. Authentication secrets are intentionally hidden.</span></div>
      </div>
    </div>
  </div>
}
