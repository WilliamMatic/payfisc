'use client';
import { useState, useEffect } from 'react';
import { Impot as ImpotType, getImpots, searchImpots } from '@/services/impots/impotService';
import ImpotsHeader from './ImpotsHeader';
import ImpotsTable from './ImpotsTable';
import ImpotsModals from './ImpotsModals';
import AlertMessage from './AlertMessage';
import BeneficiairesImpotModal from './modals/BeneficiairesImpotModal';
import Portal from '../../components/Portal';

interface ImpotsClientProps {
  initialImpots: ImpotType[];
  initialError: string | null;
}

export default function ImpotsClient({ initialImpots, initialError }: ImpotsClientProps) {
  // États principaux
  const [impots, setImpots] = useState<ImpotType[]>(initialImpots || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // États pour les modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBeneficiairesModal, setShowBeneficiairesModal] = useState(false);

  // États pour la sélection et le traitement
  const [selectedImpot, setSelectedImpot] = useState<ImpotType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '',
    jsonData: ''
  });
  const [processing, setProcessing] = useState(false);

  // ======================================================================
  // FONCTIONS DE CHARGEMENT ET RECHERCHE
  // ======================================================================

  /**
   * Charge la liste complète des impôts
   */
  const loadImpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getImpots();
      
      if (result.status === 'success') {
        const cleanedImpots = (result.data || []).filter(
          (impot: ImpotType | null | undefined): impot is ImpotType =>
            impot !== null && impot !== undefined
        );
        setImpots(cleanedImpots);
      } else {
        setError(result.message || 'Erreur lors du chargement des impôts');
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effectue une recherche d'impôts
   */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Si la recherche est vide, recharger tous les impôts
      await loadImpots();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await searchImpots(searchTerm);
      
      if (result.status === 'success') {
        const cleanedImpots = (result.data || []).filter(
          (impot: ImpotType | null | undefined): impot is ImpotType =>
            impot !== null && impot !== undefined
        );
        setImpots(cleanedImpots);
        
        if (cleanedImpots.length === 0) {
          setError(`Aucun impôt trouvé pour "${searchTerm}"`);
        }
      } else {
        setError(result.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      console.error('Erreur de recherche:', err);
      setError('Erreur de connexion au serveur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtrage local des impôts (fallback si l'API de recherche échoue)
   */
  const filteredImpots = impots.filter(impot =>
    impot && // Vérification que impot n'est pas null/undefined
    (
      (impot.nom && impot.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (impot.description && impot.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (impot.periode && impot.periode.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // ======================================================================
  // HANDLERS POUR LES MODALS
  // ======================================================================

  /**
   * Ouvre le modal d'édition
   */
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

  /**
   * Ouvre le modal de suppression
   */
  const openDeleteModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowDeleteModal(true);
  };

  /**
   * Ouvre le modal de changement de statut
   */
  const openStatusModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowStatusModal(true);
  };

  /**
   * Ouvre le modal de détails
   */
  const openDetailsModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowDetailsModal(true);
  };

  /**
   * Ouvre le modal QR Code
   */
  const openQRModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowQRModal(true);
  };

  /**
   * Ouvre le modal de gestion des bénéficiaires
   */
  const openBeneficiairesModal = (impot: ImpotType) => {
    setSelectedImpot(impot);
    setShowBeneficiairesModal(true);
  };

  // ======================================================================
  // FONCTIONS CRUD
  // ======================================================================

  /**
   * Modifie un impôt existant
   */
  const handleEditImpot = async () => {
    if (!selectedImpot || !formData.nom || !formData.description || !formData.jsonData) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    setProcessing(true);
    setError(null);

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
      console.error('Erreur modification:', err);
      setError('Erreur de connexion au serveur lors de la modification');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Supprime un impôt
   */
  const handleDeleteImpot = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    setError(null);

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
      console.error('Erreur suppression:', err);
      setError('Erreur de connexion au serveur lors de la suppression');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Change le statut d'un impôt
   */
  const handleToggleStatus = async () => {
    if (!selectedImpot) return;

    setProcessing(true);
    setError(null);

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
      console.error('Erreur changement statut:', err);
      setError('Erreur de connexion au serveur lors du changement de statut');
    } finally {
      setProcessing(false);
    }
  };

  // ======================================================================
  // GESTION DES MESSAGES ET EFFETS
  // ======================================================================

  /**
   * Efface les messages d'erreur après un délai
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Efface les messages de succès après un délai
   */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Recharge les impôts au montage du composant si la liste initiale est vide
   */
  useEffect(() => {
    if (initialImpots.length === 0 && !initialError) {
      loadImpots();
    }
  }, []);

  /**
   * Gestion de la recherche par touche Entrée
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && searchTerm.trim()) {
        handleSearch();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [searchTerm]);

  // ======================================================================
  // RENDU PRINCIPAL
  // ======================================================================

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Messages d'alerte */}
      <AlertMessage 
        error={error} 
        successMessage={successMessage} 
        onDismiss={() => {
          setError(null);
          setSuccessMessage(null);
        }}
      />
      
      {/* En-tête avec recherche */}
      <ImpotsHeader 
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          // Réinitialiser l'erreur si l'utilisateur modifie la recherche
          if (error && error.includes('Aucun impôt trouvé')) {
            setError(null);
          }
        }}
        onSearch={handleSearch}
      />

      {/* Tableau principal */}
      <div className="flex-1 min-h-0">
        <ImpotsTable
          impots={filteredImpots}
          loading={loading}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onToggleStatus={openStatusModal}
          onViewDetails={openDetailsModal}
          onGenerateQR={openQRModal}
          onManageBeneficiaires={openBeneficiairesModal}
        />
      </div>

      {/* Modals existants */}
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

      {/* NOUVEAU MODAL : Gestion des bénéficiaires */}
      {showBeneficiairesModal && selectedImpot && (
        <Portal>
          <BeneficiairesImpotModal
            impot={selectedImpot}
            onClose={() => {
              setShowBeneficiairesModal(false);
              setSelectedImpot(null);
            }}
          />
        </Portal>
      )}

      {/* Indicateur de chargement global */}
      {processing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Traitement en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}