"use client";

import { Maximize, Minimize, ChevronDown, LogOut, Menu, Clock } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const { agent, utilisateur, userType } = useAuth();

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Horloge en temps réel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const getDisplayInfo = useCallback(() => {
    if (userType === "agent" && agent) {
      return {
        name: `${agent.prenom} ${agent.nom}`,
        detail: agent.email,
        initial: `${agent.prenom.charAt(0)}${agent.nom.charAt(0)}`.toUpperCase(),
        badge: "Agent",
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
      };
    }

    return {
      name: "Utilisateur",
      detail: "Non connecté",
      initial: "U",
      badge: "Visiteur",
    };
  }, [userType, agent, utilisateur]);

  const displayInfo = getDisplayInfo();

  return (
    <header className="h-[73px] bg-white border-b border-gray-200/80 z-50 sticky top-0 shrink-0">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: burger + logo + site badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo conditionnel dynamique */}
          {utilisateur?.site_logo ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls'}/sites/uploads/${utilisateur.site_logo}`}
              alt={`Logo ${utilisateur.site_nom || ''}`}
              className="h-7 w-auto object-contain"
            />
          ) : utilisateur?.site_code === "DGRPT" ? (
            <Image
              src="/dgrpt.jpeg"
              alt="Logo DRPT"
              width={40}
              height={28}
              className="object-contain"
              priority
            />
          ) : utilisateur?.site_code === "DGRK" ? (
            <Image
              src="/dgrk-removebg.png"
              alt="Logo DGRK"
              width={72}
              height={28}
              className="object-contain"
              priority
            />
          ) : null}

          {utilisateur?.site_code && (
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium tracking-wide">
              {utilisateur.site_code}
            </span>
          )}

          {/* Separator */}
          <div className="hidden md:block w-px h-5 bg-gray-200" />

          {/* Horloge */}
          <div className="hidden md:flex items-center gap-2 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono font-medium text-gray-600 tabular-nums">
                {currentTime}
              </span>
              <span className="text-xs text-gray-400">
                {currentDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-[#2D5B7A] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {displayInfo.initial}
              </div>
              <div className="text-left hidden md:block max-w-[140px]">
                <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                  {displayInfo.name}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight">
                  {displayInfo.detail}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-gray-200/80 z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[13px] font-medium text-gray-800 truncate">
                    {displayInfo.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {displayInfo.detail}
                  </p>
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded font-medium">
                    {displayInfo.badge}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-[13px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
