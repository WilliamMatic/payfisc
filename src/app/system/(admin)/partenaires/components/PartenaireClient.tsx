'use client';
import { useState, useEffect } from 'react';
import { Partenaire as PartenaireType, getPartenaires } from '@/services/banques/partenaireService';
import PartenaireHeader from './PartenaireHeader';
import PartenaireTable from './PartenaireTable';
import PartenaireModals from './PartenaireModals';
import AlertMessage from './AlertMessage';

interface PartenaireClientProps {
  initialPartenaires: PartenaireType[];
  initialError: string | null;
}

export default function PartenaireClient({ initialPartenaires, initialError }: PartenaireClientProps) {
  const [partenaires, setPartenaires] = useState<PartenaireType[]>(initialPartenaires || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartenaire, setSelectedPartenaire] = useState<PartenaireType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type_partenaire: 'banque' as 'banque' | 'fintech' | 'institution_financiere' | 'operateur_mobile',
    nom: '',
    code_banque: '',
    code_swift: '',
    pays: '',
    ville: '',
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    contact_principal: '',
    raison_sociale: '',
    limite_transaction_journaliere: '10000000',
    limite_transaction_mensuelle: '100000000',
    montant_minimum: '100',
    montant_maximum: '5000000',
    url_webhook_confirmation: '',
    url_webhook_annulation: '',
    date_expiration: '',
    en_maintenance: '0',
    base_url_api: '',
    timeout_api: '30',
    retry_attempts: '3',
    ip_whitelist: '',
    ip_autorisees: '',
    user_agent_autorises: '',
  });

  const resetFormData = () => {
    setFormData({
      type_partenaire: 'banque',
      nom: '',
      code_banque: '',
      code_swift: '',
      pays: '',
      ville: '',
      adresse: '',
      telephone: '',
      email: '',
      site_web: '',
      contact_principal: '',
      raison_sociale: '',
      limite_transaction_journaliere: '10000000',
      limite_transaction_mensuelle: '100000000',
      montant_minimum: '100',
      montant_maximum: '5000000',
      url_webhook_confirmation: '',
      url_webhook_annulation: '',
      date_expiration: '',
      en_maintenance: '0',
      base_url_api: '',
      timeout_api: '30',
      retry_attempts: '3',
      ip_whitelist: '',
      ip_autorisees: '',
      user_agent_autorises: '',
    });
  };

  const loadPartenaires = async () => {
    try {
      setLoading(true);
      const result = await getPartenaires();
      if (result.status === 'success') {
        setPartenaires(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Erreur lors du chargement');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const filteredPartenaires = partenaires.filter(p => {
    if (!p) return false;
    const matchSearch =
      (p.nom && p.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.code_banque && p.code_banque.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.bank_id && p.bank_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = !filterType || p.type_partenaire === filterType;
    return matchSearch && matchType;
  });

  const openEditModal = (partenaire: PartenaireType) => {
    setSelectedPartenaire(partenaire);
    setFormData({
      type_partenaire: partenaire.type_partenaire,
      nom: partenaire.nom || '',
      code_banque: partenaire.code_banque || '',
      code_swift: partenaire.code_swift || '',
      pays: partenaire.pays || '',
      ville: partenaire.ville || '',
      adresse: partenaire.adresse || '',
      telephone: partenaire.telephone || '',
      email: partenaire.email || '',
      site_web: partenaire.site_web || '',
      contact_principal: partenaire.contact_principal || '',
      raison_sociale: partenaire.raison_sociale || '',
      limite_transaction_journaliere: '10000000',
      limite_transaction_mensuelle: '100000000',
      montant_minimum: '100',
      montant_maximum: '5000000',
      url_webhook_confirmation: '',
      url_webhook_annulation: '',
      date_expiration: '',
      en_maintenance: partenaire.en_maintenance ? '1' : '0',
      base_url_api: (partenaire as any).base_url_api || '',
      timeout_api: String((partenaire as any).timeout_api || 30),
      retry_attempts: String((partenaire as any).retry_attempts || 3),
      ip_whitelist: (partenaire as any).ip_whitelist || '',
      ip_autorisees: '',
      user_agent_autorises: '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (partenaire: PartenaireType) => {
    setSelectedPartenaire(partenaire);
    setShowDeleteModal(true);
  };

  const openStatusModal = (partenaire: PartenaireType) => {
    setSelectedPartenaire(partenaire);
    setShowStatusModal(true);
  };

  const openDetailModal = (partenaire: PartenaireType) => {
    setSelectedPartenaire(partenaire);
    setShowDetailModal(true);
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

      <PartenaireHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
        onAddClick={() => {
          resetFormData();
          setShowAddModal(true);
        }}
      />

      <PartenaireTable
        partenaires={filteredPartenaires}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onToggleStatus={openStatusModal}
        onDetail={openDetailModal}
      />

      <PartenaireModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        showStatusModal={showStatusModal}
        showDetailModal={showDetailModal}
        selectedPartenaire={selectedPartenaire}
        formData={formData}
        processing={processing}
        onAddClose={() => { setShowAddModal(false); resetFormData(); }}
        onEditClose={() => { setShowEditModal(false); setSelectedPartenaire(null); resetFormData(); }}
        onDeleteClose={() => { setShowDeleteModal(false); setSelectedPartenaire(null); }}
        onStatusClose={() => { setShowStatusModal(false); setSelectedPartenaire(null); }}
        onDetailClose={() => { setShowDetailModal(false); setSelectedPartenaire(null); }}
        onFormDataChange={setFormData}
        onAddPartenaire={async () => {
          if (!formData.nom || !formData.type_partenaire) {
            setError('Le nom et le type sont obligatoires');
            return;
          }
          setProcessing(true);
          try {
            const { addPartenaire } = await import('@/services/banques/partenaireService');
            const result = await addPartenaire(formData);
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Partenaire ajouté avec succès');
              setShowAddModal(false);
              resetFormData();
              await loadPartenaires();
            } else {
              setError(result.message || "Erreur lors de l'ajout");
            }
          } catch { setError('Erreur de connexion au serveur'); }
          finally { setProcessing(false); }
        }}
        onEditPartenaire={async () => {
          if (!selectedPartenaire || !formData.nom || !formData.type_partenaire) {
            setError('Le nom et le type sont obligatoires');
            return;
          }
          setProcessing(true);
          try {
            const { updatePartenaire } = await import('@/services/banques/partenaireService');
            const result = await updatePartenaire(selectedPartenaire.id, formData);
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Partenaire modifié avec succès');
              setShowEditModal(false);
              setSelectedPartenaire(null);
              resetFormData();
              await loadPartenaires();
            } else {
              setError(result.message || 'Erreur lors de la modification');
            }
          } catch { setError('Erreur de connexion au serveur'); }
          finally { setProcessing(false); }
        }}
        onDeletePartenaire={async () => {
          if (!selectedPartenaire) return;
          setProcessing(true);
          try {
            const { deletePartenaire } = await import('@/services/banques/partenaireService');
            const result = await deletePartenaire(selectedPartenaire.id);
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Partenaire supprimé avec succès');
              setShowDeleteModal(false);
              setSelectedPartenaire(null);
              await loadPartenaires();
            } else {
              setError(result.message || 'Erreur lors de la suppression');
            }
          } catch { setError('Erreur de connexion au serveur'); }
          finally { setProcessing(false); }
        }}
        onToggleStatus={async () => {
          if (!selectedPartenaire) return;
          setProcessing(true);
          try {
            const { togglePartenaireStatus } = await import('@/services/banques/partenaireService');
            const result = await togglePartenaireStatus(selectedPartenaire.id, !selectedPartenaire.actif);
            if (result.status === 'success') {
              setSuccessMessage(result.message || 'Statut modifié avec succès');
              setShowStatusModal(false);
              setSelectedPartenaire(null);
              await loadPartenaires();
            } else {
              setError(result.message || 'Erreur lors du changement de statut');
            }
          } catch { setError('Erreur de connexion au serveur'); }
          finally { setProcessing(false); }
        }}
      />
    </div>
  );
}
