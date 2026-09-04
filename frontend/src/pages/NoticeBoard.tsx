import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, Loader2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

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
  { value: 'ALL', label: 'Everyone' },
  { value: 'TEACHER', label: 'Staff' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'ADMIN', label: 'School Admin' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL', priority: 'MEDIUM' });

  const canManage = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const loadNotices = useCallback(async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const response = await apiClient.get('/academics/announcements');
      setNotices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load notices', error);
      setNotices([]);
      toast.error('Unable to load notices. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadNotices(); }, [loadNotices]);

  const createNotice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required.');
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
      toast.success('Notice published successfully.');
      setForm({ title: '', message: '', target: 'ALL', priority: 'MEDIUM' });
      setShowCreate(false);
      await loadNotices(true);
    } catch (error) {
      console.error('Failed to create notice', error);
      toast.error('Failed to publish notice.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await apiClient.delete(`/academics/announcements/${id}`);
      setNotices(items => items.filter(item => item.id !== id));
      toast.success('Notice deleted.');
    } catch (error) {
      console.error('Failed to delete notice', error);
      toast.error('Failed to delete notice.');
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notices.filter(notice => {
      const text = `${notice.title} ${notice.message ?? notice.content ?? ''}`.toLowerCase();
      const target = notice.target ?? notice.targetRoles ?? 'ALL';
      return (!query || text.includes(query)) && (targetFilter === 'ALL' || target === targetFilter);
    });
  }, [notices, search, targetFilter]);

  const activeCount = notices.filter(notice => !notice.expiresAt || new Date(notice.expiresAt) >= new Date()).length;
  const urgentCount = notices.filter(notice => notice.priority === 'URGENT').length;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-violet-500">
            <BellRing size={14} /> School Communication Hub
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Notice Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">Official school announcements and important updates.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadNotices(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
          </button>
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90">
              <Plus size={16} /> Create Notice
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Total</p><p className="mt-1 text-2xl font-black">{notices.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Active</p><p className="mt-1 text-2xl font-black">{activeCount}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase text-muted-foreground">Urgent</p><p className="mt-1 text-2xl font-black">{urgentCount}</p></div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notices..." className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select value={targetFilter} onChange={event => setTargetFilter(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
          <option value="ALL">All audiences</option>
          {TARGETS.filter(item => item.value !== 'ALL').map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </section>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-card"><Loader2 className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <BellRing size={34} className="mx-auto mb-3 text-muted-foreground" />
          <h2 className="text-lg font-bold">No notices found</h2>
          <p className="mt-1 text-sm text-muted-foreground">Published school announcements will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notice => {
            const message = notice.message ?? notice.content ?? '';
            const target = notice.target ?? notice.targetRoles ?? 'ALL';
            return (
              <article key={notice.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-foreground">{notice.title}</h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{target === 'ALL' ? 'Everyone' : target}</span>
                      {notice.priority && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">{notice.priority}</span>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{message}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{new Date(notice.createdAt ?? notice.publishedAt ?? Date.now()).toLocaleString()}</p>
                  </div>
                  {canManage && <button onClick={() => void deleteNotice(notice.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete notice"><Trash2 size={16} /></button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showCreate && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setShowCreate(false); }}>
          <form onSubmit={createNotice} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Create Notice</h2><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button></div>
            <div className="space-y-4">
              <input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Notice title" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
              <textarea required rows={5} value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="Write the official announcement..." className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.target} onChange={event => setForm({ ...form, target: event.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary">{TARGETS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary">{PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}</select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin" />} Publish</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
