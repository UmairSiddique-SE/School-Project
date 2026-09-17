import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon, Search, Shield, Ban, CheckCircle,
  School, Filter, Loader2, RefreshCw, CircleDashed, ArrowUpRight
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  school?: { id: string; name: string; slug: string };
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:  { label: 'Super Admin',  color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  SCHOOL_ADMIN: { label: 'School Admin', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  TEACHER:      { label: 'Teacher',      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  STUDENT:      { label: 'Student',      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  PARENT:       { label: 'Parent',       color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

export default function Users() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    apiClient
      .get('/admin/users')
      .then((r) => setUsers(r.data || []))
      .catch(() => toast.error('Failed to load platform users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user: PlatformUser) => {
    setProcessingId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/toggle-status`);
      toast.success(`User ${user.name} is now ${user.isActive ? 'Deactivated' : 'Activated'}`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.school?.name?.toLowerCase().includes(q) ?? false);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleMeta = (role: string) => ROLE_META[role] ?? { label: role.replace('_', ' '), color: 'bg-muted text-muted-foreground border-border' };

  const totalActive = users.filter(u => u.isActive).length;
  const totalInactive = users.filter(u => !u.isActive).length;

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Identity &amp; Access Governance</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Platform Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage school owners, administrative personnel, and system privileges.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Active', value: totalActive, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Inactive', value: totalInactive, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          { label: 'School Admins', value: users.filter(u => u.role === 'SCHOOL_ADMIN').length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        ].map(card => (
          <div key={card.label} className={`p-4 rounded-2xl bg-card border shadow-sm ${card.bg.split(' ')[1]}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${card.color} mb-1`}>{card.label}</p>
            <p className="text-2xl font-black text-foreground">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card flex-1 w-full group focus-within:border-violet-500/40 transition-all shadow-sm">
          <Search size={16} className="text-muted-foreground group-focus-within:text-violet-400 transition-colors shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or affiliated campus..."
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-9 pr-8 py-3 rounded-2xl border border-border bg-card text-foreground text-[12px] font-bold appearance-none cursor-pointer focus:outline-none focus:border-primary/40 min-w-[160px] shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="SCHOOL_ADMIN">School Admins</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
            <option value="PARENT">Parents</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={28} className="animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CircleDashed size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-foreground font-bold text-base">No Users Found</p>
            <p className="text-muted-foreground text-xs">Try modifying your query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Campus Association</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filtered.map((u, i) => {
                  const rm = roleMeta(u.role);
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-accent/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 font-black flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-tight">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tight ${rm.color}`}>
                          {rm.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.school ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <School size={13} className="text-violet-400" />
                            <span>{u.school.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Platform Root</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={processingId === u.id || u.role === 'SUPER_ADMIN'}
                          title={u.isActive ? "Click to Disable User (Turn OFF)" : "Click to Enable User (Turn ON)"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all disabled:opacity-50 ${
                            u.isActive
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-500"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-500"
                          }`}
                        >
                          <div className={`w-7 h-3.5 rounded-full transition-colors relative ${u.isActive ? "bg-emerald-500" : "bg-rose-500"}`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-all ${u.isActive ? "left-3.5" : "left-0.5"}`} />
                          </div>
                          <span>{u.isActive ? "ON" : "OFF"}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('en-PK')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={processingId === u.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 ${
                              u.isActive
                                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
                            }`}
                          >
                            {processingId === u.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : u.isActive ? (
                              <><Ban size={12} /><span>Deactivate</span></>
                            ) : (
                              <><CheckCircle size={12} /><span>Activate</span></>
                            )}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Showing {filtered.length} of {users.length} users
      </p>
    </div>
  );
}
