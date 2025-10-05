// src/app/system/(admin)/particuliers/components/modals/EditParticulierModal.tsx
import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Particulier as ParticulierType } from '@/services/particuliers/particulierService';

interface EditParticulierModalProps {
  particulier: ParticulierType;
  formData: {
    nom: string; prenom: string; date_naissance: string; lieu_naissance: string; sexe: string;
    rue: string; ville: string; code_postal: string; province: string;
    id_national: string; telephone: string; email: string;
    nif: string; situation_familiale: string; dependants: number;
  };
  processing: boolean;
  provinces: string[];
  situationsFamiliales: string[];
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onEditParticulier: () => Promise<void>;
  isFormValid: () => boolean; // Ajout de la prop de validation
}

export default function EditParticulierModal({
  particulier,
  formData,
  processing,
  provinces,
  situationsFamiliales,
  onClose,
  onFormDataChange,
  onEditParticulier,
  isFormValid
}: EditParticulierModalProps) {
  
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

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
              <h3 className="text-lg font-semibold text-gray-800">Modifier le Contribuable</h3>
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
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: KABANGU"
                disabled={processing}
              />
            </div>
            
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: Jean"
                disabled={processing}
              />
            </div>
            
            {/* Date de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_naissance}
                onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              />
            </div>
            
            {/* Lieu de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu de naissance
              </label>
              <input
                type="text"
                value={formData.lieu_naissance}
                onChange={(e) => handleInputChange('lieu_naissance', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: Kinshasa"
                disabled={processing}
              />
            </div>
            
            {/* Sexe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexe
              </label>
              <select
                value={formData.sexe}
                onChange={(e) => handleInputChange('sexe', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              >
                <option value="">Sélectionner</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>
            
            {/* NIF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleInputChange('nif', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: A-1234567-X"
                disabled={processing}
              />
            </div>
            
            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="text"
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: +243 81 234 5678"
                disabled={processing}
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="exemple@email.cd"
                disabled={processing}
              />
            </div>
            
            {/* ID National */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID National
              </label>
              <input
                type="text"
                value={formData.id_national}
                onChange={(e) => handleInputChange('id_national', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: 01-2345-67890"
                disabled={processing}
              />
            </div>
            
            {/* Situation familiale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Situation familiale
              </label>
              <select
                value={formData.situation_familiale}
                onChange={(e) => handleInputChange('situation_familiale', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              >
                <option value="">Sélectionner</option>
                {situationsFamiliales.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            {/* Dépendants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dépendants
              </label>
              <input
                type="number"
                value={formData.dependants}
                onChange={(e) => handleInputChange('dependants', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                min="0"
                disabled={processing}
              />
            </div>
            
            {/* Rue */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rue
              </label>
              <input
                type="text"
                value={formData.rue}
                onChange={(e) => handleInputChange('rue', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Nom de la rue et numéro"
                disabled={processing}
              />
            </div>
            
            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => handleInputChange('ville', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: Kinshasa"
                disabled={processing}
              />
            </div>
            
            {/* Code Postal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Postal
              </label>
              <input
                type="text"
                value={formData.code_postal}
                onChange={(e) => handleInputChange('code_postal', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                placeholder="Ex: 00000"
                disabled={processing}
              />
            </div>
            
            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <select
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                disabled={processing}
              >
                <option value="">Sélectionner une province</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
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
              onClick={onEditParticulier}
              disabled={!isFormValid() || processing}
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