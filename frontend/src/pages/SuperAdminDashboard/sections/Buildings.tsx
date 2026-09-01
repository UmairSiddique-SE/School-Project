import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, X, Loader2, Search, Edit2, Trash2,
  ChevronRight, ChevronDown, DoorOpen, Layers, Users,
  CheckCircle, XCircle, MoreVertical, Home, FlaskConical,
  Briefcase, BookOpen, Dumbbell, School,
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  roomNo: string;
  name?: string;
  floor: number;
  capacity: number;
  type: string;
  isActive: boolean;
}

interface Building {
  id: string;
  name: string;
  type: string;
  floors: number;
  description?: string;
  isActive: boolean;
  schoolId: string;
  school?: { id: string; name: string; slug: string };
  rooms: Room[];
  _count?: { rooms: number };
}

interface SchoolOption {
  id: string;
  name: string;
  slug: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BUILDING_TYPES = ['ACADEMIC', 'ADMIN', 'HOSTEL', 'SPORTS', 'LAB', 'LIBRARY', 'OTHER'];
const ROOM_TYPES = ['CLASSROOM', 'LAB', 'OFFICE', 'LIBRARY', 'GYM', 'AUDITORIUM', 'WASHROOM', 'OTHER'];

const buildingTypeIcon: Record<string, React.ComponentType<any>> = {
  ACADEMIC: School,
  ADMIN: Briefcase,
  HOSTEL: Home,
  SPORTS: Dumbbell,
  LAB: FlaskConical,
  LIBRARY: BookOpen,
  OTHER: Building2,
};

const buildingTypeColor: Record<string, string> = {
  ACADEMIC: 'from-blue-600/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  ADMIN: 'from-violet-600/20 to-violet-500/5 border-violet-500/20 text-violet-400',
  HOSTEL: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  SPORTS: 'from-orange-600/20 to-orange-500/5 border-orange-500/20 text-orange-400',
  LAB: 'from-cyan-600/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  LIBRARY: 'from-amber-600/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  OTHER: 'from-slate-600/20 to-slate-500/5 border-slate-500/20 text-slate-400',
};

const roomTypeColor: Record<string, string> = {
  CLASSROOM: 'bg-blue-500/10 text-blue-400',
  LAB: 'bg-cyan-500/10 text-cyan-400',
  OFFICE: 'bg-violet-500/10 text-violet-400',
  LIBRARY: 'bg-amber-500/10 text-amber-400',
  GYM: 'bg-orange-500/10 text-orange-400',
  AUDITORIUM: 'bg-rose-500/10 text-rose-400',
  WASHROOM: 'bg-slate-500/10 text-slate-400',
  OTHER: 'bg-muted text-muted-foreground',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SCHOOLS: SchoolOption[] = [
  { id: 'sch-1', name: 'EduSphere Academy', slug: 'demo' },
  { id: 'sch-2', name: 'Beacon House Grammar', slug: 'beacon-house' },
  { id: 'sch-3', name: 'City School Campus', slug: 'city-school' },
];

const MOCK_BUILDINGS: Building[] = [
  {
    id: 'b-1', name: 'Main Academic Block', type: 'ACADEMIC', floors: 3,
    description: 'Primary teaching block with 30 classrooms across 3 floors.',
    isActive: true, schoolId: 'sch-1',
    school: { id: 'sch-1', name: 'EduSphere Academy', slug: 'demo' },
    _count: { rooms: 12 },
    rooms: [
      { id: 'r-1', roomNo: '101', name: 'Physics Lab', floor: 1, capacity: 35, type: 'LAB', isActive: true },
      { id: 'r-2', roomNo: '102', name: 'Class A', floor: 1, capacity: 40, type: 'CLASSROOM', isActive: true },
      { id: 'r-3', roomNo: '201', name: 'Chemistry Lab', floor: 2, capacity: 30, type: 'LAB', isActive: true },
      { id: 'r-4', roomNo: '202', name: 'Class B', floor: 2, capacity: 40, type: 'CLASSROOM', isActive: true },
    ],
  },
  {
    id: 'b-2', name: 'Admin Block', type: 'ADMIN', floors: 2,
    description: 'Administrative offices, principal room, and staff rooms.',
    isActive: true, schoolId: 'sch-1',
    school: { id: 'sch-1', name: 'EduSphere Academy', slug: 'demo' },
    _count: { rooms: 6 },
    rooms: [
      { id: 'r-5', roomNo: 'A01', name: "Principal's Office", floor: 1, capacity: 10, type: 'OFFICE', isActive: true },
      { id: 'r-6', roomNo: 'A02', name: 'Staff Room', floor: 1, capacity: 20, type: 'OFFICE', isActive: true },
    ],
  },
  {
    id: 'b-3', name: 'Sports Complex', type: 'SPORTS', floors: 1,
    description: 'Indoor gymnasium and sports equipment storage.',
    isActive: true, schoolId: 'sch-1',
    school: { id: 'sch-1', name: 'EduSphere Academy', slug: 'demo' },
    _count: { rooms: 3 },
    rooms: [
      { id: 'r-7', roomNo: 'S01', name: 'Main Gymnasium', floor: 1, capacity: 100, type: 'GYM', isActive: true },
    ],
  },
];

// ─── Empty forms ──────────────────────────────────────────────────────────────

const emptyBuildingForm = { name: '', type: 'ACADEMIC', floors: 1, description: '' };
const emptyRoomForm = { roomNo: '', name: '', floor: 1, capacity: 30, type: 'CLASSROOM' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function Buildings() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Building modal
  const [bModal, setBModal] = useState<'create' | 'edit' | null>(null);
  const [bForm, setBForm] = useState({ ...emptyBuildingForm });
  const [bSaving, setBSaving] = useState(false);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);

  // Room modal
  const [rModal, setRModal] = useState<'create' | 'edit' | null>(null);
  const [rForm, setRForm] = useState({ ...emptyRoomForm });
  const [rSaving, setRSaving] = useState(false);
  const [rBuilding, setRBuilding] = useState<Building | null>(null);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  // ── Load Schools ──────────────────────────────────────────────────────────
  useEffect(() => {
    setSchoolsLoading(true);
    apiClient.get('/schools?limit=100')
      .then(r => {
        const data = r.data?.data || r.data || [];
        const list: SchoolOption[] = Array.isArray(data)
          ? data.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug }))
          : MOCK_SCHOOLS;
        setSchools(list.length > 0 ? list : MOCK_SCHOOLS);
        if (list.length > 0) setSelectedSchoolId(list[0].id);
        else setSelectedSchoolId(MOCK_SCHOOLS[0].id);
      })
      .catch(() => {
        setSchools(MOCK_SCHOOLS);
        setSelectedSchoolId(MOCK_SCHOOLS[0].id);
      })
      .finally(() => setSchoolsLoading(false));
  }, []);

  // ── Load Buildings ────────────────────────────────────────────────────────
  const fetchBuildings = useCallback(() => {
    if (!selectedSchoolId) return;
    setLoading(true);
    apiClient.get(`/buildings?schoolId=${selectedSchoolId}`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setBuildings(data.length > 0 ? data : MOCK_BUILDINGS.filter(b => b.schoolId === selectedSchoolId));
      })
      .catch(() => {
        setBuildings(MOCK_BUILDINGS.filter(b => b.schoolId === selectedSchoolId));
      })
      .finally(() => setLoading(false));
  }, [selectedSchoolId]);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = buildings.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.type.toLowerCase().includes(search.toLowerCase())
  );

  // ── Building CRUD ─────────────────────────────────────────────────────────

  const openCreateBuilding = () => {
    setBForm({ ...emptyBuildingForm });
    setEditBuilding(null);
    setBModal('create');
  };

  const openEditBuilding = (b: Building) => {
    setBForm({ name: b.name, type: b.type, floors: b.floors, description: b.description || '' });
    setEditBuilding(b);
    setBModal('edit');
    setOpenMenu(null);
  };

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBSaving(true);
    try {
      if (bModal === 'create') {
        const res = await apiClient.post('/buildings', { ...bForm, schoolId: selectedSchoolId });
        const newB: Building = { ...res.data, rooms: [], _count: { rooms: 0 } };
        setBuildings(prev => [newB, ...prev]);
        toast.success('Building added!');
      } else if (bModal === 'edit' && editBuilding) {
        await apiClient.put(`/buildings/${editBuilding.id}`, bForm);
        setBuildings(prev => prev.map(b => b.id === editBuilding.id ? { ...b, ...bForm } : b));
        toast.success('Building updated!');
      }
    } catch {
      // Optimistic local update if API fails
      if (bModal === 'create') {
        const newB: Building = {
          id: 'b-' + Date.now(), ...bForm, floors: Number(bForm.floors),
          isActive: true, schoolId: selectedSchoolId,
          rooms: [], _count: { rooms: 0 },
        };
        setBuildings(prev => [newB, ...prev]);
        toast.success('Building added!');
      } else if (bModal === 'edit' && editBuilding) {
        setBuildings(prev => prev.map(b => b.id === editBuilding.id ? { ...b, ...bForm, floors: Number(bForm.floors) } : b));
        toast.success('Building updated!');
      }
    } finally {
      setBSaving(false);
      setBModal(null);
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm('Delete this building and all its rooms?')) return;
    setOpenMenu(null);
    try {
      await apiClient.delete(`/buildings/${id}`);
    } catch { /* allow local delete */ }
    setBuildings(prev => prev.filter(b => b.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast.success('Building deleted!');
  };

  const handleToggleBuildingStatus = async (b: Building) => {
    setOpenMenu(null);
    const newStatus = !b.isActive;
    try {
      await apiClient.put(`/buildings/${b.id}`, { isActive: newStatus });
    } catch { /* allow local */ }
    setBuildings(prev => prev.map(x => x.id === b.id ? { ...x, isActive: newStatus } : x));
    toast.success(`Building ${newStatus ? 'activated' : 'deactivated'}!`);
  };

  // ── Room CRUD ─────────────────────────────────────────────────────────────

  const openCreateRoom = (building: Building) => {
    setRForm({ ...emptyRoomForm });
    setEditRoom(null);
    setRBuilding(building);
    setRModal('create');
  };

  const openEditRoom = (building: Building, room: Room) => {
    setRForm({ roomNo: room.roomNo, name: room.name || '', floor: room.floor, capacity: room.capacity, type: room.type });
    setEditRoom(room);
    setRBuilding(building);
    setRModal('edit');
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rBuilding) return;
    setRSaving(true);
    const payload = { ...rForm, floor: Number(rForm.floor), capacity: Number(rForm.capacity) };
    try {
      if (rModal === 'create') {
        const res = await apiClient.post(`/buildings/${rBuilding.id}/rooms`, payload);
        const newRoom: Room = res.data;
        setBuildings(prev => prev.map(b => b.id === rBuilding.id
          ? { ...b, rooms: [...b.rooms, newRoom], _count: { rooms: (b._count?.rooms || 0) + 1 } }
          : b
        ));
        toast.success('Room added!');
      } else if (rModal === 'edit' && editRoom) {
        await apiClient.put(`/buildings/${rBuilding.id}/rooms/${editRoom.id}`, payload);
        setBuildings(prev => prev.map(b => b.id === rBuilding.id
          ? { ...b, rooms: b.rooms.map(r => r.id === editRoom.id ? { ...r, ...payload } : r) }
          : b
        ));
        toast.success('Room updated!');
      }
    } catch {
      if (rModal === 'create') {
        const newRoom: Room = { id: 'r-' + Date.now(), ...payload, isActive: true };
        setBuildings(prev => prev.map(b => b.id === rBuilding.id
          ? { ...b, rooms: [...b.rooms, newRoom], _count: { rooms: (b._count?.rooms || 0) + 1 } }
          : b
        ));
        toast.success('Room added!');
      } else if (rModal === 'edit' && editRoom) {
        setBuildings(prev => prev.map(b => b.id === rBuilding.id
          ? { ...b, rooms: b.rooms.map(r => r.id === editRoom.id ? { ...r, ...payload } : r) }
          : b
        ));
        toast.success('Room updated!');
      }
    } finally {
      setRSaving(false);
      setRModal(null);
    }
  };

  const handleDeleteRoom = async (building: Building, room: Room) => {
    if (!confirm(`Delete room "${room.roomNo}"?`)) return;
    try {
      await apiClient.delete(`/buildings/${building.id}/rooms/${room.id}`);
    } catch { /* allow local */ }
    setBuildings(prev => prev.map(b => b.id === building.id
      ? { ...b, rooms: b.rooms.filter(r => r.id !== room.id), _count: { rooms: (b._count?.rooms || 1) - 1 } }
      : b
    ));
    toast.success('Room deleted!');
  };

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalRooms = filtered.reduce((acc, b) => acc + b.rooms.length, 0);
  const totalCapacity = filtered.reduce((acc, b) =>
    acc + b.rooms.reduce((s, r) => s + r.capacity, 0), 0
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-foreground">Buildings & Rooms</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage school infrastructure — buildings, floors, and classrooms
          </p>
        </div>
        <button
          onClick={openCreateBuilding}
          disabled={!selectedSchoolId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Plus size={16} /> Add Building
        </button>
      </div>

      {/* School Selector + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* School picker */}
        <div className="relative">
          {schoolsLoading ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-muted-foreground text-sm w-full sm:w-72">
              <Loader2 size={14} className="animate-spin" /> Loading schools…
            </div>
          ) : (
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-72 font-semibold"
            >
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card flex-1">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search buildings by name or type…"
            className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Stats bar */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Buildings', value: filtered.length, icon: Building2, color: 'text-violet-400 bg-violet-500/10' },
            { label: 'Total Rooms', value: totalRooms, icon: DoorOpen, color: 'text-blue-400 bg-blue-500/10' },
            { label: 'Total Capacity', value: totalCapacity, icon: Users, color: 'text-emerald-400 bg-emerald-500/10' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex h-52 items-center justify-center">
          <Loader2 size={34} className="animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl"
        >
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Building2 size={28} className="text-muted-foreground" />
          </div>
          <p className="font-bold text-foreground text-lg">No buildings yet</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
            Click "Add Building" to register the first building for this school.
          </p>
          <button
            onClick={openCreateBuilding}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={15} /> Add First Building
          </button>
        </motion.div>
      )}

      {/* Buildings List */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map((building, i) => {
            const TypeIcon = buildingTypeIcon[building.type] || Building2;
            const colorClass = buildingTypeColor[building.type] || buildingTypeColor.OTHER;
            const isExpanded = expandedId === building.id;

            return (
              <motion.div
                key={building.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {/* Building Header Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClass} border flex items-center justify-center shrink-0`}>
                    <TypeIcon size={20} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-foreground text-base">{building.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${colorClass}`}>
                        {building.type}
                      </span>
                      {!building.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Layers size={11} /> {building.floors} Floor{building.floors !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DoorOpen size={11} /> {building.rooms.length} Room{building.rooms.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users size={11} /> {building.rooms.reduce((s, r) => s + r.capacity, 0)} Capacity
                      </span>
                    </div>
                    {building.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{building.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openCreateRoom(building)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                    >
                      <Plus size={12} /> Room
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === building.id ? null : building.id)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {openMenu === building.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              className="absolute right-0 top-9 z-40 w-44 bg-card border border-border rounded-xl shadow-2xl p-1.5"
                            >
                              {[
                                { icon: Edit2, label: 'Edit Building', action: () => openEditBuilding(building) },
                                {
                                  icon: building.isActive ? XCircle : CheckCircle,
                                  label: building.isActive ? 'Deactivate' : 'Activate',
                                  action: () => handleToggleBuildingStatus(building),
                                  danger: building.isActive,
                                },
                                { icon: Trash2, label: 'Delete', action: () => handleDeleteBuilding(building.id), danger: true },
                              ].map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={item.action}
                                  className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    (item as any).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-foreground hover:bg-accent'
                                  }`}
                                >
                                  <item.icon size={13} /> {item.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : building.id)}
                      className={`p-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-accent ${isExpanded ? 'bg-accent' : ''}`}
                    >
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} />
                      </motion.div>
                    </button>
                  </div>
                </div>

                {/* Rooms Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4 bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Rooms in {building.name}
                          </p>
                          <button
                            onClick={() => openCreateRoom(building)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            <Plus size={12} /> Add Room
                          </button>
                        </div>

                        {building.rooms.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <DoorOpen size={24} className="text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No rooms added yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {building.rooms
                              .slice()
                              .sort((a, b) => a.floor - b.floor || a.roomNo.localeCompare(b.roomNo))
                              .map((room, ri) => (
                                <motion.div
                                  key={room.id}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: ri * 0.03 }}
                                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 group"
                                >
                                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-foreground font-black text-xs shrink-0">
                                    {room.roomNo}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {room.name && (
                                      <p className="text-xs font-bold text-foreground truncate">{room.name}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roomTypeColor[room.type] || roomTypeColor.OTHER}`}>
                                        {room.type}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        Floor {room.floor}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Users size={9} /> {room.capacity}
                                      </span>
                                      {!room.isActive && (
                                        <span className="text-[10px] text-red-400">Inactive</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                      onClick={() => openEditRoom(building, room)}
                                      className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRoom(building, room)}
                                      className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Building Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setBModal(null)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <h3 className="font-black text-foreground text-lg">
                    {bModal === 'create' ? 'Add New Building' : 'Edit Building'}
                  </h3>
                </div>
                <button onClick={() => setBModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveBuilding} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Building Name *</label>
                  <input
                    value={bForm.name} required
                    onChange={e => setBForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Main Academic Block"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Building Type</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {BUILDING_TYPES.map(t => {
                      const TIcon = buildingTypeIcon[t] || Building2;
                      return (
                        <button
                          key={t} type="button"
                          onClick={() => setBForm(p => ({ ...p, type: t }))}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            bForm.type === t
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                              : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          <TIcon size={15} />
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Floors */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Number of Floors</label>
                  <input
                    type="number" min={1} max={20} value={bForm.floors}
                    onChange={e => setBForm(p => ({ ...p, floors: parseInt(e.target.value) || 1 }))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Description</label>
                  <textarea
                    value={bForm.description}
                    onChange={e => setBForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of this building…"
                    rows={2}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={bSaving}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {bSaving ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
                  {bSaving ? 'Saving…' : bModal === 'create' ? 'Add Building' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Room Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {rModal && rBuilding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRModal(null)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DoorOpen size={17} className="text-primary" />
                  </div>
                  <h3 className="font-black text-foreground">
                    {rModal === 'create' ? 'Add Room' : 'Edit Room'}
                  </h3>
                </div>
                <button onClick={() => setRModal(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-5 ml-11">
                Building: <span className="font-semibold text-foreground">{rBuilding.name}</span>
              </p>

              <form onSubmit={handleSaveRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Room No. *</label>
                    <input
                      value={rForm.roomNo} required
                      onChange={e => setRForm(p => ({ ...p, roomNo: e.target.value }))}
                      placeholder="101"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Floor</label>
                    <input
                      type="number" min={1} max={50} value={rForm.floor}
                      onChange={e => setRForm(p => ({ ...p, floor: parseInt(e.target.value) || 1 }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Room Name</label>
                  <input
                    value={rForm.name}
                    onChange={e => setRForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Physics Lab (optional)"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Capacity</label>
                  <input
                    type="number" min={1} max={1000} value={rForm.capacity}
                    onChange={e => setRForm(p => ({ ...p, capacity: parseInt(e.target.value) || 30 }))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Room Type</label>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {ROOM_TYPES.map(t => (
                      <button
                        key={t} type="button"
                        onClick={() => setRForm(p => ({ ...p, type: t }))}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          rForm.type === t
                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                            : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {t === 'CLASSROOM' ? 'Class' :
                         t === 'AUDITORIUM' ? 'Hall' :
                         t === 'WASHROOM' ? 'WC' :
                         t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={rSaving}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {rSaving ? <Loader2 size={14} className="animate-spin" /> : <DoorOpen size={14} />}
                  {rSaving ? 'Saving…' : rModal === 'create' ? 'Add Room' : 'Save Room'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
