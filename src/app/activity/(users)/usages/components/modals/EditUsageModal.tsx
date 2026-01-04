import { X } from 'lucide-react';
import { UsageEngin as UsageEnginType } from '@/services/usages/usageService';

interface EditUsageModalProps {
  usage: UsageEnginType;
  formData: { code: string; libelle: string; description: string };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { code: string; libelle: string; description: string }) => void;
  onEditUsage: () => Promise<void>;
}

export default function EditUsageModal({
  usage,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditUsage
}: EditUsageModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditUsage();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Modifier l'Usage</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={formData.code}
                onChange={(e) => onFormDataChange({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
                placeholder="Ex: TAXI, PERSO, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 20 caractères</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.libelle}
                onChange={(e) => onFormDataChange({ ...formData, libelle: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
                placeholder="Ex: Taxi, Personnel, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 100 caractères</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] resize-none"
                placeholder="Description optionnelle de l'usage..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !formData.code || !formData.libelle}
              className="px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Modification en cours...' : 'Modifier l\'Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}