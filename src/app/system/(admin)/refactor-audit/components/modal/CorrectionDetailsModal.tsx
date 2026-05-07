"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ArrowRight } from "lucide-react";
import type {
  CorrectionSource,
  RefactorCorrection,
  RefactorCorrectionDetail,
} from "../../types";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  correctionId: number;
  onClose: () => void;
}

interface DetailsResponse {
  correction: RefactorCorrection;
  details: RefactorCorrectionDetail[];
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

export default function CorrectionDetailsModal({
  correctionId,
  onClose,
}: Props) {
  const [data, setData] = useState<DetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API}/refactor-audit/refactor-correction-details.php?id=${correctionId}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!alive) return;
        if (json?.status !== "success") {
          throw new Error(json?.message || "Erreur");
        }
        setData(json.data);
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Erreur réseau");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [correctionId]);

  // Regrouper les détails par entité
  const grouped = (data?.details ?? []).reduce<
    Record<string, RefactorCorrectionDetail[]>
  >((acc, d) => {
    (acc[d.entite] ||= []).push(d);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">
              Détail de la correction
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              ID #{correctionId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-[13px]">Chargement…</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Métadonnées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                    Plaque
                  </div>
                  <div className="text-[13px] font-medium text-gray-900 mt-0.5">
                    {data.correction.numero_plaque ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                    Source
                  </div>
                  <span
                    className={`mt-0.5 inline-block text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_BADGE[data.correction.source]}`}
                  >
                    {SOURCE_LABEL[data.correction.source]}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                    Agent
                  </div>
                  <div className="text-[13px] text-gray-900 mt-0.5">
                    {data.correction.utilisateur_prenom ||
                    data.correction.utilisateur_nom
                      ? `${data.correction.utilisateur_prenom ?? ""} ${data.correction.utilisateur_nom ?? ""}`.trim()
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                    Date
                  </div>
                  <div className="text-[11px] text-gray-700 mt-0.5">
                    {new Date(
                      data.correction.date_correction,
                    ).toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>

              {/* Liste old/new par entité */}
              {Object.keys(grouped).length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-[13px]">
                  Aucun détail enregistré pour cette correction.
                </div>
              ) : (
                Object.entries(grouped).map(([entite, items]) => (
                  <div
                    key={entite}
                    className="rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-50 px-4 py-2 text-[11px] uppercase tracking-wide font-semibold text-gray-700 border-b border-gray-200">
                      {entite}
                      <span className="ml-2 text-gray-500 font-normal normal-case">
                        ({items.length} champ{items.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <table className="w-full text-[13px]">
                      <thead className="bg-white text-gray-500">
                        <tr>
                          <th className="text-left font-medium px-3 py-2 w-1/4">
                            Champ
                          </th>
                          <th className="text-left font-medium px-3 py-2">
                            Ancienne valeur
                          </th>
                          <th className="w-6 px-1" />
                          <th className="text-left font-medium px-3 py-2">
                            Nouvelle valeur
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {d.champ}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 line-through">
                                {d.ancienne_valeur ?? "∅"}
                              </span>
                            </td>
                            <td className="px-1 text-gray-400">
                              <ArrowRight className="w-3 h-3" />
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                                {d.nouvelle_valeur ?? "∅"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-[#2D5B7A] text-white rounded-lg hover:bg-[#244D68] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
