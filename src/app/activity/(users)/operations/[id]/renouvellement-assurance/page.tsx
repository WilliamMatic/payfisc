import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import RenouvellementList from "./components/RenouvellementList";
import React from "react";
import { getImpotById } from "@/services/impots/impotService";
import { getTauxActif } from "@/services/taux/tauxService";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RenouvellementAssurancePage({
  params,
}: PageProps) {
  const { id } = await params;

  const impotResult = await getImpotById(id);
  const impot = impotResult.status === "success" ? impotResult.data : null;

  if (!impot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-red-50/30 flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-5">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Impôt introuvable</h1>
          <p className="text-gray-500 mb-6">
            L&apos;impôt avec l&apos;identifiant <span className="font-mono font-bold text-red-600">#{id}</span> n&apos;existe pas ou a été supprimé.
          </p>
          <Link
            href="/activity/operations"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux opérations
          </Link>
        </div>
      </div>
    );
  }

  const prix = Number(impot.prix) || 0;

  const tauxResult = await getTauxActif({ impot_id: impot.id });
  const tauxCdf = tauxResult.status === "success" && tauxResult.data
    ? Number(tauxResult.data.valeur) || 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/activity/operations/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux services
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Renouvellement d&apos;Assurance Moto
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les assurances expirées et proches d&apos;expiration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-xl">
                <span className="text-sm font-medium">Montant: {prix}$</span>
              </div>
              {tauxCdf > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl">
                  <span className="text-sm font-medium">Taux: {tauxCdf.toLocaleString()} CDF</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <RenouvellementList impot={impot} />
      </div>
    </div>
  );
}
