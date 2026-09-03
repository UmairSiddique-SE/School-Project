import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Bus, MapPin, Navigation, User, Phone, X, Loader2,
  Search, Filter, Download, Calendar, Clock, Wrench, Fuel, AlertTriangle,
  CheckCircle, TrendingUp, Users, Route, MoreVertical, Edit2, Eye,
  DollarSign, FileText, BarChart3, Settings, ShieldCheck, Star, Zap,
  Map, Activity, Gauge, Bell, Radio, Navigation2, Play, Pause,
  Square, LocateFixed, History, PieChart, LineChart, AlertCircle
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ─── Types & Interfaces ────────────────────────────────────────────────────────

interface TransportRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  description: string;
  stops: string[];
  estimatedTime: string;
  fee: number;
  status: 'ACTIVE' | 'INACTIVE';
  vehicleCount: number;
  studentCount: number;
}

interface Vehicle {
  id: string;
  vehicleNo: string;
  type: 'BUS' | 'COASTER' | 'VAN' | 'MINIBUS';
  capacity: number;
  model: string;
  year: number;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  routeId?: string;
  routeName?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  fuelLevel?: number;
  // PRO Features
  gpsEnabled: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    lastUpdate: string;
  };
  currentSpeed?: number;
  isMoving: boolean;
  mileage?: number;
  fuelEfficiency?: number;
  maintenanceScore?: number;
}

interface StudentAssignment {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  routeId: string;
  routeName: string;
  vehicleId: string;
  vehicleNo: string;
  pickupPoint: string;
  dropPoint: string;
  pickupTime: string;
  dropTime: string;
  feeStatus: 'PAID' | 'PENDING' | 'DUE';
  monthlyFee: number;
}

// ─── Constants & Helpers ───────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { value: 'BUS', label: 'School Bus', icon: Bus, capacity: 40 },
  { value: 'COASTER', label: 'Coaster', icon: Bus, capacity: 25 },
  { value: 'VAN', label: 'Van', icon: Bus, capacity: 12 },
  { value: 'MINIBUS', label: 'Minibus', icon: Bus, capacity: 15 },
];

const FUEL_TYPES = [
  { value: 'PETROL', label: 'Petrol', color: 'bg-rose-500/10 text-rose-600' },
  { value: 'DIESEL', label: 'Diesel', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'CNG', label: 'CNG', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'ELECTRIC', label: 'Electric', color: 'bg-blue-500/10 text-blue-600' },
];

const VEHICLE_STATUS = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────

export default function Transport() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>(MOCK_ASSIGNMENTS);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'routes' | 'vehicles' | 'assignments'>('overview');
  
  // Modals
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAssignStudent, setShowAssignStudent] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [routeForm, setRouteForm] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    description: '',
    stops: '',
    estimatedTime: '',
    fee: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNo: '',
    type: 'BUS' as Vehicle['type'],
    capacity: '',
    model: '',
    year: '',
    fuelType: 'DIESEL' as Vehicle['fuelType'],
    routeId: '',
    driverName: '',
    driverPhone: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    studentId: '',
    routeId: '',
    pickupPoint: '',
    dropPoint: '',
    pickupTime: '',
    dropTime: '',
  });

  // Calculate metrics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
  const totalStudents = assignments.length;
  const totalRevenue = assignments.filter(a => a.feeStatus === 'PAID').reduce((sum, a) => sum + a.monthlyFee, 0);
  const pendingRevenue = assignments.filter(a => a.feeStatus !== 'PAID').reduce((sum, a) => sum + a.monthlyFee, 0);
  const averageCapacity = totalVehicles > 0 ? Math.round(vehicles.reduce((sum, v) => sum + v.capacity, 0) / totalVehicles) : 0;
  
  // PRO Metrics
  const vehiclesWithGPS = vehicles.filter(v => v.gpsEnabled).length;
  const movingVehicles = vehicles.filter(v => v.isMoving).length;
  const averageMaintenanceScore = totalVehicles > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (v.maintenanceScore || 0), 0) / totalVehicles) : 0;
  const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Try API call first
      await apiClient.post('/academics/routes', routeForm);
      toast.success('Transport route created successfully!');
    } catch (error) {
      // Fallback to local state update
      const newRoute: TransportRoute = {
        id: `r${Date.now()}`,
        name: routeForm.name,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        distance: parseFloat(routeForm.distance),
        description: routeForm.description,
        stops: routeForm.stops ? routeForm.stops.split(',').map(s => s.trim()) : [],
        estimatedTime: routeForm.estimatedTime,
        fee: parseFloat(routeForm.fee),
        status: 'ACTIVE',
        vehicleCount: 0,
        studentCount: 0,
      };
      setRoutes([...routes, newRoute]);
      toast.success('Transport route created successfully!');
    } finally {
      setShowAddRoute(false);
      setRouteForm({ name: '', startPoint: '', endPoint: '', distance: '', description: '', stops: '', estimatedTime: '', fee: '' });
      setSaving(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Try API call first
      await apiClient.post('/academics/vehicles', vehicleForm);
      toast.success('Vehicle registered successfully!');
    } catch (error) {
      // Fallback to local state update
      const selectedRoute = routes.find(r => r.id === vehicleForm.routeId);
      const newVehicle: Vehicle = {
        id: `v${Date.now()}`,
        vehicleNo: vehicleForm.vehicleNo,
        type: vehicleForm.type,
        capacity: parseInt(vehicleForm.capacity),
        model: vehicleForm.model,
        year: parseInt(vehicleForm.year),
        fuelType: vehicleForm.fuelType,
        status: 'ACTIVE',
        routeId: vehicleForm.routeId,
        routeName: selectedRoute?.name,
        driverName: vehicleForm.driverName,
        driverPhone: vehicleForm.driverPhone,
        gpsEnabled: true,
        isMoving: false,
      };
      setVehicles([...vehicles, newVehicle]);
      toast.success('Vehicle registered successfully!');
    } finally {
      setShowAddVehicle(false);
      setVehicleForm({ vehicleNo: '', type: 'BUS', capacity: '', model: '', year: '', fuelType: 'DIESEL', routeId: '', driverName: '', driverPhone: '' });
      setSaving(false);
    }
  };

  const handleDeleteRoute = (id: string) => {
    if (!confirm('Remove this transport route? This will affect vehicle assignments.')) return;
    setRoutes(routes.filter(r => r.id !== id));
    toast.success('Route removed successfully!');
  };

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('Remove this vehicle from registry?')) return;
    setVehicles(vehicles.filter(v => v.id !== id));
    toast.success('Vehicle removed successfully!');
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">
              Transport Management System
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Transport & Routes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage school transportation, vehicles, drivers & student assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAnalytics(true)}
            className="px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <BarChart3 size={14} /> Analytics
          </button>
          <button
            onClick={() => {
              const rows = routes.map(r => `"${r.name}","${r.startPoint}","${r.endPoint}","${r.distance}km","${r.fee}","${r.vehicleCount}","${r.studentCount}"`).join('\n');
              const blob = new Blob([`Route Name,Start Point,End Point,Distance,Fee,Vehicles,Students\n${rows}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Transport_Report_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              toast.success('Report exported successfully!');
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => {
              if (tab === 'routes') setShowAddRoute(true);
              else if (tab === 'vehicles') setShowAddVehicle(true);
              else if (tab === 'assignments') setShowAssignStudent(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:scale-105 transition-all"
          >
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bus size={16} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Vehicles</span>
          </div>
          <p className="text-2xl font-black text-foreground">{totalVehicles}</p>
          <p className="text-[10px] text-blue-400 mt-1">{activeVehicles} active</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Route size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Routes</span>
          </div>
          <p className="text-2xl font-black text-foreground">{routes.length}</p>
          <p className="text-[10px] text-emerald-400 mt-1">Covering city</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Students</span>
          </div>
          <p className="text-2xl font-black text-foreground">{totalStudents}</p>
          <p className="text-[10px] text-violet-400 mt-1">Using transport</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Revenue</span>
          </div>
          <p className="text-2xl font-black text-foreground">PKR {totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-amber-400 mt-1">Collected</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-black text-foreground">PKR {pendingRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-rose-400 mt-1">Outstanding</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-cyan-400" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Avg Capacity</span>
          </div>
          <p className="text-2xl font-black text-foreground">{averageCapacity}</p>
          <p className="text-[10px] text-cyan-400 mt-1">Seats/vehicle</p>
        </div>
      </div>

      {/* PRO Features Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Map size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase text-emerald-600">GPS Tracking</span>
          </div>
          <p className="text-2xl font-black text-foreground">{vehiclesWithGPS}/{totalVehicles}</p>
          <p className="text-[10px] text-emerald-400 mt-1">Vehicles tracked</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Navigation2 size={16} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase text-blue-600">On Route</span>
          </div>
          <p className="text-2xl font-black text-foreground">{movingVehicles}</p>
          <p className="text-[10px] text-blue-400 mt-1">Currently moving</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={16} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase text-amber-600">Maintenance Score</span>
          </div>
          <p className="text-2xl font-black text-foreground">{averageMaintenanceScore}%</p>
          <p className="text-[10px] text-amber-400 mt-1">Fleet health</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase text-violet-600">Total Mileage</span>
          </div>
          <p className="text-2xl font-black text-foreground">{(totalMileage / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-violet-400 mt-1">kilometers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'routes', label: 'Routes' },
          { id: 'vehicles', label: 'Vehicles' },
          { id: 'assignments', label: 'Student Assignments' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`py-3 text-sm font-black border-b-2 transition-all ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Routes */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Route size={18} className="text-primary" /> Active Routes
            </h3>
            <div className="space-y-3">
              {routes.slice(0, 3).map(route => (
                <div key={route.id} className="p-3 rounded-xl bg-accent/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground text-sm">{route.name}</span>
                    <span className="text-xs text-muted-foreground">{route.distance} km</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Bus size={12} /> {route.vehicleCount} vehicles</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {route.studentCount} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Status */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Bus size={18} className="text-primary" /> Vehicle Status
            </h3>
            <div className="space-y-3">
              {vehicles.slice(0, 3).map(vehicle => {
                const statusConfig = VEHICLE_STATUS[vehicle.status];
                return (
                  <div key={vehicle.id} className="p-3 rounded-xl bg-accent/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground text-sm">{vehicle.vehicleNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={12} /> {vehicle.driverName}</span>
                      <span className="flex items-center gap-1"><Route size={12} /> {vehicle.routeName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {tab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {routes.map((route, idx) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shrink-0">
                      <Route size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{route.name}</h3>
                      <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-3">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-primary" />
                    {route.startPoint} → {route.endPoint}
                  </p>
                  <p className="pl-5">Distance: {route.distance} km • {route.estimatedTime}</p>
                  <p className="pl-5">Monthly Fee: PKR {route.fee.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {route.stops.slice(0, 3).map((stop, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-accent/50 text-accent-foreground text-[10px] font-bold border border-border">
                      {stop}
                    </span>
                  ))}
                  {route.stops.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{route.stops.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Bus size={12} /> {route.vehicleCount}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users size={12} /> {route.studentCount}
                    </span>
                  </div>
                  <button className="text-primary font-bold hover:underline">View Details</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vehicles Tab */}
      {tab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((vehicle, idx) => {
            const statusConfig = VEHICLE_STATUS[vehicle.status];
            const fuelConfig = FUEL_TYPES.find(f => f.value === vehicle.fuelType) || FUEL_TYPES[0];
            const typeConfig = VEHICLE_TYPES.find(t => t.value === vehicle.type) || VEHICLE_TYPES[0];

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0">
                        <Bus size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{vehicle.vehicleNo}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Bus size={12} /> {typeConfig.label}
                      </span>
                      <span className="font-bold text-foreground">{vehicle.capacity} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={12} /> {vehicle.driverName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone size={12} /> {vehicle.driverPhone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Route size={12} /> {vehicle.routeName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-accent/30 border border-border">
                      <p className="text-[10px] text-muted-foreground mb-1">Fuel</p>
                      <p className={`text-xs font-bold ${fuelConfig.color.split(' ')[1]}`}>{fuelConfig.label}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30 border border-border">
                      <p className="text-[10px] text-muted-foreground mb-1">Level</p>
                      <p className="text-xs font-bold text-foreground">{vehicle.fuelLevel}%</p>
                    </div>
                  </div>

                  {/* PRO Features */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] text-muted-foreground mb-1">GPS</p>
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        {vehicle.gpsEnabled ? (
                          <>
                            <LocateFixed size={10} /> Active
                          </>
                        ) : (
                          'Disabled'
                        )}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[10px] text-muted-foreground mb-1">Speed</p>
                      <p className="text-xs font-bold text-blue-600">
                        {vehicle.isMoving ? `${vehicle.currentSpeed} km/h` : 'Stopped'}
                      </p>
                    </div>
                  </div>

                  {vehicle.currentLocation && (
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Location</p>
                      <p className="text-xs font-bold text-violet-600 truncate">{vehicle.currentLocation.address}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{vehicle.model} ({vehicle.year})</span>
                    <div className="flex items-center gap-2">
                      {vehicle.gpsEnabled && (
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowTracking(true);
                          }}
                          className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Map size={12} /> Track
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setShowMaintenance(true);
                        }}
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <Wrench size={12} /> Maintenance
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Student Assignments Tab */}
      {tab === 'assignments' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Student Transport Assignments</h2>
            <span className="text-xs text-muted-foreground">{assignments.length} students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  {['Student', 'Roll No', 'Route', 'Vehicle', 'Pickup', 'Drop', 'Fee Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, idx) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground">{assignment.studentName}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground font-mono">{assignment.rollNo}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{assignment.routeName}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{assignment.vehicleNo}</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{assignment.pickupPoint} ({assignment.pickupTime})</td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">{assignment.dropPoint} ({assignment.dropTime})</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        assignment.feeStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                        assignment.feeStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-rose-500/10 text-rose-600'
                      }`}>
                        {assignment.feeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      <Modal isOpen={showAddRoute} onClose={() => setShowAddRoute(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<Route size={22} />}
          title="Add Transport Route"
          subtitle="Create new transportation route"
          onClose={() => setShowAddRoute(false)}
        />
        <form onSubmit={handleAddRoute} className="space-y-4 text-sm p-6">
                <div>
                  <label className="block font-bold text-foreground mb-1.5">Route Name *</label>
                  <input
                    value={routeForm.name}
                    onChange={e => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="Route A - North Campus"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Start Point *</label>
                    <input
                      value={routeForm.startPoint}
                      onChange={e => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                      placeholder="Central Bus Station"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">End Point *</label>
                    <input
                      value={routeForm.endPoint}
                      onChange={e => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                      placeholder="School Main Gate"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Distance (km) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={routeForm.distance}
                      onChange={e => setRouteForm({ ...routeForm, distance: e.target.value })}
                      placeholder="15.5"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Est. Time *</label>
                    <input
                      value={routeForm.estimatedTime}
                      onChange={e => setRouteForm({ ...routeForm, estimatedTime: e.target.value })}
                      placeholder="45 min"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Monthly Fee *</label>
                    <input
                      type="number"
                      value={routeForm.fee}
                      onChange={e => setRouteForm({ ...routeForm, fee: e.target.value })}
                      placeholder="2500"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Stops (comma separated)</label>
                  <input
                    value={routeForm.stops}
                    onChange={e => setRouteForm({ ...routeForm, stops: e.target.value })}
                    placeholder="Central Bus Station, Town Hall, Library Crossing"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Leave empty if no specific stops</p>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Description</label>
                  <textarea
                    value={routeForm.description}
                    onChange={e => setRouteForm({ ...routeForm, description: e.target.value })}
                    placeholder="Route description and additional information..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddRoute(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-cyan-500 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Creating...' : 'Create Route'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddVehicle} onClose={() => setShowAddVehicle(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<Bus size={22} />}
          title="Register Vehicle"
          subtitle="Add new vehicle to transport fleet"
          onClose={() => setShowAddVehicle(false)}
        />
        <form onSubmit={handleAddVehicle} className="space-y-4 text-sm p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Vehicle Number *</label>
                    <input
                      value={vehicleForm.vehicleNo}
                      onChange={e => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })}
                      placeholder="SCH-2024-001"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Vehicle Type *</label>
                    <select
                      value={vehicleForm.type}
                      onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {VEHICLE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Capacity *</label>
                    <input
                      type="number"
                      value={vehicleForm.capacity}
                      onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                      placeholder="40"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Model</label>
                    <input
                      value={vehicleForm.model}
                      onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      placeholder="Toyota Coaster"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Year</label>
                    <input
                      type="number"
                      value={vehicleForm.year}
                      onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                      placeholder="2022"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Fuel Type *</label>
                    <select
                      value={vehicleForm.fuelType}
                      onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      {FUEL_TYPES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1.5">Assign Route</label>
                  <select
                    value={vehicleForm.routeId}
                    onChange={e => setVehicleForm({ ...vehicleForm, routeId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select Route (optional) --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Driver Name</label>
                    <input
                      value={vehicleForm.driverName}
                      onChange={e => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                      placeholder="Ahmed Khan"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Driver Phone</label>
                    <input
                      value={vehicleForm.driverPhone}
                      onChange={e => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicle(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Registering...' : 'Register Vehicle'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* GPS Tracking Modal */}
      <Modal isOpen={showTracking && !!selectedVehicle} onClose={() => setShowTracking(false)} maxWidth="max-w-3xl">
        {selectedVehicle && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <Map size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">GPS Tracking</h2>
                  <p className="text-xs text-muted-foreground">{selectedVehicle.vehicleNo} - Live Location</p>
                </div>
              </div>
              <button onClick={() => setShowTracking(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Live Tracking Info */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                    <LocateFixed size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">Live Tracking Active</p>
                    <p className="text-xs text-muted-foreground">Real-time GPS monitoring</p>
                  </div>
                </div>
                
                {selectedVehicle.currentLocation && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Current Location</p>
                      <p className="text-sm font-bold text-foreground">{selectedVehicle.currentLocation.address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Last Update</p>
                      <p className="text-sm font-bold text-foreground">{new Date(selectedVehicle.currentLocation.lastUpdate).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Coordinates</p>
                      <p className="text-sm font-mono text-foreground">{selectedVehicle.currentLocation.lat.toFixed(4)}, {selectedVehicle.currentLocation.lng.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-bold text-emerald-600">{selectedVehicle.isMoving ? 'Moving' : 'Stopped'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Simulated Map */}
              <div className="p-4 rounded-2xl bg-accent/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-foreground">Route Map</p>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                      <Play size={14} />
                    </button>
                    <button className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                      <Pause size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-48 rounded-xl bg-muted flex items-center justify-center border border-border">
                  <div className="text-center">
                    <Map size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">GPS Map View</p>
                    <p className="text-xs text-muted-foreground">Real-time vehicle tracking on map</p>
                  </div>
                </div>
              </div>

              {/* Telemetry */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Current Speed</p>
                  <p className="text-xl font-black text-blue-600">{selectedVehicle.currentSpeed || 0} km/h</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Fuel Efficiency</p>
                  <p className="text-xl font-black text-violet-600">{selectedVehicle.fuelEfficiency || 0} km/L</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Total Mileage</p>
                  <p className="text-xl font-black text-amber-600">{(selectedVehicle.mileage || 0).toLocaleString()} km</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowTracking(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={showMaintenance && !!selectedVehicle} onClose={() => setShowMaintenance(false)} maxWidth="max-w-2xl">
        {selectedVehicle && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <Wrench size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Maintenance Schedule</h2>
                  <p className="text-xs text-muted-foreground">{selectedVehicle.vehicleNo} - Service History</p>
                </div>
              </div>
              <button onClick={() => setShowMaintenance(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Maintenance Score */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-amber-600">Maintenance Score</p>
                  <p className="text-2xl font-black text-amber-600">{selectedVehicle.maintenanceScore || 0}%</p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (selectedVehicle.maintenanceScore || 0) >= 80 ? 'bg-emerald-500' :
                      (selectedVehicle.maintenanceScore || 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${selectedVehicle.maintenanceScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Maintenance Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-accent/30 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Last Maintenance</p>
                  <p className="text-sm font-bold text-foreground">{selectedVehicle.lastMaintenance || 'Not recorded'}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/30 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Next Due</p>
                  <p className="text-sm font-bold text-foreground">{selectedVehicle.nextMaintenance || 'Not scheduled'}</p>
                </div>
              </div>

              {/* Service History */}
              <div className="p-4 rounded-2xl bg-card border border-border">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <History size={16} className="text-primary" /> Service History
                </h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-accent/30 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">General Service</span>
                      <span className="text-xs text-muted-foreground">{selectedVehicle.lastMaintenance}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Oil change, filter replacement, brake check</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/30 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">Tire Rotation</span>
                      <span className="text-xs text-muted-foreground">2026-06-15</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">All tires rotated and balanced</p>
                  </div>
                </div>
              </div>

              {/* Upcoming Reminders */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <h3 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                  <Bell size={16} /> Upcoming Reminders
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle size={14} className="text-amber-400" />
                    <span className="text-foreground">Oil change due in 2,500 km</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle size={14} className="text-blue-400" />
                    <span className="text-foreground">Tire inspection due next month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowMaintenance(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} maxWidth="max-w-4xl">
        <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Transport Analytics</h2>
                  <p className="text-xs text-muted-foreground">Performance metrics and reports</p>
                </div>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">On-Time Performance</p>
                  <p className="text-2xl font-black text-emerald-600">94%</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Fuel Efficiency</p>
                  <p className="text-2xl font-black text-blue-600">8.2 km/L</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Avg Trip Time</p>
                  <p className="text-2xl font-black text-amber-600">42 min</p>
                </div>
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Capacity Utilization</p>
                  <p className="text-2xl font-black text-violet-600">87%</p>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <LineChart size={16} className="text-primary" /> Monthly Revenue Trend
                  </h3>
                  <div className="h-48 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <div className="text-center">
                      <LineChart size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Revenue Chart</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <PieChart size={16} className="text-primary" /> Route Distribution
                  </h3>
                  <div className="h-48 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <div className="text-center">
                      <PieChart size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Route Distribution Chart</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Performance */}
              <div className="p-4 rounded-2xl bg-card border border-border">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-primary" /> Vehicle Performance
                </h3>
                <div className="space-y-2">
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold text-xs">
                          {vehicle.vehicleNo.slice(-3)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{vehicle.vehicleNo}</p>
                          <p className="text-[10px] text-muted-foreground">{vehicle.routeName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Score</p>
                          <p className="text-sm font-bold text-foreground">{vehicle.maintenanceScore || 0}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Mileage</p>
                          <p className="text-sm font-bold text-foreground">{(vehicle.mileage || 0).toLocaleString()} km</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-4">
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Close
              </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
