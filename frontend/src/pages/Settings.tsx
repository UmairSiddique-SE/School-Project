import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Sparkles, Building2 } from 'lucide-react';
import BuildingManagement from './BuildingManagement';
import Subscription from './Subscription';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'buildings' | 'subscription'>('buildings');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="text-violet-500" size={26} />
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage school buildings, classrooms, facilities, and infrastructure
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl w-fit overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('buildings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'buildings'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Building2 size={15} />
            <span>Buildings</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Sparkles size={15} />
            <span>Subscription</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: BUILDINGS & ROOMS ─── */}
      {activeTab === 'buildings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <BuildingManagement />
        </motion.div>
      )}

      {/* ─── TAB 2: SUBSCRIPTION ─── */}
      {activeTab === 'subscription' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Subscription />
        </motion.div>
      )}
    </div>
  );
}
