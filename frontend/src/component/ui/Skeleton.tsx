import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden className={cn('animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800', className)} />
);
export default Skeleton;
