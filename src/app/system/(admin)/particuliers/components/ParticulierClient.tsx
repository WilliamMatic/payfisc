"use client";
import { useState, useEffect } from "react";
import {
  Particulier as ParticulierType,
  getParticuliers,
  searchParticuliers,
  getParticulierDetails,
} from "@/services/particuliers/particulierService";
import ParticuliersHeader from "./ParticulierHeader";
import ParticuliersTable from "./ParticulierTable";
import ParticuliersModals from "./ParticulierModals";
import AlertMessage from "./AlertMessage";

interface ParticuliersClientProps {
  initialParticuliers: ParticulierType[];
  initialError: string | null;
}

export default function ParticuliersClient({
  initialParticuliers,
  initialError,
}: ParticuliersClientProps) {
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

  // Fonction pour recharger les particuliers
  const loadParticuliers = async () => {
    try {
      setLoading(true);
      const result = await getParticuliers();

      if (result.status === "success") {
        setParticuliers(result.data || []);
        setError(null);
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
  };

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

  // Fonction de recherche
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadParticuliers();
      return;
    }

    try {
      setLoading(true);
      const result = await searchParticuliers(searchTerm);

      if (result.status === "success") {
        setParticuliers(result.data || []);
        setError(null);
      } else {
        setError(
          result.message || "Erreur lors de la recherche des particuliers"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des particuliers
  const filteredParticuliers = particuliers.filter(
    (particulier) =>
      particulier &&
      (particulier.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        particulier.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        particulier.nif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        particulier.telephone?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Validation du formulaire - CORRIGÉ : seulement nom, prénom, téléphone, rue obligatoires
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

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} />

      <ParticuliersHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
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

      <ParticuliersTable
        particuliers={filteredParticuliers}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onView={openViewModal}
      />

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
        onAddParticulier={async () => {
          // CORRECTION : Message d'erreur mis à jour
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
            });

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Particulier ajouté avec succès"
              );
              setShowAddModal(false);
              await loadParticuliers();
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
        }}
        onEditParticulier={async () => {
          // CORRECTION : Message d'erreur mis à jour
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
              await loadParticuliers();
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
              await loadParticuliers();
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
              await loadParticuliers();
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