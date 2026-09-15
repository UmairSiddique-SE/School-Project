import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { CheckCircle2, Clock3, CreditCard, FileImage, Loader2, LogOut, RefreshCw, ShieldCheck, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";

type Status = "PAYMENT_REQUIRED" | "APPROVAL_PENDING" | "ACTIVE";
type OnboardingData = {
  onboardingStatus: Status;
  school: { id: string; name: string; slug: string; isActive: boolean; subscription?: { plan?: string; status?: string; endDate?: string; amount?: number; currency?: string } | null };
  request?: { status?: string; reviewNotes?: string | null } | null;
  payment?: { id: string; plan: string; amount: number; method: string; reference?: string | null; screenshotUrl?: string | null; status: string; submittedAt: string; reviewedAt?: string | null } | null;
  plan?: { planKey: string; name: string; price: number; currency: string; period: string; isActive: boolean } | null;
};

const MAX_PROOF_BYTES = 1_800_000;
const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error("Unable to read the selected image."));
  reader.readAsDataURL(file);
});

export default function Onboarding() {
  const { user, login, logout, token, refreshToken } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("JazzCash");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<OnboardingData>("/auth/onboarding/status");
      setData(response.data);
      if (response.data.onboardingStatus === "ACTIVE" && user && token) {
        login(token, { ...user, activationStatus: "ACTIVE", plan: response.data.plan?.planKey || user.plan }, refreshToken || undefined);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load onboarding status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleProof = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid payment screenshot image.");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Payment screenshot must be 1.8 MB or smaller.");
      return;
    }
    try {
      setProof(await fileToDataUrl(file));
      setProofName(file.name);
    } catch (error: any) {
      toast.error(error?.message || "Unable to attach screenshot.");
    }
  };

  const submitPayment = async () => {
    if (!data?.school.id || !data.plan || Number(data.plan.price) <= 0) return;
    if (!reference.trim()) {
      toast.error("Enter the payment reference/transaction ID.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/auth/onboarding-payment", {
        schoolId: data.school.id,
        plan: data.plan.planKey,
        amount: data.plan.price,
        method,
        reference: reference.trim(),
        screenshotUrl: proof || undefined,
      });
      toast.success("Payment proof submitted. Your school is now pending Super Admin approval.");
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to submit payment proof.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin" /></div>;
  }

  if (!data) return null;

  const paymentPending = data.payment?.status === "PENDING";
  const paymentRejected = data.payment?.status === "REJECTED";
  const isFreeTrial = Number(data.plan?.price || 0) === 0;
  const active = data.onboardingStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">EduSphere onboarding</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">{data.school.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{data.school.slug}.edusphere.com</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"><LogOut size={16} /> Sign out</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[
            ["1", "Register", true],
            ["2", isFreeTrial ? "Approval" : "Payment", isFreeTrial || !!data.payment],
            ["3", "Dashboard", active],
          ].map(([number, label, done]) => (
            <div key={String(number)} className={`rounded-2xl border p-4 ${done ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/5"}`}>
              <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-black">{done ? <CheckCircle2 size={18} /> : number}</span><span className="font-semibold">{label}</span></div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {active && (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto text-emerald-400" size={56} />
              <h2 className="mt-5 text-2xl font-black">School approved</h2>
              <p className="mt-2 text-slate-300">Your subscription is active. Your school dashboard is unlocked.</p>
              <button onClick={() => window.location.assign(`/${data.school.slug}/dashboard`)} className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950">Open Dashboard</button>
            </div>
          )}

          {!active && isFreeTrial && (
            <div className="text-center py-8">
              <Clock3 className="mx-auto text-amber-300" size={56} />
              <h2 className="mt-5 text-2xl font-black">Waiting for Super Admin approval</h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-300">Your Free Trial does not require payment. Once Super Admin approves the school, your 3-day trial starts and the dashboard unlocks.</p>
              <button onClick={() => void load()} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-bold"><RefreshCw size={17} /> Check status</button>
            </div>
          )}

          {!active && !isFreeTrial && paymentPending && (
            <div className="text-center py-8">
              <Clock3 className="mx-auto text-amber-300" size={56} />
              <h2 className="mt-5 text-2xl font-black">Payment under review</h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-300">Your payment proof has been submitted. You can still sign in, but the school modules remain locked until Super Admin approval.</p>
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-black/20 p-5 text-left text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Plan</span><strong>{data.plan?.name}</strong></div>
                <div className="mt-2 flex justify-between"><span className="text-slate-400">Amount</span><strong>{data.plan?.currency} {data.plan?.price}</strong></div>
                <div className="mt-2 flex justify-between"><span className="text-slate-400">Method</span><strong>{data.payment?.method}</strong></div>
                <div className="mt-2 flex justify-between"><span className="text-slate-400">Reference</span><strong>{data.payment?.reference || "—"}</strong></div>
              </div>
              <button onClick={() => void load()} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-bold"><RefreshCw size={17} /> Check approval</button>
            </div>
          )}

          {!active && !isFreeTrial && !paymentPending && (
            <>
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><CreditCard /></div>
                <div><h2 className="text-2xl font-black">Complete payment</h2><p className="mt-1 text-sm text-slate-400">Submit your payment proof. Super Admin approval will unlock your school portal.</p></div>
              </div>

              <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex justify-between gap-4"><span className="text-slate-400">Selected plan</span><strong>{data.plan?.name}</strong></div>
                <div className="mt-2 flex justify-between gap-4"><span className="text-slate-400">Price</span><strong>{data.plan?.currency} {data.plan?.price} / month</strong></div>
                {paymentRejected && <p className="mt-3 flex items-center gap-2 text-sm text-red-300"><XCircle size={16} /> Previous payment was rejected. You can submit a new proof.</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold">Payment method<select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"><option>JazzCash</option><option>Easypaisa</option><option>Bank Transfer</option></select></label>
                <label className="text-sm font-semibold">Reference / transaction ID<input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN123456" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500" /></label>
              </div>

              <label className="mt-5 block rounded-2xl border border-dashed border-white/15 bg-black/10 p-5 text-center cursor-pointer hover:bg-white/5">
                <Upload className="mx-auto text-cyan-300" />
                <span className="mt-2 block font-semibold">Upload payment screenshot</span>
                <span className="mt-1 block text-xs text-slate-500">PNG/JPG, up to 1.8 MB</span>
                <input type="file" accept="image/png,image/jpeg" onChange={handleProof} className="hidden" />
                {proofName && <span className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-300"><FileImage size={15} /> {proofName}</span>}
              </label>

              <button disabled={submitting} onClick={() => void submitPayment()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-black text-slate-950 disabled:opacity-60"><ShieldCheck size={18} /> {submitting ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : "Submit payment proof"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
