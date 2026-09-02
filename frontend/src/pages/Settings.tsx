import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { User, Moon, Sun, Shield, Mail, Tag, Sparkles, Sliders, Building2 } from 'lucide-react';
import BuildingManagement from './BuildingManagement';
import Subscription from './Subscription';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'buildings' | 'subscription' | 'appearance'>('profile');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sliders className="text-violet-500" size={26} />
            Admin Panel & School Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage institutional preferences, administrator profile, and system appearance
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl w-fit overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <User size={15} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('buildings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'buildings'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Building2 size={15} />
            <span>Infrastructure</span>
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

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Sliders size={15} />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: PROFILE (DEFAULT) ─── */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={16} className="text-primary" /> Institutional Information
            </h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{user?.name}</p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Shield, label: 'Role Access', value: user?.role?.replace('_', ' ') },
                { icon: Tag, label: 'Institution / School', value: user?.schoolName || 'EduSphere Academy' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border">
                  <f.icon size={15} className="text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{f.label}</p>
                    <p className="text-xs font-semibold text-foreground">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── TAB 2: BUILDINGS & ROOMS ─── */}
      {activeTab === 'buildings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <BuildingManagement />
        </motion.div>
      )}

      {/* ─── TAB 3: SUBSCRIPTION ─── */}
      {activeTab === 'subscription' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Subscription />
        </motion.div>
      )}

      {/* ─── TAB 4: APPEARANCE & PREFERENCES ─── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />} Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark interface</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative h-6 w-11 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> About EduSphere ERP
            </h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>System Version</span><span className="font-medium text-foreground">1.0.0</span></div>
              <div className="flex justify-between"><span>Backend Service</span><span className="font-medium text-foreground">NestJS + SQLite</span></div>
              <div className="flex justify-between"><span>Frontend Engine</span><span className="font-medium text-foreground">React + Vite</span></div>
              <div className="flex justify-between"><span>Infrastructure Module</span><span className="font-semibold text-emerald-500">● Active</span></div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
