import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Loader2,
  Search,
  Eye,
  Edit2,
  Ban,
  CheckCircle,
  Calendar,
  CreditCard,
  MoreVertical,
  Mail,
  MapPin,
  Phone,
  Globe,
  Shield,
  Layers,
  Users,
  GraduationCap,
  Briefcase,
  Filter,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

/* ── Pakistan Location Data ── */
const PAKISTAN_LOCATIONS: Record<string, Record<string, string[]>> = {
  Punjab: {
    Lahore: ["Model Town", "Gulberg", "DHA", "Cantonment", "Johar Town"],
    Faisalabad: ["City", "Jaranwala", "Sammundri"],
    Rawalpindi: ["City", "Murree", "Gujar Khan"],
    Multan: ["City", "Shujabad"],
    Sialkot: ["City", "Daska"],
    Gujranwala: ["City", "Kamoke"],
  },
  Sindh: {
    Karachi: ["Central", "East", "South", "West", "Malir", "Korangi"],
    Hyderabad: ["City", "Latifabad", "Qasimabad"],
    Sukkur: ["City", "Rohri"],
  },
  KPK: {
    Peshawar: ["City", "Hayatabad", "Cantt"],
    Mardan: ["City", "Takht Bhai"],
    Abbottabad: ["City", "Havelian"],
  },
  Balochistan: {
    Quetta: ["City", "Sariab", "Chaman"],
    Gwadar: ["City", "Pasni"],
  },
  "Islamabad CT": {
    Islamabad: ["F-Sector", "G-Sector", "E-Sector", "I-Sector", "H-Sector"],
  },
};

const PROVINCES = Object.keys(PAKISTAN_LOCATIONS);
const PLANS = ["FREE_TRIAL", "BASIC", "STANDARD", "PREMIUM"];

const planColors: Record<string, string> = {
  FREE_TRIAL: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  BASIC: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  STANDARD: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  PREMIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const emptyForm = {
  name: "",
  slug: "",
  province: "Punjab",
  district: "Lahore",
  tehsil: "City",
  address: "",
  adminName: "",
  adminPhone: "",
  adminEmail: "",
  adminPassword: "",
  plan: "FREE_TRIAL",
  amount: "0",
};

type ModalType = "create" | "edit" | "view" | "extend" | "plan" | null;

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [newPlan, setNewPlan] = useState("BASIC");
  const [newPlanAmount, setNewPlanAmount] = useState("49");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  const districts = form.province
    ? Object.keys(PAKISTAN_LOCATIONS[form.province] || {})
    : [];

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setForm((p) => ({ ...p, name, slug }));
  };

  const fetchData = () => {
    setLoading(true);
    apiClient
      .get("/schools")
      .then((r) =>
        setSchools(Array.isArray(r.data) ? r.data : r.data?.data || []),
      )
      .catch(() => toast.error("Platform data desync. Retrying..."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = async (type: ModalType, school?: any) => {
    setSelected(school || null);
    if (type === "view" && school?.id) {
      try {
        const response = await apiClient.get(`/schools/${school.id}`);
        setSelected(response.data);
      } catch {
        toast.error("Unable to load complete school details.");
      }
    }
    if (type === "edit" && school) {
      setForm({
        name: school.name || "",
        slug: school.slug || "",
        province: school.province || "Punjab",
        district: school.city || "Lahore",
        tehsil: school.tehsil || "",
        address: school.address || "",
        adminName: school.adminName || "",
        adminPhone: school.phone || "",
        adminEmail: school.email || "",
        adminPassword: "",
        plan: school.subscription?.plan || "BASIC",
        amount: school.subscription?.amount?.toString() || "0",
      });
    } else if (type === "create") {
      setForm({ ...emptyForm });
    } else if (type === "extend" && school) {
      setExtendDays(30);
    } else if (type === "plan" && school) {
      setNewPlan(school.subscription?.plan || "BASIC");
      setNewPlanAmount("99");
    }
    setModal(type);
    setOpenMenu(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.adminEmail) {
      toast.error("Please fill required fields (Name, Slug, Admin Email)");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/schools", {
        ...form,
        amount: parseFloat(form.amount) || 0,
        city: form.district || form.province,
      });
      toast.success("School created & registered successfully!");
      setModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    setSaving(true);
    try {
      await apiClient.put(`/schools/${selected.id}`, {
        name: form.name,
        email: form.adminEmail,
        phone: form.adminPhone,
        address: form.address,
        city: form.district || form.province,
      });
      toast.success("School profile updated successfully");
      setModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExtendExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    setSaving(true);
    try {
      await apiClient.patch(`/schools/${selected.id}/extend-expiry`, {
        days: Number(extendDays),
      });
      toast.success(`Subscription extended by ${extendDays} days!`);
      setModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to extend subscription",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    setSaving(true);
    try {
      await apiClient.patch(`/schools/${selected.id}/change-plan`, {
        plan: newPlan,
        amount: parseFloat(newPlanAmount) || 0,
      });
      toast.success(`Plan changed to ${newPlan}!`);
      setModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change plan");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "suspend" | "activate" | "archive",
    label: string,
  ) => {
    try {
      if (action === "archive") {
        if (
          !confirm(
            "Are you sure you want to permanently delete/archive this school?",
          )
        )
          return;
        await apiClient.delete(`/schools/${id}`);
      } else {
        await apiClient.patch(`/schools/${id}/${action}`);
      }
      toast.success(`School ${label} successfully.`);
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || `Failed to ${action} school.`,
      );
    }
  };

  const enterCampus = (slug: string) => {
    window.open(`/${slug}/dashboard`, "_blank");
  };

  const filtered = schools.filter((s) => {
    const mSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()));

    let mStatus = true;
    if (statusFilter === "ACTIVE") mStatus = s.isActive;
    else if (statusFilter === "SUSPENDED") mStatus = !s.isActive;
    else if (statusFilter === "EXPIRING") {
      if (!s.subscription?.endDate) return false;
      const end = new Date(s.subscription.endDate);
      const now = new Date();
      const thirtyDays = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      mStatus = end > now && end <= thirtyDays;
    }

    const mPlan = planFilter === "ALL" || s.subscription?.plan === planFilter;
    return mSearch && mStatus && mPlan;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1.5">
            <Shield size={12} />
            <span>Multi-School Tenant Registry</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Registered Institutions
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            View and manage all schools, plans, subscriptions, payments, and
            school actions.
          </p>
        </div>
        <button
          onClick={() => openModal("create")}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider
            hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={16} /> Register New Campus
        </button>
      </div>

      {/* ── Sub-Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 flex-wrap">
        {[
          { id: "ALL", label: "All Schools", icon: Globe },
          { id: "ACTIVE", label: "Active", icon: CheckCircle },
          { id: "SUSPENDED", label: "Suspended", icon: Ban },
          { id: "EXPIRING", label: "Expiring Soon", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === t.id
                ? "bg-violet-600/20 border border-violet-500/40 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon size={13} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Advanced Filters ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex items-center gap-3 px-4 py-3 rounded-[20px] border border-white/[0.05] bg-slate-900/40 backdrop-blur-xl flex-1 w-full group focus-within:border-violet-500/40 transition-all">
          <Search
            size={16}
            className="text-slate-500 group-focus-within:text-violet-400 transition-colors"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campuses by name, slug, email, or city..."
            className="bg-transparent border-none text-sm outline-none flex-1 text-white placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Layers
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="pl-9 pr-8 py-3 rounded-[18px] border border-white/[0.05] bg-slate-900/40 text-white text-[12px] font-bold appearance-none cursor-pointer focus:outline-none focus:border-violet-500/40 min-w-[140px]"
            >
              <option value="ALL">All Service Tiers</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-[28px] border border-white/[0.06] bg-slate-900/30">
          <Shield size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-white font-bold text-base">No Schools Found</p>
          <p className="text-slate-500 text-xs mt-1">
            Try adjusting your search criteria or register a new campus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s, i) => {
            const isSuspended = !s.isActive;
            const currentPlan = s.subscription?.plan || "BASIC";
            const expiryDate = s.subscription?.endDate
              ? new Date(s.subscription.endDate).toLocaleDateString("en-PK")
              : "N/A";

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`group relative rounded-[28px] border ${isSuspended ? "border-rose-500/20 bg-rose-950/10" : "border-white/[0.06] bg-slate-900/40"} p-6 backdrop-blur-xl
                  hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between`}
              >
                {/* Active/Suspended Tag */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 font-black text-lg">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-white truncate leading-tight">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-bold tracking-tight mt-0.5 flex items-center gap-1">
                        <Globe size={11} className="text-violet-400" />
                        {s.slug}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight flex items-center gap-1 ${
                      s.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${s.isActive ? "bg-emerald-400" : "bg-rose-400"}`}
                    />
                    {s.isActive ? "Active" : "Suspended"}
                  </span>
                </div>

                {/* Campus Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-white/[0.02] border border-white/5 mb-4 text-center">
                  <div>
                    <p className="text-sm font-black text-white">
                      {s._count?.students ?? 0}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                      Students
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">
                      {s._count?.teachers ?? 0}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                      Teachers
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">
                      {s._count?.users ?? 0}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                      Users
                    </p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 text-[11px] text-slate-400 mb-5">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={12} className="text-violet-400/80 shrink-0" />
                    <span>
                      {[s.city, s.province || "Pakistan"]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Calendar
                      size={12}
                      className="text-violet-400/80 shrink-0"
                    />
                    <span>
                      Expiry:{" "}
                      <strong className="text-white font-bold">
                        {expiryDate}
                      </strong>
                    </span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={12} className="text-violet-400/80 shrink-0" />
                      <span>{s.email}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight ${planColors[currentPlan] || planColors.BASIC}`}
                  >
                    {currentPlan.replace("_", " ")}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Enter campus portal button */}
                    <button
                      onClick={() => enterCampus(s.slug)}
                      title="Open Campus Portal (Impersonate)"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-300 hover:bg-violet-600/30 text-[11px] font-bold transition-all"
                    >
                      <ExternalLink size={12} />
                      <span>Portal</span>
                    </button>

                    <button
                      onClick={() => openModal("view", s)}
                      title="View Details"
                      className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Eye size={13} />
                    </button>

                    <button
                      onClick={() => openModal("edit", s)}
                      title="Edit School"
                      className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Edit2 size={13} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === s.id ? null : s.id)
                        }
                        className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <MoreVertical size={13} />
                      </button>

                      <AnimatePresence>
                        {openMenu === s.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenMenu(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 bottom-full mb-2 z-40 w-44 rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl"
                            >
                              <button
                                onClick={() => openModal("extend", s)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all"
                              >
                                <Calendar
                                  size={13}
                                  className="text-violet-400"
                                />
                                <span>Extend Expiry</span>
                              </button>
                              <button
                                onClick={() => openModal("plan", s)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all"
                              >
                                <CreditCard
                                  size={13}
                                  className="text-amber-400"
                                />
                                <span>Change Plan</span>
                              </button>
                              {s.isActive ? (
                                <button
                                  onClick={() => {
                                    handleAction(s.id, "suspend", "suspended");
                                    setOpenMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
                                >
                                  <Ban size={13} />
                                  <span>Suspend Campus</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleAction(s.id, "activate", "activated");
                                    setOpenMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                >
                                  <CheckCircle size={13} />
                                  <span>Activate Campus</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleAction(s.id, "archive", "deleted");
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={13} />
                                <span>Delete Campus</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {/* 1. Register School Modal */}
        {modal === "create" && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Register New Institution
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add a new campus to EduSphere SaaS network
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Campus Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Beaconhouse Model Town"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Portal Slug (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. beaconhouse-mt"
                      value={form.slug}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, slug: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Province
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          province: e.target.value,
                          district:
                            Object.keys(
                              PAKISTAN_LOCATIONS[e.target.value] || {},
                            )[0] || "",
                        }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      {PROVINCES.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      City / District
                    </label>
                    <select
                      value={form.district}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, district: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Block C, Model Town, Lahore"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <p className="text-xs font-bold text-violet-300">
                    Initial Campus Administrator
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">
                        Admin Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Principal / Director"
                        value={form.adminName}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adminName: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@school.com"
                        value={form.adminEmail}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adminEmail: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">
                        Admin Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+92 300 1234567"
                        value={form.adminPhone}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adminPhone: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">
                        Initial Password
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank for auto-generate"
                        value={form.adminPassword}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            adminPassword: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Initial Subscription Plan
                    </label>
                    <select
                      value={form.plan}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, plan: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Fee Amount (PKR / USD)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Confirm & Register</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. Edit School Modal */}
        {modal === "edit" && selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-base font-black text-white">
                  Edit Campus Profile
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, adminEmail: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.adminPhone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, adminPhone: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">
                    Address / City
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. View School Modal */}
        {modal === "view" && selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-black text-3xl">
                    {selected.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight">
                      {selected.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                        <Globe size={14} className="text-violet-400" />
                        {selected.slug}.edusphere.app
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter ${
                          selected.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {selected.isActive ? "Verified Active" : "Suspended"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Metrics & Capacity */}
                <div className="space-y-6">
                  <div>
                     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Institutional Capacity</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                           <div className="flex items-center justify-between mb-2">
                              <GraduationCap size={16} className="text-violet-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">Students</span>
                           </div>
                           <p className="text-2xl font-black text-white leading-none">
                              {selected._count?.students ?? 0}
                           </p>
                           <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                              Limit: {selected.subscription?.plan === 'PREMIUM' ? 'Unlimited' : (selected.subscription?.plan === 'STANDARD' ? '1,000' : '200')}
                           </p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                           <div className="flex items-center justify-between mb-2">
                              <Briefcase size={16} className="text-blue-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">Staff</span>
                           </div>
                           <p className="text-2xl font-black text-white leading-none">
                              {selected._count?.teachers ?? 0}
                           </p>
                           <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                              Limit: {selected.subscription?.plan === 'PREMIUM' ? 'Unlimited' : (selected.subscription?.plan === 'STANDARD' ? '50' : '15')}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Administrator Contact</h4>
                     <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3.5">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                              <User size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white leading-none">{selected.adminName || 'Primary Admin'}</p>
                              <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Managing Director</p>
                           </div>
                        </div>
                        <div className="space-y-2 pt-2">
                           <div className="flex items-center gap-2 text-xs text-slate-300">
                              <Mail size={13} className="text-violet-400" />
                              <span>{selected.email || 'N/A'}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-300">
                              <Phone size={13} className="text-violet-400" />
                              <span>{selected.phone || 'N/A'}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-300">
                              <MapPin size={13} className="text-violet-400" />
                              <span className="truncate">{selected.address}, {selected.city}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Right Column: Subscription & Payments */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Service Licensing</h4>
                    <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 p-5 rounded-3xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Shield size={60} />
                       </div>
                       <div className="relative z-10">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight ${planColors[selected.subscription?.plan] || planColors.BASIC}`}>
                             {selected.subscription?.plan || 'BASIC'} Tier
                          </span>
                          <div className="mt-4 flex items-baseline gap-1.5">
                             <p className="text-3xl font-black text-white">PKR {selected.subscription?.amount?.toLocaleString() || '0'}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">per month</p>
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                             <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase">License Start</p>
                                <p className="text-xs font-bold text-white mt-1">
                                   {selected.subscription?.startDate ? new Date(selected.subscription.startDate).toLocaleDateString('en-PK') : 'N/A'}
                                </p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase">License End</p>
                                <p className="text-xs font-bold text-emerald-400 mt-1">
                                   {selected.subscription?.endDate ? new Date(selected.subscription.endDate).toLocaleDateString('en-PK') : 'N/A'}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div>
                     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Activity Stream</h4>
                     <div className="space-y-2.5">
                        {[
                          { icon: CheckCircle, text: 'Plan verified and activated', time: 'Aug 24' },
                          { icon: CreditCard, text: 'Payment confirmed via JazzCash', time: 'Aug 24' },
                          { icon: Activity, text: 'Institutional record created', time: 'Aug 22' },
                        ].map((act, i) => (
                           <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-3">
                                 <act.icon size={13} className="text-slate-500" />
                                 <span className="text-xs text-slate-300 font-medium">{act.text}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{act.time}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/10 mt-8">
                <div className="flex items-center gap-2">
                   <button
                     onClick={() => openModal('extend', selected)}
                     className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
                   >
                     Extend License
                   </button>
                   <button
                     onClick={() => openModal('plan', selected)}
                     className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
                   >
                     Modify Tier
                   </button>
                </div>
                <button
                  onClick={() => enterCampus(selected.slug)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-600/25"
                >
                  <ExternalLink size={14} />
                  <span>Enter Institutional Portal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Extend Expiry Modal */}
        {modal === "extend" && selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-black text-white">
                  Extend Subscription
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleExtendExpiry} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Extending subscription for{" "}
                  <strong className="text-white">{selected.name}</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        extendDays === d
                          ? "border-violet-500 bg-violet-600/20 text-white"
                          : "border-white/10 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Custom Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {saving ? "Applying..." : "Apply Extension"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 5. Change Plan Modal */}
        {modal === "plan" && selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1020] border border-violet-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-black text-white">
                  Change Service Tier
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleChangePlan} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Update plan tier for{" "}
                  <strong className="text-white">{selected.name}</strong>.
                </p>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Select New Plan
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-white text-xs"
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Recorded Amount
                  </label>
                  <input
                    type="number"
                    value={newPlanAmount}
                    onChange={(e) => setNewPlanAmount(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Update Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
