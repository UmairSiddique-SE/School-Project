import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  WalletCards,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
} from "lucide-react";

export const FeatureStorySection: React.FC = () => {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 space-y-24 max-w-7xl mx-auto">
      {/* ── Section A: Student Lifecycle ── */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#49D6E8]/10 text-[#49D6E8] flex items-center justify-center mb-4">
            <GraduationCap size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Student Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
            Every student record, organized and accessible.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Eliminate scattered spreadsheets. Maintain detailed digital student profiles with unique admission numbers, class and section enrollments, parent linkages, and complete academic archives.
          </p>

          <div className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#49D6E8] shrink-0" />
              <span>Single verified repository for contact and guardian information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#49D6E8] shrink-0" />
              <span>Direct connection to class attendance, fee ledgers, and exams</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#49D6E8] shrink-0" />
              <span>Soft-delete safeguards prevent accidental loss of student histories</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-3xl border border-white/10 bg-[#0B1728]/80 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
            <span className="font-bold text-white">Student Enrollment Console</span>
            <span className="text-emerald-400 font-bold">Live Synced</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-white">Muhammad Umair</p>
                <p className="text-xs text-[#94A3B8]">ADM-2026-0001 · Class 10 (Section A)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                Enrolled
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] pt-2 border-t border-white/5">
              <div>Guardian: <strong className="text-white">Tariq Mahmood</strong></div>
              <div>Phone: <strong className="text-white">0300-9876543</strong></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Section B: Daily Operations ── */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="order-2 lg:order-1 p-6 rounded-3xl border border-white/10 bg-[#0B1728]/80 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
            <span className="font-bold text-white">Morning Section Roll Call</span>
            <span className="text-[#49D6E8] font-bold">Attendance Completed</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-lg font-black text-emerald-400">38</p>
              <p className="text-[10px] font-bold text-slate-300">Present</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-lg font-black text-rose-400">2</p>
              <p className="text-[10px] font-bold text-slate-300">Absent</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-lg font-black text-amber-400">1</p>
              <p className="text-[10px] font-bold text-slate-300">Leave</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="order-1 lg:order-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[#5577F5]/10 text-[#5577F5] flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#5577F5]">
            Daily Operations
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
            Bring everyday operations into focus.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Attendance roll calls, teacher class allocations, and operational notifications connect in real-time. Principals and teachers experience zero friction during morning sessions.
          </p>

          <div className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#5577F5] shrink-0" />
              <span>Rapid digital roll call by section or subject teacher</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#5577F5] shrink-0" />
              <span>Automated percentage summaries for monthly progress reporting</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Section C: Fees & Financial Visibility ── */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#8B7CF6]/10 text-[#8B7CF6] flex items-center justify-center mb-4">
            <WalletCards size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#8B7CF6]">
            Finance & Billing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
            Make fee management easier to understand.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Configure flexible fee structures across different grades. Generate clean, printable vouchers and maintain real-time ledgers without reconciling loose receipts.
          </p>

          <div className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#8B7CF6] shrink-0" />
              <span>Monthly tuition invoice generation with custom fee head allocations</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-[#8B7CF6] shrink-0" />
              <span>Instant defaulter flagging and settled voucher receipts</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-3xl border border-white/10 bg-[#0B1728]/80 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
            <span className="font-bold text-white">Fee Voucher Status</span>
            <span className="text-[#8B7CF6] font-bold">Standard 3-Copy Format</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Tuition Fee (Monthly)</span>
              <strong className="text-white">PKR 12,000</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Laboratory & Science Fee</span>
              <strong className="text-white">PKR 2,500</strong>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Payable</span>
              <span className="text-emerald-400">PKR 14,500</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Section D: Academic Management ── */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="order-2 lg:order-1 p-6 rounded-3xl border border-white/10 bg-[#0B1728]/80 shadow-2xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
            <span className="font-bold text-white">Examination Grade Card</span>
            <span className="text-emerald-400 font-bold">Result Card Ready</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span>Mathematics (100)</span>
              <span className="font-bold text-emerald-400">92 / 100 · Grade A+</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span>Physics (100)</span>
              <span className="font-bold text-emerald-400">88 / 100 · Grade A</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
              <span>Computer Science (100)</span>
              <span className="font-bold text-emerald-400">95 / 100 · Grade A+</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="order-1 lg:order-2"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Award size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-400">
            Academic Management
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
            Keep academic activity connected.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Record marks by subject, evaluate passing thresholds, and produce digital progress reports without recalculating marks manually.
          </p>

          <div className="mt-6 space-y-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Standardized examination marks entry with grade point calculations</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Digital Detailed Marks Certificate (DMC) generation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
