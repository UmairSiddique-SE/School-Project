import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-14 px-4 sm:px-6 lg:px-8 bg-[#040B14]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-xs">
        {/* Brand Info */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/logo.svg" alt="EduSphere" className="h-6 w-6" />
            <span className="font-black text-white text-base">EduSphere ERP</span>
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            The command center for modern educational institutions. Connecting administration, academics, and finance.
          </p>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">
            Platform
          </h4>
          <ul className="space-y-2 text-[#94A3B8]">
            <li><a href="#platform" className="hover:text-white transition">Product Showcase</a></li>
            <li><a href="#features" className="hover:text-white transition">Core Features</a></li>
            <li><a href="#solutions" className="hover:text-white transition">Operations Solved</a></li>
            <li><a href="#pricing" className="hover:text-white transition">Pricing Plans</a></li>
          </ul>
        </div>

        {/* Gateways & Portals */}
        <div>
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">
            Gateways
          </h4>
          <ul className="space-y-2 text-[#94A3B8]">
            <li><Link to="/school-login" className="hover:text-white transition">School Login</Link></li>
            <li><Link to="/register-school/plans" className="hover:text-white transition">Register School</Link></li>
            <li><Link to="/school/umair-model-school" className="hover:text-white transition">Sample School Web</Link></li>
            <li><Link to="/admin-login" className="hover:text-white transition">Super Admin</Link></li>
          </ul>
        </div>

        {/* Reliability & Architecture */}
        <div>
          <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-3">
            Reliability
          </h4>
          <ul className="space-y-2 text-[#94A3B8]">
            <li><a href="#security" className="hover:text-white transition">Data Segregation</a></li>
            <li><span className="text-emerald-400 font-semibold">Active Neon Cloud DB</span></li>
            <li><span>Tenant Isolated RBAC</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
        <p>© {new Date().getFullYear()} EduSphere ERP. All rights reserved.</p>
        <p>Enterprise School Management Platform</p>
      </div>
    </footer>
  );
};
