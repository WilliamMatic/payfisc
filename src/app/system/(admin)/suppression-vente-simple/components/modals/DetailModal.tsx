"use client";

import { useEffect } from "react";
import {
  User,
  Bike,
  DollarSign,
  Phone,
  X,
  Building,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Wallet,
  Hash,
  ShoppingCart,
} from "lucide-react";
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
          {/* En-tête gradient */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Détails de la vente
                </h3>
                <p className="text-emerald-100 text-sm">
                  Transaction #{vente.paiement_id}
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

          {/* Montant + Plaque résumé */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Numéro de plaque</div>
                <div className="text-lg font-bold text-red-600">{vente.numero_plaque}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Montant</div>
                <div className={`text-lg font-bold ${parseFloat(vente.montant.toString()) > 0 ? "text-green-600" : "text-gray-600"}`}>
                  {formatMontant(parseFloat(vente.montant.toString()))}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-sm font-medium">{vente.nom} {vente.prenom}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <a href={`tel:${vente.telephone}`} className="text-sm font-medium hover:text-blue-600">
                        {vente.telephone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{vente.email || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm font-medium">{vente.adresse || "Non renseignée"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="text-sm font-medium">{vente.nif || "Non renseigné"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nombre d&apos;engins</p>
                      <p className="text-sm font-medium">{vente.nb_engins_particulier}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Véhicule */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bike className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Véhicule</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Bike className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Numéro de plaque</p>
                      <p className="text-sm font-bold text-red-600">{vente.numero_plaque}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-medium">{vente.type_engin}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Marque</p>
                      <p className="text-sm font-medium">{vente.marque}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Transaction */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Transaction</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Montant initial</p>
                      <p className="text-sm font-medium">
                        {vente.montant_initial
                          ? formatMontant(parseFloat(vente.montant_initial.toString()))
                          : formatMontant(parseFloat(vente.montant.toString()))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Date paiement</p>
                      <p className="text-sm font-medium">{vente.date_paiement}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Mode</p>
                      <p className="text-sm font-medium">{vente.mode_paiement}</p>
                    </div>
                  </div>
                  {vente.operateur && (
                    <div className="flex items-start space-x-3">
                      <Wallet className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Opérateur</p>
                        <p className="text-sm font-medium">{vente.operateur}</p>
                      </div>
                    </div>
                  )}
                  {vente.numero_transaction && (
                    <div className="flex items-start space-x-3">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">N° transaction</p>
                        <p className="text-sm font-medium">{vente.numero_transaction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Site et Agent */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Building className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Site & Agent</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Site</p>
                      <p className="text-sm font-medium">{getSiteName(vente.site_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Agent</p>
                      <p className="text-sm font-medium">{vente.utilisateur_nom}</p>
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
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
