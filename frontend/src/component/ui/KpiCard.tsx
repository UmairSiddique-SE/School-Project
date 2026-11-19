import React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
}

const TONES = {
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
} as const;

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone = 'cyan' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      {icon && <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', TONES[tone])}>{icon}</span>}
    </div>
    <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);
export default KpiCard;
