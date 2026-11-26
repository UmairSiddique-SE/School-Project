import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "@/api/apiClient";

export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
export type ActivationStatus = "ACTIVE" | "PAYMENT_REQUIRED" | "PAYMENT_PENDING" | "APPROVAL_PENDING" | "EXPIRED";

export interface User {
  id: string;
  name: string;
  email: string;
  loginId?: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  schoolSlug?: string;
  phone?: string;
  avatarUrl?: string;
  activationStatus?: ActivationStatus;
  plan?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  previewRole: UserRole | null;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  setPreviewRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let active = true;
    const storedToken = localStorage.getItem("auth_token");
    const storedRefreshToken = localStorage.getItem("auth_refresh_token");
    const storedUser = localStorage.getItem("auth_user");

    const clearSession = () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
      if (active) {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setPreviewRole(null);
      }
    };

    const hydrate = async () => {
      if (!storedToken || !storedUser) {
        if (active) setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (!active) return;
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(parsedUser);

        try {
          const response = await apiClient.get("/auth/me");
          const freshUser = response.data?.user ?? response.data;
          if (active && freshUser) {
            const mergedUser = { ...parsedUser, ...freshUser } as User;
            setUser(mergedUser);
            localStorage.setItem("auth_user", JSON.stringify(mergedUser));
          }
          const nextAccessToken = localStorage.getItem("auth_token");
          const nextRefreshToken = localStorage.getItem("auth_refresh_token");
          if (active && nextAccessToken) setToken(nextAccessToken);
          if (active) setRefreshToken(nextRefreshToken);
        } catch (error: any) {
          // Do not keep rendering a stale local session when the server has
          // rejected the current account/token. This prevents a locked/expired
          // school from showing the dashboard while every protected API call
          // fails with 401/403.
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            clearSession();
          }
        }
      } catch {
        clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const handleSessionExpired = () => clearSession();
    window.addEventListener("edusphere:session-expired", handleSessionExpired);
    void hydrate();

    return () => {
      active = false;
      window.removeEventListener("edusphere:session-expired", handleSessionExpired);
    };
  }, []);

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken || null);
    setUser(newUser);
    setPreviewRole(null);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    if (newRefreshToken) localStorage.setItem("auth_refresh_token", newRefreshToken);
    else localStorage.removeItem("auth_refresh_token");
  };

  const logout = () => {
    // Revoke the server-side refresh token before discarding local state.
    if (refreshToken) {
      void apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setPreviewRole(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");
  };

  const isAuthenticated = !!user && !!token;
  return (
    <AuthContext.Provider
      value={{ user, token, refreshToken, isAuthenticated, isLoading, previewRole, login, logout, setPreviewRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
