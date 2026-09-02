import React from 'react';

// ─── Authentication fully disabled — all routes are open ──────────────────────
// ProtectedRoute now simply renders children without any auth check
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};
