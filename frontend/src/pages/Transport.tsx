import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Plus, RefreshCw, Search, Trash2, Users, Route as RouteIcon,
  Loader2, MapPin, Phone, ShieldCheck, Download, AlertCircle, CheckCircle2,
  Clock, DollarSign, Calendar, Fuel, UserCheck, ChevronRight, X
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

type RouteItem = {
  id: string;
  name: string;
  description?: string | null;
  startPoint?: string | null;
  endPoint?: string | null;
  distance?: number | null;
  stops?: string[] | null;
  estimatedTime?: string | null;
  fee?: number | null;
  status?: string | null;
  vehicles?: VehicleItem[];
  _count?: { vehicles?: number; assignments?: number };
};

type VehicleItem = {
  id: string;
  vehicleNo: string;
  type?: string | null;
  capacity?: number | null;
  model?: string | null;
  year?: number | null;
  fuelType?: string | null;
  status?: string | null;
  routeId?: string | null;
  route?: { id: string; name: string } | null;
  driverName?: string | null;
  driverPhone?: string | null;
};

type AssignmentItem = {
  id: string;
  studentId: string;
  routeId: string;
  vehicleId: string;
  pickupPoint?: string | null;
  dropPoint?: string | null;
  pickupTime?: string | null;
  dropTime?: string | null;
  feeStatus?: string | null;
  monthlyFee?: number | null;
  student?: { id: string; name: string; admissionNo?: string | null } | null;
  route?: { id: string; name: string } | null;
  vehicle?: { id: string; vehicleNo: string } | null;
};

type Student = { id: string; name: string; admissionNo?: string | null };

const emptyRoute = {
  name: '',
  description: '',
  startPoint: '',
  endPoint: '',
  distance: '',
  stops: '',
  estimatedTime: '',
  fee: '',
};

const emptyVehicle = {
  vehicleNo: '',
  type: 'BUS',
  capacity: '30',
  model: '',
  year: String(new Date().getFullYear()),
  fuelType: 'DIESEL',
  routeId: '',
  driverName: '',
  driverPhone: '',
};

const emptyAssignment = {
  studentId: '',
  routeId: '',
  vehicleId: '',
  pickupPoint: '',
  dropPoint: '',
  pickupTime: '07:15',
  dropTime: '14:30',
  monthlyFee: '3500',
};

const money = (v?: number | null) => `PKR ${Number(v || 0).toLocaleString('en-PK')}`;

export default function Transport() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';

  const [tab, setTab] = useState<'overview' | 'routes' | 'vehicles' | 'assignments'>('overview');
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState<'route' | 'vehicle' | 'assignment' | null>(null);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);

  const load = async () => {
    setLoading(true);
    try {
      const [routeRes, vehicleRes, assignmentRes, studentRes] = await Promise.all([
        apiClient.get('/academics/routes').catch(() => ({ data: [] })),
        apiClient.get('/academics/vehicles').catch(() => ({ data: [] })),
        apiClient.get('/academics/transport/assignments').catch(() => ({ data: [] })),
        apiClient.get('/people/students').catch(() => ({ data: [] })),
      ]);
      setRoutes(Array.isArray(routeRes.data) ? routeRes.data : []);
      setVehicles(Array.isArray(vehicleRes.data) ? vehicleRes.data : []);
      setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load transport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRoutes = useMemo(
    () =>
      routes.filter((r) =>
        `${r.name} ${r.startPoint || ''} ${r.endPoint || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [routes, search]
  );

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) =>
        `${v.vehicleNo} ${v.model || ''} ${v.driverName || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [vehicles, search]
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((a) =>
        `${a.student?.name || ''} ${a.vehicle?.vehicleNo || ''} ${a.route?.name || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [assignments, search]
  );

  const createRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/academics/routes', {
        ...routeForm,
        distance: routeForm.distance ? Number(routeForm.distance) : undefined,
        fee: routeForm.fee ? Number(routeForm.fee) : undefined,
        stops: routeForm.stops
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success('Route created successfully');
      setModal(null);
      setRouteForm(emptyRoute);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create route');
    } finally {
      setSaving(false);
    }
  };

  const createVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNo.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/academics/vehicles', {
        ...vehicleForm,
        capacity: Number(vehicleForm.capacity),
        year: Number(vehicleForm.year),
        routeId: vehicleForm.routeId || undefined,
      });
      toast.success('Vehicle registered successfully');
      setModal(null);
      setVehicleForm(emptyVehicle);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to register vehicle');
    } finally {
      setSaving(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.studentId || !assignmentForm.routeId || !assignmentForm.vehicleId) {
      toast.error('Please select student, route, and vehicle');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/academics/transport/assignments', {
        ...assignmentForm,
        monthlyFee: assignmentForm.monthlyFee ? Number(assignmentForm.monthlyFee) : undefined,
      });
      toast.success('Student assigned to transport');
      setModal(null);
      setAssignmentForm(emptyAssignment);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind: 'route' | 'vehicle' | 'assignment', id: string) => {
    if (!window.confirm('Delete this transport record?')) return;
    const path =
      kind === 'route'
        ? `/academics/routes/${id}`
        : kind === 'vehicle'
        ? `/academics/vehicles/${id}`
        : `/academics/transport/assignments/${id}`;
    try {
      await apiClient.delete(path);
      toast.success('Record removed');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to delete record');
    }
  };

  const totalCapacity = vehicles.reduce((sum, v) => sum + Number(v.capacity || 0), 0);
  const activeVehicles = vehicles.filter((v) => (v.status || 'ACTIVE') === 'ACTIVE').length;
  const totalRevenue = assignments.reduce((sum, a) => sum + Number(a.monthlyFee || 0), 0);
  const occupancyRate = totalCapacity ? Math.round((assignments.length / totalCapacity) * 100) : 0;

  const exportCsv = () => {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredAssignments.map((a) =>
      [
        a.student?.name,
        a.student?.admissionNo,
        a.route?.name,
        a.vehicle?.vehicleNo,
        a.pickupPoint,
        a.dropPoint,
        a.pickupTime,
        a.dropTime,
        a.monthlyFee,
        a.feeStatus,
      ]
        .map(escape)
        .join(',')
    );
    const csv = [
      'Student Name,Admission No,Route,Vehicle,Pickup Point,Drop Point,Pickup Time,Drop Time,Monthly Fee,Status',
      ...rows,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Transport_Assignments_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Transport manifest exported');
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-16">
      {/* ─── Top Banner ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldCheck size={12} /> Campus Transit Network
            </span>
            <span className="text-xs text-muted-foreground">• Fleet & Logistics</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Transport Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage institutional transit routes, bus fleets, student pick/drop stops, and fee collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-foreground transition-all active:scale-95"
            title="Refresh Fleet"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          </button>

          {assignments.length > 0 && (
            <button
              onClick={exportCsv}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-xs font-bold flex items-center gap-2 hover:bg-accent transition-all active:scale-95"
            >
              <Download size={14} /> Export Manifest
            </button>
          )}

          {canManage && tab === 'routes' && (
            <button
              onClick={() => setModal('route')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-md transition-all active:scale-95"
            >
              <Plus size={15} /> Add Route
            </button>
          )}

          {canManage && tab === 'vehicles' && (
            <button
              onClick={() => setModal('vehicle')}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-md transition-all active:scale-95"
            >
              <Plus size={15} /> Register Vehicle
            </button>
          )}

          {canManage && (tab === 'assignments' || tab === 'overview') && (
            <button
              onClick={() => setModal('assignment')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
            >
              <Plus size={15} /> Assign Student
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Transit Corridors',
            value: routes.length,
            icon: RouteIcon,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15 group-hover:bg-amber-500/25',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500',
            dotPing: 'bg-amber-400',
            shadow: 'shadow-amber-500/[0.04] hover:shadow-amber-500/15',
            subtitle: 'Configured pick & drop routes',
          },
          {
            label: 'Fleet Vehicles',
            value: `${activeVehicles} / ${vehicles.length}`,
            icon: Bus,
            gradient: 'from-sky-500/[0.08] via-card/70 to-card',
            border: 'border-sky-500/25 hover:border-sky-500/50',
            glow: 'bg-sky-500/15 group-hover:bg-sky-500/25',
            iconBox: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
            labelColor: 'text-sky-600 dark:text-sky-400',
            dotColor: 'bg-sky-500',
            dotPing: 'bg-sky-400',
            shadow: 'shadow-sky-500/[0.04] hover:shadow-sky-500/15',
            subtitle: `${totalCapacity} seats total fleet capacity`,
          },
          {
            label: 'Student Riders',
            value: assignments.length,
            icon: Users,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500',
            dotPing: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/[0.04] hover:shadow-emerald-500/15',
            subtitle: `${occupancyRate}% fleet occupancy`,
          },
          {
            label: 'Monthly Transit Billing',
            value: money(totalRevenue),
            icon: DollarSign,
            gradient: 'from-violet-500/[0.08] via-card/70 to-card',
            border: 'border-violet-500/25 hover:border-violet-500/50',
            glow: 'bg-violet-500/15 group-hover:bg-violet-500/25',
            iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
            labelColor: 'text-violet-600 dark:text-violet-400',
            dotColor: 'bg-violet-500',
            dotPing: 'bg-violet-400',
            shadow: 'shadow-violet-500/[0.04] hover:shadow-violet-500/15',
            subtitle: 'Recurring transport fees',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {value}
                </h4>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabs & Search Filter ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 bg-accent/30 rounded-xl w-fit">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'overview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('routes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'routes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setTab('vehicles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'vehicles' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'assignments'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Student Riders ({assignments.length})
          </button>
        </div>

        {tab !== 'overview' && (
          <div className="relative sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* ─── Content Loading State ────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Synchronizing transport database...</p>
        </div>
      ) : tab === 'overview' ? (
        /* ─── Tab: Overview ─────────────────────────────────────────────────── */
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <RouteIcon size={20} />
            </div>
            <h3 className="font-bold text-foreground text-base">Configured Routes</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {routes.length} active routes established across city zones.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Manage route details</span>
              <button
                onClick={() => setTab('routes')}
                className="font-bold text-primary flex items-center gap-1 hover:underline"
              >
                View Routes <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-sky-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
              <Bus size={20} />
            </div>
            <h3 className="font-bold text-foreground text-base">Vehicle Fleet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeVehicles} road-ready buses and coasters with {totalCapacity} seats.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Inspect vehicle status</span>
              <button
                onClick={() => setTab('vehicles')}
                className="font-bold text-primary flex items-center gap-1 hover:underline"
              >
                View Fleet <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-foreground text-base">Student Commuters</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {assignments.length} enrolled students assigned to morning & afternoon transit.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Check pickup points</span>
              <button
                onClick={() => setTab('assignments')}
                className="font-bold text-primary flex items-center gap-1 hover:underline"
              >
                View Riders <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : tab === 'routes' ? (
        /* ─── Tab: Routes ───────────────────────────────────────────────────── */
        <div className="space-y-4">
          {filteredRoutes.length === 0 ? (
            <div className="py-20 rounded-2xl border border-dashed border-border bg-card/40 text-center p-8">
              <RouteIcon size={46} className="mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-bold text-foreground">No Routes Found</h3>
              <p className="text-xs text-muted-foreground mt-1">Add your school's transit corridors to begin.</p>
              {canManage && (
                <button
                  onClick={() => setModal('route')}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  Create Route
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoutes.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Route
                        </span>
                        <h2 className="font-bold text-base text-foreground mt-1.5">{r.name}</h2>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => remove('route', r.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                          title="Delete route"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin size={13} className="text-amber-500 shrink-0" />
                      <span>{r.startPoint || 'Campus'}</span> → <span>{r.endPoint || 'Terminal'}</span>
                    </p>

                    {r.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.description}</p>}

                    {Array.isArray(r.stops) && r.stops.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.stops.map((stop, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-accent/60 text-[10px] text-foreground font-semibold"
                          >
                            {stop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{r.distance ?? 0} km • {r.estimatedTime || '45 mins'}</span>
                    <span className="font-bold text-foreground">{money(r.fee)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'vehicles' ? (
        /* ─── Tab: Vehicles ─────────────────────────────────────────────────── */
        <div className="space-y-4">
          {filteredVehicles.length === 0 ? (
            <div className="py-20 rounded-2xl border border-dashed border-border bg-card/40 text-center p-8">
              <Bus size={46} className="mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-bold text-foreground">No Vehicles Registered</h3>
              <p className="text-xs text-muted-foreground mt-1">Register school buses, vans, and drivers.</p>
              {canManage && (
                <button
                  onClick={() => setModal('vehicle')}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  Register Vehicle
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-sky-500/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                          <Bus size={20} />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-foreground bg-accent/60 px-2 py-0.5 rounded-md">
                            {v.vehicleNo}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {v.model || v.type || 'Standard Bus'} • {v.fuelType || 'Diesel'}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => remove('vehicle', v.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-background border border-border">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Capacity</span>
                        <p className="font-bold text-foreground">{v.capacity || 30} Seats</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-background border border-border">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Assigned Route</span>
                        <p className="font-bold text-foreground truncate">{v.route?.name || 'Unassigned'}</p>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-accent/30 text-xs flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <UserCheck size={14} className="text-primary" /> {v.driverName || 'No Driver Assigned'}
                      </span>
                      {v.driverPhone && (
                        <span className="font-mono text-muted-foreground text-[11px]">{v.driverPhone}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'MAINTENANCE'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {v.status || 'Active in Service'}
                    </span>
                    <span className="text-muted-foreground">Model {v.year || 2024}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Tab: Student Assignments ───────────────────────────────────────── */
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="py-20 rounded-2xl border border-dashed border-border bg-card/40 text-center p-8">
              <Users size={46} className="mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-bold text-foreground">No Student Assignments</h3>
              <p className="text-xs text-muted-foreground mt-1">Assign registered students to transport routes.</p>
              {canManage && (
                <button
                  onClick={() => setModal('assignment')}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
                >
                  Assign Student
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-accent/40 border-b border-border">
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-muted-foreground">Student</th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground">Route</th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground">Vehicle</th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground">
                        Pickup / Drop Point
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground">Timing</th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground text-right">
                        Monthly Fee
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-black uppercase text-muted-foreground text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-foreground">{a.student?.name || a.studentId}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {a.student?.admissionNo || 'Student'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{a.route?.name || 'Assigned Route'}</td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{a.vehicle?.vehicleNo || 'Bus'}</td>
                        <td className="px-4 py-3.5">
                          <p className="text-foreground">{a.pickupPoint || 'Campus'}</p>
                          <p className="text-[10px] text-muted-foreground">Drop: {a.dropPoint || 'Home'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono">
                          {a.pickupTime || '07:15 AM'} - {a.dropTime || '02:30 PM'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-foreground">
                          {money(a.monthlyFee)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {canManage && (
                            <button
                              onClick={() => remove('assignment', a.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal 1: Add Route ──────────────────────────────────────────────── */}
      <Modal isOpen={modal === 'route'} onClose={() => setModal(null)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<RouteIcon size={19} />}
          title="Add Transit Route"
          subtitle="Define a route corridor and transit fee"
          onClose={() => setModal(null)}
        />
        <form onSubmit={createRoute} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Route Name *</label>
            <input
              required
              value={routeForm.name}
              onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
              placeholder="e.g. Blue Line (Gulberg to Campus)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Start Point</label>
              <input
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                placeholder="e.g. Gulberg Main Market"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">End Point</label>
              <input
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                placeholder="e.g. School Main Gate"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Distance (km)</label>
              <input
                type="number"
                value={routeForm.distance}
                onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                placeholder="15"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Est. Time</label>
              <input
                value={routeForm.estimatedTime}
                onChange={(e) => setRouteForm({ ...routeForm, estimatedTime: e.target.value })}
                placeholder="40 mins"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Monthly Fee</label>
              <input
                type="number"
                value={routeForm.fee}
                onChange={(e) => setRouteForm({ ...routeForm, fee: e.target.value })}
                placeholder="3500"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Stops (comma separated)</label>
            <input
              value={routeForm.stops}
              onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
              placeholder="Liberty Roundabout, Jail Road, Canal Bank..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Description</label>
            <textarea
              rows={2}
              value={routeForm.description}
              onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
              placeholder="Additional route notes..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Create Route
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 2: Register Vehicle ────────────────────────────────────────── */}
      <Modal isOpen={modal === 'vehicle'} onClose={() => setModal(null)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Bus size={19} />}
          title="Register Fleet Vehicle"
          subtitle="Add a bus, van, or coaster to school inventory"
          onClose={() => setModal(null)}
        />
        <form onSubmit={createVehicle} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Vehicle Number *</label>
              <input
                required
                value={vehicleForm.vehicleNo}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })}
                placeholder="e.g. LES-1234"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Vehicle Type</label>
              <select
                value={vehicleForm.type}
                onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="BUS">School Bus</option>
                <option value="COASTER">Coaster</option>
                <option value="VAN">Van / Hiace</option>
                <option value="MINIBUS">Mini Bus</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Capacity *</label>
              <input
                type="number"
                required
                value={vehicleForm.capacity}
                onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Model</label>
              <input
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                placeholder="Toyota Coaster"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Fuel Type</label>
              <select
                value={vehicleForm.fuelType}
                onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="DIESEL">Diesel</option>
                <option value="PETROL">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Assigned Route</label>
            <select
              value={vehicleForm.routeId}
              onChange={(e) => setVehicleForm({ ...vehicleForm, routeId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">-- No Route Assigned --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.distance ?? 0} km)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Driver Name</label>
              <input
                value={vehicleForm.driverName}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                placeholder="Driver full name"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Driver Phone</label>
              <input
                value={vehicleForm.driverPhone}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                placeholder="0300-1234567"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Register Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 3: Assign Student ─────────────────────────────────────────── */}
      <Modal isOpen={modal === 'assignment'} onClose={() => setModal(null)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<Users size={19} />}
          title="Assign Student to Transit"
          subtitle="Enrol student onto a route and fleet vehicle"
          onClose={() => setModal(null)}
        />
        <form onSubmit={createAssignment} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Select Student *</label>
            <select
              required
              value={assignmentForm.studentId}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">-- Choose student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admissionNo || 'Std'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Select Route *</label>
              <select
                required
                value={assignmentForm.routeId}
                onChange={(e) => {
                  const r = routes.find((item) => item.id === e.target.value);
                  setAssignmentForm({
                    ...assignmentForm,
                    routeId: e.target.value,
                    monthlyFee: r?.fee ? String(r.fee) : assignmentForm.monthlyFee,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="">-- Choose route --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Select Vehicle *</label>
              <select
                required
                value={assignmentForm.vehicleId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="">-- Choose vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNo} ({v.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Pickup Point *</label>
              <input
                required
                value={assignmentForm.pickupPoint}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, pickupPoint: e.target.value })}
                placeholder="e.g. Model Town Stop #4"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Drop Point</label>
              <input
                value={assignmentForm.dropPoint}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dropPoint: e.target.value })}
                placeholder="e.g. Main Gate"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Pickup Time</label>
              <input
                type="time"
                value={assignmentForm.pickupTime}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, pickupTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Drop Time</label>
              <input
                type="time"
                value={assignmentForm.dropTime}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dropTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Monthly Fee (PKR)</label>
              <input
                type="number"
                value={assignmentForm.monthlyFee}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, monthlyFee: e.target.value })}
                placeholder="3500"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Complete Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
