'use client';
import { useState, useEffect } from 'react';
import { Serie as SerieType } from '@/services/plaques/plaqueServiceSite';
import PlaqueHeader from './PlaqueHeader';
import PlaqueTable from './PlaqueTable';
import PlaqueModals from './modals/PlaqueModals';
import AlertMessage from './AlertMessage';
import { useAuth } from "@/contexts/AuthContext";

interface PlaqueClientProps {
  initialSeries: SerieType[];
  initialError: string | null;
}

export default function PlaqueClient({ initialSeries, initialError }: PlaqueClientProps) {
  const [series, setSeries] = useState<SerieType[]>(initialSeries || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<SerieType | null>(null);
  const [formData, setFormData] = useState({ 
    nom_serie: '', 
    description: '',
    province_id: '',
    debut_numeros: '',
    fin_numeros: ''
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { utilisateur } = useAuth();

  // Fonction pour recharger les séries
  const loadSeries = async () => {
    if (!utilisateur) return;

    try {
      setLoading(true);
      const { getSeries } = await import('@/services/plaques/plaqueServiceSite');
      const result = await getSeries(utilisateur.id);
      
      if (result.status === 'success') {
        setSeries(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des séries');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des séries
  const filteredSeries = series.filter(serie =>
    serie && (
      serie.nom_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (serie.description && serie.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const openEditModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setFormData({
      nom_serie: serie.nom_serie || '',
      description: serie.description || '',
      province_id: serie.province_id.toString(),
      debut_numeros: serie.debut_numeros.toString(),
      fin_numeros: serie.fin_numeros.toString()
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowDeleteModal(true);
  };

  const openStatusModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowStatusModal(true);
  };

  const openItemsModal = (serie: SerieType) => {
    setSelectedSerie(serie);
    setShowItemsModal(true);
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
      
      <PlaqueHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <PlaqueTable
        series={filteredSeries}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onViewItems={openItemsModal}
      />

      <PlaqueModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showItemsModal={showItemsModal}
        selectedSerie={selectedSerie}
        formData={formData}
        processing={processing}
        utilisateur={utilisateur}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedSerie(null);
          setFormData({ 
            nom_serie: '', 
            description: '',
            province_id: '',
            debut_numeros: '',
            fin_numeros: ''
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedSerie(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedSerie(null);
        }}
        onItemsClose={() => {
          setShowItemsModal(false);
          setSelectedSerie(null);
        }}
        onFormDataChange={setFormData}
        onAddSerie={async () => {
          if (!utilisateur) {
            setError('Utilisateur non connecté');
            return;
          }

          if (!formData.nom_serie.trim()) {
            setError('Le nom de la série est obligatoire');
            return;
          }

          if (!/^[A-Z]{2}$/.test(formData.nom_serie)) {
            setError('Le nom de la série doit contenir exactement 2 lettres majuscules');
            return;
          }

          setProcessing(true);
          try {
            const { addSerie } = await import('@/services/plaques/plaqueServiceSite');
            const result = await addSerie({
              nom_serie: formData.nom_serie,
              province_id: parseInt(formData.province_id),
              debut_numeros: parseInt(formData.debut_numeros),
              fin_numeros: parseInt(formData.fin_numeros),
              description: formData.description || undefined
            }, utilisateur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Série ajoutée avec succès');
              setFormData({ 
                nom_serie: '', 
                description: '',
                province_id: '',
                debut_numeros: '',
                fin_numeros: ''
              });
              setShowAddModal(false);
              
              await loadSeries();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de la série');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditSerie={async () => {
          if (!utilisateur || !selectedSerie || !formData.nom_serie.trim()) {
            setError('Données manquantes');
            return;
          }

          if (!/^[A-Z]{2}$/.test(formData.nom_serie)) {
            setError('Le nom de la série doit contenir exactement 2 lettres majuscules');
            return;
          }

          setProcessing(true);
          try {
            const { updateSerie } = await import('@/services/plaques/plaqueServiceSite');
            const result = await updateSerie(selectedSerie.id, {
              nom_serie: formData.nom_serie,
              province_id: parseInt(formData.province_id),
              description: formData.description || undefined
            }, utilisateur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Série modifiée avec succès');
              setShowEditModal(false);
              setSelectedSerie(null);
              setFormData({ 
                nom_serie: '', 
                description: '',
                province_id: '',
                debut_numeros: '',
                fin_numeros: ''
              });
              
              await loadSeries();
            } else {
              setError(result.message || 'Erreur lors de la modification de la série');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteSerie={async () => {
          if (!utilisateur || !selectedSerie) return;

          setProcessing(true);
          try {
            const { deleteSerie } = await import('@/services/plaques/plaqueServiceSite');
            const result = await deleteSerie(selectedSerie.id, utilisateur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Série supprimée avec succès');
              setShowDeleteModal(false);
              setSelectedSerie(null);
              
              await loadSeries();
            } else {
              setError(result.message || 'Erreur lors de la suppression de la série');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!utilisateur || !selectedSerie) return;

          setProcessing(true);
          try {
            const { toggleSerieStatus } = await import('@/services/plaques/plaqueServiceSite');
            const result = await toggleSerieStatus(selectedSerie.id, !selectedSerie.actif, utilisateur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de la série modifié avec succès');
              setShowStatusModal(false);
              setSelectedSerie(null);
              
              await loadSeries();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de la série');
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