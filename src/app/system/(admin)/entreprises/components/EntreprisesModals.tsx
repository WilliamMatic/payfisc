import Portal from '../../components/Portal';
import AddEntrepriseModal from './modals/AddEntrepriseModal';
import EditEntrepriseModal from './modals/EditEntrepriseModal';
import DeleteEntrepriseModal from './modals/DeleteEntrepriseModal';
import StatusEntrepriseModal from './modals/StatusEntrepriseModal';
import ViewEntrepriseModal from './modals/ViewEntrepriseModal';
import { Entreprise as EntrepriseType } from '@/services/entreprises/entrepriseService';

interface EntreprisesModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showViewModal: boolean;
  selectedEntreprise: EntrepriseType | null;
  formData: {
    raison_sociale: string;
    forme_juridique: string;
    nif: string;
    registre_commerce: string;
    date_creation: string;
    adresse_siege: string;
    telephone: string;
    email: string;
    representant_legal: string;
    reduction_type: 'pourcentage' | 'fixe' | null;
    reduction_valeur: number;
  };
  processing: boolean;
  formesJuridiques: string[];
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onViewClose: () => void;
  onFormDataChange: (data: any) => void;
  onAddEntreprise: () => Promise<void>;
  onEditEntreprise: () => Promise<void>;
  onDeleteEntreprise: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function EntreprisesModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showViewModal,
  selectedEntreprise,
  formData,
  processing,
  formesJuridiques,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onViewClose,
  onFormDataChange,
  onAddEntreprise,
  onEditEntreprise,
  onDeleteEntreprise,
  onToggleStatus
}: EntreprisesModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddEntrepriseModal
            formData={formData}
            processing={processing}
            formesJuridiques={formesJuridiques}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddEntreprise={onAddEntreprise}
          />
        </Portal>
      )}

      {showEditModal && selectedEntreprise && (
        <Portal>
          <EditEntrepriseModal
            entreprise={selectedEntreprise}
            formData={formData}
            processing={processing}
            formesJuridiques={formesJuridiques}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditEntreprise={onEditEntreprise}
          />
        </Portal>
      )}

      {showDeleteModal && selectedEntreprise && (
        <Portal>
          <DeleteEntrepriseModal
            entreprise={selectedEntreprise}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteEntreprise={onDeleteEntreprise}
          />
        </Portal>
      )}

      {showStatusModal && selectedEntreprise && (
        <Portal>
          <StatusEntrepriseModal
            entreprise={selectedEntreprise}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showViewModal && selectedEntreprise && (
        <Portal>
          <ViewEntrepriseModal
            entreprise={selectedEntreprise}
            onClose={onViewClose}
          />
        </Portal>
      )}
    </>
  );
}