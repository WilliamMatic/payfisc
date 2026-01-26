import Portal from '../../components/Portal';
import AddTauxModal from './modals/AddTauxModal';
import EditTauxModal from './modals/EditTauxModal';
import DeleteTauxModal from './modals/DeleteTauxModal';
import AttributionTauxModal from './modals/AttributionTauxModal';
import DefautTauxModal from './modals/DefautTauxModal';
import { Taux as TauxType, Impot as ImpotType, Province as ProvinceType } from '@/services/taux/tauxService';

interface TauxModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showAttributionModal: boolean;
  showDefautModal: boolean;
  selectedTaux: TauxType | null;
  formData: { nom: string; valeur: string; description: string; est_par_defaut: boolean };
  attributionFormData: { province_id: string; impot_id: string; actif: boolean };
  defautFormData: { impot_id: string };
  impots: ImpotType[];
  provinces: ProvinceType[];
  processing: boolean;
  loadingImpotsProvinces: boolean;
  onAddClose: () => void;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onAttributionClose: () => void;
  onDefautClose: () => void;
  onFormDataChange: (data: { nom: string; valeur: string; description: string; est_par_defaut: boolean }) => void;
  onAttributionFormDataChange: (data: { province_id: string; impot_id: string; actif: boolean }) => void;
  onDefautFormDataChange: (data: { impot_id: string }) => void;
  onAddTaux: () => Promise<void>;
  onEditTaux: () => Promise<void>;
  onDeleteTaux: () => Promise<void>;
  onAttribuerTaux: () => Promise<void>;
  onDefinirTauxDefaut: () => Promise<void>;
}

export default function TauxModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  showAttributionModal,
  showDefautModal,
  selectedTaux,
  formData,
  attributionFormData,
  defautFormData,
  impots,
  provinces,
  processing,
  loadingImpotsProvinces,
  onAddClose,
  onEditClose,
  onDeleteClose,
  onAttributionClose,
  onDefautClose,
  onFormDataChange,
  onAttributionFormDataChange,
  onDefautFormDataChange,
  onAddTaux,
  onEditTaux,
  onDeleteTaux,
  onAttribuerTaux,
  onDefinirTauxDefaut
}: TauxModalsProps) {
  return (
    <>
      {showAddModal && (
        <Portal>
          <AddTauxModal
            formData={formData}
            processing={processing}
            onClose={onAddClose}
            onFormDataChange={onFormDataChange}
            onAddTaux={onAddTaux}
          />
        </Portal>
      )}

      {showEditModal && selectedTaux && (
        <Portal>
          <EditTauxModal
            taux={selectedTaux}
            formData={formData}
            processing={processing}
            onClose={onEditClose}
            onFormDataChange={onFormDataChange}
            onEditTaux={onEditTaux}
          />
        </Portal>
      )}

      {showDeleteModal && selectedTaux && (
        <Portal>
          <DeleteTauxModal
            taux={selectedTaux}
            processing={processing}
            onClose={onDeleteClose}
            onDeleteTaux={onDeleteTaux}
          />
        </Portal>
      )}

      {showAttributionModal && selectedTaux && (
        <Portal>
          <AttributionTauxModal
            taux={selectedTaux}
            formData={attributionFormData}
            impots={impots}
            provinces={provinces}
            processing={processing}
            loadingImpotsProvinces={loadingImpotsProvinces}
            onClose={onAttributionClose}
            onFormDataChange={onAttributionFormDataChange}
            onAttribuerTaux={onAttribuerTaux}
          />
        </Portal>
      )}

      {showDefautModal && selectedTaux && (
        <Portal>
          <DefautTauxModal
            taux={selectedTaux}
            formData={defautFormData}
            impots={impots}
            processing={processing}
            loadingImpotsProvinces={loadingImpotsProvinces}
            onClose={onDefautClose}
            onFormDataChange={onDefautFormDataChange}
            onDefinirTauxDefaut={onDefinirTauxDefaut}
          />
        </Portal>
      )}
    </>
  );
}