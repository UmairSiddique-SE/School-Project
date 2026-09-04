import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Check, Loader2, Shield, School, Activity, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  schoolId?: string | null;
  lastLoginAt?: string | null;
};

type OverviewData = {
  totalSchools?: number;
  activeSchools?: number;
  pendingSchoolRequests?: number;
  pendingPayments?: number;
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [overview, setOverview] = useState<OverviewData>({});
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [meResponse, overviewResponse] = await Promise.all([
        apiClient.get("/auth/me"),
        apiClient.get("/admin/overview"),
      ]);
      const me = meResponse.data?.user ?? meResponse.data;
      setProfile({
        id: me?.id ?? user?.id ?? "",
        name: me?.name ?? user?.name ?? "",
        email: me?.email ?? user?.email ?? "",
        phone: me?.phone ?? "",
        role: me?.role ?? user?.role ?? "SUPER_ADMIN",
        schoolId: me?.schoolId ?? user?.schoolId ?? null,
        lastLoginAt: me?.lastLoginAt ?? null,
      });
      setOverview(overviewResponse.data ?? {});
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load your profile from the server.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const initials = useMemo(() => {
    const name = profile?.name?.trim() || user?.name?.trim() || "Super Admin";
    return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }, [profile?.name, user?.name]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    if (!profile.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await apiClient.patch("/auth/profile", {
        name: profile.name.trim(),
        phone: profile.phone.trim() || undefined,
      });
      const saved = response.data;
      const nextProfile = { ...profile, ...saved };
      setProfile(nextProfile);

      const storedUser = localStorage.getItem("auth_user");
      const stored = storedUser ? JSON.parse(storedUser) : {};
      localStorage.setItem("auth_user", JSON.stringify({ ...stored, ...saved }));

      setProfileSaved(true);
      toast.success("Profile saved to the database successfully.");
      window.setTimeout(() => setProfileSaved(false), 2500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.patch("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success("Password changed successfully. Please sign in again when prompted.");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Loader2 size={18} className="animate-spin" /> Loading profile from server…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-bold text-foreground">Profile could not be loaded.</p>
        <p className="mt-1 text-sm text-muted-foreground">The page is not using fallback or dummy account data.</p>
        <button onClick={() => void loadProfile()} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Retry</button>
      </div>
    );
  }

  const lastLogin = profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("en-PK") : "Not available";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Account & Security</p>
          <h2 className="mt-1 text-2xl font-black text-foreground">My Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage the authenticated Super Admin account stored in PostgreSQL.</p>
        </div>
        <button onClick={() => void loadProfile()} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:bg-accent">Refresh data</button>
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="bg-gradient-to-r from-violet-600/15 via-indigo-500/10 to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl font-black text-white shadow-xl shadow-violet-500/20">{initials}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-black text-foreground">{profile.name}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary"><Shield size={12} /> {profile.role}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4">
          <div className="p-4"><School size={16} className="text-violet-500" /><p className="mt-2 text-xl font-black text-foreground">{overview.totalSchools ?? 0}</p><p className="text-[11px] text-muted-foreground">Total Schools</p></div>
          <div className="p-4"><Activity size={16} className="text-emerald-500" /><p className="mt-2 text-xl font-black text-foreground">{overview.activeSchools ?? 0}</p><p className="text-[11px] text-muted-foreground">Active Schools</p></div>
          <div className="p-4"><KeyRound size={16} className="text-amber-500" /><p className="mt-2 text-xl font-black text-foreground">{overview.pendingPayments ?? 0}</p><p className="text-[11px] text-muted-foreground">Pending Payments</p></div>
          <div className="p-4"><Shield size={16} className="text-blue-500" /><p className="mt-2 text-xs font-black text-foreground">{lastLogin}</p><p className="text-[11px] text-muted-foreground">Last Login</p></div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10"><User size={16} className="text-blue-500" /></div><div><h3 className="font-black text-foreground">Personal Information</h3><p className="text-xs text-muted-foreground">Only fields supported by the current User database model are editable.</p></div></div>
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-bold text-foreground">Full Name</span><div className="relative mt-1.5"><User size={14} className="absolute left-3 top-3 text-muted-foreground" /><input value={profile.name} onChange={(e) => setProfile((p) => p ? { ...p, name: e.target.value } : p)} className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></div></label>
            <label className="block"><span className="text-xs font-bold text-foreground">Email Address</span><div className="relative mt-1.5"><Mail size={14} className="absolute left-3 top-3 text-muted-foreground" /><input value={profile.email} readOnly className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-3 text-sm text-muted-foreground outline-none" /></div><span className="mt-1 block text-[10px] text-muted-foreground">Email is read-only here to avoid changing a verified login without re-verification.</span></label>
            <label className="block"><span className="text-xs font-bold text-foreground">Phone</span><div className="relative mt-1.5"><Phone size={14} className="absolute left-3 top-3 text-muted-foreground" /><input value={profile.phone} onChange={(e) => setProfile((p) => p ? { ...p, phone: e.target.value } : p)} placeholder="Add phone number" className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></div></label>
            <label className="block"><span className="text-xs font-bold text-foreground">Role</span><input value={profile.role} readOnly className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm font-bold text-muted-foreground outline-none" /></label>
          </div>
          <button type="submit" disabled={savingProfile} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all disabled:opacity-70 ${profileSaved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {savingProfile ? <Loader2 size={14} className="animate-spin" /> : profileSaved ? <Check size={14} /> : <User size={14} />}
            {savingProfile ? "Saving to database…" : profileSaved ? "Saved" : "Save Profile"}
          </button>
        </form>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10"><Lock size={16} className="text-red-500" /></div><div><h3 className="font-black text-foreground">Change Password</h3><p className="text-xs text-muted-foreground">Password changes are handled by the authenticated backend.</p></div></div>
        <form onSubmit={handlePasswordSave} className="max-w-lg space-y-4">
          {[
            { key: "current", label: "Current Password" },
            { key: "new", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map((field) => (
            <label key={field.key} className="block"><span className="text-xs font-bold text-foreground">{field.label}</span><div className="relative mt-1.5"><Lock size={14} className="absolute left-3 top-3 text-muted-foreground" /><input type="password" required value={(passwords as any)[field.key]} onChange={(e) => setPasswords((p) => ({ ...p, [field.key]: e.target.value }))} className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></div></label>
          ))}
          <button type="submit" disabled={savingPassword} className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-black text-red-500 hover:bg-red-500/15 disabled:opacity-70">{savingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}{savingPassword ? "Changing…" : "Change Password"}</button>
        </form>
      </motion.section>
    </div>
  );
}
