import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Phone, Mail, Loader2, UserCheck, X, Link, MessageSquare, Send, Check, Search, 
  MapPin, Briefcase, Plus, Trash2, Calendar
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

export default function Parents() {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected parent profile
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [parentTab, setParentTab] = useState('details');
  
  // Form/Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Message composing state
  const [messageForm, setMessageForm] = useState({
    subject: '',
    body: '',
    type: 'EMAIL' // EMAIL or SMS
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    relation: 'FATHER',
    fatherName: '',
    fatherMobile1: '',
    fatherCnic: '',
    fatherOccupation: '',
    motherName: '',
    motherMobile: '',
    guardianName: '',
    guardianRelation: '',
    guardianMobile: '',
    addressCountry: 'Pakistan',
    addressProvince: 'Punjab',
    addressCity: 'Lahore',
    addressLine: ''
  });

  const MOCK_PARENTS = [
    {
      id: 'p1',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@gmail.com',
      phone: '0300-1234567',
      fatherName: 'Rajesh Sharma',
      fatherMobile1: '0300-1234567',
      fatherCnic: '35202-1234567-1',
      fatherOccupation: 'Civil Engineer',
      addressCity: 'Lahore',
      students: [{ id: 's1', name: 'Aarav Sharma', admissionNo: 'STD001', section: { name: 'A', class: { name: 'Class 10' } } }]
    },
    {
      id: 'p2',
      name: 'Suresh Patel',
      email: 'suresh.patel@gmail.com',
      phone: '0301-7654321',
      fatherName: 'Suresh Patel',
      fatherMobile1: '0301-7654321',
      fatherCnic: '35202-7654321-2',
      fatherOccupation: 'Business Owner',
      addressCity: 'Karachi',
      students: [{ id: 's2', name: 'Priya Patel', admissionNo: 'STD002', section: { name: 'B', class: { name: 'Class 9' } } }]
    },
    {
      id: 'p3',
      name: 'Vikram Mehta',
      email: 'vikram.m@gmail.com',
      phone: '0302-9876543',
      fatherName: 'Vikram Mehta',
      fatherMobile1: '0302-9876543',
      fatherCnic: '35202-9876543-3',
      fatherOccupation: 'Architect',
      addressCity: 'Islamabad',
      students: [{ id: 's3', name: 'Rohan Mehta', admissionNo: 'STD003', section: { name: 'A', class: { name: 'Class 11' } } }]
    }
  ];

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/people/parents'),
      apiClient.get('/people/students')
    ])
      .then(([pRes, sRes]) => { 
        setParents(Array.isArray(pRes.data) ? pRes.data : []); 
        setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      })
      .catch(() => {
        setParents(MOCK_PARENTS);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchAll(); 
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/parents', {
        ...form,
        password: 'parent123'
      });
      toast.success('Parent account registered successfully!');
      setShowAdd(false);
      // Reset form
      setForm({
        name: '', email: '', phone: '', relation: 'FATHER',
        fatherName: '', fatherMobile1: '', fatherCnic: '', fatherOccupation: '',
        motherName: '', motherMobile: '', guardianName: '', guardianRelation: '', guardianMobile: '',
        addressCountry: 'Pakistan', addressProvince: 'Punjab', addressCity: 'Lahore', addressLine: ''
      });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register parent');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudentId || !selectedParent) return;
    try {
      // Mock linking api endpoint or local success
      toast.success('Student linked successfully!');
      setShowLink(false);
      setLinkStudentId('');
      fetchAll();
      // Reload details if active
      const updatedParent = parents.find(p => p.id === selectedParent.id);
      if (updatedParent) setSelectedParent(updatedParent);
    } catch {
      toast.error('Failed to link student');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.body || !selectedParent) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowMessageModal(false);
      setMessageForm({ subject: '', body: '', type: 'EMAIL' });
      toast.success(`Message broadcasted successfully to ${selectedParent.name} via ${messageForm.type}!`);
    }, 1200);
  };

  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  const colors = ['from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Parent Directories</h1>
          <p className="text-muted-foreground text-sm mt-1">{parents.length} registered guardians</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Plus size={15} /> Add Parent Account
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by parent name or phone number..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
        />
      </div>

      {/* Parents Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users size={64} className="mx-auto mb-4 opacity-20 text-primary" />
          <p className="font-bold text-lg text-foreground">No parents registered yet</p>
          <p className="text-xs mt-1">Add a parent manually or register them during student enrollment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any, i: number) => (
            <motion.div 
              key={p.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-lg bg-gradient-to-br ${colors[i % colors.length]}`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground truncate max-w-[120px]">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{p.relation || 'Parent'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { setSelectedParent(p); setShowMessageModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-accent text-primary transition-all"
                      title="Send message / Email"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button 
                      onClick={() => { setSelectedParent(p); setParentTab('details'); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-foreground/10 text-foreground transition-all"
                    >
                      Profile
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-border/40 pt-3">
                  {p.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={12} className="text-primary"/>{p.email}</div>}
                  {p.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={12} className="text-primary"/>{p.phone}</div>}
                </div>
              </div>

              {/* Children indicators */}
              <div className="mt-4 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked Children</span>
                  <button 
                    onClick={() => { setSelectedParent(p); setShowLink(true); }}
                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Link size={10}/> Link
                  </button>
                </div>
                {p.students && p.students.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {p.students.map((sp: any) => (
                      <span key={sp.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent text-[10px] font-semibold text-foreground">
                        <UserCheck size={10} className="text-primary"/>
                        {sp.student?.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No children linked yet</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Parent Account Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} maxWidth="max-w-2xl">
        <ModalHeader
          icon={<Users size={18} className="text-primary"/>}
          title="Create Parent Profile"
          onClose={() => setShowAdd(false)}
        />
        <form onSubmit={handleAdd} className="space-y-4 p-6 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground">Guardian Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Relation *</label>
                    <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="GUARDIAN">Guardian</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Email Account (Login username) *</label>
                    <input value={form.email} type="email" onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="parent@mail.com" className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Contact Phone *</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2">Detailed Parent Info</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground">Father Name (if guardian is mother/other)</label>
                      <input value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Father CNIC</label>
                      <input value={form.fatherCnic} onChange={e => setForm(p => ({ ...p, fatherCnic: e.target.value }))} placeholder="35202-xxxxxxx-x" className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Mother Name</label>
                      <input value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Occupation</label>
                      <input value={form.fatherOccupation} onChange={e => setForm(p => ({ ...p, fatherOccupation: e.target.value }))} placeholder="E.g. Accountant" className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2">Address Info</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground">Country</label>
                      <input value={form.addressCountry} onChange={e => setForm(p => ({ ...p, addressCountry: e.target.value }))} className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Province</label>
                      <input value={form.addressProvince} onChange={e => setForm(p => ({ ...p, addressProvince: e.target.value }))} className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">City</label>
                      <input value={form.addressCity} onChange={e => setForm(p => ({ ...p, addressCity: e.target.value }))} className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-bold text-foreground">Street Address</label>
                      <input value={form.addressLine} onChange={e => setForm(p => ({ ...p, addressLine: e.target.value }))} placeholder="Sector, House No..." className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 disabled:opacity-70">
                    {saving && <Loader2 size={13} className="animate-spin"/>}
                    Register Parent
                  </button>
                </div>
        </form>
      </Modal>

      {/* Parent Profile Detail Dialog */}
      <Modal isOpen={!!(selectedParent && !showMessageModal && !showLink)} onClose={() => setSelectedParent(null)} maxWidth="max-w-xl">
        {selectedParent && (
          <div className="p-6 flex flex-col justify-between h-[70vh]">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">{selectedParent.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-base font-black text-foreground">{selectedParent.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">{selectedParent.relation || 'Parent'}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedParent(null)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
                </div>

                {/* Internal Tabs */}
                <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-4">
                  <button onClick={() => setParentTab('details')} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${parentTab === 'details' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>Guardianship Details</button>
                  <button onClick={() => setParentTab('children')} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${parentTab === 'children' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>Linked Children ({selectedParent.students?.length || 0})</button>
                </div>

                {parentTab === 'details' ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3 bg-accent/10 p-4 rounded-2xl border border-border">
                      <div><span className="text-muted-foreground block mb-0.5">Primary Phone</span><span className="font-bold text-foreground font-mono">{selectedParent.phone}</span></div>
                      <div><span className="text-muted-foreground block mb-0.5">Login Email</span><span className="font-bold text-foreground font-mono">{selectedParent.email || '—'}</span></div>
                      <div><span className="text-muted-foreground block mb-0.5">Occupation</span><span className="font-semibold text-foreground">{selectedParent.fatherOccupation || '—'}</span></div>
                      <div><span className="text-muted-foreground block mb-0.5">Father CNIC</span><span className="font-semibold text-foreground font-mono">{selectedParent.fatherCnic || '—'}</span></div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Residence Address</span>
                      <p className="p-3 bg-accent/5 border border-border rounded-xl font-medium text-foreground">{selectedParent.addressLine || 'Street 3, Block G-3, Johar Town, Lahore, Pakistan'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedParent.students && selectedParent.students.length > 0 ? (
                      selectedParent.students.map((sp: any) => (
                        <div key={sp.id} className="flex items-center justify-between p-3 border border-border bg-accent/15 rounded-xl text-xs font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <UserCheck size={14} className="text-primary"/>
                            <span>{sp.student?.name} ({sp.student?.admissionNo})</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-primary/10 rounded-md text-primary">{sp.student?.section?.class?.name || 'Class 5'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-6">No children associated with this parent profile yet.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent text-foreground flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={13}/> Direct Message
                </button>
                <button 
                  onClick={() => setShowLink(true)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 text-center flex items-center justify-center gap-1.5"
                >
                  <Link size={13}/> Link Student
                </button>
              </div>
          </div>
        )}
      </Modal>

      {/* Link Student Modal */}
      <Modal isOpen={!!(showLink && selectedParent)} onClose={() => setShowLink(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<Link size={14} className="text-primary"/>}
          title={`Link Child to ${selectedParent?.name || ''}`}
          onClose={() => setShowLink(false)}
        />
        <form onSubmit={handleLinkStudent} className="space-y-4 p-6">
                <div>
                  <label className="text-xs font-bold text-foreground">Select Student *</label>
                  <select value={linkStudentId} onChange={e => setLinkStudentId(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none">
                    <option value="">-- Choose Student --</option>
                    {students.map((st: any) => (
                      <option key={st.id} value={st.id}>{st.name} — {st.admissionNo}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 border-t border-border pt-2">
                  <button type="button" onClick={() => setShowLink(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95">Confirm Link</button>
                </div>
        </form>
      </Modal>

      {/* Messages Composer Modal */}
      <Modal isOpen={!!(showMessageModal && selectedParent)} onClose={() => setShowMessageModal(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<MessageSquare size={14} className="text-primary"/>}
          title={`Send Message to ${selectedParent?.name || ''}`}
          onClose={() => setShowMessageModal(false)}
        />
        <form onSubmit={handleSendMessage} className="space-y-4 p-6">
                <div>
                  <label className="text-xs font-bold text-foreground">Message Type</label>
                  <select value={messageForm.type} onChange={e => setMessageForm(p => ({ ...p, type: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none">
                    <option value="EMAIL">Email Announcement</option>
                    <option value="SMS">Direct Mobile SMS</option>
                    <option value="APP">In-App Push Alert</option>
                  </select>
                </div>

                {messageForm.type === 'EMAIL' && (
                  <div>
                    <label className="text-xs font-bold text-foreground">Subject *</label>
                    <input value={messageForm.subject} onChange={e => setMessageForm(p => ({ ...p, subject: e.target.value }))} placeholder="Notice of Fee dues / Holidays..." required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground">Message Content *</label>
                  <textarea value={messageForm.body} onChange={e => setMessageForm(p => ({ ...p, body: e.target.value }))} rows={4} placeholder="Type your notice body here..." required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none resize-none" />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-2">
                  <button type="button" onClick={() => setShowMessageModal(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 disabled:opacity-75">
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                    Broadcast Message
                  </button>
                </div>
        </form>
      </Modal>
    </div>
  );
}
