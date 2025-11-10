import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";
import { ThemeProvider } from "../../contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Administration",
  description:
    "Accédez à votre espace payFisc pour gérer vos taxes et impôts de manière moderne et intuitive.",
};

// Fonction pour récupérer les notifications côté serveur
async function getNotifications() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/recuperer-notifications.php?limit=3`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 15 }, // Revalider toutes les 15 secondes
    });

    if (!response.ok) {
      console.error(
        "Erreur lors de la récupération des notifications:",
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
    console.error("Erreur fetch notifications:", error);
    return [];
  }
}

// Fonction pour récupérer les logs d'audit côté serveur
async function getAuditLogs() {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/get-audit-logs.php?limit=10`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 30 }, // Revalider toutes les 30 secondes
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Récupérer les notifications et logs d'audit côté serveur en parallèle
  const [notifications, auditLogs] = await Promise.all([
    getNotifications(),
    getAuditLogs()
  ]);

  return (
    <ThemeProvider>
      <AdminLayoutClient 
        notifications={notifications}
        auditLogs={auditLogs}
      >
        {children}
      </AdminLayoutClient>
    </ThemeProvider>
  );
}