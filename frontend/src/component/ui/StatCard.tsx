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
  icon: Icon,
  label,
  value,
  trend,
  trendDir = 'up',
  gradient,
  glowColor,
  delay = 0,
  subtitle,
  onClick,
}) => {
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendColor =
    trendDir === 'up' ? 'text-emerald-400' : trendDir === 'down' ? 'text-rose-400' : 'text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 200 }}
      onClick={onClick}
      className={`stat-card relative min-h-[150px] overflow-hidden rounded-2xl p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1.5 ${onClick ? 'hover:shadow-2xl' : ''}`}
      style={glowColor ? ({ '--glow': glowColor } as React.CSSProperties) : undefined}
    >
      <div className={`absolute -top-14 -right-12 h-36 w-36 rounded-full blur-3xl opacity-15 group-hover:opacity-35 group-hover:scale-125 transition-all duration-500 ${gradient}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex items-start justify-between gap-4 h-full">
        <div className="flex min-w-0 flex-1 flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400/90 truncate">
                {label}
              </span>
              {onClick && <ArrowUpRight size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 }}
              className="text-[30px] sm:text-[32px] font-black text-white leading-none tracking-[-0.04em]"
            >
              {value}
            </motion.p>
            {subtitle && <p className="text-[11px] text-slate-500 mt-2 truncate">{subtitle}</p>}
          </div>

          {trend && (
            <div className={`inline-flex w-fit items-center gap-1.5 mt-3 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1 ${trendColor}`}>
              <TrendIcon size={11} />
              <span className="text-[10px] font-bold truncate">{trend}</span>
            </div>
          )}
        </div>

        <div className={`relative h-12 w-12 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300`}>
          <Icon size={21} className="text-white" strokeWidth={2.2} />
          <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
