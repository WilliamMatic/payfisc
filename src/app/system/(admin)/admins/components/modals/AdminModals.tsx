import Portal from '../../../components/Portal';
import AddAdminModal from './AddAdminModal';
import EditAdminModal from './EditAdminModal';
import DeleteAdminModal from './DeleteAdminModal';
import StatusAdminModal from './StatusAdminModal';
import PasswordAdminModal from './PasswordAdminModal';
import { Admin as AdminType, Province as ProvinceType } from '@/services/admins/adminService';

interface AdminModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showPasswordModal: boolean;
  selectedAdmin: AdminType | null;
  provinces: ProvinceType[];
  formData: { 
    nom_complet: string; 
    email: string; 
    telephone: string; 
    role: 'super' | 'partenaire';
    province_id: number;
  };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onPasswordClose: () => void;
  onFormDataChange: (data: { 
    nom_complet: string; 
    email: string; 
    telephone: string; 
    role: 'super' | 'partenaire';
    province_id: number;
  }) => void;
  onAddAdmin: () => Promise<void>;
  onEditAdmin: () => Promise<void>;
  onDeleteAdmin: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
  onResetPassword: () => Promise<void>;
}

export default function AdminModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showPasswordModal,
  selectedAdmin,
  provinces,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onPasswordClose,
  onFormDataChange,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
  onToggleStatus,
  onResetPassword
}: AdminModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddAdminModal
            formData={formData}
            provinces={provinces}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddAdmin={onAddAdmin}
          />
        </Portal>
      )}

      {showEditModal && selectedAdmin && (
        <Portal>
          <EditAdminModal
            admin={selectedAdmin}
            formData={formData}
            provinces={provinces}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditAdmin={onEditAdmin}
          />
        </Portal>
      )}

      {showDeleteModal && selectedAdmin && (
        <Portal>
          <DeleteAdminModal
            admin={selectedAdmin}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteAdmin={onDeleteAdmin}
          />
        </Portal>
      )}

      {showStatusModal && selectedAdmin && (
        <Portal>
          <StatusAdminModal
            admin={selectedAdmin}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showPasswordModal && selectedAdmin && (
        <Portal>
          <PasswordAdminModal
            admin={selectedAdmin}
            processing={processing}
            onClose={onPasswordClose}
            onResetPassword={onResetPassword}
          />
        </Portal>
      )}
    </>
  );
}