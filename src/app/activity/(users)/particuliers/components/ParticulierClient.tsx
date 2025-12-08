// src/app/system/(admin)/particuliers/components/ParticulierClient.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Particulier as ParticulierType,
  getParticuliers,
  searchParticuliers,
  getParticulierDetails,
  PaginationResponse
} from "@/services/particuliers/particulierService";
import ParticuliersHeader from "./ParticulierHeader";
import ParticuliersTable from "./ParticulierTable";
import ParticuliersModals from "./ParticulierModals";
import AlertMessage from "./AlertMessage";
import Pagination from "./Pagination";
import { useAuth } from "@/contexts/AuthContext"; // Ajouter l'import

interface ParticuliersClientProps {
  initialParticuliers: ParticulierType[];
  initialError: string | null;
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ParticuliersClient({
  initialParticuliers,
  initialError,
  initialPagination
}: ParticuliersClientProps) {
  const { utilisateur } = useAuth(); // Ajouter cette ligne
  
  const [particuliers, setParticuliers] = useState<ParticulierType[]>(
    initialParticuliers || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedParticulier, setSelectedParticulier] =
    useState<ParticulierType | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "",
    rue: "",
    ville: "",
    code_postal: "",
    province: "",
    id_national: "",
    telephone: "",
    email: "",
    nif: "",
    situation_familiale: "",
    dependants: 0,
    reduction_type: null as "pourcentage" | "montant_fixe" | null,
    reduction_valeur: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalItems, setTotalItems] = useState(initialPagination.total);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;

  const provinces = [
    "Bas-Uele",
    "Équateur",
    "Haut-Katanga",
    "Haut-Lomami",
    "Haut-Uele",
    "Ituri",
    "Kasaï",
    "Kasaï Central",
    "Kasaï Oriental",
    "Kinshasa",
    "Kongo Central",
    "Kwango",
    "Kwilu",
    "Lomami",
    "Lualaba",
    "Mai-Ndombe",
    "Maniema",
    "Mongala",
    "Nord-Kivu",
    "Nord-Ubangi",
    "Sankuru",
    "Sud-Kivu",
    "Sud-Ubangi",
    "Tanganyika",
    "Tshopo",
    "Tshuapa",
  ];

  const situationsFamiliales = [
    "Célibataire",
    "Marié(e)",
    "Divorcé(e)",
    "Veuf/Veuve",
  ];

  // Fonction pour recharger les particuliers avec pagination
  const loadParticuliers = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);
      
      // Passer l'utilisateurId ici
      const utilisateurId = utilisateur?.id;
      const result = await getParticuliers(page, itemsPerPage, utilisateurId);

      if (result.status === "success" && result.data) {
        setParticuliers(result.data.particuliers || []);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      } else {
        setError(
          result.message || "Erreur lors du chargement des particuliers"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, [utilisateur, itemsPerPage]); // Ajouter utilisateur dans les dépendances

  // Fonction pour charger les détails complets d'un particulier
  const loadParticulierDetails = async (
    id: number
  ): Promise<ParticulierType | null> => {
    try {
      const result = await getParticulierDetails(id);
      if (result.status === "success") {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error("Error loading particulier details:", err);
      return null;
    }
  };

  // Fonction de recherche dans la base de données
  const handleSearch = useCallback(async (page: number = 1) => {
    if (!searchTerm.trim()) {
      // Si la recherche est vide, on recharge les particuliers normaux
      await loadParticuliers(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      
      // Modifier votre service searchParticuliers pour accepter utilisateurId
      // D'abord, créez une version mise à jour dans votre service
      const result = await searchParticuliers(searchTerm, page, itemsPerPage);

      if (result.status === "success" && result.data) {
        setParticuliers(result.data.particuliers || []);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      } else {
        setError(
          result.message || "Erreur lors de la recherche des particuliers"
        );
        setParticuliers([]);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      setParticuliers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, itemsPerPage, loadParticuliers]); // Ajouter loadParticuliers dans les dépendances

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    if (isSearching && searchTerm.trim()) {
      handleSearch(page);
    } else {
      loadParticuliers(page);
    }
  };

  // Effet pour charger les particuliers au montage
  useEffect(() => {
    if (initialParticuliers.length === 0) {
      loadParticuliers(1);
    }
  }, [loadParticuliers, initialParticuliers.length]);

  const openEditModal = async (particulier: ParticulierType) => {
    try {
      setProcessing(true);
      // Charger les détails complets du particulier
      const details = await loadParticulierDetails(particulier.id);

      if (details) {
        setSelectedParticulier(details);
        setFormData({
          nom: details.nom || "",
          prenom: details.prenom || "",
          date_naissance: details.date_naissance
            ? new Date(details.date_naissance).toISOString().split("T")[0]
            : "",
          lieu_naissance: details.lieu_naissance || "",
          sexe: details.sexe || "",
          rue: details.rue || "",
          ville: details.ville || "",
          code_postal: details.code_postal || "",
          province: details.province || "",
          id_national: details.id_national || "",
          telephone: details.telephone || "",
          email: details.email || "",
          nif: details.nif || "",
          situation_familiale: details.situation_familiale || "",
          dependants: details.dependants || 0,
          reduction_type: details.reduction_type || null,
          reduction_valeur: details.reduction_valeur || 0,
        });
        setShowEditModal(true);
      } else {
        setError("Impossible de charger les détails du particulier");
      }
    } catch (err) {
      setError("Erreur lors du chargement des détails");
    } finally {
      setProcessing(false);
    }
  };

  const openDeleteModal = (particulier: ParticulierType) => {
    setSelectedParticulier(particulier);
    setShowDeleteModal(true);
  };

  const openStatusModal = (particulier: ParticulierType) => {
    setSelectedParticulier(particulier);
    setShowStatusModal(true);
  };

  const openViewModal = async (particulier: ParticulierType) => {
    try {
      setProcessing(true);
      // Charger les détails complets pour la vue
      const details = await loadParticulierDetails(particulier.id);
      if (details) {
        setSelectedParticulier(details);
        setShowViewModal(true);
      } else {
        setError("Impossible de charger les détails du particulier");
      }
    } catch (err) {
      setError("Erreur lors du chargement des détails");
    } finally {
      setProcessing(false);
    }
  };

  // Validation du formulaire
  const isFormValid = (): boolean => {
    return !!(
      formData.nom.trim() &&
      formData.prenom.trim() &&
      formData.telephone.trim() &&
      formData.rue.trim()
    );
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
      if (e.key === 'Enter' && searchTerm.trim()) {
        handleSearch(1);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [searchTerm, handleSearch]);

  // Pour l'ajout, vous devrez aussi passer l'utilisateurId
  const handleAddParticulier = async () => {
    if (!isFormValid()) {
      setError("Les champs nom, prénom, téléphone et rue sont obligatoires");
      return;
    }

    setProcessing(true);
    try {
      const { addParticulier } = await import(
        "@/services/particuliers/particulierService"
      );
      const result = await addParticulier({
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance || undefined,
        lieu_naissance: formData.lieu_naissance || undefined,
        sexe: formData.sexe || undefined,
        rue: formData.rue,
        ville: formData.ville || undefined,
        code_postal: formData.code_postal || undefined,
        province: formData.province || undefined,
        id_national: formData.id_national || undefined,
        telephone: formData.telephone,
        email: formData.email || undefined,
        nif: formData.nif || undefined,
        situation_familiale: formData.situation_familiale || undefined,
        dependants: formData.dependants,
        reduction_type: formData.reduction_type || undefined,
        reduction_valeur: formData.reduction_valeur,
        utilisateur: utilisateur?.id, // Passer l'utilisateurId ici
      });

      if (result.status === "success") {
        setSuccessMessage(
          result.message || "Particulier ajouté avec succès"
        );
        setShowAddModal(false);
        // Recharger la page courante
        if (isSearching && searchTerm.trim()) {
          await handleSearch(currentPage);
        } else {
          await loadParticuliers(currentPage);
        }
      } else {
        setError(
          result.message || "Erreur lors de l'ajout du particulier"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />

      <ParticuliersHeader
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          if (!value.trim()) {
            // Si l'utilisateur efface la recherche, recharger les données normales
            loadParticuliers(1);
            setIsSearching(false);
          }
        }}
        onSearch={() => handleSearch(1)}
        onAddClick={() => {
          setFormData({
            nom: "",
            prenom: "",
            date_naissance: "",
            lieu_naissance: "",
            sexe: "",
            rue: "",
            ville: "",
            code_postal: "",
            province: "",
            id_national: "",
            telephone: "",
            email: "",
            nif: "",
            situation_familiale: "",
            dependants: 0,
            reduction_type: null,
            reduction_valeur: 0,
          });
          setShowAddModal(true);
        }}
      />

      <div className="flex-1 overflow-hidden">
        <ParticuliersTable
          particuliers={particuliers}
          loading={loading}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onToggleStatus={openStatusModal}
          onView={openViewModal}
        />
      </div>

      {/* Pagination */}
      {particuliers.length > 0 && (
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

      <ParticuliersModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showViewModal={showViewModal}
        selectedParticulier={selectedParticulier}
        formData={formData}
        processing={processing}
        provinces={provinces}
        situationsFamiliales={situationsFamiliales}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedParticulier(null);
          setFormData({
            nom: "",
            prenom: "",
            date_naissance: "",
            lieu_naissance: "",
            sexe: "",
            rue: "",
            ville: "",
            code_postal: "",
            province: "",
            id_national: "",
            telephone: "",
            email: "",
            nif: "",
            situation_familiale: "",
            dependants: 0,
            reduction_type: null,
            reduction_valeur: 0,
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedParticulier(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedParticulier(null);
        }}
        onViewClose={() => {
          setShowViewModal(false);
          setSelectedParticulier(null);
        }}
        onFormDataChange={setFormData}
        onAddParticulier={handleAddParticulier} // Utiliser la nouvelle fonction
        onEditParticulier={async () => {
          if (!selectedParticulier || !isFormValid()) {
            setError("Les champs nom, prénom, téléphone et rue sont obligatoires");
            return;
          }

          setProcessing(true);
          try {
            const { updateParticulier } = await import(
              "@/services/particuliers/particulierService"
            );
            const result = await updateParticulier(selectedParticulier.id, {
              nom: formData.nom,
              prenom: formData.prenom,
              date_naissance: formData.date_naissance,
              lieu_naissance: formData.lieu_naissance,
              sexe: formData.sexe,
              rue: formData.rue,
              ville: formData.ville,
              code_postal: formData.code_postal,
              province: formData.province,
              id_national: formData.id_national,
              telephone: formData.telephone,
              email: formData.email,
              nif: formData.nif,
              situation_familiale: formData.situation_familiale,
              dependants: formData.dependants,
              reduction_type: formData.reduction_type,
              reduction_valeur: formData.reduction_valeur,
            });

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Particulier modifié avec succès"
              );
              setShowEditModal(false);
              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadParticuliers(currentPage);
              }
            } else {
              setError(
                result.message || "Erreur lors de la modification du particulier"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteParticulier={async () => {
          if (!selectedParticulier) return;

          setProcessing(true);
          try {
            const { deleteParticulier } = await import(
              "@/services/particuliers/particulierService"
            );
            const result = await deleteParticulier(selectedParticulier.id);

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Particulier supprimé avec succès"
              );
              setShowDeleteModal(false);
              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadParticuliers(currentPage);
              }
            } else {
              setError(
                result.message || "Erreur lors de la suppression du particulier"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedParticulier) return;

          setProcessing(true);
          try {
            const { toggleParticulierStatus } = await import(
              "@/services/particuliers/particulierService"
            );
            const result = await toggleParticulierStatus(
              selectedParticulier.id,
              !selectedParticulier.actif
            );

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Statut du particulier modifié avec succès"
              );
              setShowStatusModal(false);
              // Recharger la page courante
              if (isSearching && searchTerm.trim()) {
                await handleSearch(currentPage);
              } else {
                await loadParticuliers(currentPage);
              }
            } else {
              setError(
                result.message || "Erreur lors du changement de statut du particulier"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        isFormValid={isFormValid}
      />
    </div>
  );
}