import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, ShieldCheck, DollarSign, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Subscription() {
  const [activePlan, setActivePlan] = useState('Starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      price: billingCycle === 'monthly' ? 49 : 39,
      features: ['Up to 500 Students', '1 Campus / School', 'Core Academics', 'Email Support'],
      color: 'border-border',
    },
    {
      name: 'Professional',
      price: billingCycle === 'monthly' ? 149 : 119,
      features: ['Up to 5,000 Students', '10 Campuses / Schools', 'All Academics & HR modules', 'Priority Support', 'Custom Domain branding'],
      color: 'border-primary shadow-lg shadow-primary/5',
      badge: 'Most Popular',
      star: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited Students', 'Unlimited Campuses', 'Dedicated SLA Uptime', '24/7 Phone Support', 'API Access & Webhooks'],
      color: 'border-border',
    }
  ];

  const handleUpgrade = (planName: string) => {
    if (planName === activePlan) return;
    toast.success(`Successfully upgraded to ${planName} Plan (mock checkout success)`);
    setActivePlan(planName);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground">SaaS Subscription & Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Upgrade your tenant plan, check invoices, and update payment details</p>
      </div>

      {/* Active plan card */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-widest">
              Active Plan
            </span>
            <ShieldCheck size={18} />
          </div>
          <h2 className="text-3xl font-black">{activePlan} Plan</h2>
          <p className="text-white/70 text-sm">Next renewal date: Oct 12, 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-white/60" />
          <span className="font-bold text-sm">Billing Cycle: {billingCycle}</span>
        </div>
      </div>

      {/* Pricing comparison */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-extrabold text-foreground">Available Upgrade Packages</h3>
          {/* Toggle */}
          <div className="flex bg-card p-1 rounded-xl border border-border self-start">
            <button onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
              Monthly
            </button>
            <button onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-card border-2 ${p.color} rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden`}
            >
              {p.badge && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground uppercase">
                  {p.badge}
                </span>
              )}

              <div>
                <h4 className="font-extrabold text-lg text-foreground mb-1 flex items-center gap-1.5">
                  {p.star && <Star size={16} className="text-amber-500 fill-amber-500" />}
                  {p.name}
                </h4>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">
                    {typeof p.price === 'number' ? `$${p.price}` : p.price}
                  </span>
                  {typeof p.price === 'number' && (
                    <span className="text-xs text-muted-foreground">/ month</span>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground my-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(p.name)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                  p.name === activePlan 
                    ? 'bg-accent text-accent-foreground cursor-default' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow shadow-primary/10'
                }`}
              >
                {p.name === activePlan ? 'Current Active Plan' : 'Select Package'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-foreground">Recent Invoices</h3>
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-border bg-accent/40 text-muted-foreground uppercase">
                  <th className="px-5 py-3">Invoice ID</th>
                  <th className="px-5 py-3">Billing Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                <tr className="hover:bg-accent/10 transition-colors">
                  <td className="px-5 py-3 font-bold">INV-0192</td>
                  <td className="px-5 py-3">Jul 01, 2026</td>
                  <td className="px-5 py-3">$49.00</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500">Paid</span>
                  </td>
                  <td className="px-5 py-3 flex items-center gap-1"><CreditCard size={13} /> Stripe</td>
                </tr>
                <tr className="hover:bg-accent/10 transition-colors">
                  <td className="px-5 py-3 font-bold">INV-0143</td>
                  <td className="px-5 py-3">Jun 01, 2026</td>
                  <td className="px-5 py-3">$49.00</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500">Paid</span>
                  </td>
                  <td className="px-5 py-3 flex items-center gap-1"><CreditCard size={13} /> Stripe</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
