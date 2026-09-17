import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Send, X, Loader2, Check, RefreshCw, CircleDashed
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  priority: string;
  isActive: boolean;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  deliveryCount?: number;
  createdAt: string;
  author: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
  LOW:    'bg-blue-500/10 text-blue-500 border-blue-500/20',
  NORMAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

const inputCls = 'mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50 transition-all';
const labelCls = 'text-[10px] font-bold uppercase text-muted-foreground';
const selectCls = 'mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50 cursor-pointer';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL', priority: 'NORMAL', scheduledAt: '', expiresAt: '' });

  const fetchAnnouncements = () => {
    setLoading(true);
    apiClient
      .get('/admin/announcements')
      .then((r) => setAnnouncements(r.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required.'); return; }
    setSaving(true);
    try {
      const res = await apiClient.post('/admin/announcements', form);
      toast.success(form.scheduledAt ? 'Announcement scheduled successfully.' : 'Broadcast published to all campuses!');
      setAnnouncements((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', message: '', target: 'ALL', priority: 'NORMAL', scheduledAt: '', expiresAt: '' });
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Platform Communications</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Global Announcements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Broadcast platform updates, maintenance notices, or policy changes to all schools.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnnouncements}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold shadow-sm transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 hover:scale-105 transition-all">
            <Plus size={15} /><span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Broadcasts',  value: announcements.length,                                  color: 'text-violet-400', border: 'border-violet-500/20' },
          { label: 'Live / Published',  value: announcements.filter(a => a.publishedAt).length,       color: 'text-emerald-400',border: 'border-emerald-500/20' },
          { label: 'Scheduled',         value: announcements.filter(a => !a.publishedAt && a.scheduledAt).length, color: 'text-amber-400', border: 'border-amber-500/20' },
        ].map(c => (
          <div key={c.label} className={`p-4 rounded-2xl bg-card border shadow-sm ${c.border}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${c.color} mb-1`}>{c.label}</p>
            <p className="text-2xl font-black text-foreground">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Feed ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground rounded-3xl border border-dashed border-border">
          <CircleDashed size={32} className="opacity-40" />
          <p className="font-bold text-base text-foreground">No Broadcasts Yet</p>
          <p className="text-xs">Create an announcement to broadcast alerts to onboarded schools.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-tight ${PRIORITY_BADGE[a.priority] ?? PRIORITY_BADGE.NORMAL}`}>
                    {a.priority}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
                    {a.target === 'ALL' ? 'All Campuses' : a.target}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(a.scheduledAt && !a.publishedAt ? new Date(a.scheduledAt) : new Date(a.createdAt))
                    .toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-tight">{a.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{a.message}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground">
                <span>Published by {a.author}</span>
                <span className={`inline-flex items-center gap-1 font-semibold ${a.publishedAt ? 'text-emerald-500' : 'text-amber-500'}`}>
                  <Check size={12} /> {a.publishedAt ? `${a.deliveryCount || 0} delivered` : 'Scheduled'}
                  {a.expiresAt ? ` · expires ${new Date(a.expiresAt).toLocaleDateString('en-PK')}` : ''}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">Broadcast Announcement</h3>
                    <p className="text-[11px] text-muted-foreground">Send to all enrolled campuses</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className={labelCls}>Announcement Title *</label>
                  <input type="text" required placeholder="e.g. System Maintenance or New Feature Release"
                    value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Audience Target</label>
                    <select value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} className={selectCls}>
                      <option value="ALL">All Schools</option>
                      <option value="PAID">Paid Subscriptions Only</option>
                      <option value="TRIAL">Free Trial Schools Only</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority Banner</label>
                    <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className={selectCls}>
                      <option value="NORMAL">Normal Notice</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                      <option value="LOW">Low / Informational</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Schedule (optional)</label>
                    <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expiry (optional)</label>
                    <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Announcement Body *</label>
                  <textarea rows={4} required placeholder="Detailed message displayed on tenant dashboards..."
                    value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    className={inputCls + ' resize-none'} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Publish Broadcast</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
