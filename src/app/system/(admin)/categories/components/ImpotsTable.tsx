import { FileText, Loader2, Edit, Trash2, Eye, EyeOff, Calendar, Clock, QrCode, DollarSign } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface ImpotsTableProps {
  impots: ImpotType[];
  loading: boolean;
  onEdit: (impot: ImpotType) => void;
  onDelete: (impot: ImpotType) => void;
  onToggleStatus: (impot: ImpotType) => void;
  onViewDetails: (impot: ImpotType) => void;
  onGenerateQR: (impot: ImpotType) => void;
}

export default function ImpotsTable({ 
  impots, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onViewDetails,
  onGenerateQR
}: ImpotsTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des impôts...</span>
        </div>
      </div>
    );
  }

  // Fonction pour calculer le montant basé sur le type de pénalité
  const getMontant = (impot: ImpotType) => {
    if (!impot.penalites) return 'N/A';
    
    const { type, valeur } = impot.penalites;
    
    if (type === 'fixe') {
      return `${valeur} $`;
    } else if (type === 'pourcentage') {
      return `${valeur}%`;
    } else if (type === 'aucune') {
      return 'Aucune';
    }
    
    return 'N/A';
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant/Pénalité</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {impots.map((impot) => (
              impot && (
                <tr key={impot.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{impot.nom || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600 text-sm">
                      <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                      {getMontant(impot)}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                      {impot.periode || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      impot.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {impot.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onViewDetails(impot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onGenerateQR(impot)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Générer QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(impot)}
                        className={`p-2 rounded-lg transition-colors ${
                          impot.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={impot.actif ? 'Désactiver' : 'Activer'}
                      >
                        {impot.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(impot)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(impot)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        
        {impots.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun impôt trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les impôts apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}