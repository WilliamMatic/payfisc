import { Suspense } from "react";
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

// Composant d'erreur d'authentification
function UnauthenticatedMessage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100 max-w-md mx-auto mt-10">
        <h2 className="text-xl font-semibold text-red-600 text-center">
          Non authentifié
        </h2>
        <p className="text-gray-600 mt-2 text-center">
          Veuillez vous connecter pour accéder au tableau de bord.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Ajuster les dates par défaut (aujourd'hui) côté serveur
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