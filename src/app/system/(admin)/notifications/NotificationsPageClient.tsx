"use client";

import { useState, useEffect, Suspense } from "react";
import StatsCards from './components/StatsCards';
import NotificationsList from './components/NotificationsList';
import StatsCardsSkeleton from './components/StatsCardsSkeleton';
import NotificationsListSkeleton from './components/NotificationsListSkeleton';

interface Notification {
  id: string;
  type_notification: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  date_lu?: string;
  nif_contribuable?: string;
  id_declaration?: number;
  id_paiement?: number;
}

interface StatsData {
  total: number;
  unread: number;
  success: number;
  alerts: number;
}

interface NotificationsPageClientProps {
  initialStats: StatsData | null;
  initialNotifications: Notification[];
  isLoading?: boolean; // Ajout de la prop isLoading
}

export default function NotificationsPageClient({ 
  initialStats, 
  initialNotifications,
  isLoading = false // Valeur par défaut à false
}: NotificationsPageClientProps) {
  const [stats, setStats] = useState<StatsData | null>(initialStats);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(isLoading);

  // Mettre à jour loading quand isLoading change
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Simuler un chargement si initialNotifications est vide et isLoading est true
  useEffect(() => {
    if (isLoading) {
      // Optionnel: Vous pouvez ajouter un timeout pour simuler un chargement plus long
      const timer = setTimeout(() => {
        // Ne rien faire, juste pour garder l'état loading
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Fonction pour convertir le type de notification PHP en type frontend
  const convertNotificationType = (type: string): "success" | "warning" | "info" | "error" => {
    switch (type) {
      case 'paiement_effectue':
        return 'success';
      case 'declaration_en_attente':
        return 'warning';
      case 'declaration_enregistree':
        return 'info';
      case 'declaration_supprimee':
      case 'paiement_echec':
        return 'error';
      default:
        return 'info';
    }
  };

  // Fonction pour convertir les données de l'API en format frontend
  const convertToFrontendFormat = (notif: Notification) => ({
    id: notif.id.toString(),
    type: convertNotificationType(notif.type_notification),
    title: notif.titre,
    message: notif.message,
    date: formatDate(notif.date_creation),
    read: notif.lu,
    icon: getIconByType(convertNotificationType(notif.type_notification))
  });

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else {
      return `Il y a ${diffDays} j`;
    }
  };

  // Fonction pour obtenir l'icône par type
  const getIconByType = (type: "success" | "warning" | "info" | "error") => {
    const icons = {
      success: "✅",
      warning: "⚠️",
      info: "📢",
      error: "❌"
    };
    return icons[type];
  };

  const markAsRead = async (id: string) => {
    // Optionnel: Implémenter une API pour marquer une notification comme lue
    setNotifications(
      notifications.map((notif) =>
        notif.id.toString() === id ? { ...notif, lu: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    // Optionnel: Implémenter une API pour marquer toutes comme lues
    setNotifications(notifications.map((notif) => ({ ...notif, lu: true })));
  };

  const unreadCount = notifications.filter((notif) => !notif.lu).length;

  // Notifications converties pour le frontend
  const frontendNotifications = notifications.map(convertToFrontendFormat);

  // Afficher un écran de chargement complet si nécessaire
  if (isLoading && notifications.length === 0 && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* En-tête avec animation de chargement */}
          <div className="text-center mb-8">
            <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-96 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
          </div>

          {/* Stats skeleton */}
          <StatsCardsSkeleton />

          {/* En-tête de la liste avec actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Notifications skeleton */}
          <NotificationsListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔔 Mes Notifications
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Restez informé de l'ensemble de vos activités fiscales
          </p>
        </div>

        {/* Statistiques rapides avec Suspense */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards stats={stats} isLoading={loading} />
        </Suspense>

        {/* En-tête de la liste avec actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Dernières Notifications
            {loading && (
              <span className="ml-3 text-sm font-normal text-gray-500">
                (Mise à jour...)
              </span>
            )}
          </h2>
          {!loading && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Tout marquer comme lu
            </button>
          )}
          {loading && (
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          )}
        </div>

        {/* Liste des notifications avec Suspense */}
        <Suspense fallback={<NotificationsListSkeleton />}>
          <NotificationsList
            notifications={frontendNotifications}
            onMarkAsRead={markAsRead}
            isLoading={loading}
          />
        </Suspense>
      </div>
    </div>
  );
}