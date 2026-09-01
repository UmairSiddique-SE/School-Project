import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bus, MapPin, Navigation, User, Phone, X, Loader2 } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export default function Transport() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'routes' | 'vehicles'>('routes');
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [routeForm, setRouteForm] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    description: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNo: '',
    type: 'Bus',
    capacity: '',
    driverName: '',
    driverPhone: '',
    routeId: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/academics/routes'),
      apiClient.get('/academics/vehicles')
    ])
      .then(([routesRes, vehiclesRes]) => {
        setRoutes(routesRes.data);
        setVehicles(vehiclesRes.data);
      })
      .catch(() => toast.error('Failed to load transport data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/academics/routes', routeForm);
      toast.success('Transport route created!');
      setShowAddRoute(false);
      setRouteForm({ name: '', startPoint: '', endPoint: '', distance: '', description: '' });
      fetchData();
    } catch {
      toast.error('Failed to create route');
    } finally { setSaving(false); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/academics/vehicles', vehicleForm);
      toast.success('Vehicle registered!');
      setShowAddVehicle(false);
      setVehicleForm({ vehicleNo: '', type: 'Bus', capacity: '', driverName: '', driverPhone: '', routeId: '' });
      fetchData();
    } catch {
      toast.error('Failed to register vehicle');
    } finally { setSaving(false); }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Remove this transport route? This will affect vehicle assignments.')) return;
    try {
      await apiClient.delete(`/academics/routes/${id}`);
      toast.success('Route removed');
      fetchData();
    } catch { toast.error('Failed to remove route'); }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Remove this vehicle from registry?')) return;
    try {
      await apiClient.delete(`/academics/vehicles/${id}`);
      toast.success('Vehicle removed');
      fetchData();
    } catch { toast.error('Failed to remove vehicle'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Transport & Routes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage school routes, buses, and drivers</p>
        </div>
        <div className="flex gap-2">
          {tab === 'routes' ? (
            <button onClick={() => setShowAddRoute(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> Add Route
            </button>
          ) : (
            <button onClick={() => setShowAddVehicle(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> Register Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button onClick={() => setTab('routes')}
          className={`py-3 text-sm font-black border-b-2 transition-all ${
            tab === 'routes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}>
          Transport Routes
        </button>
        <button onClick={() => setTab('vehicles')}
          className={`py-3 text-sm font-black border-b-2 transition-all ${
            tab === 'vehicles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}>
          Vehicles & Drivers
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : tab === 'routes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, idx) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              <div>
                <h3 className="font-extrabold text-foreground text-lg mb-3 flex items-center gap-2">
                  <Navigation size={18} className="text-primary" /> {route.name}
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 text-foreground/80 font-semibold">
                    <MapPin size={13} className="text-muted-foreground" /> {route.startPoint} → {route.endPoint}
                  </p>
                  {route.distance && (
                    <p className="pl-5">Distance: {route.distance} km</p>
                  )}
                  {route.description && (
                    <p className="pl-5 italic">{route.description}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border/40 mt-4 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Vehicles assigned: {route.vehicles?.length || 0}</span>
                <button onClick={() => handleDeleteRoute(route.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}

          {routes.length === 0 && (
            <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <Bus size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">No transport routes configured</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v, idx) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-extrabold text-foreground text-base">{v.vehicleNo}</h3>
                  <span className="px-2 py-0.5 rounded bg-accent text-[10px] font-bold text-accent-foreground">
                    {v.type}
                  </span>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  {v.driverName && (
                    <p className="flex items-center gap-1.5">
                      <User size={13} /> Driver: {v.driverName}
                    </p>
                  )}
                  {v.driverPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone size={13} /> Contact: {v.driverPhone}
                    </p>
                  )}
                  {v.route && (
                    <p className="flex items-center gap-1.5 text-primary/80 font-semibold">
                      <Navigation size={13} /> Route: {v.route.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-border/40 mt-4 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Capacity: {v.capacity} seats</span>
                <button onClick={() => handleDeleteVehicle(v.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}

          {vehicles.length === 0 && (
            <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <Bus size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">No vehicles registered</p>
            </div>
          )}
        </div>
      )}

      {/* Add Route Modal */}
      <AnimatePresence>
        {showAddRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Add Transport Route</h2>
                <button onClick={() => setShowAddRoute(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Route Name</label>
                  <input value={routeForm.name} onChange={e => setRouteForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Route A - North Campus" required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Start Point</label>
                    <input value={routeForm.startPoint} onChange={e => setRouteForm(p => ({ ...p, startPoint: e.target.value }))}
                      placeholder="Central Station" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">End Point</label>
                    <input value={routeForm.endPoint} onChange={e => setRouteForm(p => ({ ...p, endPoint: e.target.value }))}
                      placeholder="School Main Gate" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Distance (km)</label>
                    <input type="number" step="0.1" value={routeForm.distance} onChange={e => setRouteForm(p => ({ ...p, distance: e.target.value }))}
                      placeholder="15.5" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-foreground">Route Description</label>
                    <textarea value={routeForm.description} onChange={e => setRouteForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Stops: Town Hall, Library, Main St..." rows={3}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Creating Route...' : 'Create Route'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddVehicle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Register Vehicle</h2>
                <button onClick={() => setShowAddVehicle(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Vehicle Number</label>
                    <input value={vehicleForm.vehicleNo} onChange={e => setVehicleForm(p => ({ ...p, vehicleNo: e.target.value }))}
                      placeholder="MNS-2938" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Vehicle Type</label>
                    <select value={vehicleForm.type} onChange={e => setVehicleForm(p => ({ ...p, type: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="Bus">School Bus</option>
                      <option value="Coaster">Coaster</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Seating Capacity</label>
                    <input type="number" value={vehicleForm.capacity} onChange={e => setVehicleForm(p => ({ ...p, capacity: e.target.value }))}
                      placeholder="40" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Assign Route</label>
                    <select value={vehicleForm.routeId} onChange={e => setVehicleForm(p => ({ ...p, routeId: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">-- Select Route --</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Driver Name</label>
                    <input value={vehicleForm.driverName} onChange={e => setVehicleForm(p => ({ ...p, driverName: e.target.value }))}
                      placeholder="John Smith" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Driver Phone</label>
                    <input value={vehicleForm.driverPhone} onChange={e => setVehicleForm(p => ({ ...p, driverPhone: e.target.value }))}
                      placeholder="+1 (555) 934-2938" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Registering...' : 'Register Vehicle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
