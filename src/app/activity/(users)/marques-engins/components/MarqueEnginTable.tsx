import {
  Tag,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  List,
} from "lucide-react";
import { MarqueEngin as MarqueEnginType } from "@/services/marques-engins/marqueEnginService";

interface MarqueEnginTableProps {
  marques: MarqueEnginType[];
  loading: boolean;
  onEdit: (marque: MarqueEnginType) => void;
  onDelete: (marque: MarqueEnginType) => void;
  onToggleStatus: (marque: MarqueEnginType) => void;
  onAddModele: (marque: MarqueEnginType) => void;
  onViewModeles: (marque: MarqueEnginType) => void;
}

export default function MarqueEnginTable({
  marques,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddModele,
  onViewModeles,
}: MarqueEnginTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des marques...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Marque
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type d'Engin
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Modèles
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date Création
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {marques.map(
              (marque) =>
                marque && (
                  <tr
                    key={marque.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 text-sm">
                        {marque.libelle || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {marque.type_engin_libelle || "N/A"}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate"
                      title={marque.description}
                    >
                      {marque.description || "Aucune description"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewModeles(marque)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
                      >
                        <List className="w-3 h-3 mr-1" />
                        Voir modèles ({marque.modeles_count || 0})
                      </button>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          marque.actif
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {marque.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {marque.date_creation}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onAddModele(marque)}
                          className="inline-flex items-center p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Ajouter un modèle"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="ml-1">Ajouter modèle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>

        {marques.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune marque trouvée</p>
            <p className="text-gray-400 text-sm mt-1">
              Les marques apparaîtront ici une fois ajoutées
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
