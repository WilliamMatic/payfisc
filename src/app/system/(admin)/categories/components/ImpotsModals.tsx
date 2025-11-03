import Portal from '../../components/Portal';
import EditImpotModal from './modals/EditImpotModal';
import DeleteImpotModal from './modals/DeleteImpotModal';
import StatusImpotModal from './modals/StatusImpotModal';
import DetailsImpotModal from './modals/DetailsImpotModal';
import QRCodeModal from './modals/QRCodeModal';
import BeneficiairesImpotModal from './modals/BeneficiairesImpotModal';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface ImpotsModalsProps {
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showDetailsModal: boolean;
  showQRModal: boolean;
  showBeneficiairesModal?: boolean;
  selectedImpot: ImpotType | null;
  formData: { nom: string; description: string; jsonData: string };
  processing: boolean;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onDetailsClose: () => void;
  onQRClose: () => void;
  onBeneficiairesClose?: () => void;
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
  showBeneficiairesModal = false,
  selectedImpot,
  formData,
  processing,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onDetailsClose,
  onQRClose,
  onBeneficiairesClose = () => {},
  onFormDataChange,
  onEditImpot,
  onDeleteImpot,
  onToggleStatus
}: ImpotsModalsProps) {
  return (
    <>
      {/* Modal d'édition */}
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

      {/* Modal de suppression */}
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

      {/* Modal de changement de statut */}
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

      {/* Modal de détails */}
      {showDetailsModal && selectedImpot && (
        <Portal>
          <DetailsImpotModal
            impot={selectedImpot}
            onClose={onDetailsClose}
          />
        </Portal>
      )}

      {/* Modal QR Code */}
      {showQRModal && selectedImpot && (
        <Portal>
          <QRCodeModal
            impot={selectedImpot}
            onClose={onQRClose}
          />
        </Portal>
      )}

      {/* NOUVEAU Modal de gestion des bénéficiaires */}
      {showBeneficiairesModal && selectedImpot && (
        <Portal>
          <BeneficiairesImpotModal
            impot={selectedImpot}
            onClose={onBeneficiairesClose}
          />
        </Portal>
      )}
    </>
  );
}