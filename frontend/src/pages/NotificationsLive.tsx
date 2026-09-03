import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string };

export default function NotificationsLive() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load notifications');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Unable to update notification'); }
  };

  const markAll = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Unable to update notifications'); }
  };

  const unread = items.filter(n => !n.isRead).length;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  return <div className="max-w-4xl mx-auto space-y-6 pb-10">
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest font-black text-primary">Communication Center</p><h1 className="text-3xl font-black mt-1">Notifications</h1><p className="text-sm text-muted-foreground mt-1">Live notifications from your school account.</p></div>
      {unread > 0 && <button onClick={markAll} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 text-primary px-4 py-2.5 text-xs font-bold"><CheckCheck size={15} /> Mark all read</button>}
    </div>
    <div className="space-y-3">
      {items.length ? items.map(n => <button key={n.id} onClick={() => !n.isRead && markRead(n.id)} className={`w-full text-left rounded-2xl border p-4 transition-all hover:border-primary/30 ${!n.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
        <div className="flex gap-3"><div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Bell size={17} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="font-bold">{n.title}</p>{!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}</div><p className="text-sm text-muted-foreground mt-1">{n.message}</p><p className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p></div></div>
      </button>) : <div className="rounded-2xl border border-dashed p-12 text-center bg-card"><Bell className="mx-auto text-muted-foreground mb-3" /><p className="font-bold">No notifications yet</p><p className="text-sm text-muted-foreground mt-1">New attendance, academic and school updates will appear here.</p></div>}
    </div>
  </div>;
}
