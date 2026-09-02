import { useState, useEffect, useRef } from "react";
import {
  motion,
  useAnimation,
  useInView,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import apiClient from "@/api/apiClient";
import { Link, useNavigate } from "react-router-dom";
import SchoolSearchModal from "@/component/SchoolSearchModal";
import { Search, Sun, Moon, ShieldCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
}
interface Feature {
  icon: string;
  title: string;
  description: string;
}
interface Module {
  icon: string;
  name: string;
  description: string;
  color: string;
}
interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}
interface Testimonial {
  name: string;
  role: string;
  school: string;
  content: string;
  avatar: string;
  rating: number;
}
interface FAQItem {
  question: string;
  answer: string;
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useScrollInView(threshold = 0.15) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const controls = useAnimation();
  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);
  return { ref, controls };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const features: Feature[] = [
  {
    icon: "🏫",
    title: "Multi-School Management",
    description:
      "Manage unlimited schools, campuses, and departments from a single unified dashboard with tenant isolation.",
  },
  {
    icon: "🔐",
    title: "Role-Based Access Control",
    description:
      "Granular permissions for Super Admin, School Admin, Teachers, Students, and Parents with full audit trails.",
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description:
      "Live dashboards with performance metrics, attendance trends, fee collection insights, and academic KPIs.",
  },
  {
    icon: "📱",
    title: "Mobile-First Design",
    description:
      "Fully responsive on all devices. Native mobile apps for iOS and Android coming soon for all stakeholders.",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    description:
      "AI-driven alerts for attendance anomalies, fee reminders, exam schedules, and parent-teacher communications.",
  },
  {
    icon: "🔗",
    title: "Third-Party Integrations",
    description:
      "Seamlessly integrate with payment gateways, SMS providers, Google Classroom, Zoom, and Microsoft Teams.",
  },
];

const modules: Module[] = [
  {
    icon: "📚",
    name: "Academics",
    description:
      "Curriculum planning, timetables, lesson plans, and digital content delivery.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: "✅",
    name: "Attendance",
    description:
      "Biometric & QR-based tracking with instant parent SMS notifications.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: "📝",
    name: "Examinations",
    description:
      "Online/offline exams, AI grading, rank sheets, and report card generation.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: "💳",
    name: "Finance & Fees",
    description:
      "Fee structure, online payments, receipts, and multi-gateway support.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: "🚌",
    name: "Transport",
    description:
      "GPS tracking, route management, driver assignments, and live bus location.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: "🏥",
    name: "Health Portal",
    description: "Medical records, health tracking, and student wellness logs.",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: "💬",
    name: "Communication Hub",
    description:
      "In-app messaging, announcements, event management, and parent portals.",
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    icon: "👩‍💼",
    name: "HR & Payroll",
    description:
      "Staff management, leave tracking, payslips, and performance reviews.",
    color: "from-sky-500 to-indigo-600",
  },
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: 49,
    period: "month",
    badge: undefined,
    highlighted: false,
    description: "Perfect for small single-campus institutions.",
    features: [
      "1 School / Campus",
      "Up to 500 Students",
      "5 Admin Users",
      "Core Academic Modules",
      "Basic Analytics",
      "Email Support",
    ],
  },
  {
    name: "Professional",
    price: 149,
    period: "month",
    badge: "Most Popular",
    highlighted: true,
    description: "Built for growing multi-campus institutions.",
    features: [
      "Up to 10 Schools",
      "Up to 5,000 Students",
      "Unlimited Admin Users",
      "All 8 Core Modules",
      "Advanced Analytics",
      "Priority Support",
      "API Access",
      "Custom Branding",
    ],
  },
  {
    name: "Enterprise",
    price: 0,
    period: "custom",
    badge: undefined,
    highlighted: false,
    description: "For large district-wide or chain school networks.",
    features: [
      "Unlimited Schools",
      "Unlimited Students",
      "Dedicated Infrastructure",
      "Custom Module Development",
      "SLA Guarantee",
      "24/7 Dedicated Support",
      "On-premise Option",
      "White-label Available",
    ],
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Principal",
    school: "Greenwood Academy",
    avatar: "SM",
    rating: 5,
    content:
      "EduSphere transformed how we manage our 3 campuses. The real-time analytics alone saved us countless hours every week. Our staff love the intuitive interface.",
  },
  {
    name: "Rajesh Kumar",
    role: "IT Director",
    school: "Global Learning Network",
    avatar: "RK",
    rating: 5,
    content:
      "We evaluated 12 ERP systems and EduSphere was the clear winner. Multi-tenant architecture, blazing fast performance, and outstanding customer support make it a world-class product.",
  },
  {
    name: "Emily Chen",
    role: "Finance Manager",
    school: "Bright Future Schools",
    avatar: "EC",
    rating: 5,
    content:
      "The fee management and payment gateway integrations are flawless. We went from 3-day fee reconciliation to real-time tracking. Absolutely game-changing for our network of 8 schools.",
  },
  {
    name: "Ahmed Al-Farsi",
    role: "Superintendent",
    school: "Dubai International Schools",
    avatar: "AA",
    rating: 5,
    content:
      "Managing 15 schools across the UAE was always complex. EduSphere gives us a single command center. The parent portal has dramatically improved our communication effectiveness.",
  },
];

const faqs: FAQItem[] = [
  {
    question: "How does multi-tenant school isolation work?",
    answer:
      "Each school gets its own isolated data environment with a unique slug/domain. Data is completely segregated at the database level — no school can ever access another school's data. Super Admins can view aggregate analytics across all schools.",
  },
  {
    question: "Can we migrate data from our existing system?",
    answer:
      "Yes! Our dedicated data migration team handles the complete migration from Excel, Google Sheets, or any existing ERP. We guarantee zero data loss with a full validation report post-migration.",
  },
  {
    question: "Is EduSphere compliant with data privacy regulations?",
    answer:
      "Absolutely. EduSphere is FERPA, GDPR, and COPPA compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We conduct regular third-party security audits.",
  },
  {
    question: "What payment gateways are supported?",
    answer:
      "We support Stripe, Razorpay, PayPal, Paytm, Flutterwave, and bank transfer options. Custom gateway integrations are available for Enterprise customers.",
  },
  {
    question: "Can we try EduSphere before committing?",
    answer:
      "Yes! You can explore our permanent demo account to understand EduSphere features before registering your school.",
  },
  {
    question: "What does the implementation timeline look like?",
    answer:
      "Starter and Professional plans are typically live within 48–72 hours. Enterprise implementations with custom modules and data migration average 2–4 weeks depending on scale.",
  },
];

// ─── Animated Background ──────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep radial gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0221] via-[#0f0a2e] to-[#030817]" />
      {/* Glowing orbs */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -80, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -50, 80, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute top-1/3 -right-48 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[130px]"
      />
      <motion.div
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -50, 70, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-600/15 blur-[100px]"
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-violet-400/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────
function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`relative py-24 lg:py-32 ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <motion.div variants={fadeUp} className="flex justify-center mb-4">
      <span className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-violet-500/10 border border-violet-500/30 text-violet-400">
        {text}
      </span>
    </motion.div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      variants={fadeUp}
      className="text-4xl md:text-5xl font-extrabold text-center text-white tracking-tight leading-tight mb-5"
    >
      {children}
    </motion.h2>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      variants={fadeUp}
      className="text-lg text-white/50 text-center max-w-2xl mx-auto mb-16 leading-relaxed"
    >
      {children}
    </motion.p>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onOpenSchoolSearch }: { onOpenSchoolSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}
      >
        <div
          className={`mx-auto max-w-7xl px-6 flex items-center justify-between rounded-2xl transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40" : ""}`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
              E
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              EduSphere <span className="text-violet-400">ERP</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* CTA & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-violet-400" />
              )}
            </button>

            {/* Super Admin Access Button */}
            <button
              onClick={() => navigate("/super-admin")}
              className="flex items-center gap-2 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 shadow-md hover:scale-105"
              title="Super Administrator Master Portal"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Super Admin</span>
            </button>

            {/* School Login Button */}
            <button
              onClick={() => navigate("/school-login")}
              className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <Search className="w-4 h-4 text-violet-400" />
              <span>School Login</span>
            </button>

            <button
              onClick={() => navigate("/register-school")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-200"
            >
              Register School
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mx-6 mt-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-white/70 hover:text-white font-medium transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-all border border-white/10"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Switch to Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-violet-400" />
                      <span>Switch to Dark Theme</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/super-admin");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-sm hover:bg-rose-500/25 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Super Admin Portal</span>
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/school-login");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Search className="w-4 h-4 text-white" />
                  <span>School Login</span>
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/register-school");
                  }}
                  className="mt-1 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold text-center"
                >
                  Register School
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onOpenSchoolSearch }: { onOpenSchoolSearch: () => void }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-6xl mx-auto px-6 text-center pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Now Available — Version 2.0
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] mb-8"
        >
          The Future of{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              School Management
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: 1.2,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full origin-left"
            />
          </span>{" "}
          is Here.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          EduSphere ERP is the enterprise-grade SaaS platform empowering{" "}
          <strong className="text-white/80">multi-school networks</strong> to
          streamline academics, finance, communication, and operations — all in
          one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
        >
          {/* Register School Button */}
          <button
            onClick={() => navigate("/register-school")}
            className="group relative px-9 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/60 hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2.5">
              Register School{" "}
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* School Login Button */}
          <button
            onClick={() => navigate("/school-login")}
            className="group px-8 py-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 hover:border-violet-400/40 text-white font-bold text-lg backdrop-blur-xl transition-all duration-300 flex items-center gap-2.5 shadow-lg"
          >
            <Search className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
            <span>School Login</span>
          </button>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="inline-flex flex-wrap justify-center gap-8 px-10 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          {[
            ["500+", "Schools"],
            ["2.4M+", "Students"],
            ["99.9%", "Uptime"],
            ["40+", "Countries"],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {val}
              </div>
              <div className="text-xs text-white/40 font-medium mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-white/50 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const { ref, controls } = useScrollInView();
  return (
    <Section
      id="features"
      className="bg-gradient-to-b from-black/0 to-black/20"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Features" />
          <SectionHeading>
            Everything You Need to Run a{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              World-Class School
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Built by educators and engineers, EduSphere gives you the tools that
            modern school management demands — with the elegance your staff
            deserves.
          </SectionSubtitle>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-violet-500/40 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <span className="text-4xl mb-5 block">{f.icon}</span>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {f.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Why Choose Us ─────────────────────────────────────────────────────────────
function WhyUs() {
  const { ref, controls } = useScrollInView();
  const reasons = [
    {
      num: "01",
      title: "Built for Scale",
      body: "Our multi-tenant PostgreSQL architecture and microservice-ready NestJS backend supports from 1 school to 10,000+ without a single config change.",
    },
    {
      num: "02",
      title: "No Vendor Lock-in",
      body: "Export your data in CSV, JSON, or PDF at any time. We believe your data belongs to you — always.",
    },
    {
      num: "03",
      title: "Continuous Innovation",
      body: "We ship new features every 2 weeks. Your plan auto-updates — no manual upgrades, no downtime, no extra fees.",
    },
    {
      num: "04",
      title: "Dedicated Onboarding",
      body: "Every account gets a dedicated onboarding specialist who configures your school, migrates your data, and trains your staff.",
    },
  ];
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 to-indigo-950/30" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Why EduSphere" />
          <SectionHeading>
            The ERP That{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              School Leaders
            </span>{" "}
            Trust
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ x: 6 }}
                className="flex gap-6 p-8 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-500"
              >
                <span className="text-5xl font-black bg-gradient-to-b from-violet-400/60 to-indigo-400/20 bg-clip-text text-transparent shrink-0">
                  {r.num}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {r.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {r.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Modules ─────────────────────────────────────────────────────────────────
function Modules() {
  const { ref, controls } = useScrollInView();
  return (
    <Section
      id="modules"
      className="bg-gradient-to-b from-transparent to-black/10"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Platform Modules" />
          <SectionHeading>
            One Platform,{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Every Function
            </span>
          </SectionHeading>
          <SectionSubtitle>
            From academics to payroll, EduSphere covers every critical function
            of your school operations — no third-party tools required.
          </SectionSubtitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group relative p-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden cursor-pointer"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                />
                <span className="text-4xl block mb-4">{m.icon}</span>
                <h3 className="text-lg font-bold text-white mb-2">{m.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {m.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Screenshots / Dashboard Preview ─────────────────────────────────────────
function Screenshots() {
  const { ref, controls } = useScrollInView();
  const screens = [
    {
      title: "Analytics Dashboard",
      tag: "Real-time",
      color: "from-violet-500 to-indigo-600",
    },
    {
      title: "Student Management",
      tag: "Organized",
      color: "from-indigo-500 to-blue-600",
    },
    {
      title: "Fee Collection",
      tag: "Automated",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Exam & Results",
      tag: "Smart",
      color: "from-fuchsia-500 to-pink-600",
    },
  ];
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Screenshots" />
          <SectionHeading>
            Stunning UI,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Powerful UX
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Every screen is crafted with pixel-perfect precision, built for
            speed, and optimized for daily use by school staff.
          </SectionSubtitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {screens.map((s, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -12, scale: 1.04 }}
                className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-video cursor-pointer"
              >
                {/* Mock UI preview */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-20`}
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="relative h-full flex flex-col p-5">
                  {/* Mock header */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {["bg-red-400", "bg-yellow-400", "bg-green-400"].map(
                      (c, j) => (
                        <div
                          key={j}
                          className={`w-2.5 h-2.5 rounded-full ${c} opacity-70`}
                        />
                      ),
                    )}
                  </div>
                  {/* Mock content bars */}
                  <div className="flex-1 space-y-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${s.color} w-3/4`}
                    />
                    <div className="h-1.5 rounded-full bg-white/20 w-full" />
                    <div className="h-1.5 rounded-full bg-white/20 w-5/6" />
                    <div className="h-1.5 rounded-full bg-white/10 w-2/3" />
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[40, 70, 55, 85, 35, 60].map((h, j) => (
                        <div
                          key={j}
                          className={`rounded-sm bg-gradient-to-t ${s.color} opacity-60`}
                          style={{ height: `${h}%`, minHeight: 8 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${s.color} text-white`}
                    >
                      {s.tag}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-end justify-start p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm font-bold text-white drop-shadow-lg">
                    {s.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const navigate = useNavigate();
  const { ref, controls } = useScrollInView();
  const [isAnnual, setIsAnnual] = useState(false);
  // Dynamic plans from API, fallback to static list
  const [plans, setPlans] = useState<PricingPlan[]>(pricingPlans);
  useEffect(() => {
    apiClient
      .get("/public/plans")
      .then((r) => {
        if (r.data && r.data.length > 0) {
          setPlans(
            r.data.map((p: any) => ({
              name: p.name,
              price: p.price,
              period: p.period || "month",
              description: p.description || "",
              features: Array.isArray(p.features)
                ? p.features
                : JSON.parse(p.features || "[]"),
              highlighted: p.planKey === "STANDARD",
              badge: p.planKey === "STANDARD" ? "Most Popular" : undefined,
            })),
          );
        }
      })
      .catch(() => {
        /* use static fallback */
      });
  }, []);
  return (
    <Section id="pricing">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Pricing" />
          <SectionHeading>
            Simple,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Start free. Scale without surprises. Cancel anytime.
          </SectionSubtitle>

          {/* Toggle */}
          <motion.div variants={fadeUp} className="flex justify-center mb-12">
            <div className="flex items-center gap-4 p-1.5 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isAnnual ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" : "text-white/50 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${isAnnual ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" : "text-white/50 hover:text-white"}`}
              >
                Annual{" "}
                <span className="ml-1.5 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-2xl border transition-all duration-500 ${
                  plan.highlighted
                    ? "border-violet-500/60 bg-gradient-to-b from-violet-500/10 to-indigo-500/5 shadow-2xl shadow-violet-500/20 scale-105"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-white/40">{plan.description}</p>
                </div>
                <div className="mb-8">
                  {plan.price === 0 ? (
                    <div className="text-4xl font-black text-white">Custom</div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-white">
                        ${isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                      </span>
                      <span className="text-white/40 mb-2">/mo</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3 h-3 text-violet-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/school-login")}
                  className={`block w-full py-3.5 rounded-xl text-center font-bold text-sm transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.price === 0 ? "Contact Sales" : "Get Started"}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const { ref, controls } = useScrollInView();
  return (
    <Section id="testimonials" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 to-indigo-950/20" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Testimonials" />
          <SectionHeading>
            Loved by{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Educators Worldwide
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Don't take our word for it — hear from the school leaders who
            transformed their institutions with EduSphere.
          </SectionSubtitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="group relative p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <span key={j} className="text-amber-400 text-lg">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-white/70 leading-relaxed mb-6 text-sm italic">
                    "{t.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {t.name}
                      </div>
                      <div className="text-white/40 text-xs">
                        {t.role} · {t.school}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQ() {
  const { ref, controls } = useScrollInView();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <Section className="bg-gradient-to-b from-transparent to-black/20">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="FAQ" />
          <SectionHeading>
            Common{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Questions
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Everything you need to know about EduSphere ERP.
          </SectionSubtitle>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="border border-white/10 rounded-2xl bg-white/[0.03] hover:border-violet-500/30 transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-semibold text-white text-sm">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 180 : 0 }}
                    className="shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50"
                  >
                    ↓
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm text-white/50 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Contact ─────────────────────────────────────────────────────────────────
function Contact() {
  const { ref, controls } = useScrollInView();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/public/contact", {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        schoolName: formData.school,
      });
      setSubmitted(true);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="contact" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 to-indigo-950/30" />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={stagger}
        >
          <SectionLabel text="Contact" />
          <SectionHeading>
            Ready to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Transform Your School?
            </span>
          </SectionHeading>
          <SectionSubtitle>
            Talk to our team and get a personalized demo tailored to your
            institution's needs.
          </SectionSubtitle>

          <motion.div
            variants={scaleIn}
            className="p-8 md:p-12 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Message Received!
                </h3>
                <p className="text-white/50">
                  Our team will reach out within 24 hours with a personalized
                  demo.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {[
                  {
                    id: "name",
                    label: "Full Name",
                    type: "text",
                    placeholder: "Dr. Jane Smith",
                  },
                  {
                    id: "email",
                    label: "Work Email",
                    type: "email",
                    placeholder: "jane@school.edu",
                  },
                  {
                    id: "school",
                    label: "School / Organization",
                    type: "text",
                    placeholder: "Greenwood Academy",
                  },
                ].map((field) => (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium text-white/60"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      value={(formData as any)[field.id]}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium text-white/60"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us about your school's challenges and goals..."
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm resize-none"
                  />
                </div>
                {error && (
                  <p className="md:col-span-2 text-sm text-red-400">{error}</p>
                )}
                <div className="md:col-span-2">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Request a Free Demo →"}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Product: ["Features", "Modules", "Pricing", "Changelog", "Roadmap"],
    Company: ["About Us", "Blog", "Careers", "Press Kit", "Contact"],
    Resources: [
      "Documentation",
      "API Reference",
      "Status Page",
      "Community",
      "Webinars",
    ],
    Legal: [
      "Privacy Policy",
      "Terms of Service",
      "GDPR",
      "Cookie Policy",
      "Security",
    ],
  };
  return (
    <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg">
                E
              </div>
              <span className="font-bold text-xl text-white">EduSphere</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              The enterprise-grade SaaS platform for multi-school management.
            </p>
            <div className="flex gap-3">
              {["𝕏", "in", "fb", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-xs font-bold"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-white/60 tracking-widest uppercase mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <span>
            © {new Date().getFullYear()} EduSphere ERP. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            Made with <span className="text-red-400">♥</span> for educators
            worldwide
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page Root ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [isSchoolSearchOpen, setIsSchoolSearchOpen] = useState(false);

  return (
    <>
      {/* SEO Meta — should be placed in index.html in production */}
      <div className="min-h-screen bg-[#030817] text-white font-sans overflow-x-hidden">
        <Navbar onOpenSchoolSearch={() => setIsSchoolSearchOpen(true)} />
        <Hero onOpenSchoolSearch={() => setIsSchoolSearchOpen(true)} />
        <Features />
        <WhyUs />
        <Modules />
        <Screenshots />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Contact />
        <Footer />
      </div>

      {/* VIP School Search Modal Dialog */}
      <SchoolSearchModal
        isOpen={isSchoolSearchOpen}
        onClose={() => setIsSchoolSearchOpen(false)}
      />
    </>
  );
}
