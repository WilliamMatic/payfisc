import { X } from 'lucide-react';
import { Province } from '@/services/plaques/plaqueServiceSite';

interface AddSerieModalProps {
  formData: {
    nom_serie: string;
    province_id: string;
    debut_numeros: number;
    fin_numeros: number;
    description: string;
  };
  provinces: Province[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onAddSerie: () => Promise<void>;
}

export default function AddSerieModal({
  formData,
  provinces,
  processing,
  onClose,
  onFormDataChange,
  onAddSerie
}: AddSerieModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSerie();
  };

  const handleChange = (field: string, value: string | number) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const totalNumeros = formData.fin_numeros - formData.debut_numeros + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Nouvelle Série</h2>
            <p className="text-gray-500 text-sm mt-1">Ajouter une nouvelle série de plaques</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Série et Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la série <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_serie}
                onChange={(e) => handleChange('nom_serie', e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                placeholder="Ex: AB"
                maxLength={2}
                required
                disabled={processing}
              />
              <p className="text-xs text-gray-500 mt-1">2 lettres majuscules uniquement</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.province_id}
                onChange={(e) => handleChange('province_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                required
                disabled={processing}
              >
                <option value="">Sélectionnez une province</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.nom} ({province.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plage Numérique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plage Numérique <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début</label>
                <input
                  type="number"
                  min="1"
                  max="998"
                  value={formData.debut_numeros}
                  onChange={(e) => handleChange('debut_numeros', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  required
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input
                  type="number"
                  min="2"
                  max="999"
                  value={formData.fin_numeros}
                  onChange={(e) => handleChange('fin_numeros', parseInt(e.target.value) || 999)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  required
                  disabled={processing}
                />
              </div>
              <div className="flex items-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center w-full">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-lg font-semibold text-gray-800">{totalNumeros} numéros</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Plage valide: 1-999. Exemple: 1-999 créera 999 numéros
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] resize-none"
              placeholder="Description optionnelle de la série..."
              disabled={processing}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.nom_serie || !formData.province_id}
              className="px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Création...' : 'Créer la Série'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}