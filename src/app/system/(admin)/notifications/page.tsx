// app/notifications/page.tsx
import NotificationsPageClient from './NotificationsPageClient';
import type { Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Notifications",
  description: "Consultez vos notifications et restez informé de vos activités fiscales.",
};

/**
 * 💾 Récupère les statistiques côté serveur (AVEC CACHE - 5 minutes)
 */
async function getStats() {
  'use cache';
  cacheLife('minutes');
  cacheTag('notifications-stats');

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/route.php`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des statistiques:",
        response.status
      );
      return null;
    }

    const result = await response.json();
    
    if (result.status === "success") {
      return result.data;
    } else {
      console.error("API returned error:", result.message);
      return null;
    }
  } catch (error) {
    console.error("Erreur fetch stats:", error);
    return null;
  }
}

/**
 * 🌊 Composant wrapper pour les notifications (streamé avec Suspense)
 */
async function NotificationsData() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = `${API_BASE_URL}/notifications/non-lues.php?limit=50`;
  
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const result = await response.json();
  return result.status === "success" ? result.data : [];
}

export default async function NotificationsPage() {
  // Récupérer uniquement les stats (caché)
  const statsData = await getStats();

  return (
    <Suspense fallback={
      <NotificationsPageClient 
        initialStats={statsData}
        initialNotifications={[]}
        // isLoading={true}
      />
    }>
      <NotificationsLoader statsData={statsData} />
    </Suspense>
  );
}

// Composant qui charge les notifications de manière asynchrone
async function NotificationsLoader({ statsData }: { statsData: any }) {
  const notificationsData = await NotificationsData();
  
  return (
    <NotificationsPageClient 
      initialStats={statsData}
      initialNotifications={notificationsData}
      // isLoading={false}
    />
  );
}