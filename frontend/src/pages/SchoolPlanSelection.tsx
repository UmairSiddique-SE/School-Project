import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, School } from "lucide-react";
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

export default function SchoolPlanSelection() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<PublicPlan[]>("/public/plans")
      .then(({ data }) => {
        const monthlyPlan = Array.isArray(data)
          ? data.find((item) => item.planKey === "PROFESSIONAL" && item.price === 3000)
          : undefined;
        setPlan(monthlyPlan ?? null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  const continueRegistration = () => {
    if (!plan) return;
    sessionStorage.setItem("edusphere_registration_plan", plan.planKey);
    navigate(`/register-school/form?plan=${encodeURIComponent(plan.planKey)}`);
  };

  return (
    <main className="min-h-screen bg-[#F7F9FE] px-4 py-8 text-[#14213D] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-[#3563EB]">
          <ArrowLeft size={16} /> Back to SchoolOS
        </button>

        <header className="mx-auto mt-10 max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#3563EB]"><School size={27} /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-[#3563EB]">School registration</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">One plan. Clear pricing.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">Choose the SchoolOS monthly subscription and submit your school application for review.</p>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="animate-spin text-[#3563EB]" size={32} /></div>
        ) : !plan ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black">Registration is temporarily unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">The monthly plan could not be loaded. Please try again later or contact the platform administrator.</p>
            <button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-[#3563EB] px-5 py-3 text-sm font-bold text-white">Try again</button>
          </div>
        ) : (
          <section className="mx-auto mt-12 max-w-xl overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-xl shadow-blue-900/5">
            <div className="bg-gradient-to-r from-[#3563EB] to-[#6653D9] px-7 py-7 text-white sm:px-9">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest">SchoolOS subscription</span>
              <h2 className="mt-5 text-2xl font-black">{plan.name}</h2>
              <p className="mt-1 text-sm text-blue-100">Everything your school needs to get started.</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black sm:text-5xl">PKR {plan.price.toLocaleString()}</span>
                <span className="pb-1 text-sm font-semibold text-blue-100">/ month</span>
              </div>
            </div>
            <div className="p-7 sm:p-9">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Included in this plan</h3>
              <div className="mt-5 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button onClick={continueRegistration} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3563EB] to-[#6653D9] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl">
                Continue to School Registration <ArrowRight size={17} />
              </button>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">Your application is reviewed by the Super Admin. School access starts after approval.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
