// app/couleurs/components/modals/EditCouleurModal.tsx
import { X, Palette, Loader2 } from 'lucide-react';
import { EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';

interface EditCouleurModalProps {
  couleur: EnginCouleurType;
  formData: { nom: string; code_hex: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { nom: string; code_hex: string }) => void;
  onEditCouleur: () => Promise<void>;
}

const PREDEFINED_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#000000',
  '#FFFFFF', '#808080', '#C0C0C0', '#FFD700', '#4B0082', '#EE82EE'
];

export default function EditCouleurModal({
  couleur,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditCouleur
}: EditCouleurModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditCouleur();
  };

  const handleColorSelect = (color: string) => {
    onFormDataChange({ ...formData, code_hex: color });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Modifier la couleur</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la couleur *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => onFormDataChange({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Rouge, Vert, Bleu..."
              required
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code couleur *
            </label>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: formData.code_hex }}
              />
              <input
                type="text"
                value={formData.code_hex}
                onChange={(e) => onFormDataChange({ ...formData, code_hex: e.target.value.toUpperCase() })}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="#FFFFFF"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                required
                disabled={processing}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Format: #FFFFFF ou #FFF</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Couleurs prédéfinies
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className="w-8 h-8 rounded border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.nom || !formData.code_hex}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{processing ? 'Modification...' : 'Modifier la couleur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}