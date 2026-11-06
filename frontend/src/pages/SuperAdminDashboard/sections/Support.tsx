import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy, Search, CheckCircle, Clock, AlertTriangle, MessageSquare,
  Send, X, Loader2, School, RefreshCw, ChevronRight, CircleDashed
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  ticketNo: string;
  schoolName: string;
  schoolSlug: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_SCHOOL' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  replies: { sender: string; message: string; time: string }[];
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  LOW:    'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const STATUS_BADGE: Record<string, string> = {
  OPEN:               'bg-amber-500/10 text-amber-500 border-amber-500/20',
  IN_PROGRESS:        'bg-blue-500/10 text-blue-500 border-blue-500/20',
  WAITING_FOR_SCHOOL: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  RESOLVED:           'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CLOSED:             'bg-muted text-muted-foreground border-border',
};

const inputCls = 'w-full rounded-xl border border-border bg-background text-foreground text-sm p-3 focus:outline-none focus:border-primary/50 transition-all';

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [newStatus, setNewStatus] = useState<string>('RESOLVED');
  const [saving, setSaving] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    apiClient
      .get('/admin/support')
      .then((r) => setTickets(r.data || []))
      .catch(() => toast.error('Failed to load support tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const res = await apiClient.patch(`/admin/support/${selectedTicket.id}`, {
        status: newStatus,
        reply: replyMessage.trim() || undefined,
      });
      toast.success('Ticket updated & reply registered!');
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? res.data : t)));
      setSelectedTicket(res.data);
      setReplyMessage('');
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.subject.toLowerCase().includes(q) || t.schoolName.toLowerCase().includes(q) || t.senderName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount      = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount  = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Campus Helpdesk &amp; Inquiries</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage inquiries, technical support, and quota requests from school administrations.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets', value: tickets.length,  color: 'text-violet-400', border: 'border-violet-500/20' },
          { label: 'Open',          value: openCount,       color: 'text-amber-400',  border: 'border-amber-500/20' },
          { label: 'In Progress',   value: inProgressCount, color: 'text-blue-400',   border: 'border-blue-500/20' },
          { label: 'Resolved',      value: resolvedCount,   color: 'text-emerald-400',border: 'border-emerald-500/20' },
        ].map(c => (
          <div key={c.label} className={`p-4 rounded-2xl bg-card border shadow-sm ${c.border}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${c.color} mb-1`}>{c.label}</p>
            <p className="text-2xl font-black text-foreground">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card flex-1 group focus-within:border-violet-500/40 transition-all shadow-sm">
          <Search size={16} className="text-muted-foreground group-focus-within:text-violet-400 transition-colors shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by subject, school, or sender..."
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_SCHOOL', 'RESOLVED', 'CLOSED'].map((tab) => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-border'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ticket List ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground rounded-3xl border border-dashed border-border">
          <CircleDashed size={32} className="opacity-40" />
          <p className="font-bold text-base">No Tickets Found</p>
          <p className="text-xs">All campus inquiries are currently resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { setSelectedTicket(t); setNewStatus(t.status); }}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-violet-400">{t.ticketNo}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tight ${PRIORITY_BADGE[t.priority] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {t.priority}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tight ${STATUS_BADGE[t.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {t.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">• {t.category}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-tight">{t.subject}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{t.message}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <School size={11} className="text-violet-400" /> {t.schoolName}
                  </span>
                  <span>{new Date(t.createdAt).toLocaleDateString('en-PK')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-background hover:border-primary/40 text-foreground text-xs font-bold transition-all">
                  <MessageSquare size={13} />
                  <span>View Ticket</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Ticket Detail Modal ── */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-violet-400">{selectedTicket.ticketNo}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${PRIORITY_BADGE[selectedTicket.priority] ?? ''}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* School Info */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground text-sm">{selectedTicket.schoolName}</p>
                    <p className="text-muted-foreground mt-0.5">{selectedTicket.senderName} ({selectedTicket.senderEmail})</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${STATUS_BADGE[selectedTicket.status] ?? ''}`}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Message Body */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Inquiry Message</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Conversation Trail */}
                {selectedTicket.replies?.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Updates &amp; Replies</p>
                    <div className="space-y-2">
                      {selectedTicket.replies.map((r, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-muted/20 border border-border">
                          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-1">
                            <span className="text-violet-400">{r.sender}</span>
                            <span>{r.time}</span>
                          </div>
                          <p className="text-xs text-foreground">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply & Status Form */}
                <form onSubmit={handleUpdate} className="space-y-3 pt-3 border-t border-border">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Update Ticket Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className={inputCls + ' cursor-pointer'}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_SCHOOL">Waiting for School</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Super Admin Reply / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Type response or administrative resolution notes..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setSelectedTicket(null)}
                      className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-accent transition-all">
                      Close
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>Update &amp; Send Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
