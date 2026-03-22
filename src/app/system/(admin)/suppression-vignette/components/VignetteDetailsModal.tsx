"use client";

import {
  X,
  User,
  Bike,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Mail,
  Fuel,
  Gauge,
  Palette,
  Cpu,
  Component,
  Droplets,
  Hash,
  Store,
  CreditCard,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Vignette } from "./types";

interface VignetteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vignette: Vignette | null;
  onDelete: () => void;
}

export default function VignetteDetailsModal({
  isOpen,
  onClose,
  vignette,
  onDelete,
}: VignetteDetailsModalProps) {
  if (!isOpen || !vignette) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutBadge = () => {
    const aujourdhui = new Date();
    const dateExpiration = new Date(vignette.date_expiration);
    const diffJours = Math.ceil(
      (dateExpiration.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dateExpiration < aujourdhui) {
      return {
        text: "Expirée",
        class: "bg-red-100 text-red-800 border-red-200",
        icon: X,
      };
    } else if (diffJours <= 30) {
      return {
        text: `Expire dans ${diffJours} jours`,
        class: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
      };
    } else {
      return {
        text: "Valide",
        class: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      };
    }
  };

  const getTypeBadge = () => {
    switch (vignette.type) {
      case "achat":
        return {
          text: "Achat",
          class: "bg-blue-100 text-blue-800 border-blue-200",
          icon: CreditCard,
        };
      case "delivrance":
        return {
          text: "Délivrance",
          class: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle,
        };
      case "renouvellement":
        return {
          text: "Renouvellement",
          class: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Clock,
        };
      default:
        return {
          text: vignette.type,
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Tag,
        };
    }
  };

  const statut = getStatutBadge();
  const type = getTypeBadge();
  const StatutIcon = statut.icon;
  const TypeIcon = type.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Détails de la vignette
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
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Badges */}
            <div className="mb-6 flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${type.class}`}
              >
                <TypeIcon className="w-4 h-4 mr-1.5" />
                {type.text}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statut.class}`}
              >
                <StatutIcon className="w-4 h-4 mr-1.5" />
                {statut.text}
              </span>
              <span className="text-sm text-gray-500 ml-auto">
                ID: {vignette.id}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations Assujetti */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Informations Assujetti
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Nom complet</p>
                      <p className="text-sm font-medium">
                        {vignette.assujetti.nom_complet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm">
                        {vignette.assujetti.telephone || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm">{vignette.assujetti.adresse}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="text-sm">
                        {vignette.assujetti.nif || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">
                        {vignette.assujetti.email || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations Véhicule */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Bike className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Informations Véhicule
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Plaque</p>
                      <p className="text-sm font-mono font-bold">
                        {vignette.engin.numero_plaque}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Bike className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Marque/Modèle</p>
                      <p className="text-sm">
                        {vignette.engin.marque} {vignette.engin.modele}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Année</p>
                        <p className="text-sm">
                          {vignette.engin.annee_fabrication}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Palette className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Couleur</p>
                        <p className="text-sm">
                          {vignette.engin.couleur || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <Fuel className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Énergie</p>
                        <p className="text-sm">
                          {Number(vignette.engin.energie) === 1
                            ? "Essence"
                            : Number(vignette.engin.energie) === 2
                              ? "Diesel"
                              : "Électrique"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Gauge className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Puissance</p>
                        <p className="text-sm">
                          {vignette.engin.puissance_fiscal} CV
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Component className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Châssis</p>
                      <p className="text-sm font-mono">
                        {vignette.engin.numero_chassis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Cpu className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Moteur</p>
                      <p className="text-sm font-mono">
                        {vignette.engin.numero_moteur}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de transaction */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations d'achat */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                  <Store className="w-4 h-4 mr-2" />
                  Informations de transaction
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Site</span>
                    <span className="text-sm font-medium text-blue-900">
                      {vignette.site_achat}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Date</span>
                    <span className="text-sm font-medium text-blue-900">
                      {formatDate(vignette.date_achat)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Montant</span>
                    <span className="text-sm font-bold text-blue-900">
                      {vignette.montant_paye}$
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Mode</span>
                    <span className="text-sm capitalize text-blue-900">
                      {vignette.mode_paiement === "espece"
                        ? "Espèces"
                        : "Mobile Money"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700">Référence</span>
                    <span className="text-sm font-mono text-blue-900">
                      {vignette.reference_paiement}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations d'expiration */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Période de validité
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-700">Date d'achat</span>
                    <span className="text-sm font-medium text-amber-900">
                      {formatDate(vignette.date_achat)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-700">
                      Date d'expiration
                    </span>
                    <span className="text-sm font-bold text-amber-900">
                      {formatDate(vignette.date_expiration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-700">Validité</span>
                    <span className="text-sm font-medium text-amber-900">
                      6 mois
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-700">Statut</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statut.class}`}
                    >
                      {statut.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note d'avertissement */}
            <div className="mt-6 bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Attention - Zone de suppression
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    La suppression de cette vignette est irréversible. Toutes
                    les données associées (transaction, informations du véhicule
                    et de l'assujetti) seront définitivement effacées.
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={onDelete}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer cette vignette
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
