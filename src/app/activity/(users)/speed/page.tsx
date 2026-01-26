"use client";

import { Suspense, useState, useEffect } from "react";
import FireworksCanvas from "./FireworksCanvas";
import DashboardContent from "./DashboardContent";
import LoadingSpinner from "./components/LoadingSpinner";

export default function PayfiscDashboardPage() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    // Cette logique s'exécute uniquement côté client
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (currentYear === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
      {/* Canvas pour les feux d'artifice */}
      <Suspense fallback={<div className="fixed inset-0 bg-gray-50" />}>
        <FireworksCanvas />
      </Suspense>

      {/* Overlay pour assurer la lisibilité */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-50/30 via-transparent to-gray-100/30 z-1 pointer-events-none" />

      {/* Contenu du dashboard */}
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent currentYear={currentYear} />
      </Suspense>
    </div>
  );
}