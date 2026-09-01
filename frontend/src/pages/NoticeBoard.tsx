import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, FileText, User, X, Loader2, BellRing, Volume2, ShieldAlert } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    content: '',
    targetRoles: 'ALL',
    isPinned: false,
    expiresAt: '',
  });

  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  const fetchNotices = () => {
    setLoading(true);
    apiClient.get('/academics/announcements')
      .then(res => setNotices(res.data))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/academics/announcements', form);
      toast.success('Notice published successfully!');
      setShowAdd(false);
      setForm({ title: '', content: '', targetRoles: 'ALL', isPinned: false, expiresAt: '' });
      fetchNotices();
    } catch {
      toast.error('Failed to publish notice');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this notice?')) return;
    try {
      await apiClient.delete(`/academics/announcements/${id}`);
      toast.success('Notice removed');
      fetchNotices();
    } catch { toast.error('Failed to remove notice'); }
  };

  const filtered = notices.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'PINNED') return n.isPinned;
    return n.targetRoles === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Notice Board</h1>
          <p className="text-muted-foreground text-sm mt-1">School alerts, exam schedules, and holiday announcements</p>
        </div>
        {isSchoolAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Create Notice
          </button>
        )}
      </div>

      {/* Filter tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Notices' },
          { key: 'PINNED', label: 'Pinned Alerts' },
          { key: 'ALL_ROLES', label: 'Public Notices' },
          { key: 'TEACHER', label: 'Staff Notices' },
          { key: 'STUDENT', label: 'Student Notices' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
              filterType === t.key 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                : 'bg-card text-muted-foreground border border-border hover:bg-accent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`bg-card border rounded-2xl p-6 relative overflow-hidden transition-all hover:shadow-md ${
                n.isPinned ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border'
              }`}
            >
              {n.isPinned && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-violet-500" />
              )}
              
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    {n.isPinned && <BellRing size={16} className="text-primary animate-pulse" />}
                    {n.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-primary/80">Target: {n.targetRoles}</span>
                  </div>
                </div>

                {isSchoolAdmin && (
                  <button onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove notice"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <Volume2 size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">No active notices found</p>
              <p className="text-xs mt-1">Check back later for any updates from the administration.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Create School Notice</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Notice Title</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Eid-ul-Fitr Holidays Announcement" required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Content Details</label>
                  <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write detailed announcements here..." required rows={5}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Target Audience</label>
                    <select value={form.targetRoles} onChange={e => setForm(p => ({ ...p, targetRoles: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="ALL">Everyone</option>
                      <option value="TEACHER">Staff Only</option>
                      <option value="STUDENT">Students & Parents</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Expiration Date</label>
                    <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
                    className="rounded text-primary border-border focus:ring-primary/50 h-4 w-4" />
                  <label htmlFor="isPinned" className="text-xs font-bold text-foreground cursor-pointer select-none">Pin this alert to top</label>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Publishing...' : 'Publish Announcement'}
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
