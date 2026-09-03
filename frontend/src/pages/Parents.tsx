import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Mail, Loader2, Search, Plus, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

export default function Parents() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', relation: 'FATHER' });

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/people/parents');
      setParents(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setParents([]);
      toast.error(err?.response?.data?.message || 'Unable to load parents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParents(); }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/parents', form);
      toast.success('Parent added successfully');
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', relation: 'FATHER' });
      await fetchParents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add parent');
    } finally {
      setSaving(false);
    }
  };

  const filtered = parents.filter((parent) => {
    const query = search.toLowerCase();
    return String(parent.name || '').toLowerCase().includes(query) || String(parent.phone || '').includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Parent Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">{parents.length} registered guardians</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md">
          <Plus size={16} /> Add Parent
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parent name or phone..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Users size={56} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg text-foreground">No parents registered yet</p>
          <p className="text-xs mt-1">Real parent records from this school will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((parent, index) => (
            <motion.div key={parent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-black text-lg">{String(parent.name || '?').charAt(0).toUpperCase()}</div>
                <div className="min-w-0"><p className="font-bold truncate">{parent.name || 'Unnamed Parent'}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{parent.relation || 'Parent'}</p></div>
              </div>
              <div className="space-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                {parent.email && <div className="flex items-center gap-2"><Mail size={13} />{parent.email}</div>}
                {parent.phone && <div className="flex items-center gap-2"><Phone size={13} />{parent.phone}</div>}
              </div>
              <button onClick={() => setSelectedParent(parent)} className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold hover:bg-accent">View Profile</button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} maxWidth="max-w-lg">
        <ModalHeader icon={<Users size={18} className="text-primary" />} title="Add Parent" onClose={() => setShowAdd(false)} />
        <form onSubmit={handleAdd} className="space-y-4 p-6">
          <input required placeholder="Parent name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input required placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <select value={form.relation} onChange={(event) => setForm({ ...form, relation: event.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="FATHER">Father</option><option value="MOTHER">Mother</option><option value="GUARDIAN">Guardian</option></select>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-border text-sm">Cancel</button><button disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">{saving ? 'Saving...' : 'Save Parent'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedParent} onClose={() => setSelectedParent(null)} maxWidth="max-w-md">
        {selectedParent && <div className="p-6 space-y-4"><div className="flex justify-between items-start"><div><h2 className="text-lg font-bold">{selectedParent.name}</h2><p className="text-xs text-muted-foreground">{selectedParent.relation || 'Parent'}</p></div><button onClick={() => setSelectedParent(null)}><X size={18} /></button></div><div className="rounded-xl border border-border p-4 space-y-3 text-sm"><p><span className="text-muted-foreground">Email:</span> {selectedParent.email || '—'}</p><p><span className="text-muted-foreground">Phone:</span> {selectedParent.phone || '—'}</p><p><span className="text-muted-foreground">Linked children:</span> {Array.isArray(selectedParent.students) ? selectedParent.students.length : 0}</p></div></div>}
      </Modal>
    </div>
  );
}
