"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Store,
  Tag,
  CreditCard,
  RefreshCw,
  Loader2,
} from "lucide-react";
import VignetteDetailsModal from "./VignetteDetailsModal";
import SuppressionConfirmModal from "./SuppressionConfirmModal";
import SuccessModal from "./SuccessModal";
import { listerVignettes, supprimerVignette as supprimerVignetteAPI, VignetteListItem } from "@/services/vente-vignette/venteVignetteService";
import { Vignette, SuppressionData } from "./types";

type FiltreStatut = "tous" | "expire" | "proche" | "valide";
type FiltreType = "tous" | "achat" | "delivrance" | "renouvellement";

interface Filtres {
  statut: FiltreStatut;
  type: FiltreType;
  site: string;
  dateDebut: string;
  dateFin: string;
}

export default function SuppressionList() {
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [filteredVignettes, setFilteredVignettes] = useState<Vignette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sites, setSites] = useState<{ id: number; nom: string; code: string }[]>([]);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // États pour les filtres
  const [filtres, setFiltres] = useState<Filtres>({
    statut: "tous",
    type: "tous",
    site: "tous",
    dateDebut: "",
    dateFin: "",
  });

  // États pour les modaux
  const [selectedVignette, setSelectedVignette] = useState<Vignette | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuppressionModal, setShowSuppressionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [suppressionData, setSuppressionData] =
    useState<SuppressionData | null>(null);

  // Convertir VignetteListItem en Vignette (type UI)
  const convertToVignette = (item: VignetteListItem): Vignette => ({
    id: item.id,
    type: item.type_mouvement || 'achat',
    assujetti: {
      id: item.particulier_id,
      nom_complet: item.nom_complet || '',
      telephone: item.telephone || '',
      adresse: item.adresse || '',
      nif: item.nif || '',
      email: item.email || '',
    },
    engin: {
      id: item.engin_id,
      numero_plaque: item.numero_plaque || '',
      marque: item.marque || '',
      modele: item.modele || '',
      couleur: item.couleur || '',
      energie: item.energie || '',
      usage_engin: item.usage_engin || '',
      puissance_fiscal: item.puissance_fiscal || '',
      annee_fabrication: item.annee_fabrication || '',
      numero_chassis: item.numero_chassis || '',
      numero_moteur: item.numero_moteur || '',
      type_engin: item.type_engin || '',
    },
    paiement: {
      id: item.id_paiement,
      montant: item.montant || 0,
      mode_paiement: item.mode_paiement || '',
      operateur: null,
      numero_transaction: item.code_vignette || '',
      date_paiement: item.date_paiement || '',
    },
    site_achat: item.site_nom || '',
    date_achat: item.date_delivrance || item.date_creation || '',
    date_expiration: item.date_validite || '',
    montant_paye: item.montant || 0,
    mode_paiement: item.mode_paiement || '',
    reference_paiement: item.code_vignette || '',
  });

  // Charger les données
  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await listerVignettes();
      if (result.status === 'success' && result.data) {
        const converted = result.data.vignettes.map(convertToVignette);
        setVignettes(converted);
        setFilteredVignettes(converted);
        setSites(result.data.sites || []);
      }
    } catch (err) {
      console.error('Erreur chargement vignettes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Appliquer les filtres et la recherche
  useEffect(() => {
    if (!vignettes.length) {
      setFilteredVignettes([]);
      return;
    }

    let resultats = [...vignettes];

    // Filtre de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      resultats = resultats.filter(
        (v) =>
          v.engin.numero_plaque.toLowerCase().includes(term) ||
          v.assujetti.nom_complet.toLowerCase().includes(term) ||
          v.assujetti.telephone.toLowerCase().includes(term) ||
          v.reference_paiement.toLowerCase().includes(term),
      );
    }

    // Filtre par statut
    if (filtres.statut !== "tous") {
      const aujourdhui = new Date();
      resultats = resultats.filter((v) => {
        const dateExpiration = new Date(v.date_expiration);
        const diffJours = Math.ceil(
          (dateExpiration.getTime() - aujourdhui.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (filtres.statut === "expire") {
          return dateExpiration < aujourdhui;
        } else if (filtres.statut === "proche") {
          return dateExpiration >= aujourdhui && diffJours <= 30;
        } else if (filtres.statut === "valide") {
          return dateExpiration >= aujourdhui && diffJours > 30;
        }
        return true;
      });
    }

    // Filtre par type
    if (filtres.type !== "tous") {
      resultats = resultats.filter((v) => v.type === filtres.type);
    }

    // Filtre par site
    if (filtres.site !== "tous") {
      resultats = resultats.filter((v) => v.site_achat === filtres.site);
    }

    // Filtre par dates
    if (filtres.dateDebut) {
      const dateDebut = new Date(filtres.dateDebut);
      dateDebut.setHours(0, 0, 0, 0);
      resultats = resultats.filter((v) => new Date(v.date_achat) >= dateDebut);
    }

    if (filtres.dateFin) {
      const dateFin = new Date(filtres.dateFin);
      dateFin.setHours(23, 59, 59, 999);
      resultats = resultats.filter((v) => new Date(v.date_achat) <= dateFin);
    }

    setFilteredVignettes(resultats);
    setCurrentPage(1); // Reset à la première page quand les filtres changent
  }, [searchTerm, filtres, vignettes]);

  // Pagination
  const paginatedVignettes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVignettes.slice(startIndex, endIndex);
  }, [filteredVignettes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVignettes.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setFiltres({
      statut: "tous",
      type: "tous",
      site: "tous",
      dateDebut: "",
      dateFin: "",
    });
    setSearchTerm("");
  };

  const handleViewDetails = (vignette: Vignette) => {
    setSelectedVignette(vignette);
    setShowDetailsModal(true);
  };

  const handleDelete = (vignette: Vignette) => {
    setSelectedVignette(vignette);
    setShowSuppressionModal(true);
  };

  const handleSuppressionSuccess = async (data: SuppressionData) => {
    setShowSuppressionModal(false);
    setSuppressionData(data);

    if (selectedVignette) {
      try {
        const result = await supprimerVignetteAPI(selectedVignette.id, data.suppression?.motif || 'Suppression admin');
        if (result.status === 'success') {
          const updatedVignettes = vignettes.filter(
            (v) => v.id !== selectedVignette.id,
          );
          setVignettes(updatedVignettes);
          setShowSuccessModal(true);
        } else {
          alert(result.message || "Erreur lors de la suppression");
        }
      } catch {
        alert("Erreur réseau lors de la suppression");
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSelectedVignette(null);
    loadData();
  };

  // Fonction pour obtenir la classe de statut
  const getStatutBadge = (vignette: Vignette) => {
    const aujourdhui = new Date();
    const dateExpiration = new Date(vignette.date_expiration);
    const diffJours = Math.ceil(
      (dateExpiration.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dateExpiration < aujourdhui) {
      return {
        text: "Expirée",
        class: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      };
    } else if (diffJours <= 30) {
      return {
        text: `Expire dans ${diffJours}j`,
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

  // Fonction pour obtenir le badge de type
  const getTypeBadge = (type: string) => {
    switch (type) {
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
          text: type,
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Tag,
        };
    }
  };

  // Statistiques
  const stats = {
    total: vignettes.length,
    achat: vignettes.filter((v) => v.type === "achat").length,
    delivrance: vignettes.filter((v) => v.type === "delivrance").length,
    renouvellement: vignettes.filter((v) => v.type === "renouvellement").length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Achats</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.achat}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Délivrances</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.delivrance}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Renouvellements</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.renouvellement}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par plaque, propriétaire, téléphone, référence..."
                className="block w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
              title="Rafraîchir la liste"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>

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
              {(filtres.statut !== "tous" ||
                filtres.type !== "tous" ||
                filtres.site !== "tous" ||
                filtres.dateDebut ||
                filtres.dateFin) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {(searchTerm ||
              filtres.statut !== "tous" ||
              filtres.type !== "tous" ||
              filtres.site !== "tous" ||
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
                {/* Filtre Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filtres.statut}
                    onChange={(e) =>
                      setFiltres({
                        ...filtres,
                        statut: e.target.value as FiltreStatut,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="expire">Expiré</option>
                    <option value="proche">Proche expiration</option>
                    <option value="valide">Valide</option>
                  </select>
                </div>

                {/* Filtre Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filtres.type}
                    onChange={(e) =>
                      setFiltres({
                        ...filtres,
                        type: e.target.value as FiltreType,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les types</option>
                    <option value="achat">Achat</option>
                    <option value="delivrance">Délivrance</option>
                    <option value="renouvellement">Renouvellement</option>
                  </select>
                </div>

                {/* Filtre Site */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site
                  </label>
                  <select
                    value={filtres.site}
                    onChange={(e) =>
                      setFiltres({ ...filtres, site: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les sites</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.nom}>
                        {site.nom}
                      </option>
                    ))}
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
                    onChange={(e) =>
                      setFiltres({ ...filtres, dateDebut: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFiltres({ ...filtres, dateFin: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Résumé des filtres actifs */}
              <div className="mt-4 flex flex-wrap gap-2">
                {filtres.statut !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Statut:{" "}
                    {filtres.statut === "expire"
                      ? "Expiré"
                      : filtres.statut === "proche"
                        ? "Proche"
                        : "Valide"}
                  </span>
                )}
                {filtres.type !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {filtres.type}
                  </span>
                )}
                {filtres.site !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Site: {filtres.site}
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
              {filteredVignettes.length} résultat(s) trouvé(s)
            </div>
          </div>
        </div>

        {/* Tableau des vignettes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date achat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-500">
                          Chargement des vignettes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedVignettes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">
                          Aucune vignette trouvée
                        </p>
                        <p className="text-sm text-gray-400">
                          Essayez de modifier vos critères de recherche
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedVignettes.map((vignette) => {
                    const statut = getStatutBadge(vignette);
                    const type = getTypeBadge(vignette.type);
                    const StatutIcon = statut.icon;
                    const TypeIcon = type.icon;

                    return (
                      <tr
                        key={vignette.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${type.class}`}
                          >
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {type.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-900">
                            {vignette.engin.numero_plaque}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vignette.assujetti.nom_complet}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {vignette.assujetti.telephone || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {vignette.site_achat}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(vignette.date_achat).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(
                              vignette.date_expiration,
                            ).toLocaleDateString("fr-FR")}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleViewDetails(vignette)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vignette)}
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
          {!isLoading && filteredVignettes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredVignettes.length,
                  )}{" "}
                  sur {filteredVignettes.length} vignette
                  {filteredVignettes.length > 1 ? "s" : ""}
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
      <VignetteDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        vignette={selectedVignette}
        onDelete={() => {
          setShowDetailsModal(false);
          setTimeout(() => setShowSuppressionModal(true), 100);
        }}
      />

      <SuppressionConfirmModal
        isOpen={showSuppressionModal}
        onClose={() => setShowSuppressionModal(false)}
        onSuccess={handleSuppressionSuccess}
        vignette={selectedVignette}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={suppressionData}
      />
    </>
  );
}
