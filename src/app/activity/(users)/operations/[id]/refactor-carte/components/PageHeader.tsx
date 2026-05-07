"use client";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { Impot } from "@/services/impots/impotService";
import { type Etape } from "./types";

interface PageHeaderProps {
  impot: Impot;
  etapeActuelle: Etape;
  onBack: () => void;
}

const ETAPES: Etape[] = ["verification", "confirmation", "recapitulatif"];
const ETAPES_LABELS: Record<Etape, string> = {
  verification: "Vérification",
  confirmation: "Correction",
  recapitulatif: "Terminé",
};

export default function PageHeader({
  impot,
  etapeActuelle,
  onBack,
}: PageHeaderProps) {
  const etapeIndex = ETAPES.indexOf(etapeActuelle);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour aux services</span>
        </button>
        <div className="text-sm text-gray-500">ID: #{impot.id}</div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="bg-[#2D5B7A]/10 p-3 rounded-lg">
          <RefreshCw className="w-8 h-8 text-[#2D5B7A]" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">
            Gestion des Erreurs - Refactorisation
          </h1>
          <p className="text-[13px] text-gray-600 mt-1">
            Correction des informations mal saisies sur les cartes roses
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-[#2D5B7A]/5 rounded-lg border border-[#2D5B7A]/15">
        <p className="text-[#2D5B7A] text-sm">
          Ce service permet de corriger les informations mal saisies sur les
          cartes roses existantes. Saisissez l'identifiant DGRK pour récupérer
          automatiquement les informations du véhicule.
        </p>
      </div>

      {/* INDICATEUR D'ÉTAPE */}
      <div className="mt-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {ETAPES.map((etape, index) => (
            <div key={etape} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  etapeActuelle === etape
                    ? "bg-[#2D5B7A] text-white"
                    : index < etapeIndex
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                }`}
              >
                {index < etapeIndex ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < ETAPES.length - 1 && (
                <div className="w-16 h-1 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-2xl mx-auto mt-2 text-xs text-gray-600">
          {ETAPES.map((etape) => (
            <span key={etape}>{ETAPES_LABELS[etape]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
