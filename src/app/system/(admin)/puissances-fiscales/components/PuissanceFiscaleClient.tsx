'use client';
import { useState, useEffect } from 'react';
import { PuissanceFiscale as PuissanceFiscaleType } from '@/services/puissances-fiscales/puissanceFiscaleService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';
import PuissanceFiscaleHeader from './PuissanceFiscaleHeader';
import PuissanceFiscaleTable from './PuissanceFiscaleTable';
import PuissanceFiscaleModals from './PuissanceFiscaleModals';
import AlertMessage from '../components/AlertMessage';

interface PuissanceFiscaleClientProps {
  initialPuissances: PuissanceFiscaleType[];
  initialTypeEngins: TypeEnginType[];
  initialError: string | null;
}

export default function PuissanceFiscaleClient({ initialPuissances, initialTypeEngins, initialError }: PuissanceFiscaleClientProps) {
  const [puissances, setPuissances] = useState<PuissanceFiscaleType[]>(initialPuissances || []);
  const [typeEngins, setTypeEngins] = useState<TypeEnginType[]>(initialTypeEngins || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPuissance, setSelectedPuissance] = useState<PuissanceFiscaleType | null>(null);
  const [formData, setFormData] = useState({ 
    libelle: '', 
    valeur: 0, 
    description: '',
    type_engin_id: 0 
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les puissances fiscales
  const loadPuissances = async () => {
    try {
      setLoading(true);
      const { getPuissancesFiscales } = await import('@/services/puissances-fiscales/puissanceFiscaleService');
      const result = await getPuissancesFiscales();
      
      if (result.status === 'success') {
        setPuissances(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des puissances fiscales');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des puissances fiscales avec vérification de null/undefined
  const filteredPuissances = puissances.filter(puissance =>
    puissance && // Vérification que puissance n'est pas null/undefined
    (puissance.libelle && puissance.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    puissance.type_engin_libelle && puissance.type_engin_libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    puissance.valeur && puissance.valeur.toString().includes(searchTerm) ||
    puissance.description && puissance.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openEditModal = (puissance: PuissanceFiscaleType) => {
    setSelectedPuissance(puissance);
    setFormData({
      libelle: puissance.libelle || '',
      valeur: puissance.valeur || 0,
      description: puissance.description || '',
      type_engin_id: puissance.type_engin_id || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (puissance: PuissanceFiscaleType) => {
    setSelectedPuissance(puissance);
    setShowDeleteModal(true);
  };

  const openStatusModal = (puissance: PuissanceFiscaleType) => {
    setSelectedPuissance(puissance);
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
      
      <PuissanceFiscaleHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <PuissanceFiscaleTable
        puissances={filteredPuissances}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <PuissanceFiscaleModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedPuissance={selectedPuissance}
        typeEngins={typeEngins}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedPuissance(null);
          setFormData({ libelle: '', valeur: 0, description: '', type_engin_id: 0 });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedPuissance(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedPuissance(null);
        }}
        onFormDataChange={setFormData}
        onAddPuissance={async () => {
          if (!formData.libelle || !formData.valeur || !formData.type_engin_id) {
            setError('Le libellé, la valeur et le type d\'engin sont obligatoires');
            return;
          }

          if (formData.valeur <= 0) {
            setError('La valeur doit être positive');
            return;
          }

          setProcessing(true);
          try {
            const { addPuissanceFiscale } = await import('@/services/puissances-fiscales/puissanceFiscaleService');
            const result = await addPuissanceFiscale(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Puissance fiscale ajoutée avec succès');
              setFormData({ libelle: '', valeur: 0, description: '', type_engin_id: 0 });
              setShowAddModal(false);
              
              // Recharger la liste complète des puissances fiscales
              await loadPuissances();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de la puissance fiscale');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditPuissance={async () => {
          if (!selectedPuissance || !formData.libelle || !formData.valeur || !formData.type_engin_id) {
            setError('Le libellé, la valeur et le type d\'engin sont obligatoires');
            return;
          }

          if (formData.valeur <= 0) {
            setError('La valeur doit être positive');
            return;
          }

          setProcessing(true);
          try {
            const { updatePuissanceFiscale } = await import('@/services/puissances-fiscales/puissanceFiscaleService');
            const result = await updatePuissanceFiscale(selectedPuissance.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Puissance fiscale modifiée avec succès');
              setShowEditModal(false);
              setSelectedPuissance(null);
              setFormData({ libelle: '', valeur: 0, description: '', type_engin_id: 0 });
              
              // Recharger la liste complète des puissances fiscales
              await loadPuissances();
            } else {
              setError(result.message || 'Erreur lors de la modification de la puissance fiscale');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeletePuissance={async () => {
          if (!selectedPuissance) return;

          setProcessing(true);
          try {
            const { deletePuissanceFiscale } = await import('@/services/puissances-fiscales/puissanceFiscaleService');
            const result = await deletePuissanceFiscale(selectedPuissance.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Puissance fiscale supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedPuissance(null);
              
              // Recharger la liste complète des puissances fiscales
              await loadPuissances();
            } else {
              setError(result.message || 'Erreur lors de la suppression de la puissance fiscale');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedPuissance) return;

          setProcessing(true);
          try {
            const { togglePuissanceFiscaleStatus } = await import('@/services/puissances-fiscales/puissanceFiscaleService');
            const result = await togglePuissanceFiscaleStatus(selectedPuissance.id, !selectedPuissance.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de la puissance fiscale modifié avec succès');
              setShowStatusModal(false);
              setSelectedPuissance(null);
              
              // Recharger la liste complète des puissances fiscales
              await loadPuissances();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de la puissance fiscale');
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