"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Eye,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Wrench,
} from "lucide-react";
import ControleDetailsModal from "./ControleDetailsModal";
import SuppressionConfirmModal from "./SuppressionConfirmModal";
import SuccessModal from "./SuccessModal";
import ModificationResultatsModal from "./ModificationResultatsModal";
import { fetchControles } from "@/app/services/controle-technique/controleTechniqueService";
import { ControleTechnique, SuppressionData, Stats } from "./types";

type FiltreDecision = "tous" | "favorable" | "defavorable";
type FiltreStatut = "tous" | "termine" | "en-cours";

interface Filtres {
  decision: FiltreDecision;
  statut: FiltreStatut;
  dateDebut: string;
  dateFin: string;
}

export default function SuppressionControleList() {
  const [controles, setControles] = useState<ControleTechnique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination serveur
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Stats depuis l'API
  const [stats, setStats] = useState<Stats>({
    total: 0,
    favorables: 0,
    defavorables: 0,
    en_cours: 0,
  });

  // Filtres
  const [filtres, setFiltres] = useState<Filtres>({
    decision: "tous",
    statut: "tous",
    dateDebut: "",
    dateFin: "",
  });

  // Modaux
  const [selectedControle, setSelectedControle] =
    useState<ControleTechnique | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuppressionModal, setShowSuppressionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [suppressionData, setSuppressionData] =
    useState<SuppressionData | null>(null);

  // Charger les données depuis l'API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchControles({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      decision: filtres.decision,
      statut: filtres.statut,
      date_debut: filtres.dateDebut || undefined,
      date_fin: filtres.dateFin || undefined,
    });

    if (result.status === "success") {
      setControles(result.data.controles);
      setTotalItems(result.data.pagination.total);
      setTotalPages(result.data.pagination.total_pages);
      setStats(result.data.stats);
    }
    setIsLoading(false);
  }, [currentPage, itemsPerPage, searchTerm, filtres]);

  // Effet avec debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setFiltres({
      decision: "tous",
      statut: "tous",
      dateDebut: "",
      dateFin: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleViewDetails = (controle: ControleTechnique) => {
    setSelectedControle(controle);
    setShowDetailsModal(true);
  };

  const handleDelete = (controle: ControleTechnique) => {
    setSelectedControle(controle);
    setShowSuppressionModal(true);
  };

  const handleSuppressionSuccess = (data: SuppressionData) => {
    setShowSuppressionModal(false);
    setSuppressionData(data);
    setTimeout(() => {
      setShowSuccessModal(true);
      loadData();
    }, 300);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSelectedControle(null);
  };

  // Fonction pour obtenir le badge de décision
  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
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

  // Fonction pour obtenir le badge de statut
  const getStatutBadge = (statut: string) => {
    switch (statut) {
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
          text: statut,
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
        };
    }
  };

  // Statistiques
  // Les stats viennent de l'API directement

  return (
    <>
      <div className="space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total contrôles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Favorables</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.favorables}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Défavorables</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.defavorables}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En cours</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.en_cours}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
                placeholder="Rechercher par plaque, propriétaire, téléphone, référence..."
                className="block w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border-2 rounded-xl transition-colors flex items-center justify-center ${
                showFilters
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtres
              {(filtres.decision !== "tous" ||
                filtres.statut !== "tous" ||
                filtres.dateDebut ||
                filtres.dateFin) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {(searchTerm ||
              filtres.decision !== "tous" ||
              filtres.statut !== "tous" ||
              filtres.dateDebut ||
              filtres.dateFin) && (
              <button
                onClick={resetFilters}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filtres déroulants */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtre Décision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Décision finale
                  </label>
                  <select
                    value={filtres.decision}
                    onChange={(e) => {
                      setFiltres({
                        ...filtres,
                        decision: e.target.value as FiltreDecision,
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Toutes les décisions</option>
                    <option value="favorable">Favorable</option>
                    <option value="defavorable">Défavorable</option>
                  </select>
                </div>

                {/* Filtre Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filtres.statut}
                    onChange={(e) => {
                      setFiltres({
                        ...filtres,
                        statut: e.target.value as FiltreStatut,
                      });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="termine">Terminé</option>
                    <option value="en-cours">En cours</option>
                  </select>
                </div>

                {/* Filtre Date début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filtres.dateDebut}
                    onChange={(e) => {
                      setFiltres({ ...filtres, dateDebut: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Filtre Date fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filtres.dateFin}
                    onChange={(e) => {
                      setFiltres({ ...filtres, dateFin: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Résumé des filtres actifs */}
              <div className="mt-4 flex flex-wrap gap-2">
                {filtres.decision !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Décision: {filtres.decision}
                  </span>
                )}
                {filtres.statut !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Statut:{" "}
                    {filtres.statut === "termine" ? "Terminé" : "En cours"}
                  </span>
                )}
                {filtres.dateDebut && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Du:{" "}
                    {new Date(filtres.dateDebut).toLocaleDateString("fr-FR")}
                  </span>
                )}
                {filtres.dateFin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Au: {new Date(filtres.dateFin).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Indication recherche */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
              {totalItems} contrôle(s) trouvé(s)
            </div>
          </div>
        </div>

        {/* Tableau des contrôles */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date création
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date contrôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Décision
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-500">
                          Chargement des contrôles...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : controles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">
                          Aucun contrôle trouvé
                        </p>
                        <p className="text-sm text-gray-400">
                          Essayez de modifier vos critères de recherche
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  controles.map((controle) => {
                    const decision = getDecisionBadge(controle.decision_finale);
                    const statut = getStatutBadge(controle.statut);
                    const DecisionIcon = decision.icon;
                    const StatutIcon = statut.icon;

                    return (
                      <tr
                        key={controle.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {controle.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-900">
                            {controle.engin.numero_plaque}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {controle.assujetti.nom_complet}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(
                              controle.date_creation,
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {controle.date_controle
                              ? new Date(
                                  controle.date_controle,
                                ).toLocaleDateString("fr-FR")
                              : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statut.class}`}
                          >
                            <StatutIcon className="w-3 h-3 mr-1" />
                            {statut.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${decision.class}`}
                          >
                            <DecisionIcon className="w-3 h-3 mr-1" />
                            {decision.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                          <button
                            onClick={() => handleViewDetails(controle)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedControle(controle);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Modifier les résultats"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(controle)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pied de tableau avec pagination */}
          {!isLoading && totalItems > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    totalItems,
                  )}{" "}
                  sur {totalItems} contrôle
                  {totalItems > 1 ? "s" : ""}
                </p>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Première page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-red-600 text-white"
                              : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Dernière page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modaux */}
      <ControleDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        controle={selectedControle}
        onDelete={() => {
          setShowDetailsModal(false);
          setTimeout(() => setShowSuppressionModal(true), 100);
        }}
        onEdit={() => {
          setShowDetailsModal(false);
          setTimeout(() => setShowEditModal(true), 100);
        }}
      />

      <SuppressionConfirmModal
        isOpen={showSuppressionModal}
        onClose={() => setShowSuppressionModal(false)}
        onSuccess={handleSuppressionSuccess}
        controle={selectedControle}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={suppressionData}
      />

      {selectedControle && (
        <ModificationResultatsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          controle={selectedControle}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedControle(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
