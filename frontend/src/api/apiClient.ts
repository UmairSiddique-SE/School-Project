import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

const getStoredToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("auth_token");
const getStoredRefreshToken = () => typeof window === "undefined" ? null : window.localStorage.getItem("auth_refresh_token");

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
