import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  schoolSlug?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  previewRole: UserRole | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setPreviewRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser && storedUser !== 'undefined') {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Default demo session for immediate preview without black screen
          const demoUser: User = {
            id: 'demo-user-1',
            name: 'Principal Sharma',
            email: 'admin@edusphere.com',
            role: 'SCHOOL_ADMIN',
            schoolName: 'EduSphere Academy',
            schoolSlug: 'demo',
          };
          setToken('demo-token-123');
          setUser(demoUser);
          localStorage.setItem('auth_token', 'demo-token-123');
          localStorage.setItem('auth_user', JSON.stringify(demoUser));
        }
      } catch (error) {
        console.error('Failed to parse auth data from localStorage', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setPreviewRole(null);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPreviewRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, previewRole, login, logout, setPreviewRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
