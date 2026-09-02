import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Send, X, Loader2, Bell, AlertCircle,
  Calendar, Users, Check, RefreshCw
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
  createdAt: string;
  author: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'ALL',
    priority: 'NORMAL',
  });

  const fetchAnnouncements = () => {
    setLoading(true);
    apiClient
      .get('/admin/announcements')
      .then((r) => setAnnouncements(r.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post('/admin/announcements', form);
      toast.success('Broadcast announcement published to campuses!');
      setAnnouncements((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', message: '', target: 'ALL', priority: 'NORMAL' });
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5">
            <Megaphone size={12} />
            <span>Platform Communications</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Global Announcements</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Broadcast platform updates, scheduled maintenance notices, or policy changes to schools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all"
          >
            <Plus size={15} />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center rounded-[28px] border border-white/[0.06] bg-slate-900/30">
          <Megaphone size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-white font-bold text-base">No Broadcasts Yet</p>
          <p className="text-slate-500 text-xs mt-1">Create an announcement to broadcast alerts to onboarded schools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl hover:border-violet-500/30 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-tight ${getPriorityBadge(a.priority)}`}>
                    {a.priority}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                    Target: {a.target === 'ALL' ? 'All Campuses' : a.target}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-tight">{a.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{a.message}</p>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-500">
                <span>Published by {a.author}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <Check size={12} /> Active Banner
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                    <Megaphone size={16} />
                  </div>
                  <h3 className="text-base font-black text-white">Broadcast Announcement</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-300">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. System Maintenance or New Feature Release"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-300">Audience Target</label>
                    <select
                      value={form.target}
                      onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-white text-xs focus:outline-none focus:border-violet-500"
                    >
                      <option value="ALL">All Schools</option>
                      <option value="PAID">Paid Subscriptions Only</option>
                      <option value="TRIAL">Free Trial Schools Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-300">Priority Banner</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-white text-xs focus:outline-none focus:border-violet-500"
                    >
                      <option value="NORMAL">Normal Notice</option>
                      <option value="HIGH">High Priority (Urgent Alert)</option>
                      <option value="LOW">Low / Informational</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-300">Announcement Body *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detailed message displayed on tenant dashboards..."
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Publish Broadcast</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
