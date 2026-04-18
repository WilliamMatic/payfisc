"use client";

import { X, User, FileText, CreditCard, MapPin, Trash2, Banknote, Smartphone, Tag } from "lucide-react";
import { PaiementAssainissement } from "./types";

interface PaiementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: PaiementAssainissement | null;
  onDelete: () => void;
}

export default function PaiementDetailsModal({ isOpen, onClose, paiement, onDelete }: PaiementDetailsModalProps) {
  if (!isOpen || !paiement) return null;

  const nomComplet = `${paiement.contribuable_nom || ""} ${paiement.contribuable_prenom || ""}`.trim();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const formatMontant = (montant: number) => {
    return Number(montant).toLocaleString("fr-FR") + " FC";
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "especes":
        return { text: "Espèces", class: "bg-green-100 text-green-800", icon: Banknote };
      case "mobile_money":
        return { text: "Mobile Money", class: "bg-blue-100 text-blue-800", icon: Smartphone };
      case "carte_bancaire":
        return { text: "Carte bancaire", class: "bg-purple-100 text-purple-800", icon: CreditCard };
      default:
        return { text: mode, class: "bg-gray-100 text-gray-800", icon: Tag };
    }
  };

  const mode = getModeBadge(paiement.mode_paiement);
  const ModeIcon = mode.icon;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-2xl bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Détails du paiement</h3>
                <p className="text-red-200 text-sm mt-1">Réf: {paiement.reference}</p>
              </div>
              <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Contribuable */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                <User className="w-4 h-4 mr-2 text-red-500" /> Contribuable
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Nom complet</p>
                  <p className="text-sm font-medium text-gray-900">{nomComplet || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Référence</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{paiement.contribuable_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.contribuable_tel || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Établissement</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.nom_etablissement || "—"}</p>
                </div>
              </div>
            </div>

            {/* Facture */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                <FileText className="w-4 h-4 mr-2 text-blue-500" /> Facture
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Référence facture</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{paiement.facture_ref}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type de taxe</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.type_taxe_nom || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Période</p>
                  <p className="text-sm font-medium text-gray-900">
                    {paiement.periode_debut ? formatDate(paiement.periode_debut) : "—"} → {paiement.periode_fin ? formatDate(paiement.periode_fin) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut facture</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.facture_statut || "—"}</p>
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                <CreditCard className="w-4 h-4 mr-2 text-emerald-500" /> Paiement
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Référence</p>
                  <p className="text-sm font-mono font-bold text-gray-900">{paiement.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="text-lg font-bold text-emerald-600">{formatMontant(paiement.montant)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mode de paiement</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${mode.class}`}>
                    <ModeIcon className="w-3 h-3 mr-1" />
                    {mode.text}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(paiement.date_paiement)}</p>
                </div>
                {paiement.numero_mobile && (
                  <div>
                    <p className="text-xs text-gray-500">N° Mobile</p>
                    <p className="text-sm font-medium text-gray-900">{paiement.numero_mobile}</p>
                  </div>
                )}
                {paiement.nom_banque && (
                  <div>
                    <p className="text-xs text-gray-500">Banque</p>
                    <p className="text-sm font-medium text-gray-900">{paiement.nom_banque}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Localisation */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                <MapPin className="w-4 h-4 mr-2 text-amber-500" /> Localisation
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Commune</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.commune_nom || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Province</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.province_nom || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Site</p>
                  <p className="text-sm font-medium text-gray-900">{paiement.site_nom || "—"} {paiement.site_code ? `(${paiement.site_code})` : ""}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Fermer
            </button>
            <button onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Supprimer ce paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
