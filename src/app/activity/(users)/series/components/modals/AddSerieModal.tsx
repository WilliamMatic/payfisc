import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getProvinces, Province } from '@/services/plaques/plaqueService';

interface AddSerieModalProps {
  formData: {
    nom_serie: string;
    description: string;
    province_id: string;
    debut_numeros: string;
    fin_numeros: string;
  };
  processing: boolean;
  utilisateur: any;
  onClose: () => void;
  onFormDataChange: (data: {
    nom_serie: string;
    description: string;
    province_id: string;
    debut_numeros: string;
    fin_numeros: string;
  }) => void;
  onAddSerie: () => Promise<void>;
}

export default function AddSerieModal({
  formData,
  processing,
  utilisateur,
  onClose,
  onFormDataChange,
  onAddSerie
}: AddSerieModalProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const result = await getProvinces();
        if (result.status === 'success') {
          setProvinces(result.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSerie();
  };

  // Déterminer la province par défaut (celle de l'utilisateur)
  useEffect(() => {
    if (utilisateur && provinces.length > 0) {
      // Ici vous devriez avoir la province_id de l'utilisateur
      // Pour l'instant, on prend la première province disponible
      const provinceUtilisateur = provinces[0];
      if (provinceUtilisateur && !formData.province_id) {
        handleInputChange('province_id', provinceUtilisateur.id.toString());
      }
    }
  }, [utilisateur, provinces]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Nouvelle Série</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            disabled={processing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom de la série */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nom de la série <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom_serie}
              onChange={(e) => handleInputChange('nom_serie', e.target.value.toUpperCase())}
              placeholder="Ex: AB"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              maxLength={2}
              pattern="[A-Z]{2}"
              title="2 lettres majuscules"
              required
              disabled={processing}
            />
            <p className="text-gray-500 text-xs mt-2">2 lettres majuscules uniquement</p>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Province <span className="text-red-500">*</span>
            </label>
            {loadingProvinces ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement des provinces...</span>
              </div>
            ) : (
              <select
                value={formData.province_id}
                onChange={(e) => handleInputChange('province_id', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                disabled={processing}
              >
                <option value="">Sélectionner une province</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.nom} ({province.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Plage de numéros */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Début <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.debut_numeros}
                onChange={(e) => handleInputChange('debut_numeros', e.target.value)}
                placeholder="1"
                min="1"
                max="999"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                disabled={processing}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.fin_numeros}
                onChange={(e) => handleInputChange('fin_numeros', e.target.value)}
                placeholder="999"
                min="1"
                max="999"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                disabled={processing}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description optionnelle de la série..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              disabled={processing}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.nom_serie || !formData.province_id || !formData.debut_numeros || !formData.fin_numeros}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                'Créer la série'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}