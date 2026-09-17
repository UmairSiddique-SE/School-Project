import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, ExternalLink, Loader2, Search, RefreshCw,
  ShieldCheck, AlertCircle, Calendar, DollarSign, GraduationCap,
  Clock, CheckCircle2, Trash2, ArrowUpRight, MessageSquare
} from 'lucide-react';
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
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getNotificationMeta(type?: string) {
  switch (type?.toUpperCase()) {
    case 'FEE':
    case 'PAYMENT':
    case 'FINANCE':
      return {
        icon: DollarSign,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        badge: 'Finance',
      };
    case 'EXAM':
    case 'GRADE':
    case 'ACADEMIC':
      return {
        icon: GraduationCap,
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        badge: 'Academics',
      };
    case 'ATTENDANCE':
      return {
        icon: Clock,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        badge: 'Attendance',
      };
    case 'SYSTEM':
    case 'SECURITY':
      return {
        icon: ShieldCheck,
        color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        badge: 'System',
      };
    default:
      return {
        icon: Bell,
        color: 'text-primary bg-primary/10 border-primary/20',
        badge: 'General',
      };
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'FINANCE' | 'ACADEMIC' | 'SYSTEM'>('all');

  const loadNotifications = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const response = await apiClient.get('/notifications');
      const rows = Array.isArray(response.data) ? response.data : [];
      setNotifications(rows);
    } catch (error) {
      setNotifications([]);
      toast.error('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter((item) => {
      if (activeCategory === 'unread' && item.isRead) return false;
      if (activeCategory === 'FINANCE' && !['FEE', 'PAYMENT', 'FINANCE'].includes(item.type?.toUpperCase() || ''))
        return false;
      if (activeCategory === 'ACADEMIC' && !['EXAM', 'GRADE', 'ACADEMIC', 'HOMEWORK'].includes(item.type?.toUpperCase() || ''))
        return false;
      if (activeCategory === 'SYSTEM' && !['SYSTEM', 'SECURITY'].includes(item.type?.toUpperCase() || ''))
        return false;

      if (!q) return true;
      return `${item.title} ${item.message} ${item.type || ''}`.toLowerCase().includes(q);
    });
  }, [activeCategory, notifications, search]);

  const markRead = async (id: string) => {
    const current = notifications.find((item) => item.id === id);
    if (!current || current.isRead) return;
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch {
      toast.error('Could not update notification.');
    }
  };

  const markAllRead = async () => {
    if (!unreadCount) return;
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Could not update notifications.');
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <Bell size={12} /> Institutional Feed
            </span>
            {unreadCount > 0 ? (
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {unreadCount} Unread Alert{unreadCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">• All caught up</span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time administrative broadcasts, academic updates, fee receipts, and security dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void loadNotifications(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
            title="Refresh Feed"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : ''} />
          </button>

          <button
            onClick={() => void markAllRead()}
            disabled={!unreadCount}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90 shadow-sm transition-all"
          >
            <CheckCheck size={15} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 bg-accent/30 rounded-xl w-fit overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveCategory('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'unread'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveCategory('FINANCE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'FINANCE'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fees & Finance
          </button>
          <button
            onClick={() => setActiveCategory('ACADEMIC')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'ACADEMIC'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Academics
          </button>
          <button
            onClick={() => setActiveCategory('SYSTEM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'SYSTEM'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            System
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ─── Notification Feed List ───────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Updating notification stream...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Bell className="mx-auto mb-3 text-muted-foreground/30" size={44} />
          <h2 className="text-base font-bold text-foreground">No alerts to display</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeCategory === 'unread'
              ? 'You have read all pending notifications.'
              : 'New institutional alerts will appear here as they arrive.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const meta = getNotificationMeta(item.type);
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                onClick={() => markRead(item.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                  item.isRead
                    ? 'bg-card/70 border-border/70 hover:border-border hover:bg-card'
                    : 'bg-primary/5 border-primary/30 shadow-sm hover:border-primary/50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-accent/60 text-foreground font-mono">
                        {meta.badge}
                      </span>
                      {!item.isRead && (
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold ${
                      item.isRead ? 'text-foreground' : 'text-foreground font-black'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>

                  {item.link && (
                    <a
                      href={item.link}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Take Action</span>
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
