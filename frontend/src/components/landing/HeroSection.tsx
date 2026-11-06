import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  WalletCards,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  Activity,
} from "lucide-react";

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden px-4 pb-20 pt-36 sm:px-6 lg:px-8">
      {/* Background Ambience & Fine Architectural Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-[#5577F5]/15 via-[#49D6E8]/10 to-[#8B7CF6]/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute -left-60 top-20 h-[550px] w-[550px] rounded-full bg-[#5577F5]/10 blur-[140px] pointer-events-none" />

      <div className="mx-auto w-full max-w-7xl relative z-10 grid lg:grid-cols-[1.1fr_.9fr] gap-12 lg:gap-8 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#49D6E8]/20 bg-[#49D6E8]/10 px-3.5 py-1.5 text-xs font-semibold text-[#49D6E8] mb-6 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#49D6E8] animate-pulse" />
            <span>The Command Center for Modern Schools</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            Run Your School.{" "}
            <span className="bg-gradient-to-r from-white via-[#E0F2FE] to-[#49D6E8] bg-clip-text text-transparent">
              Not the Paperwork.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed">
            One connected platform to manage students, teachers, attendance, fees, examinations and everyday school operations — with clarity, control and confidence.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              to="/register-school/plans"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#5577F5] via-[#49D6E8] to-[#8B7CF6] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-[#5577F5]/25 hover:brightness-110 transition cursor-pointer"
            >
              <span>Explore School Registration</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#platform"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white hover:bg-white/[0.08] transition backdrop-blur-sm cursor-pointer"
            >
              <span>Explore the Platform</span>
            </a>
          </div>

          <p className="mt-4 text-xs text-[#94A3B8]/80 font-medium">
            Built for modern schools, colleges and educational institutions.
          </p>
        </motion.div>

        {/* Right Column: Layered Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative"
        >
          {/* Subtle Ambient Back-Glow */}
          <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-r from-[#5577F5]/20 to-[#49D6E8]/20 blur-2xl opacity-60 pointer-events-none" />

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0B1728]/95 p-6 shadow-2xl backdrop-blur-2xl">
            {/* Window Chrome Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-[#94A3B8]">
                  edusphere-dashboard / main-campus
                </span>
              </div>
              <span className="rounded-full bg-[#49D6E8]/10 border border-[#49D6E8]/20 px-2.5 py-0.5 text-[9px] font-bold text-[#49D6E8] uppercase tracking-wider">
                Product Preview · Sample Data
              </span>
            </div>

            {/* Simulated Live School Workspace UI */}
            <div className="mt-5 space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Enrolled</span>
                    <GraduationCap size={13} className="text-[#49D6E8]" />
                  </div>
                  <p className="text-xl font-black text-white">420</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Active Students</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Attendance</span>
                    <Activity size={13} className="text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-emerald-400">96.8%</p>
                  <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Morning Synced</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Fee Month</span>
                    <WalletCards size={13} className="text-[#8B7CF6]" />
                  </div>
                  <p className="text-xl font-black text-white">88%</p>
                  <p className="text-[10px] text-[#8B7CF6] font-semibold mt-0.5">Settled Vouchers</p>
                </div>
              </div>

              {/* Attendance & Class Stream Preview */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Calendar size={13} className="text-[#49D6E8]" />
                    Academic Operations Stream
                  </span>
                  <span className="text-[10px] font-semibold text-[#94A3B8]">Class 10-A · English</span>
                </div>

                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#5577F5] to-[#49D6E8] w-4/5 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                  <span>Daily syllabus tracking & timetable sync</span>
                  <span className="text-emerald-400 font-bold">On Schedule</span>
                </div>
              </div>

              {/* Recent Activity Mini-Feed */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-slate-300">Monthly Tuition Vouchers Generated</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">Today</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#49D6E8]" />
                    <span className="font-medium text-slate-300">Exam Results Compiled & Published</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
