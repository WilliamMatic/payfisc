// src/app/system/(admin)/particuliers/components/ParticulierModals.tsx
import Portal from "../../components/Portal";
import AddParticulierModal from "./modals/AddParticulierModal";
import EditParticulierModal from "./modals/EditParticulierModal";
import DeleteParticulierModal from "./modals/DeleteParticulierModal";
import StatusParticulierModal from "./modals/StatusParticulierModal";
import ViewParticulierModal from "./modals/ViewParticulierModal";
import { Particulier as ParticulierType } from "@/services/particuliers/particulierService";

interface ParticuliersModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showViewModal: boolean;
  selectedParticulier: ParticulierType | null;
  formData: {
    nom: string;
    prenom: string;
    date_naissance: string;
    lieu_naissance: string;
    sexe: string;
    rue: string;
    ville: string;
    code_postal: string;
    province: string;
    id_national: string;
    telephone: string;
    email: string;
    nif: string;
    situation_familiale: string;
    dependants: number;
    reduction_type: 'pourcentage' | 'montant_fixe' | null;
    reduction_valeur: number;
  };
  processing: boolean;
  provinces: string[];
  situationsFamiliales: string[];
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onViewClose: () => void;
  onFormDataChange: (data: any) => void;
  onAddParticulier: () => Promise<void>;
  onEditParticulier: () => Promise<void>;
  onDeleteParticulier: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
  isFormValid: () => boolean;
}

export default function ParticuliersModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showViewModal,
  selectedParticulier,
  formData,
  processing,
  provinces,
  situationsFamiliales,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onViewClose,
  onFormDataChange,
  onAddParticulier,
  onEditParticulier,
  onDeleteParticulier,
  onToggleStatus,
  isFormValid
}: ParticuliersModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddParticulierModal
            formData={formData}
            processing={processing}
            provinces={provinces}
            situationsFamiliales={situationsFamiliales}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddParticulier={onAddParticulier}
          />
        </Portal>
      )}

      {showEditModal && selectedParticulier && (
        <Portal>
          <EditParticulierModal
            particulier={selectedParticulier}
            formData={formData}
            processing={processing}
            provinces={provinces}
            situationsFamiliales={situationsFamiliales}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditParticulier={onEditParticulier}
            isFormValid={isFormValid}
          />
        </Portal>
      )}

      {showDeleteModal && selectedParticulier && (
        <Portal>
          <DeleteParticulierModal
            particulier={selectedParticulier}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteParticulier={onDeleteParticulier}
          />
        </Portal>
      )}

      {showStatusModal && selectedParticulier && (
        <Portal>
          <StatusParticulierModal
            particulier={selectedParticulier}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showViewModal && selectedParticulier && (
        <Portal>
          <ViewParticulierModal
            particulier={selectedParticulier}
            onClose={onViewClose}
          />
        </Portal>
      )}
    </>
  );
}