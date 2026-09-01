import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

export interface ActivityItem {
  id: string | number;
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  time: string;
  iconBg: string;   // Tailwind bg gradient class
  badge?: string;
  badgeColor?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
  maxItems?: number;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 300 } },
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, className = '', maxItems }) => {
  const displayed = maxItems ? items.slice(0, maxItems) : items;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`space-y-1 ${className}`}
    >
      <AnimatePresence>
        {displayed.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="activity-item group flex items-start gap-3 py-3 first:pt-1"
            >
              {/* Icon dot */}
              <div
                className={`h-8 w-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-md`}
                style={{ zIndex: 1 }}
              >
                <Icon size={13} className="text-white" strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[13px] font-medium text-slate-200 leading-snug truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>

              {/* Time + badge */}
              <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                <span className="text-[11px] text-slate-600 whitespace-nowrap">{item.time}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'badge-violet'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {maxItems && items.length > maxItems && (
        <div className="pt-2 text-center">
          <span className="text-[11px] text-slate-600 font-medium">
            +{items.length - maxItems} more activities
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
