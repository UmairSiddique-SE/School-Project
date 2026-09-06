import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Building2, ArrowRight, Zap } from "lucide-react";

export default function PortalSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-700/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-700/12 rounded-full blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-14 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-2xl shadow-violet-600/40">E</div>
        <h1 className="text-4xl font-black text-white tracking-tight">EduSphere <span className="text-violet-400">ERP</span></h1>
        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
          <Zap size={12} />
          <span>Secure Portal Selection</span>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl relative z-10">
        <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/school-login")} className="flex-1 group relative flex flex-col items-start gap-4 p-7 rounded-3xl bg-gradient-to-br from-violet-950/60 to-[#0d0a1e]/80 border border-violet-500/25 hover:border-violet-500/60 shadow-xl hover:shadow-violet-500/20 backdrop-blur-xl transition-all duration-300 text-left overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/40 group-hover:scale-110 transition-transform duration-300"><Building2 size={28} className="text-white" /></div>
          <div><div className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1.5">School Level</div><h2 className="text-2xl font-black text-white mb-2">School Login</h2><p className="text-sm text-slate-400 leading-relaxed">Secure institutional access for school administrators, teachers and students.</p></div>
          <div className="mt-auto flex items-center gap-2 text-violet-400 font-bold text-sm group-hover:gap-3 transition-all"><span>Continue to Login</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></div>
        </motion.button>

        <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/admin/login")} className="flex-1 group relative flex flex-col items-start gap-4 p-7 rounded-3xl bg-gradient-to-br from-slate-900/80 to-[#07111f]/90 border border-cyan-500/20 hover:border-cyan-400/50 shadow-xl hover:shadow-cyan-500/15 backdrop-blur-xl transition-all duration-300 text-left overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300"><ShieldCheck size={28} className="text-white" /></div>
          <div><div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1.5">Platform Level</div><h2 className="text-2xl font-black text-white mb-2">Super Admin Login</h2><p className="text-sm text-slate-400 leading-relaxed">Secure governance console for platform administration, billing and operations.</p></div>
          <div className="mt-auto flex items-center gap-2 text-cyan-400 font-bold text-sm group-hover:gap-3 transition-all"><span>Continue to Login</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></div>
        </motion.button>
      </div>

      <p className="mt-10 text-slate-500 text-xs text-center relative z-10">EduSphere ERP — Secure access to the correct platform portal.</p>
    </div>
  );
}
