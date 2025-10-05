'use client';
import { useState, useEffect } from 'react';
import { Impot as ImpotType, getImpots, searchImpots } from '@/services/impots/impotService';
import ImpotsHeader from './ImpotsHeader';
import ImpotsTable from './ImpotsTable';
import ImpotsModals from './ImpotsModals';
import AlertMessage from './AlertMessage';

interface ImpotsClientProps {
  initialImpots: ImpotType[];
  initialError: string | null;
}

export default function ImpotsClient({ initialImpots, initialError }: ImpotsClientProps) {
  const [impots, setImpots] = useState<ImpotType[]>(initialImpots || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedImpot, setSelectedImpot] = useState<ImpotType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '',
    jsonData: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les impôts
  const loadImpots = async () => {
    try {
      setLoading(true);
      const result = await getImpots();
      
      if (result.status === 'success') {
        setImpots(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des impôts');
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
      loadImpots();
      return;
    }

    try {
      setLoading(true);
      const result = await searchImpots(searchTerm);
      
      if (result.status === 'success') {
        setImpots(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des impôts avec vérification de null/undefined
  const filteredImpots = impots.filter(impot =>
    impot && // Vérification que impot n'est pas null/undefined
    (impot.nom && impot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    impot.description && impot.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers pour les modals
  const openEditModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setFormData({
      nom: impot.nom || '',
      description: impot.description || '',
      jsonData: JSON.stringify({
        periode: impot.periode,
        delaiAccord: impot.delai_accord,
        penalites: impot.penalites
      }, null, 2)
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowDeleteModal(true);
  };

  const openStatusModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowStatusModal(true);
  };

  const openDetailsModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowDetailsModal(true);
  };

  const openQRModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowQRModal(true);
  };

  // Fonctions pour les opérations CRUD
  const handleEditImpot = async () => {
    if (!selectedImpot || !formData.nom || !formData.description || !formData.jsonData) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const { updateImpot } = await import('@/services/impots/impotService');
      const result = await updateImpot(selectedImpot.id, formData);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Impôt modifié avec succès');
        setShowEditModal(false);
        setSelectedImpot(null);
        setFormData({ nom: '', description: '', jsonData: '' });
        
        // Recharger la liste complète des impôts
        await loadImpots();
      } else {
        setError(result.message || 'Erreur lors de la modification de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteImpot = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    try {
      const { deleteImpot } = await import('@/services/impots/impotService');
      const result = await deleteImpot(selectedImpot.id);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Impôt supprimé avec succès');
        setShowDeleteModal(false);
        setSelectedImpot(null);
        
        // Recharger la liste complète des impôts
        await loadImpots();
      } else {
        setError(result.message || 'Erreur lors de la suppression de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    try {
      const { toggleImpotStatus } = await import('@/services/impots/impotService');
      const result = await toggleImpotStatus(selectedImpot.id, !selectedImpot.actif);
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Statut de l\'impôt modifié avec succès');
        setShowStatusModal(false);
        setSelectedImpot(null);
        
        // Recharger la liste complète des impôts
        await loadImpots();
      } else {
        setError(result.message || 'Erreur lors du changement de statut de l\'impôt');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
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
      
      <ImpotsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <ImpotsTable
        impots={filteredImpots}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onViewDetails={openDetailsModal}
        onGenerateQR={openQRModal}
      />

      <ImpotsModals
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showDetailsModal={showDetailsModal}
        showQRModal={showQRModal}
        selectedImpot={selectedImpot}
        formData={formData}
        processing={processing}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedImpot(null);
          setFormData({ nom: '', description: '', jsonData: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedImpot(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedImpot(null);
        }}
        onDetailsClose={() => {
          setShowDetailsModal(false);
          setSelectedImpot(null);
        }}
        onQRClose={() => {
          setShowQRModal(false);
          setSelectedImpot(null);
        }}
        onFormDataChange={setFormData}
        onEditImpot={handleEditImpot}
        onDeleteImpot={handleDeleteImpot}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}