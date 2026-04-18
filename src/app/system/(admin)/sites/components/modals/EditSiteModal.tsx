import { Edit, X, Save, Loader2, Printer, Upload, Trash2 } from 'lucide-react';
import { Site as SiteType, Province as ProvinceType } from '@/services/sites/siteService';
import { useState, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

interface EditSiteModalProps {
  site: SiteType;
  formData: { nom: string; code: string; description: string; formule: string; template_carte_actuel: boolean; province_id: number };
  provinces: ProvinceType[];
  processing: boolean;
  logoFile: File | null;
  onLogoFileChange: (file: File | null) => void;
  onClose: () => void;
  onFormDataChange: (data: { nom: string; code: string; description: string; formule: string; template_carte_actuel: boolean; province_id: number }) => void;
  onEditSite: () => Promise<void>;
}

export default function EditSiteModal({
  site,
  formData,
  provinces,
  processing,
  logoFile,
  onLogoFileChange,
  onClose,
  onFormDataChange,
  onEditSite
}: EditSiteModalProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLogoUrl = site.logo ? `${API_BASE_URL}/sites/uploads/${site.logo}` : null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 2 Mo.');
        return;
      }
      onLogoFileChange(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    onLogoFileChange(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <h3 className="text-lg font-semibold text-gray-800">Modifier le Site</h3>
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
            {/* LIGNE NOM ET CODE EN 6-6 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CHAMP NOM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du site <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => onFormDataChange({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: Site A"
                  disabled={processing}
                />
              </div>
              
              {/* CHAMP CODE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => onFormDataChange({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: SA"
                  maxLength={10}
                  disabled={processing}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 10 caractères</p>
              </div>
            </div>
            
            {/* CHAMP PROVINCE */}
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
            
            {/* CHAMP DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                placeholder="Description du site (optionnel)"
                disabled={processing}
              />
            </div>

            {/* CHAMP FORMULE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formule
              </label>
              <input
                type="text"
                value={formData.formule}
                onChange={(e) => onFormDataChange({...formData, formule: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: Formule de calcul (optionnel)"
                disabled={processing}
              />
            </div>

            {/* CHECKBOX TEMPLATE CARTE ACTUEL */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="template_carte_actuel_edit"
                checked={formData.template_carte_actuel}
                onChange={(e) => onFormDataChange({...formData, template_carte_actuel: e.target.checked})}
                className="w-4 h-4 text-[#2D5B7A] border-gray-300 rounded focus:ring-[#2D5B7A]/30 cursor-pointer"
                disabled={processing}
              />
              <label htmlFor="template_carte_actuel_edit" className="flex items-center space-x-2 cursor-pointer select-none">
                <Printer className="w-4 h-4 text-[#2D5B7A]" />
                <span className="text-sm font-medium text-gray-700">Template carte actuel</span>
              </label>
            </div>

            {/* UPLOAD / MODIFIER LOGO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo du site
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
                disabled={processing}
              />
              {logoPreview ? (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img src={logoPreview} alt="Nouveau logo" className="w-12 h-12 object-contain rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 truncate">{logoFile?.name}</p>
                    <p className="text-xs text-green-600">Nouveau logo sélectionné</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={processing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : currentLogoUrl ? (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img src={currentLogoUrl} alt="Logo actuel" className="w-12 h-12 object-contain rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Logo actuel</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Changer le logo"
                    disabled={processing}
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#2D5B7A] hover:text-[#2D5B7A] transition-colors"
                  disabled={processing}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Ajouter un logo (optionnel)</span>
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP ou SVG. Max 2 Mo.</p>
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
              onClick={onEditSite}
              disabled={!formData.nom.trim() || !formData.code.trim() || !formData.province_id || processing}
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