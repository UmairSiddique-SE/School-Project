import { Navigate } from 'react-router-dom';
import StudentPortalPremium from './StudentPortalPremium';
import { useAuth } from '@/context/AuthContext';

export default function StudentPortal() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading Student Portal…</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'STUDENT') return <Navigate to="/dashboard" replace />;

  return <StudentPortalPremium />;
}
