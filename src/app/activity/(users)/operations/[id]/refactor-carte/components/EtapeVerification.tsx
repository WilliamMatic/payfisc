"use client";
import { Search, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface EtapeVerificationProps {
  idDGRK: string;
  setIdDGRK: (v: string) => void;
  isLoading: boolean;
  erreurVerification: string;
  setErreurVerification: (v: string) => void;
  handleVerification: () => void;
}

export default function EtapeVerification({
  idDGRK,
  setIdDGRK,
  isLoading,
  erreurVerification,
  setErreurVerification,
  handleVerification,
}: EtapeVerificationProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
          <Search className="w-5 h-5 text-[#2D5B7A]" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">
            Étape 1: Vérification de l&apos;ID DGRK ou Numéro de plaque
          </h2>
          <p className="text-[13px] text-gray-600">
            Saisissez l&apos;identifiant DGRK ou le numéro de plaque pour
            récupérer les informations du véhicule à corriger
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de plaque <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={idDGRK}
            onChange={(e) => {
              setIdDGRK(e.target.value);
              setErreurVerification("");
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-gray-500 text-sm mt-2">
            Le système récupérera automatiquement les informations depuis la
            base MPAKO
          </p>
        </div>

        {erreurVerification && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 text-sm">
                Erreur de vérification
              </h4>
              <p className="text-red-700 text-sm mt-1">{erreurVerification}</p>
            </div>
          </div>
        )}

        <div className="bg-[#2D5B7A]/5 rounded-lg p-4 border border-[#2D5B7A]/15">
          <div className="flex items-start space-x-3">
            <RefreshCw className="w-5 h-5 text-[#2D5B7A] mt-0.5" />
            <div>
              <h4 className="font-semibold text-[#2D5B7A] text-sm">
                Service de Correction
              </h4>
              <div className="text-[15px] font-semibold text-[#2D5B7A]">
                Correction des données
              </div>
              <div className="text-[13px] font-medium text-[#2D5B7A]/80 mt-1">
                Aucun frais supplémentaire
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleVerification}
            disabled={isLoading || !idDGRK.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-[#2D5B7A] text-white rounded-xl hover:bg-[#244D68] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Vérifier et Continuer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
