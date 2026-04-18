"use client";
import { useState, useEffect } from "react";
import EnvironnementSidebar from "./components/EnvironnementSidebar";
import Header from "../(users)/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export default function EnvironnementLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, isLoading, logout, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (userType === "agent") {
        router.push("/system/login");
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#153258]"></div>
      </div>
    );
  }

  if (!isAuthenticated || userType === "agent") {
    return null;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme === "dark" ? "dark" : ""}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <EnvironnementSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="flex-1 flex flex-col min-h-0">
          <Header
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={logout}
          />
          <main className="flex-1 overflow-auto">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 m-6 h-[calc(100%-3rem)]">
              <div className="p-8 h-full overflow-auto">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
