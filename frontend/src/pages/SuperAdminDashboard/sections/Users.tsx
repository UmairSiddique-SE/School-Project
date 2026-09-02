import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon, Search, Shield, UserCheck, Ban, CheckCircle,
  Mail, Phone, School, Calendar, Filter, Loader2, RefreshCw
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
  school?: {
    id: string;
    name: string;
    slug: string;
  };
}

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: PlatformUser) => {
    setProcessingId(user.id);
    try {
      await apiClient.patch(`/admin/users/${user.id}/toggle-status`);
      toast.success(`User ${user.name} is now ${user.isActive ? 'Deactivated' : 'Activated'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.school?.name && u.school.name.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'SCHOOL_ADMIN':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'TEACHER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'STUDENT':
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
            <Shield size={12} />
            <span>Identity & Access Governance</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Platform Users</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage school owners, administrative personnel, and system privileges.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex items-center gap-3 px-4 py-3 rounded-[20px] border border-white/[0.05] bg-slate-900/40 backdrop-blur-xl flex-1 w-full group focus-within:border-violet-500/40 transition-all">
          <Search size={16} className="text-slate-500 group-focus-within:text-violet-400 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or affiliated campus..."
            className="bg-transparent border-none text-sm outline-none flex-1 text-white placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-9 pr-8 py-3 rounded-[18px] border border-white/[0.05] bg-slate-900/40 text-white text-[12px] font-bold appearance-none cursor-pointer focus:outline-none focus:border-violet-500/40 min-w-[150px]"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins</option>
              <option value="SCHOOL_ADMIN">School Admins</option>
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[28px] border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} className="animate-spin text-violet-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-white font-bold text-base">No Users Found</p>
            <p className="text-slate-500 text-xs mt-1">Try modifying your query or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Campus Association</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-xs">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-300 font-black flex items-center justify-center text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{u.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tight ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.school ? (
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <School size={13} className="text-violet-400" />
                          <span>{u.school.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Platform Root</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={processingId === u.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            u.isActive
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          }`}
                        >
                          {processingId === u.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : u.isActive ? (
                            <>
                              <Ban size={12} />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
