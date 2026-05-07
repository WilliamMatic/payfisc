"use client";

import { Eye } from "lucide-react";
import type { ChassisDuplicate, ChassisSource } from "../types";

interface Props {
  data: ChassisDuplicate[];
  onView: (row: ChassisDuplicate) => void;
}

const SOURCE_BADGE: Record<ChassisSource, string> = {
  carte_rose: "bg-violet-50 text-violet-700 border-violet-200",
  client_simple: "bg-blue-50 text-blue-700 border-blue-200",
  refactor: "bg-amber-50 text-amber-700 border-amber-200",
};

const SOURCE_LABEL: Record<ChassisSource, string> = {
  carte_rose: "Carte rose",
  client_simple: "Client simple",
  refactor: "Refactor",
};

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export default function ChassisDuplicatesTable({ data, onView }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-[13px]">
        Aucun doublon de châssis trouvé.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-[13px]">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left font-medium px-3 py-2">Châssis</th>
            <th className="text-left font-medium px-3 py-2">Ancien engin</th>
            <th className="text-left font-medium px-3 py-2">Nouvel engin</th>
            <th className="text-left font-medium px-3 py-2">Source</th>
            <th className="text-left font-medium px-3 py-2">Agent</th>
            <th className="text-left font-medium px-3 py-2">Site</th>
            <th className="text-left font-medium px-3 py-2">Date</th>
            <th className="text-right font-medium px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-[13px] text-gray-900">
                {row.numero_chassis}
              </td>
              <td className="px-3 py-2 text-gray-700">
                {row.ancien_plaque ? (
                  <span className="font-medium">{row.ancien_plaque}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
                {row.ancien_engin_id && (
                  <span className="text-[11px] text-gray-500 block">
                    #{row.ancien_engin_id}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-700">
                <span className="font-medium">
                  {row.nouveau_plaque ?? "—"}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  #{row.nouveau_engin_id}
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_BADGE[row.source]}`}
                >
                  {SOURCE_LABEL[row.source]}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-700">
                {row.utilisateur_prenom || row.utilisateur_nom
                  ? `${row.utilisateur_prenom ?? ""} ${row.utilisateur_nom ?? ""}`.trim()
                  : "—"}
              </td>
              <td className="px-3 py-2 text-gray-700">
                {row.site_nom ?? "—"}
              </td>
              <td className="px-3 py-2 text-gray-600 text-[11px]">
                {formatDate(row.date_creation)}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onView(row)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#2D5B7A] bg-[#2D5B7A]/10 rounded-lg hover:bg-[#2D5B7A]/15"
                >
                  <Eye className="w-3 h-3" />
                  Détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
