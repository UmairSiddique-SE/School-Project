import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, ShieldCheck, Calendar, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";

const MAX_PROOF_BYTES = 2 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 2_750_000;

async function preparePaymentProof(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");
  if (file.size <= 1_800_000) return await fileToDataUrl(file);
  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare the image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > MAX_DATA_URL_LENGTH && quality > 0.5) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  if (result.length > MAX_DATA_URL_LENGTH) throw new Error("This screenshot is too large. Please choose a smaller image.");
  return result;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the screenshot."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to process the screenshot."));
    image.src = source;
  });
}

export default function Subscription() {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState(user?.plan || "FREE_TRIAL");
  const [plans, setPlans] = useState<any[]>([]);
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setActivePlan(user?.plan || "FREE_TRIAL"), [user?.plan]);

  useEffect(() => {
    apiClient.get("/public/plans").then(({ data }) => {
      const active = Array.isArray(data) ? data.filter((plan: any) => plan.isActive) : [];
      setPlans(active);
    }).catch(() => toast.error("Unable to load subscription plans"));
  }, []);

  const fallbackPlans = [
    {
      planKey: "FREE_TRIAL",
      name: "Free Trial",
      price: 0,
      period: "1 day",
      features: ["Up to 100 Students", "Up to 15 Staff", "Core Modules", "Attendance", "Fees & Exams", "Results"],
      color: "border-border",
    },
    {
      planKey: "PROFESSIONAL",
      name: "Professional",
      price: 5000,
      period: "per month",
      features: ["Up to 800 Students", "Unlimited Staff", "All Modules", "Advanced Reports", "School Website", "Custom Branding"],
      color: "border-primary shadow-lg shadow-primary/5",
      badge: "Most Popular",
      star: true,
    },
    {
      planKey: "PREMIUM",
      name: "Premium",
      price: 10000,
      period: "per month",
      features: ["Unlimited Students", "Unlimited Staff", "All Modules", "Advanced Reports", "School Website", "Custom Branding", "Custom Domain"],
      color: "border-border",
      badge: "Best Value",
    },
  ];

  const visiblePlans = plans.length ? plans : fallbackPlans;

  const handleProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Screenshot must be 2 MB or smaller.");
      return;
    }
    setProofBusy(true);
    try {
      const prepared = await preparePaymentProof(file);
      setProof(prepared);
      setProofName(file.name);
      toast.success("Payment screenshot attached successfully.");
    } catch (error) {
      setProof("");
      setProofName("");
      toast.error(error instanceof Error ? error.message : "Unable to attach screenshot.");
    } finally {
      setProofBusy(false);
    }
  };

  const clearProof = () => { setProof(""); setProofName(""); };

  const handleUpgrade = async (plan: any) => {
    const planName = String(plan.planKey || plan.name || "").toUpperCase();
    const isFreeTrial = planName === "FREE_TRIAL";
    if (planName === activePlan && user?.activationStatus === "ACTIVE") return;
    if (user?.role !== "SCHOOL_ADMIN" || !user.schoolId) {
      toast.info(`Selected ${plan.name} plan.`);
      setActivePlan(planName);
      return;
    }
    if (!isFreeTrial && !proof) {
      toast.error("Please attach your payment screenshot before submitting a paid plan.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/auth/onboarding-payment", {
        schoolId: user.schoolId,
        plan: planName,
        method: isFreeTrial ? "Free Trial" : "Bank Transfer",
        reference: isFreeTrial ? undefined : `EDU-${Date.now().toString().slice(-8)}`,
        amount: Number(plan.price) || 0,
        screenshotUrl: isFreeTrial ? undefined : proof,
      });
      toast.success(isFreeTrial ? "Free trial request submitted successfully." : "Payment submitted. Super Admin approval will activate this plan.");
      setActivePlan(planName);
      if (!isFreeTrial) clearProof();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || "Unable to submit plan request.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground">Subscription & Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your school plan and submit payment proof securely for verification.</p>
      </div>

      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-widest">
              {user?.activationStatus === "PAYMENT_PENDING" ? "Pending Activation" : "Active Plan"}
            </span>
            <ShieldCheck size={18} />
          </div>
          <h2 className="text-3xl font-black">{activePlan} Plan</h2>
          <p className="text-white/70 text-sm">Your plan is controlled by Super Admin approval.</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-white/60" />
          <span className="font-bold text-sm">Plan billing period</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-foreground">Available Plans</h3>
          <p className="text-xs text-muted-foreground mt-1">Choose the package that matches your school size.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visiblePlans.map((plan, index) => {
            const planKey = String(plan.planKey || plan.name || "").toUpperCase();
            const isCurrent = planKey === activePlan;
            const price = Number(plan.price) || 0;
            return (
              <motion.div key={planKey || plan.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`bg-card border-2 ${plan.color || "border-border"} rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden`}>
                {plan.badge && <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground uppercase">{plan.badge}</span>}
                <div>
                  <h4 className="font-extrabold text-lg text-foreground mb-1 flex items-center gap-1.5">
                    {plan.star && <Star size={16} className="text-amber-500 fill-amber-500" />}{plan.name}
                  </h4>
                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">{price === 0 ? "Free" : `PKR ${price.toLocaleString()}`}</span>
                    <span className="text-xs text-muted-foreground">{plan.period || (price ? "per month" : "trial")}</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-muted-foreground my-6">
                    {(plan.features || []).map((feature: string) => <li key={feature} className="flex items-center gap-2"><CheckCircle2 size={13} className="text-primary shrink-0" /><span>{feature}</span></li>)}
                  </ul>
                </div>
                <button onClick={() => handleUpgrade(plan)} disabled={isCurrent || submitting || proofBusy} className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${isCurrent ? "bg-accent text-accent-foreground cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow shadow-primary/10 disabled:opacity-50"}`}>
                  {submitting && !isCurrent ? "Submitting..." : isCurrent ? "Current Active Plan" : "Select Plan"}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <label className="text-sm font-bold text-foreground flex items-center gap-2"><Upload size={16} /> Payment screenshot</label>
              <p className="text-xs text-muted-foreground mt-1">Required for Professional and Premium. PNG/JPG/WebP, maximum 2 MB.</p>
            </div>
            {proof && <button type="button" onClick={clearProof} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" aria-label="Remove payment screenshot"><X size={16} /></button>}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={proofBusy || submitting} onChange={handleProofChange} className="mt-4 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50" />
          {proofBusy && <p className="text-xs text-primary mt-2">Preparing screenshot...</p>}
          {proof && !proofBusy && <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0" /><div className="min-w-0"><p className="text-xs font-bold text-foreground truncate">{proofName}</p><p className="text-[11px] text-emerald-600">Payment proof attached and ready to submit.</p></div></div>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-foreground">Recent Invoices</h3>
        <div className="bg-card border border-border rounded-3xl p-8 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-bold text-foreground">No invoices available yet</p>
          <p className="text-xs text-muted-foreground mt-1">Approved payments will appear here when billing records are available.</p>
        </div>
      </div>
    </div>
  );
}
