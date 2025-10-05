import Portal from '../../components/Portal';
import AddUtilisateurModal from './modals/AddUtilisateurModal';
import EditUtilisateurModal from './modals/EditUtilisateurModal';
import DeleteUtilisateurModal from './modals/DeleteUtilisateurModal';
import StatusUtilisateurModal from './modals/StatusUtilisateurModal';
import { Utilisateur as UtilisateurType, Site } from '@/services/utilisateurs/utilisateurService';

interface UtilisateurModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedUtilisateur: UtilisateurType | null;
  formData: { nom_complet: string; telephone: string; adresse: string; site_affecte_id: number };
  sites: Site[];
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom_complet: string; telephone: string; adresse: string; site_affecte_id: number }) => void;
  onAddUtilisateur: () => Promise<void>;
  onEditUtilisateur: () => Promise<void>;
  onDeleteUtilisateur: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function UtilisateurModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedUtilisateur,
  formData,
  sites,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddUtilisateur,
  onEditUtilisateur,
  onDeleteUtilisateur,
  onToggleStatus
}: UtilisateurModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddUtilisateurModal
            formData={formData}
            sites={sites}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddUtilisateur={onAddUtilisateur}
          />
        </Portal>
      )}

      {showEditModal && selectedUtilisateur && (
        <Portal>
          <EditUtilisateurModal
            utilisateur={selectedUtilisateur}
            formData={formData}
            sites={sites}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditUtilisateur={onEditUtilisateur}
          />
        </Portal>
      )}

      {showDeleteModal && selectedUtilisateur && (
        <Portal>
          <DeleteUtilisateurModal
            utilisateur={selectedUtilisateur}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteUtilisateur={onDeleteUtilisateur}
          />
        </Portal>
      )}

      {showStatusModal && selectedUtilisateur && (
        <Portal>
          <StatusUtilisateurModal
            utilisateur={selectedUtilisateur}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}