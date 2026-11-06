import React from "react";
import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

export const ProblemSection: React.FC = () => {
  const painPoints = [
    {
      problem: "Student information scattered across files, registers, and loose spreadsheets",
      solution: "Single verified student registry with continuous academic and contact archives",
    },
    {
      problem: "Manual morning attendance causing lost instructional time and delayed absentee notices",
      solution: "One-click digital roll call with instant section percentages and reporting",
    },
    {
      problem: "Difficult fee monitoring with lost voucher counterfoils and unverified bank receipts",
      solution: "Automated monthly voucher generation with live settlement and defaulter lists",
    },
    {
      problem: "Disconnected academic grading leading to manual errors on final report cards",
      solution: "Integrated grade books with automatic passing mark thresholds and printable DMC cards",
    },
    {
      problem: "Repetitive administrative overhead and zero visibility into overall institutional health",
      solution: "Unified Super Admin & School Admin consoles with live financial and campus stats",
    },
  ];

  return (
    <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Operational Transition
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            School management shouldn't feel disconnected.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Educational institutions waste hundreds of hours on paper registers and fragmented tools. EduSphere brings clarity by linking every operational touchpoint.
          </p>
        </div>

        {/* Transition Comparison Layout */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {painPoints.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 p-5 rounded-2xl border border-white/10 bg-[#0B1728]/80 hover:border-white/20 transition-all shadow-md"
            >
              {/* Problem Side */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle size={15} />
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] font-medium leading-relaxed">
                  {item.problem}
                </p>
              </div>

              {/* Arrow Indicator */}
              <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#49D6E8]">
                <ArrowRight size={14} />
              </div>

              {/* Solution Side */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={15} />
                </div>
                <p className="text-xs sm:text-sm text-white font-semibold leading-relaxed">
                  {item.solution}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
