import Portal from '../../components/Portal';
import AddBeneficiaireModal from './modals/AddBeneficiaireModal';
import EditBeneficiaireModal from './modals/EditBeneficiaireModal';
import DeleteBeneficiaireModal from './modals/DeleteBeneficiaireModal';
import StatusBeneficiaireModal from './modals/StatusBeneficiaireModal';
import { Beneficiaire as BeneficiaireType } from '@/services/beneficiaires/beneficiaireService';

interface BeneficiaireModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedBeneficiaire: BeneficiaireType | null;
  formData: { nom: string; telephone: string; numero_compte: string };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; telephone: string; numero_compte: string }) => void;
  onAddBeneficiaire: () => Promise<void>;
  onEditBeneficiaire: () => Promise<void>;
  onDeleteBeneficiaire: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function BeneficiaireModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedBeneficiaire,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddBeneficiaire,
  onEditBeneficiaire,
  onDeleteBeneficiaire,
  onToggleStatus
}: BeneficiaireModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddBeneficiaireModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddBeneficiaire={onAddBeneficiaire}
          />
        </Portal>
      )}

      {showEditModal && selectedBeneficiaire && (
        <Portal>
          <EditBeneficiaireModal
            beneficiaire={selectedBeneficiaire}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditBeneficiaire={onEditBeneficiaire}
          />
        </Portal>
      )}

      {showDeleteModal && selectedBeneficiaire && (
        <Portal>
          <DeleteBeneficiaireModal
            beneficiaire={selectedBeneficiaire}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteBeneficiaire={onDeleteBeneficiaire}
          />
        </Portal>
      )}

      {showStatusModal && selectedBeneficiaire && (
        <Portal>
          <StatusBeneficiaireModal
            beneficiaire={selectedBeneficiaire}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}