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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Total Broadcasts</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Megaphone size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{notices.length}</p>
          <span className="text-xs text-muted-foreground font-semibold">Published notices</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Active Circulars</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{activeCount}</p>
          <span className="text-xs text-emerald-600 font-semibold">Currently valid</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>Urgent Circulars</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{urgentCount}</p>
          <span className="text-xs text-rose-500 font-semibold">Immediate attention</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-black uppercase tracking-wider">
            <span>High Priority</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Pin size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{highCount}</p>
          <span className="text-xs text-muted-foreground font-semibold">Important updates</span>
        </div>
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
