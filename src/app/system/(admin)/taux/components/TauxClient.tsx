'use client';
import { useState, useEffect } from 'react';
import { 
  Taux as TauxType, 
  getTaux, 
  getImpots, 
  getProvinces,
  attribuerTaux,
  definirTauxDefaut,
  retirerAttributionTaux,
  Impot as ImpotType,
  Province as ProvinceType,
  AttributionTaux
} from '@/services/taux/tauxService';
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
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [selectedTaux, setSelectedTaux] = useState<TauxType | null>(null);
  const [selectedAttribution, setSelectedAttribution] = useState<AttributionTaux | null>(null);
  const [formData, setFormData] = useState({ 
    nom: '', 
    valeur: '', 
    description: '',
    est_par_defaut: false 
  });
  const [attributionFormData, setAttributionFormData] = useState({
    province_id: '',
    impot_id: '',
    actif: true
  });
  const [defautFormData, setDefautFormData] = useState({
    impot_id: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [impots, setImpots] = useState<ImpotType[]>([]);
  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [loadingImpotsProvinces, setLoadingImpotsProvinces] = useState(false);

  // Charger les impôts et provinces
  const loadImpotsAndProvinces = async () => {
    try {
      setLoadingImpotsProvinces(true);
      
      const [impotsResult, provincesResult] = await Promise.all([
        getImpots(),
        getProvinces()
      ]);

      if (impotsResult.status === 'success') {
        setImpots(impotsResult.data || []);
      }

      if (provincesResult.status === 'success') {
        setProvinces(provincesResult.data || []);
      }
    } catch (err) {
      console.error('Error loading impots/provinces:', err);
    } finally {
      setLoadingImpotsProvinces(false);
    }
  };

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

  // Charger au premier rendu
  useEffect(() => {
    loadImpotsAndProvinces();
  }, []);

  // Filtrage local des taux
  const filteredTaux = tauxList.filter(taux =>
    taux &&
    (taux.nom && taux.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.description && taux.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taux.valeur && taux.valeur.toString().includes(searchTerm))
  );

  const openEditModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setFormData({
      nom: taux.nom || '',
      valeur: taux.valeur.toString() || '',
      description: taux.description || '',
      est_par_defaut: taux.est_par_defaut || false
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setShowDeleteModal(true);
  };

  const openAttributionModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setAttributionFormData({
      province_id: '',
      impot_id: '',
      actif: true
    });
    setShowAttributionModal(true);
  };

  const openDefautModal = (taux: TauxType) => {
    setSelectedTaux(taux);
    setDefautFormData({
      impot_id: ''
    });
    setShowDefautModal(true);
  };

  const openRetraitAttributionModal = (taux: TauxType, attribution: AttributionTaux) => {
    setSelectedTaux(taux);
    setSelectedAttribution(attribution);
    // Ouvrir une modal de confirmation pour le retrait
    if (window.confirm(`Êtes-vous sûr de vouloir retirer cette attribution ?\n\nProvince: ${attribution.province_nom || 'Toutes provinces'}\nImpôt: ${attribution.impot_nom}`)) {
      handleRetirerAttribution(taux.id, attribution.province_id, attribution.impot_id);
    }
  };

  // Gestion des attributions
  const handleAttribuerTaux = async () => {
    if (!selectedTaux || !attributionFormData.impot_id) {
      setError('L\'impôt est obligatoire');
      return;
    }

    setProcessing(true);
    try {
      const result = await attribuerTaux({
        taux_id: selectedTaux.id,
        province_id: attributionFormData.province_id ? parseInt(attributionFormData.province_id) : null,
        impot_id: parseInt(attributionFormData.impot_id),
        actif: attributionFormData.actif
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Taux attribué avec succès');
        setShowAttributionModal(false);
        setSelectedTaux(null);
        setAttributionFormData({
          province_id: '',
          impot_id: '',
          actif: true
        });
        
        // Recharger la liste complète des taux
        await loadTaux();
      } else {
        setError(result.message || 'Erreur lors de l\'attribution du taux');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
  };

  // Définir comme taux par défaut
  const handleDefinirTauxDefaut = async () => {
    if (!selectedTaux || !defautFormData.impot_id) {
      setError('L\'impôt est obligatoire');
      return;
    }

    setProcessing(true);
    try {
      const result = await definirTauxDefaut({
        taux_id: selectedTaux.id,
        impot_id: parseInt(defautFormData.impot_id)
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Taux défini comme taux par défaut');
        setShowDefautModal(false);
        setSelectedTaux(null);
        setDefautFormData({
          impot_id: ''
        });
        
        // Recharger la liste complète des taux
        await loadTaux();
      } else {
        setError(result.message || 'Erreur lors de la définition du taux par défaut');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
  };

  // Retirer une attribution
  const handleRetirerAttribution = async (tauxId: number, provinceId: number | null, impotId: number) => {
    setProcessing(true);
    try {
      const result = await retirerAttributionTaux({
        taux_id: tauxId,
        province_id: provinceId,
        impot_id: impotId
      });
      
      if (result.status === 'success') {
        setSuccessMessage(result.message || 'Attribution retirée avec succès');
        
        // Recharger la liste complète des taux
        await loadTaux();
      } else {
        setError(result.message || 'Erreur lors du retrait de l\'attribution');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setProcessing(false);
    }
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
        onAttribuer={openAttributionModal}
        onDefinirDefaut={openDefautModal}
        onRetirerAttribution={openRetraitAttributionModal}
      />

      <TauxModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showAttributionModal={showAttributionModal}
        showDefautModal={showDefautModal}
        selectedTaux={selectedTaux}
        formData={formData}
        attributionFormData={attributionFormData}
        defautFormData={defautFormData}
        impots={impots}
        provinces={provinces}
        processing={processing}
        loadingImpotsProvinces={loadingImpotsProvinces}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedTaux(null);
          setFormData({ nom: '', valeur: '', description: '', est_par_defaut: false });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedTaux(null);
        }}
        onAttributionClose={() => {
          setShowAttributionModal(false);
          setSelectedTaux(null);
          setAttributionFormData({ province_id: '', impot_id: '', actif: true });
        }}
        onDefautClose={() => {
          setShowDefautModal(false);
          setSelectedTaux(null);
          setDefautFormData({ impot_id: '' });
        }}
        onFormDataChange={setFormData}
        onAttributionFormDataChange={setAttributionFormData}
        onDefautFormDataChange={setDefautFormData}
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
              description: formData.description,
              est_par_defaut: formData.est_par_defaut
            });
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Taux ajouté avec succès');
              setFormData({ nom: '', valeur: '', description: '', est_par_defaut: false });
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
              description: formData.description,
              est_par_defaut: formData.est_par_defaut
            });
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Taux modifié avec succès');
              setShowEditModal(false);
              setSelectedTaux(null);
              setFormData({ nom: '', valeur: '', description: '', est_par_defaut: false });
              
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
        onAttribuerTaux={handleAttribuerTaux}
        onDefinirTauxDefaut={handleDefinirTauxDefaut}
      />
    </div>
  );
}