// components/NotificationCard.tsx
"use client";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  date: string;
  read: boolean;
  icon: string;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getTypeStyles = (type: Notification["type"]) => {
    const styles = {
      success: "bg-green-50 border-green-200",
      warning: "bg-yellow-50 border-yellow-200",
      info: "bg-blue-50 border-blue-200",
      error: "bg-red-50 border-red-200",
    };
    return styles[type];
  };

  const getTypeColor = (type: Notification["type"]) => {
    const colors = {
      success: "text-green-600",
      warning: "text-yellow-600",
      info: "text-blue-600",
      error: "text-red-600",
    };
    return colors[type];
  };

  return (
    <div
      className={`
        bg-white rounded-xl p-6 shadow-sm border-2 transition-all duration-300 hover:shadow-md
        ${getTypeStyles(notification.type)}
        ${
          !notification.read
            ? "border-l-4 border-l-blue-500"
            : "border-gray-200"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div className="text-2xl flex-shrink-0 mt-1">
          {notification.icon}
        </div>

        {/* Contenu */}
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3
                className={`font-semibold text-lg ${getTypeColor(
                  notification.type
                )}`}
              >
                {notification.title}
              </h3>
              <p className="text-gray-700 mt-1">
                {notification.message}
              </p>
            </div>
            {!notification.read && (
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {notification.date}
            </span>
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              >
                Marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}