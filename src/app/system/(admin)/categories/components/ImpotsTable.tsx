import { FileText, Loader2, Edit, Trash2, Eye, EyeOff, Calendar, Clock, QrCode, DollarSign, Users } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface ImpotsTableProps {
  impots: ImpotType[];
  loading: boolean;
  searchTerm?: string; // Ajout de la prop searchTerm
  onEdit: (impot: ImpotType) => void;
  onDelete: (impot: ImpotType) => void;
  onToggleStatus: (impot: ImpotType) => void;
  onViewDetails: (impot: ImpotType) => void;
  onGenerateQR: (impot: ImpotType) => void;
  onManageBeneficiaires: (impot: ImpotType) => void;
  onResetSearch?: () => void; // Optionnel : pour réinitialiser la recherche
}

export default function ImpotsTable({ 
  impots, 
  loading, 
  searchTerm = '', // Valeur par défaut
  onEdit, 
  onDelete, 
  onToggleStatus,
  onViewDetails,
  onGenerateQR,
  onManageBeneficiaires,
  onResetSearch
}: ImpotsTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des recettes publiques...</span>
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

  // Fonction pour réinitialiser la recherche
  const handleResetSearch = () => {
    if (onResetSearch) {
      onResetSearch();
    } else {
      window.location.reload();
    }
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
                    {impot.description && (
                      <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">
                        {impot.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600 text-sm">
                      <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                      {getMontant(impot)}
                    </div>
                    {impot.penalites && impot.penalites.type !== 'aucune' && (
                      <div className="text-gray-400 text-xs mt-1 capitalize">
                        {impot.penalites.type}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                      {impot.periode || 'N/A'}
                    </div>
                    {impot.delai_accord > 0 && (
                      <div className="flex items-center text-gray-400 text-xs mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {impot.delai_accord} jours
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      impot.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {impot.actif ? 'Actif' : 'Inactif'}
                    </span>
                    {impot.date_creation && (
                      <div className="text-gray-400 text-xs mt-1">
                        Créé: {impot.date_creation}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1 relative">
                      {/* Bouton Voir les détails */}
                      <button
                        onClick={() => onViewDetails(impot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Détails
                        </span>
                      </button>

                      {/* Bouton QR Code */}
                      <button
                        onClick={() => onGenerateQR(impot)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group"
                        title="Générer QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          QR Code
                        </span>
                      </button>

                      {/* Bouton : Gérer les bénéficiaires */}
                      <button
                        onClick={() => onManageBeneficiaires(impot)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                        title="Gérer les bénéficiaires"
                      >
                        <Users className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Bénéficiaires
                        </span>
                      </button>

                      {/* Bouton Activer/Désactiver */}
                      <button
                        onClick={() => onToggleStatus(impot)}
                        className={`p-2 rounded-lg transition-colors group ${
                          impot.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={impot.actif ? 'Désactiver' : 'Activer'}
                      >
                        {impot.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {impot.actif ? 'Désactiver' : 'Activer'}
                        </span>
                      </button>

                      {/* Bouton Modifier */}
                      <button
                        onClick={() => onEdit(impot)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors group"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Modifier
                        </span>
                      </button>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => onDelete(impot)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          Supprimer
                        </span>
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
            <p className="text-gray-500 font-medium">Aucune recette publique trouvé</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Les recettes publiques apparaîtront ici une fois ajoutés'}
            </p>
            {searchTerm && (
              <button
                onClick={handleResetSearch}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Voir tous les recettes publiques
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pied de tableau avec statistiques */}
      {impots.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {impots.length} recette(s) publique(s) trouvé(s)
            {searchTerm && (
              <span className="text-gray-400 ml-2">
                pour "{searchTerm}"
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>{impots.filter(i => i.actif).length} actif(s)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span>{impots.filter(i => !i.actif).length} inactif(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}