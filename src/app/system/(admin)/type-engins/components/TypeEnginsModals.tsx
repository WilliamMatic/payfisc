// app/type-engins/components/TypeEnginsModals.tsx
import Portal from '../../components/Portal';
import AddTypeEnginModal from './modals/AddTypeEnginModal';
import EditTypeEnginModal from './modals/EditTypeEnginModal';
import DeleteTypeEnginModal from './modals/DeleteTypeEnginModal';
import StatusTypeEnginModal from './modals/StatusTypeEnginModal';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface TypeEnginsModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedTypeEngin: TypeEnginType | null;
  formData: { libelle: string; description: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { libelle: string; description: string }) => void;
  onAddTypeEngin: () => Promise<void>;
  onEditTypeEngin: () => Promise<void>;
  onDeleteTypeEngin: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function TypeEnginsModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedTypeEngin,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddTypeEngin,
  onEditTypeEngin,
  onDeleteTypeEngin,
  onToggleStatus
}: TypeEnginsModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddTypeEnginModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddTypeEngin={onAddTypeEngin}
          />
        </Portal>
      )}

      {showEditModal && selectedTypeEngin && (
        <Portal>
          <EditTypeEnginModal
            typeEngin={selectedTypeEngin}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditTypeEngin={onEditTypeEngin}
          />
        </Portal>
      )}

      {showDeleteModal && selectedTypeEngin && (
        <Portal>
          <DeleteTypeEnginModal
            typeEngin={selectedTypeEngin}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteTypeEngin={onDeleteTypeEngin}
          />
        </Portal>
      )}

      {showStatusModal && selectedTypeEngin && (
        <Portal>
          <StatusTypeEnginModal
            typeEngin={selectedTypeEngin}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}