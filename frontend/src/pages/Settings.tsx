import { useState } from "react";
import { LockKeyhole, Mail, Moon, Phone, Save, ShieldCheck, Sun, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/api/apiClient";

export default function Settings() {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.patch("/auth/profile", { name, phone });
      const updated = { ...user, ...data };
      if (user && localStorage.getItem("auth_token")) login(localStorage.getItem("auth_token")!, updated as any, localStorage.getItem("auth_refresh_token") || undefined);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update profile");
    } finally { setSaving(false); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 12) return toast.error("New password must be at least 12 characters");
    setChangingPassword(true);
    try {
      await apiClient.patch("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword("");
      toast.success("Password changed. Please sign in again.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to change password");
    } finally { setChangingPassword(false); }
  };

  return <div className="space-y-6 max-w-5xl">
    <div><div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-400"><ShieldCheck size={12} /> Account</div><h1 className="mt-3 text-3xl font-black tracking-tight">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your EduSphere profile, security and display preferences.</p></div>

    <div className="grid xl:grid-cols-[1.2fr_.8fr] gap-5">
      <section className="rounded-3xl border border-border bg-card overflow-hidden"><div className="px-5 py-4 border-b border-border flex items-center gap-2"><UserRound size={18} className="text-violet-500" /><h2 className="font-black text-sm">Profile</h2></div><form onSubmit={saveProfile} className="p-5 space-y-4"><div className="flex items-center gap-4 rounded-2xl bg-background/60 p-4"><div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">{(name || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><p className="font-black">{user?.role?.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">{user?.schoolName || "EduSphere"}</p></div></div><label className="block text-xs font-bold text-muted-foreground">Full name<input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label><label className="block text-xs font-bold text-muted-foreground">Email<div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm"><Mail size={15} className="text-muted-foreground" />{user?.email}</div></label><label className="block text-xs font-bold text-muted-foreground">Phone<div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3"><Phone size={15} className="text-muted-foreground" /><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="03xx-xxxxxxx" /></div></label><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={15} />{saving ? "Saving..." : "Save profile"}</button></form></section>

      <div className="space-y-5">
        <section className="rounded-3xl border border-border bg-card overflow-hidden"><div className="px-5 py-4 border-b border-border flex items-center gap-2"><LockKeyhole size={18} className="text-violet-500" /><h2 className="font-black text-sm">Security</h2></div><form onSubmit={changePassword} className="p-5 space-y-3"><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Current password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={12} placeholder="New password (12+ characters)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500" /><button disabled={changingPassword} className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-500 disabled:opacity-60">{changingPassword ? "Updating..." : "Change password"}</button></form></section>
        <section className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-black text-sm">Appearance</p><p className="text-xs text-muted-foreground mt-1">Switch between dark and light mode.</p></div><button onClick={toggleTheme} className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></div></section>
      </div>
    </div>
  </div>;
}
