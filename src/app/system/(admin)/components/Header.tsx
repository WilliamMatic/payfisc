"use client";
import {
  Bell,
  Moon,
  Sun,
  Maximize,
  Minimize,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext"; // Importer le hook

interface Notification {
  id: number;
  type_notification: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  date_lu: string | null;
}

interface HeaderProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  notifications: Notification[];
}

export default function Header({
  isFullscreen,
  toggleFullscreen,
  setIsSidebarOpen,
  onLogout,
  notifications,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { agent } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Utiliser le hook theme

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fonction pour formater la date relative
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440)
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  // Fonction pour obtenir un emoji basé sur le type de notification
  const getNotificationEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      declaration_enregistree: "📝",
      declaration_supprimee: "🗑️",
      paiement_effectue: "💳",
      default: "🔔",
    };
    return emojiMap[type] || emojiMap["default"];
  };

  const userName = agent ? `${agent.prenom} ${agent.nom}` : "Utilisateur";
  const userInitial = agent
    ? agent.prenom.charAt(0) + agent.nom.charAt(0)
    : "U";

  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-700 z-50 sticky top-0">
      <div className="px-5 py-3 flex justify-between items-center">
        {/* Logo et menu burger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex items-center">
            <div className="w-28 h-8 flex items-center overflow-hidden">
              <Image
                src="/dgrk-removebg.png"
                alt="Logo DGRK"
                width={112}
                height={32}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    aria-label="Fermer les notifications"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          !notif.lu ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">
                            {getNotificationEmoji(notif.type_notification)}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {notif.titre}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatRelativeTime(notif.date_creation)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Aucune notification
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={
              theme === 'dark'
                ? "Désactiver le mode sombre"
                : "Activer le mode sombre"
            }
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={
              isFullscreen ? "Quitter le mode plein écran" : "Mode plein écran"
            }
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Maximize className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Menu utilisateur"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#2D5B7A] to-[#3A7A5F] rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInitial}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-32">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                  {agent?.email}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {agent?.email}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}