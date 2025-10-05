import Portal from '../../components/Portal';
import AddTauxModal from './modals/AddTauxModal';
import EditTauxModal from './modals/EditTauxModal';
import DeleteTauxModal from './modals/DeleteTauxModal';
import StatusTauxModal from './modals/StatusTauxModal';
import { Taux as TauxType } from '@/services/taux/tauxService';

interface TauxModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedTaux: TauxType | null;
  formData: { nom: string; valeur: string; description: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; valeur: string; description: string }) => void;
  onAddTaux: () => Promise<void>;
  onEditTaux: () => Promise<void>;
  onDeleteTaux: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function TauxModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedTaux,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddTaux,
  onEditTaux,
  onDeleteTaux,
  onToggleStatus
}: TauxModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddTauxModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddTaux={onAddTaux}
          />
        </Portal>
      )}

      {showEditModal && selectedTaux && (
        <Portal>
          <EditTauxModal
            taux={selectedTaux}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditTaux={onEditTaux}
          />
        </Portal>
      )}

      {showDeleteModal && selectedTaux && (
        <Portal>
          <DeleteTauxModal
            taux={selectedTaux}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteTaux={onDeleteTaux}
          />
        </Portal>
      )}

      {showStatusModal && selectedTaux && (
        <Portal>
          <StatusTauxModal
            taux={selectedTaux}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}