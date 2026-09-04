import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  schoolSlug?: string;
  activationStatus?: "ACTIVE" | "PAYMENT_PENDING";
  plan?: string;
}

export const DEMO_USERS: Record<string, User> = {
  SUPER_ADMIN: { id: "demo-super-admin", name: "Super Administrator", email: "superadmin@gmail.com", role: "SUPER_ADMIN", schoolName: "EduSphere", schoolSlug: "edusphere" },
  SCHOOL_ADMIN: { id: "demo-school-admin", name: "School Admin", email: "schooladmin@gmail.com", role: "SCHOOL_ADMIN", schoolId: "school-demo-1", schoolName: "Demo School", schoolSlug: "edusphere-international" },
  TEACHER: { id: "demo-teacher", name: "Teacher Demo", email: "teacher@gmail.com", role: "TEACHER", schoolId: "school-demo-1", schoolName: "Demo School", schoolSlug: "edusphere-international" },
  STUDENT: { id: "demo-student", name: "Student Demo", email: "student@gmail.com", role: "STUDENT", schoolId: "school-demo-1", schoolName: "Demo School", schoolSlug: "edusphere-international" },
};

export const DEMO_CREDENTIALS: Record<string, { email: string; password: string; user: User }> = {
  SUPER_ADMIN: { email: "superadmin@gmail.com", password: "12345678", user: DEMO_USERS.SUPER_ADMIN },
  SCHOOL_ADMIN: { email: "schooladmin@gmail.com", password: "12345678", user: DEMO_USERS.SCHOOL_ADMIN },
  TEACHER: { email: "teacher@gmail.com", password: "teacher123", user: DEMO_USERS.TEACHER },
  STUDENT: { email: "student@gmail.com", password: "student123", user: DEMO_USERS.STUDENT },
};

export const getDemoCredentials = (email: string, password: string) => {
  const lowerEmail = email.trim().toLowerCase();
  const found = Object.values(DEMO_CREDENTIALS).find((entry) => entry.email.toLowerCase() === lowerEmail && entry.password === password);
  return found ? found.user : null;
};

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
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setPreviewRole(null);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPreviewRole(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const isAuthenticated = !!user && !!token;

  return <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, previewRole, login, logout, setPreviewRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
