// app/energies/components/EnergiesModals.tsx
import Portal from '../../components/Portal';
import AddEnergieModal from './modals/AddEnergieModal';
import EditEnergieModal from './modals/EditEnergieModal';
import DeleteEnergieModal from './modals/DeleteEnergieModal';
import StatusEnergieModal from './modals/StatusEnergieModal';
import { Energie as EnergieType } from '@/services/energies/energieService';

interface EnergiesModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedEnergie: EnergieType | null;
  formData: { nom: string; description: string; couleur: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; description: string; couleur: string }) => void;
  onAddEnergie: () => Promise<void>;
  onEditEnergie: () => Promise<void>;
  onDeleteEnergie: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function EnergiesModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedEnergie,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddEnergie,
  onEditEnergie,
  onDeleteEnergie,
  onToggleStatus
}: EnergiesModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddEnergieModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddEnergie={onAddEnergie}
          />
        </Portal>
      )}

      {showEditModal && selectedEnergie && (
        <Portal>
          <EditEnergieModal
            energie={selectedEnergie}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditEnergie={onEditEnergie}
          />
        </Portal>
      )}

      {showDeleteModal && selectedEnergie && (
        <Portal>
          <DeleteEnergieModal
            energie={selectedEnergie}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteEnergie={onDeleteEnergie}
          />
        </Portal>
      )}

      {showStatusModal && selectedEnergie && (
        <Portal>
          <StatusEnergieModal
            energie={selectedEnergie}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}