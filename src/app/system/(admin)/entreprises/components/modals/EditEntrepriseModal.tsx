import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Entreprise as EntrepriseType } from '@/services/entreprises/entrepriseService';

interface EditEntrepriseModalProps {
  entreprise: EntrepriseType;
  formData: {
    raison_sociale: string;
    forme_juridique: string;
    nif: string;
    registre_commerce: string;
    date_creation: string;
    adresse_siege: string;
    telephone: string;
    email: string;
    representant_legal: string;
  };
  processing: boolean;
  formesJuridiques: string[];
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onEditEntreprise: () => Promise<void>;
}

export default function EditEntrepriseModal({
  entreprise,
  formData,
  processing,
  formesJuridiques,
  onClose,
  onFormDataChange,
  onEditEntreprise
}: EditEntrepriseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="bg-[#153258] p-2 rounded-lg mr-3">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier l'Entreprise</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison Sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.raison_sociale}
                onChange={(e) => onFormDataChange({...formData, raison_sociale: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: SOCIETE EXEMPLE SARL"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forme Juridique
              </label>
              <select
                value={formData.forme_juridique}
                onChange={(e) => onFormDataChange({...formData, forme_juridique: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              >
                <option value="">Sélectionner</option>
                {formesJuridiques.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => onFormDataChange({...formData, nif: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: A-1234567-X"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registre de Commerce <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.registre_commerce}
                onChange={(e) => onFormDataChange({...formData, registre_commerce: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: RC/KIN/12345"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de création
              </label>
              <input
                type="date"
                value={formData.date_creation}
                onChange={(e) => onFormDataChange({...formData, date_creation: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="text"
                value={formData.telephone}
                onChange={(e) => onFormDataChange({...formData, telephone: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: +243 81 234 5678"
                disabled={processing}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du siège
              </label>
              <input
                type="text"
                value={formData.adresse_siege}
                onChange={(e) => onFormDataChange({...formData, adresse_siege: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Adresse complète du siège social"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({...formData, email: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="exemple@societe.cd"
                disabled={processing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Représentant légal
              </label>
              <input
                type="text"
                value={formData.representant_legal}
                onChange={(e) => onFormDataChange({...formData, representant_legal: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Nom complet du représentant"
                disabled={processing}
              />
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
              onClick={onEditEntreprise}
              disabled={!formData.raison_sociale.trim() || !formData.nif.trim() || !formData.registre_commerce.trim() || processing}
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