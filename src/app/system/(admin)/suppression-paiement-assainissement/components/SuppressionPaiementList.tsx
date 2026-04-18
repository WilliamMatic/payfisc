"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, AlertCircle, Eye, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Tag, CreditCard, RefreshCw, Loader2, Banknote, Smartphone, MapPin,
} from "lucide-react";
import PaiementDetailsModal from "./PaiementDetailsModal";
import SuppressionConfirmModal from "./SuppressionConfirmModal";
import SuccessModal from "./SuccessModal";
import { listerPaiementsAll, supprimerPaiementAssainissement } from "@/app/services/assainissement/assainissementService";
import { PaiementAssainissement, SuppressionData } from "./types";

type FiltreMode = "tous" | "especes" | "mobile_money" | "carte_bancaire";

interface Filtres {
  mode: FiltreMode;
  site: string;
  dateDebut: string;
  dateFin: string;
}

const getTodayString = () => new Date().toISOString().split("T")[0];

export default function SuppressionPaiementList() {
  const [paiements, setPaiements] = useState<PaiementAssainissement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sites, setSites] = useState<{ id: number; nom: string; code: string }[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(8);

  const [filtres, setFiltres] = useState<Filtres>({
    mode: "tous",
    site: "tous",
    dateDebut: getTodayString(),
    dateFin: getTodayString(),
  });

  const [selectedPaiement, setSelectedPaiement] = useState<PaiementAssainissement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuppressionModal, setShowSuppressionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [suppressionData, setSuppressionData] = useState<SuppressionData | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await listerPaiementsAll(
        currentPage,
        itemsPerPage,
        searchTerm,
        filtres.mode === "tous" ? "" : filtres.mode,
        filtres.dateDebut,
        filtres.dateFin,
      );
      if (result.status === "success" && result.data) {
        setPaiements(result.data.paiements as unknown as PaiementAssainissement[]);
        setSites(result.data.sites || []);
        setTotalItems(result.data.pagination.total);
      }
    } catch (err) {
      console.error("Erreur chargement paiements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage]);

  // Filtrer côté client par site (le reste est côté serveur)
  const filteredPaiements = useMemo(() => {
    if (filtres.site === "tous") return paiements;
    return paiements.filter((p) => p.site_nom === filtres.site);
  }, [paiements, filtres.site]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setFiltres({ mode: "tous", site: "tous", dateDebut: getTodayString(), dateFin: getTodayString() });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleViewDetails = (paiement: PaiementAssainissement) => {
    setSelectedPaiement(paiement);
    setShowDetailsModal(true);
  };

  const handleDelete = (paiement: PaiementAssainissement) => {
    setSelectedPaiement(paiement);
    setShowSuppressionModal(true);
  };

  const handleSuppressionSuccess = async () => {
    setShowSuppressionModal(false);
    if (!selectedPaiement) return;

    try {
      const result = await supprimerPaiementAssainissement(selectedPaiement.id);
      if (result.status === "success") {
        setSuppressionData({
          paiement: {
            id: selectedPaiement.id,
            reference: selectedPaiement.reference,
            montant: selectedPaiement.montant,
            date_paiement: selectedPaiement.date_paiement,
          },
          contribuable: {
            nom: `${selectedPaiement.contribuable_nom || ""} ${selectedPaiement.contribuable_prenom || ""}`.trim(),
            reference: selectedPaiement.contribuable_ref,
            etablissement: selectedPaiement.nom_etablissement,
          },
          suppression: {
            date_suppression: result.data?.date_suppression || new Date().toISOString(),
          },
        });
        setPaiements((prev) => prev.filter((p) => p.id !== selectedPaiement.id));
        setTotalItems((prev) => prev - 1);
        setShowSuccessModal(true);
      } else {
        alert(result.message || "Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur réseau lors de la suppression");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSelectedPaiement(null);
    loadData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const formatMontant = (montant: number) => {
    return Number(montant).toLocaleString("fr-FR") + " FC";
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "especes":
        return { text: "Espèces", class: "bg-green-100 text-green-800 border-green-200", icon: Banknote };
      case "mobile_money":
        return { text: "Mobile Money", class: "bg-blue-100 text-blue-800 border-blue-200", icon: Smartphone };
      case "carte_bancaire":
        return { text: "Carte bancaire", class: "bg-purple-100 text-purple-800 border-purple-200", icon: CreditCard };
      default:
        return { text: mode, class: "bg-gray-100 text-gray-800 border-gray-200", icon: Tag };
    }
  };

  const stats = {
    total: filteredPaiements.length,
    montantTotal: filteredPaiements.reduce((sum, p) => sum + Number(p.montant), 0),
    especes: filteredPaiements.filter((p) => p.mode_paiement === "especes").length,
    mobile: filteredPaiements.filter((p) => p.mode_paiement === "mobile_money").length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total paiements</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Montant total</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMontant(stats.montantTotal)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Espèces</p>
                <p className="text-2xl font-bold text-green-600">{stats.especes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Banknote className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mobile Money</p>
                <p className="text-2xl font-bold text-blue-600">{stats.mobile}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
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
                placeholder="Rechercher par nom, établissement, référence, téléphone..."
                className="block w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
            </div>

            <button
              onClick={() => { setCurrentPage(1); loadData(); }}
              disabled={isLoading}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
              title="Rafraîchir"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border-2 rounded-xl transition-colors flex items-center justify-center ${
                showFilters ? "bg-red-50 border-red-300 text-red-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtres
              {(filtres.mode !== "tous" || filtres.site !== "tous" || filtres.dateDebut || filtres.dateFin) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {(searchTerm || filtres.mode !== "tous" || filtres.site !== "tous" || filtres.dateDebut || filtres.dateFin) && (
              <button
                onClick={resetFilters}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select
                    value={filtres.mode}
                    onChange={(e) => setFiltres({ ...filtres, mode: e.target.value as FiltreMode })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les modes</option>
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="carte_bancaire">Carte bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <select
                    value={filtres.site}
                    onChange={(e) => setFiltres({ ...filtres, site: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="tous">Tous les sites</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.nom}>{site.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="date"
                    value={filtres.dateDebut}
                    onChange={(e) => setFiltres({ ...filtres, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={filtres.dateFin}
                    onChange={(e) => setFiltres({ ...filtres, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Active filter badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {filtres.mode !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Mode: {filtres.mode === "especes" ? "Espèces" : filtres.mode === "mobile_money" ? "Mobile Money" : "Carte"}
                  </span>
                )}
                {filtres.site !== "tous" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Site: {filtres.site}
                  </span>
                )}
                {filtres.dateDebut && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Du: {new Date(filtres.dateDebut).toLocaleDateString("fr-FR")}
                  </span>
                )}
                {filtres.dateFin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Au: {new Date(filtres.dateFin).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setCurrentPage(1); loadData(); }}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Valider
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
              {totalItems} résultat(s) trouvé(s)
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribuable</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Établissement</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-500">Chargement des paiements...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPaiements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
                        <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPaiements.map((paiement) => {
                    const mode = getModeBadge(paiement.mode_paiement);
                    const ModeIcon = mode.icon;
                    const nomComplet = `${paiement.contribuable_nom || ""} ${paiement.contribuable_prenom || ""}`.trim();

                    return (
                      <tr key={paiement.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-900 text-sm">{paiement.reference}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{nomComplet || "—"}</div>
                          <div className="text-xs text-gray-500">{paiement.contribuable_ref}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{paiement.nom_etablissement || "—"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">{formatMontant(paiement.montant)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${mode.class}`}>
                            <ModeIcon className="w-3 h-3 mr-1" />
                            {mode.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            {paiement.site_nom || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{paiement.province_nom || "—"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(paiement.date_paiement)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleViewDetails(paiement)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(paiement)}
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

          {/* Pagination */}
          {!isLoading && totalItems > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} paiement{totalItems > 1 ? "s" : ""}
                </p>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handlePageChange(1)} disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" title="Première page">
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" title="Page précédente">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) { pageNum = i + 1; }
                      else if (currentPage <= 3) { pageNum = i + 1; }
                      else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                      else { pageNum = currentPage - 2 + i; }
                      return (
                        <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-200"
                          }`}>
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" title="Page suivante">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" title="Dernière page">
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PaiementDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        paiement={selectedPaiement}
        onDelete={() => {
          setShowDetailsModal(false);
          setTimeout(() => setShowSuppressionModal(true), 100);
        }}
      />

      <SuppressionConfirmModal
        isOpen={showSuppressionModal}
        onClose={() => setShowSuppressionModal(false)}
        onSuccess={handleSuppressionSuccess}
        paiement={selectedPaiement}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={suppressionData}
      />
    </>
  );
}
