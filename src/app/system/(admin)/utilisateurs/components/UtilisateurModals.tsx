import Portal from '../../components/Portal';
import AddUtilisateurModal from './modals/AddUtilisateurModal';
import EditUtilisateurModal from './modals/EditUtilisateurModal';
import DeleteUtilisateurModal from './modals/DeleteUtilisateurModal';
import StatusUtilisateurModal from './modals/StatusUtilisateurModal';
import { Utilisateur as UtilisateurType, Site, UtilisateurFormData, Privileges } from '@/services/utilisateurs/utilisateurService';

interface UtilisateurModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedUtilisateur: UtilisateurType | null;
  formData: UtilisateurFormData;
  sites: Site[];
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: UtilisateurFormData) => void;
  onPrivilegeChange: (privilege: keyof Privileges, value: boolean) => void;
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
  onPrivilegeChange,
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
            onPrivilegeChange={onPrivilegeChange}
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
            onPrivilegeChange={onPrivilegeChange}
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