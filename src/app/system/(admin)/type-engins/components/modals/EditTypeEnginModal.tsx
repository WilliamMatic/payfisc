// app/type-engins/components/modals/EditTypeEnginModal.tsx
import { X, Save } from 'lucide-react';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface EditTypeEnginModalProps {
  typeEngin: TypeEnginType;
  formData: { libelle: string; description: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { libelle: string; description: string }) => void;
  onEditTypeEngin: () => Promise<void>;
}

export default function EditTypeEnginModal({
  typeEngin,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditTypeEngin
}: EditTypeEnginModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditTypeEngin();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Modifier le Type d'Engin</h3>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="edit-libelle" className="block text-sm font-medium text-gray-700 mb-2">
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-libelle"
                value={formData.libelle}
                onChange={(e) => onFormDataChange({ ...formData, libelle: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
                placeholder="Ex: Moto, Véhicule, Camion..."
                required
                maxLength={100}
                disabled={processing}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 100 caractères</p>
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] resize-none"
                placeholder="Description du type d'engin (optionnel)"
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.libelle.trim()}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{processing ? 'Modification...' : 'Modifier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}