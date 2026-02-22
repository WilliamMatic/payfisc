// src/app/activity/(users)/reimpression/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { useAuth } from "@/contexts/AuthContext";
import CartesReprintClient from "./components/CartesReprintClient";
import {
  getCartesReprint,
  mettreAJourStatusCarte,
  CarteReprintData,
} from "@/services/cartes-reprint/cartesReprintService";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Réimpression des cartes roses",
  description: "Gestion des cartes roses nécessitant une réimpression",
};

// Composant de chargement pour les statistiques
function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-300 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

// Composant de chargement pour le tableau
function TableLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <div className="h-12 bg-gray-200 rounded col-span-2"></div>
                <div className="h-12 bg-gray-200 rounded col-span-1"></div>
                <div className="h-12 bg-gray-200 rounded col-span-1"></div>
                <div className="h-12 bg-gray-200 rounded col-span-1"></div>
                <div className="h-12 bg-gray-200 rounded col-span-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant serveur principal
export default async function ReimpressionPage() {
  // Note: useAuth ne peut pas être utilisé dans un composant serveur
  // Nous devons passer l'utilisateur via le composant client
  // ou utiliser une autre méthode d'authentification côté serveur

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête - Statique */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cartes à Réimprimer
            </h1>
            <p className="text-gray-600 mt-2">
              Gestion des cartes roses nécessitant une réimpression
            </p>
          </div>
        </div>

        {/* Statistiques avec Suspense */}
        <Suspense fallback={<StatsLoading />}>
          {/* Les statistiques seront chargées côté client */}
        </Suspense>

        {/* Tableau avec Suspense */}
        <Suspense fallback={<TableLoading />}>
          <CartesReprintClient />
        </Suspense>
      </div>
    </div>
  );
}
