import Portal from '../../components/Portal';
import EditImpotModal from './modals/EditImpotModal';
import DeleteImpotModal from './modals/DeleteImpotModal';
import StatusImpotModal from './modals/StatusImpotModal';
import DetailsImpotModal from './modals/DetailsImpotModal';
import QRCodeModal from './modals/QRCodeModal';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface ImpotsModalsProps {
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showDetailsModal: boolean;
  showQRModal: boolean;
  selectedImpot: ImpotType | null;
  formData: { nom: string; description: string; jsonData: string };
  processing: boolean;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onDetailsClose: () => void;
  onQRClose: () => void;
  onFormDataChange: (data: { nom: string; description: string; jsonData: string }) => void;
  onEditImpot: () => Promise<void>;
  onDeleteImpot: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function ImpotsModals({
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showDetailsModal,
  showQRModal,
  selectedImpot,
  formData,
  processing,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onDetailsClose,
  onQRClose,
  onFormDataChange,
  onEditImpot,
  onDeleteImpot,
  onToggleStatus
}: ImpotsModalsProps) {
  return (
    <>
      {showEditModal && selectedImpot && (
        <Portal>
          <EditImpotModal
            impot={selectedImpot}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditImpot={onEditImpot}
          />
        </Portal>
      )}

      {showDeleteModal && selectedImpot && (
        <Portal>
          <DeleteImpotModal
            impot={selectedImpot}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteImpot={onDeleteImpot}
          />
        </Portal>
      )}

      {showStatusModal && selectedImpot && (
        <Portal>
          <StatusImpotModal
            impot={selectedImpot}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showDetailsModal && selectedImpot && (
        <Portal>
          <DetailsImpotModal
            impot={selectedImpot}
            onClose={onDetailsClose}
          />
        </Portal>
      )}

      {showQRModal && selectedImpot && (
        <Portal>
          <QRCodeModal
            impot={selectedImpot}
            onClose={onQRClose}
          />
        </Portal>
      )}
    </>
  );
}