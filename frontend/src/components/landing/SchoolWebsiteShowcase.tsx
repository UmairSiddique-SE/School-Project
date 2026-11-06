import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, ExternalLink, CheckCircle2, School } from "lucide-react";

export const SchoolWebsiteShowcase: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#07111F]/80">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0B1728] via-[#07111F] to-[#101F33] p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-3.5 py-1 rounded-full border border-[#49D6E8]/30 bg-[#49D6E8]/10 text-[#49D6E8] text-[10px] font-black uppercase tracking-widest">
                Multi-School Web Portals
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
                Every school deserves its own digital identity.
              </h2>
              <p className="mt-5 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                When an approved institution operates on EduSphere, the platform automatically provisions an official, dedicated public website reachable via dynamic routing at{" "}
                <code className="text-[#49D6E8] bg-white/5 px-2 py-0.5 rounded-md font-mono text-xs">
                  /school/:slug
                </code>
                . School leadership can showcase facilities, contact details, curriculum wings, and direct portal logins.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  "Dynamic school profile loaded from verified backend records",
                  "Dedicated hero banner, about, academic levels, and campus facilities",
                  "Built-in admissions enquiry form routed to the school administration",
                  "Direct student and staff login gateway connected to that specific tenant",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-[#49D6E8] shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  to="/school/umair-model-school"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#5577F5] to-[#49D6E8] text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-[#5577F5]/25 hover:brightness-110"
                >
                  <span>Explore a School Website</span>
                  <ExternalLink size={14} />
                </Link>

                <Link
                  to="/school-login"
                  className="px-6 py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 text-white font-semibold text-xs transition"
                >
                  Browse School Directory
                </Link>
              </div>
            </div>

            {/* Browser Window Mockup */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#07111F]/90 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                <span className="font-mono text-[11px] text-[#94A3B8] flex items-center gap-2">
                  <Globe size={13} className="text-[#49D6E8]" />
                  school-managment-pro.vercel.app/school/umair-model-school
                </span>
                <span className="text-emerald-400 font-bold text-[10px] uppercase">
                  Verified Campus
                </span>
              </div>

              <div className="mt-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#5577F5] to-[#49D6E8] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#5577F5]/25 mb-4">
                  U
                </div>
                <h3 className="text-xl font-black text-white">Umair Model School</h3>
                <p className="text-xs text-[#94A3B8] mt-1">Sargodha, Pakistan</p>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#49D6E8]/10 text-[#49D6E8] text-xs font-semibold">
                    Admissions Open
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#5577F5]/10 text-[#5577F5] text-xs font-semibold">
                    Primary to Matric
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    Digital LMS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
