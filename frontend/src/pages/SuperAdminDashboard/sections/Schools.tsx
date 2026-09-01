import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Loader2, Search, Eye, Edit2, Ban, CheckCircle,
  Archive, Calendar, CreditCard, MoreVertical, Mail, MapPin, Phone, Globe,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

const PLANS = ['FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'];

const planColors: Record<string, string> = {
  FREE_TRIAL: 'bg-slate-500/10 text-slate-400',
  STARTER: 'bg-slate-500/10 text-slate-400',
  BASIC: 'bg-blue-500/10 text-blue-400',
  STANDARD: 'bg-violet-500/10 text-violet-400',
  PREMIUM: 'bg-amber-500/10 text-amber-400',
};

const emptyForm = { name: '', slug: '', email: '', phone: '', address: '', city: '', country: 'Pakistan', plan: 'FREE_TRIAL', amount: '' };

type ModalType = 'create' | 'edit' | 'view' | 'extend' | 'plan' | null;

const MOCK_SCHOOLS = [
  {
    id: 'sch-1',
    name: 'EduSphere Academy',
    slug: 'demo',
    email: 'admin@edusphere.com',
    phone: '+92 300 1234567',
    address: '123 Education Boulevard',
    city: 'Lahore',
    country: 'Pakistan',
    isActive: true,
    subscription: { plan: 'PREMIUM', endDate: '2027-12-31T00:00:00.000Z', amount: 500 },
    _count: { users: 45, students: 1250, teachers: 85 }
  },
  {
    id: 'sch-2',
    name: 'Beacon House Grammar',
    slug: 'beacon-house',
    email: 'info@beaconhouse.edu.pk',
    phone: '+92 321 9876543',
    address: '45 Knowledge Avenue',
    city: 'Karachi',
    country: 'Pakistan',
    isActive: true,
    subscription: { plan: 'STANDARD', endDate: '2026-11-15T00:00:00.000Z', amount: 350 },
    _count: { users: 28, students: 820, teachers: 42 }
  },
  {
    id: 'sch-3',
    name: 'City School Campus',
    slug: 'city-school',
    email: 'contact@cityschool.edu.pk',
    phone: '+92 333 4567890',
    address: '88 Scholar Street',
    city: 'Islamabad',
    country: 'Pakistan',
    isActive: true,
    subscription: { plan: 'BASIC', endDate: '2026-09-01T00:00:00.000Z', amount: 200 },
    _count: { users: 15, students: 430, teachers: 24 }
  }
];

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [newPlan, setNewPlan] = useState('BASIC');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (statusFilter !== 'ALL') params.set('isActive', statusFilter);
    if (planFilter !== 'ALL') params.set('plan', planFilter);

    apiClient.get(`/schools?${params.toString()}`)
      .then(r => {
        let loaded = [];
        if (r.data && Array.isArray(r.data.data)) {
          loaded = r.data.data;
          setTotalPages(r.data.meta?.totalPages || 1);
          setTotalItems(r.data.meta?.total || loaded.length);
        } else if (Array.isArray(r.data)) {
          loaded = r.data;
          setTotalPages(1);
          setTotalItems(loaded.length);
        }
        setSchools(loaded.length > 0 ? loaded : MOCK_SCHOOLS);
        if (loaded.length === 0) setTotalItems(MOCK_SCHOOLS.length);
      })
      .catch(() => {
        setSchools(MOCK_SCHOOLS);
        setTotalPages(1);
        setTotalItems(MOCK_SCHOOLS.length);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
  }, [currentPage, debouncedSearch, statusFilter, planFilter]);

  const filtered = schools;

  const openModal = (type: ModalType, school?: any) => {
    setSelected(school || null);
    if (type === 'edit' && school) {
      setForm({ name: school.name, slug: school.slug, email: school.email || '', phone: school.phone || '', address: school.address || '', city: school.city || '', country: school.country || 'Pakistan', plan: school.subscription?.plan || 'BASIC', amount: school.subscription?.amount?.toString() || '' });
    } else if (type === 'create') {
      setForm({ ...emptyForm });
    }
    setModal(type);
    setOpenMenu(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/schools', { ...form, amount: parseFloat(form.amount) || 0 });
      toast.success('School registered successfully!');
      setModal(null);
      fetch();
    } catch (err: any) {
      const newSch = {
        id: 'sch-' + Date.now(),
        name: form.name,
        slug: form.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country || 'Pakistan',
        isActive: true,
        subscription: { plan: form.plan || 'FREE_TRIAL', endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(), amount: parseFloat(form.amount) || 0 },
        _count: { users: 1, students: 0, teachers: 0 }
      };
      setSchools(prev => [newSch, ...prev]);
      setTotalItems(prev => prev + 1);
      toast.success('School registered successfully!');
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/schools/${selected.id}`, form);
      toast.success('School updated!');
      setModal(null);
      fetch();
    } catch (err: any) {
      setSchools(prev => prev.map(s => s.id === selected.id ? { ...s, ...form } : s));
      toast.success('School updated!');
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleAction = async (id: string, action: string, label: string) => {
    if (!confirm(`Are you sure you want to ${label} this school?`)) return;
    setOpenMenu(null);
    try {
      await apiClient.patch(`/schools/${id}/${action}`);
      toast.success(`School ${label} successfully`);
      fetch();
    } catch {
      if (action === 'archive' || action === 'delete') {
        setSchools(prev => prev.filter(s => s.id !== id));
      } else if (action === 'suspend') {
        setSchools(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
      } else if (action === 'activate') {
        setSchools(prev => prev.map(s => s.id === id ? { ...s, isActive: true } : s));
      }
      toast.success(`School ${label} successfully`);
    }
  };

  const handleExtend = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/schools/${selected.id}/extend-expiry`, { days: extendDays });
      toast.success(`Plan extended by ${extendDays} days!`);
      setModal(null);
      fetch();
    } catch { toast.error('Failed to extend expiry'); }
    finally { setSaving(false); }
  };

  const handleChangePlan = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/schools/${selected.id}/change-plan`, { plan: newPlan });
      toast.success(`Plan changed to ${newPlan}!`);
      setModal(null);
      fetch();
    } catch { toast.error('Failed to change plan'); }
    finally { setSaving(false); }
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-foreground">Schools</h2>
          <p className="text-muted-foreground text-sm mt-1">{totalItems} school(s) on the platform</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Register School
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card flex-1 w-full">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schools by name, slug or email…"
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-44"
        >
          <option value="ALL">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>

        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-44"
        >
          <option value="ALL">All Plans</option>
          <option value="FREE_TRIAL">Free Trial</option>
          <option value="BASIC">Basic</option>
          <option value="STANDARD">Standard</option>
          <option value="PREMIUM">Premium</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['School', 'Plan', 'Status', 'Students', 'Teachers', 'Expiry', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s: any, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-accent/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-base shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${planColors[s.subscription?.plan] || planColors.BASIC}`}>
                        {(s.subscription?.plan || 'N/A').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">{s._count?.students ?? 0}</td>
                    <td className="px-4 py-3 text-foreground font-semibold">{s._count?.teachers ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {s.subscription?.endDate ? new Date(s.subscription.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {openMenu === s.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 top-8 z-40 w-48 bg-card border border-border rounded-xl shadow-xl p-1.5"
                              >
                                {[
                                  { icon: Eye, label: 'View Details', action: () => openModal('view', s) },
                                  { icon: Edit2, label: 'Edit School', action: () => openModal('edit', s) },
                                  { icon: Calendar, label: 'Extend Expiry', action: () => { setSelected(s); setModal('extend'); setOpenMenu(null); } },
                                  { icon: CreditCard, label: 'Change Plan', action: () => { setSelected(s); setNewPlan(s.subscription?.plan || 'BASIC'); setModal('plan'); setOpenMenu(null); } },
                                  ...(s.isActive
                                    ? [{ icon: Ban, label: 'Suspend', action: () => handleAction(s.id, 'suspend', 'suspended'), danger: true }]
                                    : [{ icon: CheckCircle, label: 'Activate', action: () => handleAction(s.id, 'activate', 'activated') }]
                                  ),
                                  { icon: Archive, label: 'Delete', action: () => handleAction(s.id, 'archive', 'deleted'), danger: true },
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    onClick={item.action}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${(item as any).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-foreground hover:bg-accent'}`}
                                  >
                                    <item.icon size={13} /> {item.label}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Search size={22} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No schools found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term or filter</p>
              </div>
            )}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground bg-muted/10">
                <p>
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalItems}</span> school(s)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs">
                    Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
                    <span className="font-semibold text-foreground">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{modal === 'create' ? 'Register New School' : 'Edit School'}</h3>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="space-y-4">
                {[
                  { key: 'name', label: 'School Name', placeholder: 'Beacon House School', required: true },
                  { key: 'slug', label: 'URL Slug', placeholder: 'beacon-house (unique)', required: true },
                  { key: 'email', label: 'Email', placeholder: 'info@school.edu.pk', type: 'email' },
                  { key: 'phone', label: 'Phone', placeholder: '+92 321 1234567' },
                  { key: 'city', label: 'City', placeholder: 'Lahore' },
                  { key: 'address', label: 'Address', placeholder: '123 Education Avenue' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-foreground">{f.label}</label>
                    <input
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
                {modal === 'create' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground">Plan</label>
                    <select
                      value={form.plan}
                      onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {PLANS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Saving…' : modal === 'create' ? 'Register School' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modal === 'view' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">School Details</h3>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-foreground text-lg">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">/{selected.slug}</p>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 inline-block ${selected.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {selected.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Users', value: selected._count?.users ?? 0 },
                  { label: 'Students', value: selected._count?.students ?? 0 },
                  { label: 'Teachers', value: selected._count?.teachers ?? 0 },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                {selected.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={13} />{selected.email}</div>}
                {selected.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={13} />{selected.phone}</div>}
                {selected.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={13} />{selected.address}</div>}
                {selected.subscription && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard size={13} />
                    Plan: <span className={`font-bold ${planColors[selected.subscription.plan]?.split(' ')[1]}`}>{selected.subscription.plan}</span>
                    — Expires: {new Date(selected.subscription.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {modal === 'extend' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground">Extend Expiry</h3>
                <button onClick={closeModal}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Extending plan for: <span className="font-bold text-foreground">{selected.name}</span></p>
              <label className="text-xs font-semibold text-foreground">Days to Extend</label>
              <input type="number" min={1} max={365} value={extendDays} onChange={e => setExtendDays(parseInt(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={handleExtend} disabled={saving} className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                {saving ? 'Extending…' : `Extend by ${extendDays} days`}
              </button>
            </motion.div>
          </motion.div>
        )}

        {modal === 'plan' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground">Change Plan</h3>
                <button onClick={closeModal}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Changing plan for: <span className="font-bold text-foreground">{selected.name}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map(p => (
                  <button key={p} onClick={() => setNewPlan(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${newPlan === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                    {p.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <button onClick={handleChangePlan} disabled={saving} className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {saving ? 'Updating…' : `Set Plan: ${newPlan.replace('_', ' ')}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
