import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const { schoolSlug } = useParams();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page and save the attempted url
    return <Navigate to={schoolSlug ? `/${schoolSlug}/login` : "/login"} state={{ from: location }} replace />;
  }

  // Cross-tenant protection
  // If there's a schoolSlug in the URL, verify the user actually belongs to this school
  // Super Admins might bypass this, but typically users belong to a specific school
  if (schoolSlug && schoolSlug !== 'demo' && user.role !== 'SUPER_ADMIN') {
    // Assuming backend returns schoolId or schoolSlug in the user object.
    // If we only have schoolName in the frontend User interface, we'd need to ensure
    // we also send schoolSlug from the backend during login. For now, we'll check if
    // a custom property `schoolSlug` exists, or just use this placeholder logic.
    const userSchoolSlug = (user as any).schoolSlug; 
    if (userSchoolSlug && userSchoolSlug !== schoolSlug) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
