"use client";
import { useState, useEffect } from "react";
import {
  Serie as SerieType,
  Province,
  RapportSeries,
  PaginationResponse,
} from "@/services/plaques/plaqueService";
import PlaqueHeader from "./PlaqueHeader";
import PlaqueTable from "./PlaqueTable";
import PlaqueModals from "./modals/PlaqueModals";
import AlertMessage from "./AlertMessage";
import RapportSeriesModal from "./RapportSeriesModal";
import Pagination from "./Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, User, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlaqueClientProps {
  initialSeries: SerieType[];
  initialError: string | null;
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function PlaqueClient({
  initialSeries,
  initialError,
  initialPagination,
}: PlaqueClientProps) {
  const router = useRouter();
  const [series, setSeries] = useState<SerieType[]>(initialSeries || []);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showRapportModal, setShowRapportModal] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<SerieType | null>(null);
  const [formData, setFormData] = useState({
    nom_serie: "",
    province_id: "",
    debut_numeros: 1,
    fin_numeros: 999,
    description: "",
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rapportData, setRapportData] = useState<RapportSeries | null>(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [privileges, setPrivileges] = useState<any>(null);
  const [loadingPrivileges, setLoadingPrivileges] = useState(true);

  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalItems, setTotalItems] = useState(initialPagination.total);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    setLoadingPrivileges(true);
    
    if (utilisateur?.privileges_include) {
      try {
        const parsedPrivileges = JSON.parse(utilisateur.privileges_include);
        setPrivileges(parsedPrivileges);
      } catch (error) {
        console.error("Erreur lors du parsing des privilèges:", error);
        setPrivileges({});
      }
    } else if (utilisateur) {
      setPrivileges({});
    }
    
    setLoadingPrivileges(false);
  }, [utilisateur]);

  // Charger les provinces au montage
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const { getProvinces } =
          await import("@/services/plaques/plaqueService");
        const result = await getProvinces();

        if (result.status === "success") {
          setProvinces(result.data || []);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des provinces:", err);
      }
    };

    loadProvinces();
  }, []);

  // Fonction pour recharger les séries avec pagination
  const loadSeries = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);

      const { getSeries } = await import("@/services/plaques/plaqueService");
      const result = await getSeries(page, itemsPerPage);

      if (result.status === "success" && result.data) {
        setSeries(result.data.series || []);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      } else {
        setError(result.message || "Erreur lors du chargement des séries");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Fonction de recherche dans la base de données
  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      // Si la recherche est vide, on recharge les séries normales
      await loadSeries(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);

      const { searchSeries } = await import("@/services/plaques/plaqueService");
      const result = await searchSeries(searchTerm, page, itemsPerPage);

      if (result.status === "success" && result.data) {
        setSeries(result.data.series || []);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      } else {
        setError(result.message || "Erreur lors de la recherche des séries");
        setSeries([]);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE FONCTION : Rafraîchir le cache et recharger les données
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { refreshSeriesCache } = await import("@/services/plaques/plaqueService");
      
      // Rafraîchir le cache et récupérer les données fraîches
      const result = await refreshSeriesCache(currentPage, itemsPerPage);
      
      if (result.status === "success" && result.data) {
        setSeries(result.data.series || []);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
        setSuccessMessage("Données rafraîchies avec succès");
        
        // Si on était en mode recherche, on le désactive
        if (isSearching) {
          setIsSearching(false);
          setSearchTerm("");
        }
      } else {
        setError(result.message || "Erreur lors du rafraîchissement des données");
      }
    } catch (err) {
      setError("Erreur de connexion lors du rafraîchissement");
    } finally {
      setLoading(false);
    }
  };

  // Générer un rapport
  const handleGenererRapport = async (params: {
    date_debut: string;
    date_fin: string;
    province_id?: number;
  }) => {
    try {
      setRapportLoading(true);
      const { genererRapportSeries } =
        await import("@/services/plaques/plaqueService");
      const result = await genererRapportSeries(params);

      if (result.status === "success") {
        setRapportData(result.data);
        setError(null);
      } else {
        setError(result.message || "Erreur lors de la génération du rapport");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setRapportLoading(false);
    }
  };

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    if (isSearching && searchTerm.trim()) {
      handleSearch(page);
    } else {
      loadSeries(page);
    }
  };

  // Effet pour charger les séries au montage
  useEffect(() => {
    if (initialSeries.length === 0) {
      loadSeries(1);
    }
  }, []);

  const openEditModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setFormData({
      nom_serie: serie.nom_serie || "",
      province_id: serie.province_id.toString(),
      debut_numeros: serie.debut_numeros,
      fin_numeros: serie.fin_numeros,
      description: serie.description || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowDeleteModal(true);
  };

  const openStatusModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowStatusModal(true);
  };

  const openItemsModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowItemsModal(true);
  };

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Gestion de la touche Entrée pour la recherche
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        handleSearch(1);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [searchTerm]);

  // Afficher un état de chargement pendant l'initialisation des privilèges
  if (loadingPrivileges || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chargement en cours...
            </h2>
            <p className="text-gray-600">
              Vérification de vos autorisations d'accès...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si privileges est null ou si series n'est pas défini
  if (!privileges || privileges.series === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette
              fonctionnalité.
            </p>
            {privileges && (
              <div className="text-sm text-gray-500 mb-4">
                Privilèges disponibles:
                <div className="mt-2 text-left">
                  {Object.entries(privileges).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${value ? "bg-green-500" : "bg-red-500"}`}
                      ></span>
                      <span>
                        {key}: {value ? "✓" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le privilège "series"
  if (privileges.series === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette
              fonctionnalité.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Privilèges disponibles:
              <div className="mt-2 text-left">
                {Object.entries(privileges).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${value ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    <span>
                      {key}: {value ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />

      <PlaqueHeader
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          if (!value.trim()) {
            // Si l'utilisateur efface la recherche, recharger les données normales
            loadSeries(1);
            setIsSearching(false);
          }
        }}
        onAddClick={() => setShowAddModal(true)}
        onRapportClick={() => setShowRapportModal(true)}
        onRefreshClick={handleRefresh} // NOUVEAU : Prop pour le rafraîchissement
        isRefreshing={loading} // NOUVEAU : État de chargement pour l'animation
      />

      <div className="flex-1 overflow-auto mt-4">
        <PlaqueTable
          series={series}
          loading={loading}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onToggleStatus={openStatusModal}
          onViewItems={openItemsModal}
        />
      </div>

      {/* Pagination */}
      {series.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            isSearching={isSearching}
            searchTerm={searchTerm}
          />
        </div>
      )}

      <PlaqueModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showItemsModal={showItemsModal}
        selectedSerie={selectedSerie}
        formData={formData}
        provinces={provinces}
        processing={processing}
        onAddClose={() => {
          setShowAddModal(false);
          setFormData({
            nom_serie: "",
            province_id: "",
            debut_numeros: 1,
            fin_numeros: 999,
            description: "",
          });
        }}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedSerie(null);
          setFormData({
            nom_serie: "",
            province_id: "",
            debut_numeros: 1,
            fin_numeros: 999,
            description: "",
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedSerie(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedSerie(null);
        }}
        onItemsClose={() => {
          setShowItemsModal(false);
          setSelectedSerie(null);
        }}
        onFormDataChange={setFormData}
        onAddSerie={async () => {
          if (!formData.nom_serie.trim()) {
            setError("Le nom de la série est obligatoire");
            return;
          }

          if (!formData.province_id) {
            setError("La province est obligatoire");
            return;
          }

          if (!/^[A-Z]{2}$/.test(formData.nom_serie)) {
            setError(
              "Le nom de la série doit contenir exactement 2 lettres majuscules",
            );
            return;
          }

          if (
            formData.debut_numeros < 1 ||
            formData.fin_numeros > 999 ||
            formData.debut_numeros > formData.fin_numeros
          ) {
            setError(
              "La plage numérique doit être entre 1 et 999, avec début <= fin",
            );
            return;
          }

          setProcessing(true);
          try {
            const { addSerie } =
              await import("@/services/plaques/plaqueService");
            const result = await addSerie({
              nom_serie: formData.nom_serie,
              province_id: parseInt(formData.province_id),
              debut_numeros: formData.debut_numeros,
              fin_numeros: formData.fin_numeros,
              description: formData.description || undefined,
            });

            if (result.status === "success") {
              setSuccessMessage(result.message || "Série ajoutée avec succès");
              setFormData({
                nom_serie: "",
                province_id: "",
                debut_numeros: 1,
                fin_numeros: 999,
                description: "",
              });
              setShowAddModal(false);

              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadSeries(currentPage);
              }
            } else {
              setError(result.message || "Erreur lors de l'ajout de la série");
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onEditSerie={async () => {
          if (!selectedSerie || !formData.nom_serie.trim()) {
            setError("Le nom de la série est obligatoire");
            return;
          }

          if (!formData.province_id) {
            setError("La province est obligatoire");
            return;
          }

          if (!/^[A-Z]{2}$/.test(formData.nom_serie)) {
            setError(
              "Le nom de la série doit contenir exactement 2 lettres majuscules",
            );
            return;
          }

          setProcessing(true);
          try {
            const { updateSerie } =
              await import("@/services/plaques/plaqueService");
            const result = await updateSerie(selectedSerie.id, {
              nom_serie: formData.nom_serie,
              province_id: parseInt(formData.province_id),
              description: formData.description || undefined,
            });

            if (result.status === "success") {
              setSuccessMessage(result.message || "Série modifiée avec succès");
              setShowEditModal(false);
              setSelectedSerie(null);
              setFormData({
                nom_serie: "",
                province_id: "",
                debut_numeros: 1,
                fin_numeros: 999,
                description: "",
              });

              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadSeries(currentPage);
              }
            } else {
              setError(
                result.message || "Erreur lors de la modification de la série",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteSerie={async () => {
          if (!selectedSerie) return;

          setProcessing(true);
          try {
            const { deleteSerie } =
              await import("@/services/plaques/plaqueService");
            const result = await deleteSerie(selectedSerie.id);

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Série supprimée avec succès",
              );
              setShowDeleteModal(false);
              setSelectedSerie(null);

              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadSeries(currentPage);
              }
            } else {
              setError(
                result.message || "Erreur lors de la suppression de la série",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedSerie) return;

          setProcessing(true);
          try {
            const { toggleSerieStatus } =
              await import("@/services/plaques/plaqueService");
            const result = await toggleSerieStatus(
              selectedSerie.id,
              !selectedSerie.actif,
            );

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Statut de la série modifié avec succès",
              );
              setShowStatusModal(false);
              setSelectedSerie(null);

              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadSeries(currentPage);
              }
            } else {
              setError(
                result.message ||
                  "Erreur lors du changement de statut de la série",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
      />

      <RapportSeriesModal
        isOpen={showRapportModal}
        onClose={() => {
          setShowRapportModal(false);
          setRapportData(null);
        }}
        provinces={provinces}
        onGenererRapport={handleGenererRapport}
        rapportData={rapportData}
        loading={rapportLoading}
      />
    </div>
  );
}