// src/app/system/(admin)/particuliers/components/modals/AddParticulierModal.tsx
import { Plus, X, Save, Loader2, Percent, DollarSign } from 'lucide-react';

interface AddParticulierModalProps {
  formData: {
    nom: string; 
    prenom: string; 
    date_naissance: string; 
    lieu_naissance: string; 
    sexe: string;
    rue: string; 
    ville: string; 
    code_postal: string; 
    province: string;
    id_national: string; 
    telephone: string; 
    email: string;
    nif: string; 
    situation_familiale: string; 
    dependants: number;
    reduction_type: 'pourcentage' | 'montant_fixe' | null;
    reduction_valeur: number;
  };
  processing: boolean;
  provinces: string[];
  situationsFamiliales: string[];
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onAddParticulier: () => Promise<void>;
}

export default function AddParticulierModal({
  formData,
  processing,
  provinces,
  situationsFamiliales,
  onClose,
  onFormDataChange,
  onAddParticulier
}: AddParticulierModalProps) {
  
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const handleReductionTypeChange = (type: 'pourcentage' | 'montant_fixe' | null) => {
    onFormDataChange({
      ...formData,
      reduction_type: type,
      reduction_valeur: type ? formData.reduction_valeur : 0
    });
  };

  // Validation des champs obligatoires
  const isFormValid = () => {
    return !!(
      formData.nom.trim() && 
      formData.prenom.trim() && 
      formData.telephone.trim() && 
      formData.rue.trim()
    );
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
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Nouveau Contribuable</h3>
              <p className="text-sm text-gray-500">Ajouter un nouveau particulier contribuable</p>
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
          {/* SECTION CHAMPS OBLIGATOIRES - CORRIGÉ */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Informations obligatoires
            </h4>
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
              
              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
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
              
              {/* Rue */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rue <span className="text-red-500">*</span>
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
            </div>
          </div>

          {/* SECTION INFORMATIONS FISCALES - NIF FACULTATIF */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Informations fiscales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NIF - FACULTATIF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIF
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
            </div>
          </div>

          {/* SECTION RÉDUCTION */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Réduction
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type de réduction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de réduction
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reduction-none"
                      name="reduction_type"
                      checked={!formData.reduction_type}
                      onChange={() => handleReductionTypeChange(null)}
                      className="text-[#153258] focus:ring-[#153258]"
                      disabled={processing}
                    />
                    <label htmlFor="reduction-none" className="text-sm text-gray-700">
                      Aucune réduction
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reduction-pourcentage"
                      name="reduction_type"
                      checked={formData.reduction_type === 'pourcentage'}
                      onChange={() => handleReductionTypeChange('pourcentage')}
                      className="text-[#153258] focus:ring-[#153258]"
                      disabled={processing}
                    />
                    <label htmlFor="reduction-pourcentage" className="flex items-center text-sm text-gray-700">
                      <Percent className="w-4 h-4 mr-1" />
                      Pourcentage
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="reduction-montant_fixe"
                      name="reduction_type"
                      checked={formData.reduction_type === 'montant_fixe'}
                      onChange={() => handleReductionTypeChange('montant_fixe')}
                      className="text-[#153258] focus:ring-[#153258]"
                      disabled={processing}
                    />
                    <label htmlFor="reduction-montant_fixe" className="flex items-center text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Montant fixe
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Valeur de réduction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur de réduction
                  {formData.reduction_type && <span className="text-red-500"> *</span>}
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={formData.reduction_valeur}
                    onChange={(e) => handleInputChange('reduction_valeur', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors"
                    min="0"
                    step={formData.reduction_type === 'pourcentage' ? "0.1" : "1"}
                    max={formData.reduction_type === 'pourcentage' ? "100" : undefined}
                    disabled={!formData.reduction_type || processing}
                    placeholder={formData.reduction_type === 'pourcentage' ? "Ex: 10" : "Ex: 5000"}
                  />
                  {formData.reduction_type === 'pourcentage' && (
                    <span className="ml-2 text-gray-500">%</span>
                  )}
                  {formData.reduction_type === 'montant_fixe' && (
                    <span className="ml-2 text-gray-500">$</span>
                  )}
                </div>
                {formData.reduction_type === 'pourcentage' && formData.reduction_valeur > 100 && (
                  <p className="text-red-500 text-xs mt-1">Le pourcentage ne peut pas dépasser 100%</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION INFORMATIONS PERSONNELLES */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Informations personnelles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
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
            </div>
          </div>

          {/* SECTION SITUATION FAMILIALE */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Situation familiale
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* SECTION ADRESSE */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
              Adresse
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="md:col-span-2">
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
              onClick={onAddParticulier}
              disabled={!isFormValid() || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Ajouter'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}