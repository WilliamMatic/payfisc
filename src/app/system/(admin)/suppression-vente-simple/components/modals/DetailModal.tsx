"use client";

import { useEffect } from "react";
import { User, Bike, DollarSign, Phone, X, Building } from "lucide-react";
import type { VenteNonGrossiste } from "@/services/ventes/ventesService";

interface DetailModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onClose: () => void;
  getSiteName: (siteId: number) => string;
}

const formatMontant = (montant: number): string => {
  return `${montant.toFixed(2).replace(".", ",")} $`;
};

export default function DetailModal({
  isOpen,
  vente,
  onClose,
  getSiteName,
}: DetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !vente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Détails de la vente
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Transaction #{vente.paiement_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Client */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations du client
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    Nom complet:
                  </span>
                  <span className="text-gray-900 font-bold">
                    {vente.nom} {vente.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">ID Client:</span>
                  <span className="text-gray-900">{vente.particulier_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="text-gray-900">
                    <a
                      href={`tel:${vente.telephone}`}
                      className="hover:text-blue-600"
                    >
                      {vente.telephone}
                    </a>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {vente.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Adresse:</span>
                  <span className="text-gray-900">
                    {vente.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">NIF:</span>
                  <span className="text-gray-900">
                    {vente.nif || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    Nombre d'engins:
                  </span>
                  <span className="text-gray-900">
                    {vente.nb_engins_particulier}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Véhicule */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <Bike className="w-5 h-5 mr-2" />
                Informations du véhicule
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Numéro de plaque:
                  </span>
                  <span className="text-red-600 font-bold text-lg">
                    {vente.numero_plaque}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Type:</span>
                  <span className="text-gray-900">{vente.type_engin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Marque:</span>
                  <span className="text-gray-900">{vente.marque}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">ID Engin:</span>
                  <span className="text-gray-900">{vente.engin_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">ID Série:</span>
                  <span className="text-gray-900">{vente.serie_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    ID Item Série:
                  </span>
                  <span className="text-gray-900">{vente.serie_item_id}</span>
                </div>
              </div>
            </div>

            {/* Section Transaction */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Informations de transaction
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Montant:</span>
                  <span
                    className={`text-lg font-bold ${
                      parseFloat(vente.montant.toString()) > 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatMontant(parseFloat(vente.montant.toString()))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Montant initial:
                  </span>
                  <span className="text-gray-900">
                    {vente.montant_initial
                      ? formatMontant(
                          parseFloat(vente.montant_initial.toString()),
                        )
                      : formatMontant(parseFloat(vente.montant.toString()))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Date Paiement:
                  </span>
                  <span className="text-gray-900">{vente.date_paiement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Mode:</span>
                  <span className="text-gray-900">{vente.mode_paiement}</span>
                </div>
                {vente.operateur && (
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Opérateur:
                    </span>
                    <span className="text-gray-900">{vente.operateur}</span>
                  </div>
                )}
                {vente.numero_transaction && (
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Numéro transaction:
                    </span>
                    <span className="text-gray-900">
                      {vente.numero_transaction}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section Site et Agent */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Site et Agent
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site:</span>
                  <span className="text-gray-900">
                    {getSiteName(vente.site_id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Agent:</span>
                  <span className="text-gray-900">{vente.utilisateur_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site ID:</span>
                  <span className="text-gray-900">{vente.site_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">
                    Créateur ID:
                  </span>
                  <span className="text-gray-900">{vente.createur_engin}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
