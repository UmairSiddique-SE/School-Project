import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { queueOfflineOperation, type QueuedOperation } from "@/services/offlineQueue";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

const getStoredToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("auth_token");
const getStoredRefreshToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("auth_refresh_token");

const normalizePublicPlans = (data: unknown) => {
  if (!Array.isArray(data)) return data;
  const fallbackPrices: Record<string, number> = {
    PROFESSIONAL: 3000,
  };
  const fallbackPeriods: Record<string, string> = {
    PROFESSIONAL: "per month",
  };
  return data
    .map((plan: any) => {
      const planKey = String(plan?.planKey || "").toUpperCase();
      if (planKey !== "PROFESSIONAL") return null;
      const rawPrice = Number(plan?.price);
      return {
        ...plan,
        planKey: "PROFESSIONAL",
        name: "Professional",
        price: Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 3000,
        period: String(plan?.period || "").trim() || "per month",
      };
    })
    .filter(Boolean);
};

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof window !== "undefined" && String(config.url || "").replace(/^\//, "").startsWith("auth/register-school")) {
    const selectedPlan = window.sessionStorage.getItem("edusphere_registration_plan");
    if (selectedPlan && config.data && typeof config.data === "object") {
      config.data = { ...config.data, requestedPlan: selectedPlan };
    }
  }

  return config;
});

const QUEUEABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const NON_QUEUEABLE_PATHS = /\/auth\/(login|refresh|logout|verify-email|resend-otp|forgot-password|reset-password|register-school)/;

const queueCategoryFor = (url: string): QueuedOperation["category"] => {
  if (/\/attendance/i.test(url)) return "ATTENDANCE";
  if (/\/students|\/people|\/teachers/i.test(url)) return "STUDENT";
  if (/\/finance|\/fees|\/payments/i.test(url)) return "FINANCE";
  if (/\/exams|\/results/i.test(url)) return "EXAMS";
  return "OTHER";
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiClient.defaults.baseURL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const nextAccessToken = response.data?.accessToken as string | undefined;
        const nextRefreshToken = response.data?.refreshToken as string | undefined;
        if (!nextAccessToken) return null;
        localStorage.setItem("auth_token", nextAccessToken);
        if (nextRefreshToken) localStorage.setItem("auth_refresh_token", nextRefreshToken);
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => {
    const method = String(response.config.method || "").toLowerCase();
    const url = String(response.config.url || "");

    if (method === "get" && /\/public\/plans\/?$/.test(url)) {
      response.data = normalizePublicPlans(response.data);
    }

    const credentials = response.data?.credentials;
    if (method === "post" && /\/people\/students\/?$/.test(url) && credentials?.loginId && credentials?.password) {
      window.dispatchEvent(new CustomEvent("edusphere:student-credentials", {
        detail: { loginId: String(credentials.loginId), password: String(credentials.password), studentName: response.data?.student?.name || "Student" },
      }));
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = String(original?.url || "");
    const method = String(original?.method || "").toUpperCase();

    // Network failures (no HTTP response) are safe to replay later only for
    // explicit mutations. Auth and registration calls are never queued.
    if (!error.response && original && QUEUEABLE_METHODS.has(method) && !NON_QUEUEABLE_PATHS.test(requestUrl)) {
      try {
        await queueOfflineOperation({
          url: requestUrl,
          method: method as QueuedOperation["method"],
          payload: typeof original.data === "string" ? JSON.parse(original.data) : original.data,
          label: `${method} ${requestUrl}`,
          category: queueCategoryFor(requestUrl),
        });
      } catch {
        // If IndexedDB is unavailable, keep the original network error.
      }
      return Promise.reject(error);
    }

    if (status === 401 && original && !original._retry && !/\/auth\/(login|refresh|logout|verify-email)/.test(requestUrl)) {
      original._retry = true;
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(original);
      }
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new Event("edusphere:session-expired"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
