import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import PortalSelector from "@/pages/PortalSelector";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import Parents from "@/pages/Parents";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";
import { MyClasses, Attendance as TeacherAttendance, Grades } from "@/pages/TeacherPages";
import Attendance from "@/pages/Attendance";
import Staff from "@/pages/Staff";
import Homework from "@/pages/Homework";
import Exams from "@/pages/Exams";
import Timetable from "@/pages/Timetable";
import NoticeBoard from "@/pages/NoticeBoard";
import Transport from "@/pages/Transport";
import Reports from "@/pages/Reports";
import Subscription from "@/pages/Subscription";
import AttendanceAdmin from "@/pages/AttendanceAdmin";
import Notifications from "@/pages/Notifications";
import BuildingManagement from "@/pages/BuildingManagement";
import StudentPortal from "@/pages/StudentPortal";
import { useAuth } from "@/context/AuthContext";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SchoolLogin from "@/pages/SchoolLogin";
import RegisterSchool from "@/pages/RegisterSchool";
import AdminLogin from "@/pages/AdminLogin";

const NotFound = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div>
      <div className="text-8xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">404</div>
      <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
      <p className="text-white/50 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:scale-105 transition-transform">Go Home</a>
    </div>
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div>
      <div className="text-8xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">403</div>
      <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
      <p className="text-white/50 mb-8">You don't have permission to view this page.</p>
      <a href="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:scale-105 transition-transform">Back to Dashboard</a>
    </div>
  </div>
);

const TenantRedirect = ({ to }: { to: string }) => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  const slug = user?.schoolSlug || "edusphere";
  return <Navigate to={`/${slug}/${to}`} replace />;
};

const AttendanceRedirect = () => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  const slug = user?.schoolSlug || "edusphere";
  if (user?.role === "TEACHER") return <Navigate to={`/${slug}/teacher/attendance`} replace />;
  if (user?.role === "STUDENT" || user?.role === "PARENT") return <Navigate to={`/${slug}/student-portal`} replace />;
  return <Navigate to={`/${slug}/attendance`} replace />;
};

const TenantRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>
);

const SCHOOL_ROLES = ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"];
const ADMIN_TEACHER = ["SCHOOL_ADMIN", "TEACHER"];
const ADMIN_ONLY = ["SCHOOL_ADMIN"];
const STUDENT_ONLY = ["STUDENT"];
const STUDENT_PARENT = ["SCHOOL_ADMIN", "STUDENT", "PARENT"];
const ACADEMIC_READ = ["SCHOOL_ADMIN", "TEACHER", "STUDENT", "PARENT"];

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/portal" element={<PortalSelector />} />
            <Route path="/school-login" element={<SchoolLogin />} />
            <Route path="/register-school" element={<RegisterSchool />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />

            <Route path="/:schoolSlug/login" element={<AuthLayout />}><Route index element={<LoginPage />} /></Route>
            <Route path="/login" element={<Navigate to="/school-login" replace />} />

            <Route path="/dashboard" element={<TenantRedirect to="dashboard" />} />
            <Route path="/students" element={<TenantRedirect to="students" />} />
            <Route path="/teachers" element={<TenantRedirect to="staff" />} />
            <Route path="/parents" element={<TenantRedirect to="parents" />} />
            <Route path="/classes" element={<TenantRedirect to="classes" />} />
            <Route path="/staff" element={<TenantRedirect to="staff" />} />
            <Route path="/homework" element={<TenantRedirect to="homework" />} />
            <Route path="/exams" element={<TenantRedirect to="exams" />} />
            <Route path="/timetable" element={<TenantRedirect to="timetable" />} />
            <Route path="/notices" element={<TenantRedirect to="notices" />} />
            <Route path="/transport" element={<TenantRedirect to="transport" />} />
            <Route path="/reports" element={<TenantRedirect to="reports" />} />
            <Route path="/subscription" element={<TenantRedirect to="subscription" />} />
            <Route path="/attendance" element={<AttendanceRedirect />} />
            <Route path="/notifications" element={<TenantRedirect to="notifications" />} />
            <Route path="/finance" element={<TenantRedirect to="finance" />} />
            <Route path="/settings" element={<TenantRedirect to="settings" />} />
            <Route path="/buildings" element={<TenantRedirect to="buildings" />} />
            <Route path="/student-portal" element={<TenantRedirect to="student-portal" />} />

            <Route path="/:schoolSlug" element={<ProtectedRoute allowedRoles={SCHOOL_ROLES}><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><Dashboard /></TenantRoute>} />
              <Route path="settings" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Settings /></TenantRoute>} />
              <Route path="buildings" element={<TenantRoute allowedRoles={ADMIN_ONLY}><BuildingManagement /></TenantRoute>} />
              <Route path="classes" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Classes /></TenantRoute>} />
              <Route path="teachers" element={<Navigate to="staff" replace />} />
              <Route path="students" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Students /></TenantRoute>} />
              <Route path="parents" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Parents /></TenantRoute>} />
              <Route path="finance" element={<TenantRoute allowedRoles={STUDENT_PARENT}><Finance /></TenantRoute>} />
              <Route path="staff" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Staff /></TenantRoute>} />
              <Route path="homework" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Homework /></TenantRoute>} />
              <Route path="exams" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Exams /></TenantRoute>} />
              <Route path="timetable" element={<TenantRoute allowedRoles={ACADEMIC_READ}><Timetable /></TenantRoute>} />
              <Route path="notices" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><NoticeBoard /></TenantRoute>} />
              <Route path="transport" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><Transport /></TenantRoute>} />
              <Route path="reports" element={<TenantRoute allowedRoles={ADMIN_TEACHER}><Reports /></TenantRoute>} />
              <Route path="subscription" element={<TenantRoute allowedRoles={ADMIN_ONLY}><Subscription /></TenantRoute>} />
              <Route path="attendance" element={<TenantRoute allowedRoles={["SCHOOL_ADMIN"]}><AttendanceAdmin /></TenantRoute>} />
              <Route path="attendance/mark" element={<TenantRoute allowedRoles={["SCHOOL_ADMIN", "TEACHER"]}><Attendance /></TenantRoute>} />
              <Route path="notifications" element={<TenantRoute allowedRoles={SCHOOL_ROLES}><Notifications /></TenantRoute>} />
              <Route path="student-portal" element={<TenantRoute allowedRoles={STUDENT_ONLY}><StudentPortal /></TenantRoute>} />
              <Route path="teacher/classes" element={<TenantRoute allowedRoles={["TEACHER"]}><MyClasses /></TenantRoute>} />
              <Route path="teacher/attendance" element={<TenantRoute allowedRoles={["TEACHER"]}><TeacherAttendance /></TenantRoute>} />
              <Route path="teacher/grades" element={<TenantRoute allowedRoles={["TEACHER"]}><Grades /></TenantRoute>} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ background: "hsl(224 71.4% 4.1%)", border: "1px solid hsl(215 27.9% 16.9%)", color: "#fff" }} richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
