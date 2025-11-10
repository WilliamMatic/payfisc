'use client';
import { useState, useEffect } from 'react';
import { 
  UsageEngin as UsageEnginType,
  getUsages,
  addUsage,
  updateUsage,
  deleteUsage,
  toggleUsageStatus
} from '@/services/usages/usageService';
import UsagesHeader from './UsagesHeader';
import UsagesTable from './UsagesTable';
import UsagesModals from './UsagesModals';
import AlertMessage from './AlertMessage';

interface UsagesClientProps {
  initialUsages: UsageEnginType[];
  initialError: string | null;
}

export default function UsagesClient({ initialUsages, initialError }: UsagesClientProps) {
  const [usages, setUsages] = useState<UsageEnginType[]>(initialUsages || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState<UsageEnginType | null>(null);
  const [formData, setFormData] = useState({ 
    code: '', 
    libelle: '', 
    description: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les usages
  const loadUsages = async () => {
    try {
      setLoading(true);
      const result = await getUsages();
      
      if (result.status === 'success') {
        setUsages(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des usages');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des usages
  const filteredUsages = usages.filter(usage =>
    usage && (
      usage.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openEditModal = (usage: UsageEnginType) => {
    setSelectedUsage(usage);
    setFormData({
      code: usage.code || '',
      libelle: usage.libelle || '',
      description: usage.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (usage: UsageEnginType) => {
    setSelectedUsage(usage);
    setShowDeleteModal(true);
  };

  const openStatusModal = (usage: UsageEnginType) => {
    setSelectedUsage(usage);
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
      
      <UsagesHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <UsagesTable
        usages={filteredUsages}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <UsagesModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedUsage={selectedUsage}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedUsage(null);
          setFormData({ code: '', libelle: '', description: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedUsage(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedUsage(null);
        }}
        onFormDataChange={setFormData}
        onAddUsage={async () => {
          if (!formData.code || !formData.libelle) {
            setError('Le code et le libellé sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await addUsage(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Usage ajouté avec succès');
              setFormData({ code: '', libelle: '', description: '' });
              setShowAddModal(false);
              
              // Recharger la liste complète des usages
              await loadUsages();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'usage');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditUsage={async () => {
          if (!selectedUsage || !formData.code || !formData.libelle) {
            setError('Le code et le libellé sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const result = await updateUsage(selectedUsage.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Usage modifié avec succès');
              setShowEditModal(false);
              setSelectedUsage(null);
              setFormData({ code: '', libelle: '', description: '' });
              
              // Recharger la liste complète des usages
              await loadUsages();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'usage');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteUsage={async () => {
          if (!selectedUsage) return;

          setProcessing(true);
          try {
            const result = await deleteUsage(selectedUsage.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Usage supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedUsage(null);
              
              // Recharger la liste complète des usages
              await loadUsages();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'usage');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedUsage) return;

          setProcessing(true);
          try {
            const result = await toggleUsageStatus(selectedUsage.id, !selectedUsage.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'usage modifié avec succès');
              setShowStatusModal(false);
              setSelectedUsage(null);
              
              // Recharger la liste complète des usages
              await loadUsages();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'usage');
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