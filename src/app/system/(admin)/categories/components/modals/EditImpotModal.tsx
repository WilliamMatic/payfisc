import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface EditImpotModalProps {
  impot: ImpotType;
  formData: { nom: string; description: string; jsonData: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { nom: string; description: string; jsonData: string }) => void;
  onEditImpot: () => Promise<void>;
}

export default function EditImpotModal({
  impot,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditImpot
}: EditImpotModalProps) {

  // Fonction pour parser et mettre à jour le JSON avec le prix
  const handleJsonDataChange = (newJsonData: string) => {
    try {
      const jsonObj = JSON.parse(newJsonData);
      // S'assurer que le prix est inclus dans le JSON
      if (typeof jsonObj.prix === 'undefined') {
        jsonObj.prix = impot.prix || 0.00;
      }
      onFormDataChange({...formData, jsonData: JSON.stringify(jsonObj, null, 2)});
    } catch (e) {
      // Si le JSON est invalide, on garde la valeur telle quelle
      onFormDataChange({...formData, jsonData: newJsonData});
    }
  };

  // Récupérer le prix depuis le JSON pour l'affichage
  const getCurrentPrix = () => {
    try {
      const jsonObj = JSON.parse(formData.jsonData);
      return jsonObj.prix || 0.00;
    } catch (e) {
      return 0.00;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#153258] p-2 rounded-lg mr-3">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier l'Impôt</h3>
              <p className="text-sm text-gray-500">Mettre à jour les informations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'impôt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => onFormDataChange({...formData, nom: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: Impôt foncier"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors resize-none"
                placeholder="Description de l'impôt"
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (en $) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={getCurrentPrix()}
                  onChange={(e) => {
                    const newPrix = parseFloat(e.target.value) || 0;
                    try {
                      const jsonObj = JSON.parse(formData.jsonData);
                      jsonObj.prix = newPrix;
                      onFormDataChange({...formData, jsonData: JSON.stringify(jsonObj, null, 2)});
                    } catch (e) {
                      // Si le JSON est invalide, on crée un nouvel objet
                      const newJsonObj = {
                        periode: impot.periode || 'annuel',
                        delaiAccord: impot.delai_accord || 0,
                        penalites: impot.penalites || { type: 'aucune', valeur: 0 },
                        prix: newPrix
                      };
                      onFormDataChange({...formData, jsonData: JSON.stringify(newJsonObj, null, 2)});
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                  placeholder="0.00"
                  disabled={processing}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Données JSON <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.jsonData}
                onChange={(e) => handleJsonDataChange(e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors resize-none font-mono text-sm"
                placeholder='{"periode": "annuel", "delaiAccord": 30, "penalites": {"type": "pourcentage", "valeur": 5}, "prix": 100.00}'
                disabled={processing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format JSON contenant la période, le délai d'accord, les pénalités et le prix
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onEditImpot}
              disabled={!formData.nom.trim() || !formData.description.trim() || !formData.jsonData.trim() || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Enregistrement...' : 'Modifier'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}