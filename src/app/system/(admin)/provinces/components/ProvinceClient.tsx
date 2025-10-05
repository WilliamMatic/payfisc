'use client';
import { useState, useEffect } from 'react';
import { Province as ProvinceType, getProvinces } from '@/services/provinces/provinceService';
import ProvinceHeader from './ProvinceHeader';
import ProvinceTable from './ProvinceTable';
import ProvinceModals from './ProvinceModals';
import AlertMessage from './AlertMessage';

interface ProvinceClientProps {
  initialProvinces: ProvinceType[];
  initialError: string | null;
}

export default function ProvinceClient({ initialProvinces, initialError }: ProvinceClientProps) {
  const [provinces, setProvinces] = useState<ProvinceType[]>(initialProvinces || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceType | null>(null);
  const [formData, setFormData] = useState({ nom: '', code: '', description: '' });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les provinces
  const loadProvinces = async () => {
    try {
      setLoading(true);
      const result = await getProvinces();
      
      if (result.status === 'success') {
        setProvinces(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des provinces');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des provinces avec vérification de null/undefined
  const filteredProvinces = provinces.filter(province =>
    province && // Vérification que province n'est pas null/undefined
    province.nom && province.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    province.code && province.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    province.description && province.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (province: ProvinceType) => {
    setSelectedProvince(province);
    setFormData({
      nom: province.nom || '',
      code: province.code || '',
      description: province.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (province: ProvinceType) => {
    setSelectedProvince(province);
    setShowDeleteModal(true);
  };

  const openStatusModal = (province: ProvinceType) => {
    setSelectedProvince(province);
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
      
      <ProvinceHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <ProvinceTable
        provinces={filteredProvinces}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <ProvinceModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedProvince={selectedProvince}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedProvince(null);
          setFormData({ nom: '', code: '', description: '' });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedProvince(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedProvince(null);
        }}
        onFormDataChange={setFormData}
        onAddProvince={async () => {
          if (!formData.nom || !formData.code) {
            setError('Le nom et le code sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { addProvince } = await import('@/services/provinces/provinceService');
            const result = await addProvince(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Province ajoutée avec succès');
              setFormData({ nom: '', code: '', description: '' });
              setShowAddModal(false);
              
              // Recharger la liste complète des provinces
              await loadProvinces();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de la province');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditProvince={async () => {
          if (!selectedProvince || !formData.nom || !formData.code) {
            setError('Le nom et le code sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { updateProvince } = await import('@/services/provinces/provinceService');
            const result = await updateProvince(selectedProvince.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Province modifiée avec succès');
              setShowEditModal(false);
              setSelectedProvince(null);
              setFormData({ nom: '', code: '', description: '' });
              
              // Recharger la liste complète des provinces
              await loadProvinces();
            } else {
              setError(result.message || 'Erreur lors de la modification de la province');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteProvince={async () => {
          if (!selectedProvince) return;

          setProcessing(true);
          try {
            const { deleteProvince } = await import('@/services/provinces/provinceService');
            const result = await deleteProvince(selectedProvince.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Province supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedProvince(null);
              
              // Recharger la liste complète des provinces
              await loadProvinces();
            } else {
              setError(result.message || 'Erreur lors de la suppression de la province');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedProvince) return;

          setProcessing(true);
          try {
            const { toggleProvinceStatus } = await import('@/services/provinces/provinceService');
            const result = await toggleProvinceStatus(selectedProvince.id, !selectedProvince.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de la province modifié avec succès');
              setShowStatusModal(false);
              setSelectedProvince(null);
              
              // Recharger la liste complète des provinces
              await loadProvinces();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de la province');
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