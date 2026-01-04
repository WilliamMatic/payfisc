'use client';
import { useState, useEffect } from 'react';
import { MarqueEngin as MarqueEnginType, ModeleEngin as ModeleEnginType } from '@/services/marques-engins/marqueEnginService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';
import MarqueEnginHeader from './MarqueEnginHeader';
import MarqueEnginTable from './MarqueEnginTable';
import MarqueEnginModals from './MarqueEnginModals';
import ModeleEnginModals from './ModeleEnginModals';
import AlertMessage from './AlertMessage';

interface MarqueEnginClientProps {
  initialMarques: MarqueEnginType[];
  initialTypeEngins: TypeEnginType[];
  initialError: string | null;
}

export default function MarqueEnginClient({ initialMarques, initialTypeEngins, initialError }: MarqueEnginClientProps) {
  const [marques, setMarques] = useState<MarqueEnginType[]>(initialMarques || []);
  const [typeEngins, setTypeEngins] = useState<TypeEnginType[]>(initialTypeEngins || []);
  const [modeles, setModeles] = useState<ModeleEnginType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddModeleModal, setShowAddModeleModal] = useState(false);
  const [showModelesModal, setShowModelesModal] = useState(false);
  const [selectedMarque, setSelectedMarque] = useState<MarqueEnginType | null>(null);
  const [formData, setFormData] = useState({ 
    libelle: '', 
    description: '', 
    type_engin_id: 0 
  });
  const [modeleFormData, setModeleFormData] = useState({
    libelle: '',
    description: '',
    marque_engin_id: 0
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les marques
  const loadMarques = async () => {
    try {
      setLoading(true);
      const { getMarquesEngins } = await import('@/services/marques-engins/marqueEnginService');
      const result = await getMarquesEngins();
      
      if (result.status === 'success') {
        setMarques(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des marques');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les modèles d'une marque
  const loadModeles = async (marqueId: number) => {
    try {
      const { getModelesEngins } = await import('@/services/marques-engins/marqueEnginService');
      const result = await getModelesEngins(marqueId);
      
      if (result.status === 'success') {
        setModeles(result.data || []);
        return result.data || [];
      } else {
        setError(result.message || 'Erreur lors du chargement des modèles');
        return [];
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return [];
    }
  };

  // Filtrage local des marques avec vérification de null/undefined
  const filteredMarques = marques.filter(marque =>
    marque && // Vérification que marque n'est pas null/undefined
    (marque.libelle && marque.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marque.type_engin_libelle && marque.type_engin_libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marque.description && marque.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openEditModal = (marque: MarqueEnginType) => {
    setSelectedMarque(marque);
    setFormData({
      libelle: marque.libelle || '',
      description: marque.description || '',
      type_engin_id: marque.type_engin_id || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (marque: MarqueEnginType) => {
    setSelectedMarque(marque);
    setShowDeleteModal(true);
  };

  const openStatusModal = (marque: MarqueEnginType) => {
    setSelectedMarque(marque);
    setShowStatusModal(true);
  };

  const openAddModeleModal = (marque: MarqueEnginType) => {
    setSelectedMarque(marque);
    setModeleFormData({
      libelle: '',
      description: '',
      marque_engin_id: marque.id
    });
    setShowAddModeleModal(true);
  };

  const openModelesModal = async (marque: MarqueEnginType) => {
    setSelectedMarque(marque);
    await loadModeles(marque.id);
    setShowModelesModal(true);
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
      
      <MarqueEnginHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <MarqueEnginTable
        marques={filteredMarques}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onAddModele={openAddModeleModal}
        onViewModeles={openModelesModal}
      />

      <MarqueEnginModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedMarque={selectedMarque}
        typeEngins={typeEngins}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedMarque(null);
          setFormData({ libelle: '', description: '', type_engin_id: 0 });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedMarque(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedMarque(null);
        }}
        onFormDataChange={setFormData}
        onAddMarque={async () => {
          if (!formData.libelle || !formData.type_engin_id) {
            setError('Le libellé et le type d\'engin sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { addMarqueEngin } = await import('@/services/marques-engins/marqueEnginService');
            const result = await addMarqueEngin(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Marque ajoutée avec succès');
              setFormData({ libelle: '', description: '', type_engin_id: 0 });
              setShowAddModal(false);
              
              // Recharger la liste complète des marques
              await loadMarques();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de la marque');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditMarque={async () => {
          if (!selectedMarque || !formData.libelle || !formData.type_engin_id) {
            setError('Le libellé et le type d\'engin sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { updateMarqueEngin } = await import('@/services/marques-engins/marqueEnginService');
            const result = await updateMarqueEngin(selectedMarque.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Marque modifiée avec succès');
              setShowEditModal(false);
              setSelectedMarque(null);
              setFormData({ libelle: '', description: '', type_engin_id: 0 });
              
              // Recharger la liste complète des marques
              await loadMarques();
            } else {
              setError(result.message || 'Erreur lors de la modification de la marque');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteMarque={async () => {
          if (!selectedMarque) return;

          setProcessing(true);
          try {
            const { deleteMarqueEngin } = await import('@/services/marques-engins/marqueEnginService');
            const result = await deleteMarqueEngin(selectedMarque.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Marque supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedMarque(null);
              
              // Recharger la liste complète des marques
              await loadMarques();
            } else {
              setError(result.message || 'Erreur lors de la suppression de la marque');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedMarque) return;

          setProcessing(true);
          try {
            const { toggleMarqueEnginStatus } = await import('@/services/marques-engins/marqueEnginService');
            const result = await toggleMarqueEnginStatus(selectedMarque.id, !selectedMarque.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de la marque modifié avec succès');
              setShowStatusModal(false);
              setSelectedMarque(null);
              
              // Recharger la liste complète des marques
              await loadMarques();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de la marque');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
      />

      <ModeleEnginModals
        showAddModeleModal={showAddModeleModal}
        showModelesModal={showModelesModal}
        selectedMarque={selectedMarque}
        modeles={modeles}
        modeleFormData={modeleFormData}
        processing={processing}
        onAddModeleClose={() => {
          setShowAddModeleModal(false);
          setSelectedMarque(null);
          setModeleFormData({ libelle: '', description: '', marque_engin_id: 0 });
        }}
        onModelesClose={() => {
          setShowModelesModal(false);
          setSelectedMarque(null);
          setModeles([]);
        }}
        onModeleFormDataChange={setModeleFormData}
        onAddModele={async () => {
          if (!modeleFormData.libelle || !modeleFormData.marque_engin_id) {
            setError('Le libellé du modèle est obligatoire');
            return;
          }

          setProcessing(true);
          try {
            const { addModeleEngin } = await import('@/services/marques-engins/marqueEnginService');
            const result = await addModeleEngin(modeleFormData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Modèle ajouté avec succès');
              setModeleFormData({ libelle: '', description: '', marque_engin_id: 0 });
              setShowAddModeleModal(false);
              
              // Recharger les modèles si la modal des modèles est ouverte
              if (selectedMarque && showModelesModal) {
                await loadModeles(selectedMarque.id);
              }
              
              // Recharger la liste des marques pour mettre à jour le compteur
              await loadMarques();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout du modèle');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onReloadModeles={async () => {
          if (selectedMarque) {
            await loadModeles(selectedMarque.id);
          }
        }}
        onError={setError}
        onSuccess={setSuccessMessage}
      />
    </div>
  );
}