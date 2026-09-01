import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  gradient: string;           // Tailwind gradient class for icon bg
  glowColor?: string;         // inline shadow color string
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
      transition={{ delay, type: 'spring' as const, damping: 22, stiffness: 200 }}
      onClick={onClick}
      className="stat-card p-5 cursor-default group transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10"
      style={glowColor ? ({ '--glow': glowColor } as any) : undefined}
    >
      {/* Gradient blob bg */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500 ${gradient}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
            {label}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="text-2xl font-black text-white leading-none tracking-tight"
          >
            {value}
          </motion.p>

          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5 truncate">{subtitle}</p>
          )}

          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon size={11} />
              <span className="text-[11px] font-bold">{trend}</span>
            </div>
          )}
        </div>

        {/* Icon badge */}
        <div
          className={`h-11 w-11 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Bottom shimmer line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default StatCard;
