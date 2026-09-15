import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowRight, BadgeCheck, Building2, Check, ChevronLeft, Eye, EyeOff, Globe2, ImagePlus, Loader2, LockKeyhole, Mail, MapPin, Phone, RefreshCw, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

type FormState = {
  schoolName: string;
  schoolSlug: string;
  schoolType: 'SCHOOL' | 'COLLEGE' | 'ACADEMY';
  logoUrl: string;
  province: string;
  city: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
};

type Plan = { planKey: string; name: string; price: number; currency?: string; period: string; maxStudents?: number };

const initial: FormState = {
  schoolName: '', schoolSlug: '', schoolType: 'SCHOOL', logoUrl: '', province: '', city: '', address: '',
  adminName: '', adminEmail: '', adminPhone: '', adminPassword: '',
};

const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Azad Kashmir', 'Gilgit-Baltistan', 'Islamabad Capital Territory'];
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
const phone = (value: string) => value.replace(/\D/g, '').slice(0, 11);
const planLabel = (key: string) => key === 'FREE_TRIAL' ? 'Free Trial' : key === 'PROFESSIONAL' ? 'Professional' : key === 'PREMIUM' ? 'Premium' : key;

async function compressImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Logo must be PNG or JPG.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Logo must be 2MB or smaller.');
  const src = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error('Unable to read logo.')); r.readAsDataURL(file); });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Unable to process logo.')); img.src = src; });
  const scale = Math.min(1, 900 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

export default function RegisterSchoolPremium() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
  const [planKey, setPlanKey] = useState('FREE_TRIAL');

  const update = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const selectedPlan = plans.find((p) => p.planKey === planKey);
  const slugPreview = form.schoolSlug || 'your-school';
  const progress = step === 'details' ? 50 : 100;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedPlan = sessionStorage.getItem('edusphere_registration_plan') || params.get('plan') || 'FREE_TRIAL';
    setPlanKey(savedPlan);
    const saved = sessionStorage.getItem('edusphere_pending_school_registration');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.verificationUserId) {
          setVerificationUserId(data.verificationUserId);
          setForm((p) => ({ ...p, ...(data.form || {}) }));
          setPlanKey(data.planKey || savedPlan);
          setStep('otp');
        }
      } catch { sessionStorage.removeItem('edusphere_pending_school_registration'); }
    }
    apiClient.get<Plan[]>('/public/plans').then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      setPlans(list);
      const serverPlan = list.find((p) => p.planKey === savedPlan);
      if (!serverPlan && list[0]) setPlanKey(list[0].planKey);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (form.schoolName && !verificationUserId) update('schoolSlug', slugify(form.schoolName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolName]);

  const passwordHint = useMemo(() => {
    if (!form.adminPassword) return 'Minimum 8 characters';
    if (form.adminPassword.length >= 12) return 'Strong password';
    if (form.adminPassword.length >= 8) return 'Good password';
    return `${8 - form.adminPassword.length} more characters required`;
  }, [form.adminPassword]);

  const handleLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoBusy(true);
    try { update('logoUrl', await compressImage(file)); toast.success('School logo added.'); }
    catch (e: any) { toast.error(e?.message || 'Unable to add logo.'); }
    finally { setLogoBusy(false); }
  };

  const validate = () => {
    if (!form.schoolName.trim()) return 'Enter your school name.';
    if (!form.schoolSlug.trim() || form.schoolSlug.length < 3) return 'Choose a valid school URL.';
    if (!/^[a-z0-9-]+$/.test(form.schoolSlug)) return 'School URL can use only lowercase letters, numbers and hyphens.';
    if (!form.logoUrl) return 'School logo is required.';
    if (!form.province || !form.city.trim()) return 'Select province and enter city.';
    if (!form.address.trim()) return 'Enter school address.';
    if (!form.adminName.trim()) return 'Enter administrator name.';
    if (!/^\S+@\S+\.\S+$/.test(form.adminEmail.trim())) return 'Enter a valid email address.';
    if (phone(form.adminPhone).length < 10) return 'Enter a valid mobile number.';
    if (form.adminPassword.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const submitRegistration = async (event: FormEvent) => {
    event.preventDefault();
    const error = validate();
    if (error) { toast.error(error); return; }
    setSaving(true);
    try {
      const response = await apiClient.post('/auth/register-school', {
        schoolName: form.schoolName.trim(), schoolSlug: form.schoolSlug.trim().toLowerCase(), schoolType: form.schoolType,
        logoUrl: form.logoUrl, schoolAddress: form.address.trim(), schoolPhone: phone(form.adminPhone),
        country: 'Pakistan', city: form.city.trim(), adminName: form.adminName.trim(), adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPhone: phone(form.adminPhone), adminPassword: form.adminPassword, requestedPlan: planKey,
      });
      const data = response.data;
      setVerificationUserId(data.verificationUserId);
      setForm((p) => ({ ...p, schoolSlug: data.schoolSlug || p.schoolSlug }));
      sessionStorage.setItem('edusphere_pending_school_registration', JSON.stringify({ verificationUserId: data.verificationUserId, planKey, form: { ...form, schoolSlug: data.schoolSlug || form.schoolSlug } }));
      setOtp(''); setCooldown(45); setStep('otp');
      toast.success('Verification code sent. Your school is not created until OTP verification.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to start school registration.');
    } finally { setSaving(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Enter the 6-digit OTP.'); return; }
    if (!verificationUserId) { toast.error('Registration session expired. Please register again.'); setStep('details'); return; }
    setOtpBusy(true);
    try {
      const response = await apiClient.post('/auth/verify-email', { userId: verificationUserId, otp: otp.trim() });
      const { accessToken, refreshToken, user } = response.data;
      sessionStorage.removeItem('edusphere_pending_school_registration');
      login(accessToken, user, refreshToken);
      toast.success('Email verified. Continue to payment and school approval.');
      navigate('/onboarding', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid or expired OTP. Use the latest code or resend.');
    } finally { setOtpBusy(false); }
  };

  const resendOtp = async () => {
    if (!verificationUserId || cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      const response = await apiClient.post('/auth/resend-otp', { userId: verificationUserId });
      sessionStorage.setItem('edusphere_pending_school_registration', JSON.stringify({ verificationUserId, planKey, form }));
      setCooldown(45); setOtp(''); toast.success(response.data?.message || 'A new OTP has been sent.');
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to resend OTP.'); }
    finally { setResendBusy(false); }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#060b12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.14),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(99,102,241,.16),transparent_28%),radial-gradient(circle_at_55%_100%,rgba(20,184,166,.10),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 shadow-[0_10px_40px_rgba(34,211,238,.25)]"><Sparkles size={21} /></span>
            <span><span className="block text-lg font-black tracking-tight">EduSphere</span><span className="block text-[10px] font-bold uppercase tracking-[.25em] text-slate-500">School ERP</span></span>
          </Link>
          <Link to="/school-login" className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[.07]">School Login</Link>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[.72fr_1.28fr] lg:py-12">
          <section className="hidden lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300"><ShieldCheck size={14} /> Secure onboarding</div>
            <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-[-.04em] xl:text-6xl">Launch your school on <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-300 bg-clip-text text-transparent">EduSphere.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Create your school workspace, verify your email, then complete payment. Your school data stays private until email verification is completed.</p>
            <div className="mt-8 space-y-4">
              {['Professional multi-school workspace', 'Secure email verification with resend', 'Unique school URL for every school', 'Admin approval after payment verification'].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check size={15} /></span>{item}</div>)}
            </div>
          </section>

          <section className="mx-auto w-full max-w-2xl rounded-[30px] border border-white/10 bg-white/[.055] p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl sm:p-6 lg:p-8">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div><div className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">{step === 'details' ? 'Create workspace' : 'Email verification'}</div><h2 className="mt-2 text-2xl font-black tracking-tight">{step === 'details' ? 'Register your school' : 'Verify your email'}</h2></div>
              <div className="text-right"><div className="text-[11px] font-bold text-slate-500">STEP {step === 'details' ? '01' : '02'} / 02</div><div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all" style={{ width: `${progress}%` }} /></div></div>
            </div>

            {step === 'details' ? (
              <form onSubmit={submitRegistration} className="space-y-6">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[.045] p-4">
                  <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-300">Selected plan</p><p className="mt-1 font-bold">{planLabel(planKey)}</p></div><BadgeCheck className="text-cyan-300" size={22} /></div>
                  <div className="flex items-end justify-between"><div className="text-2xl font-black">{selectedPlan ? `${selectedPlan.currency || 'PKR'} ${selectedPlan.price.toLocaleString()}` : '—'}</div><span className="text-xs text-slate-500">{selectedPlan?.period || 'subscription'}</span></div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-slate-500">School identity</p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <Field label="School name" icon={<Building2 size={16} />} value={form.schoolName} onChange={(v) => update('schoolName', v)} placeholder="e.g. Umair Model School" />
                    <label className="group cursor-pointer"><span className="mb-2 block text-xs font-bold text-slate-400">Logo</span><div className="flex h-[86px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/20 transition group-hover:border-cyan-400/40">{form.logoUrl ? <img src={form.logoUrl} alt="School logo" className="h-full w-full object-cover" /> : logoBusy ? <Loader2 className="animate-spin text-cyan-300" /> : <div className="text-center text-slate-500"><ImagePlus className="mx-auto mb-1" size={20} /><span className="text-[10px] font-bold">PNG/JPG · 2MB</span></div>}<input type="file" accept="image/png,image/jpeg" onChange={handleLogo} className="hidden" /></div></label>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                    <Field label="School URL" icon={<Globe2 size={16} />} value={form.schoolSlug} onChange={(v) => update('schoolSlug', slugify(v))} placeholder="umair-model-school" />
                    <Select label="Institution" value={form.schoolType} onChange={(v) => update('schoolType', v)} options={[['SCHOOL','School'],['COLLEGE','College'],['ACADEMY','Academy']]} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500"><Globe2 size={12} /> https://{slugPreview}.edusphere.app <span className="text-emerald-300">• unique URL</span></div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-slate-500">Location</p>
                  <div className="grid gap-4 sm:grid-cols-2"><Select label="Province / territory" value={form.province} onChange={(v) => update('province', v)} options={provinces.map((p) => [p,p])} /><Field label="City" icon={<MapPin size={16} />} value={form.city} onChange={(v) => update('city', v)} placeholder="Sargodha" /></div>
                  <div className="mt-4"><Field label="School address" icon={<MapPin size={16} />} value={form.address} onChange={(v) => update('address', v)} placeholder="Street, area, landmark" /></div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-slate-500">Administrator account</p>
                  <div className="grid gap-4 sm:grid-cols-2"><Field label="Administrator name" icon={<UserRound size={16} />} value={form.adminName} onChange={(v) => update('adminName', v)} placeholder="Principal / owner name" /><Field label="Email address" icon={<Mail size={16} />} type="email" value={form.adminEmail} onChange={(v) => update('adminEmail', v)} placeholder="you@example.com" /></div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Mobile number" icon={<Phone size={16} />} value={form.adminPhone} onChange={(v) => update('adminPhone', phone(v))} placeholder="03XXXXXXXXX" /><label><span className="mb-2 block text-xs font-bold text-slate-400">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input type={showPassword ? 'text' : 'password'} minLength={8} value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)} placeholder="Create secure password" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/5" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><span className="mt-1 block text-[11px] text-slate-500">{passwordHint}</span></label></div>
                </div>

                <button disabled={saving || logoBusy} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3.5 font-black text-slate-950 shadow-xl shadow-cyan-500/15 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={18} /> : <>Continue to email verification <ArrowRight size={18} /></>}</button>
                <p className="text-center text-[11px] leading-5 text-slate-500">By continuing, you agree to EduSphere's onboarding terms. <b className="text-slate-400">No school/user is finalized until OTP verification.</b></p>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-6">
                <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[.08] to-indigo-400/[.06] p-6 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><Mail size={27} /></div><h3 className="mt-5 text-xl font-black">Check your inbox</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">We sent a 6-digit verification code to <span className="font-bold text-slate-200">{form.adminEmail}</span>. The code expires in 15 minutes.</p></div>
                <div><label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Verification code</label><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="000000" className="h-16 w-full rounded-2xl border border-white/10 bg-black/20 text-center text-3xl font-black tracking-[.45em] outline-none transition placeholder:text-slate-700 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/5" /></div>
                <button disabled={otpBusy || otp.length !== 6} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3.5 font-black text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50">{otpBusy ? <Loader2 className="animate-spin" size={18} /> : <>Verify email & continue <ArrowRight size={18} /></>}</button>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row"><button type="button" onClick={resendOtp} disabled={cooldown > 0 || resendBusy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-sm font-bold text-slate-300 disabled:opacity-40">{resendBusy ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</button><button type="button" onClick={() => { setStep('details'); setOtp(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-200"><ChevronLeft size={15} /> Edit registration</button></div>
                <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.04] p-4 text-center text-xs leading-5 text-slate-400"><ShieldCheck className="mx-auto mb-2 text-emerald-300" size={18} />After verification, you'll sign in and complete <b className="text-slate-300">payment</b>. Super Admin approval happens after payment verification.</div>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Field({ label, icon, value, onChange, placeholder, type = 'text' }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-400">{icon}{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/5" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#0b121b] px-3 text-sm text-slate-200 outline-none transition focus:border-cyan-400/50"> <option value="">Select</option>{options.map(([key,name]) => <option key={key} value={key}>{name}</option>)}</select></label>;
}
