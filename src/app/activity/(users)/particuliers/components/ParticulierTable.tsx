import {
  User,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Particulier as ParticulierType } from "@/services/particuliers/particulierService";

interface ParticuliersTableProps {
  particuliers: ParticulierType[];
  loading: boolean;
  onEdit: (particulier: ParticulierType) => void;
  onDelete: (particulier: ParticulierType) => void;
  onToggleStatus: (particulier: ParticulierType) => void;
  onView: (particulier: ParticulierType) => void;
}

export default function ParticuliersTable({
  particuliers,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
}: ParticuliersTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">
            Chargement des particuliers...
          </span>
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
                Nom
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Prénom
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                NIF
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              {/* <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th> */}
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {particuliers.map(
              (particulier) =>
                particulier && (
                  <tr
                    key={particulier.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 text-sm">
                        {particulier.nom || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {particulier.prenom || "N/A"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {particulier.nif || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {particulier.telephone || "N/A"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          particulier.actif
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {particulier.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    {/* <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {particulier.date_creation ? new Date(particulier.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
                  </td> */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onView(particulier)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {/* <button
                          onClick={() => onEdit(particulier)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>

        {particuliers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              Aucun particulier trouvé
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Les particuliers apparaîtront ici une fois ajoutés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
