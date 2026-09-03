import "@/styles/design-system.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SchoolLogin from "@/pages/SchoolLogin";
import RegisterSchool from "@/pages/RegisterSchool";
import AdminLogin from "@/pages/AdminLogin";
import StudentPortal from "@/pages/StudentPortal";

const NotFound = () => <div className="min-h-screen bg-background flex items-center justify-center text-center px-6"><div><div className="text-8xl font-black gradient-text-primary mb-4">404</div><h2 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h2><p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p><a href="/" className="px-6 py-3 rounded-xl gradient-bg-primary text-white font-semibold">Go Home</a></div></div>;
const Unauthorized = () => <div className="min-h-screen bg-background flex items-center justify-center text-center px-6"><div><div className="text-8xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">403</div><h2 className="text-2xl font-bold text-foreground mb-3">Access Denied</h2><p className="text-muted-foreground mb-8">You don't have permission to view this page.</p><a href="/school-login" className="px-6 py-3 rounded-xl gradient-bg-primary text-white font-semibold">Back to Login</a></div></div>;
const TenantRedirect = ({ to }: { to: string }) => { const { user, isAuthenticated, isLoading } = useAuth(); if (isLoading) return null; if (!isAuthenticated || !user) return <Navigate to="/school-login" replace />; if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />; if (!user.schoolSlug) return <Navigate to="/unauthorized" replace />; return <Navigate to={`/${user.schoolSlug}/${to}`} replace />; };

export default function App() { return <ThemeProvider><AuthProvider><BrowserRouter><Routes>
  <Route path="/" element={<LandingPage />} /><Route path="/portal" element={<PortalSelector />} /><Route path="/school-login" element={<SchoolLogin />} /><Route path="/register-school" element={<RegisterSchool />} /><Route path="/admin-login" element={<AdminLogin />} /><Route path="/admin" element={<Navigate to="/admin-login" replace />} /><Route path="/admin/login" element={<Navigate to="/admin-login" replace />} />
  <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} /><Route path="/:schoolSlug/login" element={<AuthLayout />}><Route index element={<LoginPage />} /></Route><Route path="/login" element={<Navigate to="/school-login" replace />} />
  {['dashboard','students','teachers','parents','classes','staff','homework','exams','timetable','notices','transport','reports','subscription','attendance','notifications','finance','settings','buildings','student-portal'].map(path => <Route key={path} path={`/${path}`} element={<TenantRedirect to={path === 'teachers' ? 'staff' : path} />} />)}
  <Route path="/:schoolSlug" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<Dashboard />} /><Route path="settings" element={<Settings />} /><Route path="buildings" element={<BuildingManagement />} /><Route path="classes" element={<Classes />} /><Route path="teachers" element={<Navigate to="staff" replace />} /><Route path="students" element={<Students />} /><Route path="parents" element={<Parents />} /><Route path="finance" element={<Finance />} /><Route path="staff" element={<Staff />} /><Route path="homework" element={<Homework />} /><Route path="exams" element={<Exams />} /><Route path="timetable" element={<Timetable />} /><Route path="notices" element={<NoticeBoard />} /><Route path="transport" element={<Transport />} /><Route path="reports" element={<Reports />} /><Route path="subscription" element={<Subscription />} /><Route path="attendance" element={<AttendanceAdmin />} /><Route path="attendance/mark" element={<Attendance />} /><Route path="notifications" element={<Notifications />} /><Route path="student-portal" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentPortal /></ProtectedRoute>} /><Route path="teacher/classes" element={<MyClasses />} /><Route path="teacher/attendance" element={<TeacherAttendance />} /><Route path="teacher/grades" element={<Grades />} />
  </Route><Route path="/unauthorized" element={<Unauthorized />} /><Route path="/404" element={<NotFound />} /><Route path="*" element={<Navigate to="/404" replace />} />
</Routes><Toaster position="top-right" richColors /></BrowserRouter></AuthProvider></ThemeProvider>; }
