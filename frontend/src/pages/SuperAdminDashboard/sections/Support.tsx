import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy, Search, CheckCircle, Clock, AlertTriangle, MessageSquare,
  Send, X, Loader2, School, User, RefreshCw, ChevronRight
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
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  replies: { sender: string; message: string; time: string }[];
}

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  useEffect(() => {
    fetchTickets();
  }, []);

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
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? res.data : t))
      );
      setSelectedTicket(res.data);
      setReplyMessage('');
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5">
            <LifeBuoy size={12} />
            <span>Campus Helpdesk & Inquiries</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Support Tickets</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage inquiries, technical support, and quota requests from school administrations.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab
                ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-[28px] border border-white/[0.06] bg-slate-900/30">
          <LifeBuoy size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-white font-bold text-base">No Tickets Found</p>
          <p className="text-slate-500 text-xs mt-1">All campus inquiries are currently resolved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedTicket(t);
                setNewStatus(t.status);
              }}
              className="p-5 rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl hover:border-violet-500/30 hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-violet-400">{t.ticketNo}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tight ${getPriorityBadge(t.priority)}`}>
                    {t.priority}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tight ${getStatusBadge(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500">• {t.category}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">{t.subject}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{t.message}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-medium text-slate-400">
                    <School size={11} className="text-violet-400" />
                    {t.schoolName}
                  </span>
                  <span>{new Date(t.createdAt).toLocaleDateString('en-PK')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-violet-600/20 text-slate-200 hover:text-white text-xs font-bold border border-white/10 transition-all"
                >
                  <MessageSquare size={13} />
                  <span>View Ticket</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-violet-400">{selectedTicket.ticketNo}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${getPriorityBadge(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* School Info */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{selectedTicket.schoolName}</p>
                    <p className="text-slate-400">{selectedTicket.senderName} ({selectedTicket.senderEmail})</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Message Body */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Inquiry Message</p>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Conversation Trail */}
                {selectedTicket.replies?.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Updates & Replies</p>
                    <div className="space-y-2">
                      {selectedTicket.replies.map((r, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span className="text-violet-300">{r.sender}</span>
                            <span>{r.time}</span>
                          </div>
                          <p className="text-xs text-slate-300">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply & Status Form */}
                <form onSubmit={handleUpdate} className="space-y-3 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Update Ticket Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-white text-xs focus:outline-none focus:border-violet-500"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Super Admin Reply / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Type response or administrative resolution notes..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs disabled:opacity-50 transition-all"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>Update & Send Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
