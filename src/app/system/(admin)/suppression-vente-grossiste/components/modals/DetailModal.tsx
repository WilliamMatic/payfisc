"use client";

import { useState, useEffect } from "react";
import {
  User,
  Car,
  DollarSign,
  X,
  Building,
  BarChart3,
  AlertCircle,
  Loader2,
  Package,
  Hash,
  Calendar,
  CreditCard,
  Percent,
  Wallet,
  Phone,
  Mail,
  MapPin,
  FileText,
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* En-tête gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Détails de la commande
                </h3>
                <p className="text-blue-100 text-sm">
                  #{commande.id} • {commande.nombre_plaques} plaque(s)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Montants résumé */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Montant initial</div>
                <div className="text-lg font-bold text-gray-700">{formatMontant(commande.montant_initial)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Montant final</div>
                <div className="text-lg font-bold text-green-600">{formatMontant(commande.montant)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Prix unitaire</div>
                <div className="text-lg font-bold text-gray-700">
                  {formatMontant(commande.montant_initial / commande.nombre_plaques)}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section Client */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Client</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nom complet</p>
                      <p className="text-sm font-medium">{commande.nom} {commande.prenom}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <a href={`tel:${commande.telephone}`} className="text-sm font-medium hover:text-blue-600">
                        {commande.telephone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{commande.email || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm font-medium">{commande.adresse || "Non renseignée"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="text-sm font-medium">{commande.nif || "Non renseigné"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Commande */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Commande</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Date paiement</p>
                      <p className="text-sm font-medium">{formatDate(commande.date_paiement)}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nombre de plaques</p>
                      <p className="text-sm font-bold">{commande.nombre_plaques}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Percent className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Réduction</p>
                      <p className="text-sm font-medium">{getReductionText()}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Mode paiement</p>
                      <p className="text-sm font-medium">{commande.mode_paiement}</p>
                    </div>
                  </div>
                  {commande.operateur && (
                    <div className="flex items-start space-x-3">
                      <Wallet className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Opérateur</p>
                        <p className="text-sm font-medium">{commande.operateur}</p>
                      </div>
                    </div>
                  )}
                  {commande.numero_transaction && (
                    <div className="flex items-start space-x-3">
                      <BarChart3 className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">N° Transaction</p>
                        <p className="text-sm font-medium">{commande.numero_transaction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Plaques */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Car className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Plaques attribuées</h4>
                </div>
                {loadingPlaques ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                  </div>
                ) : plaquesList.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      {plaquesList.map((plaque, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-sm"
                        >
                          <span className="font-bold text-red-600 text-sm">{plaque}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      {plaquesList.length} plaque(s) attribuée(s)
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune plaque trouvée</p>
                  </div>
                )}
              </div>

              {/* Section Site et Agent */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Site & Caissier</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Site</p>
                      <p className="text-sm font-medium">{commande.site_nom}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Caissier</p>
                      <p className="text-sm font-medium">{commande.caissier}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
