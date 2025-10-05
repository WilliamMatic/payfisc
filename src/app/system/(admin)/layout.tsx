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
      next: { revalidate: 15  }, // Revalider toutes les 15 secondes
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Récupérer les notifications côté serveur
  const notifications = await getNotifications();

  return (
    <ThemeProvider>
      <AdminLayoutClient notifications={notifications}>
        {children}
      </AdminLayoutClient>
    </ThemeProvider>
  );
}