import Portal from '../../components/Portal';
import AddProvinceModal from './modals/AddProvinceModal';
import EditProvinceModal from './modals/EditProvinceModal';
import DeleteProvinceModal from './modals/DeleteProvinceModal';
import StatusProvinceModal from './modals/StatusProvinceModal';
import { Province as ProvinceType } from '@/services/provinces/provinceService';

interface ProvinceModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedProvince: ProvinceType | null;
  formData: { nom: string; code: string; description: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; code: string; description: string }) => void;
  onAddProvince: () => Promise<void>;
  onEditProvince: () => Promise<void>;
  onDeleteProvince: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function ProvinceModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedProvince,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddProvince,
  onEditProvince,
  onDeleteProvince,
  onToggleStatus
}: ProvinceModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddProvinceModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddProvince={onAddProvince}
          />
        </Portal>
      )}

      {showEditModal && selectedProvince && (
        <Portal>
          <EditProvinceModal
            province={selectedProvince}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditProvince={onEditProvince}
          />
        </Portal>
      )}

      {showDeleteModal && selectedProvince && (
        <Portal>
          <DeleteProvinceModal
            province={selectedProvince}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteProvince={onDeleteProvince}
          />
        </Portal>
      )}

      {showStatusModal && selectedProvince && (
        <Portal>
          <StatusProvinceModal
            province={selectedProvince}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}