import Portal from '../../components/Portal';
import AddSiteModal from './modals/AddSiteModal';
import EditSiteModal from './modals/EditSiteModal';
import DeleteSiteModal from './modals/DeleteSiteModal';
import StatusSiteModal from './modals/StatusSiteModal';
import { Site as SiteType, Province as ProvinceType } from '@/services/sites/siteService';

interface SiteModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  selectedSite: SiteType | null;
  provinces: ProvinceType[];
  formData: { nom: string; code: string; description: string; formule: string; province_id: number };
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onFormDataChange: (data: { nom: string; code: string; description: string; formule: string; province_id: number }) => void;
  onAddSite: () => Promise<void>;
  onEditSite: () => Promise<void>;
  onDeleteSite: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function SiteModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  selectedSite,
  provinces,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onFormDataChange,
  onAddSite,
  onEditSite,
  onDeleteSite,
  onToggleStatus
}: SiteModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddSiteModal
            formData={formData}
            provinces={provinces}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddSite={onAddSite}
          />
        </Portal>
      )}

      {showEditModal && selectedSite && (
        <Portal>
          <EditSiteModal
            site={selectedSite}
            formData={formData}
            provinces={provinces}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditSite={onEditSite}
          />
        </Portal>
      )}

      {showDeleteModal && selectedSite && (
        <Portal>
          <DeleteSiteModal
            site={selectedSite}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteSite={onDeleteSite}
          />
        </Portal>
      )}

      {showStatusModal && selectedSite && (
        <Portal>
          <StatusSiteModal
            site={selectedSite}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}
    </>
  );
}