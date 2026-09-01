import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Plus, X, Loader2, Globe, Mail, MapPin, GraduationCap, UserCheck } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export function SuperAdminPanel() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/schools/analytics').then(r => setAnalytics(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Schools', value: analytics?.totalSchools, icon: School, color: 'from-violet-500 to-purple-600' },
    { label: 'Total Students', value: analytics?.totalStudents, icon: GraduationCap, color: 'from-blue-500 to-cyan-600' },
    { label: 'Total Teachers', value: analytics?.totalTeachers, icon: UserCheck, color: 'from-emerald-500 to-teal-600' },
    { label: 'Active Subscriptions', value: analytics?.activeSubscriptions, icon: Globe, color: 'from-orange-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Super Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide analytics and management</p>
      </div>
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-xl`}>
              <s.icon size={24} className="text-white/70 mb-3" />
              <p className="text-white/70 text-xs font-medium">{s.label}</p>
              <p className="text-3xl font-black mt-1">{loading ? '...' : (s.value ?? 0)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ManageSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', email: '', phone: '', address: '' });

  const fetchSchools = () => {
    setLoading(true);
    apiClient.get('/schools').then(r => setSchools(r.data)).catch(() => toast.error('Failed to load schools')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/schools', form);
      toast.success('School registered!');
      setShowAdd(false);
      setForm({ name: '', slug: '', email: '', phone: '', address: '' });
      fetchSchools();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register school');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Manage Schools</h1>
          <p className="text-muted-foreground text-sm mt-1">{schools.length} school(s) on the platform</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all">
          <Plus size={16} /> Register School
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Register New School</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { key: 'name', label: 'School Name', placeholder: 'Green Valley High School' },
                  { key: 'slug', label: 'School Slug (URL)', placeholder: 'green-valley (unique)' },
                  { key: 'email', label: 'School Email', placeholder: 'info@greenvalley.edu', type: 'email' },
                  { key: 'phone', label: 'Phone', placeholder: '+1 555 123 4567' },
                  { key: 'address', label: 'Address', placeholder: '123 Education Blvd' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-foreground">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      type={f.type || 'text'} placeholder={f.placeholder}
                      required={['name', 'slug'].includes(f.key)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                ))}
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Registering...' : 'Register School'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schools.map((s: any, i: number) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.slug}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1.5">
                {s.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={11} />{s.email}</div>}
                {s.address && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={11} />{s.address}</div>}
              </div>
              {s._count && (
                <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-black text-foreground">{s._count.users}</p><p className="text-[10px] text-muted-foreground">Users</p></div>
                  <div><p className="text-lg font-black text-foreground">{s._count.students}</p><p className="text-[10px] text-muted-foreground">Students</p></div>
                  <div><p className="text-lg font-black text-foreground">{s._count.teachers}</p><p className="text-[10px] text-muted-foreground">Teachers</p></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
