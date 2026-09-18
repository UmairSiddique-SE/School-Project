import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing, Loader2, Plus, RefreshCw, Search, Trash2, X,
  ShieldCheck, AlertTriangle, Users, Calendar, Megaphone,
  Pin, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import Modal, { ModalHeader } from '@/component/ui/Modal';

interface Notice {
  id: string;
  title: string;
  message?: string;
  content?: string;
  target?: string;
  targetRoles?: string;
  priority?: string;
  createdAt?: string;
  publishedAt?: string;
  expiresAt?: string;
}

const TARGETS = [
  { value: 'ALL', label: 'Everyone (Public Notice)' },
  { value: 'TEACHER', label: 'Faculty & Staff' },
  { value: 'STUDENT', label: 'Students & Parents' },
  { value: 'ADMIN', label: 'Administration Only' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'General / Low', badge: 'bg-muted text-muted-foreground' },
  { value: 'MEDIUM', label: 'Standard / Medium', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'HIGH', label: 'Important / High', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'URGENT', label: 'Urgent Alert', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' },
];

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'ALL',
    priority: 'MEDIUM',
  });

  const canManage = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const loadNotices = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const response = await apiClient.get('/academics/announcements');
      setNotices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setNotices([]);
      toast.error('Unable to load notices. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  const createNotice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and announcement content are required.');
      return;
    }
    try {
      setSaving(true);
      await apiClient.post('/academics/announcements', {
        title: form.title.trim(),
        message: form.message.trim(),
        target: form.target,
        priority: form.priority,
      });
      toast.success('Notice broadcasted successfully.');
      setForm({ title: '', message: '', target: 'ALL', priority: 'MEDIUM' });
      setShowCreate(false);
      await loadNotices(true);
    } catch (error) {
      toast.error('Failed to publish notice.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!window.confirm('Delete this official notice?')) return;
    try {
      await apiClient.delete(`/academics/announcements/${id}`);
      setNotices((items) => items.filter((item) => item.id !== id));
      toast.success('Notice removed.');
    } catch (error) {
      toast.error('Failed to delete notice.');
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notices.filter((notice) => {
      const text = `${notice.title} ${notice.message ?? notice.content ?? ''}`.toLowerCase();
      const target = notice.target ?? notice.targetRoles ?? 'ALL';
      const priority = notice.priority ?? 'MEDIUM';

      const matchesSearch = !query || text.includes(query);
      const matchesTarget = targetFilter === 'ALL' || target === targetFilter;
      const matchesPriority = priorityFilter === 'ALL' || priority === priorityFilter;

      return matchesSearch && matchesTarget && matchesPriority;
    });
  }, [notices, search, targetFilter, priorityFilter]);

  const activeCount = notices.filter(
    (notice) => !notice.expiresAt || new Date(notice.expiresAt) >= new Date()
  ).length;
  const urgentCount = notices.filter((notice) => notice.priority === 'URGENT').length;
  const highCount = notices.filter((notice) => notice.priority === 'HIGH').length;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <ShieldCheck size={12} /> Institutional Circulars
            </span>
            <span className="text-xs text-muted-foreground">• Official Broadcasts</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notice & Circular Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Official school announcements, academic schedules, exam dates, and urgent administrative alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void loadNotices(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
            title="Refresh Circulars"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : ''} />
          </button>

          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-violet-600/20 transition-all active:scale-95"
            >
              <Plus size={15} /> Create Notice
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Broadcasts',
            value: notices.length,
            icon: Megaphone,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Published school notices',
          },
          {
            label: 'Active Circulars',
            value: activeCount,
            icon: CheckCircle2,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: 'Currently valid in campus',
          },
          {
            label: 'Urgent Alerts',
            value: urgentCount,
            icon: AlertTriangle,
            gradient: 'from-rose-500/[0.08] via-card/70 to-card',
            border: 'border-rose-500/25 hover:border-rose-500/50',
            glow: 'bg-rose-500/15 group-hover:bg-rose-500/25',
            iconBox: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
            labelColor: 'text-rose-600 dark:text-rose-400',
            dotColor: 'bg-rose-500',
            dotPing: 'bg-rose-400',
            shadow: 'shadow-rose-500/[0.04] hover:shadow-rose-500/15',
            subtitle: 'Immediate action required',
          },
          {
            label: 'High Priority',
            value: highCount,
            icon: Pin,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Pinned official updates',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {value}
                </h4>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Audience Filter Bar ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by subject, keywords..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All Audiences</option>
            {TARGETS.filter((item) => item.value !== 'ALL').map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ─── Notice Cards List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Fetching circulars...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <BellRing size={40} className="mx-auto mb-3 text-muted-foreground/30" />
          <h2 className="text-base font-bold text-foreground">No circulars match filters</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Official announcements published will appear on this board.
          </p>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Post Circular Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((notice) => {
            const message = notice.message ?? notice.content ?? '';
            const target = notice.target ?? notice.targetRoles ?? 'ALL';
            const priorityCfg =
              PRIORITIES.find((p) => p.value === notice.priority) || PRIORITIES[1];

            return (
              <div
                key={notice.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-violet-500/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${priorityCfg.badge}`}
                      >
                        {priorityCfg.label}
                      </span>
                      <span className="rounded-md bg-accent/60 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground font-mono">
                        Audience: {target === 'ALL' ? 'Everyone' : target}
                      </span>
                    </div>

                    <h2 className="font-black text-lg text-foreground tracking-tight">{notice.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {message}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={13} />
                        {new Date(notice.createdAt ?? notice.publishedAt ?? Date.now()).toLocaleDateString(
                          'en-PK',
                          { day: '2-digit', month: 'short', year: 'numeric' }
                        )}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => void deleteNotice(notice.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Create Notice ─────────────────────────────────────────────── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<BellRing size={19} />}
          title="Publish Official Notice"
          subtitle="Broadcast announcement to staff, students, or entire school"
          onClose={() => setShowCreate(false)}
        />
        <form onSubmit={createNotice} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Notice Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annual Sports Gala 2026 Schedule & Guidelines"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Audience</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Announcement Body *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Type the full announcement message here..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Publish Announcement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
