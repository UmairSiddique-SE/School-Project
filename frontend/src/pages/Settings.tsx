import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { User, Moon, Sun, Shield, Mail, Tag } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><User size={16} className="text-primary" /> Profile</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{user?.name}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') },
            { icon: Tag, label: 'School', value: user?.schoolName || 'Platform Admin' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border">
              <f.icon size={14} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">{f.label}</p>
                <p className="text-sm font-semibold text-foreground">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
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

      {/* App Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-3">About EduSphere ERP</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between"><span>Version</span><span className="font-medium text-foreground">1.0.0</span></div>
          <div className="flex justify-between"><span>Backend</span><span className="font-medium text-foreground">NestJS + SQLite</span></div>
          <div className="flex justify-between"><span>Frontend</span><span className="font-medium text-foreground">React + Vite</span></div>
          <div className="flex justify-between"><span>Status</span><span className="font-semibold text-emerald-600">● Running</span></div>
        </div>
      </motion.div>
    </div>
  );
}
