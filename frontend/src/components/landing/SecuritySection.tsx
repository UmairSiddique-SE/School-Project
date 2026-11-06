import React from "react";
import { ShieldCheck, Lock, Database, KeyRound, Server } from "lucide-react";

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: Database,
      title: "Tenant-Scoped Relational Isolation",
      desc: "Every database query enforces schoolId scoping via Prisma ORM, preventing cross-school data visibility.",
    },
    {
      icon: Lock,
      title: "Stateless JWT & Role Guards",
      desc: "Cryptographically verified authentication tokens backed by granular NestJS role decorators.",
    },
    {
      icon: KeyRound,
      title: "Bcrypt Credential Hashing",
      desc: "All administrative, teacher, and student passwords salted and hashed with standard bcrypt security.",
    },
    {
      icon: Server,
      title: "Neon Cloud Serverless PostgreSQL",
      desc: "Production database operating with high-availability replication and encrypted data storage.",
    },
  ];

  return (
    <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0B1728]/50">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Security & Compliance
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
            Your school's information deserves careful protection.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8]">
            Architected with modern multi-tenant safeguards to keep student, academic, and financial records strictly segregated.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl border border-white/10 bg-[#07111F]/80 shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5577F5]/10 border border-[#5577F5]/20 text-[#49D6E8] flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
