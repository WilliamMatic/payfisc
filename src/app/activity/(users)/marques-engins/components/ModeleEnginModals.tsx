import Portal from '../../components/Portal';
import AddModeleModal from './modals/AddModeleModal';
import ModelesListModal from './modals/ModelesListModal';
import { MarqueEngin as MarqueEnginType, ModeleEngin as ModeleEnginType } from '@/services/marques-engins/marqueEnginService';

interface ModeleEnginModalsProps {
  showAddModeleModal: boolean;
  showModelesModal: boolean;
  selectedMarque: MarqueEnginType | null;
  modeles: ModeleEnginType[];
  modeleFormData: { libelle: string; description: string; marque_engin_id: number };
  processing: boolean;
  onAddModeleClose: () => void;
  onModelesClose: () => void;
  onModeleFormDataChange: (data: { libelle: string; description: string; marque_engin_id: number }) => void;
  onAddModele: () => Promise<void>;
  onReloadModeles: () => Promise<void>;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function ModeleEnginModals({
  showAddModeleModal,
  showModelesModal,
  selectedMarque,
  modeles,
  modeleFormData,
  processing,
  onAddModeleClose,
  onModelesClose,
  onModeleFormDataChange,
  onAddModele,
  onReloadModeles,
  onError,
  onSuccess
}: ModeleEnginModalsProps) {
  return (
    <>
      {showAddModeleModal && selectedMarque && (
        <Portal>
          <AddModeleModal
            marque={selectedMarque}
            formData={modeleFormData}
            processing={processing}
            onClose={onAddModeleClose}
            onFormDataChange={onModeleFormDataChange}
            onAddModele={onAddModele}
          />
        </Portal>
      )}

      {showModelesModal && selectedMarque && (
        <Portal>
          <ModelesListModal
            marque={selectedMarque}
            modeles={modeles}
            processing={processing}
            onClose={onModelesClose}
            onReloadModeles={onReloadModeles}
            onError={onError}
            onSuccess={onSuccess}
          />
        </Portal>
      )}
    </>
  );
}