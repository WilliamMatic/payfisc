import { Percent, Loader2, Edit, Trash2, Link, Star, X } from 'lucide-react';
import { Taux as TauxType, AttributionTaux } from '@/services/taux/tauxService';

interface TauxTableProps {
  taux: TauxType[];
  loading: boolean;
  onEdit: (taux: TauxType) => void;
  onDelete: (taux: TauxType) => void;
  onAttribuer: (taux: TauxType) => void;
  onDefinirDefaut: (taux: TauxType) => void;
  onRetirerAttribution: (taux: TauxType, attribution: AttributionTaux) => void;
}

export default function TauxTable({ 
  taux, 
  loading, 
  onEdit, 
  onDelete, 
  onAttribuer,
  onDefinirDefaut,
  onRetirerAttribution
}: TauxTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des taux...</span>
        </div>
      </div>
    );
  }

  const getAttributionText = (attribution: AttributionTaux) => {
    if (attribution.province_nom) {
      return `${attribution.province_nom} - ${attribution.impot_nom}`;
    }
    return `Toutes provinces - ${attribution.impot_nom}`;
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valeur (CDF)</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Par défaut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Attributions</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {taux.map((taux) => (
              taux && (
                <tr key={taux.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{taux.nom || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-700 text-sm">
                      {taux.valeur ? taux.valeur.toLocaleString('fr-FR') : '0'} CDF
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate" title={taux.description}>
                    {taux.description || 'Aucune description'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {taux.est_par_defaut ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                        <Star className="w-3 h-3 mr-1" />
                        Par défaut
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Non</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {/* Attributions actives */}
                      {taux.attributions && taux.attributions.length > 0 ? (
                        taux.attributions
                          .filter(att => att.actif)
                          .map((attribution) => (
                            <div key={attribution.id} className="flex items-center justify-between group">
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                {getAttributionText(attribution)}
                                {attribution.actif && (
                                  <span className="ml-1 text-green-500">✓</span>
                                )}
                              </span>
                              <button
                                onClick={() => onRetirerAttribution(taux, attribution)}
                                className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Retirer l'attribution"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                      ) : (
                        <span className="text-gray-400 text-xs">Aucune attribution</span>
                      )}
                      
                      {/* Taux par défaut */}
                      {taux.taux_defaut && taux.taux_defaut.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                            <Star className="w-3 h-3 inline mr-1" />
                            Par défaut pour: {taux.taux_defaut.map(td => td.impot_nom).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {taux.date_creation ? new Date(taux.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onAttribuer(taux)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Attribuer à une province/impôt"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDefinirDefaut(taux)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Définir comme taux par défaut"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(taux)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(taux)}
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
        
        {taux.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Percent className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun taux trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les taux apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}