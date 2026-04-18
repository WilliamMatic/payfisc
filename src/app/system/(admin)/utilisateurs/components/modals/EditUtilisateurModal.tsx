import { Edit, X, Save, Loader2, User, Phone, MapPin, Shield, Car, FileCheck, ShieldCheck, Droplets } from 'lucide-react';
import { useEffect } from 'react';
import { Utilisateur as UtilisateurType, Site, UtilisateurFormData, Privileges, PrivilegesPlaque, PrivilegesVignette, PrivilegesAssurance, PrivilegesAssainissement } from '@/services/utilisateurs/utilisateurService';

interface EditUtilisateurModalProps {
  utilisateur: UtilisateurType;
  formData: UtilisateurFormData;
  sites: Site[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: UtilisateurFormData) => void;
  onPrivilegeChange: (category: keyof Privileges, key: string, value: boolean) => void;
  onEditUtilisateur: () => Promise<void>;
}

export default function EditUtilisateurModal({
  utilisateur,
  formData,
  sites,
  processing,
  onClose,
  onFormDataChange,
  onPrivilegeChange,
  onEditUtilisateur
}: EditUtilisateurModalProps) {
  const plaqueLabelMap: Record<keyof PrivilegesPlaque, string> = {
    simple: 'Assujetti - Vente Directe',
    special: 'Grossiste - Vente en Gros',
    delivrance: 'Délivrance Carte Rose',
    correctionErreur: 'Correction & Reprocessing',
    plaque: 'Kit Complet Premium',
    reproduction: 'Reproduction',
    series: 'Séries',
    autresTaxes: 'Autres Taxes',
  };

  const vignetteLabelMap: Record<keyof PrivilegesVignette, string> = {
    venteDirecte: 'Vente de Vignette',
    delivrance: 'Délivrance Vignette',
    renouvellement: 'Renouvellement Vignette',
  };

  const assuranceLabelMap: Record<keyof PrivilegesAssurance, string> = {
    venteDirecte: 'Souscription Assurance Moto',
    delivrance: 'Délivrance Assurance',
    renouvellement: 'Renouvellement Assurance',
  };

  const assainissementLabelMap: Record<keyof PrivilegesAssainissement, string> = {
    agentTerrain: 'Agent Terrain',
    admin: 'Administrateur',
  };

  // Ajoutez ce useEffect pour s'assurer que le formData est correctement initialisé
  useEffect(() => {
    if (utilisateur && (!formData.site_affecte_id || formData.site_affecte_id === 0)) {
      onFormDataChange({
        ...formData,
        site_affecte_id: utilisateur.site_affecte_id
      });
    }
  }, [utilisateur]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier l'Utilisateur</h3>
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

        {/* Body */}
        <div className="p-5">
          <div className="space-y-6">
            {/* Informations de base */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">Informations de base</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nom Complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Complet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.nom_complet}
                      onChange={(e) =>
                        onFormDataChange({ ...formData, nom_complet: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                      disabled={processing}
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) =>
                        onFormDataChange({ ...formData, telephone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                      disabled={processing}
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={formData.adresse}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, adresse: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Site Affecté */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Affecté <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.site_affecte_id}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      site_affecte_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  disabled={processing}
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Privilèges */}
            <div>
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-[#2D5B7A] mr-2" />
                <h4 className="text-md font-medium text-gray-800">Privilèges d&apos;accès</h4>
              </div>

              {/* Vente Plaque */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="flex items-center mb-3">
                  <Car className="w-4 h-4 text-[#2D5B7A] mr-2" />
                  <h5 className="text-sm font-semibold text-gray-700">Vente Plaque</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(plaqueLabelMap) as Array<keyof PrivilegesPlaque>).map((key) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-privilege-plaque-${key}`}
                        checked={formData.privileges.ventePlaque[key]}
                        onChange={(e) => onPrivilegeChange('ventePlaque', key, e.target.checked)}
                        className="w-4 h-4 text-[#2D5B7A] border-gray-300 rounded focus:ring-[#2D5B7A] focus:ring-2"
                        disabled={processing}
                      />
                      <label htmlFor={`edit-privilege-plaque-${key}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                        {plaqueLabelMap[key]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vignette */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <div className="flex items-center mb-3">
                  <FileCheck className="w-4 h-4 text-[#2D5B7A] mr-2" />
                  <h5 className="text-sm font-semibold text-gray-700">Vignette</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(vignetteLabelMap) as Array<keyof PrivilegesVignette>).map((key) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-privilege-vignette-${key}`}
                        checked={formData.privileges.vignette[key]}
                        onChange={(e) => onPrivilegeChange('vignette', key, e.target.checked)}
                        className="w-4 h-4 text-[#2D5B7A] border-gray-300 rounded focus:ring-[#2D5B7A] focus:ring-2"
                        disabled={processing}
                      />
                      <label htmlFor={`edit-privilege-vignette-${key}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                        {vignetteLabelMap[key]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assurance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#2D5B7A] mr-2" />
                  <h5 className="text-sm font-semibold text-gray-700">Assurance</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(assuranceLabelMap) as Array<keyof PrivilegesAssurance>).map((key) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-privilege-assurance-${key}`}
                        checked={formData.privileges.assurance[key]}
                        onChange={(e) => onPrivilegeChange('assurance', key, e.target.checked)}
                        className="w-4 h-4 text-[#2D5B7A] border-gray-300 rounded focus:ring-[#2D5B7A] focus:ring-2"
                        disabled={processing}
                      />
                      <label htmlFor={`edit-privilege-assurance-${key}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                        {assuranceLabelMap[key]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assainissement */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Droplets className="w-4 h-4 text-cyan-600 mr-2" />
                  <h5 className="text-sm font-semibold text-gray-700">Assainissement</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(assainissementLabelMap) as Array<keyof PrivilegesAssainissement>).map((key) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-privilege-assainissement-${key}`}
                        checked={formData.privileges.assainissement[key]}
                        onChange={(e) => onPrivilegeChange('assainissement', key, e.target.checked)}
                        className="w-4 h-4 text-[#2D5B7A] border-gray-300 rounded focus:ring-[#2D5B7A] focus:ring-2"
                        disabled={processing}
                      />
                      <label htmlFor={`edit-privilege-assainissement-${key}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                        {assainissementLabelMap[key]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - boutons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onEditUtilisateur}
              disabled={
                !formData.nom_complet.trim() ||
                !formData.telephone.trim() ||
                !formData.site_affecte_id ||
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