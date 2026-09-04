import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("auth_token");
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    const method = String(response.config.method || '').toLowerCase();
    const url = String(response.config.url || '');
    const credentials = response.data?.credentials;

    if (method === 'post' && /\/people\/students\/?$/.test(url) && credentials?.loginId && credentials?.password) {
      window.dispatchEvent(new CustomEvent('edusphere:student-credentials', {
        detail: {
          loginId: String(credentials.loginId),
          password: String(credentials.password),
          studentName: response.data?.student?.name || 'Student',
        },
      }));
    }

    return response;
  },
  async (error) => {
    // Authentication redirects are handled by the application auth boundary.
    return Promise.reject(error);
  },
);

export default apiClient;
