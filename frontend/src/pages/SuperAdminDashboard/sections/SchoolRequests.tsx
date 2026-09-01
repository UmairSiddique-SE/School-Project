import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, Clock, MapPin, Mail, Phone, Loader2, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

interface SchoolRequest {
  id: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  requestedPlan: string;
  message: string;
  status: string;
  createdAt: string;
}

const planColors: Record<string, string> = {
  FREE_TRIAL: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  BASIC: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  STANDARD: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  PREMIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
};

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function SchoolRequests() {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selected, setSelected] = useState<SchoolRequest | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'APPROVED' | 'REJECTED'; schoolName: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ schoolName: '', contactName: '', email: '', phone: '', city: '', state: '', requestedPlan: 'FREE_TRIAL', message: '' });

  const fetchRequests = () => {
    setLoading(true);
    apiClient.get('/admin/requests')
      .then(r => setRequests(r.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;
    setReviewModal({ id, action, schoolName: request.schoolName });
    setReviewNotes('');
  };

  const confirmReview = async () => {
    if (!reviewModal) return;
    setProcessing(reviewModal.id);
    try {
      await apiClient.patch(`/admin/requests/${reviewModal.id}/review`, {
        action: reviewModal.action,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      toast.success(
        reviewModal.action === 'APPROVED'
          ? 'Request approved! School, Admin, and Subscription created successfully.'
          : 'Request rejected.'
      );
      setReviewModal(null);
      setSelected(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/admin/requests', addForm);
      toast.success('School request submitted successfully!');
      setShowAdd(false);
      setWizardStep(1);
      setAddForm({ schoolName: '', contactName: '', email: '', phone: '', city: '', state: '', requestedPlan: 'FREE_TRIAL', message: '' });
      fetchRequests();
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">School Requests</h2>
          <p className="text-muted-foreground text-sm mt-1">Review and manage school registration requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRequests} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Plus size={15} /> Add Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              filter === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {tab.value === 'ALL' ? requests.length : requests.filter(r => r.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shrink-0">
                  {req.schoolName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-foreground">{req.schoolName}</p>
                      <p className="text-sm text-muted-foreground">{req.contactName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planColors[req.requestedPlan] || planColors.FREE_TRIAL}`}>
                        {req.requestedPlan.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {req.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={11} />{req.email}</span>}
                    {req.city && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} />{req.city}{req.state ? `, ${req.state}` : ''}</span>}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} />{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.message && <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{req.message}"</p>}
                </div>
              </div>
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => setSelected(req)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-accent text-xs font-semibold">
                    <Eye size={13} /> View Details
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'APPROVED')}
                    disabled={processing === req.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold disabled:opacity-60"
                  >
                    {processing === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'REJECTED')}
                    disabled={processing === req.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold disabled:opacity-60"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <Clock size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Request Modal (Registration Wizard) */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Registration Wizard</h3>
                  <p className="text-xs text-muted-foreground">Step {wizardStep} of 3</p>
                </div>
                <button onClick={() => { setShowAdd(false); setWizardStep(1); }}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-6">
                <div className="bg-primary h-full transition-all duration-350" style={{ width: `${(wizardStep / 3) * 100}%` }} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (wizardStep < 3) setWizardStep(prev => prev + 1); else handleAdd(e); }} className="space-y-4">
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 1: School Profile</p>
                    <div>
                      <label className="text-xs font-semibold text-foreground">School Name *</label>
                      <input
                        type="text"
                        required
                        value={addForm.schoolName}
                        onChange={e => setAddForm(p => ({ ...p, schoolName: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Greenwood High School"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground">City</label>
                        <input
                          type="text"
                          value={addForm.city}
                          onChange={e => setAddForm(p => ({ ...p, city: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Lahore"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground">Province / State</label>
                        <input
                          type="text"
                          value={addForm.state}
                          onChange={e => setAddForm(p => ({ ...p, state: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Punjab"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 2: Contact Information</p>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={addForm.contactName}
                        onChange={e => setAddForm(p => ({ ...p, contactName: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Muhammad Ali"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="ali@greenwood.edu"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Phone Number</label>
                      <input
                        type="text"
                        value={addForm.phone}
                        onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 3: Subscription & Notes</p>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Requested Plan</label>
                      <select
                        value={addForm.requestedPlan}
                        onChange={e => setAddForm(p => ({ ...p, requestedPlan: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="FREE_TRIAL">Free Trial (14 Days)</option>
                        <option value="BASIC">Basic Plan</option>
                        <option value="STANDARD">Standard Plan</option>
                        <option value="PREMIUM">Premium Plan</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Message / Notes</label>
                      <textarea
                        value={addForm.message}
                        onChange={e => setAddForm(p => ({ ...p, message: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        placeholder="Any special remarks..."
                      />
                    </div>

                    {/* Preview summary */}
                    <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1.5 border border-border">
                      <p className="font-bold text-foreground mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Preview Summary</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">School:</span><span className="font-semibold text-foreground truncate max-w-[200px]">{addForm.schoolName || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Contact:</span><span className="font-semibold text-foreground truncate max-w-[200px]">{addForm.contactName || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-semibold text-foreground truncate max-w-[200px]">{addForm.email || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Plan:</span><span className="font-semibold text-primary">{addForm.requestedPlan.replace(/_/g, ' ')}</span></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-3">
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep(prev => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Back
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 transition-all ml-auto"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : wizardStep < 3 ? (
                      'Next'
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog Modal (Approve / Reject Notes) */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-base">
                  {reviewModal.action === 'APPROVED' ? 'Approve Registration' : 'Reject Registration'}
                </h3>
                <button onClick={() => setReviewModal(null)}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Are you sure you want to {reviewModal.action.toLowerCase()} the request for <span className="font-semibold text-foreground">{reviewModal.schoolName}</span>?
              </p>
              <div>
                <label className="text-xs font-semibold text-foreground">Review Notes (Optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="e.g. Verified contact person, settings look correct..."
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setReviewModal(null)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReview}
                  disabled={!!processing}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                    reviewModal.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && !showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg">Request Details</h3>
                <button onClick={() => setSelected(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ['School Name', selected.schoolName],
                  ['Contact Person', selected.contactName],
                  ['Email', selected.email],
                  ['Phone', selected.phone || 'N/A'],
                  ['Location', [selected.city, selected.state].filter(Boolean).join(', ') || 'N/A'],
                  ['Requested Plan', selected.requestedPlan.replace(/_/g, ' ')],
                  ['Status', selected.status],
                  ['Submitted', new Date(selected.createdAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-medium">{k}</span>
                    <span className="text-foreground font-semibold text-right">{v}</span>
                  </div>
                ))}
                {selected.message && (
                  <div className="pt-2">
                    <p className="text-muted-foreground font-medium mb-1">Message</p>
                    <p className="text-foreground text-sm bg-muted rounded-xl p-3 italic">"{selected.message}"</p>
                  </div>
                )}
              </div>
              {selected.status === 'PENDING' && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => handleAction(selected.id, 'APPROVED')} disabled={!!processing}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    Approve
                  </button>
                  <button onClick={() => handleAction(selected.id, 'REJECTED')} disabled={!!processing}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
