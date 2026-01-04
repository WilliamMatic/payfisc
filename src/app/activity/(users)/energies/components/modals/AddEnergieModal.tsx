// app/energies/components/modals/AddEnergieModal.tsx
import { X, Zap } from 'lucide-react';

interface AddEnergieModalProps {
  formData: { nom: string; description: string; couleur: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { nom: string; description: string; couleur: string }) => void;
  onAddEnergie: () => Promise<void>;
}

const COLOR_PRESETS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#6B7280', '#84CC16', '#06B6D4', '#F97316'
];

export default function AddEnergieModal({
  formData,
  processing,
  onClose,
  onFormDataChange,
  onAddEnergie
}: AddEnergieModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEnergie();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-[#153258] p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Nouvelle Énergie</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => onFormDataChange({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
              placeholder="Ex: Essence, Diesel, Électrique..."
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] resize-none"
              placeholder="Description optionnelle de l'énergie..."
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Couleur
            </label>
            
            <div className="mb-3">
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-200"
                  style={{ backgroundColor: formData.couleur }}
                ></div>
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => onFormDataChange({ ...formData, couleur: e.target.value })}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
                  placeholder="#6B7280"
                  disabled={processing}
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onFormDataChange({ ...formData, couleur: color })}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  disabled={processing}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.nom.trim()}
              className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {processing ? 'Création...' : 'Créer l\'énergie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}