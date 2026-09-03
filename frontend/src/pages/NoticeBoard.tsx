import React, { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

interface Notice { id: string; title: string; content?: string; message?: string; createdAt?: string; priority?: string; }
const listOf = (d: any): Notice[] => Array.isArray(d) ? d : d?.data || d?.items || [];

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL" });
  const load = async () => { setLoading(true); try { const r = await apiClient.get("/academics/announcements"); setNotices(listOf(r.data)); } catch (e:any) { setNotices([]); toast.error(e?.response?.data?.message || "Unable to load notices."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const create = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); try { await apiClient.post("/academics/announcements", form); toast.success("Notice published."); setForm({title:"",content:"",priority:"NORMAL"}); await load(); } catch(e:any) { toast.error(e?.response?.data?.message || "Unable to publish notice."); } finally { setSaving(false); } };
  const remove = async (id:string) => { if(!confirm("Delete this notice?")) return; try { await apiClient.delete(`/academics/announcements/${id}`); await load(); } catch(e:any) { toast.error(e?.response?.data?.message || "Unable to delete notice."); } };
  return <div className="space-y-6 max-w-6xl mx-auto"><div className="flex justify-between gap-3"><div><h1 className="text-3xl font-black">Notice Board</h1><p className="text-sm text-muted-foreground">Live announcements for this school.</p></div><button onClick={load} className="border rounded-xl px-4 py-2 flex items-center gap-2"><RefreshCw size={15}/>Refresh</button></div>
    <form onSubmit={create} className="border rounded-2xl p-5 grid md:grid-cols-[1fr_1fr_auto] gap-3"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Notice title" className="border rounded-xl px-3 py-2.5 bg-background"/><input required value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Notice message" className="border rounded-xl px-3 py-2.5 bg-background"/><button disabled={saving} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 flex items-center gap-2"><Plus size={15}/>{saving?"Publishing":"Publish"}</button></form>
    <div className="border rounded-2xl overflow-hidden">{loading?<div className="p-12 flex justify-center"><Loader2 className="animate-spin"/></div>:notices.length===0?<div className="p-12 text-center text-muted-foreground">No notices have been published.</div>:notices.map(n=><div key={n.id} className="p-5 border-b last:border-0 flex justify-between gap-4"><div><h2 className="font-bold">{n.title}</h2><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.content || n.message || ""}</p><p className="text-xs text-muted-foreground mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""} {n.priority ? `• ${n.priority}` : ""}</p></div><button onClick={()=>remove(n.id)} className="text-destructive p-2"><Trash2 size={16}/></button></div>)}</div></div>;
}
