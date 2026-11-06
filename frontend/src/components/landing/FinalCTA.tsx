import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, School } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-[36px] border border-[#5577F5]/30 bg-gradient-to-r from-[#07111F] via-[#0B1728] to-[#101F33] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-[#5577F5]/20 to-[#49D6E8]/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-[.2em] text-[#49D6E8]">
            Get Started Today
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3">
            Give your school a more organized future.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Bring your school's everyday operations into one connected platform.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              to="/register-school/plans"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#5577F5] via-[#49D6E8] to-[#8B7CF6] text-white font-bold text-sm shadow-xl shadow-[#5577F5]/25 hover:brightness-110 transition cursor-pointer"
            >
              <span>Register Your School</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/school-login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm transition"
            >
              <School size={15} className="text-[#49D6E8]" />
              <span>School Login</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

