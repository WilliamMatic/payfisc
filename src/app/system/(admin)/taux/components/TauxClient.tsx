'use client';
import { useState, useEffect } from 'react';
import { Taux as TauxType, getTaux } from '@/services/taux/tauxService';
import TauxHeader from './TauxHeader';
import TauxTable from './TauxTable';
import TauxModals from './TauxModals';
import AlertMessage from './AlertMessage';

interface TauxClientProps {
  initialTaux: TauxType[];
  initialError: string | null;
}

export default function TauxClient({ initialTaux, initialError }: TauxClientProps) {
  const [tauxList, setTauxList] = useState<TauxType[]>(initialTaux || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaux, setSelectedTaux] = useState<TauxType | null>(null);
  const [formData, setFormData] = useState({ nom: '', valeur: '', description: '' });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les taux
  const loadTaux = async () => {
    try {
      setLoading(true);
      const result = await getTaux();
      
      if (result.status === 'success') {
        setTauxList(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des taux avec vérification de null/undefined
  const filteredTaux = tauxList.filter(taux =>
    taux && // Vérification que taux n'est pas null/undefined
    taux.nom && taux.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.description && taux.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.valeur && taux.valeur.toString().includes(searchTerm)
  );

  const openEditModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setFormData({
      nom: taux.nom || '',
      valeur: taux.valeur.toString() || '',
      description: taux.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setShowDeleteModal(true);
  };

  const openStatusModal = (taux: TauxType) => {
    setSelectedTaux(taux);
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
      
      <TauxHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <TauxTable
        taux={filteredTaux}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <TauxModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedTaux={selectedTaux}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedTaux(null);
          setFormData({ nom: '', valeur: '', description: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedTaux(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedTaux(null);
        }}
        onFormDataChange={setFormData}
        onAddTaux={async () => {
          if (!formData.nom || !formData.valeur) {
            setError('Le nom et la valeur sont obligatoires');
            return;
          }

          const valeur = parseFloat(formData.valeur);
          if (isNaN(valeur) || valeur <= 0) {
            setError('La valeur doit être un nombre positif');
            return;
          }

          setProcessing(true);
          try {
            const { addTaux } = await import('@/services/taux/tauxService');
            const result = await addTaux({
              nom: formData.nom,
              valeur: valeur,
              description: formData.description
            });
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Taux ajouté avec succès');
              setFormData({ nom: '', valeur: '', description: '' });
              setShowAddModal(false);
              
              // Recharger la liste complète des taux
              await loadTaux();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout du taux');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditTaux={async () => {
          if (!selectedTaux || !formData.nom || !formData.valeur) {
            setError('Le nom et la valeur sont obligatoires');
            return;
          }

          const valeur = parseFloat(formData.valeur);
          if (isNaN(valeur) || valeur <= 0) {
            setError('La valeur doit être un nombre positif');
            return;
          }

          setProcessing(true);
          try {
            const { updateTaux } = await import('@/services/taux/tauxService');
            const result = await updateTaux(selectedTaux.id, {
              nom: formData.nom,
              valeur: valeur,
              description: formData.description
            });
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Taux modifié avec succès');
              setShowEditModal(false);
              setSelectedTaux(null);
              setFormData({ nom: '', valeur: '', description: '' });
              
              // Recharger la liste complète des taux
              await loadTaux();
            } else {
              setError(result.message || 'Erreur lors de la modification du taux');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteTaux={async () => {
          if (!selectedTaux) return;

          setProcessing(true);
          try {
            const { deleteTaux } = await import('@/services/taux/tauxService');
            const result = await deleteTaux(selectedTaux.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Taux supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedTaux(null);
              
              // Recharger la liste complète des taux
              await loadTaux();
            } else {
              setError(result.message || 'Erreur lors de la suppression du taux');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedTaux) return;

          setProcessing(true);
          try {
            let result;
            if (selectedTaux.actif) {
              const { deactivateTaux } = await import('@/services/taux/tauxService');
              result = await deactivateTaux(selectedTaux.id);
            } else {
              const { activateTaux } = await import('@/services/taux/tauxService');
              result = await activateTaux(selectedTaux.id);
            }
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut du taux modifié avec succès');
              setShowStatusModal(false);
              setSelectedTaux(null);
              
              // Recharger la liste complète des taux
              await loadTaux();
            } else {
              setError(result.message || 'Erreur lors du changement de statut du taux');
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