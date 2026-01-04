import Portal from '../../components/Portal';
import AddPuissanceFiscaleModal from './modals/AddPuissanceFiscaleModal';
import EditPuissanceFiscaleModal from './modals/EditPuissanceFiscaleModal';
import DeletePuissanceFiscaleModal from './modals/DeletePuissanceFiscaleModal';
import StatusPuissanceFiscaleModal from './modals/StatusPuissanceFiscaleModal';
import { PuissanceFiscale as PuissanceFiscaleType } from '@/services/puissances-fiscales/puissanceFiscaleService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface PuissanceFiscaleModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedPuissance: PuissanceFiscaleType | null;
  typeEngins: TypeEnginType[];
  formData: { libelle: string; valeur: number; description: string; type_engin_id: number };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { libelle: string; valeur: number; description: string; type_engin_id: number }) => void;
  onAddPuissance: () => Promise<void>;
  onEditPuissance: () => Promise<void>;
  onDeletePuissance: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function PuissanceFiscaleModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedPuissance,
  typeEngins,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddPuissance,
  onEditPuissance,
  onDeletePuissance,
  onToggleStatus
}: PuissanceFiscaleModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddPuissanceFiscaleModal
            formData={formData}
            typeEngins={typeEngins}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddPuissance={onAddPuissance}
          />
        </Portal>
      )}

      {showEditModal && selectedPuissance && (
        <Portal>
          <EditPuissanceFiscaleModal
            puissance={selectedPuissance}
            formData={formData}
            typeEngins={typeEngins}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditPuissance={onEditPuissance}
          />
        </Portal>
      )}

      {showDeleteModal && selectedPuissance && (
        <Portal>
          <DeletePuissanceFiscaleModal
            puissance={selectedPuissance}
            processing={processing}
            onClose={onDeleteClose}
            onDeletePuissance={onDeletePuissance}
          />
        </Portal>
      )}

      {showStatusModal && selectedPuissance && (
        <Portal>
          <StatusPuissanceFiscaleModal
            puissance={selectedPuissance}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}