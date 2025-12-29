// app/system/mouvements/UserLayoutClient.tsx
"use client";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MouvementsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, isLoading, logout, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur a accès à cette interface
    if (!isLoading && isAuthenticated) {
      // Rediriger l'agent vers l'interface admin s'il est connecté en tant qu'agent
      if (userType === "agent") {
        router.push("/system/login");
      }
      // L'utilisateur (utilisateur) peut rester sur cette page
    } else if (!isLoading && !isAuthenticated) {
      router.push("/system/login");
    }
  }, [isAuthenticated, isLoading, userType, router]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || userType === "agent") {
    return null;
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Overlay pour mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <Header
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={logout}
          />

          {/* Section principale avec défilement */}
          <main className="flex-1 overflow-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 m-6 h-[calc(100%-3rem)]">
              <div className="p-8 h-full overflow-auto">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
