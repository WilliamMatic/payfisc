"use client";

import { useState } from "react";
import {
  Search,
  AlertCircle,
  Loader2,
  Ticket,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AssujettiInfo from "./AssujettiInfo";
import EnginInfo from "./EnginInfo";
import ConfirmationModal from "../modals/ConfirmationModal";
import InscriptionModal from "../modals/InscriptionModal";
import SuccessModal from "../modals/SuccessModal";
import { verifierPaiementBancaire, delivrerVignetteBancaire, inscrireAssujetti } from "@/services/vente-vignette/venteVignetteService";
import { useAuth } from "@/contexts/AuthContext";
import { Assujetti, Engin, Paiement } from "./types";

interface Impot {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  prix?: number;
}

interface DelivranceSearchProps {
  impot: Impot;
}

export default function DelivranceSearch({ impot }: DelivranceSearchProps) {
  const { utilisateur } = useAuth();
  const [reference, setReference] = useState("");
  const [plaque, setPlaque] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [resultat, setResultat] = useState<{
    assujetti: Assujetti;
    engin: Engin;
    paiement: Paiement;
  } | null>(null);

  // États des modaux
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [delivranceData, setDelivranceData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paiementBackend, setPaiementBackend] = useState<any>(null);

  const validatePlaque = (value: string): boolean => {
    const regex = /^[A-Za-z]{2}\d{3}$/;
    return regex.test(value);
  };

  const validateReference = (value: string): boolean => {
    return value.length > 0 && value.trim() !== "";
  };

  const handleSearch = async () => {
    const referenceUpper = reference.toUpperCase().trim();
    const plaqueUpper = plaque.toUpperCase();

    if (!validateReference(referenceUpper)) {
      setError("Veuillez entrer un numéro de référence");
      return;
    }

    if (!validatePlaque(plaqueUpper)) {
      setError(
        "Format de plaque invalide. Utilisez le format: AA256 (2 lettres + 3 chiffres)",
      );
      return;
    }

    setError(null);
    setIsLoading(true);
    setSearchPerformed(true);

    try {
      const result = await verifierPaiementBancaire(referenceUpper, plaqueUpper);

      if (result.status === 'success' && result.data) {
        // Référence et plaque correspondent → afficher les infos
        const d = result.data;
        setPaiementBackend(d);
        setResultat({
          assujetti: {
            id: d.assujetti?.id || 0,
            nom_complet: d.assujetti?.nom_complet || '',
            telephone: d.assujetti?.telephone || '',
            adresse: d.assujetti?.adresse || '',
            nif: d.assujetti?.nif || '',
            email: d.assujetti?.email || '',
          },
          engin: {
            id: d.engin?.id || 0,
            numero_plaque: d.engin?.numero_plaque || plaqueUpper,
            marque: d.engin?.marque || '',
            modele: d.engin?.modele || '',
            couleur: d.engin?.couleur || '',
            energie: d.engin?.energie || '',
            usage_engin: d.engin?.usage_engin || '',
            puissance_fiscal: d.engin?.puissance_fiscal || '',
            annee_fabrication: d.engin?.annee_fabrication || '',
            annee_circulation: d.engin?.annee_circulation || '',
            numero_chassis: d.engin?.numero_chassis || '',
            numero_moteur: d.engin?.numero_moteur || '',
            type_engin: d.engin?.type_engin || '',
          },
          paiement: {
            id: d.paiement?.id || 0,
            montant: d.paiement?.montant || 0,
            montant_initial: d.paiement?.montant || 0,
            mode_paiement: d.paiement?.mode_paiement || '',
            operateur: null,
            numero_transaction: d.paiement_bancaire?.reference_bancaire || referenceUpper,
            date_paiement: d.paiement?.date_paiement || '',
            statut: d.paiement?.statut || 'completed',
          },
        });
        setShowConfirmationModal(false);
      } else if (result.status === 'inscription_required' && result.data) {
        // Référence trouvée mais plaque pas enregistrée → inscription
        setPaiementBackend(result.data);
        setShowInscriptionModal(true);
      } else {
        // Référence non trouvée
        setError(result.message || "Aucun paiement trouvé avec cette référence. Vérifiez le numéro et réessayez.");
        setResultat(null);
      }
    } catch {
      setError("Erreur lors de la recherche. Veuillez réessayer.");
      setResultat(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelivrerVignette = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmationSuccess = async () => {
    setShowConfirmationModal(false);

    if (!resultat || !paiementBackend) return;

    try {
      const result = await delivrerVignetteBancaire({
        id_paiement: paiementBackend.paiement?.id || resultat.paiement.id,
        engin_id: resultat.engin.id,
        particulier_id: resultat.assujetti.id,
        utilisateur_id: utilisateur?.id || 0,
        utilisateur_name: utilisateur?.nom_complet || '',
        site_id: paiementBackend.paiement?.site_id || 0,
        impot_id: paiementBackend.paiement?.impot_id || impot.id,
        type_mouvement: 'delivrance',
        duree_mois: 6,
      });

      if (result.status === 'success' && result.data) {
        setDelivranceData({
          site: result.data.site,
          assujetti: resultat.assujetti,
          engin: resultat.engin,
          paiement: resultat.paiement,
          delivrance: result.data.delivrance,
        });
        setShowSuccessModal(true);
      } else {
        setError(result.message || "Erreur lors de la délivrance");
      }
    } catch {
      setError("Erreur lors de la délivrance. Veuillez réessayer.");
    }
  };

  const handleInscriptionSuccess = async (data: {
    assujetti: Assujetti;
    engin: Engin;
  }) => {
    setShowInscriptionModal(false);

    // Après inscription réussie, faire une nouvelle recherche pour récupérer les données complètes
    try {
      const result = await verifierPaiementBancaire(reference.toUpperCase().trim(), plaque.toUpperCase());

      if (result.status === 'success' && result.data) {
        const d = result.data;
        setPaiementBackend(d);
        setResultat({
          assujetti: data.assujetti,
          engin: data.engin,
          paiement: {
            id: d.paiement?.id || 0,
            montant: d.paiement?.montant || 0,
            montant_initial: d.paiement?.montant || 0,
            mode_paiement: d.paiement?.mode_paiement || '',
            operateur: null,
            numero_transaction: d.paiement_bancaire?.reference_bancaire || reference,
            date_paiement: d.paiement?.date_paiement || '',
            statut: d.paiement?.statut || 'completed',
          },
        });
        // Ouvrir la confirmation directement
        setTimeout(() => {
          setShowConfirmationModal(true);
        }, 100);
      }
    } catch {
      // Si la re-vérification échoue, on utilise les données d'inscription
      setResultat({
        assujetti: data.assujetti,
        engin: data.engin,
        paiement: {
          id: paiementBackend?.paiement?.id || 0,
          montant: paiementBackend?.paiement?.montant || 0,
          montant_initial: paiementBackend?.paiement?.montant || 0,
          mode_paiement: paiementBackend?.paiement?.mode_paiement || '',
          operateur: null,
          numero_transaction: paiementBackend?.paiement_bancaire?.reference_bancaire || reference,
          date_paiement: paiementBackend?.paiement?.date_paiement || '',
          statut: 'completed',
        },
      });
    }
  };

  const handleInscriptionClose = () => {
    setShowInscriptionModal(false);
    // Réinitialiser la recherche
    setSearchPerformed(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setResultat(null);
    setReference("");
    setPlaque("");
    setSearchPerformed(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
        {/* Barre de recherche double */}
        <div className="flex flex-col gap-4">
          {/* Ligne 1: Référence */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value.toUpperCase());
                  setError(null);
                  setSearchPerformed(false);
                }}
                onKeyPress={(e) =>
                  e.key === "Enter" && plaque && handleSearch()
                }
                placeholder="Numéro de référence paiement"
                className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Ligne 2: Plaque */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={plaque}
                onChange={(e) => {
                  setPlaque(e.target.value.toUpperCase());
                  setError(null);
                  setSearchPerformed(false);
                }}
                onKeyPress={(e) =>
                  e.key === "Enter" && reference && handleSearch()
                }
                placeholder="Entrez la plaque (ex: AA256)"
                className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                maxLength={5}
                disabled={isLoading}
              />
              {plaque && !validatePlaque(plaque) && (
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading || !reference || !plaque}
              className={`
                px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 
                text-white font-semibold rounded-xl
                hover:from-emerald-700 hover:to-emerald-600
                transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-emerald-200/50 hover:shadow-xl
                flex items-center justify-center min-w-[140px]
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Message d'info sur la recherche */}
        {!resultat && !error && searchPerformed && !isLoading && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 text-sm">
              Référence trouvée mais véhicule non enregistré. Veuillez compléter
              les informations.
            </p>
          </div>
        )}

        {/* Indication format */}
        <div className="mt-3 text-xs text-gray-500 flex flex-col gap-1">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
            Format référence: Numéro de transaction (ex: VIGN-123456789-123)
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
            Format plaque: 2 lettres + 3 chiffres (ex: AA256, AR784, EC012)
          </div>
        </div>
      </div>

      {/* Résultats de recherche */}
      {resultat && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations assujetti */}
          <div className="lg:col-span-1">
            <AssujettiInfo assujetti={resultat.assujetti} />
          </div>

          {/* Informations engin */}
          <div className="lg:col-span-2">
            <EnginInfo engin={resultat.engin} />

            {/* Informations paiement */}
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">Statut paiement</p>
                  <p className="text-sm font-bold text-blue-800 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    Payé le {resultat.paiement.date_paiement}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Référence</p>
                  <p className="text-sm font-mono font-bold text-blue-800">
                    {resultat.paiement.numero_transaction}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleDelivrerVignette}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-200/50 hover:shadow-xl flex items-center"
              >
                <Ticket className="w-5 h-5 mr-2" />
                Délivrer la vignette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modaux */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onSuccess={handleConfirmationSuccess}
        assujetti={resultat?.assujetti}
        engin={resultat?.engin}
        paiement={resultat?.paiement}
      />

      <InscriptionModal
        isOpen={showInscriptionModal}
        onClose={handleInscriptionClose}
        onSuccess={handleInscriptionSuccess}
        reference={reference}
        plaque={plaque}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={delivranceData}
      />
    </>
  );
}
