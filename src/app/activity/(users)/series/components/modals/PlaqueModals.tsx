import Portal from '../../../components/Portal';
import AddSerieModal from './AddSerieModal';
import EditSerieModal from './EditSerieModal';
import DeleteSerieModal from './DeleteSerieModal';
import StatusSerieModal from './StatusSerieModal';
import ItemsSerieModal from './ItemsSerieModal';
import { Serie as SerieType } from '@/services/plaques/plaqueService';

interface PlaqueModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showStatusModal: boolean;
  showItemsModal: boolean;
  selectedSerie: SerieType | null;
  formData: { 
    nom_serie: string; 
    description: string;
    province_id: string;
    debut_numeros: string;
    fin_numeros: string;
  };
  processing: boolean;
  utilisateur: any;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onStatusClose: () => void;
  onItemsClose: () => void;
  onFormDataChange: (data: { 
    nom_serie: string; 
    description: string;
    province_id: string;
    debut_numeros: string;
    fin_numeros: string;
  }) => void;
  onAddSerie: () => Promise<void>;
  onEditSerie: () => Promise<void>;
  onDeleteSerie: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

export default function PlaqueModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showStatusModal,
  showItemsModal,
  selectedSerie,
  formData,
  processing,
  utilisateur,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onStatusClose,
  onItemsClose,
  onFormDataChange,
  onAddSerie,
  onEditSerie,
  onDeleteSerie,
  onToggleStatus
}: PlaqueModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddSerieModal
            formData={formData}
            processing={processing}
            utilisateur={utilisateur}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddSerie={onAddSerie}
          />
        </Portal>
      )}

      {showEditModal && selectedSerie && (
        <Portal>
          <EditSerieModal
            serie={selectedSerie}
            formData={formData}
            processing={processing}
            utilisateur={utilisateur}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditSerie={onEditSerie}
          />
        </Portal>
      )}

      {showDeleteModal && selectedSerie && (
        <Portal>
          <DeleteSerieModal
            serie={selectedSerie}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteSerie={onDeleteSerie}
          />
        </Portal>
      )}

      {showStatusModal && selectedSerie && (
        <Portal>
          <StatusSerieModal
            serie={selectedSerie}
            processing={processing}
            onClose={onStatusClose}
            onToggleStatus={onToggleStatus}
          />
        </Portal>
      )}

      {showItemsModal && selectedSerie && (
        <Portal>
          <ItemsSerieModal
            serie={selectedSerie}
            onClose={onItemsClose}
          />
        </Portal>
      )}
    </>
  );
}