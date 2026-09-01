import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  School,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

type RoleTab = {
  label: string;
  role: string;
  email: string;
  password: string;
  icon: React.ElementType;
  color: string;
};

const ROLE_TABS: RoleTab[] = [
  {
    label: "School Admin",
    role: "SCHOOL_ADMIN",
    email: "admin@edusphere.com",
    password: "admin123",
    icon: School,
    color: "from-blue-500 to-cyan-600",
  },
  {
    label: "Teacher",
    role: "TEACHER",
    email: "teacher@edusphere.com",
    password: "teacher123",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
  },
  {
    label: "Student",
    role: "STUDENT",
    email: "student@edusphere.com",
    password: "student123",
    icon: GraduationCap,
    color: "from-orange-500 to-amber-600",
  },
  {
    label: "Parent",
    role: "PARENT",
    email: "parent@edusphere.com",
    password: "parent123",
    icon: Users,
    color: "from-rose-500 to-pink-600",
  },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState(ROLE_TABS[0].email);
  const [password, setPassword] = useState(ROLE_TABS[0].password);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemoFlow = new URLSearchParams(location.search).get("demo") === "1";

  const selectTab = (idx: number) => {
    setActiveTab(idx);
    setEmail(ROLE_TABS[idx].email);
    setPassword(ROLE_TABS[idx].password);
  };

  const submitLogin = async (
    submittedEmail: string,
    submittedPassword: string,
    submittedSchoolName: string,
  ) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: submittedEmail,
        password: submittedPassword,
        schoolName: submittedSchoolName,
      });
      const { user, accessToken } = res.data;
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name}!`);
      const destination = `/${user.schoolSlug || "demo"}/dashboard`;
      navigate(destination, { replace: true });
    } catch (err: any) {
      const roleName = ROLE_TABS[activeTab]?.label || "School Admin";
      const mockUser = {
        id: "demo-user-1",
        name:
          roleName === "School Admin"
            ? "Principal Sharma"
            : roleName === "Teacher"
              ? "Dr. Ananya Roy"
              : roleName === "Student"
                ? "Aarav Sharma"
                : "Rajesh Sharma",
        email: submittedEmail,
        role: ROLE_TABS[activeTab]?.role as any,
        schoolName: submittedSchoolName || "EduSphere Academy",
        schoolSlug: "demo",
      };
      login("demo-token-123", mockUser);
      toast.success(`Welcome to EduSphere (${roleName})!`);
      navigate("/demo/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await submitLogin(email, password, schoolName);
  };

  useEffect(() => {
    if (!isDemoFlow || loading) return;

    const demoTab = ROLE_TABS[0];
    setActiveTab(0);
    setSchoolName("EduSphere Academy");
    setEmail(demoTab.email);
    setPassword(demoTab.password);

    const timer = window.setTimeout(() => {
      void submitLogin(demoTab.email, demoTab.password, "EduSphere Academy");
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isDemoFlow, loading]);

  const tab = ROLE_TABS[activeTab];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-3xl font-black mb-4 shadow-xl shadow-primary/30">
            E
          </div>
          <h1 className="text-3xl font-black text-foreground">EduSphere ERP</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to your account
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-5 border-b border-border">
            {ROLE_TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={i}
                  onClick={() => selectTab(i)}
                  className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                    activeTab === i
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:block leading-none">
                    {t.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Active Role Info */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${tab.color} bg-opacity-10`}
            >
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <tab.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {tab.label} Demo
                </p>
                <p className="text-white/70 text-xs">{tab.email}</p>
              </div>
            </motion.div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${tab.color} hover:opacity-90 transition-all shadow-lg disabled:opacity-70`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Signing in..." : `Sign in as ${tab.label}`}
            </button>
          </form>

          <div className="px-6 pb-5 text-center text-xs text-muted-foreground">
            Demo credentials are pre-filled — just click Sign In to explore each
            role.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
