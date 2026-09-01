import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Check, CheckCheck, Trash2, Filter,
  GraduationCap, DollarSign, Calendar, FileText, UserCheck,
  AlertCircle, BookOpen, Award, Clock, ChevronDown, MailOpen, X
} from 'lucide-react';

type NotificationType = 'fee' | 'attendance' | 'homework' | 'exam' | 'registration' | 'announcement' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const typeConfig: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  fee: { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  attendance: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500' },
  homework: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500' },
  exam: { icon: Award, color: 'text-violet-500', bg: 'bg-violet-500' },
  registration: { icon: UserCheck, color: 'text-cyan-500', bg: 'bg-cyan-500' },
  announcement: { icon: BellRing, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  system: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500' },
};

const initialNotifications: Notification[] = [
  { id: '1', type: 'fee', title: 'Fee Payment Received', message: 'Aarav Sharma (Class 10-A) paid ₹15,000 for Q2 tuition fee via Online payment.', time: '2 minutes ago', read: false },
  { id: '2', type: 'registration', title: 'New Student Registration', message: 'A new student registration request from Priya Gupta for Class 8-B admission has been submitted.', time: '15 minutes ago', read: false },
  { id: '3', type: 'attendance', title: 'Low Attendance Alert', message: 'Class 5-A attendance dropped below 75% today. 12 out of 40 students are absent.', time: '1 hour ago', read: false },
  { id: '4', type: 'homework', title: 'Homework Submission Deadline', message: 'Mathematics homework for Class 9-A is due tomorrow. 8 students haven\'t submitted yet.', time: '2 hours ago', read: false },
  { id: '5', type: 'exam', title: 'Exam Results Published', message: 'Mid-term examination results for Classes 6-10 have been published and are now visible to parents.', time: '3 hours ago', read: true },
  { id: '6', type: 'announcement', title: 'Annual Day Preparations', message: 'Annual Day celebrations scheduled for July 20, 2026. All class teachers are requested to submit participation lists.', time: '5 hours ago', read: true },
  { id: '7', type: 'fee', title: 'Fee Payment Overdue', message: '15 students in Class 7 have overdue fee payments for more than 30 days. Reminder SMS sent.', time: '6 hours ago', read: true },
  { id: '8', type: 'system', title: 'System Backup Completed', message: 'Daily automated backup completed successfully. All data has been securely backed up to cloud storage.', time: '8 hours ago', read: true },
  { id: '9', type: 'registration', title: 'Teacher Profile Updated', message: 'Ms. Ranjana Verma (Science Department) updated her profile details and qualification documents.', time: 'Yesterday', read: true },
  { id: '10', type: 'attendance', title: 'Monthly Attendance Report', message: 'June 2026 attendance report is ready for download. Overall school attendance: 91.3%.', time: 'Yesterday', read: true },
  { id: '11', type: 'homework', title: 'New Homework Assigned', message: 'English homework "Essay Writing — My Favorite Season" assigned to Class 8-A, due July 8.', time: '2 days ago', read: true },
  { id: '12', type: 'exam', title: 'Exam Schedule Released', message: 'Final term exam schedule for July 2026 has been finalized and shared with all stakeholders.', time: '3 days ago', read: true },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };

  const clearAll = () => {
    setNotifications([]);
    setSelectedNotif(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-black px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with real-time alerts and activity</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all">
            <Trash2 size={15} /> Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
            }`}>{tab.count}</span>
          </button>
        ))}
        <div className="h-5 w-px bg-border mx-1" />
        {(Object.keys(typeConfig) as NotificationType[]).map(type => {
          const cfg = typeConfig[type];
          const Icon = cfg.icon;
          const count = notifications.filter(n => n.type === type).length;
          if (count === 0) return null;
          return (
            <button key={type} onClick={() => setFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === type
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              <Icon size={13} /> <span className="capitalize hidden sm:inline">{type}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                filter === type ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Layout: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Notification List */}
        <div className="lg:col-span-3 space-y-2">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 bg-card border border-border rounded-2xl">
              <Bell size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-bold text-foreground text-lg">All caught up!</p>
              <p className="text-muted-foreground text-sm mt-1">No notifications to display.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map((notif, i) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                const isSelected = selectedNotif?.id === notif.id;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelectedNotif(notif); markAsRead(notif.id); }}
                    className={`group relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/10'
                        : notif.read
                          ? 'bg-card border-border hover:bg-accent/30'
                          : 'bg-card border-border hover:bg-accent/30 border-l-4 border-l-primary'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}/15`}>
                      <Icon size={18} className={cfg.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${notif.read ? 'text-foreground/80' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1 pulse-dot" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> {notif.time}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${cfg.bg}/10 ${cfg.color}`}>
                          {notif.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.read && (
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          title="Mark as read"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-0">
            {selectedNotif ? (
              <motion.div
                key={selectedNotif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${typeConfig[selectedNotif.type].bg}/10 ${typeConfig[selectedNotif.type].color}`}>
                    {selectedNotif.type}
                  </span>
                  <button onClick={() => setSelectedNotif(null)} className="text-muted-foreground hover:text-foreground p-1">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${typeConfig[selectedNotif.type].bg}/15`}>
                    {(() => { const Icon = typeConfig[selectedNotif.type].icon; return <Icon size={22} className={typeConfig[selectedNotif.type].color} />; })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedNotif.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {selectedNotif.time}
                    </p>
                  </div>
                </div>

                <div className="bg-accent/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-foreground leading-relaxed">{selectedNotif.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteNotif(selectedNotif.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  {!selectedNotif.read && (
                    <button
                      onClick={() => markAsRead(selectedNotif.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                    >
                      <Check size={14} /> Mark Read
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <MailOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="font-bold text-foreground">Select a notification</p>
                <p className="text-sm text-muted-foreground mt-1">Click on any notification to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
