import React, { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Notice = { id: string; title: string; content: string; publishedAt?: string; expiresAt?: string | null; isPinned?: boolean };

export default function Notifications() {
  const [items, setItems] = useState<Notice[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get('/academics/announcements').then(r => setItems(Array.isArray(r.data) ? r.data : [])).catch(e => toast.error(e?.response?.data?.message || 'Unable to load notifications')).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-muted-foreground">School announcements delivered from the live system.</p></div>{items.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground"><Bell className="mx-auto mb-2"/>No notifications yet.</div> : <div className="space-y-3">{items.map(n => <article key={n.id} className="rounded-xl border p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{n.title}</h2>{n.isPinned && <span className="text-xs rounded-full border px-2 py-1">Pinned</span>}</div><p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>{n.publishedAt && <time className="block mt-3 text-xs text-muted-foreground">{new Date(n.publishedAt).toLocaleString()}</time>}</article>)}</div>}</div>;
}
