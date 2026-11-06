import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers, FileText, CheckCircle, School } from "lucide-react";

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Choose a plan",
      desc: "Select an available school subscription plan matching your student and campus capacity.",
    },
    {
      num: "02",
      title: "Register your institution",
      desc: "Submit school identity, desired web slug, campus location, and administrator credentials.",
    },
    {
      num: "03",
      title: "Verify and get approved",
      desc: "Complete email confirmation and submit payment verification for Super Admin review.",
    },
    {
      num: "04",
      title: "Manage your school",
      desc: "Access your unified operational workspace and launch your official public website.",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Operational Journey
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            From registration to organized school management.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8]">
            A transparent four-step pathway reflecting the real platform onboarding and governance lifecycle.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-6 rounded-3xl border border-white/10 bg-[#0B1728]/70 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl font-black text-[#49D6E8]/40">{step.num}</span>
                <h3 className="text-base font-bold text-white mt-4">{step.title}</h3>
                <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[10px] text-slate-400 font-semibold">
                <span>Phase {step.num} of 04</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
