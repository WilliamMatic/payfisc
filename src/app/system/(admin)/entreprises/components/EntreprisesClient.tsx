'use client';
import { useState, useEffect } from 'react';
import { Entreprise as EntrepriseType, getEntreprises, searchEntreprises } from '@/services/entreprises/entrepriseService';
import EntreprisesHeader from './EntreprisesHeader';
import EntreprisesTable from './EntreprisesTable';
import EntreprisesModals from './EntreprisesModals';
import AlertMessage from './AlertMessage';

interface EntreprisesClientProps {
  initialEntreprises: EntrepriseType[];
  initialError: string | null;
}

export default function EntreprisesClient({ initialEntreprises, initialError }: EntreprisesClientProps) {
  const [entreprises, setEntreprises] = useState<EntrepriseType[]>(initialEntreprises || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState<EntrepriseType | null>(null);
  const [formData, setFormData] = useState({
    raison_sociale: '',
    forme_juridique: '',
    nif: '',
    registre_commerce: '',
    date_creation: '',
    adresse_siege: '',
    telephone: '',
    email: '',
    representant_legal: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formesJuridiques = ['SARL', 'SA', 'EI', 'SAS', 'Autre'];

  // Fonction pour recharger les entreprises
  const loadEntreprises = async () => {
    try {
      setLoading(true);
      const result = await getEntreprises();
      
      if (result.status === 'success') {
        setEntreprises(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des entreprises');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de recherche
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadEntreprises();
      return;
    }

    try {
      setLoading(true);
      const result = await searchEntreprises(searchTerm);
      
      if (result.status === 'success') {
        setEntreprises(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors de la recherche des entreprises');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des entreprises avec vérification de null/undefined
  const filteredEntreprises = entreprises.filter(entreprise =>
    entreprise && (
      entreprise.raison_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.nif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.registre_commerce?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.telephone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setFormData({
      raison_sociale: entreprise.raison_sociale || '',
      forme_juridique: entreprise.forme_juridique || '',
      nif: entreprise.nif || '',
      registre_commerce: entreprise.registre_commerce || '',
      date_creation: entreprise.date_creation || '',
      adresse_siege: entreprise.adresse_siege || '',
      telephone: entreprise.telephone || '',
      email: entreprise.email || '',
      representant_legal: entreprise.representant_legal || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setShowDeleteModal(true);
  };

  const openStatusModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setShowStatusModal(true);
  };

  const openViewModal = (entreprise: EntrepriseType) => {
    setSelectedEntreprise(entreprise);
    setShowViewModal(true);
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
      
      <EntreprisesHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        onAddClick={() => setShowAddModal(true)}
      />

      <EntreprisesTable
        entreprises={filteredEntreprises}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onView={openViewModal}
      />

      <EntreprisesModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showViewModal={showViewModal}
        selectedEntreprise={selectedEntreprise}
        formData={formData}
        processing={processing}
        formesJuridiques={formesJuridiques}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedEntreprise(null);
          setFormData({
            raison_sociale: '',
            forme_juridique: '',
            nif: '',
            registre_commerce: '',
            date_creation: '',
            adresse_siege: '',
            telephone: '',
            email: '',
            representant_legal: ''
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedEntreprise(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedEntreprise(null);
        }}
        onViewClose={() => {
          setShowViewModal(false);
          setSelectedEntreprise(null);
        }}
        onFormDataChange={setFormData}
        onAddEntreprise={async () => {
          if (!formData.raison_sociale || !formData.nif || !formData.registre_commerce) {
            setError('Les champs raison sociale, NIF et registre de commerce sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { addEntreprise } = await import('@/services/entreprises/entrepriseService');
            const result = await addEntreprise(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Entreprise ajoutée avec succès');
              setFormData({
                raison_sociale: '',
                forme_juridique: '',
                nif: '',
                registre_commerce: '',
                date_creation: '',
                adresse_siege: '',
                telephone: '',
                email: '',
                representant_legal: ''
              });
              setShowAddModal(false);
              
              // Recharger la liste complète des entreprises
              await loadEntreprises();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'entreprise');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditEntreprise={async () => {
          if (!selectedEntreprise || !formData.raison_sociale || !formData.nif || !formData.registre_commerce) {
            setError('Les champs raison sociale, NIF et registre de commerce sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { updateEntreprise } = await import('@/services/entreprises/entrepriseService');
            const result = await updateEntreprise(selectedEntreprise.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Entreprise modifiée avec succès');
              setShowEditModal(false);
              setSelectedEntreprise(null);
              setFormData({
                raison_sociale: '',
                forme_juridique: '',
                nif: '',
                registre_commerce: '',
                date_creation: '',
                adresse_siege: '',
                telephone: '',
                email: '',
                representant_legal: ''
              });
              
              // Recharger la liste complète des entreprises
              await loadEntreprises();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'entreprise');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteEntreprise={async () => {
          if (!selectedEntreprise) return;

          setProcessing(true);
          try {
            const { deleteEntreprise } = await import('@/services/entreprises/entrepriseService');
            const result = await deleteEntreprise(selectedEntreprise.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Entreprise supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedEntreprise(null);
              
              // Recharger la liste complète des entreprises
              await loadEntreprises();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'entreprise');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedEntreprise) return;

          setProcessing(true);
          try {
            const { toggleEntrepriseStatus } = await import('@/services/entreprises/entrepriseService');
            const result = await toggleEntrepriseStatus(selectedEntreprise.id, !selectedEntreprise.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'entreprise modifié avec succès');
              setShowStatusModal(false);
              setSelectedEntreprise(null);
              
              // Recharger la liste complète des entreprises
              await loadEntreprises();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'entreprise');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
      />
    </div>
  );
}