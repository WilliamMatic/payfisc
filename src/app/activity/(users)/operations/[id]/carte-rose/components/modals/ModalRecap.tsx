"use client";
import { Car, CheckCircle, User } from "lucide-react";
import type { EnginCouleur } from "@/services/couleurs/couleurService";

interface RecapData {
  // Plaque
  numeroPlaque: string;
  // Assujetti
  nom: string;
  prenom: string;
  telephoneAssujetti: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  province: string;
  nif: string;
  // Engin
  typeEngin: string;
  marque: string;
  modele: string;
  energie: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  usage: string;
  numeroChassis: string;
  numeroMoteur: string;
}

interface ModalRecapProps {
  isOpen: boolean;
  recapData: RecapData;
  couleurs: EnginCouleur[];
  isSubmitting: boolean;
  onAnnuler: () => void;
  onConfirmer: () => void;
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value || value === "-" || value.trim() === "") return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
  );
}

export default function ModalRecap({
  isOpen,
  recapData,
  couleurs,
  isSubmitting,
  onAnnuler,
  onConfirmer,
}: ModalRecapProps) {
  if (!isOpen) return null;

  const couleurSelectionnee = couleurs.find((c) => c.nom === recapData.couleur);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h3 className="font-bold text-lg text-gray-900">Confirmation Finale</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Vérifiez les informations avant de valider la délivrance
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Numéro de plaque */}
          <div className="bg-[#2D5B7A]/5 border border-[#2D5B7A]/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[#2D5B7A]">Numéro de plaque</span>
            <span className="text-xl font-bold tracking-widest text-[#2D5B7A]">
              {recapData.numeroPlaque || "—"}
            </span>
          </div>

          {/* Section Assujetti */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Assujetti / Propriétaire</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
              <Row label="Nom" value={recapData.nom} />
              <Row label="Prénom" value={recapData.prenom} />
              <Row label="Téléphone" value={recapData.telephoneAssujetti || "Non fourni"} />
              <Row label="Email" value={recapData.email} />
              <Row label="NIF" value={recapData.nif} />
              <Row label="Adresse" value={recapData.adresse} />
              <Row label="Ville" value={recapData.ville} />
              <Row label="Code postal" value={recapData.code_postal} />
              <Row label="Province" value={recapData.province} />
            </div>
          </div>

          {/* Section Engin */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-b border-green-100">
              <Car className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Engin / Véhicule</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
              <Row label="Type d'engin" value={recapData.typeEngin} />
              <Row label="Marque" value={recapData.marque} />
              <Row label="Modèle" value={recapData.modele} />
              <Row label="Énergie" value={recapData.energie} />
              <Row label="Année de fabrication" value={recapData.anneeFabrication} />
              <Row label="Année de circulation" value={recapData.anneeCirculation} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Couleur</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {couleurSelectionnee && (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: couleurSelectionnee.code_hex }}
                    />
                  )}
                  <span className="font-medium text-gray-900 text-sm">
                    {recapData.couleur || "—"}
                  </span>
                </div>
              </div>
              <Row label="Puissance fiscale" value={recapData.puissanceFiscal} />
              <Row label="Usage" value={recapData.usage} />
              <Row label="N° châssis" value={recapData.numeroChassis} />
              <Row label="N° moteur" value={recapData.numeroMoteur} />
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ Confirmation Requise
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Voulez-vous confirmer la délivrance de cette carte rose ? Cette action est irréversible.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onAnnuler}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirmer la Délivrance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
