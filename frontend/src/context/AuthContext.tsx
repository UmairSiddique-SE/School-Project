import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  schoolSlug?: string;
}

export const DEMO_USERS: Record<string, User> = {
  SUPER_ADMIN: {
    id: "demo-super-admin",
    name: "Super Administrator",
    email: "superadmin@demo.com",
    role: "SUPER_ADMIN",
    schoolName: "EduSphere",
    schoolSlug: "edusphere",
  },
  SCHOOL_ADMIN: {
    id: "demo-school-admin",
    name: "School Admin",
    email: "schooladmin@demo.com",
    role: "SCHOOL_ADMIN",
    schoolId: "school-demo-1",
    schoolName: "Demo School",
    schoolSlug: "demo",
  },
  TEACHER: {
    id: "demo-teacher",
    name: "Teacher Demo",
    email: "teacher@demo.com",
    role: "TEACHER",
    schoolId: "school-demo-1",
    schoolName: "Demo School",
    schoolSlug: "demo",
  },
  STUDENT: {
    id: "demo-student",
    name: "Student Demo",
    email: "student@demo.com",
    role: "STUDENT",
    schoolId: "school-demo-1",
    schoolName: "Demo School",
    schoolSlug: "demo",
  },
};

export const DEMO_CREDENTIALS: Record<
  string,
  { email: string; password: string; user: User }
> = {
  SUPER_ADMIN: {
    email: "superadmin@demo.com",
    password: "admin123",
    user: DEMO_USERS.SUPER_ADMIN,
  },
  SCHOOL_ADMIN: {
    email: "schooladmin@demo.com",
    password: "admin123",
    user: DEMO_USERS.SCHOOL_ADMIN,
  },
  TEACHER: {
    email: "teacher@demo.com",
    password: "teacher123",
    user: DEMO_USERS.TEACHER,
  },
  STUDENT: {
    email: "student@demo.com",
    password: "student123",
    user: DEMO_USERS.STUDENT,
  },
};

export const getDemoCredentials = (email: string, password: string) => {
  const lowerEmail = email.trim().toLowerCase();
  const found = Object.values(DEMO_CREDENTIALS).find(
    (entry) =>
      entry.email.toLowerCase() === lowerEmail && entry.password === password,
  );

  return found ? found.user : null;
};

const BYPASS_USER: User = DEMO_USERS.SUPER_ADMIN;
const BYPASS_TOKEN = "demo-token";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(BYPASS_USER);
  const [token, setToken] = useState<string | null>(BYPASS_TOKEN);
  const [isLoading, setIsLoading] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  useEffect(() => {
    localStorage.setItem("auth_token", BYPASS_TOKEN);
    localStorage.setItem("auth_user", JSON.stringify(BYPASS_USER));
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    const safeToken = newToken || BYPASS_TOKEN;
    const safeUser = newUser || BYPASS_USER;
    setToken(safeToken);
    setUser(safeUser);
    setPreviewRole(null);
    localStorage.setItem("auth_token", safeToken);
    localStorage.setItem("auth_user", JSON.stringify(safeUser));
  };

  const logout = () => {
    setToken(BYPASS_TOKEN);
    setUser(BYPASS_USER);
    setPreviewRole(null);
    localStorage.setItem("auth_token", BYPASS_TOKEN);
    localStorage.setItem("auth_user", JSON.stringify(BYPASS_USER));
  };

  const isAuthenticated = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        previewRole,
        login,
        logout,
        setPreviewRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
