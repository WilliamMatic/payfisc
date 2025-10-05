import { X, Calendar, Clock, DollarSign, FileText, AlertTriangle, Scale, Percent } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';

interface DetailsImpotModalProps {
  impot: ImpotType;
  onClose: () => void;
}

export default function DetailsImpotModal({
  impot,
  onClose
}: DetailsImpotModalProps) {
  // Fonction pour afficher le montant selon le type de pénalité
  const getMontantDisplay = () => {
    if (!impot.penalites) return { text: 'Aucune pénalité', icon: Scale, color: 'text-gray-500' };
    
    const { type, valeur } = impot.penalites;
    
    switch (type) {
      case 'fixe':
        return { 
          text: `${valeur} $`, 
          icon: DollarSign, 
          color: 'text-green-500' 
        };
      case 'pourcentage':
        return { 
          text: `${valeur}%`, 
          icon: Percent, 
          color: 'text-blue-500' 
        };
      case 'aucune':
        return { 
          text: 'Aucune pénalité', 
          icon: Scale, 
          color: 'text-gray-500' 
        };
      default:
        return { 
          text: 'Aucune pénalité', 
          icon: Scale, 
          color: 'text-gray-500' 
        };
    }
  };

  // Fonction pour le texte descriptif des pénalités
  const getPenaliteDescription = () => {
    if (!impot.penalites || impot.penalites.type === 'aucune') {
      return null;
    }

    const { type, valeur } = impot.penalites;
    
    switch (type) {
      case 'fixe':
        return `En cas de retard de paiement, une pénalité fixe de ${valeur} $ sera appliquée.`;
      case 'pourcentage':
        return `En cas de retard de paiement, une pénalité de ${valeur}% du montant dû sera appliquée.`;
      default:
        return null;
    }
  };

  const montantDisplay = getMontantDisplay();
  const MontantIcon = montantDisplay.icon;
  const penaliteDescription = getPenaliteDescription();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Détails de l'Impôt</h3>
              <p className="text-sm text-gray-500">Informations complètes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{impot.nom}</h2>
            <p className="text-gray-600">{impot.description}</p>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Période</span>
              </div>
              <p className="text-gray-900 font-semibold capitalize">{impot.periode || 'Non spécifiée'}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Délai d'accord</span>
              </div>
              <p className="text-gray-900 font-semibold">{impot.delai_accord || 0} jours</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MontantIcon className={`w-4 h-4 ${montantDisplay.color} mr-2`} />
                <span className="text-sm font-medium text-gray-700">
                  {impot.penalites?.type === 'fixe' ? 'Montant pénalité' : 'Pénalités'}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-semibold">
                  {montantDisplay.text}
                </p>
                {impot.penalites && impot.penalites.type !== 'aucune' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {impot.penalites.type}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FileText className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Statut</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                impot.actif 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {impot.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Section des détails supplémentaires */}
          {penaliteDescription && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Informations sur les pénalités
                  </h4>
                  <p className="text-sm text-yellow-700">
                    {penaliteDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date de création */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Créé le {impot.date_creation || 'Date non disponible'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#153258] text-white rounded-lg hover:bg-[#1e4375] transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}