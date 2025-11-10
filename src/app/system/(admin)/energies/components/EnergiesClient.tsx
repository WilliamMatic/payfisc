// app/energies/components/EnergiesClient.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Energie as EnergieType, 
  getEnergies,
  addEnergie,
  updateEnergie,
  deleteEnergie,
  toggleEnergieStatus
} from '@/services/energies/energieService';
import EnergiesHeader from './EnergiesHeader';
import EnergiesTable from './EnergiesTable';
import EnergiesModals from './EnergiesModals';
import AlertMessage from '../../agents/components/AlertMessage';

interface EnergiesClientProps {
  initialEnergies: EnergieType[];
  initialError: string | null;
}

export default function EnergiesClient({ initialEnergies, initialError }: EnergiesClientProps) {
  const [energies, setEnergies] = useState<EnergieType[]>(initialEnergies || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEnergie, setSelectedEnergie] = useState<EnergieType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '',
    couleur: '#6B7280'
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadEnergies = async () => {
    try {
      setLoading(true);
      const result = await getEnergies();
      
      if (result.status === 'success') {
        setEnergies(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des énergies');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnergies = energies.filter(energie =>
    energie && (
      energie.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      energie.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (energie: EnergieType) => {
    setSelectedEnergie(energie);
    setFormData({
      nom: energie.nom || '',
      description: energie.description || '',
      couleur: energie.couleur || '#6B7280'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (energie: EnergieType) => {
    setSelectedEnergie(energie);
    setShowDeleteModal(true);
  };

  const openStatusModal = (energie: EnergieType) => {
    setSelectedEnergie(energie);
    setShowStatusModal(true);
  };

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
      
      <EnergiesHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <EnergiesTable
        energies={filteredEnergies}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <EnergiesModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedEnergie={selectedEnergie}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedEnergie(null);
          setFormData({ nom: '', description: '', couleur: '#6B7280' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedEnergie(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedEnergie(null);
        }}
        onFormDataChange={setFormData}
        onAddEnergie={async () => {
          if (!formData.nom) {
            setError('Le nom est obligatoire');
            return;
          }

          setProcessing(true);
          try {
            const result = await addEnergie(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Énergie ajoutée avec succès');
              setFormData({ nom: '', description: '', couleur: '#6B7280' });
              setShowAddModal(false);
              await loadEnergies();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'énergie');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditEnergie={async () => {
          if (!selectedEnergie || !formData.nom) {
            setError('Le nom est obligatoire');
            return;
          }

          setProcessing(true);
          try {
            const result = await updateEnergie(selectedEnergie.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Énergie modifiée avec succès');
              setShowEditModal(false);
              setSelectedEnergie(null);
              setFormData({ nom: '', description: '', couleur: '#6B7280' });
              await loadEnergies();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'énergie');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteEnergie={async () => {
          if (!selectedEnergie) return;

          setProcessing(true);
          try {
            const result = await deleteEnergie(selectedEnergie.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Énergie supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedEnergie(null);
              await loadEnergies();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'énergie');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedEnergie) return;

          setProcessing(true);
          try {
            const result = await toggleEnergieStatus(selectedEnergie.id, !selectedEnergie.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'énergie modifié avec succès');
              setShowStatusModal(false);
              setSelectedEnergie(null);
              await loadEnergies();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'énergie');
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