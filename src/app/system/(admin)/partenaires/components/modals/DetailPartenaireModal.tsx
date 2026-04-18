import { X, Landmark, Copy, Check } from 'lucide-react';
import { Partenaire as PartenaireType, getPartenaireDetail } from '@/services/banques/partenaireService';
import { useState, useEffect } from 'react';

interface DetailPartenaireModalProps {
  partenaire: PartenaireType;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  banque: 'Banque',
  fintech: 'Fintech',
  institution_financiere: 'Institution Financière',
  operateur_mobile: 'Opérateur Mobile',
};

export default function DetailPartenaireModal({ partenaire, onClose }: DetailPartenaireModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const result = await getPartenaireDetail(partenaire.id);
        if (result.status === 'success') {
          setDetail(result.data);
        }
      } catch {
        // Fallback to basic data
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [partenaire.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '-';
    return key.substring(0, 12) + '••••••••••••' + key.substring(key.length - 8);
  };

  const data = detail || partenaire;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Détails du partenaire</h3>
              <p className="text-sm text-gray-500">{data.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Informations générales */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Informations générales</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Nom" value={data.nom} />
                <InfoRow label="Type" value={typeLabels[data.type_partenaire] || data.type_partenaire} />
                <InfoRow label="Code Banque" value={data.code_banque} />
                <InfoRow label="Code SWIFT" value={data.code_swift} />
                <InfoRow label="Raison Sociale" value={data.raison_sociale} span2 />
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Coordonnées</h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Pays" value={data.pays} />
                <InfoRow label="Ville" value={data.ville} />
                <InfoRow label="Adresse" value={data.adresse} span2 />
                <InfoRow label="Téléphone" value={data.telephone} />
                <InfoRow label="Email" value={data.email} />
                <InfoRow label="Site Web" value={data.site_web} />
                <InfoRow label="Contact" value={data.contact_principal} />
              </div>
            </div>

            {/* Identifiants API */}
            {detail && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Identifiants API</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500">Bank ID</p>
                      <code className="text-sm font-mono text-gray-800">{detail.bank_id || '-'}</code>
                    </div>
                    {detail.bank_id && (
                      <button
                        onClick={() => copyToClipboard(detail.bank_id, 'bank_id')}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copiedField === 'bank_id' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500">API Key</p>
                      <code className="text-sm font-mono text-gray-800">{maskApiKey(detail.api_key)}</code>
                    </div>
                    {detail.api_key && (
                      <button
                        onClick={() => copyToClipboard(detail.api_key, 'api_key')}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        {copiedField === 'api_key' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Limites & Statistiques */}
            {detail && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Limites & Statistiques</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Limite Journalière" value={Number(detail.limite_transaction_journaliere || 0).toLocaleString('en-US') + ' $'} />
                  <InfoRow label="Limite Mensuelle" value={Number(detail.limite_transaction_mensuelle || 0).toLocaleString('en-US') + ' $'} />
                  <InfoRow label="Montant Min" value={Number(detail.montant_minimum || 0).toLocaleString('en-US') + ' $'} />
                  <InfoRow label="Montant Max" value={Number(detail.montant_maximum || 0).toLocaleString('en-US') + ' $'} />
                  <InfoRow label="Total Transactions" value={String(detail.total_transactions || 0)} />
                  <InfoRow label="Total Montant" value={Number(detail.total_montant || 0).toLocaleString('en-US') + ' $'} />
                  <InfoRow label="Dernier Accès" value={detail.dernier_acces || 'Jamais'} />
                  <InfoRow label="Expiration" value={detail.date_expiration || 'Non définie'} />
                </div>
              </div>
            )}

            {/* Sécurité & Maintenance */}
            {detail && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Sécurité & Maintenance</h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="URL de base API" value={detail.base_url_api} span2 />
                  <InfoRow label="Timeout API" value={detail.timeout_api ? detail.timeout_api + 's' : '30s'} />
                  <InfoRow label="Tentatives de retry" value={String(detail.retry_attempts ?? 3)} />
                  <InfoRow label="IP Whitelist" value={formatJsonArray(detail.ip_whitelist)} span2 />
                  <InfoRow label="IP Autorisées" value={formatJsonArray(detail.ip_autorisees)} span2 />
                  <InfoRow label="User Agents Autorisés" value={formatJsonArray(detail.user_agent_autorises)} span2 />
                </div>
              </div>
            )}

            {/* Statut */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Statut</h4>
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  data.actif ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {data.actif ? 'Actif' : 'Inactif'}
                </span>
                {data.en_maintenance && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                    En Maintenance
                  </span>
                )}
                {detail?.suspendu && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                    Suspendu
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, span2 }: { label: string; value?: string | null; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 font-medium whitespace-pre-line">{value || '-'}</p>
    </div>
  );
}

function formatJsonArray(val: string | null | undefined): string {
  if (!val) return '-';
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr) && arr.length > 0) return arr.join('\n');
    return '-';
  } catch {
    return val;
  }
}
