import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Admin as AdminType, Province as ProvinceType } from '@/services/admins/adminService';

interface EditAdminModalProps {
  admin: AdminType;
  formData: { 
    nom_complet: string; 
    email: string; 
    telephone: string; 
    role: 'super' | 'partenaire';
    province_id: number;
  };
  provinces: ProvinceType[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { 
    nom_complet: string; 
    email: string; 
    telephone: string; 
    role: 'super' | 'partenaire';
    province_id: number;
  }) => void;
  onEditAdmin: () => Promise<void>;
}

export default function EditAdminModal({
  admin,
  formData,
  provinces,
  processing,
  onClose,
  onFormDataChange,
  onEditAdmin
}: EditAdminModalProps) {
  const handleRoleChange = (role: 'super' | 'partenaire') => {
    onFormDataChange({
      ...formData,
      role,
      province_id: role === 'super' ? 0 : formData.province_id
    });
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
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier l'Administrateur</h3>
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
        
        {/* CORPS DE LA MODALE */}
        <div className="p-5">
          <div className="space-y-4">
            {/* CHAMP NOM COMPLET */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_complet}
                onChange={(e) => onFormDataChange({...formData, nom_complet: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: John Doe"
                disabled={processing}
              />
            </div>

            {/* CHAMP EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({...formData, email: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: john.doe@example.com"
                disabled={processing}
              />
            </div>

            {/* CHAMP TÉLÉPHONE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => onFormDataChange({...formData, telephone: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: +243 81 234 5678"
                disabled={processing}
              />
            </div>

            {/* CHAMP RÔLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange('partenaire')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.role === 'partenaire'
                      ? 'border-[#2D5B7A] bg-[#2D5B7A] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={processing}
                >
                  <div className="text-sm font-medium">Partenaire</div>
                  <div className="text-xs opacity-80 mt-1">Accès limité</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('super')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.role === 'super'
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={processing}
                >
                  <div className="text-sm font-medium">Super Admin</div>
                  <div className="text-xs opacity-80 mt-1">Accès complet</div>
                </button>
              </div>
            </div>

            {/* CHAMP PROVINCE (seulement pour partenaire) */}
            {formData.role === 'partenaire' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.province_id}
                  onChange={(e) => onFormDataChange({...formData, province_id: parseInt(e.target.value)})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  disabled={processing}
                >
                  <option value={0}>Sélectionner une province</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            )}
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
              onClick={onEditAdmin}
              disabled={
                !formData.nom_complet.trim() || 
                !formData.email.trim() || 
                !formData.role || 
                (formData.role === 'partenaire' && !formData.province_id) ||
                processing
              }
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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