import { Plus, X, Save, Loader2, User, Phone, CreditCard } from "lucide-react";

interface AddBeneficiaireModalProps {
  formData: { nom: string; telephone: string; numero_compte: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: {
    nom: string;
    telephone: string;
    numero_compte: string;
  }) => void;
  onAddBeneficiaire: () => Promise<void>;
}

export default function AddBeneficiaireModal({
  formData,
  processing,
  onClose,
  onFormDataChange,
  onAddBeneficiaire,
}: AddBeneficiaireModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Nouveau Bénéficiaire
              </h3>
              <p className="text-sm text-gray-500">
                Ajouter un nouveau bénéficiaire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5">
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, nom: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: Jean Dupont"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, telephone: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: +243 81 234 5678"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Numéro de compte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Compte <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.numero_compte}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      numero_compte: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: 1234567890"
                  disabled={processing}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onAddBeneficiaire}
              disabled={
                !formData.nom.trim() ||
                !formData.telephone.trim() ||
                !formData.numero_compte.trim() ||
                processing
              }
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? "Traitement..." : "Enregistrer"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
