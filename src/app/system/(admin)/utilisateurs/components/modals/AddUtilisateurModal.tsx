import { Plus, X, Save, Loader2, User, Phone, MapPin } from 'lucide-react';
import { Site } from '@/services/utilisateurs/utilisateurService';

interface AddUtilisateurModalProps {
  formData: { nom_complet: string; telephone: string; adresse: string; site_affecte_id: number };
  sites: Site[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { nom_complet: string; telephone: string; adresse: string; site_affecte_id: number }) => void;
  onAddUtilisateur: () => Promise<void>;
}

export default function AddUtilisateurModal({
  formData,
  sites,
  processing,
  onClose,
  onFormDataChange,
  onAddUtilisateur
}: AddUtilisateurModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Nouvel Utilisateur</h3>
              <p className="text-sm text-gray-500">Ajouter un nouvel utilisateur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-5">
          <div className="space-y-4">
            {/* Ligne Nom complet + Téléphone */}
            <div className="grid grid-cols-12 gap-4">
              {/* Nom complet */}
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom Complet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.nom_complet}
                    onChange={(e) => onFormDataChange({ ...formData, nom_complet: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                    placeholder="Ex: Jean Dupont"
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => onFormDataChange({ ...formData, telephone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                    placeholder="Ex: +243 81 234 5678"
                    disabled={processing}
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={formData.adresse}
                  onChange={(e) => onFormDataChange({ ...formData, adresse: e.target.value })}
                  rows={2}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                  placeholder="Ex: 123 Avenue de la Paix, Kinshasa"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Site affecté */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Affecté <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.site_affecte_id}
                onChange={(e) => onFormDataChange({ ...formData, site_affecte_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                disabled={processing}
              >
                <option value={0}>Sélectionner un site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onAddUtilisateur}
              disabled={
                !formData.nom_complet.trim() ||
                !formData.telephone.trim() ||
                !formData.site_affecte_id ||
                formData.site_affecte_id === 0 ||
                processing
              }
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
