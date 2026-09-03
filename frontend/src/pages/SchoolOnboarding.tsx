import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

type PlanKey = 'FREE_TRIAL' | 'PROFESSIONAL' | 'PREMIUM';

type FormState = {
  schoolName: string;
  schoolSlug: string;
  schoolType: string;
  logoUrl: string;
  schoolAddress: string;
  schoolPhone: string;
  country: string;
  city: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  expectedStudents: string;
};

const PLAN_INFO: Record<PlanKey, { name: string; price: number; label: string }> = {
  FREE_TRIAL: { name: 'Free Trial', price: 0, label: '14 days · up to 20 students' },
  PROFESSIONAL: { name: 'Professional', price: 3000, label: 'PKR 3,000/month · up to 500 students' },
  PREMIUM: { name: 'Premium', price: 5000, label: 'PKR 5,000/month · unlimited students' },
};

export default function SchoolOnboarding() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const selectedPlan = useMemo<PlanKey>(() => {
    const value = params.get('plan')?.toUpperCase();
    return value === 'PROFESSIONAL' || value === 'PREMIUM' ? value : 'FREE_TRIAL';
  }, [params]);

  const [step, setStep] = useState<'form' | 'verify' | 'payment' | 'pending'>('form');
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationUserId, setVerificationUserId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [reference, setReference] = useState('');
  const [form, setForm] = useState<FormState>({
    schoolName: '', schoolSlug: '', schoolType: 'SCHOOL', logoUrl: '',
    schoolAddress: '', schoolPhone: '', country: 'Pakistan', city: '',
    adminName: '', adminEmail: '', adminPhone: '', adminPassword: '', expectedStudents: '',
  });

  const set = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.adminPassword.length < 12) {
      toast.error('Password must be at least 12 characters.');
      return;
    }
    setSaving(true);
    try {
      const registration = await apiClient.post('/auth/register-school', {
        ...form,
        expectedStudents: form.expectedStudents ? Number(form.expectedStudents) : undefined,
        requestedPlan: selectedPlan,
      });

      // The auth endpoint creates the disabled school/admin. This request is the record
      // shown to Super Admin for approval.
      await apiClient.post('/school-requests', {
        schoolName: form.schoolName,
        ownerName: form.adminName,
        email: form.adminEmail,
        phone: form.adminPhone,
        whatsapp: form.adminPhone,
        city: form.city,
        address: form.schoolAddress,
        expectedStudents: form.expectedStudents ? Number(form.expectedStudents) : undefined,
        subdomain: form.schoolSlug,
        requestedPlan: selectedPlan,
      });

      setVerificationUserId(registration.data.verificationUserId);
      setStep('verify');
      toast.success('Verification code sent to your Gmail.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to complete registration.');
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP sent to your Gmail.');
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post('/auth/verify-email', {
        userId: verificationUserId,
        otp,
      });
      login(response.data.accessToken, response.data.user);
      toast.success('Gmail verified successfully.');
      if (selectedPlan === 'FREE_TRIAL') {
        await finishAndLogout();
      } else {
        setStep('payment');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Email verification failed.');
    } finally {
      setSaving(false);
    }
  };

  const finishAndLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Local logout below is still safe if the refresh token has already expired.
    }
    logout();
    setStep('pending');
  };

  const submitPayment = async () => {
    if (!screenshotUrl.trim()) {
      toast.error('Payment proof URL is required for paid plans.');
      return;
    }
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      await apiClient.post('/auth/onboarding-payment', {
        schoolId: user.schoolId,
        plan: selectedPlan,
        method: paymentMethod,
        screenshotUrl: screenshotUrl.trim(),
        reference: reference.trim() || undefined,
      });
      toast.success('Payment proof submitted. Your school is now awaiting Super Admin approval.');
      await finishAndLogout();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to submit payment proof.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'pending') {
    return <PendingScreen schoolName={form.schoolName} email={form.adminEmail} />;
  }

  if (step === 'verify') {
    return (
      <main className="min-h-screen bg-[#070b1a] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#0c1227]/95 p-7 shadow-2xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
            <Mail size={24} />
          </div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Step 2 · Gmail verification</p>
          <h1 className="mt-2 text-3xl font-black">Verify your email</h1>
          <p className="mt-3 text-sm text-slate-400">We sent a 6-digit code to <b className="text-white">{form.adminEmail}</b>. The code expires shortly.</p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            autoFocus
            placeholder="000000"
            className="mt-7 w-full rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-center text-3xl tracking-[.5em] text-white outline-none focus:border-violet-400"
          />
          <button onClick={verify} disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 font-bold disabled:opacity-60">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {saving ? 'Verifying…' : 'Verify Gmail'}
          </button>
          <p className="mt-5 text-center text-xs text-slate-500">After verification, your application continues to Super Admin review.</p>
        </div>
      </main>
    );
  }

  if (step === 'payment') {
    const plan = PLAN_INFO[selectedPlan];
    return (
      <main className="min-h-screen bg-[#070b1a] px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0c1227]/95 p-7 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Step 3 · Payment proof</p>
          <h1 className="mt-2 text-3xl font-black">{plan.name}</h1>
          <p className="mt-2 text-slate-400">{plan.label}</p>
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Amount</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">PKR {plan.price.toLocaleString()}</p>
          </div>
          <div className="mt-6 space-y-4">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
              <option>Bank Transfer</option><option>JazzCash</option><option>Easypaisa</option><option>Credit / Debit Card</option>
            </select>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction/reference number (optional)" className="w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
            <input value={screenshotUrl} onChange={(e) => setScreenshotUrl(e.target.value)} placeholder="Cloudinary payment-proof URL" className="w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none" />
          </div>
          <button onClick={submitPayment} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 font-bold disabled:opacity-60">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {saving ? 'Submitting…' : 'Submit Payment Proof'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b1a] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">← Back to EduSphere</Link>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck size={15} /> Secure onboarding</span>
        </header>
        <div className="mb-6 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Selected plan</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-black">{PLAN_INFO[selectedPlan].name}</h1><span className="font-bold text-emerald-300">{PLAN_INFO[selectedPlan].price ? `PKR ${PLAN_INFO[selectedPlan].price.toLocaleString()}/month` : 'Free'}</span></div>
          <p className="mt-1 text-sm text-slate-400">{PLAN_INFO[selectedPlan].label}</p>
        </div>

        <form onSubmit={submitRegistration} className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-[#0c1227]/95 p-6 shadow-xl">
            <h2 className="text-lg font-black">1. School information</h2>
            <div className="mt-5 space-y-4">
              <Field label="School name *" value={form.schoolName} onChange={(v) => { set('schoolName', v); if (!form.schoolSlug) set('schoolSlug', v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} />
              <Field label="Subdomain *" value={form.schoolSlug} onChange={(v) => set('schoolSlug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="my-school" />
              <Field label="School logo URL *" value={form.logoUrl} onChange={(v) => set('logoUrl', v)} placeholder="https://..." />
              <div className="grid grid-cols-2 gap-4"><Field label="City *" value={form.city} onChange={(v) => set('city', v)} /><Field label="Phone *" value={form.schoolPhone} onChange={(v) => set('schoolPhone', v)} /></div>
              <Field label="Complete address *" value={form.schoolAddress} onChange={(v) => set('schoolAddress', v)} />
              <Field label="Expected students" value={form.expectedStudents} onChange={(v) => set('expectedStudents', v.replace(/\D/g, ''))} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0c1227]/95 p-6 shadow-xl">
            <h2 className="text-lg font-black">2. Administrator & login ID</h2>
            <p className="mt-1 text-xs text-slate-500">These credentials stay locked until Super Admin approval.</p>
            <div className="mt-5 space-y-4">
              <Field label="Admin / Owner name *" value={form.adminName} onChange={(v) => set('adminName', v)} />
              <Field label="Gmail / Login ID *" type="email" value={form.adminEmail} onChange={(v) => set('adminEmail', v)} placeholder="admin@gmail.com" />
              <Field label="WhatsApp / phone *" value={form.adminPhone} onChange={(v) => set('adminPhone', v)} placeholder="0300-1234567" />
              <div className="relative"><LockKeyhole className="absolute left-3 top-3 text-slate-500" size={16} /><input required type="password" minLength={12} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} placeholder="Password (12+ characters)" className="w-full rounded-2xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-4 text-white outline-none focus:border-violet-400" /></div>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-100/80">
              <b>Flow:</b> Register → Gmail verification → Super Admin approval → Login ID unlocks → School dashboard sections unlock.
            </div>
            <button disabled={saving} type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 font-bold disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
              {saving ? 'Creating application…' : 'Create School Application'}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span><input required={label.includes('*')} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-white outline-none focus:border-violet-400" /></label>;
}

function PendingScreen({ schoolName, email }: { schoolName: string; email: string }) {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-[#070b1a] px-4 py-12 text-white"><div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#0c1227]/95 p-8 text-center shadow-2xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={30} /></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-amber-300">Application pending</p><h1 className="mt-3 text-3xl font-black">{schoolName || 'Your school'} is awaiting approval</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">Gmail verification is complete. Your login ID <b className="text-white">{email}</b> is intentionally locked until the Super Admin approves the school.</p><div className="mt-7 grid gap-3 text-left sm:grid-cols-3">{['Gmail verified', 'Super Admin review', 'Dashboard unlock'].map((x, i) => <div key={x} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="mb-2 text-xs font-black text-violet-300">0{i + 1}</div><p className="text-sm font-bold">{x}</p><p className="mt-1 text-xs text-slate-500">{i === 0 ? 'Completed' : i === 1 ? 'Pending' : 'Locked'}</p></div>)}</div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={() => navigate('/school-login')} className="flex-1 rounded-2xl border border-white/10 bg-white/[.03] py-3 font-semibold hover:bg-white/[.06]">Go to School Login</button><button onClick={() => navigate('/')} className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-bold">Back to Homepage</button></div></div></main>;
}
