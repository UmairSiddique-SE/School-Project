import React from "react";
import axios from "axios";
import { toast } from "sonner";

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

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Surface newly-created student credentials once.
// The backend stores only the password hash; the generated plaintext password
// is intentionally exposed only in the create response for the School Admin.
apiClient.interceptors.response.use(
  (response) => {
    const method = String(response.config.method || "").toLowerCase();
    const url = String(response.config.url || "");
    const credentials = response.data?.credentials;

    if (method === "post" && /\/people\/students\/?$/.test(url) && credentials?.loginId && credentials?.password) {
      const studentName = response.data?.student?.name || "Student";
      const loginId = String(credentials.loginId);
      const password = String(credentials.password);

      toast.custom(
        (id) =>
          React.createElement(
            "div",
            {
              className: "w-[min(420px,calc(100vw-32px))] rounded-2xl border border-emerald-500/20 bg-background/95 p-4 shadow-2xl backdrop-blur-xl",
            },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement("p", { className: "text-sm font-bold text-foreground" }, "Student account created"),
              React.createElement("p", { className: "mt-1 text-xs text-muted-foreground" }, `${studentName} — save these credentials securely.`),
            ),
            React.createElement(
              "div",
              { className: "space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3" },
              React.createElement(
                "div",
                { className: "flex items-center justify-between gap-3" },
                React.createElement("span", { className: "text-xs font-medium text-muted-foreground" }, "Login ID"),
                React.createElement("code", { className: "text-xs font-semibold text-foreground break-all text-right" }, loginId),
              ),
              React.createElement(
                "div",
                { className: "flex items-center justify-between gap-3" },
                React.createElement("span", { className: "text-xs font-medium text-muted-foreground" }, "Password"),
                React.createElement("code", { className: "text-xs font-semibold text-foreground break-all text-right" }, password),
              ),
            ),
            React.createElement(
              "div",
              { className: "mt-3 flex items-center justify-end gap-2" },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted",
                  onClick: async () => {
                    try {
                      await navigator.clipboard.writeText(`Login ID: ${loginId}\nPassword: ${password}`);
                      toast.success("Credentials copied");
                    } catch {
                      toast.error("Could not copy credentials");
                    }
                  },
                },
                "Copy credentials",
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90",
                  onClick: () => toast.dismiss(id),
                },
                "Done",
              ),
            ),
          ),
        { duration: 30000 },
      );
    }

    return response;
  },
  async (error) => {
    // Do NOT redirect to login — authentication is bypassed
    return Promise.reject(error);
  },
);

export default apiClient;
