import Portal from '../../components/Portal';
import AddMarqueModal from './modals/AddMarqueModal';
import EditMarqueModal from './modals/EditMarqueModal';
import DeleteMarqueModal from './modals/DeleteMarqueModal';
import StatusMarqueModal from './modals/StatusMarqueModal';
import { MarqueEngin as MarqueEnginType } from '@/services/marques-engins/marqueEnginService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface MarqueEnginModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedMarque: MarqueEnginType | null;
  typeEngins: TypeEnginType[];
  formData: { libelle: string; description: string; type_engin_id: number };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { libelle: string; description: string; type_engin_id: number }) => void;
  onAddMarque: () => Promise<void>;
  onEditMarque: () => Promise<void>;
  onDeleteMarque: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function MarqueEnginModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedMarque,
  typeEngins,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddMarque,
  onEditMarque,
  onDeleteMarque,
  onToggleStatus
}: MarqueEnginModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddMarqueModal
            formData={formData}
            typeEngins={typeEngins}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddMarque={onAddMarque}
          />
        </Portal>
      )}

      {showEditModal && selectedMarque && (
        <Portal>
          <EditMarqueModal
            marque={selectedMarque}
            formData={formData}
            typeEngins={typeEngins}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditMarque={onEditMarque}
          />
        </Portal>
      )}

      {showDeleteModal && selectedMarque && (
        <Portal>
          <DeleteMarqueModal
            marque={selectedMarque}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteMarque={onDeleteMarque}
          />
        </Portal>
      )}

      {showStatusModal && selectedMarque && (
        <Portal>
          <StatusMarqueModal
            marque={selectedMarque}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}