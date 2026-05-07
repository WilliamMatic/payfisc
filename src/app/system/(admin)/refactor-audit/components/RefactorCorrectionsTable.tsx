"use client";

import { Eye } from "lucide-react";
import type { CorrectionSource, RefactorCorrection } from "../types";

interface Props {
  data: RefactorCorrection[];
  onView: (id: number) => void;
}

const SOURCE_BADGE: Record<CorrectionSource, string> = {
  locale: "bg-gray-50 text-gray-700 border-gray-200",
  carte_reprint: "bg-indigo-50 text-indigo-700 border-indigo-200",
  externe: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const SOURCE_LABEL: Record<CorrectionSource, string> = {
  locale: "Locale",
  carte_reprint: "Carte reprint",
  externe: "Externe",
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

export default function RefactorCorrectionsTable({ data, onView }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-[13px]">
        Aucune correction enregistrée.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-[13px]">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left font-medium px-3 py-2">Date</th>
            <th className="text-left font-medium px-3 py-2">Plaque</th>
            <th className="text-left font-medium px-3 py-2">Source</th>
            <th className="text-left font-medium px-3 py-2">Référence</th>
            <th className="text-left font-medium px-3 py-2">Champs</th>
            <th className="text-left font-medium px-3 py-2">Agent</th>
            <th className="text-left font-medium px-3 py-2">Site</th>
            <th className="text-right font-medium px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-600 text-[11px]">
                {formatDate(row.date_correction)}
              </td>
              <td className="px-3 py-2 font-medium text-gray-900">
                {row.numero_plaque ?? "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_BADGE[row.source]}`}
                >
                  {SOURCE_LABEL[row.source]}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-600 text-[11px]">
                {row.paiement_id && (
                  <span>paiement #{row.paiement_id}</span>
                )}
                {row.carte_reprint_id && (
                  <span className="block">
                    reprint #{row.carte_reprint_id}
                  </span>
                )}
                {!row.paiement_id && !row.carte_reprint_id && (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {row.nb_changements} modif.
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
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onView(row.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#2D5B7A] bg-[#2D5B7A]/10 rounded-lg hover:bg-[#2D5B7A]/15"
                >
                  <Eye className="w-3 h-3" />
                  Voir détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
