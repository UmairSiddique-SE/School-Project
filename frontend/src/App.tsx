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
import { useAuth } from "@/context/AuthContext";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SchoolLogin from "@/pages/SchoolLogin";
import SchoolOnboarding from "@/pages/SchoolOnboarding";
import AdminLogin from "@/pages/AdminLogin";

const NotFound = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div><div className="text-8xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">404</div><h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2><p className="text-white/50 mb-8">The page you're looking for doesn't exist or has been moved.</p><a href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold">Go Home</a></div>
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div><div className="text-8xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">403</div><h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2><p className="text-white/50 mb-8">You don't have permission to view this page.</p><a href="/school-login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold">Back to Login</a></div>
  </div>
);

const TenantRedirect = ({ to }: { to: string }) => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (!user) return <Navigate to="/school-login" replace />;
  const slug = user.schoolSlug || "edusphere";
  return <Navigate to={`/${slug}/${to}`} replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/portal" element={<PortalSelector />} />

            {/* Public onboarding/auth */}
            <Route path="/school-login" element={<SchoolLogin />} />
            <Route path="/register-school" element={<SchoolOnboarding />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />

            <Route path="/:schoolSlug/login" element={<AuthLayout />}><Route index element={<LoginPage />} /></Route>
            <Route path="/login" element={<Navigate to="/school-login" replace />} />

            {/* Legacy/top-level tenant links resolve to the logged-in school's real route. */}
            <Route path="/dashboard" element={<TenantRedirect to="dashboard" />} />
            <Route path="/students" element={<TenantRedirect to="students" />} />
            <Route path="/teachers" element={<TenantRedirect to="staff" />} />
            <Route path="/parents" element={<TenantRedirect to="parents" />} />
            <Route path="/classes" element={<TenantRedirect to="classes" />} />
            <Route path="/sections" element={<TenantRedirect to="sections" />} />
            <Route path="/subjects" element={<TenantRedirect to="subjects" />} />
            <Route path="/staff" element={<TenantRedirect to="staff" />} />
            <Route path="/homework" element={<TenantRedirect to="homework" />} />
            <Route path="/exams" element={<TenantRedirect to="exams" />} />
            <Route path="/results" element={<TenantRedirect to="results" />} />
            <Route path="/timetable" element={<TenantRedirect to="timetable" />} />
            <Route path="/notices" element={<TenantRedirect to="notices" />} />
            <Route path="/transport" element={<TenantRedirect to="transport" />} />
            <Route path="/reports" element={<TenantRedirect to="reports" />} />
            <Route path="/subscription" element={<TenantRedirect to="subscription" />} />
            <Route path="/attendance" element={<TenantRedirect to="attendance" />} />
            <Route path="/notifications" element={<TenantRedirect to="notifications" />} />
            <Route path="/finance" element={<TenantRedirect to="finance" />} />
            <Route path="/settings" element={<TenantRedirect to="settings" />} />
            <Route path="/profile" element={<TenantRedirect to="profile" />} />
            <Route path="/buildings" element={<TenantRedirect to="buildings" />} />

            <Route path="/:schoolSlug" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Settings />} />
              <Route path="buildings" element={<BuildingManagement />} />
              <Route path="classes" element={<Classes />} />
              <Route path="sections" element={<Classes />} />
              <Route path="subjects" element={<Classes />} />
              <Route path="teachers" element={<Navigate to="staff" replace />} />
              <Route path="students" element={<Students />} />
              <Route path="parents" element={<Parents />} />
              <Route path="finance" element={<Finance />} />
              <Route path="staff" element={<Staff />} />
              <Route path="homework" element={<Homework />} />
              <Route path="exams" element={<Exams />} />
              <Route path="results" element={<Exams />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="notices" element={<NoticeBoard />} />
              <Route path="transport" element={<Transport />} />
              <Route path="reports" element={<Reports />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="attendance" element={<AttendanceAdmin />} />
              <Route path="attendance/mark" element={<Attendance />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="teacher/classes" element={<MyClasses />} />
              <Route path="teacher/attendance" element={<TeacherAttendance />} />
              <Route path="teacher/grades" element={<Grades />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors toastOptions={{ style: { background: "hsl(224 71.4% 4.1%)", border: "1px solid hsl(215 27.9% 16.9%)", color: "#fff" } }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
