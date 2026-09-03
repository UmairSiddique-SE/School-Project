import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps { children: React.ReactNode; allowedRoles?: string[]; }

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to={allowedRoles?.includes("SUPER_ADMIN") ? "/admin-login" : "/school-login"} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  if (schoolSlug && user.role !== 'SUPER_ADMIN' && user.schoolSlug !== schoolSlug) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};
