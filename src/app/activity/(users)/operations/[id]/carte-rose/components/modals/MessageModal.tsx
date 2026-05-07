"use client";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface MessageModalProps {
  isOpen: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
  showAction?: boolean;
}

export default function MessageModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onAction,
  actionText = "OK",
  showAction = true,
}: MessageModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600",
      icon: AlertCircle,
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
      icon: Info,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-start space-x-4 mb-6">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
              {title}
            </h3>
            <div className={`text-sm ${config.textColor}`}>
              {message.split("\n").map((line, idx) => (
                <p key={idx} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          {showAction && onAction && (
            <button
              onClick={onAction}
              className={`px-6 py-2 rounded-lg font-medium ${
                type === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : type === "error"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : type === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-colors`}
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
