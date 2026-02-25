'use cache'; // Activation du cache au niveau du fichier

import NotificationsPageClient from './NotificationsPageClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife } from 'next/cache';

export const metadata: Metadata = {
  title: "Notifications",
  description: "Consultez vos notifications et restez informé de vos activités fiscales.",
};

// Pas besoin de revalidate puisque nous utilisons cacheLife

/**
 * 💾 Récupère les statistiques avec cache (5 minutes)
 * Utilise cacheLife avec le profil 'minutes'
 */
async function getStats() {
  'use cache';
  cacheLife('minutes'); // 5 minutes stale, 1 minute revalidate, 1 hour expire (selon le profil preset)
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/route.php`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // Les tags sont toujours utiles pour la revalidation manuelle
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.status === "success" ? result.data : null;
  } catch (error) {
    console.error("Erreur fetch stats:", error);
    return null;
  }
}

/**
 * 💾 Récupère les notifications avec cache (2 minutes)
 * Utilise cacheLife avec un profil personnalisé inline
 */
async function getNotificationsNonLues() {
  'use cache';
  cacheLife({
    stale: 120, // 2 minutes - client peut utiliser sans vérifier
    revalidate: 60, // 1 minute - background refresh après ce délai
    expire: 3600, // 1 heure - cache maximum sans trafic
  });
  
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/non-lues.php?limit=50`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) return [];
    const result = await response.json();
    return result.status === "success" ? result.data : [];
  } catch (error) {
    console.error("Erreur fetch notifications:", error);
    return [];
  }
}

/**
 * 📦 Composant principal avec cache
 */
export default async function NotificationsPage() {
  'use cache';
  cacheLife('minutes'); // La page entière est cachée 5 minutes
  
  // Récupérer d'abord les stats pour le fallback
  const statsData = await getStats();

  return (
    <Suspense fallback={
      <NotificationsPageClient 
        initialStats={statsData}
        initialNotifications={[]}
        isLoading={true}
      />
    }>
      <NotificationsContent />
    </Suspense>
  );
}

/**
 * 📦 Composant asynchrone qui charge les notifications
 * Note: Ce composant n'a pas besoin de 'use cache' car il est déjà
 * dans le contexte du composant parent qui est caché
 */
async function NotificationsContent() {
  // Charger les notifications (elles ont leur propre cache)
  const notificationsData = await getNotificationsNonLues();
  
  // Re-récupérer les stats (mais elles viennent du cache)
  const statsData = await getStats();

  return (
    <NotificationsPageClient 
      initialStats={statsData}
      initialNotifications={notificationsData}
      isLoading={false}
    />
  );
}