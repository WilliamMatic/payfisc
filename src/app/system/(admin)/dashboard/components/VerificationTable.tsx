import { Search, Loader2, ChevronRight } from 'lucide-react';
import { VerificationData } from '@/services/dashboard/dashboardService';

interface VerificationTableProps {
  taxData: VerificationData[];
  loading: boolean;
  onViewDetails: (declarationId: number) => void;
}

export default function VerificationTable({ 
  taxData, 
  loading, 
  onViewDetails 
}: VerificationTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#23A974] animate-spin mx-auto" />
          <p className="text-gray-600 mt-3">Chargement des déclarations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tableau des données */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/60">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Référence
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Taxe/Impôt
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contribuable
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Montant dû
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/60">
              {taxData.map((tax, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-md inline-block">
                      {tax.reference || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tax.nom_impot}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{tax.contribuable}</div>
                      <div className="text-xs text-gray-500 capitalize">{tax.type_contribuable}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{tax.montant_du.toLocaleString()} $</div>
                    <div className="text-xs text-green-600">Payé: {tax.montant_paye.toLocaleString()} $</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      tax.statut === "payé" 
                        ? "bg-green-100 text-green-800"
                        : tax.statut === "en_attente" 
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {tax.statut === "payé" ? "Payé" :
                      tax.statut === "en_attente" ? "En attente" : "Rejeté"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => onViewDetails(tax.declaration_id)}
                      className="flex items-center space-x-1 text-[#23A974] hover:text-[#1c875d] transition-colors"
                    >
                      <span className="text-sm font-medium">Voir détails</span>
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {taxData.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune déclaration trouvée</h3>
            <p className="text-gray-500">Aucune donnée ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}