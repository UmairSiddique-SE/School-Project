import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  ArrowRight, BadgeCheck, Building2, Check, ChevronLeft,
  CheckCircle2, CircleAlert, Eye, EyeOff, Globe2, ImagePlus,
  Loader2, LockKeyhole, Mail, MapPin, Phone, RefreshCw,
  ShieldCheck, Sparkles, UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type FormState = {
  schoolName: string; schoolSlug: string;
  schoolType: 'SCHOOL' | 'COLLEGE' | 'ACADEMY'; logoUrl: string;
  province: string; city: string; address: string;
  adminName: string; adminEmail: string; adminPhone: string; adminPassword: string;
};
type Plan = { planKey: string; name: string; price: number; currency?: string; period: string; maxStudents?: number };

/* ─── Constants ──────────────────────────────────────────────────────────── */
const initial: FormState = {
  schoolName: '', schoolSlug: '', schoolType: 'SCHOOL', logoUrl: '',
  province: '', city: '', address: '',
  adminName: '', adminEmail: '', adminPhone: '', adminPassword: '',
};
const provinces = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Azad Kashmir', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
];
const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
const sanitizePhone = (v: string) => v.replace(/\D/g, '').slice(0, 11);

/* ─── Logo compressor ────────────────────────────────────────────────────── */
async function compressImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Logo must be PNG or JPG.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Logo must be 2 MB or smaller.');
  const src = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('Unable to read logo.'));
    r.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Unable to process logo.'));
    img.src = src;
  });
  const scale = Math.min(1, 900 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function RegisterSchoolPremium() {
  const navigate = useNavigate();
  const { login } = useAuth();

  /* state */
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [verificationUserId, setVerificationUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  const update = (key: keyof FormState, value: string) =>
    setForm(p => ({ ...p, [key]: value }));

  const selectedPlan = plans.find(p => p.planKey === 'PROFESSIONAL');
  const slugPreview = form.schoolSlug || 'your-school';
  const schoolPublicUrl = `${window.location.origin}/school/${slugPreview}`;
  const progress = step === 'details' ? 50 : 100;

  /* ── Init ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    sessionStorage.setItem('schoolos_registration_plan', 'PROFESSIONAL');
    sessionStorage.setItem('edusphere_registration_plan', 'PROFESSIONAL');

    /* restore pending OTP session */
    const saved =
      sessionStorage.getItem('schoolos_pending_school_registration') ||
      sessionStorage.getItem('edusphere_pending_school_registration');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.verificationUserId) {
          setVerificationUserId(data.verificationUserId);
          setForm(p => ({ ...p, ...(data.form || {}) }));
          setStep('otp');
        }
      } catch {
        sessionStorage.removeItem('schoolos_pending_school_registration');
        sessionStorage.removeItem('edusphere_pending_school_registration');
      }
    }

    /* fetch plans */
    apiClient.get<Plan[]>('/public/plans')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        const pro = list.find(p => p.planKey === 'PROFESSIONAL');
        setPlans([pro
          ? { ...pro, name: 'Professional', price: 3000, period: 'per month' }
          : { planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, period: 'per month' },
        ]);
      })
      .catch(() => {
        setPlans([{ planKey: 'PROFESSIONAL', name: 'Professional', price: 3000, period: 'per month' }]);
      });
  }, []);

  /* ── Cooldown timer ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!cooldown) return;
    const t = window.setInterval(() => setCooldown(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  /* ── Auto-slug from school name ──────────────────────────────────────── */
  useEffect(() => {
    if (form.schoolName && !verificationUserId) update('schoolSlug', slugify(form.schoolName));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolName]);

  /* ── Slug availability check ─────────────────────────────────────────── */
  useEffect(() => {
    const slug = form.schoolSlug.trim().toLowerCase();
    if (slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
      setSlugStatus(slug ? 'invalid' : 'idle');
      return;
    }
    setSlugStatus('checking');
    const timer = window.setTimeout(() => {
      apiClient.get('/public/slug-availability?slug=' + encodeURIComponent(slug))
        .then(r => setSlugStatus(r.data?.available ? 'available' : 'taken'))
        .catch(() => setSlugStatus('idle'));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [form.schoolSlug]);

  /* ── Password hint ───────────────────────────────────────────────────── */
  const passwordHint = useMemo(() => {
    if (!form.adminPassword) return 'Minimum 8 characters';
    if (form.adminPassword.length >= 12) return 'Strong password ✓';
    if (form.adminPassword.length >= 8) return 'Good password';
    return `${8 - form.adminPassword.length} more characters required`;
  }, [form.adminPassword]);

  /* ── Logo handler ────────────────────────────────────────────────────── */
  const handleLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoBusy(true);
    try {
      update('logoUrl', await compressImage(file));
      toast.success('School logo added.');
    } catch (err: any) {
      toast.error(err?.message || 'Unable to add logo.');
    } finally {
      setLogoBusy(false);
    }
  };

  /* ── Validation ──────────────────────────────────────────────────────── */
  const validate = () => {
    if (!form.schoolName.trim()) return 'Enter your school name.';
    if (!form.schoolSlug.trim() || form.schoolSlug.length < 3)
      return 'Choose a valid school website address.';
    if (slugStatus !== 'available') return 'Choose an available school website address.';
    if (!/^[a-z0-9-]+$/.test(form.schoolSlug))
      return 'School website address: lowercase letters, numbers and hyphens only.';
    if (!form.logoUrl) return 'School logo is required.';
    if (!form.province || !form.city.trim()) return 'Select province and enter city.';
    if (!form.address.trim()) return 'Enter school address.';
    if (!form.adminName.trim()) return 'Enter administrator name.';
    if (!/^\S+@\S+\.\S+$/.test(form.adminEmail.trim())) return 'Enter a valid email address.';
    if (sanitizePhone(form.adminPhone).length < 10) return 'Enter a valid mobile number.';
    if (form.adminPassword.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  /* ── Submit registration ─────────────────────────────────────────────── */
  const submitRegistration = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const response = await apiClient.post('/auth/register-school', {
        schoolName: form.schoolName.trim(),
        schoolSlug: form.schoolSlug.trim().toLowerCase(),
        schoolType: form.schoolType,
        logoUrl: form.logoUrl,
        schoolAddress: form.address.trim(),
        schoolPhone: sanitizePhone(form.adminPhone),
        country: 'Pakistan',
        city: form.city.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPhone: sanitizePhone(form.adminPhone),
        adminPassword: form.adminPassword,
        requestedPlan: 'PROFESSIONAL',
      });
      const data = response.data;
      setVerificationUserId(data.verificationUserId);
      setForm(p => ({ ...p, schoolSlug: data.schoolSlug || p.schoolSlug }));
      const session = JSON.stringify({
        verificationUserId: data.verificationUserId,
        planKey: 'PROFESSIONAL',
        form: { ...form, schoolSlug: data.schoolSlug || form.schoolSlug },
      });
      sessionStorage.setItem('schoolos_pending_school_registration', session);
      sessionStorage.setItem('edusphere_pending_school_registration', session); // backward compat
      setOtp('');
      setCooldown(45);
      setStep('otp');
      toast.success('Verification code sent! Check your email inbox.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to start school registration.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Verify OTP ──────────────────────────────────────────────────────── */
  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Enter the 6-digit OTP.'); return; }
    if (!verificationUserId) {
      toast.error('Registration session expired. Please register again.');
      setStep('details');
      return;
    }
    setOtpBusy(true);
    try {
      const response = await apiClient.post('/auth/verify-email', {
        userId: verificationUserId,
        otp: otp.trim(),
      });
      const { accessToken, refreshToken, user } = response.data;
      sessionStorage.removeItem('schoolos_pending_school_registration');
      sessionStorage.removeItem('edusphere_pending_school_registration');
      login(accessToken, user, refreshToken);
      toast.success('Email verified! Continue to payment and school approval.');
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP. Use the latest code or resend.');
    } finally {
      setOtpBusy(false);
    }
  };

  /* ── Resend OTP ──────────────────────────────────────────────────────── */
  const resendOtp = async () => {
    if (!verificationUserId || cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      const response = await apiClient.post('/auth/resend-otp', { userId: verificationUserId });
      const session = JSON.stringify({ verificationUserId, planKey: 'PROFESSIONAL', form });
      sessionStorage.setItem('schoolos_pending_school_registration', session);
      sessionStorage.setItem('edusphere_pending_school_registration', session);
      setCooldown(45);
      setOtp('');
      toast.success(response.data?.message || 'A new OTP has been sent.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to resend OTP.');
    } finally {
      setResendBusy(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="school-registration-page relative isolate min-h-screen w-full overflow-x-clip bg-white text-slate-900 dark:bg-[#080d14] dark:text-white">
{/* ── Wrapper ─────────────────────────────────────────────────────── */}
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="school-reg-header flex items-center justify-between border-b border-slate-200 pb-5 dark:border-white/10">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition group-hover:shadow-cyan-500/40">
              <Sparkles size={19} />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white">SchoolOS</span>
              <span className="block text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">School ERP</span>
            </span>
          </Link>
          <Link
            to="/school-login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300 dark:hover:bg-white/[.08]"
          >
            School Login
          </Link>
        </div>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="school-reg-layout grid flex-1 items-start gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:py-10">

          {/* ── Left hero panel ─────────────────────────────────────────── */}
          <section className="school-reg-intro flex flex-col justify-center">
            {/* Badge */}
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300">
              <ShieldCheck size={13} />
              Secure onboarding
            </div>

            {/* Headline */}
            <h1 className="max-w-md text-5xl font-black leading-[1.04] tracking-[-0.04em] text-slate-900 dark:text-white xl:text-6xl">
              Launch your<br />school on{' '}
              <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-teal-300 dark:to-indigo-300">
                SchoolOS.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-500 dark:text-slate-400">
              Create your school workspace, verify your email, then complete payment.
              Your data stays private until email verification is completed.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3.5">
              {[
                'Professional multi-school workspace',
                'Secure email verification with OTP',
                'Free public school website included',
                'Super Admin approval after payment',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Check size={14} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Plan badge */}
            <div className="mt-10 inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-md dark:border-white/10 dark:bg-white/[.04]">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 shadow shadow-cyan-400/30">
                <BadgeCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Plan</p>
                <p className="mt-0.5 font-black text-slate-900 dark:text-white">
                  Professional —{' '}
                  <span className="text-cyan-600 dark:text-cyan-300">PKR 3,000<span className="font-semibold text-slate-400">/mo</span></span>
                </p>
              </div>
            </div>
          </section>

          {/* ── Right: form card ─────────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-2xl">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-[#0f1824] dark:shadow-cyan-950/30">

              {/* Card header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-white/[.07] sm:px-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.2em] text-cyan-500 dark:text-cyan-400">
                    {step === 'details' ? 'Create workspace' : 'Email verification'}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                    {step === 'details' ? 'Register your school' : 'Verify your email'}
                  </h2>
                </div>
                {/* Step progress */}
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400">
                    STEP {step === 'details' ? '01' : '02'} / 02
                  </p>
                  <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-6 sm:px-8 sm:py-7">
                {step === 'details' ? (
                  <DetailsForm
                    form={form}
                    update={update}
                    slugStatus={slugStatus}
                    schoolPublicUrl={schoolPublicUrl}
                    selectedPlan={selectedPlan}
                    saving={saving}
                    logoBusy={logoBusy}
                    showPassword={showPassword}
                    passwordHint={passwordHint}
                    onLogoChange={handleLogo}
                    onTogglePassword={() => setShowPassword(v => !v)}
                    onSubmit={submitRegistration}
                  />
                ) : (
                  <OtpForm
                    email={form.adminEmail}
                    otp={otp}
                    otpBusy={otpBusy}
                    resendBusy={resendBusy}
                    cooldown={cooldown}
                    onOtpChange={setOtp}
                    onSubmit={verifyOtp}
                    onResend={resendOtp}
                    onBack={() => { setStep('details'); setOtp(''); }}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Details Form
═══════════════════════════════════════════════════════════════════════════ */
function DetailsForm({
  form, update, slugStatus, schoolPublicUrl, selectedPlan,
  saving, logoBusy, showPassword, passwordHint,
  onLogoChange, onTogglePassword, onSubmit,
}: {
  form: FormState;
  update: (k: keyof FormState, v: string) => void;
  slugStatus: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  schoolPublicUrl: string;
  selectedPlan?: { price: number; currency?: string; period: string };
  saving: boolean; logoBusy: boolean; showPassword: boolean; passwordHint: string;
  onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const slugify = (v: string) =>
    v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

  return (
    <form onSubmit={onSubmit} className="space-y-6">

      {/* Plan badge */}
      <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3.5 dark:border-cyan-400/15 dark:bg-cyan-400/[.06]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Selected Plan</p>
          <p className="mt-0.5 font-black text-slate-800 dark:text-white">Professional</p>
          <p className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">
            {selectedPlan ? `${selectedPlan.currency || 'PKR'} ${selectedPlan.price.toLocaleString()}` : 'PKR 3,000'}
            <span className="ml-1 text-sm font-semibold text-slate-400">/ month</span>
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300">
          <BadgeCheck size={22} />
        </div>
      </div>

      {/* School identity */}
      <Section label="School Identity">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field
            label="School name" icon={<Building2 size={15} />}
            value={form.schoolName}
            onChange={v => update('schoolName', v)}
            placeholder="e.g. Umair Model School"
          />
          {/* Logo upload */}
          <label className="group cursor-pointer">
            <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">Logo</span>
            <div className="flex h-[86px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition group-hover:border-cyan-400 dark:border-white/10 dark:bg-black/20 dark:group-hover:border-cyan-400/60">
              {form.logoUrl
                ? <img src={form.logoUrl} alt="School logo" className="h-full w-full object-cover" />
                : logoBusy
                  ? <Loader2 className="animate-spin text-cyan-500" size={22} />
                  : (
                    <div className="text-center text-slate-400 dark:text-slate-500">
                      <ImagePlus className="mx-auto mb-1" size={20} />
                      <span className="text-[10px] font-bold">PNG/JPG · 2MB</span>
                    </div>
                  )
              }
              <input type="file" accept="image/png,image/jpeg" onChange={onLogoChange} className="hidden" />
            </div>
          </label>
        </div>

        {/* Slug + type */}
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field
            label="School website address" icon={<Globe2 size={15} />}
            value={form.schoolSlug}
            onChange={v => update('schoolSlug', slugify(v))}
            placeholder="umair-model-school"
          />
          <SelectField
            label="Institution" value={form.schoolType}
            onChange={v => update('schoolType', v)}
            options={[['SCHOOL', 'School'], ['COLLEGE', 'College'], ['ACADEMY', 'Academy']]}
          />
        </div>

        {/* URL preview */}
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/[.07] dark:bg-black/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <Globe2 size={13} className="shrink-0 text-cyan-500 dark:text-cyan-400" />
              <span className="font-bold text-slate-600 dark:text-slate-300">Your free school website</span>
            </div>
            {slugStatus === 'checking' && <Loader2 size={13} className="animate-spin text-cyan-500" />}
            {slugStatus === 'available' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={12} /> Available
              </span>
            )}
            {slugStatus === 'taken' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500 dark:text-rose-400">
                <CircleAlert size={12} /> Already used
              </span>
            )}
            {slugStatus === 'invalid' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
                <CircleAlert size={12} /> Invalid format
              </span>
            )}
          </div>
          <p className="mt-1.5 break-all font-mono text-[11px] text-slate-500 dark:text-slate-300">{schoolPublicUrl}</p>
          <p className="mt-1 text-[10px] text-slate-400">
            This address opens your public school website. It is checked for uniqueness before registration.
          </p>
        </div>
      </Section>

      {/* Location */}
      <Section label="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Province / territory" value={form.province}
            onChange={v => update('province', v)}
            options={[
              'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
              'Azad Kashmir', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
            ].map(p => [p, p])}
          />
          <Field
            label="City" icon={<MapPin size={15} />}
            value={form.city}
            onChange={v => update('city', v)}
            placeholder="Sargodha"
          />
        </div>
        <div className="mt-4">
          <Field
            label="School address" icon={<MapPin size={15} />}
            value={form.address}
            onChange={v => update('address', v)}
            placeholder="Street, area, landmark"
          />
        </div>
      </Section>

      {/* Admin account */}
      <Section label="Administrator Account">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Administrator name" icon={<UserRound size={15} />}
            value={form.adminName}
            onChange={v => update('adminName', v)}
            placeholder="Principal / owner name"
          />
          <Field
            label="Email address" icon={<Mail size={15} />}
            type="email"
            value={form.adminEmail}
            onChange={v => update('adminEmail', v)}
            placeholder="you@example.com"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Mobile number" icon={<Phone size={15} />}
            value={form.adminPhone}
            onChange={v => update('adminPhone', v.replace(/\D/g, '').slice(0, 11))}
            placeholder="03XXXXXXXXX"
          />
          {/* Password field */}
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <LockKeyhole size={15} />Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                value={form.adminPassword}
                onChange={e => update('adminPassword', e.target.value)}
                placeholder="Create secure password"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-300 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400/50 dark:focus:ring-cyan-400/5"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">{passwordHint}</span>
          </label>
        </div>
      </Section>

      {/* Submit */}
      <button
        disabled={saving || logoBusy}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 font-black text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? <Loader2 className="animate-spin" size={18} />
          : <><span>Continue to email verification</span><ArrowRight size={18} /></>
        }
      </button>
      <p className="text-center text-[11px] leading-5 text-slate-400">
        By continuing you agree to SchoolOS onboarding terms.{' '}
        <strong className="text-slate-500 dark:text-slate-400">No school is created until OTP verification.</strong>
      </p>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OTP Form
═══════════════════════════════════════════════════════════════════════════ */
function OtpForm({
  email, otp, otpBusy, resendBusy, cooldown,
  onOtpChange, onSubmit, onResend, onBack,
}: {
  email: string; otp: string;
  otpBusy: boolean; resendBusy: boolean; cooldown: number;
  onOtpChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Email info card */}
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-6 text-center dark:border-cyan-400/15 dark:bg-gradient-to-br dark:from-cyan-400/[.07] dark:to-indigo-400/[.05]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300">
          <Mail size={25} />
        </div>
        <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Check your inbox</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>.
          The code expires in 15 minutes.
        </p>
      </div>

      {/* OTP input */}
      <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
          Verification code
        </label>
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={e => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="h-16 w-full rounded-2xl border border-slate-200 bg-white text-center text-3xl font-black tracking-[.45em] text-slate-900 outline-none placeholder:text-slate-200 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-700 dark:focus:border-cyan-400/50 dark:focus:ring-cyan-400/5"
        />
      </div>

      {/* Verify button */}
      <button
        disabled={otpBusy || otp.length !== 6}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 font-black text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {otpBusy
          ? <Loader2 className="animate-spin" size={18} />
          : <><span>Verify email &amp; continue</span><ArrowRight size={18} /></>
        }
      </button>

      {/* Actions row */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || resendBusy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:bg-white/[.07]"
        >
          {resendBusy ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
        >
          <ChevronLeft size={15} />
          Edit registration
        </button>
      </div>

      {/* Security note */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center text-xs leading-5 text-slate-500 dark:border-emerald-400/10 dark:bg-emerald-400/[.04] dark:text-slate-400">
        <ShieldCheck className="mx-auto mb-2 text-emerald-500 dark:text-emerald-300" size={18} />
        After verification, you will sign in and complete{' '}
        <strong className="text-slate-700 dark:text-slate-300">payment</strong>.
        Super Admin approval happens after payment verification.
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shared UI primitives
═══════════════════════════════════════════════════════════════════════════ */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label, icon, value, onChange, placeholder, type = 'text',
}: {
  label: string; icon: ReactNode; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        {icon}{label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-300 transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-400/50 dark:focus:ring-cyan-400/5"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string;
  onChange: (v: string) => void; options: string[][];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 dark:border-white/10 dark:bg-[#0b121b] dark:text-slate-200 dark:focus:border-cyan-400/50"
      >
        <option value="">Select</option>
        {options.map(([key, name]) => (
          <option key={key} value={key}>{name}</option>
        ))}
      </select>
    </label>
  );
}