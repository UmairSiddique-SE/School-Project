import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, Edit2, X, Eye, Trash2, Loader2, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  updatedAt: string;
}

const categoryColors: Record<string, string> = {
  Onboarding: 'bg-emerald-500/10 text-emerald-400',
  Billing: 'bg-blue-500/10 text-blue-400',
  Account: 'bg-amber-500/10 text-amber-400',
  Security: 'bg-red-500/10 text-red-400',
  Communication: 'bg-violet-500/10 text-violet-400',
  General: 'bg-slate-500/10 text-slate-400',
};

type ModalType = 'edit' | 'preview' | 'create' | null;

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', category: 'Onboarding', body: '' });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = () => {
    setLoading(true);
    apiClient.get('/admin/email-templates')
      .then(r => setTemplates(r.data))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openEdit = (t: Template) => {
    setSelected(t);
    setForm({ name: t.name, subject: t.subject, category: t.category, body: t.body });
    setModal('edit');
  };

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', subject: '', category: 'Onboarding', body: '' });
    setModal('create');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await apiClient.post('/admin/email-templates', form);
        toast.success('Template created!');
      } else if (selected) {
        await apiClient.put(`/admin/email-templates/${selected.id}`, form);
        toast.success('Template saved!');
      }
      setModal(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await apiClient.delete(`/admin/email-templates/${id}`);
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Template copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">Email Templates</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage automated email templates for all system events</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTemplates} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <RefreshCw size={15} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Plus size={15} /> New Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[t.category] || categoryColors.General}`}>{t.category}</span>
                <span className="text-[10px] text-muted-foreground">Edited {new Date(t.updatedAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{t.body.split('\n')[2] || t.body.substring(0, 80)}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => { setSelected(t); setModal('preview'); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold transition-all">
                  <Eye size={12} /> Preview
                </button>
                <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleCopy(t.body)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold transition-all ml-auto">
                  <Copy size={12} />
                </button>
                <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center">
              <Mail size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-bold text-foreground">No templates yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "New Template" to create your first one.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {(modal === 'edit' || modal === 'create') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{modal === 'create' ? 'New Template' : `Edit: ${selected?.name}`}</h3>
                <button onClick={() => setModal(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Template Name</label>
                    <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Welcome Email"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Subject Line</label>
                  <input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject with {variables}"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Body</label>
                  <p className="text-[10px] text-muted-foreground mb-1">Use {'{variables}'} like {'{schoolName}'}, {'{plan}'}, {'{expiryDate}'} etc.</p>
                  <textarea required value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={10}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono" />
                </div>
                <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {saving ? 'Saving…' : modal === 'create' ? 'Create Template' : 'Save Template'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modal === 'preview' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground">Preview: {selected.name}</h3>
                <button onClick={() => setModal(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="bg-background border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Mail size={14} className="text-primary" /></div>
                  <div>
                    <p className="text-xs font-bold text-foreground">EduSphere Platform</p>
                    <p className="text-xs text-muted-foreground">noreply@edusphere.app</p>
                  </div>
                </div>
                <p className="font-bold text-foreground text-sm mb-4">{selected.subject}</p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
