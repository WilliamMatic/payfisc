"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getPlaques, getStatistiques, Plaque, Statistiques, PaginationData } from "@/services/plaqueService/plaqueService";

// Types
interface PlaqueData {
  id: number;
  numero: string;
  statut: "non-livre" | "livre";
  date_attribution?: string;
  assujetti?: {
    nom: string;
    prenom: string;
    adresse: string;
  };
  moto?: {
    marque: string;
    modele: string;
    energie: string;
    anneeFabrication: number;
    anneeCirculation: number;
    couleur: string;
    puissanceFiscale: number;
    usage: string;
    numeroChassis: string;
    numeroMoteur: string;
    typeEngin?: string;
  };
}

export default function PlaquesPage() {
  // État pour la plaque sélectionnée
  const [selectedPlaque, setSelectedPlaque] = useState<PlaqueData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // États pour les données
  const [plaquesData, setPlaquesData] = useState<PlaqueData[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques>({
    nonLivrees: 0,
    livrees: 0,
    total: 0
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  
  // États pour le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Contexte d'authentification
  const { utilisateur, isLoading: authLoading } = useAuth();

  // Vérifier si l'utilisateur a l'extension_site
  const particulierId = utilisateur?.extension_site;

  // Chargement initial des données
  useEffect(() => {
    if (!authLoading && particulierId) {
      fetchData();
      fetchStatistiques();
    } else if (!authLoading && !particulierId) {
      setError("ID du site non disponible. Veuillez vous reconnecter.");
      setIsLoading(false);
    }
  }, [authLoading, particulierId, currentPage]);

  const fetchData = async (search?: string) => {
    if (!particulierId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getPlaques(
        particulierId,
        currentPage,
        20,
        undefined,
        search
      );
      
      if (response.status === "success") {
        setPlaquesData(response.data.plaques);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "Erreur lors du chargement des données");
      }
    } catch (err) {
      setError("Erreur réseau lors du chargement des plaques");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistiques = async () => {
    if (!particulierId) return;
    
    try {
      const response = await getStatistiques(particulierId);
      if (response.status === "success") {
        setStatistiques(response.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  };

  // Gestion du clic sur une plaque
  const handlePlaqueClick = (plaque: PlaqueData) => {
    if (plaque.statut === "livre" && plaque.assujetti && plaque.moto) {
      setSelectedPlaque(plaque);
      setIsModalOpen(true);
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPlaque(null);
  };

  // Gestion de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setCurrentPage(1);
    fetchData(searchTerm);
  };

  // Gestion du reset de la recherche
  const handleResetSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
    fetchData();
  };

  // Gestion de la pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  // Affichage du chargement
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des plaques...</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error || !particulierId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-red-800">Erreur</h3>
            </div>
            <p className="text-red-700 mt-2">
              {error || "ID du site non disponible. Veuillez vous reconnecter."}
            </p>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Modal d'informations */}
      {isModalOpen && selectedPlaque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Plaque {selectedPlaque.numero}</h2>
                  <p className="text-red-100 text-sm mt-0.5">Informations détaillées</p>
                  {selectedPlaque.date_attribution && (
                    <p className="text-red-100 text-xs mt-1">
                      Attribuée le: {new Date(selectedPlaque.date_attribution).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 transition-colors text-xl bg-red-700 hover:bg-red-800 w-8 h-8 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Section Assujetti */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center">
                  <span className="bg-red-100 text-red-700 p-1.5 rounded-full text-xs mr-2">
                    👤
                  </span>
                  Assujetti
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Nom complet</p>
                    <p className="font-medium text-gray-800">
                      {selectedPlaque.assujetti?.prenom} {selectedPlaque.assujetti?.nom}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Adresse</p>
                    <p className="font-medium text-gray-800 text-sm">{selectedPlaque.assujetti?.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Section Moto */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center">
                  <span className="bg-red-100 text-red-700 p-1.5 rounded-full text-xs mr-2">
                    🏍️
                  </span>
                  Engin associé
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Type d'engin</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.typeEngin || "Moto"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Marque</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.marque}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Modèle</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.modele}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Énergie</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.energie}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Année fabrication</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.anneeFabrication}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Année circulation</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.anneeCirculation}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Couleur</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.couleur}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Puissance fiscale</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.puissanceFiscale} CV</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Usage</p>
                    <p className="font-medium text-gray-800">{selectedPlaque.moto?.usage}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">N° châssis</p>
                    <p className="font-medium text-gray-800 font-mono text-xs">{selectedPlaque.moto?.numeroChassis}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">N° moteur</p>
                    <p className="font-medium text-gray-800 font-mono text-xs">{selectedPlaque.moto?.numeroMoteur}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied du modal */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestion des Plaques</h1>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {utilisateur?.site_nom} - {utilisateur?.site_code}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Particulier ID: {particulierId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par numéro de plaque, nom, prénom..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!searchTerm.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Rechercher
              </button>
              {isSearching && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Réinitialiser
                </button>
              )}
            </form>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-800 text-xs font-medium">Plaques disponibles</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{statistiques.nonLivrees}</p>
                  <p className="text-green-700 text-xs mt-0.5">Non livrées</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <div className="bg-green-600 text-white p-1.5 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-red-800 text-xs font-medium">Plaques livrées</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{statistiques.livrees}</p>
                  <p className="text-red-700 text-xs mt-0.5">Cliquez pour voir les détails</p>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <div className="bg-red-600 text-white p-1.5 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-800 text-xs font-medium">Total plaques</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{statistiques.total}</p>
                  <p className="text-blue-700 text-xs mt-0.5">Dans le système</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <div className="bg-blue-600 text-white p-1.5 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-700 text-sm">Plaque disponible (non livrée)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-700 text-sm">Plaque livrée (cliquable)</span>
            </div>
          </div>
        </div>

        {/* Pagination en haut */}
        {pagination.pages > 1 && (
          <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.pages} • {pagination.total} plaques
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1 bg-red-600 text-white rounded">
                {pagination.page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Grille de cartes */}
        {plaquesData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune plaque trouvée</h3>
            <p className="mt-2 text-gray-600">
              {isSearching 
                ? "Aucune plaque ne correspond à votre recherche." 
                : "Aucune plaque n'est encore enregistrée pour ce site."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {plaquesData.map((plaque) => (
                <div
                  key={plaque.id}
                  onClick={() => handlePlaqueClick(plaque)}
                  className={`
                    relative rounded-lg p-4 shadow-md transition-all duration-200 
                    ${plaque.statut === "livre" && plaque.assujetti && plaque.moto
                      ? "bg-gradient-to-br from-red-50 to-red-100 border border-red-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-red-300" 
                      : "bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
                    }
                  `}
                >
                  {/* Indicateur de statut */}
                  <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${plaque.statut === "livre" ? "bg-red-500" : "bg-green-500"}`}></div>
                  
                  {/* Numéro de plaque */}
                  <div className="text-center">
                    <div className={`
                      inline-block text-3xl font-bold mb-1.5 tracking-tight
                      ${plaque.statut === "livre" ? "text-red-900" : "text-green-900"}
                    `}>
                      {plaque.numero}
                    </div>
                    
                    <div className={`text-xs font-medium ${plaque.statut === "livre" ? "text-red-700" : "text-green-700"}`}>
                      {plaque.statut === "livre" ? "Livrée" : "Disponible"}
                    </div>
                    
                    {plaque.date_attribution && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(plaque.date_attribution).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    
                    {plaque.statut === "livre" && plaque.assujetti && plaque.moto && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Cliquez pour voir
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Icône selon le statut */}
                  <div className="flex justify-center mt-4">
                    <div className={`
                      p-2.5 rounded-full
                      ${plaque.statut === "livre" 
                        ? "bg-red-100 text-red-600" 
                        : "bg-green-100 text-green-600"
                      }
                    `}>
                      {plaque.statut === "livre" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination en bas */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} plaques
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    « Première
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ‹ Précédent
                  </button>
                  
                  {/* Numéros de page */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded ${
                            pagination.page === pageNum
                              ? "bg-red-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant ›
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Dernière »
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Note informative */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Comment utiliser cet écran</h3>
              <p className="text-gray-600 text-sm mt-1">
                Les plaques en <span className="font-medium text-green-600">vert</span> sont disponibles et n'ont pas encore été attribuées.
                Les plaques en <span className="font-medium text-red-600">rouge</span> ont déjà été livrées. Cliquez sur une plaque rouge pour voir les informations détaillées.
                Utilisez la barre de recherche pour filtrer les plaques par numéro, nom ou prénom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}