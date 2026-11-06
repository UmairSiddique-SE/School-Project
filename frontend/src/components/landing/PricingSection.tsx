import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Crown, Zap, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import apiClient from "@/api/apiClient";

export type PublicPlan = {
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
  PROFESSIONAL: { icon: Star, gradient: "from-[#5577F5] via-[#49D6E8] to-[#8B7CF6]", border: "border-[#49D6E8]/40", badge: "POPULAR TIER" },
  PREMIUM: { icon: Crown, gradient: "from-emerald-500 to-teal-600", border: "border-emerald-400/40", badge: "MAX SCALE" },
};

const limit = (value: number, label: string) =>
  value >= 999999 ? `Unlimited ${label}` : `Up to ${value.toLocaleString()} ${label}`;

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    setError(false);
    apiClient
      .get<PublicPlan[]>("/public/plans")
      .then((res) => {
        setPlans(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const choosePlan = (planKey: string) => {
    sessionStorage.setItem("edusphere_registration_plan", planKey);
    navigate(`/register-school/form?plan=${encodeURIComponent(planKey)}`);
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Subscription Plans
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            A plan that grows with your institution.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8]">
            Choose the subscription tier configured for your school. Live rates fetched directly from our platform database.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] gap-3 text-[#94A3B8]">
            <Loader2 className="animate-spin text-[#49D6E8]" size={32} />
            <p className="text-xs font-semibold">Loading current platform plans...</p>
          </div>
        ) : error || plans.length === 0 ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
            <p className="text-sm font-bold text-white">Plans are temporarily unavailable</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Unable to reach the live plan configuration. Please retry.
            </p>
            <button
              onClick={fetchPlans}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, idx) => {
              const style = styles[plan.planKey] || styles.PROFESSIONAL;
              const Icon = style.icon;
              const isHighlight = plan.planKey === "PROFESSIONAL";

              return (
                <motion.div
                  key={plan.id || plan.planKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative flex flex-col justify-between rounded-[32px] border ${
                    isHighlight
                      ? "border-[#49D6E8]/40 bg-[#0B1728] shadow-2xl ring-1 ring-[#49D6E8]/30"
                      : "border-white/10 bg-[#07111F]/90 shadow-xl"
                  } p-8`}
                >
                  {style.badge && (
                    <span className="absolute right-6 top-6 rounded-full bg-[#49D6E8]/10 border border-[#49D6E8]/30 px-3 py-1 text-[9px] font-black tracking-widest text-[#49D6E8]">
                      {style.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white mb-6">
                      <Icon size={22} className="text-[#49D6E8]" />
                    </div>

                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>

                    <div className="mt-4 flex items-baseline gap-1">
                      {plan.price === 0 ? (
                        <span className="text-4xl font-black text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-[#94A3B8]">PKR</span>
                          <span className="text-4xl font-black text-white tracking-tight">
                            {plan.price.toLocaleString()}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-[#94A3B8] font-medium ml-1">
                        /{plan.period.replace(/^per /, "")}
                      </span>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
                      <p className="font-semibold text-white">
                        ✓ {limit(plan.maxStudents, "Students")}
                      </p>
                      <p className="font-semibold text-white">
                        ✓ {limit(plan.maxTeachers, "Staff Accounts")}
                      </p>
                      <p className="text-[#94A3B8]">
                        ✓ {plan.storageMb >= 512000 ? "High capacity storage" : `${Math.round(plan.storageMb / 1024)} GB file storage`}
                      </p>

                      <div className="pt-3 space-y-2">
                        {(plan.features || []).map((feat, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check size={14} className="text-[#49D6E8] shrink-0 mt-0.5" />
                            <span className="text-[#94A3B8] leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => choosePlan(plan.planKey)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        isHighlight
                          ? "bg-gradient-to-r from-[#5577F5] to-[#49D6E8] text-white shadow-lg shadow-[#5577F5]/25 hover:brightness-110"
                          : "border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

