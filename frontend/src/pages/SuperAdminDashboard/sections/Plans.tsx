import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Edit3,
  X,
  Loader2,
  Zap,
  Award,
  Crown,
  Users,
  GraduationCap,
  HardDrive,
  Headphones,
  Save,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";

const UNLIMITED = 999999;

type Plan = {
  id: string;
  planKey: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  maxStudents: number;
  maxTeachers: number;
  storageMb: number;
  supportTier: string;
  features: string[];
  isActive?: boolean;
};

const meta: Record<string, { icon: React.ComponentType<any>; badge?: string; gradient: string; soft: string; accent: string }> = {
  FREE_TRIAL: {
    icon: Zap,
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    soft: "bg-cyan-500/10 border-cyan-500/20",
    accent: "text-cyan-600 dark:text-cyan-300",
  },
  PROFESSIONAL: {
    icon: Award,
    badge: "MOST POPULAR",
    gradient: "from-indigo-500 via-blue-600 to-violet-600",
    soft: "bg-indigo-500/10 border-indigo-500/20",
    accent: "text-indigo-600 dark:text-indigo-300",
  },
  PREMIUM: {
    icon: Crown,
    badge: "BEST VALUE",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    soft: "bg-emerald-500/10 border-emerald-500/20",
    accent: "text-emerald-600 dark:text-emerald-300",
  },
};

const emptyForm = {
  name: "",
  price: "",
  period: "per month",
  maxStudents: "",
  maxTeachers: "",
  storageMb: "",
  supportTier: "",
  features: "",
};

function storageLabel(mb: number) {
  if (mb >= 512000) return "500 GB";
  if (mb >= 1024) return `${Math.round(mb / 1024)} GB`;
  return `${mb} MB`;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [unlimited, setUnlimited] = useState({ students: false, staff: false });
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Plan[]>("/admin/plans");
      setPlans(data || []);
    } catch {
      toast.error("Unable to load plans from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlans();
  }, []);

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => a.price - b.price), [plans]);

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      price: String(plan.price),
      period: plan.period,
      maxStudents: String(plan.maxStudents),
      maxTeachers: String(plan.maxTeachers),
      storageMb: String(plan.storageMb),
      supportTier: plan.supportTier,
      features: (plan.features || []).join("\n"),
    });
    setUnlimited({ students: plan.maxStudents >= UNLIMITED, staff: plan.maxTeachers >= UNLIMITED });
  };

  const savePlan = async () => {
    if (!editing) return;
    const maxStudents = unlimited.students ? UNLIMITED : Number(form.maxStudents);
    const maxTeachers = unlimited.staff ? UNLIMITED : Number(form.maxTeachers);
    const price = Number(form.price);
    const storageMb = Number(form.storageMb);
    const features = form.features.split("\n").map((x) => x.trim()).filter(Boolean);

    if (!form.name.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(maxStudents) || maxStudents < 1 || !Number.isFinite(maxTeachers) || maxTeachers < 1 || !Number.isFinite(storageMb) || storageMb < 1 || !form.period.trim() || !form.supportTier.trim() || features.length === 0) {
      toast.error("Please complete every field and add at least one feature line.");
      return;
    }

    try {
      setSaving(true);
      await apiClient.put(`/admin/plans/${editing.id}`, {
        name: form.name.trim(),
        price,
        period: form.period.trim(),
        maxStudents,
        maxTeachers,
        storageMb,
        supportTier: form.supportTier.trim(),
        features,
      });
      toast.success(`${form.name.trim()} plan saved to the database.`);
      setEditing(null);
      await fetchPlans();
    } catch {
      toast.error("Plan could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span className="text-sm font-semibold text-muted-foreground">Loading live plans…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-cyan-500/10 via-card to-indigo-500/10 p-7 shadow-sm">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              <Plus size={11} /> Live catalogue
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">Plans & Pricing</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              One source of truth for pricing, student/staff limits, storage, support and every feature line shown to schools.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-xs font-semibold text-muted-foreground">
            Changes are saved directly to PostgreSQL and exposed to the public pricing API.
          </div>
        </div>
      </div>

      {sortedPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">No plans found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {sortedPlans.map((plan, index) => {
            const style = meta[plan.planKey] || meta.PROFESSIONAL;
            const Icon = style.icon;
            const students = plan.maxStudents >= UNLIMITED ? "Unlimited" : plan.maxStudents.toLocaleString();
            const staff = plan.maxTeachers >= UNLIMITED ? "Unlimited" : plan.maxTeachers.toLocaleString();
            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group overflow-hidden rounded-[26px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`relative bg-gradient-to-br ${style.gradient} p-6 text-white`}>
                  {style.badge && <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black tracking-wider backdrop-blur-md">{style.badge}</span>}
                  <Icon size={30} className="mb-5 opacity-90" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">{plan.planKey.replace("_", " ")}</p>
                  <h3 className="mt-1 text-2xl font-black">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black">Free</span>
                    ) : (
                      <>
                        <span className="mb-1 text-sm font-bold text-white/75">PKR</span>
                        <span className="text-4xl font-black tracking-tight">{plan.price.toLocaleString()}</span>
                      </>
                    )}
                    <span className="mb-1 text-xs font-semibold text-white/70">{plan.price === 0 ? plan.period : `/${plan.period.replace(/^per /, "")}`}</span>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><GraduationCap className={`mx-auto mb-1 ${style.accent}`} size={16} /><p className="text-sm font-black text-foreground">{students}</p><p className="text-[10px] text-muted-foreground">Students</p></div>
                    <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><Users className={`mx-auto mb-1 ${style.accent}`} size={16} /><p className="text-sm font-black text-foreground">{staff}</p><p className="text-[10px] text-muted-foreground">Staff</p></div>
                    <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><HardDrive className={`mx-auto mb-1 ${style.accent}`} size={16} /><p className="text-sm font-black text-foreground">{storageLabel(plan.storageMb)}</p><p className="text-[10px] text-muted-foreground">Storage</p></div>
                    <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center"><Headphones className={`mx-auto mb-1 ${style.accent}`} size={16} /><p className="truncate text-sm font-black text-foreground">{plan.supportTier}</p><p className="text-[10px] text-muted-foreground">Support</p></div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Landing page features</p><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{plan.features?.length || 0} lines</span></div>
                    <ul className="space-y-2">
                      {(plan.features || []).map((feature, i) => <li key={`${feature}-${i}`} className="flex gap-2 text-xs leading-5 text-muted-foreground"><Check size={14} className={`mt-0.5 shrink-0 ${style.accent}`} />{feature}</li>)}
                    </ul>
                  </div>

                  <button onClick={() => openEdit(plan)} className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${style.soft} ${style.accent} hover:brightness-95`}>
                    <Edit3 size={15} /> Full Edit — Price, Limits & Features
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-border bg-card p-6 shadow-2xl sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Full plan editor</p><h3 className="mt-1 text-2xl font-black text-foreground">Edit {editing.name}</h3><p className="mt-1 text-xs text-muted-foreground">Every value below is stored in the real PlatformPlan record.</p></div>
                <button onClick={() => setEditing(null)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={19} /></button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-foreground">Plan Name<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
                <label className="text-xs font-bold text-foreground">Price (PKR / month)<input type="number" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
                <label className="text-xs font-bold text-foreground">Billing / Period<input value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))} placeholder="per month / free trial" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
                <label className="text-xs font-bold text-foreground">Support Tier<input value={form.supportTier} onChange={(e) => setForm((p) => ({ ...p, supportTier: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
                <div className="text-xs font-bold text-foreground"><span>Max Students</span><div className="mt-1.5 flex gap-2"><input type="number" min="1" disabled={unlimited.students} value={form.maxStudents} onChange={(e) => setForm((p) => ({ ...p, maxStudents: e.target.value }))} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none disabled:opacity-50" /><button type="button" onClick={() => setUnlimited((p) => ({ ...p, students: !p.students }))} className={`rounded-xl border px-3 text-xs font-black ${unlimited.students ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{unlimited.students ? "Unlimited" : "Set Unlimited"}</button></div></div>
                <div className="text-xs font-bold text-foreground"><span>Max Staff</span><div className="mt-1.5 flex gap-2"><input type="number" min="1" disabled={unlimited.staff} value={form.maxTeachers} onChange={(e) => setForm((p) => ({ ...p, maxTeachers: e.target.value }))} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none disabled:opacity-50" /><button type="button" onClick={() => setUnlimited((p) => ({ ...p, staff: !p.staff }))} className={`rounded-xl border px-3 text-xs font-black ${unlimited.staff ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>{unlimited.staff ? "Unlimited" : "Set Unlimited"}</button></div></div>
                <label className="text-xs font-bold text-foreground">Storage (MB)<input type="number" min="1" value={form.storageMb} onChange={(e) => setForm((p) => ({ ...p, storageMb: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
              </div>

              <label className="mt-4 block text-xs font-bold text-foreground">Landing Page Feature Lines <span className="font-medium text-muted-foreground">(one line = one bullet)</span><textarea value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} rows={8} className="mt-1.5 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 text-foreground outline-none focus:ring-2 focus:ring-primary/30" placeholder={'Up to 20 students\nCore modules\nAttendance\nEmail support'} /></label>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                <button onClick={() => void savePlan()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"><Save size={15} />{saving ? "Saving…" : "Save Plan to Database"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
