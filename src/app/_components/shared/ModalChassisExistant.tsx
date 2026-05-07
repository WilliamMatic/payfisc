"use client";
import { AlertCircle, Info, MapPin, User } from "lucide-react";
import type { ChassisVerificationResponse } from "@/services/carte-rose/carteRoseService";

interface ModalChassisExistantProps {
  isOpen: boolean;
  chassisData: ChassisVerificationResponse["data"];
  onAnnuler: () => void;
  onContinuer: () => void;
}

/**
 * Modal partagée entre carte-rose, client-simple et refactor-carte.
 * Affichée quand un châssis saisi correspond déjà à un autre engin.
 *
 * Nouveau comportement (dupliquer au lieu d'écraser) :
 * l'engin existant n'est PAS modifié — un nouvel engin est créé avec le
 * même châssis et le doublon est tracé dans `engins_chassis_historique`.
 */
export default function ModalChassisExistant({
  isOpen,
  chassisData,
  onAnnuler,
  onContinuer,
}: ModalChassisExistantProps) {
  if (!isOpen || !chassisData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-orange-800">
              Numéro de châssis déjà enregistré
            </h3>
            <p className="text-xs text-orange-600">
              Ce châssis est associé à un autre engin dans le système
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Infos engin existant */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Engin enregistré
            </h4>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-gray-500">Plaque :</span> <span className="font-semibold font-mono text-gray-900">{chassisData.engin.numero_plaque}</span></div>
              <div><span className="text-gray-500">Type :</span> <span className="font-medium text-gray-800">{chassisData.engin.type_engin}</span></div>
              <div><span className="text-gray-500">Marque :</span> <span className="font-medium text-gray-800">{chassisData.engin.marque}</span></div>
              <div><span className="text-gray-500">Couleur :</span> <span className="font-medium text-gray-800">{chassisData.engin.couleur}</span></div>
              <div><span className="text-gray-500">Énergie :</span> <span className="font-medium text-gray-800">{chassisData.engin.energie}</span></div>
              <div><span className="text-gray-500">Puissance :</span> <span className="font-medium text-gray-800">{chassisData.engin.puissance_fiscal}</span></div>
              <div><span className="text-gray-500">Année fab. :</span> <span className="font-medium text-gray-800">{chassisData.engin.annee_fabrication}</span></div>
              <div><span className="text-gray-500">Mise en circ. :</span> <span className="font-medium text-gray-800">{chassisData.engin.annee_circulation}</span></div>
              <div><span className="text-gray-500">N° moteur :</span> <span className="font-medium text-gray-800">{chassisData.engin.numero_moteur}</span></div>
              <div><span className="text-gray-500">Usage :</span> <span className="font-medium text-gray-800">{chassisData.engin.usage_engin}</span></div>
            </div>
          </div>

          {/* Infos propriétaire actuel */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Propriétaire actuel
            </h4>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 space-y-1 text-sm">
              <div><span className="text-blue-600">Nom :</span> <span className="font-semibold text-blue-900">{chassisData.proprietaire.nom} {chassisData.proprietaire.prenom}</span></div>
              <div><span className="text-blue-600">Téléphone :</span> <span className="font-medium text-blue-800">{chassisData.proprietaire.telephone}</span></div>
              <div><span className="text-blue-600">Adresse :</span> <span className="font-medium text-blue-800">{chassisData.proprietaire.adresse}{chassisData.proprietaire.ville ? `, ${chassisData.proprietaire.ville}` : ""}</span></div>
              {chassisData.proprietaire.nif && chassisData.proprietaire.nif !== "-" && (
                <div><span className="text-blue-600">NIF :</span> <span className="font-medium text-blue-800">{chassisData.proprietaire.nif}</span></div>
              )}
            </div>
          </div>

          {/* Site et agent d'enregistrement */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Enregistré par
            </h4>
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span className="text-purple-600">Site :</span>
                <span className="font-semibold text-purple-900">
                  {chassisData.enregistrement.site_nom !== "-"
                    ? chassisData.enregistrement.site_nom
                    : "—"}
                  {chassisData.enregistrement.site_code !== "-" && chassisData.enregistrement.site_code
                    ? ` (${chassisData.enregistrement.site_code})`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span className="text-purple-600">Agent :</span>
                <span className="font-semibold text-purple-900">
                  {chassisData.enregistrement.agent_nom !== "-"
                    ? chassisData.enregistrement.agent_nom
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Avertissements */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                En continuant, l'engin existant ne sera <strong>pas modifié</strong>.
                Un <strong>nouvel engin</strong> sera créé avec le même châssis,
                et le doublon sera tracé dans l'historique.
              </span>
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Assurez-vous que <strong>l'assujetti confirme réellement</strong> que ce châssis lui appartient avant de continuer.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onAnnuler}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
          >
            Annuler — Vider le châssis
          </button>
          <button
            onClick={onContinuer}
            className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Continuer (créer un doublon)
          </button>
        </div>
      </div>
    </div>
  );
}
