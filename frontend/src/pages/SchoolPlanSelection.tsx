import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Crown, Loader2, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/apiClient";

type PublicPlan = {
  id: string;
  planKey: string;
  name: string;
  price: number;
  period: string;
  maxStudents: number;
  maxTeachers: number;
  storageMb: number;
  supportTier: string;
  features: string[];
};

const styles: Record<string, { icon: typeof Zap; gradient: string; border: string; badge?: string }> = {
  FREE_TRIAL: { icon: Zap, gradient: "from-sky-500 to-cyan-600", border: "border-sky-400/30" },
  PROFESSIONAL: { icon: Star, gradient: "from-indigo-500 via-blue-600 to-violet-600", border: "border-indigo-400/50", badge: "MOST POPULAR" },
  PREMIUM: { icon: Crown, gradient: "from-emerald-500 via-teal-500 to-cyan-600", border: "border-emerald-400/50", badge: "BEST VALUE" },
};

const limit = (value: number, label: string) => value >= 999999 ? `Unlimited ${label}` : `Up to ${value.toLocaleString()} ${label}`;

export default function SchoolPlanSelection() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<PublicPlan[]>("/public/plans")
      .then((response) => setPlans(response.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const choosePlan = (plan: PublicPlan) => {
    sessionStorage.setItem("edusphere_registration_plan", plan.planKey);
    navigate(`/register-school/form?plan=${encodeURIComponent(plan.planKey)}`);
  };

  return (
    <main className="min-h-screen bg-[#06111d] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate("/")} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to EduSphere
        </button>

        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">School registration</span>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Choose your plan</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">Select a plan first. Your school registration will continue with this plan attached to the application.</p>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="animate-spin text-cyan-300" size={32} /></div>
        ) : plans.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
            <h2 className="text-xl font-black">Plans are temporarily unavailable</h2>
            <p className="mt-2 text-sm text-slate-400">Please try again in a moment. Registration plans are loaded from the live platform configuration.</p>
            <button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black">Retry</button>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const style = styles[plan.planKey] || styles.PROFESSIONAL;
              const Icon = style.icon;
              return (
                <article key={plan.planKey} className={`relative overflow-hidden rounded-[28px] border ${style.border} bg-white/[.035] p-6 shadow-2xl backdrop-blur-xl`}>
                  {style.badge && <span className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-1 text-[9px] font-black tracking-widest text-cyan-200">{style.badge}</span>}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.gradient}`}><Icon size={22} /></div>
                  <h2 className="mt-6 text-2xl font-black">{plan.name}</h2>
                  <div className="mt-3 flex items-end gap-1"><span className="text-4xl font-black">PKR {plan.price.toLocaleString()}</span><span className="pb-1 text-xs text-slate-500">{plan.period}</span></div>
                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
                    <p>✓ {limit(plan.maxStudents, "students")}</p>
                    <p>✓ {limit(plan.maxTeachers, "staff")}</p>
                    <p>✓ {plan.storageMb >= 512000 ? "Large storage" : `${Math.round(plan.storageMb / 1024)} GB storage`}</p>
                    {plan.features.slice(0, 5).map((feature) => <p key={feature} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-300" />{feature}</p>)}
                  </div>
                  <button onClick={() => choosePlan(plan)} className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${style.gradient} px-5 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110`}>
                    Continue with {plan.name} <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
