import AuditLogsPageClient from './AuditLogsPageClient';
import { cacheLife, cacheTag } from 'next/cache';
import { connection } from 'next/server';

export const metadata = {
  title: "Historique des activités",
  description: "Consultez l'historique complet des activités du système.",
};

/**
 * 💾 Récupère les statistiques des logs côté serveur (AVEC CACHE - 5 minutes)
 * Les stats changent moins souvent, on peut les cacher
 */
async function getAuditStats() {
  'use cache';
  cacheLife('minutes'); // Cache de 5 minutes
  cacheTag('audit-stats');

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/audit-logs/stats.php`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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

/**
 * 🌊 Récupère les logs d'audit côté serveur (DYNAMIQUE - toujours frais)
 * Les logs doivent être toujours à jour
 */
async function getAuditLogs() {
  // Pas de cache - les logs doivent être toujours frais
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/audit-logs/get-logs.php?limit=100`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
  // ⚡ Forcer le rendu dynamique pour permettre le fetch des logs
  await connection();
  
  // Récupérer les données côté serveur en parallèle
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