"use client";
import { useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

const DURATIONS: Record<Toast["type"], number> = {
  success: 4000,
  error: 6500,
  warning: 5500,
  info: 5000,
};

const TYPE_CONFIG = {
  success: {
    border: "border-l-green-500",
    icon: CheckCircle,
    iconColor: "text-green-500",
    titleColor: "text-green-800",
    progressColor: "bg-green-500",
  },
  error: {
    border: "border-l-red-500",
    icon: AlertCircle,
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    progressColor: "bg-red-500",
  },
  warning: {
    border: "border-l-orange-500",
    icon: AlertTriangle,
    iconColor: "text-orange-500",
    titleColor: "text-orange-800",
    progressColor: "bg-orange-500",
  },
  info: {
    border: "border-l-blue-500",
    icon: Info,
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    progressColor: "bg-blue-500",
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const duration = DURATIONS[toast.type];
  const config = TYPE_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`relative flex items-start gap-3 w-80 rounded-xl shadow-xl overflow-hidden
                  bg-white border border-gray-100 border-l-4 ${config.border} p-4`}
      role="alert"
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${config.titleColor}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-sm text-gray-600 mt-0.5 leading-snug">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 -mt-0.5 -mr-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className={`h-full ${config.progressColor} origin-left`}
          style={{
            animation: `toastProgress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
