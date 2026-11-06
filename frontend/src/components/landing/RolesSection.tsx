import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, School, Users, GraduationCap, CheckCircle2 } from "lucide-react";

export const RolesSection: React.FC = () => {
  const roles = [
    {
      role: "Super Admin",
      badge: "Platform Control Plane",
      desc: "Centralized governance over multiple institutions, subscription life-cycles, tenant verification, and audit logs.",
      responsibilities: [
        "Review & approve incoming school applications",
        "Manage platform-wide subscription plans & extensions",
        "Monitor tenant databases & operational status",
        "Broadcast system alerts and updates across network",
      ],
    },
    {
      role: "School Admin",
      badge: "Institutional Leadership",
      desc: "Full operational authority over the campus: admissions, staff assignments, fee voucher generation, and public webpage control.",
      responsibilities: [
        "Admit students and organize numerical class sections",
        "Configure tuition fee structures & print vouchers",
        "Publish examinations, passing thresholds & result cards",
        "Update public school website details and logo",
      ],
    },
    {
      role: "Teacher",
      badge: "Classroom & Academic Operations",
      desc: "Focused digital portal for section roll calls, homework distribution, syllabus progression, and marks recording.",
      responsibilities: [
        "Mark daily morning section attendance",
        "Publish class homework assignments & resources",
        "Enter examination scores for assigned subjects",
        "Inspect section timetables and student profiles",
      ],
    },
    {
      role: "Student",
      badge: "Academic LMS Portal",
      desc: "Dedicated student interface to inspect daily attendance histories, homework assignments, result cards, and notices.",
      responsibilities: [
        "View personal attendance percentage & logs",
        "Access homework instructions and deadlines",
        "Review examination results and grade status",
        "Read campus announcements & event notices",
      ],
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#07111F]/60">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Role-Based Workspaces
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            Designed for different school roles.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8]">
            Purpose-built permissions and streamlined consoles ensure every stakeholder focuses on their specific duties.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-6 rounded-3xl border border-white/10 bg-[#0B1728]/80 flex flex-col justify-between shadow-xl"
            >
              <div>
                <span className="px-2.5 py-1 rounded-full bg-[#5577F5]/10 text-[#49D6E8] text-[9px] font-black uppercase tracking-wider">
                  {item.badge}
                </span>
                <h3 className="text-lg font-bold text-white mt-4">{item.role}</h3>
                <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                  {item.desc}
                </p>

                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  {item.responsibilities.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={13} className="text-[#49D6E8] shrink-0 mt-0.5" />
                      <span className="leading-snug">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
