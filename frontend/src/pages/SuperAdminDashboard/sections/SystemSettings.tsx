import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Globe, Server, Mail, Bell, Loader2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

interface SettingItem {
  id: string;
  key: string;
  label: string;
  description: string;
  type: string;
  value: string;
  category: string;
  danger?: boolean;
  options?: string[];
}

const categoryMeta: Record<string, { title: string; icon: React.ComponentType<any>; iconColor: string }> = {
  platform: { title: 'Platform', icon: Globe, iconColor: 'text-blue-400' },
  subscription: { title: 'Subscription', icon: Shield, iconColor: 'text-violet-400' },
  email: { title: 'Email / SMTP', icon: Mail, iconColor: 'text-emerald-400' },
  notifications: { title: 'Notifications', icon: Bell, iconColor: 'text-amber-400' },
  server: { title: 'Server & Security', icon: Server, iconColor: 'text-red-400' },
};

const dangerKeys = ['platform.maintenance', 'server.ipWhitelist'];

const selectOptions: Record<string, string[]> = {
  'subscription.defaultPlan': ['FREE_TRIAL', 'PROFESSIONAL', 'PREMIUM'],
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient.get('/admin/settings')
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const getValue = (setting: SettingItem) => {
    return pending[setting.key] !== undefined ? pending[setting.key] : setting.value;
  };

  const updateLocal = (key: string, value: string) => {
    setPending(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(pending).map(([key, value]) => ({ key, value }));
      if (updates.length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }
      await apiClient.post('/admin/settings', { updates });
      // Apply pending to actual settings
      setSettings(prev => prev.map(s => pending[s.key] !== undefined ? { ...s, value: pending[s.key] } : s));
      setPending({});
      toast.success('System settings saved successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, SettingItem[]>);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">System Settings</h2>
          <p className="text-muted-foreground text-sm mt-1">Configure platform-wide behaviour, email, and security</p>
          {Object.keys(pending).length > 0 && (
            <p className="text-xs text-amber-400 mt-1">{Object.keys(pending).length} unsaved change(s)</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-70 ${
            saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
          }`}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Settings size={15} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(categoryMeta).map(([catKey, catMeta], i) => {
          const catSettings = grouped[catKey] || [];
          if (catSettings.length === 0) return null;
          const Icon = catMeta.icon;
          return (
            <motion.div
              key={catKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Icon size={16} className={catMeta.iconColor} />
                </div>
                <h3 className="font-bold text-foreground">{catMeta.title}</h3>
              </div>
              <div className="divide-y divide-border">
                {catSettings.map(setting => {
                  const isDanger = dangerKeys.includes(setting.key);
                  const currentValue = getValue(setting);
                  const isModified = pending[setting.key] !== undefined;
                  return (
                    <div key={setting.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors ${isModified ? 'bg-primary/5' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                          {isDanger && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                              <AlertTriangle size={9} /> Caution
                            </span>
                          )}
                          {isModified && <span className="text-[10px] font-bold text-amber-400">Modified</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                      </div>
                      <div className="shrink-0">
                        {setting.type === 'toggle' && (
                          <button
                            onClick={() => updateLocal(setting.key, currentValue === 'true' ? 'false' : 'true')}
                            className={`relative h-6 w-11 rounded-full transition-all ${
                              currentValue === 'true' ? (isDanger ? 'bg-red-500' : 'bg-primary') : 'bg-muted'
                            }`}
                          >
                            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${currentValue === 'true' ? 'left-6' : 'left-1'}`} />
                          </button>
                        )}
                        {setting.type === 'text' && (
                          <input
                            value={currentValue}
                            onChange={e => updateLocal(setting.key, e.target.value)}
                            className="w-56 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        )}
                        {setting.type === 'number' && (
                          <input
                            type="number"
                            value={currentValue}
                            onChange={e => updateLocal(setting.key, e.target.value)}
                            className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        )}
                        {setting.type === 'select' && (
                          <select
                            value={currentValue}
                            onChange={e => updateLocal(setting.key, e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {(selectOptions[setting.key] || [currentValue]).map(o => (
                              <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
