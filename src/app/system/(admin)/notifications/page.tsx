// app/notifications/page.tsx
import NotificationsPageClient from './NotificationsPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Notifications",
  description: "Consultez vos notifications et restez informé de vos activités fiscales.",
};

// Fonction pour récupérer les statistiques côté serveur
async function getStats() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/route.php`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Plus besoin de next.revalidate avec force-dynamic
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

// Fonction pour récupérer les notifications non lues côté serveur
async function getNotificationsNonLues() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/non-lues.php?limit=50`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Retirer cache: 'no-store' car force-dynamic suffit
    });

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des notifications non lues:",
        response.status
      );
      return [];
    }

    const result = await response.json();

    if (result.status === "success") {
      return result.data;
    } else {
      console.error("API returned error:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Erreur fetch notifications non lues:", error);
    return [];
  }
}

export default async function NotificationsPage() {
  // Récupérer les données côté serveur
  const [statsData, notificationsData] = await Promise.all([
    getStats(),
    getNotificationsNonLues()
  ]);

  return (
    <NotificationsPageClient 
      initialStats={statsData}
      initialNotifications={notificationsData}
    />
  );
}