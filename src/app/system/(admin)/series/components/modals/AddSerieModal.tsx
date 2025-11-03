import { Plus, X, Save, Loader2 } from 'lucide-react';

interface AddSerieModalProps {
  formData: { 
    nom_serie: string; 
    description: string;
  };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { 
    nom_serie: string; 
    description: string;
  }) => void;
  onAddSerie: () => Promise<void>;
}

export default function AddSerieModal({
  formData,
  processing,
  onClose,
  onFormDataChange,
  onAddSerie
}: AddSerieModalProps) {
  const handleNomSerieChange = (value: string) => {
    // Convertir en majuscules et limiter à 2 caractères
    const uppercaseValue = value.toUpperCase().slice(0, 2);
    onFormDataChange({ ...formData, nom_serie: uppercaseValue });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle Série</h3>
              <p className="text-sm text-gray-500">Ajouter une nouvelle série de plaques</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* CORPS DE LA MODALE */}
        <div className="p-5">
          <div className="space-y-4">
            {/* CHAMP NOM SÉRIE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la série <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_serie}
                onChange={(e) => handleNomSerieChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors text-center text-lg font-bold uppercase"
                placeholder="AA"
                maxLength={2}
                disabled={processing}
              />
              <p className="text-xs text-gray-500 mt-1">
                2 lettres majuscules (ex: AA, AB, AC, etc.)
              </p>
            </div>

            {/* CHAMP DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                placeholder="Description optionnelle de la série..."
                rows={3}
                disabled={processing}
              />
            </div>

            {/* MESSAGE INFO GÉNÉRATION */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                <strong>Information :</strong> 999 plaques (de 001 à 999) seront automatiquement générées pour cette série.
              </p>
            </div>
          </div>
          
          {/* PIED DE PAGE */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onAddSerie}
              disabled={!formData.nom_serie.trim() || formData.nom_serie.length !== 2 || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Créer la série'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}