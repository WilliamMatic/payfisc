import Portal from '../../components/Portal';
import AddUsageModal from './modals/AddUsageModal';
import EditUsageModal from './modals/EditUsageModal';
import DeleteUsageModal from './modals/DeleteUsageModal';
import StatusUsageModal from './modals/StatusUsageModal';
import { UsageEngin as UsageEnginType } from '@/services/usages/usageService';

interface UsagesModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedUsage: UsageEnginType | null;
  formData: { code: string; libelle: string; description: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { code: string; libelle: string; description: string }) => void;
  onAddUsage: () => Promise<void>;
  onEditUsage: () => Promise<void>;
  onDeleteUsage: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function UsagesModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedUsage,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddUsage,
  onEditUsage,
  onDeleteUsage,
  onToggleStatus
}: UsagesModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddUsageModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddUsage={onAddUsage}
          />
        </Portal>
      )}

      {showEditModal && selectedUsage && (
        <Portal>
          <EditUsageModal
            usage={selectedUsage}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditUsage={onEditUsage}
          />
        </Portal>
      )}

      {showDeleteModal && selectedUsage && (
        <Portal>
          <DeleteUsageModal
            usage={selectedUsage}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteUsage={onDeleteUsage}
          />
        </Portal>
      )}

      {showStatusModal && selectedUsage && (
        <Portal>
          <StatusUsageModal
            usage={selectedUsage}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}