import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LockKeyhole, Mail, Moon, Phone, Save, ShieldCheck, Sun,
  UserRound, Building2, KeyRound, Sparkles, Check, CheckCircle2,
  Globe, MapPin, Upload, ExternalLink, School
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import apiClient from '@/api/apiClient';

export default function Settings() {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // School Website Customization State (for SCHOOL_ADMIN)
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const [schoolData, setSchoolData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    website: '',
    logoUrl: '',
    slug: '',
  });
  const [savingSchool, setSavingSchool] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(false);

  useEffect(() => {
    if (isSchoolAdmin) {
      setLoadingSchool(true);
      apiClient.get('/schools/my-school/profile')
        .then((res) => {
          setSchoolData({
            name: res.data.name || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            address: res.data.address || '',
            city: res.data.city || '',
            website: res.data.website || '',
            logoUrl: res.data.logoUrl || '',
            slug: res.data.slug || '',
          });
        })
        .catch((err) => {
          console.error('Failed to fetch school profile:', err);
        })
        .finally(() => setLoadingSchool(false));
    }
  }, [isSchoolAdmin]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.patch('/auth/profile', { name, phone });
      const updated = { ...user, ...data };
      if (user && localStorage.getItem('auth_token')) {
        login(
          localStorage.getItem('auth_token')!,
          updated as any,
          localStorage.getItem('auth_refresh_token') || undefined
        );
      }
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const saveSchoolWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchool(true);
    try {
      await apiClient.put('/schools/my-school/profile', {
        name: schoolData.name,
        phone: schoolData.phone,
        email: schoolData.email,
        address: schoolData.address,
        city: schoolData.city,
        website: schoolData.website,
        logoUrl: schoolData.logoUrl,
      });
      toast.success('School public website settings saved and live!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update school website');
    } finally {
      setSavingSchool(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setChangingPassword(true);
    try {
      await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = (name || user?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
          <ShieldCheck size={14} /> System Configuration
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-foreground">Settings & Portal Configuration</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-muted-foreground">
          Manage your account credentials, security preferences, and public campus web page.
        </p>
      </div>

      {/* ─── School Public Website Customization (Only for School Admin) ────── */}
      {isSchoolAdmin && (
        <section className="rounded-3xl border border-cyan-500/30 bg-card overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-cyan-500/10">
            <div className="flex items-center gap-2.5">
              <School size={18} className="text-cyan-400" />
              <div>
                <h2 className="font-black text-sm text-foreground">Official School Public Website Settings</h2>
                <p className="text-[11px] text-muted-foreground">Customizes your dedicated public site at /school/{schoolData.slug || user?.schoolSlug}</p>
              </div>
            </div>
            {schoolData.slug && (
              <a
                href={`/school/${schoolData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
              >
                <span>View Live Webpage</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <form onSubmit={saveSchoolWebsite} className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Official School Name *</label>
                <input
                  required
                  value={schoolData.name}
                  onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Campus City / Region</label>
                <input
                  value={schoolData.city}
                  onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                  placeholder="e.g. Sargodha, Lahore, Islamabad"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Public Helpline / Phone</label>
                <input
                  value={schoolData.phone}
                  onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Admissions Email</label>
                <input
                  type="email"
                  value={schoolData.email}
                  onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                  placeholder="admissions@school.edu.pk"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">Campus Full Address</label>
                <input
                  value={schoolData.address}
                  onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                  placeholder="e.g. Main Campus, University Road, Sargodha"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">School Monogram / Logo Image URL</label>
                <input
                  value={schoolData.logoUrl}
                  onChange={(e) => setSchoolData({ ...schoolData, logoUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">External Website URL (Optional)</label>
                <input
                  value={schoolData.website}
                  onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                  placeholder="https://myschool.edu.pk"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSchool}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 text-xs font-black shadow-md shadow-cyan-600/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                <Save size={14} />
                {savingSchool ? 'Updating Webpage...' : 'Save & Publish School Website'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
        {/* ─── Profile Management ──────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-border flex items-center justify-between bg-accent/20">
            <div className="flex items-center gap-2">
              <UserRound size={18} className="text-violet-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-foreground">Personal Profile</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-mono">{user?.role}</span>
          </div>

          <form onSubmit={saveProfile} className="p-6 space-y-5">
            <div className="flex items-center gap-4 rounded-2xl bg-accent/30 border border-border/80 p-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-violet-600/20">
                {initials}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-foreground">{name || 'Administrator'}</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 size={12} /> {user?.schoolName || 'EduSphere Institutional System'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-100/70 dark:bg-muted/40 px-3.5 py-2.5 text-xs text-slate-500 dark:text-muted-foreground">
                <Mail size={15} className="text-slate-500 dark:text-muted-foreground" />
                <span>{user?.email || 'admin@school.edu'}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-muted-foreground mt-1">
                Institutional email address cannot be modified directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Contact Phone</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs text-foreground focus-within:border-cyan-500 transition-all">
                <Phone size={15} className="text-slate-500 dark:text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs"
                  placeholder="0300-1234567"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-violet-600/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                <Save size={14} />
                {saving ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* ─── Security & Display Settings ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Change Password */}
          <section className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-border flex items-center gap-2 bg-accent/20">
              <LockKeyhole size={18} className="text-violet-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-foreground">Security & Password</h2>
            </div>

            <form onSubmit={changePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2.5 text-xs font-bold text-violet-500 disabled:opacity-60 transition-all cursor-pointer"
              >
                {changingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Theme Preferences */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-foreground">Display Theme</h3>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Currently using <span className="font-bold text-foreground capitalize">{theme}</span> mode.
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="h-11 w-11 rounded-2xl border border-border bg-accent/40 hover:bg-accent flex items-center justify-center text-foreground transition-all active:scale-95 cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
