import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Calendar, FileText, User, X, Loader2, BellRing, Volume2,
  Search, Filter, Pin, PinOff, AlertTriangle, Info, Megaphone, Star,
  TrendingUp, Eye, Archive, CheckCircle, Clock, Tag, ChevronRight, Edit2,
  Download, Share2, Bookmark, MoreVertical
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Types & Interfaces ────────────────────────────────────────────────────────

interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'ACADEMIC' | 'EVENT' | 'HOLIDAY' | 'SPORTS' | 'EXAM' | 'GENERAL' | 'URGENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  targetRoles: 'ALL' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ADMIN';
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
  publishedBy?: {
    id: string;
    name: string;
    role: string;
  };
  viewCount?: number;
  attachments?: string[];
}

// ─── Constants & Helpers ───────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'ACADEMIC', label: 'Academic', icon: FileText, color: 'from-blue-500 to-cyan-500' },
  { value: 'EVENT', label: 'Event', icon: Star, color: 'from-violet-500 to-purple-500' },
  { value: 'HOLIDAY', label: 'Holiday', icon: Calendar, color: 'from-emerald-500 to-teal-500' },
  { value: 'SPORTS', label: 'Sports', icon: TrendingUp, color: 'from-orange-500 to-amber-500' },
  { value: 'EXAM', label: 'Exam', icon: AlertTriangle, color: 'from-rose-500 to-pink-500' },
  { value: 'GENERAL', label: 'General', icon: Info, color: 'from-slate-500 to-gray-500' },
  { value: 'URGENT', label: 'Urgent', icon: Megaphone, color: 'from-red-500 to-rose-600' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

const TARGET_ROLES = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'TEACHER', label: 'Staff Only' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'PARENT', label: 'Parents' },
  { value: 'ADMIN', label: 'Administration' },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────────

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetails, setShowDetails] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [targetFilter, setTargetFilter] = useState<string>('ALL');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL' as Notice['category'],
    priority: 'MEDIUM' as Notice['priority'],
    targetRoles: 'ALL' as Notice['targetRoles'],
    isPinned: false,
    expiresAt: '',
  });

  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';

  const fetchNotices = () => {
    setLoading(true);
    apiClient.get('/academics/announcements')
      .then(res => setNotices(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        setNotices([]);
        toast.error('Unable to load notices. Please try again.');
      })
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
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        targetRoles: 'ALL',
        isPinned: false,
        expiresAt: '',
      });
      fetchNotices();
    } catch {
      toast.error('Failed to publish notice');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await apiClient.delete(`/academics/announcements/${id}`);
      toast.success('Notice deleted successfully!');
      fetchNotices();
    } catch { toast.error('Failed to delete notice'); }
  };

  const handleTogglePin = async (notice: Notice) => {
    try {
      await apiClient.patch(`/academics/announcements/${notice.id}`, { isPinned: !notice.isPinned });
      toast.success(notice.isPinned ? 'Notice unpinned' : 'Notice pinned successfully!');
      fetchNotices();
    } catch { toast.error('Failed to update notice'); }
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || n.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
    const matchesTarget = targetFilter === 'ALL' || n.targetRoles === targetFilter;
    const matchesPinned = !pinnedOnly || n.isPinned;

    // Filter out expired notices
    const isExpired = n.expiresAt && new Date(n.expiresAt) < new Date();

    return matchesSearch && matchesCategory && matchesPriority && matchesTarget && matchesPinned && !isExpired;
  });

  // Calculate metrics
  const totalNotices = notices.length;
  const pinnedCount = notices.filter(n => n.isPinned).length;
  const urgentCount = notices.filter(n => n.priority === 'URGENT').length;
  const totalViews = notices.reduce((sum, n) => sum + (n.viewCount || 0), 0);
  const expiringSoon = notices.filter(n => {
    if (!n.expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(n.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }).length;

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">
              School Communication Hub
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Official announcements, exam schedules, events & important updates
          </p>
        </div>

        {isSchoolAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                const rows = filteredNotices.map(n =>
                  `"${n.title}","${n.category}","${n.priority}","${n.targetRoles}","${new Date(n.publishedAt).toLocaleDateString()}","${n.viewCount || 0}"`
                ).join('\n');
                const blob = new Blob([`Title,Category,Priority,Target,Published Date,Views\n${rows}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Notice_Report_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Report exported successfully!');
              }}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
            >
              <Plus size={16} /> Create Notice
            </button>
          </div>
        )}
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Notices</span>
          </div>
          <p className="text-2xl font-black text-foreground">{totalNotices}</p>
          <p className="text-[10px] text-violet-400 mt-1">Active announcements</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Pin size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Pinned</span>
          </div>
          <p className="text-2xl font-black text-foreground">{pinnedCount}</p>
          <p className="text-[10px] text-amber-400 mt-1">Important alerts</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Urgent</span>
          </div>
          <p className="text-2xl font-black text-foreground">{urgentCount}</p>
          <p className="text-[10px] text-rose-400 mt-1">High priority</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Views</span>
          </div>
          <p className="text-2xl font-black text-foreground">{totalViews}</p>
          <p className="text-[10px] text-emerald-400 mt-1">Engagement metric</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Expiring Soon</span>
          </div>
          <p className="text-2xl font-black text-foreground">{expiringSoon}</p>
          <p className="text-[10px] text-blue-400 mt-1">Within 7 days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notices by title or content..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Categories</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              value={targetFilter}
              onChange={e => setTargetFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Targets</option>
              {TARGET_ROLES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <button
              onClick={() => setPinnedOnly(!pinnedOnly)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                pinnedOnly
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              <Pin size={12} />
              Pinned Only
            </button>
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card">
          <Volume2 size={52} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-black text-foreground">No Notices Found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Try adjusting your filters or create a new notice.
          </p>
          {isSchoolAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md"
            >
              + Create First Notice
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNotices.map((notice, idx) => {
            const categoryConfig = CATEGORY_OPTIONS.find(c => c.value === notice.category) || CATEGORY_OPTIONS[6];
            const priorityConfig = PRIORITY_OPTIONS.find(p => p.value === notice.priority) || PRIORITY_OPTIONS[0];
            const CategoryIcon = categoryConfig.icon;
            const daysUntilExpiry = notice.expiresAt
              ? Math.ceil((new Date(notice.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-card border rounded-2xl p-5 hover:shadow-lg transition-all duration-200 group ${
                  notice.isPinned ? 'border-amber-500/40 shadow-md shadow-amber-500/10' : 'border-border'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center shrink-0`}>
                      <CategoryIcon size={14} />
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig.color}`}>
                        {notice.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {notice.isPinned && <Pin size={14} className="text-amber-400" />}
                    {isSchoolAdmin && (
                      <button
                        onClick={() => handleTogglePin(notice)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title={notice.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {notice.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    )}
                    {isSchoolAdmin && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {notice.title}
                </h3>

                {/* Content Preview */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                  {notice.content}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(notice.publishedAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {notice.viewCount || 0} views
                  </span>
                  {daysUntilExpiry !== null && (
                    <>
                      <span>•</span>
                      <span className={daysUntilExpiry <= 3 ? 'text-rose-400 font-bold' : ''}>
                        {daysUntilExpiry > 0 ? `${daysUntilExpiry}d left` : 'Expired'}
                      </span>
                    </>
                  )}
                </div>

                {/* Target Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-0.5 rounded-lg bg-accent/50 text-accent-foreground text-[10px] font-bold border border-border">
                    {TARGET_ROLES.find(t => t.value === notice.targetRoles)?.label || notice.targetRoles}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowDetails(notice)}
                  className="w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Read More</span>
                  <ChevronRight size={12} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Notice Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<Megaphone size={22} />}
          title="Create Notice"
          subtitle="Publish new announcement"
          onClose={() => setShowAdd(false)}
        />
        <form onSubmit={handleAdd} className="space-y-4 text-sm p-6">
                <div>
                  <label className="block font-bold text-foreground mb-1.5">Notice Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter notice title..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Content *</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="Write detailed notice content..."
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Category *</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Priority *</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Target Audience *</label>
                    <select
                      value={form.targetRoles}
                      onChange={e => setForm({ ...form, targetRoles: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {TARGET_ROLES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Expiration Date</label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={form.isPinned}
                    onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                    className="rounded text-primary border-border focus:ring-primary/50 h-4 w-4"
                  />
                  <label htmlFor="isPinned" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Pin this notice to top
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Publishing...' : 'Publish Notice'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* Notice Details Modal */}
      <Modal isOpen={!!showDetails} onClose={() => setShowDetails(null)} maxWidth="max-w-2xl">
        {showDetails && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Notice Details</h2>
                  <p className="text-xs text-muted-foreground">Full announcement view</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(null)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const categoryConfig = CATEGORY_OPTIONS.find(c => c.value === showDetails.category) || CATEGORY_OPTIONS[6];
                  const CategoryIcon = categoryConfig.icon;
                  return (
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${categoryConfig.color} text-white flex items-center justify-center`}>
                      <CategoryIcon size={18} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-lg font-bold text-foreground">{showDetails.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{new Date(showDetails.publishedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{showDetails.viewCount || 0} views</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  PRIORITY_OPTIONS.find(p => p.value === showDetails.priority)?.color || ''
                }`}>
                  {showDetails.priority}
                </span>
                <span className="px-3 py-1 rounded-full bg-accent/50 text-accent-foreground text-xs font-bold border border-border">
                  {TARGET_ROLES.find(t => t.value === showDetails.targetRoles)?.label || showDetails.targetRoles}
                </span>
                {showDetails.isPinned && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20 flex items-center gap-1">
                    <Pin size={10} /> Pinned
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-accent/30 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{showDetails.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Published By</p>
                  <p className="font-bold text-foreground">{showDetails.publishedBy?.name || 'Administration'}</p>
                </div>
                {showDetails.expiresAt && (
                  <div>
                    <p className="text-muted-foreground mb-1">Expires On</p>
                    <p className="font-bold text-foreground">{new Date(showDetails.expiresAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
