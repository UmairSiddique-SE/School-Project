import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
  Building2,
  Send,
  Layers,
  PhoneCall,
  Menu,
  X,
  Library,
  FlaskConical,
  Bus,
  Check,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";

interface SchoolPublicData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  isActive: boolean;
  subscription?: {
    plan: string;
    status: string;
    endDate?: string;
  };
  adminContact?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  classes?: Array<{ id: string; name: string; numeric: number | null }>;
  buildings?: Array<{ id: string; name: string; type: string | null }>;
}

export default function SchoolPublicLanding() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [school, setSchool] = useState<SchoolPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    gradeSeeking: "",
    message: "",
  });
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    if (!schoolSlug) return;
    setLoading(true);
    apiClient
      .get(`/public/tenant/slug/${encodeURIComponent(schoolSlug)}`)
      .then((res) => {
        // Enforce active status
        if (!res.data.isActive) {
          setError("This school's public website is currently offline or awaiting approval.");
        } else {
          setSchool(res.data);
          setError(null);
          // Set dynamic page title
          document.title = `${res.data.name} — Official School Website`;
        }
      })
      .catch((err) => {
        console.error("Failed to load school portal:", err);
        setError("School portal not found or inactive.");
      })
      .finally(() => setLoading(false));
  }, [schoolSlug]);

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.studentName || !enquiryForm.phone) {
      toast.error("Please fill in the student name and contact phone.");
      return;
    }
    // Simulation / Direct acknowledgment
    setEnquirySent(true);
    toast.success("Admissions enquiry received! Campus administration will reach out shortly.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040d1a] flex flex-col items-center justify-center text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-2 border-cyan-400 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <School className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-5 text-sm font-bold text-slate-400 tracking-wider uppercase">
          Loading Campus Website...
        </p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-[#040d1a] flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full text-center p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
            <School size={30} />
          </div>
          <h2 className="text-2xl font-black text-white">School Not Available</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error || "The requested school domain could not be resolved or is not active."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/school-login"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              School Directory
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold text-xs transition"
            >
              Platform Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const campusLocation = [school.address, school.city, school.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#030b17] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* ── 1. Header Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/10 bg-[#061426]/90 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-11 h-11 rounded-xl object-cover border border-white/10 bg-white/5"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">
                  {school.name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                  <CheckCircle2 size={10} /> Verified Campus
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <MapPin size={11} className="text-cyan-400" />
                <span>{school.city || "Pakistan"}</span>
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#about" className="hover:text-cyan-300 transition">About</a>
            <a href="#academics" className="hover:text-cyan-300 transition">Academics</a>
            <a href="#facilities" className="hover:text-cyan-300 transition">Facilities</a>
            <a href="#admissions" className="hover:text-cyan-300 transition">Admissions</a>
            <a href="#gallery" className="hover:text-cyan-300 transition">Gallery</a>
            <a href="#contact" className="hover:text-cyan-300 transition">Contact</a>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              to={`/${school.slug}/login`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <Lock size={13} />
              <span>Portal Login</span>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-white/10 text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-5 rounded-2xl border border-white/10 bg-[#061426]/95 backdrop-blur-2xl shadow-2xl lg:hidden flex flex-col gap-3 text-sm font-bold"
            >
              <a onClick={() => setMobileMenuOpen(false)} href="#about" className="text-slate-300 hover:text-white">About</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#academics" className="text-slate-300 hover:text-white">Academics</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#facilities" className="text-slate-300 hover:text-white">Facilities</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#admissions" className="text-slate-300 hover:text-white">Admissions</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#gallery" className="text-slate-300 hover:text-white">Gallery</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#contact" className="text-slate-300 hover:text-white">Contact</a>
              <div className="pt-2 border-t border-white/10">
                <Link
                  to={`/${school.slug}/login`}
                  className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2"
                >
                  <Lock size={14} /> Portal Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-xs font-bold mb-6 backdrop-blur-md">
            <Sparkles size={13} />
            <span>Welcome to the Official Campus of {school.name}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Nurturing Tomorrow’s Leaders at{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300">
              {school.name}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Official information, admissions updates, campus details, and contact information from the school.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#admissions"
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm shadow-xl shadow-cyan-500/25 hover:brightness-110 transition cursor-pointer"
            >
              <span>Apply for Admission</span>
              <ArrowRight size={16} />
            </a>

            <a
              href="#contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] font-bold text-sm transition"
            >
              <PhoneCall size={15} />
              <span>Contact Campus</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. About School & Leadership ── */}
      <section id="about" className="py-20 px-4 border-t border-white/10 bg-[#061426]/40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              About Our Institution
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
              About Our School
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Welcome to the official website of {school.name}. School information and announcements published here are managed by the school administration.
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  <Award size={16} className="text-cyan-400" /> Our Mission
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  The school administration can publish its mission and institutional information here.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400" /> Our Vision
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  The school can publish its vision and long-term goals here.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#091e36] to-[#040e1b] shadow-2xl relative">
            <h3 className="text-xl font-black text-white mb-4">
              Principal's Message
            </h3>
            <p className="text-sm text-slate-300 italic leading-relaxed">
              "Welcome to our digital campus portal. Education is not merely the transmission of facts; it is the ignition of curiosity. We invite parents and students to partner with us as we journey toward educational excellence."
            </p>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                {school.adminContact?.name?.charAt(0) || "P"}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {school.adminContact?.name || "School Principal"}
                </p>
                <p className="text-xs text-slate-400">Head of Institution</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Academics Section ── */}
      <section id="academics" className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Curriculum & Programs
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Academic Levels
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Academic classes published by the school administration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(school.classes && school.classes.length > 0
              ? school.classes
              : [
                  { name: "Primary Wing (Grade 1 - 5)", numeric: 1 },
                  { name: "Middle Wing (Grade 6 - 8)", numeric: 6 },
                  { name: "Secondary / Matriculation (Grade 9 - 10)", numeric: 9 },
                ]
            ).map((c, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-white/10 bg-[#071526]/60 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{c.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Comprehensive syllabus covering Mathematics, Sciences, Languages, Social Sciences, and Computer Literacy.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Campus Facilities ── */}
      <section id="facilities" className="py-20 px-4 border-t border-white/10 bg-[#061426]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Campus Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Campus Facilities
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Facilities published by the school administration.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Library,
                name: "Central Library",
                desc: "Thousands of books, references, and quiet study alcoves.",
              },
              {
                icon: FlaskConical,
                name: "Science Laboratories",
                desc: "Fully equipped Physics, Chemistry, and Biology workbenches.",
              },
              {
                icon: Monitor,
                name: "Computer Lab",
                desc: "High-speed network and modern workstations for coding.",
              },
              {
                icon: Bus,
                name: "Safe Transport",
                desc: "Dedicated route buses with experienced drivers and staff.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h4 className="text-base font-black text-white">{f.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Admissions & Enquiry ── */}
      <section id="admissions" className="py-20 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Admissions Open
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
              Join the {school.name} Family
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Use the enquiry form to contact the school administration. Admissions information shown here should be published and maintained by the school.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Required documents will be published by the school.",
                "Admission requirements will be published by the school.",
                "School-specific requirements",
                "Guardian information",
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 size={15} className="text-cyan-400 shrink-0" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-[#071628] shadow-2xl">
            <h3 className="text-lg font-black text-white mb-4">
              Admissions Enquiry Form
            </h3>

            {enquirySent ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                <h4 className="font-black text-white text-sm">Enquiry Submitted</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Thank you! Our admissions coordinator will contact you shortly via phone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    required
                    value={enquiryForm.studentName}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, studentName: e.target.value })
                    }
                    placeholder="e.g. Ali Ahmed"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Parent / Guardian Contact Phone *
                  </label>
                  <input
                    required
                    value={enquiryForm.phone}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, phone: e.target.value })
                    }
                    placeholder="0300-1234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Seeking Admission In Grade
                  </label>
                  <input
                    value={enquiryForm.gradeSeeking}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, gradeSeeking: e.target.value })
                    }
                    placeholder="e.g. Grade 5 / Matric Part 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Message / Special Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={enquiryForm.message}
                    onChange={(e) =>
                      setEnquiryForm({ ...enquiryForm, message: e.target.value })
                    }
                    placeholder="Any questions about curriculum, bus transport, or fees..."
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  Submit Admissions Enquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 7. School Gallery ── */}
      <section id="gallery" className="py-20 px-4 border-t border-white/10 bg-[#061426]/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Campus Life
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Life at {school.name}
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              School gallery images can be published by the school administration.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Classroom Learning",
              "Annual Sports Day",
              "Science Fair",
              "Art & Culture",
            ].map((title, i) => (
              <div
                key={i}
                className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-900/20 via-blue-900/30 to-indigo-900/40 p-5 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="relative z-10 font-bold text-xs text-white">
                  {title}
                </p>
                <span className="relative z-10 text-[10px] text-cyan-300 font-semibold">
                  School Gallery
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Contact Section ── */}
      <section id="contact" className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Campus Location & Directory
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Contact details and visiting information published by the school administration.
            </p>

            <div className="mt-8 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Address</p>
                  <p className="text-slate-400 mt-0.5">{campusLocation}</p>
                </div>
              </div>

              {school.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Contact Phone</p>
                    <p className="text-slate-400 mt-0.5">{school.phone}</p>
                  </div>
                </div>
              )}

              {school.email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Official Email</p>
                    <p className="text-slate-400 mt-0.5">{school.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-[#071628] flex flex-col justify-center">
            <h3 className="text-base font-black text-white mb-2">
              Staff & Student Access
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Authorized students, parents, teachers, and administrators can use the school portal for their accounts and school services.
            </p>
            <Link
              to={`/${school.slug}/login`}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs text-center shadow-lg shadow-cyan-500/25 hover:brightness-110 transition cursor-pointer"
            >
              Sign In to {school.name} Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Footer ── */}
      <footer className="border-t border-white/10 py-10 px-4 bg-[#020710] text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {school.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-cyan-400 hover:underline">
              Powered by SchoolOS Cloud
            </Link>
            <Link to="/school-login" className="hover:text-slate-300">
              Browse Schools
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
