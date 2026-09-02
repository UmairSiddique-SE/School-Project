import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Edit2, Trash2, ShieldCheck, CheckCircle2, XCircle,
  MapPin, Users, Layers, DoorOpen, Search, Sparkles, Check,
  Monitor, Microscope, BookOpen, Trophy, Theater, Utensils,
  Footprints, Car, Video, ShieldAlert, Flame, HeartPulse, RefreshCw,
  Eye, ArrowRight, Printer
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export interface BuildingData {
  id: string;
  name: string;
  buildingType: 'OWNED' | 'RENTED' | 'LEASED' | string;
  address?: string;
  city?: string;
  locationArea?: string;
  floors: number;
  totalClassrooms: number;
  totalRooms: number;
  studentCapacity: number;
  hasComputerLab: boolean;
  hasScienceLab: boolean;
  hasLibrary: boolean;
  hasPlayground: boolean;
  hasAuditorium: boolean;
  hasCanteen: boolean;
  hasPrayerArea: boolean;
  hasParking: boolean;
  hasCctv: boolean;
  hasSecurityGuard: boolean;
  hasFireSafety: boolean;
  hasFirstAid: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
  school?: { id: string; name: string };
  _count?: { rooms: number };
  rooms?: RoomData[];
}

export interface RoomData {
  id: string;
  roomNo: string;
  name?: string;
  floor: number;
  capacity: number;
  type: string;
  isActive: boolean;
  buildingId: string;
}

const FACILITY_ITEMS = [
  { key: 'hasComputerLab', label: 'Computer Lab', icon: Monitor, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { key: 'hasScienceLab', label: 'Science Lab', icon: Microscope, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { key: 'hasLibrary', label: 'Library', icon: BookOpen, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { key: 'hasPlayground', label: 'Playground', icon: Trophy, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'hasAuditorium', label: 'Auditorium / Hall', icon: Theater, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { key: 'hasCanteen', label: 'Canteen', icon: Utensils, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { key: 'hasPrayerArea', label: 'Prayer Area', icon: Footprints, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { key: 'hasParking', label: 'Parking Area', icon: Car, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
] as const;

const SAFETY_ITEMS = [
  { key: 'hasCctv', label: 'CCTV Surveillance', icon: Video, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'hasSecurityGuard', label: 'Security Guard / Personnel', icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'hasFireSafety', label: 'Fire Safety Equipment', icon: Flame, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { key: 'hasFirstAid', label: 'First Aid / Medical Kit', icon: HeartPulse, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
] as const;

const INITIAL_FORM: Omit<BuildingData, 'id' | 'createdAt' | 'school' | '_count' | 'rooms'> = {
  name: '',
  buildingType: 'OWNED',
  address: '',
  city: '',
  locationArea: '',
  floors: 1,
  totalClassrooms: 0,
  totalRooms: 0,
  studentCapacity: 0,
  hasComputerLab: false,
  hasScienceLab: false,
  hasLibrary: false,
  hasPlayground: false,
  hasAuditorium: false,
  hasCanteen: false,
  hasPrayerArea: false,
  hasParking: false,
  hasCctv: false,
  hasSecurityGuard: false,
  hasFireSafety: false,
  hasFirstAid: false,
  description: '',
  isActive: true,
};

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'basic' | 'capacity' | 'facilities' | 'safety'>('basic');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Room modal
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    roomNo: '',
    name: '',
    floor: 1,
    capacity: 30,
    type: 'CLASSROOM',
  });
  const [roomSubmitting, setRoomSubmitting] = useState(false);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/buildings');
      setBuildings(res.data || []);
      if (selectedBuilding) {
        const updated = (res.data || []).find((b: BuildingData) => b.id === selectedBuilding.id);
        setSelectedBuilding(updated || null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load buildings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BuildingData) => {
    setModalMode('edit');
    setEditingId(b.id);
    setFormData({
      name: b.name,
      buildingType: b.buildingType || 'OWNED',
      address: b.address || '',
      city: b.city || '',
      locationArea: b.locationArea || '',
      floors: b.floors || 1,
      totalClassrooms: b.totalClassrooms || 0,
      totalRooms: b.totalRooms || 0,
      studentCapacity: b.studentCapacity || 0,
      hasComputerLab: !!b.hasComputerLab,
      hasScienceLab: !!b.hasScienceLab,
      hasLibrary: !!b.hasLibrary,
      hasPlayground: !!b.hasPlayground,
      hasAuditorium: !!b.hasAuditorium,
      hasCanteen: !!b.hasCanteen,
      hasPrayerArea: !!b.hasPrayerArea,
      hasParking: !!b.hasParking,
      hasCctv: !!b.hasCctv,
      hasSecurityGuard: !!b.hasSecurityGuard,
      hasFireSafety: !!b.hasFireSafety,
      hasFirstAid: !!b.hasFirstAid,
      description: b.description || '',
      isActive: b.isActive !== undefined ? b.isActive : true,
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Building name is required');
      setActiveTab('basic');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await apiClient.post('/buildings', formData);
        toast.success('Building added successfully');
      } else if (editingId) {
        await apiClient.put(`/buildings/${editingId}`, formData);
        toast.success('Building details updated');
      }
      setIsModalOpen(false);
      fetchBuildings();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save building details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBuilding = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its assigned rooms?`)) return;
    try {
      await apiClient.delete(`/buildings/${id}`);
      toast.success('Building deleted');
      if (selectedBuilding?.id === id) setSelectedBuilding(null);
      fetchBuildings();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete building');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    if (!roomFormData.roomNo.trim()) {
      toast.error('Room number is required');
      return;
    }

    try {
      setRoomSubmitting(true);
      await apiClient.post(`/buildings/${selectedBuilding.id}/rooms`, roomFormData);
      toast.success('Room added');
      setIsRoomModalOpen(false);
      setRoomFormData({ roomNo: '', name: '', floor: 1, capacity: 30, type: 'CLASSROOM' });
      fetchBuildings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add room');
    } finally {
      setRoomSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!selectedBuilding) return;
    if (!window.confirm('Delete this room?')) return;
    try {
      await apiClient.delete(`/buildings/${selectedBuilding.id}/rooms/${roomId}`);
      toast.success('Room removed');
      fetchBuildings();
    } catch (err: any) {
      toast.error('Failed to delete room');
    }
  };

  // Aggregated Stats
  const totalBuildings = buildings.length;
  const ownedBuildings = buildings.filter(b => b.buildingType === 'OWNED').length;
  const rentedBuildings = buildings.filter(b => b.buildingType === 'RENTED').length;
  const totalClassrooms = buildings.reduce((acc, b) => acc + (b.totalClassrooms || 0), 0);
  const totalRooms = buildings.reduce((acc, b) => acc + (b.totalRooms || 0), 0);
  const totalCapacity = buildings.reduce((acc, b) => acc + (b.studentCapacity || 0), 0);

  const filtered = buildings.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(search.toLowerCase())) ||
      (b.locationArea && b.locationArea.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || b.buildingType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                School Infrastructure
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage physical school blocks, classrooms, facilities checklist & safety compliance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add Building</span>
          </button>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Buildings</span>
            <Building2 size={16} className="text-violet-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{totalBuildings}</p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 font-medium">
            <span className="text-emerald-500">{ownedBuildings} Owned</span>
            <span>•</span>
            <span className="text-amber-500">{rentedBuildings} Rented</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Classrooms</span>
            <DoorOpen size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{totalClassrooms}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across all floors ({totalRooms} total rooms)
          </p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Student Capacity</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{totalCapacity.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Total seat capacity</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Safety Standard</span>
            <ShieldCheck size={16} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-2xl font-black text-emerald-500">
              {buildings.length > 0
                ? Math.round(
                    (buildings.reduce((acc, b) => acc + (b.hasCctv ? 1 : 0) + (b.hasSecurityGuard ? 1 : 0) + (b.hasFireSafety ? 1 : 0) + (b.hasFirstAid ? 1 : 0), 0) /
                      (buildings.length * 4)) * 100
                  )
                : 100}
              %
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold">Compliant</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">CCTV, Guard, Fire, Medical</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3 rounded-2xl">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search building by name, city, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl border border-border text-xs">
            {(['ALL', 'OWNED', 'RENTED'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'OWNED' ? 'Owned' : 'Rented'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBuildings}
            title="Refresh"
            className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Buildings Grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground gap-2">
          <RefreshCw size={18} className="animate-spin text-violet-500" />
          <span className="text-xs">Loading school buildings...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400 mb-3">
            <Building2 size={28} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Buildings Registered Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
            Add your main school building, junior wing, high school block, or sports complex with complete facilities and safety records.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(b => {
            const activeFacilities = FACILITY_ITEMS.filter(f => (b as any)[f.key]);
            const activeSafety = SAFETY_ITEMS.filter(s => (b as any)[s.key]);

            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border hover:border-violet-500/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Title & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 font-black text-base">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground">{b.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              b.buildingType === 'RENTED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {b.buildingType || 'OWNED'}
                          </span>
                        </div>
                        {(b.address || b.city || b.locationArea) && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin size={12} className="text-violet-400 shrink-0" />
                            {[b.locationArea, b.city, b.address].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(b)}
                        title="Edit building details"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteBuilding(b.id, b.name)}
                        title="Delete building"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Building Metrics Chips */}
                  <div className="grid grid-cols-4 gap-2 my-4 bg-background/50 border border-border/80 p-2.5 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Floors</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{b.floors || 1}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Classrooms</p>
                      <p className="text-sm font-bold text-violet-400 mt-0.5">{b.totalClassrooms || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total Rooms</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{b.totalRooms || (b._count?.rooms ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Capacity</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{(b.studentCapacity || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Facilities Grid */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Building Facilities ({activeFacilities.length}/8)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {FACILITY_ITEMS.map(f => {
                        const hasIt = (b as any)[f.key];
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.key}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-colors ${
                              hasIt
                                ? f.color
                                : 'bg-muted/40 text-muted-foreground/50 border-transparent opacity-60'
                            }`}
                          >
                            <Icon size={12} />
                            <span>{f.label}</span>
                            {hasIt ? (
                              <CheckCircle2 size={11} className="text-emerald-400 ml-0.5" />
                            ) : (
                              <XCircle size={11} className="text-muted-foreground/40 ml-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Safety & Security */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Safety & Security ({activeSafety.length}/4)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SAFETY_ITEMS.map(s => {
                        const hasIt = (b as any)[s.key];
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.key}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                              hasIt
                                ? s.color
                                : 'bg-background/40 border-border text-muted-foreground/60'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon size={13} />
                              <span className="font-medium text-[11px]">{s.label}</span>
                            </div>
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                                hasIt ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {hasIt ? 'YES' : 'NO'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Drawer Action */}
                <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{b.rooms?.length || b._count?.rooms || 0}</span> rooms cataloged
                  </div>
                  <button
                    onClick={() => setSelectedBuilding(b)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Manage Rooms</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Selected Building Room Management Drawer / Section */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-card border-2 border-violet-500/30 rounded-3xl p-6 shadow-xl relative mt-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-500/20 text-violet-400 uppercase">
                    Active Building
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{selectedBuilding.name} — Room Directory</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Catalog individual classrooms, laboratories, administrative rooms, and capacities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Room
                </button>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Room List Table */}
            {(!selectedBuilding.rooms || selectedBuilding.rooms.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl">
                <DoorOpen size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">No individual rooms added yet for this building.</p>
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="mt-2 text-xs font-bold text-violet-400 hover:underline"
                >
                  + Add Room / Classroom
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Room No</th>
                      <th className="py-2.5 px-3">Room Name / Label</th>
                      <th className="py-2.5 px-3">Floor</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Capacity</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedBuilding.rooms.map(r => (
                      <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">{r.roomNo}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.name || '—'}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">Floor {r.floor}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {r.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{r.capacity} Seats</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteRoom(r.id)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ADD / EDIT BUILDING MODAL WITH ALL 4 SECTIONS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-violet-600/10 to-transparent">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Building2 className="text-violet-400" size={20} />
                    {modalMode === 'create' ? 'Add School Building' : 'Edit Building Details'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure basic information, floor count, capacity, facilities, and safety equipment
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Navigation Tabs inside Modal */}
              <div className="flex border-b border-border bg-background/50 px-5 pt-2 gap-2 text-xs overflow-x-auto">
                {[
                  { id: 'basic', label: '1. Basic Info', icon: Building2 },
                  { id: 'capacity', label: '2. Capacity & Metrics', icon: Layers },
                  { id: 'facilities', label: '3. Facilities (Yes/No)', icon: Sparkles },
                  { id: 'safety', label: '4. Safety & Security', icon: ShieldCheck },
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'border-violet-500 text-violet-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* ─── TAB 1: BASIC INFO ─── */}
                {activeTab === 'basic' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Building Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Main Academic Block, Senior Wing"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Building Type (Owned / Rented)
                        </label>
                        <select
                          value={formData.buildingType}
                          onChange={e => setFormData({ ...formData, buildingType: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                        >
                          <option value="OWNED">Owned School Property</option>
                          <option value="RENTED">Rented / Leased Property</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Lahore, Karachi, Islamabad"
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Area / Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Gulberg III, Sector F-7, DHA"
                          value={formData.locationArea}
                          onChange={e => setFormData({ ...formData, locationArea: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        School Address
                      </label>
                      <input
                        type="text"
                        placeholder="Street Address, Plot No, Block..."
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Description / Building Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Additional remarks or notes..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: BUILDING CAPACITY & COUNTS ─── */}
                {activeTab === 'capacity' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-background/60 border border-border p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Total Floors
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">Ground + upper storeys</p>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={formData.floors}
                          onChange={e => setFormData({ ...formData, floors: Number(e.target.value) || 1 })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="bg-background/60 border border-border p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Total Classrooms
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">Dedicated student lecture rooms</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.totalClassrooms}
                          onChange={e => setFormData({ ...formData, totalClassrooms: Number(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-background/60 border border-border p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Total Rooms
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">Classrooms + Labs + Offices + Halls</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.totalRooms}
                          onChange={e => setFormData({ ...formData, totalRooms: Number(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="bg-background/60 border border-border p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Student Capacity
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">Maximum seating capacity</p>
                        <input
                          type="number"
                          min={0}
                          value={formData.studentCapacity}
                          onChange={e => setFormData({ ...formData, studentCapacity: Number(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: FACILITIES (YES / NO) ─── */}
                {activeTab === 'facilities' && (
                  <div className="space-y-3 animate-fade-in">
                    <p className="text-xs text-muted-foreground">
                      Select which amenities are present in this school building. Click to toggle Yes / No.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {FACILITY_ITEMS.map(f => {
                        const val = !!(formData as any)[f.key];
                        const Icon = f.icon;
                        return (
                          <div
                            key={f.key}
                            onClick={() => setFormData({ ...formData, [f.key]: !val })}
                            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                              val
                                ? 'bg-violet-600/10 border-violet-500/40 text-foreground shadow-sm'
                                : 'bg-background/50 border-border text-muted-foreground hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl ${val ? 'bg-violet-600/20 text-violet-400' : 'bg-muted text-muted-foreground'}`}>
                                <Icon size={16} />
                              </div>
                              <span className="text-xs font-bold">{f.label}</span>
                            </div>

                            <button
                              type="button"
                              className={`px-3 py-1 rounded-xl text-[11px] font-black transition-colors ${
                                val
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {val ? 'YES' : 'NO'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: SAFETY (YES / NO) ─── */}
                {activeTab === 'safety' && (
                  <div className="space-y-3 animate-fade-in">
                    <p className="text-xs text-muted-foreground">
                      Mark the safety & security certifications and equipment installed in this building.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SAFETY_ITEMS.map(s => {
                        const val = !!(formData as any)[s.key];
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.key}
                            onClick={() => setFormData({ ...formData, [s.key]: !val })}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                              val
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-sm'
                                : 'bg-background/50 border-border text-muted-foreground hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl ${val ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                <Icon size={16} />
                              </div>
                              <span className="text-xs font-bold">{s.label}</span>
                            </div>

                            <button
                              type="button"
                              className={`px-3 py-1 rounded-xl text-[11px] font-black transition-colors ${
                                val
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {val ? 'YES' : 'NO'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeTab !== 'basic' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === 'safety') setActiveTab('facilities');
                          else if (activeTab === 'facilities') setActiveTab('capacity');
                          else if (activeTab === 'capacity') setActiveTab('basic');
                        }}
                        className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Back
                      </button>
                    )}
                    {activeTab !== 'safety' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === 'basic') setActiveTab('capacity');
                          else if (activeTab === 'capacity') setActiveTab('facilities');
                          else if (activeTab === 'facilities') setActiveTab('safety');
                        }}
                        className="px-3 py-2 rounded-xl bg-accent hover:bg-accent/80 text-xs font-bold text-foreground"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{modalMode === 'create' ? 'Save Building' : 'Update Details'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ADD ROOM MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <DoorOpen className="text-violet-400" size={18} />
                    Add Room / Classroom
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Building: <span className="font-semibold text-foreground">{selectedBuilding?.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsRoomModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <form onSubmit={handleAddRoom} className="p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Room No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101, B-12"
                      value={roomFormData.roomNo}
                      onChange={e => setRoomFormData({ ...roomFormData, roomNo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Floor Number
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={roomFormData.floor}
                      onChange={e => setRoomFormData({ ...roomFormData, floor: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Room Name / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 10-A, Physics Lab, Staff Office"
                    value={roomFormData.name}
                    onChange={e => setRoomFormData({ ...roomFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Room Type
                    </label>
                    <select
                      value={roomFormData.type}
                      onChange={e => setRoomFormData({ ...roomFormData, type: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                    >
                      <option value="CLASSROOM">Classroom</option>
                      <option value="SCIENCE_LAB">Science Lab</option>
                      <option value="COMPUTER_LAB">Computer Lab</option>
                      <option value="LIBRARY">Library Room</option>
                      <option value="STAFF_ROOM">Staff Room</option>
                      <option value="PRINCIPAL_OFFICE">Admin / Office</option>
                      <option value="AUDITORIUM">Auditorium / Hall</option>
                      <option value="OTHER">Other Facility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Capacity (Seats)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={roomFormData.capacity}
                      onChange={e => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) || 30 })}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roomSubmitting}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 disabled:opacity-50"
                  >
                    {roomSubmitting ? 'Saving...' : 'Save Room'}
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
