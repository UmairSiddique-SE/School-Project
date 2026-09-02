import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Check,
  Loader2,
  Shield,
  Bell,
  Globe,
  Key,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";

export default function Profile() {
  const { user } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "Super Administrator",
    email: user?.email || "admin@edusphere.app",
    phone: "+1 555 000 0001",
    timezone: "Asia/Karachi",
    language: "English",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await apiClient.patch("/auth/profile", {
        name: profile.name,
        phone: profile.phone,
      });
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ ...user, ...response.data }),
      );
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to update profile.",
      );
    }
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match!");
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
      toast.success("Password changed successfully. Please sign in again.");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const stats = [
    {
      label: "Total Schools",
      value: "24",
      icon: Globe,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Actions Today",
      value: "12",
      icon: Shield,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Notifications",
      value: "4",
      icon: Bell,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Last Login",
      value: "Today",
      icon: Key,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-foreground">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your super admin account information and security
        </p>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-violet-500/20">
              {profile.name.charAt(0)}
            </div>
            <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all">
              <Camera size={12} />
            </button>
          </div>
          <div>
            <p className="text-xl font-black text-foreground">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Shield size={11} /> SUPER ADMIN
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`rounded-xl ${s.bg} p-3 text-center`}
              >
                <Icon size={16} className={`${s.color} mx-auto mb-1`} />
                <p className="text-lg font-black text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Edit Profile */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <User size={15} className="text-blue-400" />
          </div>
          <h3 className="font-bold text-foreground">Personal Information</h3>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative mt-1">
                <User
                  size={14}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail
                  size={14}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                Phone
              </label>
              <div className="relative mt-1">
                <Phone
                  size={14}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                Timezone
              </label>
              <select
                value={profile.timezone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, timezone: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>Asia/Karachi</option>
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Dubai</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-70 ${
              profileSaved
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {savingProfile ? (
              <Loader2 size={14} className="animate-spin" />
            ) : profileSaved ? (
              <Check size={14} />
            ) : (
              <User size={14} />
            )}
            {savingProfile
              ? "Saving…"
              : profileSaved
                ? "Saved!"
                : "Update Profile"}
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Lock size={15} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-4 max-w-sm">
          {[
            { key: "current", label: "Current Password" },
            { key: "new", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-foreground">
                {f.label}
              </label>
              <div className="relative mt-1">
                <Lock
                  size={14}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <input
                  type="password"
                  value={(passwords as any)[f.key]}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-70"
          >
            {savingPassword ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Lock size={14} />
            )}
            {savingPassword ? "Changing…" : "Change Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
