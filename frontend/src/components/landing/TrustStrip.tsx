import React from "react";
import { CheckCircle2, ShieldCheck, Database, Globe2, Cpu } from "lucide-react";

export const TrustStrip: React.FC = () => {
  const capabilities = [
    {
      icon: Cpu,
      title: "Designed for School Operations",
      desc: "Workflows mapped directly to real daily academic routines",
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Access Control",
      desc: "Granular permissions for Super Admin, School Admin and Teachers",
    },
    {
      icon: Database,
      title: "Centralized Management",
      desc: "Unified cloud database with multi-tenant isolation",
    },
    {
      icon: Globe2,
      title: "Connected School Websites",
      desc: "Every approved institution gets its own verified public web URL",
    },
  ];

  return (
    <section className="border-y border-white/10 bg-[#0B1728]/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-[11px] font-bold uppercase tracking-[.2em] text-[#94A3B8] mb-8">
          Core Platform Capabilities & Architectural Standards
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
              >
                <div className="w-9 h-9 rounded-xl bg-[#5577F5]/10 border border-[#5577F5]/20 flex items-center justify-center text-[#49D6E8] shrink-0">
                  <Icon size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{item.title}</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
