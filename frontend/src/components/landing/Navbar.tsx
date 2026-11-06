import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { School, Search, Menu, X, ArrowRight, Shield } from "lucide-react";

interface NavbarProps {
  onSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Platform", href: "#platform" },
    { label: "Solutions", href: "#solutions" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#faq" },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#07111F]/80 px-5 py-3 shadow-2xl backdrop-blur-xl">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5577F5] via-[#49D6E8] to-[#8B7CF6] shadow-md shadow-[#5577F5]/20 group-hover:scale-105 transition-transform">
            <img src="/logo.svg" alt="EduSphere" className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-white tracking-tight">EduSphere</span>
              <span className="rounded-full bg-[#49D6E8]/10 border border-[#49D6E8]/30 px-2 py-0.5 text-[9px] font-black uppercase text-[#49D6E8]">
                ERP
              </span>
            </div>
            <p className="text-[9px] font-bold tracking-[.18em] text-[#94A3B8] uppercase">
              School Management
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs font-semibold tracking-wide text-[#94A3B8] hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right Action CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#94A3B8] hover:bg-white/10 hover:text-white transition"
            title="Search registered schools"
          >
            <Search size={14} className="text-[#49D6E8]" />
            <span>Find School</span>
          </button>

          <Link
            to="/school-login"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] transition"
          >
            <School size={14} className="text-[#5577F5]" />
            <span>School Login</span>
          </Link>

          <Link
            to="/register-school/plans"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5577F5] to-[#49D6E8] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#5577F5]/25 hover:brightness-110 transition"
          >
            <span>Register Your School</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-white/10 p-2 text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2 rounded-2xl border border-white/10 bg-[#0B1728]/95 p-5 backdrop-blur-2xl shadow-2xl lg:hidden"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  onClick={() => setMobileOpen(false)}
                  href={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#94A3B8] hover:text-white hover:bg-white/5"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onSearch();
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-[#94A3B8] flex items-center justify-center gap-2"
                >
                  <Search size={15} /> Find School
                </button>
                <Link
                  to="/school-login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-2"
                >
                  <School size={15} /> School Login
                </Link>
                <Link
                  to="/register-school/plans"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-[#5577F5] to-[#49D6E8] py-2.5 text-xs font-bold text-white text-center shadow-lg"
                >
                  Register Your School
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

