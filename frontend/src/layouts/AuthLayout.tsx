import React from 'react';
import { Outlet, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { schoolSlug } = useParams();

  // If already authenticated, redirect straight to dashboard
  if (isAuthenticated) {
    const destination = user?.role === 'SUPER_ADMIN'
      ? '/platform/super-admin'
      : `/${schoolSlug || user?.schoolSlug || 'demo'}/dashboard`;
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Left panel - Branding (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground md:flex">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-violet-500 opacity-90 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground text-primary font-bold text-xl shadow-lg shadow-black/10">
            E
          </div>
          <span className="font-bold text-2xl tracking-tight">EduSphere ERP</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative z-10 space-y-6"
        >
          <GraduationCap size={48} className="text-primary-foreground/90" />
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            The Complete Enterprise ERP for Modern Multi-School Systems.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg">
            Manage multiple campuses, track academic excellence, optimize financial processes, and foster collaboration across students, teachers, and parents.
          </p>
        </motion.div>

        <div className="relative z-10 text-xs text-primary-foreground/60">
          <span>&copy; {new Date().getFullYear()} EduSphere ERP. All rights reserved.</span>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex w-full items-center justify-center p-8 md:w-1/2 bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
