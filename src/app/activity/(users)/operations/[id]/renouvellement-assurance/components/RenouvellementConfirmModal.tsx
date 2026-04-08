"use client";

import { useState } from "react";
import {
  X,
  RefreshCw,
  Loader2,
  CheckCircle,
  Calendar,
  User,
  Bike,
  AlertCircle,
} from "lucide-react";
import { Assurance } from "./types";
import { renouvelerAssurance } from "@/services/assurance-moto/assuranceMotoService";

interface RenouvellementConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  assurance: Assurance | null;
  montant: number;
  utilisateur: any;
}

export default function RenouvellementConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  assurance,
  montant,
  utilisateur,
}: RenouvellementConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !assurance) return null;

  const handleRenouvellement = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await renouvelerAssurance({
        assurance_id: assurance.id,
        utilisateur_id: utilisateur?.id,
        utilisateur_name: utilisateur?.nom_complet || '',
        site_id: utilisateur?.site_id || 0,
        impot_id: 19,
        montant: montant,
        duree_mois: 12,
      });

      if (result.status === 'success') {
        setIsProcessing(false);
        onSuccess(result.data);
      } else {
        setError(result.message || 'Erreur lors du renouvellement');
        setIsProcessing(false);
      }
    } catch {
      setError('Erreur réseau lors du renouvellement');
      setIsProcessing(false);
    }
  };

  const dateExpiration = new Date(assurance.date_expiration);
  const nouvelleDate = new Date();
  nouvelleDate.setMonth(nouvelleDate.getMonth() + 12);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay avec opacité */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation de renouvellement
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps */}
          <div className="px-6 py-6">
            {/* Message de confirmation */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <RefreshCw className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Confirmez-vous le renouvellement ?
              </p>
              <p className="text-sm text-gray-500">
                L&apos;assurance sera renouvelée pour une durée de 12 mois
              </p>
            </div>

            {/* Montant */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Montant à payer</p>
              <p className="text-4xl font-bold text-gray-900">{montant}$</p>
              <p className="text-xs text-gray-500 mt-1">
                Taxe de renouvellement assurance moto
              </p>
            </div>

            {/* Résumé des informations */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-3">Récapitulatif</p>

              <div className="space-y-3">
                {/* Assujetti */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Assujetti</p>
                    <p className="text-sm font-medium">
                      {assurance.assujetti.nom_complet}
                    </p>
                  </div>
                </div>

                {/* Véhicule */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Bike className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Véhicule</p>
                    <p className="text-sm font-medium">
                      {assurance.engin.marque} {assurance.engin.modele} -{" "}
                      {assurance.engin.numero_plaque}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500">Expire le</span>
                      <span className="text-xs font-medium text-red-600">
                        {dateExpiration.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">
                        Nouvelle expiration
                      </span>
                      <span className="text-xs font-medium text-green-600">
                        {nouvelleDate.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note d'information */}
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <p>
                Le renouvellement prolongera la validité de l&apos;assurance pour 12
                mois à compter de la date d&apos;expiration actuelle.
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mt-4 bg-red-50 rounded-lg p-3 text-xs text-red-700 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleRenouvellement}
              disabled={isProcessing}
              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer le renouvellement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
