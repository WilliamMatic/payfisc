import { Suspense } from "react";
import { Metadata } from "next";
import CartesRosesContent from "./components/CartesRosesContent";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Annulation des Cartes Roses - PayFisc",
  description: "Gestion des annulations de cartes roses délivrées",
};

// Composant de chargement pour le contenu principal
function CartesRosesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl p-4 h-24 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Search skeleton */}
          <div className="mt-6">
            <div className="h-12 bg-gray-200 rounded-xl max-w-md animate-pulse"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chargement des cartes roses...
            </h3>
            <p className="text-gray-500">
              Veuillez patienter pendant le chargement des données.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartesRosesAnnulationPage() {
  return (
    <Suspense fallback={<CartesRosesLoading />}>
      <CartesRosesContent />
    </Suspense>
  );
}
