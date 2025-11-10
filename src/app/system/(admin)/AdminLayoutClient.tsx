'use client';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';

interface Notification {
  id: number;
  type_notification: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  date_lu: string | null;
}

interface AuditLog {
  id: number;
  user_id: string;
  user_type: string;
  action: string;
  timestamp: string;
}

interface AdminLayoutClientProps {
  children: React.ReactNode;
  notifications: Notification[];
  auditLogs: AuditLog[];
}

export default function AdminLayoutClient({
  children,
  notifications: initialNotifications,
  auditLogs: initialAuditLogs
}: AdminLayoutClientProps) {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Rediriger vers la page de connexion si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/system/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Gestion du mode plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // Ne rien afficher si non authentifié (redirection en cours)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
          {/* Header avec notifications et logs d'audit */}
          <Header 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={logout}
            notifications={notifications}
            auditLogs={auditLogs}
          />

          {/* Section principale avec défilement */}
          <main className="flex-1 overflow-auto">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 m-6 h-[calc(100%-3rem)]">
              <div className="p-8 h-full overflow-auto">
                {children}
              </div>
            </div>
          </main>

          {/* Footer (optionnel) */}
          {/* <Footer /> */}
        </div>
      </div>
    </div>
  );
}