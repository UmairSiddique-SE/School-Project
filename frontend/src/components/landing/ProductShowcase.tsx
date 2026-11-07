import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  WalletCards,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "overview",
      label: "School Overview",
      icon: LayoutDashboard,
      title: "Consolidated Campus Command Center",
      desc: "A single workspace for reviewing student records, attendance, fee activity, and important school updates.",
      preview: {
        stats: [
          { label: "Student Records", val: "Live", sub: "Shown after school setup", color: "text-[#49D6E8]" },
          { label: "Attendance", val: "Daily", sub: "Based on actual entries", color: "text-emerald-400" },
          { label: "Fee Collection", val: "Tracked", sub: "Based on recorded payments", color: "text-[#8B7CF6]" },
        ],
        badge: "Feature Preview",
        details: [
          "Real-time administrative alert broadcasting",
          "Automated soft-delete safeguard on sensitive records",
          "Direct access to classes, staff credentials, and billing records",
        ],
      },
    },
    {
      id: "students",
      label: "Student Management",
      icon: GraduationCap,
      title: "Complete Student Lifecycle Registry",
      desc: "Enrollment management with unique admission numbers, guardian phone linkages, and academic archival.",
      preview: {
        stats: [
          { label: "Admissions", val: "Managed", sub: "School workflow", color: "text-[#49D6E8]" },
          { label: "Guardian Records", val: "Organised", sub: "Linked to students", color: "text-white" },
          { label: "Class Sections", val: "Configured", sub: "School-defined setup", color: "text-emerald-400" },
        ],
        badge: "Registry Controls",
        details: [
          "Unique Admission IDs preventing duplicate enrollments",
          "Associated parent contact and emergency records",
          "Direct linkage to examination performance and fee ledgers",
        ],
      },
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: ClipboardCheck,
      title: "Streamlined Morning Roll Calls",
      desc: "Section-wise attendance logging with immediate percentage summaries and absentee records.",
      preview: {
        stats: [
          { label: "Present Today", val: "Live", sub: "From marked attendance", color: "text-emerald-400" },
          { label: "Absent / Leave", val: "Tracked", sub: "From attendance register", color: "text-amber-400" },
          { label: "Faculty Register", val: "Live", sub: "School-specific records", color: "text-[#49D6E8]" },
        ],
        badge: "Daily Roll Call",
        details: [
          "Instant present, absent, leave, and late marking",
          "Automated monthly attendance percentage calculation",
          "Exportable records for parent conferences and official archives",
        ],
      },
    },
    {
      id: "fees",
      label: "Fee Management",
      icon: WalletCards,
      title: "Automated Fee Billing & Challans",
      desc: "Configure tuition heads, generate monthly vouchers, print payment challans, and track overdue accounts.",
      preview: {
        stats: [
          { label: "Fee Vouchers", val: "Generated", sub: "For enrolled students", color: "text-white" },
          { label: "Settlement", val: "Tracked", sub: "From actual receipts", color: "text-emerald-400" },
          { label: "Defaulter Notices", val: "Pending", sub: "Auto-Flagged", color: "text-[#8B7CF6]" },
        ],
        badge: "Financial Operations",
        details: [
          "Multi-head fee structures: Tuition, Lab, Exam, and Transport",
          "Printable 3-copy fee slips: Student, School, and Bank copies",
          "Zero orphan fee entries with strict student verification",
        ],
      },
    },
    {
      id: "exams",
      label: "Examinations",
      icon: Award,
      title: "Examination Scheduling & Grade Cards",
      desc: "Manage mid-term and annual exams, record subject marks, and generate digital student result cards.",
      preview: {
        stats: [
          { label: "Exam Schedule", val: "Managed", sub: "School-defined schedule", color: "text-[#49D6E8]" },
          { label: "Grading Rules", val: "Configurable", sub: "Set by the institution", color: "text-white" },
          { label: "DMC Generation", val: "Available", sub: "After exam data entry", color: "text-emerald-400" },
        ],
        badge: "Academic Evaluation",
        details: [
          "Class and subject-specific marks entry for teachers",
          "Automatic grading, percentages, and position ranking",
          "Comprehensive DMC card generation ready for printing",
        ],
      },
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      title: "Actionable Operational Intelligence",
      desc: "Financial analytics, attendance trends, staff utilization, and campus expansion reporting.",
      preview: {
        stats: [
          { label: "Financial Reports", val: "Available", sub: "From recorded entries", color: "text-emerald-400" },
          { label: "Data Export", val: "CSV / Print", sub: "Official Handover", color: "text-white" },
          { label: "System Status", val: "Monitored", sub: "Operational checks", color: "text-[#49D6E8]" },
        ],
        badge: "Leadership Insights",
        details: [
          "Comprehensive fee collection and outstanding dues breakdown",
          "Student progression and attendance historical charts",
          "Exportable summaries for school trustees and directors",
        ],
      },
    },
  ];

  const current = tabs[activeTab];

  return (
    <section id="platform" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#07111F]">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Interactive Showcase
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            Everything your school needs. One connected workspace.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8]">
            Explore the core modules powering daily operations across educational institutions.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#5577F5] text-white shadow-lg shadow-[#5577F5]/25 border border-[#5577F5]"
                    : "bg-white/[0.03] text-[#94A3B8] border border-white/5 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-[32px] border border-white/10 bg-[#0B1728]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#49D6E8]/10 text-[#49D6E8] text-[10px] font-black uppercase tracking-wider">
                  {current.preview.badge}
                </span>
                <h3 className="text-2xl sm:text-4xl font-black text-white mt-4 leading-tight">
                  {current.title}
                </h3>
                <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">
                  {current.desc}
                </p>

                <div className="mt-8 space-y-3">
                  {current.preview.details.map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 size={15} className="text-[#49D6E8] shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Showcase Window Display */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#07111F]/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] text-[#94A3B8]">
                  <span className="font-mono">Module Preview · {current.label}</span>
                  <span className="text-[#49D6E8] font-bold">Illustrative UI</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {current.preview.stats.map((s, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] font-bold text-white mt-0.5 truncate">{s.label}</p>
                      <p className="text-[9px] text-[#94A3B8]">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-[#49D6E8]/20 bg-[#49D6E8]/5">
                  <div className="flex justify-between items-center text-xs font-bold text-white mb-2">
                    <span>Institutional Data Reliability</span>
                    <span className="text-[#49D6E8]">Preview</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#5577F5] to-[#49D6E8] w-[95%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

