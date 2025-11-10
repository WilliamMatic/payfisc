// app/type-engins/components/TypeEnginsClient.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  TypeEngin as TypeEnginType,
  getTypeEngins,
  addTypeEngin,
  updateTypeEngin,
  deleteTypeEngin,
  toggleTypeEnginStatus
} from '@/services/type-engins/typeEnginService';
import TypeEnginsHeader from './TypeEnginsHeader';
import TypeEnginsTable from './TypeEnginsTable';
import TypeEnginsModals from './TypeEnginsModals';
import AlertMessage from './AlertMessage';

interface TypeEnginsClientProps {
  initialTypeEngins: TypeEnginType[];
  initialError: string | null;
}

export default function TypeEnginsClient({ initialTypeEngins, initialError }: TypeEnginsClientProps) {
  const [typeEngins, setTypeEngins] = useState<TypeEnginType[]>(initialTypeEngins || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTypeEngin, setSelectedTypeEngin] = useState<TypeEnginType | null>(null);
  const [formData, setFormData] = useState({ 
    libelle: '', 
    description: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les types d'engins
  const loadTypeEngins = async () => {
    try {
      setLoading(true);
      const result = await getTypeEngins();
      
      if (result.status === 'success') {
        setTypeEngins(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des types d\'engins');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des types d'engins
  const filteredTypeEngins = typeEngins.filter(typeEngin =>
    typeEngin && (
      typeEngin.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      typeEngin.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (typeEngin: TypeEnginType) => {
    setSelectedTypeEngin(typeEngin);
    setFormData({
      libelle: typeEngin.libelle || '',
      description: typeEngin.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (typeEngin: TypeEnginType) => {
    setSelectedTypeEngin(typeEngin);
    setShowDeleteModal(true);
  };

  const openStatusModal = (typeEngin: TypeEnginType) => {
    setSelectedTypeEngin(typeEngin);
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
      
      <TypeEnginsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <TypeEnginsTable
        typeEngins={filteredTypeEngins}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <TypeEnginsModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedTypeEngin={selectedTypeEngin}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedTypeEngin(null);
          setFormData({ libelle: '', description: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedTypeEngin(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedTypeEngin(null);
        }}
        onFormDataChange={setFormData}
        onAddTypeEngin={async () => {
          if (!formData.libelle) {
            setError('Le libellé est obligatoire');
            return;
          }

          setProcessing(true);
          try {
            const result = await addTypeEngin(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Type d\'engin ajouté avec succès');
              setFormData({ libelle: '', description: '' });
              setShowAddModal(false);
              
              // Recharger la liste complète
              await loadTypeEngins();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout du type d\'engin');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditTypeEngin={async () => {
          if (!selectedTypeEngin || !formData.libelle) {
            setError('Le libellé est obligatoire');
            return;
          }

          setProcessing(true);
          try {
            const result = await updateTypeEngin(selectedTypeEngin.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Type d\'engin modifié avec succès');
              setShowEditModal(false);
              setSelectedTypeEngin(null);
              setFormData({ libelle: '', description: '' });
              
              // Recharger la liste complète
              await loadTypeEngins();
            } else {
              setError(result.message || 'Erreur lors de la modification du type d\'engin');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteTypeEngin={async () => {
          if (!selectedTypeEngin) return;

          setProcessing(true);
          try {
            const result = await deleteTypeEngin(selectedTypeEngin.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Type d\'engin supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedTypeEngin(null);
              
              // Recharger la liste complète
              await loadTypeEngins();
            } else {
              setError(result.message || 'Erreur lors de la suppression du type d\'engin');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedTypeEngin) return;

          setProcessing(true);
          try {
            const result = await toggleTypeEnginStatus(selectedTypeEngin.id, !selectedTypeEngin.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut du type d\'engin modifié avec succès');
              setShowStatusModal(false);
              setSelectedTypeEngin(null);
              
              // Recharger la liste complète
              await loadTypeEngins();
            } else {
              setError(result.message || 'Erreur lors du changement de statut du type d\'engin');
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