import { Trash2 } from "lucide-react";
import SuppressionPaiementList from "./components/SuppressionPaiementList";
import React from "react";

export default async function SuppressionPaiementAssainissementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Suppression Paiements Assainissement
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez et supprimez les paiements d&apos;assainissement
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

        <SuppressionPaiementList />
      </div>
    </div>
  );
}
