import AuditLogsPageClient from './AuditLogsPageClient';

// Ajoute ces deux lignes pour déclarer la page comme dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Historique des activités",
  description: "Consultez l'historique complet des activités du système.",
};

// Fonction pour récupérer les statistiques des logs côté serveur
async function getAuditStats() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/audit-logs/stats.php`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Retirer next.revalidate car avec force-dynamic, tout est dynamique
    });

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des statistiques d'audit:",
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
    console.error("Erreur fetch audit stats:", error);
    return null;
  }
}

// Fonction pour récupérer les logs d'audit côté serveur
async function getAuditLogs() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/audit-logs/get-logs.php?limit=100`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Retirer cache: 'no-store' car force-dynamic s'en charge
    });

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des logs d'audit:",
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
    console.error("Erreur fetch audit logs:", error);
    return [];
  }
}

export default async function AuditLogsPage() {
  // Récupérer les données côté serveur
  const [statsData, auditLogsData] = await Promise.all([
    getAuditStats(),
    getAuditLogs()
  ]);

  return (
    <AuditLogsPageClient 
      initialStats={statsData}
      initialAuditLogs={auditLogsData}
    />
  );
}