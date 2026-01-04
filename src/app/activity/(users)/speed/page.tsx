import { Suspense } from "react";
import FireworksCanvas from "./FireworksCanvas";
import DashboardContent from "./DashboardContent";
import LoadingSpinner from "./components/LoadingSpinner"; // Créez ce composant si nécessaire

export const metadata = {
  title: "Payfisc Dashboard v1.2",
  description: "Tableau de bord institutionnel OPS - Nouveautés 2026",
};

export default function PayfiscDashboardPage() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
      {/* Canvas pour les feux d'artifice - Composant Client */}
      <Suspense fallback={<div className="fixed inset-0 bg-gray-50" />}>
        <FireworksCanvas />
      </Suspense>

      {/* Overlay pour assurer la lisibilité */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-50/30 via-transparent to-gray-100/30 z-1 pointer-events-none" />

      {/* Contenu du dashboard - Composant Client */}
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent currentYear={currentYear} />
      </Suspense>
    </div>
  );
}