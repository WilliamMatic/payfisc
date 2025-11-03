import { 
  X, Building2, User, MapPin, Phone, Mail, Calendar, FileText 
} from 'lucide-react';
import { Entreprise as EntrepriseType } from '@/services/entreprises/entrepriseService';

interface ViewEntrepriseModalProps {
  entreprise: EntrepriseType;
  onClose: () => void;
}

export default function ViewEntrepriseModal({
  entreprise,
  onClose
}: ViewEntrepriseModalProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
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
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Détails de l'entreprise</h3>
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
                <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium">Raison Sociale:</span>
                <span className="ml-2 text-blue-700">{entreprise.raison_sociale}</span>
              </div>
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium">Forme Juridique:</span>
                <span className="ml-2 text-blue-700">{entreprise.forme_juridique || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 text-sm mb-2">Identifiants fiscaux</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-green-600 mr-2" />
                <span className="font-medium">NIF:</span>
                <span className="ml-2 text-green-700">{entreprise.nif}</span>
              </div>
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-green-600 mr-2" />
                <span className="font-medium">Registre de Commerce:</span>
                <span className="ml-2 text-green-700">{entreprise.registre_commerce}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 text-sm mb-2">Coordonnées</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-purple-600 mr-2" />
                <span className="font-medium">Adresse:</span>
                <span className="ml-2 text-purple-700">{entreprise.adresse_siege || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-purple-600 mr-2" />
                <span className="font-medium">Téléphone:</span>
                <span className="ml-2 text-purple-700">{entreprise.telephone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-purple-600 mr-2" />
                <span className="font-medium">Email:</span>
                <span className="ml-2 text-purple-700">{entreprise.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 text-sm mb-2">Représentation</h4>
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 text-orange-600 mr-2" />
              <span className="font-medium">Représentant légal:</span>
              <span className="ml-2 text-orange-700">{entreprise.representant_legal || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">Informations générales</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-medium">Date de création:</span>
                <span className="ml-2 text-gray-700">{formatDate(entreprise.date_creation)}</span>
              </div>
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${entreprise.actif ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">Statut:</span>
                <span className={`ml-2 ${entreprise.actif ? 'text-green-700' : 'text-red-700'}`}>
                  {entreprise.actif ? 'Actif' : 'Inactif'}
                </span>
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
