import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Check, CheckCheck, Trash2, Filter,
  GraduationCap, DollarSign, Calendar, FileText, UserCheck,
  AlertCircle, BookOpen, Award, Clock, ChevronDown, MailOpen, X,
  Send, MessageSquare, Smartphone, Mail, ShieldAlert, Sparkles, Plus, Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type NotificationType = 'fee' | 'attendance' | 'homework' | 'exam' | 'registration' | 'announcement' | 'system';
type NotificationPriority = 'NORMAL' | 'URGENT' | 'CRITICAL';
type TargetChannel = 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority?: NotificationPriority;
  channel?: TargetChannel;
  targetAudience?: string;
}

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string; badge: string }> = {
  fee: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', badge: 'Finance & Dues' },
  attendance: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', badge: 'Attendance Alert' },
  homework: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', badge: 'Homework & Assignment' },
  exam: { icon: Award, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20', badge: 'Examination Board' },
  registration: { icon: UserCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20', badge: 'Enrollment & Staff' },
  announcement: { icon: BellRing, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', badge: 'Official Circular' },
  system: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', badge: 'System Security' },
};

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'fee',
    title: 'Tuition Fee Settlement Confirmed',
    message: 'Aarav Sharma (Class 10-A) settled Rs 15,000 for Q2 tuition fee via Online JazzCash Transfer.',
    time: '5 minutes ago',
    read: false,
    priority: 'NORMAL',
    channel: 'IN_APP',
    targetAudience: 'Accounts Dept',
  },
  {
    id: 'notif-2',
    type: 'attendance',
    title: 'Low Class Attendance Alert (<80%)',
    message: 'Class 5-B recorded only 72% attendance today (9 students absent without prior leave notice).',
    time: '25 minutes ago',
    read: false,
    priority: 'URGENT',
    channel: 'SMS',
    targetAudience: 'Class 5 Incharge',
  },
  {
    id: 'notif-3',
    type: 'exam',
    title: 'Midterm Date Sheet Approved & Published',
    message: 'Official date sheet for Fall 2026 Examination has been dispatched to all 165 enrolled students and parent portals.',
    time: '1 hour ago',
    read: false,
    priority: 'NORMAL',
    channel: 'WHATSAPP',
    targetAudience: 'All Parents & Students',
  },
  {
    id: 'notif-4',
    type: 'homework',
    title: 'Physics Homework Submissions Due Tomorrow',
    message: 'Class 10-A assignment "Kinematics & Newton Laws" is due at 09:00 AM. 6 students have pending submissions.',
    time: '3 hours ago',
    read: false,
    priority: 'NORMAL',
    channel: 'IN_APP',
    targetAudience: 'Class 10-A',
  },
  {
    id: 'notif-5',
    type: 'announcement',
    title: 'Annual Sports Day & Parent Orientation Gala',
    message: 'Official circular: The annual sports fest will take place on October 24. Teachers are requested to finalize athlete lists.',
    time: '5 hours ago',
    read: true,
    priority: 'NORMAL',
    channel: 'EMAIL',
    targetAudience: 'All Faculty & Staff',
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'Automated Cloud Database Backup Succeeded',
    message: 'Daily snapshot of student marks, financial ledgers, and staff logs completed with 100% integrity.',
    time: 'Yesterday at 11:59 PM',
    read: true,
    priority: 'NORMAL',
    channel: 'IN_APP',
    targetAudience: 'System Administrator',
  },
];

export default function Notifications() {
  const { user } = useAuth();
  const schoolSlug = user?.schoolSlug || '';
  const storageKey = `edusphere_notifications_${schoolSlug}`;

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | NotificationType>('all');
  const [search, setSearch] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // New Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    priority: 'NORMAL' as NotificationPriority,
    channel: 'IN_APP' as TargetChannel,
    targetAudience: 'All School Students & Parents',
  });

  const saveNotifications = (newList: Notification[]) => {
    setNotifications(newList);
    localStorage.setItem(storageKey, JSON.stringify(newList));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    const q = search.toLowerCase();
    const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'urgent') return n.priority === 'URGENT' || n.priority === 'CRITICAL';
    return n.type === filter;
  });

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    toast.success('All notifications marked as read!');
  };

  const deleteNotif = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    if (selectedNotif?.id === id) setSelectedNotif(null);
    toast.success('Notification removed.');
  };

  const clearAll = () => {
    if (!confirm('Clear all notifications from this inbox?')) return;
    saveNotifications([]);
    setSelectedNotif(null);
    toast.success('Notification inbox cleared.');
  };

  // Handle Broadcast Submission
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: broadcastForm.type,
      title: broadcastForm.title.trim(),
      message: broadcastForm.message.trim(),
      time: 'Just now',
      read: false,
      priority: broadcastForm.priority,
      channel: broadcastForm.channel,
      targetAudience: broadcastForm.targetAudience,
    };

    const updated = [newNotif, ...notifications];
    saveNotifications(updated);

    toast.success(`Broadcast sent via ${broadcastForm.channel} to ${broadcastForm.targetAudience}!`);
    setShowBroadcastModal(false);
    setBroadcastForm({
      title: '',
      message: '',
      type: 'announcement',
      priority: 'NORMAL',
      channel: 'IN_APP',
      targetAudience: 'All School Students & Parents',
    });
  };

  return (
    <div className="space-y-7 max-w-screen-2xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
              Communications & Broadcast Center
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Notifications & Alerts
            {unreadCount > 0 && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time multi-channel alerts, fee payment logs, attendance warnings, and instant school-wide announcements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 shadow-sm"
            >
              <CheckCheck size={15} /> Mark All Read
            </button>
          )}

          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
          >
            <Trash2 size={14} /> Clear Inbox
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> New Broadcast Alert
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notification title, message, student name, or target audience..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <Filter size={13} className="text-muted-foreground mr-1 shrink-0" />
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'urgent', label: 'Urgent Only' },
            { id: 'fee', label: 'Finance' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'exam', label: 'Exams' },
            { id: 'announcement', label: 'Circulars' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item, idx) => {
            const conf = typeConfig[item.type] || typeConfig.announcement;
            const Icon = conf.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  markAsRead(item.id);
                  setSelectedNotif(item);
                }}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  item.read
                    ? 'bg-card/70 border-border hover:border-primary/30'
                    : 'bg-card border-primary/40 shadow-md shadow-primary/5 hover:border-primary'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-2xl ${conf.bg} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={20} className={conf.color} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                      )}
                      <h3 className={`text-sm font-extrabold ${item.read ? 'text-foreground/90' : 'text-foreground'}`}>
                        {item.title}
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>
                        {conf.badge}
                      </span>
                      {item.priority === 'URGENT' && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Urgent
                        </span>
                      )}
                      {item.channel && (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          {item.channel === 'WHATSAPP' && <Smartphone size={10} className="text-emerald-500" />}
                          {item.channel === 'SMS' && <MessageSquare size={10} className="text-blue-500" />}
                          {item.channel === 'EMAIL' && <Mail size={10} className="text-violet-500" />}
                          via {item.channel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {item.time}
                      </span>
                      {item.targetAudience && (
                        <>
                          <span>•</span>
                          <span>Audience: <strong className="text-foreground">{item.targetAudience}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!item.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all text-xs font-bold"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif(item.id);
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-3xl">
            <Bell size={48} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold text-foreground">No Notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">All clear! No pending alerts matching your current filter.</p>
          </div>
        )}
      </div>

      {/* 4. Send Broadcast / Announcement Modal */}
      <Modal isOpen={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Send size={20} />}
          title="Send Broadcast Alert"
          subtitle="Dispatch immediate circulars to students, faculty or parents"
          onClose={() => setShowBroadcastModal(false)}
        />
        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs p-6">
          <div>
            <label className="block font-bold text-foreground mb-1.5">Broadcast Title *</label>
            <input
              value={broadcastForm.title}
              onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              required
              placeholder="e.g. Weather Alert: School Timing Adjusted"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-foreground mb-1.5">Alert Category</label>
              <select
                value={broadcastForm.type}
                onChange={e => setBroadcastForm({ ...broadcastForm, type: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
              >
                <option value="announcement">Official Announcement</option>
                <option value="fee">Finance & Fee Alert</option>
                <option value="attendance">Attendance Notice</option>
                <option value="exam">Examination Circular</option>
                <option value="homework">Homework / Task</option>
                <option value="system">Emergency System</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1.5">Priority Level</label>
              <select
                value={broadcastForm.priority}
                onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="URGENT">Urgent Alert</option>
                <option value="CRITICAL">Critical Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-foreground mb-1.5">Delivery Channel</label>
              <select
                value={broadcastForm.channel}
                onChange={e => setBroadcastForm({ ...broadcastForm, channel: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
              >
                <option value="IN_APP">In-App Notification</option>
                <option value="SMS">SMS Direct Gateway</option>
                <option value="WHATSAPP">WhatsApp Automated API</option>
                <option value="EMAIL">Email Dispatch</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1.5">Target Audience</label>
              <select
                value={broadcastForm.targetAudience}
                onChange={e => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:border-primary"
              >
                <option value="All School Students & Parents">All Students & Parents</option>
                <option value="All Teaching Faculty">All Teaching Faculty</option>
                <option value="Class 10-A & 10-B (Senior)">Class 10 Senior Wing</option>
                <option value="Class 9-A & 9-B">Class 9 Wing</option>
                <option value="Fee Defaulter Parents">Parents of Fee Defaulters</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1.5">Broadcast Message Content *</label>
            <textarea
              rows={4}
              value={broadcastForm.message}
              onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              required
              placeholder="Type the full official announcement message to be delivered..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg flex items-center gap-2"
            >
              <Send size={15} /> Dispatch Broadcast
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Detail View Drawer / Modal */}
      <Modal isOpen={!!selectedNotif} onClose={() => setSelectedNotif(null)} maxWidth="max-w-md">
        {selectedNotif && (
          <div className="p-6">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {selectedNotif.type}
                </span>
                <h3 className="text-base font-extrabold text-foreground mt-2">{selectedNotif.title}</h3>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-foreground leading-relaxed bg-accent/20 p-3.5 rounded-xl border border-border">
                {selectedNotif.message}
              </p>

              <div className="space-y-1.5 pt-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Dispatched:</span>
                  <strong className="text-foreground">{selectedNotif.time}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Channel:</span>
                  <strong className="text-foreground">{selectedNotif.channel || 'In-App'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Audience:</span>
                  <strong className="text-foreground">{selectedNotif.targetAudience || 'School General'}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => {
                  deleteNotif(selectedNotif.id);
                }}
                className="px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 font-bold text-xs"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
