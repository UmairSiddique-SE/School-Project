import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Building2, ArrowRight, Zap, School } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Bypass user presets ───────────────────────────────────────────────────────
const SUPER_ADMIN_USER = {
  id: "superadmin-1",
  name: "Super Administrator",
  email: "superadmin@edusphere.com",
  role: "SUPER_ADMIN" as const,
};

const SCHOOL_ADMIN_USER = {
  id: "schooladmin-1",
  name: "School Administrator",
  email: "admin@edusphere.com",
  role: "SCHOOL_ADMIN" as const,
  schoolId: "school-1",
  schoolName: "EduSphere Academy",
  schoolSlug: "edusphere",
};

export default function PortalSelector() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const enterSuperAdmin = () => {
    login("bypass-super-admin", SUPER_ADMIN_USER);
    navigate("/super-admin", { replace: true });
  };

  const enterSchoolAdmin = () => {
    login("bypass-school-admin", SCHOOL_ADMIN_USER);
    navigate("/edusphere/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-700/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-700/12 rounded-full blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-14 relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-2xl shadow-violet-600/40">
          E
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          EduSphere <span className="text-violet-400">ERP</span>
        </h1>
        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
          <Zap size={12} />
          <span>Direct Access Mode — No Login Required</span>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-sm relative z-10">
        {/* School Admin Card */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={enterSchoolAdmin}
          className="flex-1 group relative flex flex-col items-start gap-4 p-7 rounded-3xl bg-gradient-to-br from-violet-950/60 to-[#0d0a1e]/80 border border-violet-500/25 hover:border-violet-500/60 shadow-xl hover:shadow-violet-500/20 backdrop-blur-xl transition-all duration-300 text-left overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/40 group-hover:scale-110 transition-transform duration-300">
            <Building2 size={28} className="text-white" />
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-1.5">School Level</div>
            <h2 className="text-2xl font-black text-white mb-2">Institutional Admin</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Institutional management panel. Students, teachers, classes, finance, and reports.
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2 text-violet-400 font-bold text-sm group-hover:gap-3 transition-all">
            <span>Open Dashboard</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </div>



      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-slate-500 text-xs text-center relative z-10"
      >
        EduSphere ERP — School Management System &nbsp;•&nbsp; Click any portal to enter instantly
      </motion.p>
    </div>
  );
}
