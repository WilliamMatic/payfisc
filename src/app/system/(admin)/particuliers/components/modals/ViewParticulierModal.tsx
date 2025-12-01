// src/app/system/(admin)/particuliers/components/modals/ViewParticulierModal.tsx
import { 
  X, User, Calendar, MapPin, Phone, Mail, IdCard, Users, Home, Percent, DollarSign 
} from 'lucide-react';
import { Particulier as ParticulierType } from '@/services/particuliers/particulierService';

interface ViewParticulierModalProps {
  particulier: ParticulierType;
  onClose: () => void;
}

export default function ViewParticulierModal({
  particulier,
  onClose
}: ViewParticulierModalProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatReduction = () => {
    if (!particulier.reduction_type || particulier.reduction_valeur === 0) {
      return 'Aucune';
    }
    
    if (particulier.reduction_type === 'pourcentage') {
      return `${particulier.reduction_valeur}%`;
    } else {
      return `${particulier.reduction_valeur} $`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="bg-[#153258] p-2 rounded-lg mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Détails du contribuable</h3>
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
        
        {/* BODY */}
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">Identité</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium">Nom complet:</span>
                <span className="ml-2 text-blue-700">{particulier.nom} {particulier.prenom}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium">Date de naissance:</span>
                <span className="ml-2 text-blue-700">{formatDate(particulier.date_naissance)}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium">Lieu de naissance:</span>
                <span className="ml-2 text-blue-700">{particulier.lieu_naissance || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium">Sexe:</span>
                <span className="ml-2 text-blue-700">{particulier.sexe || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 text-sm mb-2">Identifiants</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <IdCard className="w-4 h-4 text-green-600 mr-2" />
                <span className="font-medium">NIF:</span>
                <span className="ml-2 text-green-700">{particulier.nif}</span>
              </div>
              <div className="flex items-center text-sm">
                <IdCard className="w-4 h-4 text-green-600 mr-2" />
                <span className="font-medium">ID National:</span>
                <span className="ml-2 text-green-700">{particulier.id_national || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 text-sm mb-2">Coordonnées</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-purple-600 mr-2" />
                <span className="font-medium">Téléphone:</span>
                <span className="ml-2 text-purple-700">{particulier.telephone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-purple-600 mr-2" />
                <span className="font-medium">Email:</span>
                <span className="ml-2 text-purple-700">{particulier.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 text-sm mb-2">Situation familiale</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 text-orange-600 mr-2" />
                <span className="font-medium">Situation:</span>
                <span className="ml-2 text-orange-700">{particulier.situation_familiale || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 text-orange-600 mr-2" />
                <span className="font-medium">Dépendants:</span>
                <span className="ml-2 text-orange-700">{particulier.dependants || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-800 text-sm mb-2">Réduction</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                {particulier.reduction_type === 'pourcentage' ? (
                  <Percent className="w-4 h-4 text-indigo-600 mr-2" />
                ) : particulier.reduction_type === 'montant_fixe' ? (
                  <DollarSign className="w-4 h-4 text-indigo-600 mr-2" />
                ) : (
                  <span className="w-4 h-4 mr-2">-</span>
                )}
                <span className="font-medium">Type:</span>
                <span className="ml-2 text-indigo-700">
                  {particulier.reduction_type === 'pourcentage' ? 'Pourcentage' : 
                   particulier.reduction_type === 'montant_fixe' ? 'Montant fixe' : 'Aucune'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium">Valeur:</span>
                <span className="ml-2 text-indigo-700">{formatReduction()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Adresse</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Home className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Rue:</span>
                <span className="ml-2 text-gray-700">{particulier.rue || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Home className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Ville:</span>
                <span className="ml-2 text-gray-700">{particulier.ville || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Home className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Code Postal:</span>
                <span className="ml-2 text-gray-700">{particulier.code_postal || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Home className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Province:</span>
                <span className="ml-2 text-gray-700">{particulier.province || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Informations générales</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${particulier.actif ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Statut:</span>
                <span className={`ml-2 ${particulier.actif ? 'text-green-700' : 'text-red-700'}`}>
                  {particulier.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Date création:</span>
                <span className="ml-2 text-gray-700">{formatDate(particulier.date_creation)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white z-10 px-5">
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