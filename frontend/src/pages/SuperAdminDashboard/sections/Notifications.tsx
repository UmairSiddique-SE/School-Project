import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, X, Info, AlertTriangle, CheckCircle, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  WARNING: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  SUCCESS: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'ALL' });
  const [sending, setSending] = useState(false);

  const loadNotifications = async () => {
    try {
      const { data } = await apiClient.get('/admin/announcements');
      setNotifications((Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        type: item.priority === 'HIGH' ? 'WARNING' : item.priority === 'LOW' ? 'SUCCESS' : 'INFO',
        title: item.title,
        message: item.message,
        school: item.target === 'ALL' ? 'All schools' : item.target === 'PAID' ? 'Paid schools' : item.target,
        time: new Date(item.createdAt).toLocaleString('en-PK'),
      })));
    } catch { toast.error('Failed to load platform notifications'); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = broadcast.title.trim();
    const message = broadcast.message.trim();
    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      await apiClient.post('/admin/announcements', { title, message, target: broadcast.target, priority: 'NORMAL' });
      toast.success('Broadcast published successfully');
      setShowBroadcast(false);
      setBroadcast({ title: '', message: '', target: 'ALL' });
      await loadNotifications();
    } catch { toast.error('Broadcast could not be published'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">Platform Notifications</h2>
          <p className="text-muted-foreground text-sm mt-1">Real broadcast history delivered to school users</p>
        </div>
        <button
          onClick={() => setShowBroadcast(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Megaphone size={14} /> Broadcast
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const cfg = typeConfig[n.type] || typeConfig.INFO;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md"
            >
              <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-sm text-foreground">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <div className="mt-2">
                  <span className="text-[10px] font-medium text-primary">{n.school}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell size={36} className="mb-3 opacity-20" />
            <p className="font-semibold">No platform notifications yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBroadcast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Megaphone size={16} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Send Broadcast</h3>
                </div>
                <button type="button" onClick={() => setShowBroadcast(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Title</label>
                  <input required maxLength={160} value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))} placeholder="Notification title"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Message</label>
                  <textarea required maxLength={2000} value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Your message to schools…"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Target</label>
                  <select value={broadcast.target} onChange={e => setBroadcast(p => ({ ...p, target: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="ALL">All Schools</option>
                    <option value="PAID">Paid Schools</option>
                  </select>
                </div>
                <button type="submit" disabled={sending} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sending ? 'Sending…' : 'Send Broadcast'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
