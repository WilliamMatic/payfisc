"use client";
import { useState, useEffect } from "react";
import {
  Site as SiteType,
  Province as ProvinceType,
} from "@/services/sites/siteService";
import SiteHeader from "./SiteHeader";
import SiteTable from "./SiteTable";
import SiteModals from "./SiteModals";
import AlertMessage from "./AlertMessage";
import SiteTaxesModal from "./SiteTaxesModal"; // Nouvel import

interface SiteClientProps {
  initialSites: SiteType[];
  initialProvinces: ProvinceType[];
  initialError: string | null;
}

export default function SiteClient({
  initialSites,
  initialProvinces,
  initialError,
}: SiteClientProps) {
  const [sites, setSites] = useState<SiteType[]>(initialSites || []);
  const [provinces, setProvinces] = useState<ProvinceType[]>(
    initialProvinces || [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTaxesModal, setShowTaxesModal] = useState(false); // Nouvel état
  const [selectedSite, setSelectedSite] = useState<SiteType | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    code: "",
    description: "",
    formule: "",
    template_carte_actuel: false,
    province_id: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fonction pour recharger les sites
  const loadSites = async () => {
    try {
      setLoading(true);
      const { getSites } = await import("@/services/sites/siteService");
      const result = await getSites();

      if (result.status === "success") {
        setSites(result.data || []);
        setError(null);
      } else {
        setError(result.message || "Erreur lors du chargement des sites");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const term = searchTerm?.toLowerCase() || "";

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const filteredSites = sites.filter(
    (site) =>
      site &&
      (site.nom?.toString().toLowerCase().includes(term) ||
        site.code?.toString().toLowerCase().includes(term) ||
        site.province_nom?.toString().toLowerCase().includes(term) ||
        site.description?.toString().toLowerCase().includes(term) ||
        site.formule?.toString().toLowerCase().includes(term)),
  );

  const openEditModal = (site: SiteType) => {
    setSelectedSite(site);
    setFormData({
      nom: site.nom || "",
      code: site.code || "",
      description: site.description || "",
      formule: site.formule || "",
      template_carte_actuel: site.template_carte_actuel || false,
      province_id: site.province_id || 0,
    });
    setLogoFile(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (site: SiteType) => {
    setSelectedSite(site);
    setShowDeleteModal(true);
  };

  const openStatusModal = (site: SiteType) => {
    setSelectedSite(site);
    setShowStatusModal(true);
  };

  const openTaxesModal = (site: SiteType) => { // Nouvelle fonction
    setSelectedSite(site);
    setShowTaxesModal(true);
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

      <SiteHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <SiteTable
        sites={filteredSites}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onManageTaxes={openTaxesModal} // Nouvelle prop
      />

      <SiteModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedSite={selectedSite}
        provinces={provinces}
        formData={formData}
        processing={processing}
        logoFile={logoFile}
        onLogoFileChange={setLogoFile}
        onAddClose={() => { setShowAddModal(false); setLogoFile(null); }}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedSite(null);
          setLogoFile(null);
          setFormData({
            nom: "",
            code: "",
            description: "",
            formule: "",
            template_carte_actuel: false,
            province_id: 0,
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedSite(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedSite(null);
        }}
        onFormDataChange={setFormData}
        onAddSite={async () => {
          if (!formData.nom || !formData.code || !formData.province_id) {
            setError("Le nom, le code et la province sont obligatoires");
            return;
          }

          setProcessing(true);
          try {
            const { addSite } = await import("@/services/sites/siteService");
            const payload: any = { ...formData };
            if (logoFile) {
              payload.logoBase64 = await convertToBase64(logoFile);
              payload.logoFileName = logoFile.name;
            }
            const result = await addSite(payload);

            if (result.status === "success") {
              setSuccessMessage(result.message || "Site ajouté avec succès");
              setFormData({
                nom: "",
                code: "",
                description: "",
                formule: "",
                template_carte_actuel: false,
                province_id: 0,
              });
              setLogoFile(null);
              setShowAddModal(false);

              // Recharger la liste complète des sites
              await loadSites();
            } else {
              setError(result.message || "Erreur lors de l'ajout du site");
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onEditSite={async () => {
          if (
            !selectedSite ||
            !formData.nom ||
            !formData.code ||
            !formData.province_id
          ) {
            setError("Le nom, le code et la province sont obligatoires");
            return;
          }

          setProcessing(true);
          try {
            const { updateSite } = await import("@/services/sites/siteService");
            const payload: any = { ...formData };
            if (logoFile) {
              payload.logoBase64 = await convertToBase64(logoFile);
              payload.logoFileName = logoFile.name;
            }
            const result = await updateSite(selectedSite.id, payload);

            if (result.status === "success") {
              setSuccessMessage(result.message || "Site modifié avec succès");
              setShowEditModal(false);
              setSelectedSite(null);
              setLogoFile(null);
              setFormData({
                nom: "",
                code: "",
                description: "",
                formule: "",
                template_carte_actuel: false,
                province_id: 0,
              });

              // Recharger la liste complète des sites
              await loadSites();
            } else {
              setError(
                result.message || "Erreur lors de la modification du site",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteSite={async () => {
          if (!selectedSite) return;

          setProcessing(true);
          try {
            const { deleteSite } = await import("@/services/sites/siteService");
            const result = await deleteSite(selectedSite.id);

            if (result.status === "success") {
              setSuccessMessage(result.message || "Site supprimé avec succès");
              setShowDeleteModal(false);
              setSelectedSite(null);

              // Recharger la liste complète des sites
              await loadSites();
            } else {
              setError(
                result.message || "Erreur lors de la suppression du site",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedSite) return;

          setProcessing(true);
          try {
            const { toggleSiteStatus } =
              await import("@/services/sites/siteService");
            const result = await toggleSiteStatus(
              selectedSite.id,
              !selectedSite.actif,
            );

            if (result.status === "success") {
              setSuccessMessage(
                result.message || "Statut du site modifié avec succès",
              );
              setShowStatusModal(false);
              setSelectedSite(null);

              // Recharger la liste complète des sites
              await loadSites();
            } else {
              setError(
                result.message || "Erreur lors du changement de statut du site",
              );
            }
          } catch (err) {
            setError("Erreur de connexion au serveur");
          } finally {
            setProcessing(false);
          }
        }}
      />

      {/* Nouvelle modale pour les taxes */}
      {showTaxesModal && selectedSite && (
        <SiteTaxesModal
          siteId={selectedSite.id}
          siteNom={selectedSite.nom}
          onClose={() => {
            setShowTaxesModal(false);
            setSelectedSite(null);
          }}
        />
      )}
    </div>
  );
}