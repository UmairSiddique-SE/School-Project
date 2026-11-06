import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={allowedRoles?.includes("SUPER_ADMIN") ? "/admin/login" : "/school-login"}
        replace
      />
    );
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
    if (user?.schoolSlug) {
      if (user.role === "STUDENT") return <Navigate to={`/${user.schoolSlug}/student-portal`} replace />;
      if (user.role === "TEACHER") return <Navigate to={`/${user.schoolSlug}/teacher/classes`} replace />;
      if (user.role === "PARENT") return <Navigate to={`/${user.schoolSlug}/parent-portal`} replace />;
      return <Navigate to={`/${user.schoolSlug}/dashboard`} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  const onboardingLocked =
    user?.role === "SCHOOL_ADMIN" &&
    user.activationStatus &&
    user.activationStatus !== "ACTIVE";

  if (onboardingLocked && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
