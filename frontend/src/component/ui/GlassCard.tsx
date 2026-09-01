import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  noPad?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  delay?: number;
  animate?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  elevated = false,
  noPad = false,
  onClick,
  style,
  delay = 0,
  animate = true,
}) => {
  const cardClasses = cn(
    elevated ? 'glass-elevated' : 'glass-card',
    'rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/5 group',
    !noPad && 'p-5',
    onClick && 'cursor-pointer hover:-translate-y-1',
    className,
  );

  const base = (
    <div onClick={onClick} style={style} className={cardClasses}>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.01] opacity-60 group-hover:opacity-100 transition-opacity" />
      {children}
    </div>
  );

  if (!animate) return base;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      style={style}
      className={cardClasses}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.01] opacity-60 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  );
};

export default GlassCard;
