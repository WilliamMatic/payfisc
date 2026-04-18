import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Partenaire as PartenaireType } from '@/services/banques/partenaireService';

interface PartenaireFormData {
  type_partenaire: 'banque' | 'fintech' | 'institution_financiere' | 'operateur_mobile';
  nom: string;
  code_banque: string;
  code_swift: string;
  pays: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  contact_principal: string;
  raison_sociale: string;
  limite_transaction_journaliere: string;
  limite_transaction_mensuelle: string;
  montant_minimum: string;
  montant_maximum: string;
  url_webhook_confirmation: string;
  url_webhook_annulation: string;
  date_expiration: string;
  en_maintenance: string;
  base_url_api: string;
  timeout_api: string;
  retry_attempts: string;
  ip_whitelist: string;
  ip_autorisees: string;
  user_agent_autorises: string;
}

interface EditPartenaireModalProps {
  partenaire: PartenaireType;
  formData: PartenaireFormData;
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: PartenaireFormData) => void;
  onEditPartenaire: () => Promise<void>;
}

export default function EditPartenaireModal({
  partenaire,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditPartenaire,
}: EditPartenaireModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier le partenaire</h3>
              <p className="text-sm text-gray-500">{partenaire.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Informations générales */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Informations générales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type_partenaire}
                  onChange={(e) => onFormDataChange({ ...formData, type_partenaire: e.target.value as PartenaireFormData['type_partenaire'] })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                >
                  <option value="banque">Banque</option>
                  <option value="fintech">Fintech</option>
                  <option value="institution_financiere">Institution Financière</option>
                  <option value="operateur_mobile">Opérateur Mobile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => onFormDataChange({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Banque</label>
                <input
                  type="text"
                  value={formData.code_banque}
                  onChange={(e) => onFormDataChange({ ...formData, code_banque: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code SWIFT</label>
                <input
                  type="text"
                  value={formData.code_swift}
                  onChange={(e) => onFormDataChange({ ...formData, code_swift: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  maxLength={11}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison Sociale</label>
                <input
                  type="text"
                  value={formData.raison_sociale}
                  onChange={(e) => onFormDataChange({ ...formData, raison_sociale: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Coordonnées</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                <input type="text" value={formData.pays} onChange={(e) => onFormDataChange({ ...formData, pays: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input type="text" value={formData.ville} onChange={(e) => onFormDataChange({ ...formData, ville: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={formData.adresse} onChange={(e) => onFormDataChange({ ...formData, adresse: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="text" value={formData.telephone} onChange={(e) => onFormDataChange({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label>
                <input type="text" value={formData.site_web} onChange={(e) => onFormDataChange({ ...formData, site_web: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Principal</label>
                <input type="text" value={formData.contact_principal} onChange={(e) => onFormDataChange({ ...formData, contact_principal: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
            </div>
          </div>

          {/* Configuration API */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Configuration API</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Journalière ($)</label>
                <input type="number" value={formData.limite_transaction_journaliere} onChange={(e) => onFormDataChange({ ...formData, limite_transaction_journaliere: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Mensuelle ($)</label>
                <input type="number" value={formData.limite_transaction_mensuelle} onChange={(e) => onFormDataChange({ ...formData, limite_transaction_mensuelle: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant Minimum ($)</label>
                <input type="number" value={formData.montant_minimum} onChange={(e) => onFormDataChange({ ...formData, montant_minimum: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant Maximum ($)</label>
                <input type="number" value={formData.montant_maximum} onChange={(e) => onFormDataChange({ ...formData, montant_maximum: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Confirmation</label>
                <input type="text" value={formData.url_webhook_confirmation} onChange={(e) => onFormDataChange({ ...formData, url_webhook_confirmation: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Annulation</label>
                <input type="text" value={formData.url_webhook_annulation} onChange={(e) => onFormDataChange({ ...formData, url_webhook_annulation: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;expiration API</label>
                <input type="datetime-local" value={formData.date_expiration} onChange={(e) => onFormDataChange({ ...formData, date_expiration: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]" />
              </div>
            </div>
          </div>

          {/* Sécurité & Maintenance */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Sécurité & Maintenance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.en_maintenance === '1'}
                    onChange={(e) => onFormDataChange({ ...formData, en_maintenance: e.target.checked ? '1' : '0' })}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">En maintenance</span>
                    <p className="text-xs text-gray-500">Active le mode maintenance pour ce partenaire</p>
                  </div>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de base API</label>
                <input type="text" value={formData.base_url_api} onChange={(e) => onFormDataChange({ ...formData, base_url_api: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  placeholder="https://api.partenaire.com/v1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeout API (secondes)</label>
                <input type="number" value={formData.timeout_api} onChange={(e) => onFormDataChange({ ...formData, timeout_api: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  min="1" max="120" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tentatives de retry</label>
                <input type="number" value={formData.retry_attempts} onChange={(e) => onFormDataChange({ ...formData, retry_attempts: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  min="0" max="10" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist (partenaire)</label>
                <textarea value={formData.ip_whitelist} onChange={(e) => onFormDataChange({ ...formData, ip_whitelist: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  placeholder="Une IP par ligne" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Autorisées (API)</label>
                <textarea value={formData.ip_autorisees} onChange={(e) => onFormDataChange({ ...formData, ip_autorisees: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  placeholder="Une IP par ligne" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">User Agents Autorisés</label>
                <textarea value={formData.user_agent_autorises} onChange={(e) => onFormDataChange({ ...formData, user_agent_autorises: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  placeholder="Un user agent par ligne" rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium" disabled={processing}>
            Annuler
          </button>
          <button
            onClick={onEditPartenaire}
            disabled={!formData.nom.trim() || processing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{processing ? 'Modification...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
