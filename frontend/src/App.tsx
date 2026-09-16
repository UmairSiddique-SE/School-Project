import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import DashboardLayout from "@/layouts/DashboardLayoutPremium";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PortalSelector = lazy(() => import("@/pages/PortalSelector"));
const LoginPage = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Classes = lazy(() => import("@/pages/ClassesLive"));
const Students = lazy(() => import("@/pages/StudentsPremium"));
const Teachers = lazy(() => import("@/pages/Teachers"));
const Parents = lazy(() => import("@/pages/Parents"));
const ParentPortal = lazy(() => import("@/pages/ParentPortal"));
const Finance = lazy(() => import("@/pages/Finance"));
const Settings = lazy(() => import("@/pages/Settings"));
const Staff = lazy(() => import("@/pages/Staff"));
const Homework = lazy(() => import("@/pages/Homework"));
const Exams = lazy(() => import("@/pages/ExamsLive"));
const Timetable = lazy(() => import("@/pages/TimetableLive"));
const NoticeBoard = lazy(() => import("@/pages/NoticeBoardLive"));
const Transport = lazy(() => import("@/pages/Transport"));
const Reports = lazy(() => import("@/pages/ReportsLive"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const AttendanceLive = lazy(() => import("@/pages/AttendanceLive"));
const Notifications = lazy(() => import("@/pages/NotificationsLive"));
const BuildingManagement = lazy(() => import("@/pages/BuildingManagement"));
const StudentPortal = lazy(() => import("@/pages/StudentPortal"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const SchoolLogin = lazy(() => import("@/pages/SchoolLogin"));
const RegisterSchool = lazy(() => import("@/pages/RegisterSchoolPremium"));
const SchoolPlanSelection = lazy(() => import("@/pages/SchoolPlanSelection"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));

const PageLoader = () => <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
const NotFound = () => <div className="min-h-screen bg-background flex items-center justify-center text-center px-6"><div><div className="text-8xl font-black bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4">404</div><h2 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h2><p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p><a href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold">Go Home</a></div></div>;
const Unauthorized = () => <div className="min-h-screen bg-background flex items-center justify-center text-center px-6"><div><div className="text-8xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">403</div><h2 className="text-2xl font-bold text-foreground mb-3">Access Denied</h2><p className="text-muted-foreground mb-8">You don't have permission to view this page.</p></div></div>;
const TenantRedirect = ({ to }: { to: string }) => { const { user } = useAuth(); if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />; if (user?.role === "PARENT" && to === "dashboard") return <Navigate to={`/${user?.schoolSlug || "edusphere"}/parent-portal`} replace />; return <Navigate to={`/${user?.schoolSlug || "edusphere"}/${to}`} replace />; };
const AttendanceRedirect = () => { const { user } = useAuth(); if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />; const slug = user?.schoolSlug || "edusphere"; if (user?.role === "PARENT") return <Navigate to={`/${slug}/parent-portal`} replace />; if (user?.role === "TEACHER") return <Navigate to={`/${slug}/teacher/attendance`} replace />; if (user?.role === "STUDENT") return <Navigate to={`/${slug}/student-portal`} replace />; return <Navigate to={`/${slug}/attendance`} replace />; };
const TenantHome = () => { const { user } = useAuth(); const slug = user?.schoolSlug || "edusphere"; if (user?.role === "STUDENT") return <Navigate to={`/${slug}/dashboard`} replace />; return <Navigate to={`/${slug}/dashboard`} replace />; };
const TenantRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) => <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
const SCHOOL_ROLES = ["SCHOOL_ADMIN", "TEACHER", "STUDENT"];
const DASHBOARD_ROLES = ["SCHOOL_ADMIN", "TEACHER", "STUDENT"];
const ADMIN_TEACHER = ["SCHOOL_ADMIN", "TEACHER"];
const ADMIN_ONLY = ["SCHOOL_ADMIN"];
const STUDENT_ONLY = ["STUDENT"];
const PARENT_ONLY = ["PARENT"];
const ACADEMIC_READ = ["SCHOOL_ADMIN", "TEACHER", "STUDENT"];

export default function App() {
  return <ThemeProvider><AuthProvider><BrowserRouter><Suspense fallback={<PageLoader />}><Routes>
    <Route path="/" element={<LandingPage />} /><Route path="/portal" element={<PortalSelector />} /><Route path="/school-login" element={<SchoolLogin />} /><Route path="/school-login/:schoolSlug" element={<LoginPage />} /><Route path="/register-school" element={<RegisterSchool />} /><Route path="/register-school/plans" element={<SchoolPlanSelection />} /><Route path="/register-school/form" element={<RegisterSchool />} /><Route path="/admin-login" element={<AdminLogin />} /><Route path="/admin" element={<AdminLogin />} /><Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["SCHOOL_ADMIN"]}><Onboarding /></ProtectedRoute>} />
    <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />
    <Route path="/:schoolSlug/parent-portal" element={<ProtectedRoute allowedRoles={PARENT_ONLY}><ParentPortal /></ProtectedRoute>} />
    <Route path="/:schoolSlug/login" element={<LoginPage />} /><Route path="/login" element={<Navigate to="/school-login" replace />} />
    <Route path="/dashboard" element={<TenantRedirect to="dashboard" />} /><Route path="/students" element={<TenantRedirect to="students" />} /><Route path="/parents" element={<TenantRedirect to="parents" />} /><Route path="/teachers" element={<TenantRedirect to="teachers" />} /><Route path="/staff" element={<TenantRedirect to="staff" />} /><Route path="/homework" element={<TenantRedirect to="homework" />} /><Route path="/exams" element={<TenantRedirect to="exams" />} /><Route path="/timetable" element={<TenantRedirect to="timetable" />} /><Route path="/notices" element={<TenantRedirect to="notices" />} /><Route path="/transport" element={<TenantRedirect to="transport" />} /><Route path="/reports" element={<TenantRedirect to="reports" />} /><Route path="/subscription" element={<TenantRedirect to="subscription" />} /><Route path="/attendance" element={<AttendanceRedirect />} /><Route path="/notifications" element={<TenantRedirect to="notifications" />} /><Route path="/finance" element={<TenantRedirect to="finance" />} /><Route path="/settings" element={<TenantRedirect to="settings" />} /><Route path="/buildings" element={<TenantRedirect to="buildings" />} /><Route path="/student-portal" element={<TenantRedirect to="student-portal" />} /><Route path="/parent-portal" element={<TenantRedirect to="parent-portal" />} />
    <Route path="/:schoolSlug" element={<ProtectedRoute allowedRoles={SCHOOL_ROLES}><DashboardLayout /></ProtectedRoute>}><Route index element={<TenantHome />} /><Route path="dashboard" element={<TenantRoute allowedRoles={DASHBOARD_ROLES}><Dashboard /></TenantRoute>} /><Route path="settings" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Settings /></TenantRoute>} /><Route path="buildings" element={<TenantRoute allowedRoles={ADMIN_ONLY}><BuildingManagement /></TenantRoute>} /><Route path="classes" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Classes /></TenantRoute>} /><Route path="teachers" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Teachers /></TenantRoute>} /><Route path="students" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Students /></TenantRoute>} /><Route path="parents" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Parents /></TenantRoute>} /><Route path="finance" element={<TenantRoute allowedRoles={["SCHOOL_ADMIN", "STUDENT"]}><Finance /></TenantRoute>} /><Route path="staff" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Staff /></TenantRoute>} /><Route path="homework" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Homework /></TenantRoute>} /><Route path="exams" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Exams /></TenantRoute>} /><Route path="timetable" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Timetable /></TenantRoute>} /><Route path="notices" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><NoticeBoard /></TenantRoute>} /><Route path="transport" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><Transport /></TenantRoute>} /><Route path="reports" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Reports /></TenantRoute>} /><Route path="subscription" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Subscription /></TenantRoute>} /><Route path="attendance" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><AttendanceLive /></TenantRoute>} /><Route path="attendance/mark" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><AttendanceLive /></TenantRoute>} /><Route path="notifications" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><Notifications /></TenantRoute>} /><Route path="student-portal" element={<TenantRoute allowedRoles={STUDENT_ONLY}><StudentPortal /></TenantRoute>} /><Route path="teacher/classes" element={<TenantRoute allowedRoles={["TEACHER"]}><Classes /></TenantRoute>} /><Route path="teacher/attendance" element={<TenantRoute allowedRoles={["TEACHER"]}><AttendanceLive /></TenantRoute>} /><Route path="teacher/grades" element={<TenantRoute allowedRoles={["TEACHER"]}><Exams /></TenantRoute>} /></Route><Route path="/unauthorized" element={<Unauthorized />} /><Route path="/404" element={<NotFound />} /><Route path="*" element={<Navigate to="/404" replace />} />
  </Routes></Suspense><Toaster position="top-right" richColors /></BrowserRouter></AuthProvider></ThemeProvider>;
}
