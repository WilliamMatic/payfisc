'use client';
import { useState, useEffect } from 'react';
import { Admin as AdminType, Province as ProvinceType } from '@/services/admins/adminService';
import AdminHeader from './AdminHeader';
import AdminTable from './AdminTable';
import AdminModals from './modals/AdminModals';
import AlertMessage from './AlertMessage';

interface AdminClientProps {
  initialAdmins: AdminType[];
  initialProvinces: ProvinceType[];
  initialError: string | null;
}

export default function AdminClient({ initialAdmins, initialProvinces, initialError }: AdminClientProps) {
  const [admins, setAdmins] = useState<AdminType[]>(initialAdmins || []);
  const [provinces, setProvinces] = useState<ProvinceType[]>(initialProvinces || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminType | null>(null);
  const [formData, setFormData] = useState({ 
    nom_complet: '', 
    email: '', 
    telephone: '', 
    role: 'partenaire' as 'super' | 'partenaire',
    province_id: 0
  });
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // Fonction pour recharger les administrateurs
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { getAdmins } = await import('@/services/admins/adminService');
      const result = await getAdmins();
      
      if (result.status === 'success') {
        setAdmins(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement des administrateurs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage local des administrateurs
  const filteredAdmins = admins.filter(admin =>
    admin && (
      admin.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.telephone.includes(searchTerm) ||
      (admin.province_nom && admin.province_nom.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const openEditModal = (admin: AdminType) => {
    setSelectedAdmin(admin);
    setFormData({
      nom_complet: admin.nom_complet || '',
      email: admin.email || '',
      telephone: admin.telephone || '',
      role: admin.role || 'partenaire',
      province_id: admin.province_id || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (admin: AdminType) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const openStatusModal = (admin: AdminType) => {
    setSelectedAdmin(admin);
    setShowStatusModal(true);
  };

  const openPasswordModal = (admin: AdminType) => {
    setSelectedAdmin(admin);
    setShowPasswordModal(true);
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

  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => setPasswordMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  return (
    <div className="h-full flex flex-col">
      <AlertMessage error={error} successMessage={successMessage} passwordMessage={passwordMessage} />
      
      <AdminHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setShowAddModal(true)}
      />

      <AdminTable
        admins={filteredAdmins}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onResetPassword={openPasswordModal}
      />

      <AdminModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showPasswordModal={showPasswordModal}
        selectedAdmin={selectedAdmin}
        provinces={provinces}
        formData={formData}
        processing={processing}
        onAddClose={() => setShowAddModal(false)}
        onEditClose={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
          setFormData({ nom_complet: '', email: '', telephone: '', role: 'partenaire', province_id: 0 });
        }}
        onDeleteClose={() => {
          setShowDeleteModal(false);
          setSelectedAdmin(null);
        }}
        onStatusClose={() => {
          setShowStatusModal(false);
          setSelectedAdmin(null);
        }}
        onPasswordClose={() => {
          setShowPasswordModal(false);
          setSelectedAdmin(null);
          setPasswordMessage(null);
        }}
        onFormDataChange={setFormData}
        onAddAdmin={async () => {
          if (!formData.nom_complet || !formData.email || !formData.role) {
            setError('Le nom complet, l\'email et le rôle sont obligatoires');
            return;
          }

          if (formData.role === 'partenaire' && !formData.province_id) {
            setError('La province est obligatoire pour un administrateur partenaire');
            return;
          }

          setProcessing(true);
          try {
            const { addAdmin } = await import('@/services/admins/adminService');
            const result = await addAdmin({
              ...formData,
              province_id: formData.role === 'partenaire' ? formData.province_id : null
            });
            
            if (result.status === 'success') {
              const message = result.password 
                ? `${result.message} Mot de passe: ${result.password}`
                : result.message || 'Administrateur ajouté avec succès';
              
              setSuccessMessage(message);
              if (result.password) {
                setPasswordMessage(`Nouveau mot de passe généré: ${result.password}`);
              }
              
              setFormData({ nom_complet: '', email: '', telephone: '', role: 'partenaire', province_id: 0 });
              setShowAddModal(false);
              
              await loadAdmins();
            } else {
              setError(result.message || 'Erreur lors de l\'ajout de l\'administrateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onEditAdmin={async () => {
          if (!selectedAdmin || !formData.nom_complet || !formData.email || !formData.role) {
            setError('Le nom complet, l\'email et le rôle sont obligatoires');
            return;
          }

          if (formData.role === 'partenaire' && !formData.province_id) {
            setError('La province est obligatoire pour un administrateur partenaire');
            return;
          }

          setProcessing(true);
          try {
            const { updateAdmin } = await import('@/services/admins/adminService');
            const result = await updateAdmin(selectedAdmin.id, {
              ...formData,
              province_id: formData.role === 'partenaire' ? formData.province_id : null
            });
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Administrateur modifié avec succès');
              setShowEditModal(false);
              setSelectedAdmin(null);
              setFormData({ nom_complet: '', email: '', telephone: '', role: 'partenaire', province_id: 0 });
              
              await loadAdmins();
            } else {
              setError(result.message || 'Erreur lors de la modification de l\'administrateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onDeleteAdmin={async () => {
          if (!selectedAdmin) return;

          setProcessing(true);
          try {
            const { deleteAdmin } = await import('@/services/admins/adminService');
            const result = await deleteAdmin(selectedAdmin.id);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Administrateur supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedAdmin(null);
              
              await loadAdmins();
            } else {
              setError(result.message || 'Erreur lors de la suppression de l\'administrateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onToggleStatus={async () => {
          if (!selectedAdmin) return;

          setProcessing(true);
          try {
            const { toggleAdminStatus } = await import('@/services/admins/adminService');
            const result = await toggleAdminStatus(selectedAdmin.id, !selectedAdmin.actif);
            
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut de l\'administrateur modifié avec succès');
              setShowStatusModal(false);
              setSelectedAdmin(null);
              
              await loadAdmins();
            } else {
              setError(result.message || 'Erreur lors du changement de statut de l\'administrateur');
            }
          } catch (err) {
            setError('Erreur de connexion au serveur');
          } finally {
            setProcessing(false);
          }
        }}
        onResetPassword={async () => {
          if (!selectedAdmin) return;

          setProcessing(true);
          try {
            const { resetAdminPassword } = await import('@/services/admins/adminService');
            const result = await resetAdminPassword(selectedAdmin.id);
            
            if (result.status === 'success') {
              const message = result.password 
                ? `${result.message} Nouveau mot de passe: ${result.password}`
                : result.message || 'Mot de passe réinitialisé avec succès';
              
              setSuccessMessage(message);
              if (result.password) {
                setPasswordMessage(`Nouveau mot de passe généré: ${result.password}`);
              }
              
              setShowPasswordModal(false);
              setSelectedAdmin(null);
              
              await loadAdmins();
            } else {
              setError(result.message || 'Erreur lors de la réinitialisation du mot de passe');
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