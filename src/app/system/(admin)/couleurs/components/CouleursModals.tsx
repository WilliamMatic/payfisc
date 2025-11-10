// app/couleurs/components/CouleursModals.tsx
import Portal from '../../components/Portal';
import AddCouleurModal from './modals/AddCouleurModal';
import EditCouleurModal from './modals/EditCouleurModal';
import DeleteCouleurModal from './modals/DeleteCouleurModal';
import StatusCouleurModal from './modals/StatusCouleurModal';
import { EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';

interface CouleursModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedCouleur: EnginCouleurType | null;
  formData: { nom: string; code_hex: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; code_hex: string }) => void;
  onAddCouleur: () => Promise<void>;
  onEditCouleur: () => Promise<void>;
  onDeleteCouleur: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function CouleursModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedCouleur,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddCouleur,
  onEditCouleur,
  onDeleteCouleur,
  onToggleStatus
}: CouleursModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddCouleurModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddCouleur={onAddCouleur}
          />
        </Portal>
      )}

      {showEditModal && selectedCouleur && (
        <Portal>
          <EditCouleurModal
            couleur={selectedCouleur}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditCouleur={onEditCouleur}
          />
        </Portal>
      )}

      {showDeleteModal && selectedCouleur && (
        <Portal>
          <DeleteCouleurModal
            couleur={selectedCouleur}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteCouleur={onDeleteCouleur}
          />
        </Portal>
      )}

      {showStatusModal && selectedCouleur && (
        <Portal>
          <StatusCouleurModal
            couleur={selectedCouleur}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}