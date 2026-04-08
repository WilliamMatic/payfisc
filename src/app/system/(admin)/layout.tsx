import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLayoutClient from "./AdminLayoutClient";
import { ThemeProvider } from "../../contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Administration",
  description:
    "Accédez à votre espace payFisc pour gérer vos taxes et impôts de manière moderne et intuitive.",
};

// Fonction pour récupérer les notifications côté serveur
async function getNotifications() {
  'use cache';
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/recuperer-notifications.php?limit=3`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
  'use cache';
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/notifications/get-audit-logs.php?limit=10`;

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

// Composant async qui charge les données non-critiques en streaming
async function AdminDataLoader({ children }: { children: React.ReactNode }) {
  const [notifications, auditLogs] = await Promise.all([
    getNotifications(),
    getAuditLogs()
  ]);

  return (
    <AdminLayoutClient 
      notifications={notifications}
      auditLogs={auditLogs}
    >
      {children}
    </AdminLayoutClient>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <Suspense fallback={
        <AdminLayoutClient notifications={[]} auditLogs={[]}>
          {children}
        </AdminLayoutClient>
      }>
        <AdminDataLoader>{children}</AdminDataLoader>
      </Suspense>
    </ThemeProvider>
  );
}