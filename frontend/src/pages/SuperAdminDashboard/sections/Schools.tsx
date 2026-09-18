import React, { useEffect, useMemo, useState } from "react";
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
  Clock,
  ChevronDown,
  User,
  Activity,
  Send,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  FileSpreadsheet,
  Building,
  RefreshCw,
  Info,
  DollarSign,
  CalendarDays,
  Sparkles,
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
const PLANS = ["FREE_TRIAL", "PROFESSIONAL", "PREMIUM"];

const planColors: Record<string, string> = {
  FREE_TRIAL: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  PROFESSIONAL: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
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

const ALERT_PRESETS = [
  {
    name: "Payment Overdue",
    type: "PAYMENT",
    priority: "HIGH",
    title: "⚠️ Subscription Payment Overdue",
    message: "Your school subscription renewal payment is overdue. Please renew immediately to avoid service disruption.",
    actionType: "RENEW_PAYMENT",
    actionUrl: "/subscription",
  },
  {
    name: "Expiring Soon",
    type: "WARNING",
    priority: "HIGH",
    title: "⏳ Subscription Expiring Soon",
    message: "Your school subscription plan is approaching its expiration date. Please renew in advance.",
    actionType: "RENEW_PAYMENT",
    actionUrl: "/subscription",
  },
  {
    name: "Maintenance Notice",
    type: "MAINTENANCE",
    priority: "NORMAL",
    title: "🛠️ Scheduled System Maintenance",
    message: "We will be performing routine system maintenance tonight from 02:00 AM to 04:00 AM PKT. Minimal downtime expected.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
  },
  {
    name: "Suspension Warning",
    type: "SUSPENSION",
    priority: "CRITICAL",
    title: "🚨 Urgent: Account Suspension Notice",
    message: "Your school account has pending policy or payment compliance issues and may be suspended within 24 hours.",
    actionType: "RENEW_PAYMENT",
    actionUrl: "/subscription",
  },
  {
    name: "General Announcement",
    type: "INFO",
    priority: "NORMAL",
    title: "📢 Update from Super Admin",
    message: "Please review this important announcement regarding platform enhancements and feature updates.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
  },
];

const SUSPENSION_THEME_PRESETS = [
  {
    id: "MAINTENANCE",
    name: "System Maintenance",
    badge: "Scheduled Maintenance",
    type: "MAINTENANCE",
    theme: "amber",
    colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: Wrench,
    title: "🛠️ Scheduled System Maintenance in Progress",
    reason: "Our school portal is temporarily offline for scheduled system upgrades and data maintenance. Normal service will resume shortly. We apologize for any inconvenience.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedHours: 4,
  },
  {
    id: "PAYMENT",
    name: "Subscription / Payment Overdue",
    badge: "Payment Required",
    type: "PAYMENT",
    theme: "rose",
    colorClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    icon: CreditCard,
    title: "⚠️ Subscription Renewal Required",
    reason: "The institutional subscription for this school portal is currently pending renewal. School administrators must settle the outstanding subscription payment to unlock full access.",
    actionType: "RENEW_PAYMENT",
    actionUrl: "/subscription",
    estimatedHours: 0,
  },
  {
    id: "SUSPENSION",
    name: "Administrative Suspension",
    badge: "Account Suspended",
    type: "SUSPENSION",
    theme: "red",
    colorClass: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: ShieldAlert,
    title: "🚨 Institutional Portal Suspended by Administration",
    reason: "Access to this school portal has been placed on hold by EduSphere platform administration due to compliance, documentation, or administrative review. Please contact support.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedHours: 0,
  },
  {
    id: "VACATION",
    name: "Academic Break / Term Holiday",
    badge: "School Closed / Vacation",
    type: "VACATION",
    theme: "emerald",
    colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: Calendar,
    title: "🏖️ School Portal Closed for Scheduled Break",
    reason: "The school is closed for the scheduled academic holiday / term break. Online modules and parent/student portals will resume on the next official term opening date.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedHours: 72,
  },
  {
    id: "EMERGENCY",
    name: "Emergency / Weather Advisory",
    badge: "Emergency Closure",
    type: "EMERGENCY",
    theme: "purple",
    colorClass: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    icon: AlertTriangle,
    title: "⚡ Emergency Weather / Advisory Closure",
    reason: "Due to local weather advisories or emergency district notices, school operations and portal services are temporarily paused for student and staff safety.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedHours: 24,
  },
  {
    id: "CUSTOM",
    name: "Custom Reason & Theme",
    badge: "Custom Notice",
    type: "CUSTOM",
    theme: "cyan",
    colorClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    icon: Sparkles,
    title: "📢 Official Notice from Administration",
    reason: "This school portal is currently offline. Please review this notice and contact the administration for further information.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedHours: 0,
  },
];

type ModalType = "create" | "edit" | "view" | "extend" | "plan" | "alert" | null;
type ViewTab = "overview" | "subscription" | "alerts" | "stats" | "audit";
type SchoolAction = "suspend" | "activate" | "archive";

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("overview");
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [newPlan, setNewPlan] = useState("PROFESSIONAL");
  const [newPlanAmount, setNewPlanAmount] = useState("49");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [actionDialog, setActionDialog] = useState<{ id: string; action: SchoolAction; label: string; schoolName: string; slug?: string } | null>(null);
  const [actionReason, setActionReason] = useState("");

  // Rich Suspend / Turn Off Form State
  const [suspendForm, setSuspendForm] = useState({
    type: "MAINTENANCE",
    title: "🛠️ Scheduled System Maintenance in Progress",
    reason: "Our school portal is temporarily offline for scheduled system upgrades and data maintenance. Normal service will resume shortly. We apologize for any inconvenience.",
    actionType: "ACKNOWLEDGE",
    actionUrl: "",
    estimatedReturn: "",
    contactPhone: "",
    contactEmail: "",
    theme: "amber",
  });

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    type: "PAYMENT",
    priority: "HIGH",
    title: "⚠️ Subscription Payment Overdue",
    message: "Your school subscription renewal payment is overdue. Please renew immediately to avoid service disruption.",
    actionType: "RENEW_PAYMENT",
    actionUrl: "/subscription",
  });
  const [schoolAlerts, setSchoolAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

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

  const fetchSchoolAlerts = async (schoolId: string) => {
    setLoadingAlerts(true);
    try {
      const res = await apiClient.get(`/schools/${schoolId}/alerts`);
      setSchoolAlerts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSchoolAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const openModal = async (type: ModalType, school?: any, initialTab: ViewTab = "overview") => {
    setSelected(school || null);
    setViewTab(initialTab);
    if (type === "view" && school?.id) {
      try {
        const response = await apiClient.get(`/schools/${school.id}`);
        setSelected(response.data);
        fetchSchoolAlerts(school.id);
      } catch {
        toast.error("Unable to load complete school details.");
      }
    }
    if (type === "alert" && school) {
      fetchSchoolAlerts(school.id);
      setViewTab("alerts");
      type = "view"; // Open the view modal directly on the Alerts tab!
      try {
        const response = await apiClient.get(`/schools/${school.id}`);
        setSelected(response.data);
      } catch {
        // use passed school
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
        plan: school.subscription?.plan || "PROFESSIONAL",
        amount: school.subscription?.amount?.toString() || "0",
      });
    } else if (type === "create") {
      setForm({ ...emptyForm });
    } else if (type === "extend" && school) {
      setExtendDays(30);
    } else if (type === "plan" && school) {
      setNewPlan(school.subscription?.plan || "PROFESSIONAL");
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

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    if (!alertForm.title || !alertForm.message) {
      toast.error("Please enter alert title and message");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/schools/${selected.id}/alerts`, alertForm);
      toast.success("Alert dispatched to School Admin dashboard!");
      fetchSchoolAlerts(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send alert");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await apiClient.delete(`/schools/alerts/${alertId}`);
      toast.success("Alert removed");
      if (selected?.id) fetchSchoolAlerts(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete alert");
    }
  };

  const handleToggleAlertActive = async (alertId: string, currentActive: boolean) => {
    try {
      await apiClient.patch(`/schools/alerts/${alertId}/toggle`, { isActive: !currentActive });
      toast.success(`Alert ${!currentActive ? 'activated' : 'deactivated'}`);
      if (selected?.id) fetchSchoolAlerts(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle alert");
    }
  };

  const handleApplyPreset = (preset: typeof ALERT_PRESETS[0]) => {
    setAlertForm({
      type: preset.type,
      priority: preset.priority,
      title: preset.title,
      message: preset.message,
      actionType: preset.actionType,
      actionUrl: preset.actionUrl || "",
    });
  };

  const handleAction = (id: string, action: SchoolAction, label: string, schoolName: string) => {
    const schoolObj = schools.find((s) => s.id === id);
    setActionDialog({ id, action, label, schoolName, slug: schoolObj?.slug });
    setActionReason("");
    if (action === "suspend") {
      setSuspendForm({
        type: "MAINTENANCE",
        title: "🛠️ Scheduled System Maintenance in Progress",
        reason: "Our school portal is temporarily offline for scheduled system upgrades and data maintenance. Normal service will resume shortly. We apologize for any inconvenience.",
        actionType: "ACKNOWLEDGE",
        actionUrl: "",
        estimatedReturn: "",
        contactPhone: schoolObj?.phone || "",
        contactEmail: schoolObj?.email || "",
        theme: "amber",
      });
    }
  };

  const handleApplySuspensionPreset = (preset: typeof SUSPENSION_THEME_PRESETS[0]) => {
    setSuspendForm((prev) => ({
      ...prev,
      type: preset.type,
      title: preset.title,
      reason: preset.reason,
      actionType: preset.actionType,
      actionUrl: preset.actionUrl || "",
      theme: preset.theme,
    }));
  };

  const confirmAction = async () => {
    if (!actionDialog) return;
    const { id, action } = actionDialog;
    setSaving(true);
    try {
      if (action === "suspend") {
        if (!suspendForm.reason.trim()) {
          toast.error("Please provide a notice reason / message");
          setSaving(false);
          return;
        }
        await apiClient.patch(`/schools/${id}/suspend`, suspendForm);
        toast.success(`School ${actionDialog.schoolName} placed offline with ${suspendForm.type} notice`);
      } else {
        await apiClient.patch(`/schools/${id}/${action}`, {
          reason: actionReason.trim() || undefined,
        });
        toast.success(`School ${actionDialog.label} successfully`);
      }
      setActionDialog(null);
      fetchData();
      if (selected?.id === id) {
        openModal("view", { ...selected, isActive: action === "activate" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} school`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextAction: SchoolAction = s.isActive ? "suspend" : "activate";
    handleAction(s.id, nextAction, s.isActive ? "suspended" : "activated", s.name);
  };

  const enterCampus = (slug: string) => {
    window.open(`/${slug}/dashboard`, "_blank");
  };

  const exportCSV = () => {
    if (!schools.length) {
      toast.error("No schools to export");
      return;
    }
    const headers = ["ID", "Name", "Slug", "Status", "Plan", "Expiry", "Students", "Teachers", "City", "Email", "Phone"];
    const rows = schools.map(s => [
      s.id,
      `"${s.name}"`,
      s.slug,
      s.isActive ? "ACTIVE" : "SUSPENDED",
      s.subscription?.plan || "FREE_TRIAL",
      s.subscription?.endDate ? new Date(s.subscription.endDate).toISOString().split('T')[0] : "N/A",
      s._count?.students ?? 0,
      s._count?.teachers ?? 0,
      `"${s.city || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edusphere_schools_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("School list exported to CSV!");
  };

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch =
        search === "" ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.slug?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.city?.toLowerCase().includes(search.toLowerCase());

      const matchPlan =
        planFilter === "ALL" || s.subscription?.plan === planFilter;

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "SUSPENDED" && !s.isActive) ||
        (statusFilter === "EXPIRING" &&
          s.subscription?.endDate &&
          new Date(s.subscription.endDate).getTime() - Date.now() <
            30 * 24 * 60 * 60 * 1000 &&
          new Date(s.subscription.endDate).getTime() > Date.now());

      return matchSearch && matchPlan && matchStatus;
    });
  }, [schools, search, planFilter, statusFilter]);

  const kpiStats = useMemo(() => {
    const total = schools.length;
    const active = schools.filter((s) => s.isActive).length;
    const suspended = total - active;
    const totalStudents = schools.reduce(
      (acc, s) => acc + (s._count?.students || 0),
      0,
    );
    const totalTeachers = schools.reduce(
      (acc, s) => acc + (s._count?.teachers || 0),
      0,
    );
    const expiring = schools.filter(
      (s) =>
        s.subscription?.endDate &&
        new Date(s.subscription.endDate).getTime() - Date.now() <
          30 * 24 * 60 * 60 * 1000 &&
        new Date(s.subscription.endDate).getTime() > Date.now(),
    ).length;

    return { total, active, suspended, totalStudents, totalTeachers, expiring };
  }, [schools]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span>Registered Schools & Campuses</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {schools.length} Total
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full governance, real-time alert broadcasts, subscription lifecycle, and tenant administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            title="Export full school list to CSV"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent font-bold text-xs transition-all shadow-sm"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            title="Refresh schools"
            className="p-2.5 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-violet-500" : ""} />
          </button>
          <button
            onClick={() => openModal("create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Campus</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Campuses</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle size={16} /></div>
          </div>
          <p className="text-2xl font-black text-foreground">{kpiStats.active}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">{kpiStats.suspended} suspended / offline</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Students</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><GraduationCap size={16} /></div>
          </div>
          <p className="text-2xl font-black text-foreground">{kpiStats.totalStudents.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">Enrolled across network</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Teachers & Staff</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center"><Users size={16} /></div>
          </div>
          <p className="text-2xl font-black text-foreground">{kpiStats.totalTeachers.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">Active faculty & staff</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Expiring Soon</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock size={16} /></div>
          </div>
          <p className="text-2xl font-black text-amber-500">{kpiStats.expiring}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">Within next 30 days</p>
        </div>
      </div>

      {/* ── Sub-Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border pb-1 flex-wrap">
        {[
          { id: "ALL", label: "All Campuses", icon: Globe },
          { id: "ACTIVE", label: "Active Only", icon: CheckCircle },
          { id: "SUSPENDED", label: "Suspended / Offline", icon: Ban },
          { id: "EXPIRING", label: "Expiring Soon", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === t.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            }`}
          >
            <t.icon size={13} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Advanced Filters ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card flex-1 w-full group focus-within:border-violet-500/40 transition-all shadow-sm">
          <Search
            size={16}
            className="text-muted-foreground group-focus-within:text-violet-400 transition-colors shrink-0"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campuses by name, slug, email, or city..."
            className="bg-transparent border-none text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Layers
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="pl-9 pr-8 py-3 rounded-2xl border border-border bg-card text-foreground text-[12px] font-bold appearance-none cursor-pointer focus:outline-none focus:border-primary/40 min-w-[160px] shadow-sm"
            >
              <option value="ALL">All Service Tiers</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground rounded-3xl border border-dashed border-border">
          <Shield size={32} className="opacity-40" />
          <p className="font-bold text-base text-foreground">No Schools Found</p>
          <p className="text-xs">
            Try adjusting your search criteria or register a new campus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s, i) => {
            const isSuspended = !s.isActive;
            const currentPlan = s.subscription?.plan || "PROFESSIONAL";
            const expiryDate = s.subscription?.endDate
              ? new Date(s.subscription.endDate).toLocaleDateString("en-PK")
              : "N/A";
            const isExpiring = s.subscription?.endDate && (new Date(s.subscription.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000);

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openModal("view", s, "overview")}
                className={`group relative rounded-3xl border cursor-pointer ${
                  isSuspended
                    ? "border-rose-500/20 bg-rose-500/[0.03]"
                    : "border-border bg-card hover:border-violet-500/40"
                } p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
              >
                {/* Header: Logo, Name & Direct ON/OFF toggle */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-black text-lg shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-foreground truncate leading-tight group-hover:text-violet-400 transition-colors">
                          {s.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-tight mt-0.5 flex items-center gap-1">
                          <Globe size={11} className="text-violet-400 shrink-0" />
                          <span className="truncate">{s.slug}</span>
                        </p>
                      </div>
                    </div>

                    {/* Direct ON/OFF Toggle Switch */}
                    <button
                      onClick={(e) => handleToggleStatus(s, e)}
                      title={s.isActive ? "Click to Suspend (Turn OFF)" : "Click to Activate (Turn ON)"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all shrink-0 ${
                        s.isActive
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-500"
                          : "bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-500"
                      }`}
                    >
                      <div className={`w-7 h-3.5 rounded-full transition-colors relative ${s.isActive ? "bg-emerald-500" : "bg-rose-500"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-all ${s.isActive ? "left-3.5" : "left-0.5"}`} />
                      </div>
                      <span>{s.isActive ? "ON" : "OFF"}</span>
                    </button>
                  </div>

                  {/* Campus Metrics Cards */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-muted/40 border border-border/50 mb-4 text-center">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        {s._count?.students ?? 0}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                        Students
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">
                        {s._count?.teachers ?? 0}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                        Teachers
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">
                        {s._count?.users ?? 0}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                        Users
                      </p>
                    </div>
                  </div>

                  {/* Details summary */}
                  <div className="space-y-1.5 text-[11px] text-muted-foreground mb-5">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={12} className="text-violet-400 shrink-0" />
                      <span className="truncate">
                        {[s.city, s.province || "Pakistan"].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Calendar size={12} className="text-violet-400 shrink-0" />
                      <span>
                        Expiry:{" "}
                        <strong className={`font-bold ${isExpiring ? "text-amber-400" : "text-foreground"}`}>
                          {expiryDate}
                        </strong>
                      </span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-violet-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight ${
                      planColors[currentPlan] || planColors.PROFESSIONAL
                    }`}
                  >
                    {currentPlan.replace("_", " ")}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Send Alert Quick Button */}
                    <button
                      onClick={() => openModal("alert", s)}
                      title="Send Instant Notice / Alert"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold transition-all"
                    >
                      <Send size={11} />
                      <span className="hidden sm:inline">Alert</span>
                    </button>

                    {/* Enter campus portal button */}
                    <button
                      onClick={() => enterCampus(s.slug)}
                      title="Open Campus Portal"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-300 hover:bg-violet-600/30 text-[11px] font-bold transition-all"
                    >
                      <ExternalLink size={12} />
                      <span>Portal</span>
                    </button>

                    <button
                      onClick={() => openModal("view", s, "overview")}
                      title="View Details"
                      className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <Eye size={13} />
                    </button>

                    <button
                      onClick={() => openModal("edit", s)}
                      title="Edit School"
                      className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    >
                      <Edit2 size={13} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === s.id ? null : s.id)
                        }
                        className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
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
                              className="absolute right-0 bottom-full mb-2 z-40 w-48 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl backdrop-blur-xl"
                            >
                              <button
                                onClick={() => openModal("alert", s)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-all"
                              >
                                <Send size={13} />
                                <span>Broadcast Alert</span>
                              </button>
                              <button
                                onClick={() => openModal("extend", s)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent transition-all"
                              >
                                <Calendar size={13} className="text-violet-400" />
                                <span>Extend Expiry</span>
                              </button>
                              <button
                                onClick={() => openModal("plan", s)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent transition-all"
                              >
                                <CreditCard size={13} className="text-amber-400" />
                                <span>Change Plan</span>
                              </button>
                              {s.isActive ? (
                                <button
                                  onClick={() => {
                                    handleAction(s.id, "suspend", "suspended", s.name);
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
                                    handleAction(s.id, "activate", "activated", s.name);
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
                                  handleAction(s.id, "archive", "archived", s.name);
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={13} />
                                <span>Archive Campus</span>
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
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    Register New Institution
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add a new campus to EduSphere network
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Campus Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Beaconhouse Model Town"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                    >
                      {PROVINCES.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      City / District
                    </label>
                    <select
                      value={form.district}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, district: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Block C, Model Town, Lahore"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-3">
                  <p className="text-xs font-bold text-violet-400">
                    Initial Campus Administrator
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Admin Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Principal / Director"
                        value={form.adminName}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adminName: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
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
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Admin Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+92 300 1234567"
                        value={form.adminPhone}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adminPhone: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
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
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Initial Subscription Plan
                    </label>
                    <select
                      value={form.plan}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, plan: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Fee Amount (PKR / USD)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground font-semibold text-xs hover:bg-accent transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
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
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h3 className="text-base font-black text-foreground">
                  Edit Campus Profile
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, adminEmail: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.adminPhone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, adminPhone: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">
                    Address / City
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. Comprehensive View School Modal with Tabs */}
        {modal === "view" && selected && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl my-6 max-h-[92vh] flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-3xl shrink-0 shadow-lg">
                      {selected.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-2xl font-black text-foreground leading-tight">
                          {selected.name}
                        </h3>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            selected.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {selected.isActive ? "Active / Verified" : "Suspended"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 text-violet-400">
                          <Globe size={13} />
                          {selected.slug}.edusphere.app
                        </span>
                        <span>•</span>
                        <span>{selected.city || "Pakistan"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStatus(selected, e)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        selected.isActive
                          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {selected.isActive ? "Suspend Campus" : "Activate Campus"}
                    </button>
                    <button
                      onClick={() => setModal(null)}
                      className="p-2 rounded-xl bg-accent text-muted-foreground hover:text-foreground transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs bar */}
                <div className="flex items-center gap-1 border-b border-border pb-3 mb-6 overflow-x-auto">
                  {[
                    { id: "overview", label: "Overview & Admin", icon: User },
                    { id: "subscription", label: "Plan & Billing", icon: CreditCard },
                    { id: "alerts", label: `Alerts & Notices (${schoolAlerts.length})`, icon: Send },
                    { id: "stats", label: "Campus Metrics", icon: Activity },
                    { id: "audit", label: "Audit Trail", icon: Clock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setViewTab(tab.id as ViewTab)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        viewTab === tab.id
                          ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <tab.icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {viewTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Building size={14} className="text-violet-400" />
                        Institutional Details
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Campus Name:</span>
                          <span className="font-bold text-foreground">{selected.name}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Portal URL:</span>
                          <span className="font-bold text-violet-400">{selected.slug}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Official Email:</span>
                          <span className="font-bold text-foreground">{selected.email || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Phone Number:</span>
                          <span className="font-bold text-foreground">{selected.phone || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-bold text-foreground text-right">{selected.address || "N/A"}, {selected.city || ""}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Registered On:</span>
                          <span className="font-bold text-foreground">
                            {new Date(selected.createdAt).toLocaleDateString("en-PK")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <User size={14} className="text-violet-400" />
                        Principal / School Admin
                      </h4>
                      {selected.users && selected.users.length > 0 ? (
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Admin Name:</span>
                            <span className="font-bold text-foreground">{selected.users[0].name}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Admin Email:</span>
                            <span className="font-bold text-foreground">{selected.users[0].email}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground">Admin Phone:</span>
                            <span className="font-bold text-foreground">{selected.users[0].phone || "N/A"}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-muted-foreground">Account Status:</span>
                            <span className="font-bold text-emerald-400">
                              {selected.users[0].isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-4 text-center">
                          No direct School Admin assigned yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewTab === "subscription" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight ${planColors[selected.subscription?.plan] || planColors.PROFESSIONAL}`}>
                            {selected.subscription?.plan || "PROFESSIONAL"} Tier
                          </span>
                          <span className="text-xs text-emerald-400 font-bold">
                            ● {selected.subscription?.status || "ACTIVE"}
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <p className="text-3xl font-black text-foreground">
                            {selected.subscription?.currency || "PKR"} {selected.subscription?.amount?.toLocaleString() || "0"}
                          </p>
                          <p className="text-xs text-muted-foreground font-bold">/ billing period</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground text-[10px] font-bold uppercase">Valid From:</span>
                            <p className="font-bold text-foreground mt-0.5">
                              {selected.subscription?.startDate ? new Date(selected.subscription.startDate).toLocaleDateString("en-PK") : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] font-bold uppercase">Expires On:</span>
                            <p className="font-bold text-emerald-400 mt-0.5">
                              {selected.subscription?.endDate ? new Date(selected.subscription.endDate).toLocaleDateString("en-PK") : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => openModal("extend", selected)}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          + Extend Validity Days
                        </button>
                        <button
                          onClick={() => openModal("plan", selected)}
                          className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-bold text-xs transition-all cursor-pointer"
                        >
                          Upgrade / Change Plan
                        </button>
                      </div>
                    </div>

                    {/* Onboarding Payments History */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <DollarSign size={14} className="text-violet-400" />
                        Billing & Payment Submissions
                      </h4>
                      {selected.onboardingPayments && selected.onboardingPayments.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-border">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b border-border text-[10px] font-black uppercase text-muted-foreground">
                              <tr>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Reference</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {selected.onboardingPayments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-accent/30">
                                  <td className="p-3 font-bold text-foreground">{p.plan}</td>
                                  <td className="p-3 font-black text-foreground">PKR {p.amount?.toLocaleString()}</td>
                                  <td className="p-3 text-muted-foreground">{p.method}</td>
                                  <td className="p-3 font-mono text-[11px]">{p.reference || "—"}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                      p.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-muted-foreground">
                                    {new Date(p.submittedAt || p.createdAt).toLocaleDateString("en-PK")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                          No direct onboarding payment records found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewTab === "alerts" && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Send New Alert Form */}
                    <div className="p-5 rounded-2xl bg-muted/20 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <Send size={14} />
                          Dispatch New Alert to School Dashboard
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          Appears instantly when School Admin logs in
                        </span>
                      </div>

                      {/* Preset Templates chips */}
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
                          ⚡ Instant Presets & Templates:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ALERT_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleApplyPreset(preset)}
                              className="px-3 py-1.5 rounded-xl border border-border hover:border-violet-500/40 bg-card hover:bg-accent text-foreground text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Sparkles size={11} className="text-amber-400" />
                              <span>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleSendAlert} className="space-y-3.5 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Alert Type</label>
                            <select
                              value={alertForm.type}
                              onChange={(e) => setAlertForm((p) => ({ ...p, type: e.target.value }))}
                              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
                            >
                              <option value="PAYMENT">PAYMENT (Fee / Renewal)</option>
                              <option value="WARNING">WARNING (Policy / Expiry)</option>
                              <option value="MAINTENANCE">MAINTENANCE (System)</option>
                              <option value="SUSPENSION">SUSPENSION (Critical)</option>
                              <option value="INFO">INFO (General Notice)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Priority</label>
                            <select
                              value={alertForm.priority}
                              onChange={(e) => setAlertForm((p) => ({ ...p, priority: e.target.value }))}
                              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
                            >
                              <option value="LOW">LOW</option>
                              <option value="NORMAL">NORMAL</option>
                              <option value="HIGH">HIGH</option>
                              <option value="CRITICAL">CRITICAL (Cannot Dismiss)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Action Button</label>
                            <select
                              value={alertForm.actionType}
                              onChange={(e) => setAlertForm((p) => ({ ...p, actionType: e.target.value }))}
                              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
                            >
                              <option value="RENEW_PAYMENT">Open Subscription Page</option>
                              <option value="ACKNOWLEDGE">Acknowledge / Dismiss</option>
                              <option value="OPEN_LINK">Custom Link</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Alert Headline / Title</label>
                          <input
                            type="text"
                            required
                            value={alertForm.title}
                            onChange={(e) => setAlertForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. ⚠️ Payment Overdue Notice"
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Alert Message / Reason</label>
                          <textarea
                            rows={3}
                            required
                            value={alertForm.message}
                            onChange={(e) => setAlertForm((p) => ({ ...p, message: e.target.value }))}
                            placeholder="Detailed explanation that will be shown directly on the School Admin dashboard..."
                            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50 resize-none"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                          >
                            <Send size={13} />
                            <span>{saving ? "Sending..." : "Dispatch Alert to School"}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Active & Historical Alerts */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-violet-400" />
                        Dispatched Alerts for {selected.name}
                      </h4>
                      {loadingAlerts ? (
                        <div className="flex h-24 items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-violet-500" />
                        </div>
                      ) : schoolAlerts.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                          No active or past alerts for this school.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {schoolAlerts.map((alt) => (
                            <div
                              key={alt.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                alt.priority === 'CRITICAL'
                                  ? 'bg-rose-500/10 border-rose-500/30'
                                  : alt.type === 'PAYMENT'
                                  ? 'bg-amber-500/10 border-amber-500/30'
                                  : 'bg-card border-border'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-foreground">{alt.title}</span>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent text-foreground">
                                    {alt.type}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    alt.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'
                                  }`}>
                                    {alt.isActive ? 'Active' : 'Disabled'}
                                  </span>
                                  {alt.isDismissed && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                                      Dismissed by Tenant
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {alt.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                                  Sent: {new Date(alt.createdAt).toLocaleDateString('en-PK')} by {alt.createdBy}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 justify-end">
                                <button
                                  onClick={() => handleToggleAlertActive(alt.id, alt.isActive)}
                                  className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                >
                                  {alt.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleDeleteAlert(alt.id)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                                  title="Delete Alert"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewTab === "stats" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center">
                        <GraduationCap size={20} className="mx-auto text-violet-400 mb-2" />
                        <p className="text-2xl font-black text-foreground">{selected._count?.students ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Students Enrolled</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center">
                        <Users size={20} className="mx-auto text-blue-400 mb-2" />
                        <p className="text-2xl font-black text-foreground">{selected._count?.teachers ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Teachers</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center">
                        <Briefcase size={20} className="mx-auto text-amber-400 mb-2" />
                        <p className="text-2xl font-black text-foreground">{selected._count?.staff ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Staff Members</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border text-center">
                        <Building size={20} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-2xl font-black text-foreground">{selected._count?.classes ?? 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Classes / Sections</p>
                      </div>
                    </div>
                  </div>
                )}

                {viewTab === "audit" && (
                  <div className="space-y-3 animate-fade-in">
                    {(selected.auditLogs || []).length > 0 ? (
                      selected.auditLogs.map((act: any) => (
                        <div key={act.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-3">
                            <Activity size={14} className="text-violet-400" />
                            <span className="text-xs font-semibold text-foreground">{act.after || act.action}</span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {new Date(act.createdAt).toLocaleDateString("en-PK")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                        No recorded audit logs for this campus yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-border mt-6">
                <button
                  onClick={() => openModal("edit", selected)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => enterCampus(selected.slug)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/25 cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Enter School Portal</span>
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
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="text-sm font-black text-foreground">
                  Extend Subscription
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleExtendExpiry} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Extending subscription for{" "}
                  <strong className="text-foreground">{selected.name}</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        extendDays === d
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Custom Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
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
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="text-sm font-black text-foreground">
                  Change Service Tier
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleChangePlan} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Update plan tier for{" "}
                  <strong className="text-foreground">{selected.name}</strong>.
                </p>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Select New Plan
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Recorded Amount
                  </label>
                  <input
                    type="number"
                    value={newPlanAmount}
                    onChange={(e) => setNewPlanAmount(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving..." : "Update Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rich Confirmation & Turn-Off Theme Modal */}
      <AnimatePresence>
        {actionDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full ${
                actionDialog.action === "suspend" ? "max-w-3xl" : "max-w-md"
              } rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl my-8`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl ${
                      actionDialog.action === "suspend"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : actionDialog.action === "activate"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {actionDialog.action === "suspend" ? (
                      <Ban size={22} />
                    ) : actionDialog.action === "activate" ? (
                      <CheckCircle size={22} />
                    ) : (
                      <Trash2 size={22} />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">
                      {actionDialog.action === "suspend"
                        ? "School Portal Status Control"
                        : "Campus Management"}
                    </p>
                    <h3 className="text-lg font-black text-foreground">
                      {actionDialog.action === "suspend"
                        ? `Turn OFF School & Set Notice: ${actionDialog.schoolName}`
                        : actionDialog.action === "activate"
                        ? `Activate / Turn ON: ${actionDialog.schoolName}`
                        : `Archive: ${actionDialog.schoolName}`}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setActionDialog(null)}
                  disabled={saving}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SUSPEND / TURN OFF MODE */}
              {actionDialog.action === "suspend" ? (
                <div className="mt-5 space-y-5">
                  <p className="text-xs text-muted-foreground">
                    Select a notice reason & theme. When students, teachers, or parents visit or log in, they will be presented with this exact themed offline notice along with administration contact details.
                  </p>

                  {/* 1. Theme & Reason Presets */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles size={13} className="text-violet-400" />
                      Choose Notice Theme & Reason Preset
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {SUSPENSION_THEME_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = suspendForm.type === preset.type;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplySuspensionPreset(preset)}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2 ${
                              isSelected
                                ? "border-violet-500 bg-violet-500/10 shadow-md ring-1 ring-violet-500"
                                : "border-border/70 bg-background/50 hover:border-border hover:bg-accent/40"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div
                                className={`p-1.5 rounded-xl border ${preset.colorClass}`}
                              >
                                <Icon size={14} />
                              </div>
                              {isSelected && (
                                <span className="h-4 w-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground leading-tight">
                                {preset.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                Theme: {preset.theme}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Custom Title & Detailed Reason Text */}
                  <div className="grid grid-cols-1 gap-3.5">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        Public Notice Title
                      </label>
                      <input
                        type="text"
                        value={suspendForm.title}
                        onChange={(e) =>
                          setSuspendForm((p) => ({ ...p, title: e.target.value }))
                        }
                        placeholder="e.g. 🛠️ Scheduled System Maintenance in Progress"
                        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary/60"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        Detailed Reason & Instructions for Users
                      </label>
                      <textarea
                        rows={3}
                        value={suspendForm.reason}
                        onChange={(e) =>
                          setSuspendForm((p) => ({ ...p, reason: e.target.value }))
                        }
                        placeholder="Explain why the school is temporarily off and what actions users should take..."
                        className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground outline-none resize-none focus:border-primary/60 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* 3. Estimated Resumption & Admin Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Expected Return Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={suspendForm.estimatedReturn}
                        onChange={(e) =>
                          setSuspendForm((p) => ({
                            ...p,
                            estimatedReturn: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary/60"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        School Contact Helpline
                      </label>
                      <input
                        type="text"
                        value={suspendForm.contactPhone}
                        onChange={(e) =>
                          setSuspendForm((p) => ({
                            ...p,
                            contactPhone: e.target.value,
                          }))
                        }
                        placeholder="+92 300 1234567"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary/60"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Official Admin Email
                      </label>
                      <input
                        type="email"
                        value={suspendForm.contactEmail}
                        onChange={(e) =>
                          setSuspendForm((p) => ({
                            ...p,
                            contactEmail: e.target.value,
                          }))
                        }
                        placeholder="admin@school.pk"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary/60"
                      />
                    </div>
                  </div>

                  {/* 4. Live Mini-Preview of Offline Banner */}
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                      <Eye size={12} /> Live Preview on School Portal
                    </p>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3.5 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 mt-0.5">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-foreground">
                          {suspendForm.title || "School Portal Offline"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {suspendForm.reason || "This school is offline."}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                          <span>
                            Helpline:{" "}
                            <strong className="text-foreground">
                              {suspendForm.contactPhone || "School Admin"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Email:{" "}
                            <strong className="text-foreground">
                              {suspendForm.contactEmail || "admin@school.pk"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                    {actionDialog.slug ? (
                      <a
                        href={`/${actionDialog.slug}/offline`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300"
                      >
                        <span>Preview Full Offline Page</span>
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setActionDialog(null)}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-accent transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void confirmAction()}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-950/40 transition disabled:opacity-60 cursor-pointer"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                        <span>{saving ? "Placing Offline..." : "Confirm & Turn OFF School"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ACTIVATE OR ARCHIVE MODE */
                <div className="mt-5 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {actionDialog.action === "activate"
                      ? "Activating this school will immediately restore online access for students, teachers, and administrators and clear active offline notice banners."
                      : "Archiving this school will remove it from active directory."}
                  </p>

                  <label className="block text-xs font-bold text-muted-foreground">
                    Reason {actionDialog.action === "activate" ? "(optional)" : "(required)"}
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={2}
                      placeholder={
                        actionDialog.action === "activate"
                          ? "e.g. Subscription verified or maintenance completed"
                          : "State the reason for archiving"
                      }
                      className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none focus:border-primary/50"
                    />
                  </label>

                  <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setActionDialog(null)}
                      disabled={saving}
                      className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmAction()}
                      disabled={saving}
                      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white transition disabled:opacity-60 cursor-pointer ${
                        actionDialog.action === "activate"
                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/30"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      <span>
                        {saving
                          ? "Processing..."
                          : actionDialog.action === "activate"
                          ? "Confirm & Turn ON School"
                          : `Confirm ${actionDialog.action}`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
