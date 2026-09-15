import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={
          allowedRoles?.includes("SUPER_ADMIN")
            ? "/admin/login"
            : "/school-login"
        }
        replace
      />
    );
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // A newly verified paid school must stay inside onboarding/payment.
  // No school portal route is available until Super Admin approval activates it.
  if (
    user?.role === "SCHOOL_ADMIN" &&
    user.activationStatus === "PAYMENT_PENDING"
  ) {
    return <Navigate to="/register-school" replace />;
  }

  return <>{children}</>;
};
