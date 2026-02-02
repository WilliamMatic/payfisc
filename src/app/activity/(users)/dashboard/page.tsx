import { Suspense } from "react";
import { connection } from "next/server";
import DashboardClientContent from "./components/DashboardClientContent";

// Définir le type pour les filtres
type SaleType = "all" | "retail" | "wholesale" | "reproduction";

export interface FilterState {
  startDate: string;
  endDate: string;
  plateNumber: string;
  saleType: SaleType;
}

// Composant de chargement
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des données...</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  // ⚡ Forcer le rendu dynamique avec connection()
  await connection();
  
  // Maintenant on peut utiliser new Date() en toute sécurité
  const today = new Date().toISOString().split("T")[0];
  const defaultFilters: FilterState = {
    startDate: today,
    endDate: today,
    plateNumber: "",
    saleType: "all",
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardClientContent defaultFilters={defaultFilters} />
    </Suspense>
  );
}