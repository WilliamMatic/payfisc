"use client";

import { Maximize, Minimize, ChevronDown, LogOut, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Header({
  isFullscreen,
  toggleFullscreen,
  setIsSidebarOpen,
  onLogout,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { agent, utilisateur, userType } = useAuth();

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  // Fonction utilitaire pour obtenir les infos utilisateur
  const getDisplayInfo = () => {
    if (userType === "agent" && agent) {
      return {
        name: `${agent.prenom} ${agent.nom}`,
        detail: agent.email,
        initial: `${agent.prenom.charAt(0)}${agent.nom.charAt(
          0
        )}`.toUpperCase(),
        badge: "Agent",
        color: "from-[#2D5B7A] to-[#3A7A5F]",
      };
    }

    if (userType === "utilisateur" && utilisateur) {
      const initials = utilisateur.nom_complet
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

      return {
        name: utilisateur.nom_complet,
        detail: `Site: ${utilisateur.site_nom}`,
        initial: initials,
        badge: "Utilisateur",
        color: "from-[#7A2D6E] to-[#5F3A7A]",
      };
    }

    return {
      name: "Utilisateur",
      detail: "Non connecté",
      initial: "U",
      badge: "Visiteur",
      color: "from-gray-500 to-gray-600",
    };
  };

  const displayInfo = getDisplayInfo();

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 z-50 sticky top-0">
      <div className="px-5 py-3 flex justify-between items-center">
        {/* Logo et menu burger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-28 h-20 flex items-center justify-center">
              {utilisateur?.site_code === "DGRPT" ? (
                <Image
                  src="/dgrpt.jpeg"
                  alt="Logo DRPT"
                  width={56}
                  height={32}
                  className="object-contain"
                  priority
                />
              ) : utilisateur?.site_code === "DGRK" ? (
                <Image
                  src="/dgrk-removebg.png"
                  alt="Logo DGRK"
                  width={112}
                  height={32}
                  className="object-contain"
                  priority
                />
              ) : null}
            </div>

            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              {utilisateur?.site_code}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-gray-600" />
            ) : (
              <Maximize className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className={`w-8 h-8 bg-gradient-to-r ${displayInfo.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
              >
                {displayInfo.initial}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800 truncate max-w-32">
                  {displayInfo.name}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-32">
                  {displayInfo.detail}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    {displayInfo.name}
                  </p>
                  <p className="text-xs text-gray-500">{displayInfo.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {displayInfo.badge}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm"
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
