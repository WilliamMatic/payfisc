"use client";
import { useState, useEffect } from "react";
import {
  Beneficiaire as BeneficiaireType,
  getBeneficiaires,
} from "@/services/beneficiaires/beneficiaireService";
import BeneficiaireHeader from "./BeneficiaireHeader";
import BeneficiaireTable from "./BeneficiaireTable";
import BeneficiaireModals from "./BeneficiaireModals";
import AlertMessage from "./AlertMessage";

interface BeneficiaireClientProps {
  initialBeneficiaires: BeneficiaireType[];
  initialError: string | null;
}

export default function BeneficiaireClient({
  initialBeneficiaires,
  initialError,
}: BeneficiaireClientProps) {
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireType[]>(
    initialBeneficiaires || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] =
    useState<BeneficiaireType | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    numero_compte: "",
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les bénéficiaires
  const loadBeneficiaires = async () => {
    try {
      setLoading(true);
      const result = await getBeneficiaires();

      if (result.status === "success") {
        setBeneficiaires(result.data || []);
        setError(null);
      } else {
        setError(
          result.message || "Erreur lors du chargement des bénéficiaires"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des bénéficiaires
  const filteredBeneficiaires = beneficiaires.filter(
    (beneficiaire) =>
      beneficiaire.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiaire.telephone.includes(searchTerm) ||
      beneficiaire.numero_compte
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const openEditModal = (beneficiaire: BeneficiaireType) => {
    setSelectedBeneficiaire(beneficiaire);
    setFormData({
      nom: beneficiaire.nom,
      telephone: beneficiaire.telephone,
      numero_compte: beneficiaire.numero_compte,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (beneficiaire: BeneficiaireType) => {
    setSelectedBeneficiaire(beneficiaire);
    setShowDeleteModal(true);
  };

  const openStatusModal = (beneficiaire: BeneficiaireType) => {
    setSelectedBeneficiaire(beneficiaire);
    setShowStatusModal(true);
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

      <BeneficiaireHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <BeneficiaireTable
        beneficiaires={filteredBeneficiaires}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <BeneficiaireModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedBeneficiaire={selectedBeneficiaire}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedBeneficiaire(null);
          setFormData({ nom: "", telephone: "", numero_compte: "" });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedBeneficiaire(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedBeneficiaire(null);
        }}
        onFormDataChange={setFormData}
        onAddBeneficiaire={async () => {
          if (!formData.nom || !formData.telephone || !formData.numero_compte) {
            setError(
              "Le nom, le téléphone et le numéro de compte sont obligatoires"
            );
            return;
          }

          setProcessing(true);
          try {
            const { addBeneficiaire } = await import(
              "@/services/beneficiaires/beneficiaireService"
            );
            const result = await addBeneficiaire(formData);

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Bénéficiaire ajouté avec succès"
              );
              setFormData({ nom: "", telephone: "", numero_compte: "" });
              setShowAddModal(false);

              // Recharger la liste complète des bénéficiaires
              await loadBeneficiaires();
            } else {
              setError(
                result.message || "Erreur lors de l'ajout du bénéficiaire"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onEditBeneficiaire={async () => {
          if (
            !selectedBeneficiaire ||
            !formData.nom ||
            !formData.telephone ||
            !formData.numero_compte
          ) {
            setError(
              "Le nom, le téléphone et le numéro de compte sont obligatoires"
            );
            return;
          }

          setProcessing(true);
          try {
            const { updateBeneficiaire } = await import(
              "@/services/beneficiaires/beneficiaireService"
            );
            const result = await updateBeneficiaire(
              selectedBeneficiaire.id,
              formData
            );

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Bénéficiaire modifié avec succès"
              );
              setShowEditModal(false);
              setSelectedBeneficiaire(null);
              setFormData({ nom: "", telephone: "", numero_compte: "" });

              // Recharger la liste complète des bénéficiaires
              await loadBeneficiaires();
            } else {
              setError(
                result.message ||
                  "Erreur lors de la modification du bénéficiaire"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteBeneficiaire={async () => {
          if (!selectedBeneficiaire) return;

          setProcessing(true);
          try {
            const { deleteBeneficiaire } = await import(
              "@/services/beneficiaires/beneficiaireService"
            );
            const result = await deleteBeneficiaire(selectedBeneficiaire.id);

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Bénéficiaire supprimé avec succès"
              );
              setShowDeleteModal(false);
              setSelectedBeneficiaire(null);

              // Recharger la liste complète des bénéficiaires
              await loadBeneficiaires();
            } else {
              setError(
                result.message ||
                  "Erreur lors de la suppression du bénéficiaire"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedBeneficiaire) return;

          setProcessing(true);
          try {
            const { toggleBeneficiaireStatus } = await import(
              "@/services/beneficiaires/beneficiaireService"
            );
            const result = await toggleBeneficiaireStatus(
              selectedBeneficiaire.id,
              !selectedBeneficiaire.actif
            );

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Statut du bénéficiaire modifié avec succès"
              );
              setShowStatusModal(false);
              setSelectedBeneficiaire(null);

              // Recharger la liste complète des bénéficiaires
              await loadBeneficiaires();
            } else {
              setError(
                result.message ||
                  "Erreur lors du changement de statut du bénéficiaire"
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
      />
    </div>
  );
}
