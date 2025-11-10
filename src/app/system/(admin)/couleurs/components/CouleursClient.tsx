// app/couleurs/components/CouleursClient.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  EnginCouleur as EnginCouleurType,
  getCouleurs,
  addCouleur,
  updateCouleur,
  deleteCouleur,
  toggleCouleurStatus
} from '@/services/couleurs/couleurService';
import CouleursHeader from './CouleursHeader';
import CouleursTable from './CouleursTable';
import CouleursModals from './CouleursModals';
import AlertMessage from './AlertMessage';

interface CouleursClientProps {
  initialCouleurs: EnginCouleurType[];
  initialError: string | null;
}

export default function CouleursClient({ initialCouleurs, initialError }: CouleursClientProps) {
  const [couleurs, setCouleurs] = useState<EnginCouleurType[]>(initialCouleurs || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCouleur, setSelectedCouleur] = useState<EnginCouleurType | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    code_hex: '#000000'
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les couleurs
  const loadCouleurs = async () => {
    try {
      setLoading(true);
      const result = await getCouleurs();
      
      if (result.status === 'success') {
        setCouleurs(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des couleurs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des couleurs
  const filteredCouleurs = couleurs.filter(couleur =>
    couleur && (
      couleur.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      couleur.code_hex?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (couleur: EnginCouleurType) => {
    setSelectedCouleur(couleur);
    setFormData({
      nom: couleur.nom || '',
      code_hex: couleur.code_hex || '#000000'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (couleur: EnginCouleurType) => {
    setSelectedCouleur(couleur);
    setShowDeleteModal(true);
  };

  const openStatusModal = (couleur: EnginCouleurType) => {
    setSelectedCouleur(couleur);
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
      
      <CouleursHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <CouleursTable
        couleurs={filteredCouleurs}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <CouleursModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedCouleur={selectedCouleur}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedCouleur(null);
          setFormData({ nom: '', code_hex: '#000000' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedCouleur(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedCouleur(null);
        }}
        onFormDataChange={setFormData}
        onAddCouleur={async () => {
          if (!formData.nom || !formData.code_hex) {
            setError('Tous les champs sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await addCouleur(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Couleur ajoutée avec succès');
              setFormData({ nom: '', code_hex: '#000000' });
              setShowAddModal(false);
              
              // Recharger la liste complète des couleurs
              await loadCouleurs();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de la couleur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditCouleur={async () => {
          if (!selectedCouleur || !formData.nom || !formData.code_hex) {
            setError('Tous les champs sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await updateCouleur(selectedCouleur.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Couleur modifiée avec succès');
              setShowEditModal(false);
              setSelectedCouleur(null);
              setFormData({ nom: '', code_hex: '#000000' });
              
              // Recharger la liste complète des couleurs
              await loadCouleurs();
            } else {
              setError(result.message || 'Erreur lors de la modification de la couleur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteCouleur={async () => {
          if (!selectedCouleur) return;

          setProcessing(true);
          try {
            const result = await deleteCouleur(selectedCouleur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Couleur supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedCouleur(null);
              
              // Recharger la liste complète des couleurs
              await loadCouleurs();
            } else {
              setError(result.message || 'Erreur lors de la suppression de la couleur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedCouleur) return;

          setProcessing(true);
          try {
            const result = await toggleCouleurStatus(selectedCouleur.id, !selectedCouleur.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de la couleur modifié avec succès');
              setShowStatusModal(false);
              setSelectedCouleur(null);
              
              // Recharger la liste complète des couleurs
              await loadCouleurs();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de la couleur');
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