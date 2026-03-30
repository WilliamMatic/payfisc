"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import InscriptionVignetteForm from "./InscriptionVignetteForm";
import { useParams } from "next/navigation";

function InscriptionContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const plaque = searchParams.get("plaque");
  const operationId = params.id as string;

  if (!plaque) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-red-50/30 flex items-center justify-center py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-5">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paramètre manquant
          </h1>
          <p className="text-gray-500 mb-6">
            Le numéro de plaque est requis pour accéder à cette page.
          </p>
          <Link
            href={`/activity/operations/${operationId}/vente-vignette`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la vente de vignette
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/activity/operations/${operationId}/vente-vignette`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la recherche
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inscription & Vente de Vignette
              </h1>
              <p className="text-gray-600 mt-1">
                Enregistrement d&apos;un nouveau véhicule et paiement de la vignette
              </p>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white px-4 py-2 rounded-xl">
              <span className="text-sm font-bold">Plaque: {plaque}</span>
            </div>
          </div>
        </div>

        <InscriptionVignetteForm
          plaque={plaque}
          operationId={operationId}
        />
      </div>
    </div>
  );
}

export default function InscriptionVignetteClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <InscriptionContent />
    </Suspense>
  );
}
