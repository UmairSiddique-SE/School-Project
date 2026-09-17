import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Wrench,
  Info,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";

export interface SchoolAlert {
  id: string;
  type: "INFO" | "WARNING" | "PAYMENT" | "MAINTENANCE" | "SUSPENSION" | "CUSTOM";
  title: string;
  message: string;
  actionType?: "RENEW_PAYMENT" | "OPEN_LINK" | "ACKNOWLEDGE" | null;
  actionUrl?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isActive: boolean;
  isDismissed: boolean;
  createdBy: string;
  createdAt: string;
}

export const SchoolAlertBanner: React.FC = () => {
  const { user } = useAuth();
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SchoolAlert[]>([]);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (!user || user.role === "SUPER_ADMIN") return;
    try {
      const res = await apiClient.get("/my-school/alerts");
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch {
      // silently ignore if failed
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll every 60 seconds for urgent administrative alerts
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDismissingId(alertId);
      await apiClient.patch(`/my-school/alerts/${alertId}/dismiss`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err: any) {
      console.error("Failed to dismiss alert:", err);
    } finally {
      setDismissingId(null);
    }
  };

  const handleAction = (alert: SchoolAlert) => {
    const base = schoolSlug ? `/${schoolSlug}` : "";
    if (alert.actionType === "RENEW_PAYMENT" || alert.type === "PAYMENT") {
      navigate(`${base}/subscription`);
    } else if (alert.actionUrl) {
      if (alert.actionUrl.startsWith("http")) {
        window.open(alert.actionUrl, "_blank");
      } else {
        navigate(`${base}${alert.actionUrl.startsWith("/") ? "" : "/"}${alert.actionUrl}`);
      }
    }
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 sm:px-6 sm:py-2.5 z-20">
      {alerts.map((alert) => {
        const isCritical = alert.priority === "CRITICAL" || alert.type === "SUSPENSION";
        const isPayment = alert.type === "PAYMENT";
        const isMaintenance = alert.type === "MAINTENANCE";
        const isWarning = alert.type === "WARNING";

        let bgClass = "bg-sky-500/10 border-sky-500/30 text-sky-200";
        let icon = <Info className="h-5 w-5 text-sky-400 shrink-0" />;
        let btnBg = "bg-sky-500 hover:bg-sky-400 text-white";

        if (isCritical) {
          bgClass = "bg-rose-950/70 border-rose-500/40 text-rose-100 shadow-lg shadow-rose-950/50 animate-pulse";
          icon = <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />;
          btnBg = "bg-rose-600 hover:bg-rose-500 text-white";
        } else if (isPayment) {
          bgClass = "bg-amber-950/70 border-amber-500/40 text-amber-100 shadow-md shadow-amber-950/40";
          icon = <CreditCard className="h-5 w-5 text-amber-400 shrink-0" />;
          btnBg = "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black";
        } else if (isMaintenance) {
          bgClass = "bg-indigo-950/60 border-indigo-500/40 text-indigo-100";
          icon = <Wrench className="h-5 w-5 text-indigo-400 shrink-0" />;
          btnBg = "bg-indigo-600 hover:bg-indigo-500 text-white";
        } else if (isWarning) {
          bgClass = "bg-amber-500/10 border-amber-500/30 text-amber-200";
          icon = <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
          btnBg = "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold";
        }

        return (
          <div
            key={alert.id}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl border backdrop-blur-md transition-all ${bgClass}`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="p-1.5 rounded-xl bg-white/10">{icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm tracking-tight">{alert.title}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/10 tracking-wider">
                    {alert.type}
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed font-medium">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              {(alert.actionType === "RENEW_PAYMENT" || isPayment || alert.actionUrl) && (
                <button
                  onClick={() => handleAction(alert)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${btnBg}`}
                >
                  <span>{isPayment ? "Renew Subscription" : "Take Action"}</span>
                  <ArrowRight size={13} />
                </button>
              )}

              {/* Only non-critical alerts can be dismissed */}
              {!isCritical && (
                <button
                  onClick={(e) => handleDismiss(alert.id, e)}
                  disabled={dismissingId === alert.id}
                  title="Dismiss notification"
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SchoolAlertBanner;
