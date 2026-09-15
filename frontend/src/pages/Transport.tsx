import React, { useEffect, useMemo, useState } from 'react';
import { Bus, Plus, RefreshCw, Search, Trash2, Users, Route as RouteIcon, Loader2, MapPin, Phone } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type RouteItem = {
  id: string; name: string; description?: string | null; startPoint?: string | null; endPoint?: string | null;
  distance?: number | null; stops?: string[] | null; estimatedTime?: string | null; fee?: number | null;
  status?: string | null; vehicles?: VehicleItem[]; _count?: { vehicles?: number; assignments?: number };
};

type VehicleItem = {
  id: string; vehicleNo: string; type?: string | null; capacity?: number | null; model?: string | null;
  year?: number | null; fuelType?: string | null; status?: string | null; routeId?: string | null;
  route?: { id: string; name: string } | null; driverName?: string | null; driverPhone?: string | null;
};

type AssignmentItem = {
  id: string; studentId: string; routeId: string; vehicleId: string; pickupPoint?: string | null;
  dropPoint?: string | null; pickupTime?: string | null; dropTime?: string | null; feeStatus?: string | null;
  monthlyFee?: number | null; student?: { id: string; name: string; admissionNo?: string | null } | null;
  route?: { id: string; name: string } | null; vehicle?: { id: string; vehicleNo: string } | null;
};

type Student = { id: string; name: string; admissionNo?: string | null };

const emptyRoute = { name: '', description: '', startPoint: '', endPoint: '', distance: '', stops: '', estimatedTime: '', fee: '' };
const emptyVehicle = { vehicleNo: '', type: 'BUS', capacity: '', model: '', year: '', fuelType: 'DIESEL', routeId: '', driverName: '', driverPhone: '' };
const emptyAssignment = { studentId: '', routeId: '', vehicleId: '', pickupPoint: '', dropPoint: '', pickupTime: '', dropTime: '', monthlyFee: '' };

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
        apiClient.get('/academics/routes'),
        apiClient.get('/academics/vehicles'),
        apiClient.get('/academics/transport/assignments'),
        apiClient.get('/people/students'),
      ]);
      setRoutes(Array.isArray(routeRes.data) ? routeRes.data : []);
      setVehicles(Array.isArray(vehicleRes.data) ? vehicleRes.data : []);
      setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : []);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load transport data');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.schoolId) load(); }, [user?.schoolId]);

  const filteredRoutes = useMemo(() => routes.filter(r => `${r.name} ${r.startPoint || ''} ${r.endPoint || ''}`.toLowerCase().includes(search.toLowerCase())), [routes, search]);
  const filteredVehicles = useMemo(() => vehicles.filter(v => `${v.vehicleNo} ${v.model || ''} ${v.driverName || ''}`.toLowerCase().includes(search.toLowerCase())), [vehicles, search]);
  const filteredAssignments = useMemo(() => assignments.filter(a => `${a.student?.name || ''} ${a.vehicle?.vehicleNo || ''} ${a.route?.name || ''}`.toLowerCase().includes(search.toLowerCase())), [assignments, search]);

  const createRoute = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiClient.post('/academics/routes', { ...routeForm, distance: routeForm.distance ? Number(routeForm.distance) : undefined, fee: routeForm.fee ? Number(routeForm.fee) : undefined, stops: routeForm.stops.split(',').map(s => s.trim()).filter(Boolean) });
      toast.success('Route created'); setModal(null); setRouteForm(emptyRoute); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to create route'); }
    finally { setSaving(false); }
  };

  const createVehicle = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiClient.post('/academics/vehicles', { ...vehicleForm, capacity: Number(vehicleForm.capacity), year: Number(vehicleForm.year), routeId: vehicleForm.routeId || undefined });
      toast.success('Vehicle registered'); setModal(null); setVehicleForm(emptyVehicle); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to register vehicle'); }
    finally { setSaving(false); }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiClient.post('/academics/transport/assignments', { ...assignmentForm, monthlyFee: assignmentForm.monthlyFee ? Number(assignmentForm.monthlyFee) : undefined });
      toast.success('Student assigned to transport'); setModal(null); setAssignmentForm(emptyAssignment); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to create assignment'); }
    finally { setSaving(false); }
  };

  const remove = async (kind: 'route' | 'vehicle' | 'assignment', id: string) => {
    if (!window.confirm('Delete this transport record?')) return;
    const path = kind === 'route' ? `/academics/routes/${id}` : kind === 'vehicle' ? `/academics/vehicles/${id}` : `/academics/transport/assignments/${id}`;
    try { await apiClient.delete(path); toast.success('Record deleted'); await load(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to delete record'); }
  };

  const totalStudents = assignments.length;
  const activeVehicles = vehicles.filter(v => (v.status || 'ACTIVE') === 'ACTIVE').length;
  const revenue = assignments.reduce((sum, a) => sum + Number(a.monthlyFee || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-black">Transport Management</h1><p className="text-sm text-muted-foreground mt-1">Live routes, vehicles and student assignments from your school database.</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={load} disabled={loading} className="px-4 py-2.5 rounded-xl border bg-background flex items-center gap-2 font-semibold text-sm"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh</button>
          {canManage && tab === 'routes' && <button onClick={() => setModal('route')} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"><Plus size={16}/> Add Route</button>}
          {canManage && tab === 'vehicles' && <button onClick={() => setModal('vehicle')} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"><Plus size={16}/> Add Vehicle</button>}
          {canManage && tab === 'assignments' && <button onClick={() => setModal('assignment')} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"><Plus size={16}/> Assign Student</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Routes', routes.length, RouteIcon], ['Vehicles', vehicles.length, Bus], ['Active Vehicles', activeVehicles, Bus], ['Students', totalStudents, Users]].map(([label, value, Icon]: any) => <div key={label as string} className="rounded-2xl border bg-card p-5"><Icon size={18} className="text-primary mb-3"/><p className="text-2xl font-black">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></div>)}
      </div>
      <div className="rounded-2xl border bg-card p-5"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="text-xs text-muted-foreground">Configured monthly transport value</p><p className="text-2xl font-black">PKR {revenue.toLocaleString()}</p></div><div className="relative md:w-96"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transport records..." className="w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"/></div></div></div>

      <div className="flex gap-2 border-b overflow-x-auto">{(['overview','routes','vehicles','assignments'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-bold capitalize border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{t}</button>)}</div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin"/></div> : tab === 'overview' ? <div className="grid md:grid-cols-3 gap-4"><div className="rounded-2xl border bg-card p-6"><RouteIcon className="text-primary mb-3"/><h3 className="font-bold">Routes</h3><p className="text-sm text-muted-foreground mt-1">{routes.length} live routes configured.</p></div><div className="rounded-2xl border bg-card p-6"><Bus className="text-primary mb-3"/><h3 className="font-bold">Fleet</h3><p className="text-sm text-muted-foreground mt-1">{activeVehicles} active vehicles out of {vehicles.length}.</p></div><div className="rounded-2xl border bg-card p-6"><Users className="text-primary mb-3"/><h3 className="font-bold">Assignments</h3><p className="text-sm text-muted-foreground mt-1">{assignments.length} students currently assigned.</p></div></div> : tab === 'routes' ? <div className="grid gap-4">{filteredRoutes.length === 0 ? <Empty text="No routes found"/> : filteredRoutes.map(r => <div key={r.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-lg">{r.name}</h2><p className="text-sm text-muted-foreground mt-1">{r.startPoint || 'Start'} → {r.endPoint || 'End'}</p>{r.description && <p className="text-sm mt-3 text-muted-foreground">{r.description}</p>}</div>{canManage && <button onClick={() => remove('route', r.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 size={16}/></button>}</div><div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold text-muted-foreground"><span>{r.distance ?? 0} km</span><span>{r.estimatedTime || '—'}</span><span>PKR {Number(r.fee || 0).toLocaleString()}</span><span>{r.vehicles?.length ?? r._count?.vehicles ?? 0} vehicles</span></div></div>)}</div> : tab === 'vehicles' ? <div className="grid md:grid-cols-2 gap-4">{filteredVehicles.length === 0 ? <Empty text="No vehicles found"/> : filteredVehicles.map(v => <div key={v.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between"><div className="flex gap-3"><div className="p-3 rounded-xl bg-primary/10"><Bus className="text-primary"/></div><div><h2 className="font-bold">{v.vehicleNo}</h2><p className="text-sm text-muted-foreground">{v.model || v.type || 'Vehicle'}</p></div></div>{canManage && <button onClick={() => remove('vehicle', v.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 size={16}/></button>}</div><div className="grid grid-cols-2 gap-3 mt-5 text-sm"><span>Capacity: <b>{v.capacity ?? '—'}</b></span><span>Status: <b>{v.status || 'ACTIVE'}</b></span><span>Route: <b>{v.route?.name || 'Unassigned'}</b></span><span className="flex items-center gap-1">{v.driverName || 'No driver'} {v.driverPhone && <Phone size={13}/>}</span></div></div>)}</div> : <div className="grid gap-4">{filteredAssignments.length === 0 ? <Empty text="No student transport assignments found"/> : filteredAssignments.map(a => <div key={a.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold">{a.student?.name || a.studentId}</h2><p className="text-sm text-muted-foreground mt-1">{a.route?.name || 'Route'} • {a.vehicle?.vehicleNo || 'Vehicle'}</p></div>{canManage && <button onClick={() => remove('assignment', a.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 size={16}/></button>}</div><div className="grid sm:grid-cols-4 gap-3 mt-4 text-sm"><span><MapPin size={13} className="inline mr-1"/>{a.pickupPoint || '—'}</span><span>{a.pickupTime || '—'}</span><span>{a.dropPoint || '—'}</span><span>PKR {Number(a.monthlyFee || 0).toLocaleString()} • {a.feeStatus || 'PENDING'}</span></div></div>)}</div>}

      {modal === 'route' && <Dialog title="Add Transport Route" onClose={() => setModal(null)}><form onSubmit={createRoute} className="space-y-3">{[['name','Route name'],['startPoint','Start point'],['endPoint','End point'],['distance','Distance (km)'],['estimatedTime','Estimated time'],['fee','Monthly fee']].map(([k,p]) => <input key={k} required={['name'].includes(k)} value={(routeForm as any)[k]} onChange={e => setRouteForm({...routeForm,[k]:e.target.value})} placeholder={p} className="w-full rounded-xl border bg-background px-4 py-3"/>)}<input value={routeForm.stops} onChange={e => setRouteForm({...routeForm,stops:e.target.value})} placeholder="Stops (comma separated)" className="w-full rounded-xl border bg-background px-4 py-3"/><textarea value={routeForm.description} onChange={e => setRouteForm({...routeForm,description:e.target.value})} placeholder="Description" className="w-full rounded-xl border bg-background px-4 py-3"/><Submit saving={saving} label="Create Route"/></form></Dialog>}
      {modal === 'vehicle' && <Dialog title="Register Vehicle" onClose={() => setModal(null)}><form onSubmit={createVehicle} className="space-y-3">{[['vehicleNo','Vehicle number'],['capacity','Capacity'],['model','Model'],['year','Year'],['driverName','Driver name'],['driverPhone','Driver phone']].map(([k,p]) => <input key={k} required={['vehicleNo','capacity'].includes(k)} value={(vehicleForm as any)[k]} onChange={e => setVehicleForm({...vehicleForm,[k]:e.target.value})} placeholder={p} className="w-full rounded-xl border bg-background px-4 py-3"/>)}<select value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm,type:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3">{['BUS','COASTER','VAN','MINIBUS'].map(x => <option key={x}>{x}</option>)}</select><select value={vehicleForm.fuelType} onChange={e => setVehicleForm({...vehicleForm,fuelType:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3">{['PETROL','DIESEL','CNG','ELECTRIC'].map(x => <option key={x}>{x}</option>)}</select><select value={vehicleForm.routeId} onChange={e => setVehicleForm({...vehicleForm,routeId:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3"><option value="">No route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><Submit saving={saving} label="Register Vehicle"/></form></Dialog>}
      {modal === 'assignment' && <Dialog title="Assign Student to Transport" onClose={() => setModal(null)}><form onSubmit={createAssignment} className="space-y-3"><select required value={assignmentForm.studentId} onChange={e => setAssignmentForm({...assignmentForm,studentId:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3"><option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}{s.admissionNo ? ` (${s.admissionNo})` : ''}</option>)}</select><select required value={assignmentForm.routeId} onChange={e => setAssignmentForm({...assignmentForm,routeId:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3"><option value="">Select route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select required value={assignmentForm.vehicleId} onChange={e => setAssignmentForm({...assignmentForm,vehicleId:e.target.value})} className="w-full rounded-xl border bg-background px-4 py-3"><option value="">Select vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNo}</option>)}</select>{[['pickupPoint','Pickup point'],['dropPoint','Drop point'],['pickupTime','Pickup time'],['dropTime','Drop time'],['monthlyFee','Monthly fee']].map(([k,p]) => <input key={k} required={['pickupPoint','vehicleId'].includes(k)} value={(assignmentForm as any)[k]} onChange={e => setAssignmentForm({...assignmentForm,[k]:e.target.value})} placeholder={p} className="w-full rounded-xl border bg-background px-4 py-3"/>)}<Submit saving={saving} label="Assign Student"/></form></Dialog>}
    </div>
  );
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">{text}</div>; }
function Submit({ saving, label }: { saving: boolean; label: string }) { return <button disabled={saving} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-bold flex items-center justify-center gap-2">{saving && <Loader2 size={16} className="animate-spin"/>}{saving ? 'Saving...' : label}</button>; }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between mb-5"><h2 className="text-xl font-black">{title}</h2><button onClick={onClose} className="text-muted-foreground">×</button></div>{children}</div></div>; }
