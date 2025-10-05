'use client';
import { Bell, Moon, Sun, Maximize, Minimize, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../.././../contexts/AuthContext';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Header({ 
  isDarkMode, setIsDarkMode, 
  isFullscreen, toggleFullscreen,
  setIsSidebarOpen,
  onLogout
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { agent } = useAuth();

  const notifications = [
    { id: 1, text: "Nouveau contribuable enregistré", emoji: "👤", time: "2min" },
    { id: 2, text: "Rapport mensuel disponible", emoji: "📊", time: "1h" },
    { id: 3, text: "Mise à jour système", emoji: "⚙️", time: "2h" }
  ];

  const userName = agent ? `${agent.prenom} ${agent.nom}` : "Utilisateur";
  const userInitial = agent ? agent.prenom.charAt(0) : "U";

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 z-20">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Logo et menu burger */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-100 h-10 flex items-center overflow-hidden">
              <Image src="/dgrk-removebg.png" alt="Logo DGRK" width={120} height={120} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 rounded-xl bg-gray-100">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 border-b border-gray-100 flex items-center space-x-3">
                    <span>{notif.emoji}</span>
                    <div>
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl bg-gray-100">
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-3 rounded-xl bg-gray-100">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* User */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#153258] to-[#23A974] rounded-full flex items-center justify-center text-white">
                {userInitial}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{agent?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}