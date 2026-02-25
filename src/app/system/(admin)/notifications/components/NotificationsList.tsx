"use client";

import NotificationCard from './NotificationCard';

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  date: string;
  read: boolean;
  icon: string;
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  isLoading?: boolean; // Ajout de la prop isLoading
}

// Composant de skeleton pour les notifications
function NotificationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Icône skeleton */}
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              
              {/* Contenu skeleton */}
              <div className="flex-1">
                {/* Titre skeleton */}
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                
                {/* Message skeleton - 3 lignes */}
                <div className="space-y-2 mb-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Date skeleton */}
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Bouton "Marquer comme lu" skeleton */}
            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsList({ 
  notifications, 
  onMarkAsRead,
  isLoading = false // Valeur par défaut à false
}: NotificationsListProps) {
  
  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return <NotificationsListSkeleton />;
  }

  // Afficher le message "Aucune notification" si pas de données
  if (notifications.length === 0) {
    return (
      <div className="text-center bg-white rounded-xl p-12 shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Aucune notification
        </h3>
        <p className="text-gray-600">
          Vous n'avez aucune notification pour le moment.
        </p>
      </div>
    );
  }

  // Afficher la liste des notifications
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}

// Exporter aussi le skeleton pour pouvoir l'utiliser ailleurs si besoin
export { NotificationsListSkeleton };