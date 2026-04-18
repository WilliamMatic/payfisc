import Portal from '../../components/Portal';
import AddPartenaireModal from './modals/AddPartenaireModal';
import EditPartenaireModal from './modals/EditPartenaireModal';
import DeletePartenaireModal from './modals/DeletePartenaireModal';
import StatusPartenaireModal from './modals/StatusPartenaireModal';
import DetailPartenaireModal from './modals/DetailPartenaireModal';
import { Partenaire as PartenaireType } from '@/services/banques/partenaireService';

interface PartenaireFormData {
  type_partenaire: 'banque' | 'fintech' | 'institution_financiere' | 'operateur_mobile';
  nom: string;
  code_banque: string;
  code_swift: string;
  pays: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  contact_principal: string;
  raison_sociale: string;
  limite_transaction_journaliere: string;
  limite_transaction_mensuelle: string;
  montant_minimum: string;
  montant_maximum: string;
  url_webhook_confirmation: string;
  url_webhook_annulation: string;
  date_expiration: string;
  en_maintenance: string;
  base_url_api: string;
  timeout_api: string;
  retry_attempts: string;
  ip_whitelist: string;
  ip_autorisees: string;
  user_agent_autorises: string;
}

interface PartenaireModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showDetailModal: boolean;
  selectedPartenaire: PartenaireType | null;
  formData: PartenaireFormData;
  processing: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onDetailClose: () => void;
  onFormDataChange: (data: PartenaireFormData) => void;
  onAddPartenaire: () => Promise<void>;
  onEditPartenaire: () => Promise<void>;
  onDeletePartenaire: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function PartenaireModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showDetailModal,
  selectedPartenaire,
  formData,
  processing,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onDetailClose,
  onFormDataChange,
  onAddPartenaire,
  onEditPartenaire,
  onDeletePartenaire,
  onToggleStatus,
}: PartenaireModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddPartenaireModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddPartenaire={onAddPartenaire}
          />
        </Portal>
      )}

      {showEditModal && selectedPartenaire && (
        <Portal>
          <EditPartenaireModal
            partenaire={selectedPartenaire}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditPartenaire={onEditPartenaire}
          />
        </Portal>
      )}

      {showDeleteModal && selectedPartenaire && (
        <Portal>
          <DeletePartenaireModal
            partenaire={selectedPartenaire}
            processing={processing}
            onClose={onDeleteClose}
            onDeletePartenaire={onDeletePartenaire}
          />
        </Portal>
      )}

      {showStatusModal && selectedPartenaire && (
        <Portal>
          <StatusPartenaireModal
            partenaire={selectedPartenaire}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showDetailModal && selectedPartenaire && (
        <Portal>
          <DetailPartenaireModal
            partenaire={selectedPartenaire}
            onClose={onDetailClose}
          />
        </Portal>
      )}
    </>
  );
}
