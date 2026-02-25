"use client";

import { useState, useEffect } from "react";
import {
  User,
  Car,
  DollarSign,
  Phone,
  X,
  Building,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getDetailsCommande } from "@/services/commande/commandesService";
import type { CommandePlaque } from "@/services/commande/commandesService";

interface DetailModalProps {
  isOpen: boolean;
  commande: CommandePlaque | null;
  onClose: () => void;
}

const formatMontant = (montant: number): string => {
  return `${montant} $`;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};

export default function DetailModal({
  isOpen,
  commande,
  onClose,
}: DetailModalProps) {
  const [loadingPlaques, setLoadingPlaques] = useState(false);
  const [plaquesList, setPlaquesList] = useState<string[]>([]);

  useEffect(() => {
    const loadPlaques = async () => {
      if (!commande) return;

      setLoadingPlaques(true);
      try {
        const result = await getDetailsCommande(commande.id);
        if (result.status === "success" && result.data?.plaques_attribuees) {
          setPlaquesList(result.data.plaques_attribuees);
        }
      } catch (error) {
        console.error("Erreur chargement plaques:", error);
      } finally {
        setLoadingPlaques(false);
      }
    };

    if (isOpen && commande) {
      loadPlaques();
    }
  }, [isOpen, commande]);

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

  if (!isOpen || !commande) return null;

  const getReductionText = () => {
    if (!commande.reduction_type) return "Aucune";

    if (commande.reduction_type === "pourcentage") {
      return `${commande.reduction_valeur}%`;
    } else if (commande.reduction_type === "montant_fixe") {
      return `${formatMontant(commande.reduction_valeur)} par plaque`;
    }
    return "Aucune";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Détails de la commande
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Commande #{commande.id} • {commande.nombre_plaques} plaque(s)
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {commande.nom} {commande.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="text-gray-900">
                    <a
                      href={`tel:${commande.telephone}`}
                      className="hover:text-blue-600"
                    >
                      {commande.telephone}
                    </a>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {commande.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Adresse:</span>
                  <span className="text-gray-900">
                    {commande.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">NIF:</span>
                  <span className="text-gray-900">
                    {commande.nif || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">ID Client:</span>
                  <span className="text-gray-900">
                    {commande.particulier_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Section Commande */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Informations de la commande
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    ID Commande:
                  </span>
                  <span className="text-gray-900 font-bold">
                    #{commande.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Date paiement:
                  </span>
                  <span className="text-gray-900">
                    {formatDate(commande.date_paiement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Nombre plaques:
                  </span>
                  <span className="text-gray-900 font-bold">
                    {commande.nombre_plaques}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Réduction:</span>
                  <span className="text-gray-900">{getReductionText()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">
                    Mode paiement:
                  </span>
                  <span className="text-gray-900">
                    {commande.mode_paiement}
                  </span>
                </div>
                {commande.operateur && (
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">
                      Opérateur:
                    </span>
                    <span className="text-gray-900">{commande.operateur}</span>
                  </div>
                )}
                {commande.numero_transaction && (
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">
                      N° Transaction:
                    </span>
                    <span className="text-gray-900">
                      {commande.numero_transaction}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section Montants */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Montants
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Montant initial:
                  </span>
                  <span className="text-gray-900">
                    {formatMontant(commande.montant_initial)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">
                    Montant final:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatMontant(commande.montant)}
                  </span>
                </div>
                {commande.reduction_type && (
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Économie:
                    </span>
                    <span className="text-green-600 font-bold">
                      {formatMontant(
                        commande.montant_initial - commande.montant,
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-purple-200">
                  <div className="flex justify-between">
                    <span className="text-purple-700 font-medium">
                      Prix unitaire:
                    </span>
                    <span className="text-gray-900">
                      {formatMontant(
                        commande.montant_initial / commande.nombre_plaques,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Plaques */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Plaques attribuées
              </h4>
              {loadingPlaques ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                  <span className="ml-2 text-amber-700">
                    Chargement des plaques...
                  </span>
                </div>
              ) : plaquesList.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {plaquesList.map((plaque, index) => (
                      <div
                        key={index}
                        className="bg-white border border-amber-200 rounded-lg p-3 text-center"
                      >
                        <span className="font-bold text-red-600 text-sm">
                          {plaque}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-amber-200">
                    <p className="text-sm text-amber-700">
                      {plaquesList.length} plaque(s) attribuée(s)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-700">Aucune plaque trouvée</p>
                </div>
              )}
            </div>

            {/* Section Site et Agent */}
            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
              <h4 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Site et Caissier
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-indigo-700 font-medium">Site:</span>
                  <span className="text-gray-900">{commande.site_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700 font-medium">Caissier:</span>
                  <span className="text-gray-900">{commande.caissier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700 font-medium">ID Site:</span>
                  <span className="text-gray-900">{commande.site_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700 font-medium">
                    ID Utilisateur:
                  </span>
                  <span className="text-gray-900">
                    {commande.utilisateur_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700 font-medium">ID Impôt:</span>
                  <span className="text-gray-900">{commande.impot_id}</span>
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
