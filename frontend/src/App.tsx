import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

// Layouts
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Routes
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import Parents from "@/pages/Parents";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";
import { MyClasses, Attendance as TeacherAttendance, Grades } from "@/pages/TeacherPages";
import Attendance from "@/pages/Attendance";

// New Pages
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

const NotFound = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div>
      <div className="text-8xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
      <p className="text-white/50 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:scale-105 transition-transform"
      >
        Go Home
      </a>
    </div>
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen bg-[#030817] flex items-center justify-center text-center px-6">
    <div>
      <div className="text-8xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
        403
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
      <p className="text-white/50 mb-8">
        You don't have permission to view this page.
      </p>
      <a
        href="/dashboard"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:scale-105 transition-transform"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

// Helper to redirect top-level direct URLs to tenant-namespaced routes
const TenantRedirect = ({ to }: { to: string }) => {
  const { user } = useAuth();
  const slug = user?.schoolSlug || "demo";
  return <Navigate to={`/${slug}/${to}`} replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/school-login" element={<SchoolLogin />} />
            <Route
              path="/demo-login"
              element={<Navigate to="/login?demo=1" replace />}
            />
            <Route path="/:schoolSlug/login" element={<AuthLayout />}>
              <Route index element={<LoginPage />} />
            </Route>
            <Route path="/login" element={<Navigate to="/school-login" replace />} />

            {/* Direct Shortcut Routes (Redirect to tenant-namespaced paths) */}
            <Route
              path="/dashboard"
              element={<TenantRedirect to="dashboard" />}
            />
            <Route
              path="/super-admin"
              element={<TenantRedirect to="super-admin" />}
            />
            <Route
              path="/students"
              element={<TenantRedirect to="students" />}
            />
            <Route
              path="/teachers"
              element={<TenantRedirect to="staff" />}
            />
            <Route path="/parents" element={<TenantRedirect to="students" />} />
            <Route path="/classes" element={<TenantRedirect to="classes" />} />
            <Route path="/staff" element={<TenantRedirect to="staff" />} />
            <Route
              path="/homework"
              element={<TenantRedirect to="homework" />}
            />
            <Route path="/exams" element={<TenantRedirect to="exams" />} />
            <Route
              path="/timetable"
              element={<TenantRedirect to="timetable" />}
            />
            <Route path="/notices" element={<TenantRedirect to="notices" />} />
            <Route
              path="/transport"
              element={<TenantRedirect to="transport" />}
            />
            <Route path="/reports" element={<TenantRedirect to="reports" />} />
            <Route
              path="/subscription"
              element={<TenantRedirect to="subscription" />}
            />
            <Route
              path="/attendance"
              element={<TenantRedirect to="attendance" />}
            />
            <Route
              path="/notifications"
              element={<TenantRedirect to="notifications" />}
            />
            <Route path="/finance" element={<TenantRedirect to="finance" />} />
            <Route
              path="/settings"
              element={<TenantRedirect to="settings" />}
            />
            <Route
              path="/buildings"
              element={<TenantRedirect to="buildings" />}
            />

            {/* Protected Dashboard Routes with schoolSlug */}
            <Route
              path="/:schoolSlug"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />
              <Route path="super-admin" element={<SuperAdminDashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="buildings" element={<BuildingManagement />} />

              {/* School Admin & Shared Portals */}
              <Route path="classes" element={<Classes />} />
              <Route path="teachers" element={<Navigate to="staff" replace />} />
              <Route path="students" element={<Students />} />
              <Route path="parents" element={<Navigate to="students" replace />} />
              <Route path="finance" element={<Finance />} />
              <Route path="staff" element={<Staff />} />
              <Route path="homework" element={<Homework />} />
              <Route path="exams" element={<Exams />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="notices" element={<NoticeBoard />} />
              <Route path="transport" element={<Transport />} />
              <Route path="reports" element={<Reports />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="attendance" element={<AttendanceAdmin />} />
              <Route path="attendance/mark" element={<Attendance />} />
              <Route path="notifications" element={<Notifications />} />

              {/* Teacher */}
              <Route path="teacher/classes" element={<MyClasses />} />
              <Route path="teacher/attendance" element={<TeacherAttendance />} />
              <Route path="teacher/grades" element={<Grades />} />
            </Route>

            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(224 71.4% 4.1%)",
              border: "1px solid hsl(215 27.9% 16.9%)",
              color: "#fff",
            },
          }}
          richColors
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
