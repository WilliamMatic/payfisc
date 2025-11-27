import { X, CreditCard } from 'lucide-react';
import { DeclarationDetails } from '@/services/dashboard/dashboardService';

interface DeclarationDetailsModalProps {
  declaration: DeclarationDetails;
  onClose: () => void;
}

export default function DeclarationDetailsModal({
  declaration,
  onClose
}: DeclarationDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-[#23A974] p-2 rounded-lg mr-3">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Détails de la déclaration</h3>
              <p className="text-sm text-gray-500">Informations complètes sur la déclaration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Référence</h4>
              <p className="text-lg font-semibold text-gray-900">{declaration.reference}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Taxe/Impôt</h4>
              <p className="text-lg font-semibold text-gray-900">{declaration.nom_impot}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Contribuable</h4>
              <p className="text-lg font-semibold text-gray-900">{declaration.contribuable}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Type</h4>
              <p className="text-lg font-semibold text-gray-900 capitalize">{declaration.type_contribuable}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">NIF</h4>
              <p className="text-lg font-semibold text-gray-900">{declaration.nif_contribuable}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Statut</h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                declaration.statut === "payé" 
                  ? "bg-green-100 text-green-800"
                  : declaration.statut === "en_attente" 
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {declaration.statut === "payé" ? "Payé" :
                declaration.statut === "en_attente" ? "En attente" : "Rejeté"}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Montant dû</h4>
              <p className="text-lg font-semibold text-gray-900">{declaration.montant_du?.toLocaleString() || 0} $</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Montant payé</h4>
              <p className="text-lg font-semibold text-green-600">{declaration.montant_paye?.toLocaleString() || 0} $</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Solde</h4>
              <p className="text-lg font-semibold text-blue-600">{declaration.solde?.toLocaleString() || 0} $</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Méthode de paiement</h4>
              <p className="text-lg font-semibold text-gray-900 capitalize">{declaration.methode_paiement || 'Non payé'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Lieu de paiement</h4>
              <p className="text-lg font-semibold text-gray-900 capitalize">{declaration.lieu_paiement || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Date de création</h4>
              <p className="text-lg font-semibold text-gray-900">{new Date(declaration.date_creation).toLocaleDateString()}</p>
            </div>
          </div>
          
          {declaration.details_paiements && declaration.details_paiements.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Détails des paiements</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {declaration.details_paiements.map((paiement, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{paiement.methode_paiement}</p>
                      <p className="text-sm text-gray-500">{new Date(paiement.date_paiement).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-green-600">{paiement.montant?.toLocaleString() || 0} $</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#23A974] to-[#1c875d] text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}