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
  Hash,
  Wrench,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  ListChecks,
} from "lucide-react";
import { ControleTechnique } from "./types";
import ResultatsControle from "./ResultatsControle";

interface ControleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controle: ControleTechnique | null;
  onDelete: () => void;
  onEdit: () => void;
}

export default function ControleDetailsModal({
  isOpen,
  onClose,
  controle,
  onDelete,
  onEdit,
}: ControleDetailsModalProps) {
  if (!isOpen || !controle) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDecisionBadge = () => {
    switch (controle.decision_finale) {
      case "favorable":
        return {
          text: "Favorable",
          class: "bg-green-100 text-green-800 border-green-200",
          icon: ThumbsUp,
        };
      case "defavorable":
        return {
          text: "Défavorable",
          class: "bg-red-100 text-red-800 border-red-200",
          icon: ThumbsDown,
        };
      default:
        return {
          text: "En attente",
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
        };
    }
  };

  const getStatutBadge = () => {
    switch (controle.statut) {
      case "termine":
        return {
          text: "Terminé",
          class: "bg-blue-100 text-blue-800 border-blue-200",
          icon: CheckCircle,
        };
      case "en-cours":
        return {
          text: "En cours",
          class: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Clock,
        };
      default:
        return {
          text: controle.statut,
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
        };
    }
  };

  const decision = getDecisionBadge();
  const statut = getStatutBadge();
  const DecisionIcon = decision.icon;
  const StatutIcon = statut.icon;

  // Statistiques des résultats
  const statsResultats = {
    bon: controle.resultats.filter((r) => r.statut === "bon").length,
    mauvais: controle.resultats.filter((r) => r.statut === "mauvais").length,
    nonCommence: controle.resultats.filter((r) => r.statut === "non-commence")
      .length,
    total: controle.resultats.length,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Détails du contrôle technique
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
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statut.class}`}
              >
                <StatutIcon className="w-4 h-4 mr-1.5" />
                {statut.text}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${decision.class}`}
              >
                <DecisionIcon className="w-4 h-4 mr-1.5" />
                {decision.text}
              </span>
              <span className="text-sm text-gray-500 ml-auto">
                Réf: {controle.reference}
              </span>
            </div>

            {/* Informations générales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Dates et informations */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  Dates et informations
                </h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date création</span>
                    <span className="font-medium">
                      {formatDate(controle.date_creation)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date contrôle</span>
                    <span className="font-medium">
                      {controle.date_controle
                        ? formatDate(controle.date_controle)
                        : "Pas encore réalisé"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">PV généré</span>
                    <span className="font-medium">
                      {controle.pv_generated ? "Oui" : "Non"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques des résultats */}
              <div className="bg-gray-50 rounded-xl p-4 lg:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <ListChecks className="w-4 h-4 mr-2 text-gray-500" />
                  Résultats du contrôle
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {statsResultats.bon}
                    </div>
                    <div className="text-xs text-gray-500">Bon</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {statsResultats.mauvais}
                    </div>
                    <div className="text-xs text-gray-500">Mauvais</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">
                      {statsResultats.nonCommence}
                    </div>
                    <div className="text-xs text-gray-500">Non commencé</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations Assujetti et Véhicule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Assujetti */}
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
                        {controle.assujetti.nom_complet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm">
                        {controle.assujetti.telephone || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm">{controle.assujetti.adresse}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">NIF</p>
                      <p className="text-sm">
                        {controle.assujetti.nif || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">
                        {controle.assujetti.email || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Véhicule */}
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
                        {controle.engin.numero_plaque}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Bike className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Marque</p>
                      <p className="text-sm">
                        {controle.engin.marque}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Année</p>
                        <p className="text-sm">
                          {controle.engin.annee_fabrication}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Palette className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Couleur</p>
                        <p className="text-sm">
                          {controle.engin.couleur || "—"}
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
                          {controle.engin.energie || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Gauge className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Puissance</p>
                        <p className="text-sm">
                          {controle.engin.puissance_fiscal} CV
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Component className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Châssis</p>
                      <p className="text-sm font-mono">
                        {controle.engin.numero_chassis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Cpu className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Moteur</p>
                      <p className="text-sm font-mono">
                        {controle.engin.numero_moteur}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Résultats détaillés du contrôle */}
            <div className="mb-6">
              <ResultatsControle resultats={controle.resultats} />
            </div>

            {/* Note d'avertissement */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Attention - Zone de suppression
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    La suppression de ce contrôle technique est irréversible.
                    Les résultats associés seront définitivement effacés.
                    Les données du véhicule et de l&apos;assujetti seront
                    conservées.
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
                onClick={onEdit}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all flex items-center"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier les résultats
              </button>
              <button
                onClick={onDelete}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ce contrôle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
