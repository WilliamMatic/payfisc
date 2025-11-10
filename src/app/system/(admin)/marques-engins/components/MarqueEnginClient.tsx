'use client';
import { useState, useEffect } from 'react';
import { MarqueEngin as MarqueEnginType } from '@/services/marques-engins/marqueEnginService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';
import MarqueEnginHeader from './MarqueEnginHeader';
import MarqueEnginTable from './MarqueEnginTable';
import MarqueEnginModals from './MarqueEnginModals';
import AlertMessage from './AlertMessage';

interface MarqueEnginClientProps {
  initialMarques: MarqueEnginType[];
  initialTypeEngins: TypeEnginType[];
  initialError: string | null;
}

export default function MarqueEnginClient({ initialMarques, initialTypeEngins, initialError }: MarqueEnginClientProps) {
  const [marques, setMarques] = useState<MarqueEnginType[]>(initialMarques || []);
  const [typeEngins, setTypeEngins] = useState<TypeEnginType[]>(initialTypeEngins || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMarque, setSelectedMarque] = useState<MarqueEnginType | null>(null);
  const [formData, setFormData] = useState({ 
    libelle: '', 
    description: '', 
    type_engin_id: 0 
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
    </div>
  );
}