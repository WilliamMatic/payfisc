import { Landmark, Loader2, Edit, Trash2, Eye, EyeOff, Info } from 'lucide-react';
import { Partenaire as PartenaireType } from '@/services/banques/partenaireService';

interface PartenaireTableProps {
  partenaires: PartenaireType[];
  loading: boolean;
  onEdit: (partenaire: PartenaireType) => void;
  onDelete: (partenaire: PartenaireType) => void;
  onToggleStatus: (partenaire: PartenaireType) => void;
  onDetail: (partenaire: PartenaireType) => void;
}

const typeColors: Record<string, string> = {
  banque: 'bg-blue-50 text-blue-700 border-blue-100',
  fintech: 'bg-purple-50 text-purple-700 border-purple-100',
  institution_financiere: 'bg-amber-50 text-amber-700 border-amber-100',
  operateur_mobile: 'bg-green-50 text-green-700 border-green-100',
};

const typeLabels: Record<string, string> = {
  banque: 'Banque',
  fintech: 'Fintech',
  institution_financiere: 'Institution',
  operateur_mobile: 'Mobile Money',
};

export default function PartenaireTable({
  partenaires,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onDetail,
}: PartenaireTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#2D5B7A] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des partenaires...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partenaire</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank ID</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {partenaires.map(
              (partenaire, index) =>
                partenaire && (
                  <tr key={`${partenaire.id}-${index}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {partenaire.logo_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/calls', '')}/${partenaire.logo_url}`}
                            alt={partenaire.nom}
                            className="w-8 h-8 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2D5B7A]/10 flex items-center justify-center mr-3">
                            <Landmark className="w-4 h-4 text-[#2D5B7A]" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{partenaire.nom || 'N/A'}</div>
                          {partenaire.pays && (
                            <div className="text-xs text-gray-400">{partenaire.pays}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeColors[partenaire.type_partenaire] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                        {typeLabels[partenaire.type_partenaire] || partenaire.type_partenaire}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        {partenaire.code_banque || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-600">{partenaire.telephone || '-'}</div>
                      <div className="text-xs text-gray-400">{partenaire.email || '-'}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                        {partenaire.bank_id || '-'}
                      </code>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{partenaire.total_transactions || 0}</div>
                      <div className="text-xs text-gray-400">
                        {Number(partenaire.total_montant || 0).toLocaleString('en-US')} $
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          partenaire.actif
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {partenaire.actif ? 'Actif' : 'Inactif'}
                        </span>
                        {partenaire.en_maintenance && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                            Maintenance
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {partenaire.date_creation}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onDetail(partenaire)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Détails"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(partenaire)}
                          className={`p-2 rounded-lg transition-colors ${
                            partenaire.actif
                              ? 'text-gray-500 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={partenaire.actif ? 'Désactiver' : 'Activer'}
                        >
                          {partenaire.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onEdit(partenaire)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(partenaire)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>

        {partenaires.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Landmark className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun partenaire trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les partenaires apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}
