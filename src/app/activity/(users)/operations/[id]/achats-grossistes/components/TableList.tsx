import { AchatPlaques } from "../types";

interface TableListProps {
  filteredAchats: AchatPlaques[];
  formaterDate: (dateStr: string) => string;
  formaterSeriePlaques: (achat: AchatPlaques) => string;
  afficherToutesPlaques: (achat: AchatPlaques) => void;
}

export default function TableList({
  filteredAchats,
  formaterDate,
  formaterSeriePlaques,
  afficherToutesPlaques
}: TableListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assujetti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plaques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAchats.map((achat) => (
              <tr key={achat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {achat.assujetti.prenom} {achat.assujetti.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {achat.assujetti.telephone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formaterDate(achat.date_achat)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">
                    {formaterSeriePlaques(achat)}
                  </div>
                  {achat.nombre_plaques > 5 && (
                    <button
                      onClick={() => afficherToutesPlaques(achat)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Voir toutes
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {achat.nombre_plaques}
                  </div>
                  <div className="text-xs text-gray-500">
                    {achat.type_plaque}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {achat.montant_total.toLocaleString("fr-FR")} $
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      achat.statut === "completé"
                        ? "bg-green-100 text-green-800"
                        : achat.statut === "en_cours"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {achat.statut === "completé"
                      ? "Complété"
                      : achat.statut === "en_cours"
                      ? "En cours"
                      : "Annulé"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}