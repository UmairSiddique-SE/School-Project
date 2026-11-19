import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  gradient: string;
  glowColor?: string;
  delay?: number;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon, label, value, trend, trendDir = 'up', gradient, glowColor,
  delay = 0, subtitle, onClick,
}) => {
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendColor = trendDir === 'up' ? 'text-emerald-600' : trendDir === 'down' ? 'text-rose-600' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 200 }}
      onClick={onClick}
      className={`relative min-h-[142px] sm:min-h-[158px] overflow-hidden rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border/40 p-3.5 min-[420px]:p-4 sm:p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 shadow-sm ${onClick ? 'hover:shadow-xl' : ''}`}
      style={glowColor ? ({ '--glow': glowColor } as React.CSSProperties) : undefined}
    >
      <div className={`dashboard-kpi-glow absolute -top-14 -right-12 h-36 w-36 rounded-full blur-3xl opacity-15 group-hover:opacity-35 group-hover:scale-125 transition-all duration-500 ${gradient}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex h-full items-start justify-between gap-2.5 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <div className="min-w-0">
            <div className="mb-2 flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="dashboard-kpi-label min-w-0 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.09em] sm:tracking-[0.12em] leading-snug text-slate-500 line-clamp-2">{label}</span>
              {onClick && <ArrowUpRight size={12} className="dashboard-kpi-arrow shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 }}
              className="dashboard-kpi-value break-words text-[clamp(1.35rem,2.2vw,2rem)] font-black leading-tight tracking-[-0.045em] text-slate-900 dark:text-foreground tabular-nums"
            >{value}</motion.p>
            {subtitle && <p className="dashboard-kpi-subtitle mt-1.5 text-[11px] sm:text-xs leading-snug text-slate-500 dark:text-muted-foreground line-clamp-2">{subtitle}</p>}
          </div>
          {trend && (
            <div className={`dashboard-kpi-trend mt-2.5 inline-flex max-w-full w-fit items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 ${trendColor}`}>
              <TrendIcon size={11} className="shrink-0" />
              <span className="min-w-0 text-[10px] sm:text-[11px] font-bold leading-tight line-clamp-2">{trend}</span>
            </div>
          )}
        </div>
        <div className={`dashboard-kpi-icon relative h-9 w-9 min-[420px]:h-10 min-[420px]:w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white group-hover:scale-105 transition-transform duration-300`}>
          <Icon size={19} className="text-white sm:hidden" strokeWidth={2.2} />
          <Icon size={21} className="hidden text-white sm:block" strokeWidth={2.2} />
          <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
