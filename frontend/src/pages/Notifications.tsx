import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Loader2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

type Notification = {
  id: string;
  type?: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const response = await apiClient.get('/notifications');
      const rows = Array.isArray(response.data) ? response.data : [];
      setNotifications(rows);
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(item => !item.isRead).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter(item => {
      if (filter === 'unread' && item.isRead) return false;
      if (!query) return true;
      return `${item.title} ${item.message} ${item.type || ''}`.toLowerCase().includes(query);
    });
  }, [filter, notifications, search]);

  const markRead = async (id: string) => {
    const current = notifications.find(item => item.id === id);
    if (!current || current.isRead) return;
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(items => items.map(item => item.id === id ? { ...item, isRead: true } : item));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      toast.error('Could not update notification.');
    }
  };

  const markAllRead = async () => {
    if (!unreadCount) return;
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(items => items.map(item => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
      toast.error('Could not update notifications.');
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Bell size={14} /> Notifications
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your school-scoped notifications from the EduSphere system.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadNotifications(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
          </button>
          <button onClick={() => void markAllRead()} disabled={!unreadCount} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notifications..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All ({notifications.length})</button>
          <button onClick={() => setFilter('unread')} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Unread ({unreadCount})</button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-card"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Bell size={34} className="mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">No notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">New school alerts will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} onClick={() => void markRead(item.id)} className={`rounded-2xl border p-5 transition ${item.isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5 shadow-sm'}`}>
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  <Bell size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                    <h3 className="font-extrabold text-foreground">{item.title}</h3>
                    {item.type && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{item.type}</span>}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatTime(item.createdAt)}</span>
                    {item.link && <a href={item.link} onClick={event => event.stopPropagation()} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Open related item <ExternalLink size={12} /></a>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
