import Link from "next/link";
import { ArrowLeft, Trash2, Wrench } from "lucide-react";
import SuppressionControleList from "./components/SuppressionControleList";
import React from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SuppressionControlePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header avec retour */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Suppression Contrôles Techniques
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez et supprimez les contrôles techniques et leurs résultats
              </p>
            </div>
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl">
              <span className="text-sm font-medium flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Module de suppression
              </span>
            </div>
          </div>
        </div>

        {/* Composant de liste */}
        <SuppressionControleList />
      </div>
    </div>
  );
}
