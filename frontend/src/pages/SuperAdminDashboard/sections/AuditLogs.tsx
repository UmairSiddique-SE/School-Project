import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Shield, Edit2, Trash2, User, Settings, LogIn, LogOut, Plus, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400',
  UPDATE: 'bg-blue-500/10 text-blue-400',
  DELETE: 'bg-red-500/10 text-red-400',
  LOGIN: 'bg-violet-500/10 text-violet-400',
  LOGOUT: 'bg-slate-500/10 text-slate-400',
  SUSPEND: 'bg-amber-500/10 text-amber-400',
  ACTIVATE: 'bg-emerald-500/10 text-emerald-400',
  APPROVE: 'bg-emerald-500/10 text-emerald-400',
  REJECT: 'bg-red-500/10 text-red-400',
};

const actionIcons: Record<string, React.ComponentType<any>> = {
  CREATE: Plus,
  UPDATE: Edit2,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SUSPEND: AlertTriangle,
  ACTIVATE: Shield,
  APPROVE: Shield,
  REJECT: AlertTriangle,
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
        if (r.data && r.data.data) {
          setLogs(r.data.data);
          setTotalPages(r.data.meta.totalPages || 1);
          setTotalItems(r.data.meta.total || 0);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">Audit Logs</h2>
          <p className="text-muted-foreground text-sm mt-1">Complete trail of all super admin actions on the platform</p>
        </div>
        <button onClick={() => fetchLogs(actionFilter, search)} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card flex-1">
          <Search size={15} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search logs… (press Enter)"
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {ALL_ACTIONS.map(a => (
            <button
              key={a}
              onClick={() => handleFilterChange(a)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                actionFilter === a ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Action', 'Entity', 'Details', 'Actor', 'IP', 'Timestamp'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log, i) => {
                  const ActionIcon = actionIcons[log.action] || Shield;
                  const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground';
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-accent/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${colorClass}`}>
                          <ActionIcon size={11} /> {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Settings size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold text-foreground whitespace-nowrap">{log.entity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs font-semibold text-foreground">{log.entityName}</p>
                        <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-foreground whitespace-nowrap">{log.actor}</p>
                        <p className="text-[10px] text-muted-foreground">{log.actorEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{log.ip}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Shield size={32} className="mb-3 opacity-20" />
                <p className="font-semibold">No logs found</p>
                <p className="text-xs mt-1">Try adjusting your search filters</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {logs.length} log entries
          </div>
        </div>
      )}
    </div>
  );
}
