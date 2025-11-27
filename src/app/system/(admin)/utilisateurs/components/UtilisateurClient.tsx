'use client';
import { useState, useEffect } from 'react';
import { 
  Utilisateur as UtilisateurType, 
  Site,
  UtilisateurFormData,
  Privileges,
  getUtilisateurs,
  getSitesActifs
} from '@/services/utilisateurs/utilisateurService';
import UtilisateurHeader from './UtilisateurHeader';
import UtilisateurTable from './UtilisateurTable';
import UtilisateurModals from './UtilisateurModals';
import AlertMessage from './AlertMessage';

interface UtilisateurClientProps {
  initialUtilisateurs: UtilisateurType[];
  initialSites: Site[];
  initialError: string | null;
}

export default function UtilisateurClient({ 
  initialUtilisateurs, 
  initialSites, 
  initialError 
}: UtilisateurClientProps) {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurType[]>(initialUtilisateurs || []);
  const [sites, setSites] = useState<Site[]>(initialSites || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<UtilisateurType | null>(null);
  const [formData, setFormData] = useState<UtilisateurFormData>({
    nom_complet: '',
    telephone: '',
    adresse: '',
    site_affecte_id: 0,
    privileges: {
      simple: false,
      special: false,
      delivrance: false,
      plaque: false,
      reproduction: false
    }
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour recharger les utilisateurs
  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      const result = await getUtilisateurs();
      
      if (result.status === 'success') {
        setUtilisateurs(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour recharger les sites
  const loadSites = async () => {
    try {
      const result = await getSitesActifs();
      
      if (result.status === 'success') {
        setSites(result.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des sites:', err);
    }
  };

  // Filtrage local des utilisateurs
  const filteredUtilisateurs = utilisateurs.filter(
    (utilisateur) =>
      utilisateur.nom_complet
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      utilisateur.telephone.includes(searchTerm) ||
      utilisateur.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utilisateur.site_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setFormData({
      nom_complet: utilisateur.nom_complet,
      telephone: utilisateur.telephone,
      adresse: utilisateur.adresse,
      site_affecte_id: utilisateur.site_affecte_id,
      privileges: utilisateur.privileges
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setShowDeleteModal(true);
  };

  const openStatusModal = (utilisateur: UtilisateurType) => {
    setSelectedUtilisateur(utilisateur);
    setShowStatusModal(true);
  };

  // Mise à jour des privilèges dans le formData
  const updatePrivilege = (privilege: keyof Privileges, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privileges: {
        ...prev.privileges,
        [privilege]: value
      }
    }));
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
      
      <UtilisateurHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <UtilisateurTable
        utilisateurs={filteredUtilisateurs}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
      />

      <UtilisateurModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        selectedUtilisateur={selectedUtilisateur}
        formData={formData}
        sites={sites}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedUtilisateur(null);
          setFormData({ 
            nom_complet: '', 
            telephone: '', 
            adresse: '', 
            site_affecte_id: 0,
            privileges: {
              simple: false,
              special: false,
              delivrance: false,
              plaque: false,
              reproduction: false
            }
          });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedUtilisateur(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedUtilisateur(null);
        }}
        onFormDataChange={setFormData}
        onPrivilegeChange={updatePrivilege}
        onAddUtilisateur={async () => {
          if (!formData.nom_complet || !formData.telephone || !formData.site_affecte_id || formData.site_affecte_id === 0) {
            setError('Le nom complet, le téléphone et le site sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { addUtilisateur } = await import('@/services/utilisateurs/utilisateurService');
            const result = await addUtilisateur(formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Utilisateur ajouté avec succès');
              setFormData({ 
                nom_complet: '', 
                telephone: '', 
                adresse: '', 
                site_affecte_id: 0,
                privileges: {
                  simple: false,
                  special: false,
                  delivrance: false,
                  plaque: false,
                  reproduction: false
                }
              });
              setShowAddModal(false);
              
              // Recharger la liste complète des utilisateurs
              await loadUtilisateurs();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'utilisateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditUtilisateur={async () => {
          if (!selectedUtilisateur || !formData.nom_complet || !formData.telephone || !formData.site_affecte_id || formData.site_affecte_id === 0) {
            setError('Le nom complet, le téléphone et le site sont obligatoires');
            return;
          }

          setProcessing(true);
          try {
            const { updateUtilisateur } = await import('@/services/utilisateurs/utilisateurService');
            const result = await updateUtilisateur(selectedUtilisateur.id, formData);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Utilisateur modifié avec succès');
              setShowEditModal(false);
              setSelectedUtilisateur(null);
              setFormData({ 
                nom_complet: '', 
                telephone: '', 
                adresse: '', 
                site_affecte_id: 0,
                privileges: {
                  simple: false,
                  special: false,
                  delivrance: false,
                  plaque: false,
                  reproduction: false
                }
              });
              
              // Recharger la liste complète des utilisateurs
              await loadUtilisateurs();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'utilisateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteUtilisateur={async () => {
          if (!selectedUtilisateur) return;

          setProcessing(true);
          try {
            const { deleteUtilisateur } = await import('@/services/utilisateurs/utilisateurService');
            const result = await deleteUtilisateur(selectedUtilisateur.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Utilisateur supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedUtilisateur(null);
              
              // Recharger la liste complète des utilisateurs
              await loadUtilisateurs();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'utilisateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedUtilisateur) return;

          setProcessing(true);
          try {
            const { toggleUtilisateurStatus } = await import('@/services/utilisateurs/utilisateurService');
            const result = await toggleUtilisateurStatus(selectedUtilisateur.id, !selectedUtilisateur.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'utilisateur modifié avec succès');
              setShowStatusModal(false);
              setSelectedUtilisateur(null);
              
              // Recharger la liste complète des utilisateurs
              await loadUtilisateurs();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'utilisateur');
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