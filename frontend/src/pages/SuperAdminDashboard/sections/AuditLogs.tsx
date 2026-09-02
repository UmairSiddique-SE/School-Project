import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, Edit2, Trash2, User, Settings, LogIn, LogOut,
  Plus, AlertTriangle, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  Filter, Clock, Globe,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

/* ── colour maps ── */
const actionMeta: Record<string, { bg: string; text: string; ring: string; icon: React.ComponentType<any> }> = {
  CREATE:   { bg: 'bg-emerald-500/12', text: 'text-emerald-400', ring: 'ring-emerald-500/25', icon: Plus },
  UPDATE:   { bg: 'bg-blue-500/12',    text: 'text-blue-400',    ring: 'ring-blue-500/25',    icon: Edit2 },
  DELETE:   { bg: 'bg-rose-500/12',    text: 'text-rose-400',    ring: 'ring-rose-500/25',    icon: Trash2 },
  LOGIN:    { bg: 'bg-violet-500/12',  text: 'text-violet-400',  ring: 'ring-violet-500/25',  icon: LogIn },
  LOGOUT:   { bg: 'bg-slate-500/12',   text: 'text-slate-400',   ring: 'ring-slate-500/25',   icon: LogOut },
  SUSPEND:  { bg: 'bg-amber-500/12',   text: 'text-amber-400',   ring: 'ring-amber-500/25',   icon: AlertTriangle },
  ACTIVATE: { bg: 'bg-emerald-500/12', text: 'text-emerald-400', ring: 'ring-emerald-500/25', icon: Shield },
  APPROVE:  { bg: 'bg-emerald-500/12', text: 'text-emerald-400', ring: 'ring-emerald-500/25', icon: Shield },
  REJECT:   { bg: 'bg-rose-500/12',    text: 'text-rose-400',    ring: 'ring-rose-500/25',    icon: AlertTriangle },
};

const ALL_ACTIONS = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SUSPEND', 'ACTIVATE', 'APPROVE', 'REJECT'];

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entityName: string;
  actor: string;
  actorEmail: string;
  details: string;
  ip: string;
  timestamp: string;
}

/* ── Pagination ── */
function Pagination({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => {
    if (total <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= total - 3) return total - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={15} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`min-w-[30px] h-[30px] rounded-lg text-xs font-bold transition-all ${
            p === page
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Shield size={28} className="opacity-30" />
      </div>
      <p className="font-bold text-foreground/50">No logs found</p>
      <p className="text-xs mt-1 text-muted-foreground/60">Try adjusting your search or filter</p>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(15);

  const fetchLogs = (action = actionFilter, searchTerm = search, page = currentPage) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action && action !== 'ALL') params.set('action', action);
    if (searchTerm) params.set('search', searchTerm);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    apiClient.get(`/admin/audit-logs?${params.toString()}`)
      .then(r => {
        if (r.data?.data) {
          setLogs(r.data.data);
          setTotalPages(r.data.meta?.totalPages || 1);
          setTotalItems(r.data.meta?.total || 0);
        } else {
          setLogs(r.data || []);
          setTotalPages(1);
          setTotalItems((r.data || []).length);
        }
      })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [currentPage]);

  const handleFilterChange = (action: string) => {
    setActionFilter(action);
    setCurrentPage(1);
    fetchLogs(action, search, 1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs(actionFilter, search, 1);
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Complete trail of all super-admin actions on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-bold text-muted-foreground border border-border">
              {totalItems.toLocaleString()} total entries
            </span>
          )}
          <button
            onClick={() => fetchLogs(actionFilter, search)}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-violet-500/30 transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card
          focus-within:border-violet-500/40 focus-within:shadow-sm focus-within:shadow-violet-500/10 transition-all">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by actor, entity, or action… (Enter to search)"
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/60"
          />
          {search && (
            <button onClick={() => { setSearch(''); handleSearch(); }}
              className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
              Clear
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Filter size={12} />
            <span>Filter:</span>
          </div>
          {ALL_ACTIONS.map(a => {
            const meta = actionMeta[a];
            const isActive = actionFilter === a;
            return (
              <button
                key={a}
                onClick={() => handleFilterChange(a)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                  isActive
                    ? a === 'ALL'
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : `${meta?.bg} ${meta?.text} ring-1 ${meta?.ring}`
                    : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent hover:border-border'
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Logs Table ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Loading audit logs…</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border/60 rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Action', 'Entity', 'Details', 'Actor', 'IP Address', 'Timestamp'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, i) => {
                      const meta = actionMeta[log.action] || {
                        bg: 'bg-slate-500/10', text: 'text-slate-400', ring: 'ring-slate-500/20', icon: Settings,
                      };
                      const ActionIcon = meta.icon;
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="border-b border-border/40 hover:bg-accent/20 transition-colors group"
                        >
                          {/* Action */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
                              <ActionIcon size={10} />
                              {log.action}
                            </span>
                          </td>

                          {/* Entity */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                                <Settings size={11} className="text-muted-foreground" />
                              </div>
                              <span className="text-xs font-bold text-foreground whitespace-nowrap">{log.entity}</span>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-4 py-3.5 max-w-[200px]">
                            <p className="text-xs font-semibold text-foreground truncate">{log.entityName}</p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.details}</p>
                          </td>

                          {/* Actor */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                                <User size={11} className="text-violet-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground whitespace-nowrap leading-none">{log.actor}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{log.actorEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* IP */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Globe size={11} className="text-muted-foreground/50 shrink-0" />
                              <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">{log.ip || '—'}</span>
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Clock size={11} className="text-muted-foreground/50 shrink-0" />
                              <div>
                                <p className="text-[11px] text-foreground font-semibold whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-muted-foreground tabular-nums">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">
                Showing <span className="text-foreground font-bold">{logs.length}</span> of{' '}
                <span className="text-foreground font-bold">{totalItems}</span> entries
              </p>
              <Pagination page={currentPage} total={totalPages} onChange={handlePageChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
