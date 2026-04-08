"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle,
  Receipt,
} from "lucide-react";
import { Assujetti, Engin } from "../components/types";
import { enregistrerPaiementAssurance, inscrireAssujetti } from "@/services/assurance-moto/assuranceMotoService";

interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  montant: number;
  assujetti?: Assujetti;
  engin?: Engin;
  impotId: number;
  utilisateur?: any;
  tauxCdf: number;
}

export default function PaiementModal({
  isOpen,
  onClose,
  onSuccess,
  montant,
  assujetti,
  engin,
  impotId,
  utilisateur,
  tauxCdf,
}: PaiementModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroAssurance, setNumeroAssurance] = useState("");

  if (!isOpen) return null;

  const handlePaiement = async () => {
    if (!utilisateur?.id) {
      setError("Données utilisateur manquantes");
      return;
    }
    if (!assujetti || !engin) {
      setError("Données assujetti/engin manquantes");
      return;
    }
    if (!numeroAssurance.trim()) {
      setError("Le numéro d'assurance est obligatoire");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let particulierId = assujetti.particulier_id || assujetti.id;
      let enginId = engin.id;

      if (!particulierId || !enginId) {
        const inscription = await inscrireAssujetti({
          nom_complet: assujetti.nom_complet,
          telephone: assujetti.telephone,
          adresse: assujetti.adresse,
          nif: assujetti.nif || '',
          email: assujetti.email || '',
          numero_plaque: engin.numero_plaque,
          marque: engin.marque,
          modele: engin.modele,
          couleur: engin.couleur,
          energie: engin.energie,
          usage_engin: engin.usage_engin,
          puissance_fiscal: engin.puissance_fiscal,
          annee_fabrication: engin.annee_fabrication,
          annee_circulation: engin.annee_circulation || '',
          numero_chassis: engin.numero_chassis,
          numero_moteur: engin.numero_moteur,
          type_engin: engin.type_engin,
          utilisateur_id: utilisateur.id,
          impot_id: String(impotId),
        });

        if (inscription.status !== 'success' || !inscription.data) {
          setError(inscription.message || "Erreur lors de l'inscription");
          setIsProcessing(false);
          return;
        }

        particulierId = inscription.data.assujetti.id;
        enginId = inscription.data.engin.id;
      }

      const result = await enregistrerPaiementAssurance({
        engin_id: enginId,
        particulier_id: particulierId,
        montant: montant,
        montant_initial: montant,
        impot_id: String(impotId),
        mode_paiement: 'espece',
        statut: 'completed',
        utilisateur_id: utilisateur.id,
        site_id: utilisateur.site_id || 0,
        nombre_plaques: 1,
        taux_cdf: tauxCdf,
        numero_assurance: numeroAssurance.trim(),
      });

      if (result.status === 'success') {
        onSuccess(result.data);
      } else {
        setError(result.message || "Erreur lors du paiement");
      }
    } catch (err) {
      console.error("Erreur paiement:", err);
      setError("Erreur réseau lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation de paiement
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Montant à payer</p>
              <p className="text-4xl font-bold text-gray-900">{montant}$</p>
              <p className="text-xs text-gray-500 mt-1">
                Assurance moto
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Mode de paiement
              </p>
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 flex items-center">
                <DollarSign className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <span className="font-bold text-emerald-700">Espèces</span>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Paiement en espèces uniquement
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-2">Récapitulatif</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant HT</span>
                  <span className="font-medium">{montant}$</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">Incluses</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total TTC</span>
                    <span className="text-emerald-600">{montant}$</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro d&apos;assurance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroAssurance}
                onChange={(e) => setNumeroAssurance(e.target.value)}
                placeholder="Saisir le numéro d'assurance"
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${!numeroAssurance.trim() ? 'border-red-300' : 'border-gray-300'}`}
              />
              {!numeroAssurance.trim() && (
                <p className="mt-1 text-xs text-red-500">Ce champ est obligatoire</p>
              )}
            </div>

            {assujetti && (
              <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
                <p className="font-medium text-blue-700 mb-1">Assujetti</p>
                <p>{assujetti.nom_complet}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handlePaiement}
              disabled={isProcessing}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer le paiement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
