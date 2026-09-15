import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, Clock, MapPin, Mail, Phone, Loader2, RefreshCw, Plus, ShieldCheck, CreditCard, Building2, UserRound, ExternalLink, Copy, AlertTriangle, CheckCircle2, Image as ImageIcon, Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

interface SchoolRequest {
  id: string;
  schoolName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address?: string;
  subdomain?: string;
  requestedPlan: string;
  notes?: string;
  status: string;
  createdAt: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface RequestDetails {
  request: SchoolRequest;
  school: any;
  admins: any[];
  payments: any[];
  plan: any;
  review: {
    isFree: boolean;
    expectedAmount: number;
    paymentAmount: number;
    amountMatches: boolean;
    paymentSubmitted: boolean;
    paymentPending: boolean;
    paymentApproved: boolean;
    hasScreenshot: boolean;
    paymentMethod: string | null;
    reference: string | null;
  };
}

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const planStyle: Record<string, string> = {
  FREE_TRIAL: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  PROFESSIONAL: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  PREMIUM: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

const money = (value: number, currency = 'PKR') => `${currency} ${Number(value || 0).toLocaleString()}`;

export default function SchoolRequests() {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selected, setSelected] = useState<RequestDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'APPROVED' | 'REJECTED'; schoolName: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('FREE_TRIAL');
  const [showAdd, setShowAdd] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ schoolName: '', ownerName: '', email: '', phone: '', city: '', state: '', requestedPlan: 'FREE_TRIAL', notes: '' });

  const fetchRequests = () => {
    setLoading(true);
    apiClient.get('/admin/requests')
      .then(r => setRequests(r.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const openDetails = async (request: SchoolRequest) => {
    setDetailsLoading(true);
    setSelected(null);
    try {
      const response = await apiClient.get(`/admin/requests/${request.id}/details`);
      setSelected(response.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load complete verification details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;
    setReviewModal({ id, action, schoolName: request.schoolName });
    setReviewNotes('');
    setSelectedPlan(request.requestedPlan || 'FREE_TRIAL');
  };

  const confirmReview = async () => {
    if (!reviewModal) return;
    if (reviewModal.action === 'REJECTED' && !reviewNotes.trim()) {
      toast.error('Please enter the rejection reason.');
      return;
    }
    setProcessing(reviewModal.id);
    try {
      await apiClient.patch(`/admin/requests/${reviewModal.id}/review`, {
        action: reviewModal.action,
        reviewNotes: reviewNotes.trim() || undefined,
        selectedPlan: reviewModal.action === 'APPROVED' ? selectedPlan : undefined,
      });
      toast.success(reviewModal.action === 'APPROVED' ? 'School approved and activated successfully.' : 'School request rejected.');
      setReviewModal(null);
      setSelected(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const approveFromDetails = () => {
    if (!selected) return;
    if (!selected.review.isFree && (!selected.review.paymentSubmitted || !selected.review.hasScreenshot || !selected.review.amountMatches)) {
      toast.error('Payment proof must be present and the amount must match the selected plan before approval.');
      return;
    }
    handleAction(selected.request.id, 'APPROVED');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 3) { setWizardStep(s => s + 1); return; }
    setSaving(true);
    try {
      await apiClient.post('/admin/requests', addForm);
      toast.success('School request submitted successfully.');
      setShowAdd(false);
      setWizardStep(1);
      setAddForm({ schoolName: '', ownerName: '', email: '', phone: '', city: '', state: '', requestedPlan: 'FREE_TRIAL', notes: '' });
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally { setSaving(false); }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const tabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'ALL' }, { label: 'Pending', value: 'PENDING' }, { label: 'Approved', value: 'APPROVED' }, { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2"><ShieldCheck className="text-primary" size={23} /><h2 className="text-2xl font-black text-foreground">School Requests</h2></div>
          <p className="text-muted-foreground text-sm mt-1">Verify school identity, payment proof and subscription before activation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRequests} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"><RefreshCw size={16} /></button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20"><Plus size={16} /> Add Request</button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => setFilter(tab.value)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${filter === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
            {tab.label}<span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{tab.value === 'ALL' ? requests.length : requests.filter(r => r.status === tab.value).length}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
        <div className="space-y-3">
          {filtered.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shrink-0">{req.schoolName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3 flex-wrap">
                    <div><p className="font-bold text-foreground text-base">{req.schoolName}</p><p className="text-sm text-muted-foreground">{req.ownerName}</p></div>
                    <div className="flex gap-2"><span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${planStyle[req.requestedPlan] || planStyle.FREE_TRIAL}`}>{req.requestedPlan.replace(/_/g, ' ')}</span><span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">{req.status}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    {req.email && <span className="flex gap-1.5 items-center"><Mail size={12} />{req.email}</span>}
                    {req.phone && <span className="flex gap-1.5 items-center"><Phone size={12} />{req.phone}</span>}
                    {req.city && <span className="flex gap-1.5 items-center"><MapPin size={12} />{req.city}{req.state ? `, ${req.state}` : ''}</span>}
                    <span className="flex gap-1.5 items-center"><Clock size={12} />{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {req.status === 'PENDING' && <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <button onClick={() => openDetails(req)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent text-xs font-bold"><Eye size={13} /> Full Verification</button>
                <button onClick={() => handleAction(req.id, 'APPROVED')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold"><Check size={13} /> Approve</button>
                <button onClick={() => handleAction(req.id, 'REJECTED')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold"><X size={13} /> Reject</button>
              </div>}
            </motion.div>
          ))}
          {!filtered.length && <div className="rounded-2xl border border-border bg-card p-16 text-center text-muted-foreground"><Clock size={44} className="mx-auto mb-3 opacity-20" /><p className="font-bold">No requests found</p></div>}
        </div>
      )}

      <AnimatePresence>
        {(detailsLoading || selected) && !showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
            {detailsLoading ? <div className="min-h-full flex items-center justify-center"><div className="rounded-2xl bg-card border border-border p-8"><Loader2 className="animate-spin text-primary mx-auto" size={34} /></div></div> : selected && (
              <div className="min-h-full flex items-center justify-center py-6">
                <motion.div initial={{ opacity: 0, scale: .97, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-5xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-violet-500/10">
                    <div className="flex justify-between gap-4 items-start">
                      <div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl overflow-hidden">{selected.school?.logoUrl ? <img src={selected.school.logoUrl} alt="School logo" className="w-full h-full object-cover" /> : selected.request.schoolName.charAt(0).toUpperCase()}</div><div><div className="flex items-center gap-2"><h3 className="text-2xl font-black text-foreground">{selected.request.schoolName}</h3><span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">{selected.request.status}</span></div><p className="text-sm text-muted-foreground mt-1">Complete approval review • Submitted {new Date(selected.request.createdAt).toLocaleString()}</p></div></div>
                      <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X /></button>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                    <div className="grid lg:grid-cols-3 gap-4">
                      <InfoCard icon={<Building2 size={17} />} title="School Identity">
                        <Row label="School Name" value={selected.school?.name || selected.request.schoolName} />
                        <Row label="School URL" value={selected.school?.slug ? `/${selected.school.slug}/login` : selected.request.subdomain || 'Not provided'} mono />
                        <Row label="Type" value={selected.school?.type || 'N/A'} />
                        <Row label="Website" value={selected.school?.website || 'N/A'} />
                        <Row label="Address" value={[selected.school?.address || selected.request.address, selected.school?.city || selected.request.city, selected.school?.state || selected.request.state, selected.school?.country].filter(Boolean).join(', ') || 'N/A'} />
                      </InfoCard>
                      <InfoCard icon={<UserRound size={17} />} title="Administrator">
                        <Row label="Name" value={selected.request.ownerName} />
                        <Row label="Email" value={selected.request.email} />
                        <Row label="Phone" value={selected.request.phone || selected.school?.phone || 'N/A'} />
                        <Row label="Email Verified" value={selected.admins?.[0]?.emailVerified ? 'Yes' : 'No'} good={selected.admins?.[0]?.emailVerified} />
                        <Row label="Account Status" value={selected.admins?.[0]?.isActive ? 'Active' : 'Pending / Inactive'} />
                      </InfoCard>
                      <InfoCard icon={<CreditCard size={17} />} title="Selected Plan">
                        <Row label="Plan" value={selected.plan?.name || selected.request.requestedPlan} />
                        <Row label="Price" value={selected.plan ? money(selected.plan.price, selected.plan.currency) : 'N/A'} good={selected.review.isFree} />
                        <Row label="Period" value={selected.plan?.period || 'N/A'} />
                        <Row label="Students" value={selected.plan?.maxStudents >= 999999 ? 'Unlimited' : String(selected.plan?.maxStudents ?? 'N/A')} />
                        <Row label="Staff" value={selected.plan?.maxTeachers >= 999999 ? 'Unlimited' : String(selected.plan?.maxTeachers ?? 'N/A')} />
                      </InfoCard>
                    </div>

                    <div className={`rounded-2xl border p-5 ${selected.review.isFree ? 'border-emerald-500/20 bg-emerald-500/5' : selected.review.amountMatches && selected.review.hasScreenshot ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-4"><div><p className="font-black text-foreground flex items-center gap-2"><CreditCard size={18} /> Payment Verification</p><p className="text-xs text-muted-foreground mt-1">Match the submitted proof with the selected plan before approval.</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${selected.review.isFree ? 'bg-emerald-500/10 text-emerald-400' : selected.review.paymentApproved ? 'bg-emerald-500/10 text-emerald-400' : selected.review.paymentPending ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{selected.review.isFree ? 'NO PAYMENT REQUIRED' : selected.review.paymentApproved ? 'PAYMENT APPROVED' : selected.review.paymentPending ? 'PAYMENT PENDING' : 'PAYMENT NOT SUBMITTED'}</span></div>
                      {selected.review.isFree ? <div className="text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 size={17} /> Free Trial — payment verification is not required.</div> : <div className="grid md:grid-cols-4 gap-3">
                        <Metric label="Expected" value={money(selected.review.expectedAmount, selected.plan?.currency)} />
                        <Metric label="Submitted" value={money(selected.review.paymentAmount, selected.plan?.currency)} good={selected.review.amountMatches} />
                        <Metric label="Method" value={selected.review.paymentMethod || 'Not provided'} />
                        <Metric label="Reference" value={selected.review.reference || 'Not provided'} mono />
                      </div>}
                    </div>

                    <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-5">
                      <div className="rounded-2xl border border-border p-5">
                        <div className="flex items-center justify-between mb-4"><div><p className="font-black text-foreground flex items-center gap-2"><ImageIcon size={17} /> Payment Proof</p><p className="text-xs text-muted-foreground mt-1">Original screenshot uploaded by the school.</p></div>{selected.review.hasScreenshot && <CheckCircle2 className="text-emerald-400" size={19} />}</div>
                        {selected.review.hasScreenshot ? <div className="space-y-3"><div className="rounded-xl overflow-hidden border border-border bg-background min-h-48 flex items-center justify-center"><img src={selected.payments[0]?.screenshotUrl} alt="Payment proof" className="max-h-[340px] max-w-full object-contain" /></div><a href={selected.payments[0]?.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"><ExternalLink size={13} /> Open full-size proof</a></div> : <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-5 text-sm text-amber-300 flex gap-2"><AlertTriangle size={18} className="shrink-0" />No payment screenshot is available.</div>}
                      </div>
                      <div className="rounded-2xl border border-border p-5">
                        <p className="font-black text-foreground mb-4">Payment Timeline</p>
                        <div className="space-y-3 text-sm">
                          <Row label="Submitted" value={selected.payments[0]?.submittedAt ? new Date(selected.payments[0].submittedAt).toLocaleString() : 'N/A'} />
                          <Row label="Created" value={selected.payments[0]?.createdAt ? new Date(selected.payments[0].createdAt).toLocaleString() : 'N/A'} />
                          <Row label="Reviewed" value={selected.payments[0]?.reviewedAt ? new Date(selected.payments[0].reviewedAt).toLocaleString() : 'Pending'} />
                          <Row label="Method" value={selected.payments[0]?.method || 'N/A'} />
                          <Row label="Reference" value={selected.payments[0]?.reference || 'N/A'} mono />
                        </div>
                        {selected.payments.length > 1 && <p className="text-xs text-muted-foreground mt-4">{selected.payments.length} payment submissions found. Latest submission is shown above.</p>}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-black text-foreground mb-4">Approval Checklist</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <CheckItem label="School information is complete" ok={Boolean(selected.request.schoolName && selected.request.ownerName && selected.request.email)} />
                        <CheckItem label="Unique school URL is assigned" ok={Boolean(selected.school?.slug || selected.request.subdomain)} />
                        <CheckItem label="Administrator email is verified" ok={Boolean(selected.admins?.[0]?.emailVerified)} />
                        <CheckItem label="Payment proof uploaded" ok={selected.review.isFree || selected.review.hasScreenshot} />
                        <CheckItem label="Payment amount matches plan" ok={selected.review.isFree || selected.review.amountMatches} />
                        <CheckItem label="Payment method / reference available" ok={selected.review.isFree || Boolean(selected.review.paymentMethod || selected.review.reference)} />
                      </div>
                    </div>

                    {(selected.request.notes || selected.request.reviewNotes) && <div className="grid md:grid-cols-2 gap-4"><InfoCard icon={<Clock size={17} />} title="Registration Notes"><p className="text-sm text-foreground/80 whitespace-pre-wrap">{selected.request.notes || 'No registration notes.'}</p></InfoCard><InfoCard icon={<ShieldCheck size={17} />} title="Review History"><p className="text-sm text-foreground/80">{selected.request.reviewNotes || 'Not reviewed yet.'}</p>{selected.request.reviewedBy && <p className="text-xs text-muted-foreground mt-2">Reviewed by {selected.request.reviewedBy} {selected.request.reviewedAt ? `• ${new Date(selected.request.reviewedAt).toLocaleString()}` : ''}</p>}</InfoCard></div>}
                  </div>

                  {selected.request.status === 'PENDING' && <div className="p-5 border-t border-border bg-background/40 flex items-center justify-between gap-3 flex-wrap"><div className="text-xs text-muted-foreground">Approval will activate the subscription, school account and School Admin together.</div><div className="flex gap-2"><button onClick={() => handleAction(selected.request.id, 'REJECTED')} className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold">Reject</button><button onClick={approveFromDetails} disabled={!selected.review.isFree && (!selected.review.paymentSubmitted || !selected.review.hasScreenshot || !selected.review.amountMatches)} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"><Check size={16} /> Approve & Activate</button></div></div>}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: .96 }} animate={{ scale: 1 }} className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl"><div className="flex justify-between items-start gap-4"><div><h3 className="font-black text-lg text-foreground">{reviewModal.action === 'APPROVED' ? 'Approve & Activate School' : 'Reject School Request'}</h3><p className="text-xs text-muted-foreground mt-1">{reviewModal.schoolName}</p></div><button onClick={() => setReviewModal(null)}><X className="text-muted-foreground" size={19} /></button></div>{reviewModal.action === 'APPROVED' && <label className="block text-xs font-bold text-foreground mt-5">Final Subscription Plan<select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"><option value="FREE_TRIAL">Free Trial</option><option value="PROFESSIONAL">Professional</option><option value="PREMIUM">Premium</option></select></label>}<label className="block text-xs font-bold text-foreground mt-4">{reviewModal.action === 'REJECTED' ? 'Rejection Reason (Required)' : 'Approval Notes (Optional)'}<textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none" placeholder={reviewModal.action === 'REJECTED' ? 'Explain why this request is being rejected...' : 'Verified school information and payment proof...'} /></label><div className="flex gap-3 mt-5"><button onClick={() => setReviewModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button><button onClick={confirmReview} disabled={!!processing} className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex justify-center items-center gap-2 ${reviewModal.action === 'APPROVED' ? 'bg-emerald-600' : 'bg-red-600'}`}>{processing ? <Loader2 size={15} className="animate-spin" /> : reviewModal.action === 'APPROVED' ? <Check size={15} /> : <X size={15} />}{reviewModal.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}</button></div></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: .96 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"><div className="flex justify-between items-center mb-5"><div><h3 className="font-black text-lg text-foreground">Add School Request</h3><p className="text-xs text-muted-foreground">Step {wizardStep} of 3</p></div><button onClick={() => { setShowAdd(false); setWizardStep(1); }}><X size={19} /></button></div><div className="h-1 bg-muted rounded-full overflow-hidden mb-6"><div className="h-full bg-primary transition-all" style={{ width: `${wizardStep / 3 * 100}%` }} /></div><form onSubmit={handleAdd} className="space-y-4">{wizardStep === 1 && <><Field label="School Name" required value={addForm.schoolName} onChange={v => setAddForm(p => ({ ...p, schoolName: v }))} placeholder="Greenwood High School" /><div className="grid grid-cols-2 gap-3"><Field label="City" value={addForm.city} onChange={v => setAddForm(p => ({ ...p, city: v }))} /><Field label="Province / State" value={addForm.state} onChange={v => setAddForm(p => ({ ...p, state: v }))} /></div></>}{wizardStep === 2 && <><Field label="Contact Person" required value={addForm.ownerName} onChange={v => setAddForm(p => ({ ...p, ownerName: v }))} /><Field label="Email" required type="email" value={addForm.email} onChange={v => setAddForm(p => ({ ...p, email: v }))} /><Field label="Phone" value={addForm.phone} onChange={v => setAddForm(p => ({ ...p, phone: v }))} /></>}{wizardStep === 3 && <><div><label className="text-xs font-bold text-foreground">Requested Plan</label><select value={addForm.requestedPlan} onChange={e => setAddForm(p => ({ ...p, requestedPlan: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"><option value="FREE_TRIAL">Free Trial (3 Days)</option><option value="PROFESSIONAL">Professional — PKR 3,000/month</option><option value="PREMIUM">Premium — PKR 5,000/month</option></select></div><div><label className="text-xs font-bold text-foreground">Notes</label><textarea value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none" /></div></>}<div className="flex justify-between pt-2">{wizardStep > 1 ? <button type="button" onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold">Back</button> : <span /> }<button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">{saving ? <Loader2 size={15} className="animate-spin" /> : wizardStep < 3 ? 'Next' : 'Submit Request'}</button></div></form></motion.div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-background/30 p-5"><p className="text-sm font-black text-foreground flex items-center gap-2 mb-4">{icon}<span>{title}</span></p><div className="space-y-2.5">{children}</div></div>;
}

function Row({ label, value, mono, good }: { label: string; value: string; mono?: boolean; good?: boolean }) {
  return <div className="flex justify-between gap-4 text-xs"><span className="text-muted-foreground">{label}</span><span className={`font-semibold text-right max-w-[65%] break-words ${mono ? 'font-mono' : ''} ${good ? 'text-emerald-400' : 'text-foreground'}`}>{value}</span></div>;
}

function Metric({ label, value, good, mono }: { label: string; value: string; good?: boolean; mono?: boolean }) {
  return <div className="rounded-xl border border-border bg-background/50 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p><p className={`text-sm font-black mt-1 ${good === false ? 'text-red-400' : good ? 'text-emerald-400' : 'text-foreground'} ${mono ? 'font-mono' : ''}`}>{value}</p></div>;
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/30 p-3"><span className={ok ? 'text-emerald-400' : 'text-amber-400'}>{ok ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}</span><span className="text-xs font-semibold text-foreground">{label}</span></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <div><label className="text-xs font-bold text-foreground">{label}{required ? ' *' : ''}</label><input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" /></div>;
}
