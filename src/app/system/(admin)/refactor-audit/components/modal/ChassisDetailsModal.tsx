"use client";

import { X } from "lucide-react";
import type { ChassisDuplicate, ChassisSource } from "../../types";

interface Props {
  item: ChassisDuplicate;
  onClose: () => void;
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

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </div>
      <div className="text-[13px] text-gray-900 mt-0.5">{value ?? "—"}</div>
    </div>
  );
}

export default function ChassisDetailsModal({ item, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">
              Détail du doublon de châssis
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              ID #{item.id}
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
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-1">
              Numéro de châssis
            </div>
            <div className="font-mono text-[15px] font-semibold text-gray-900">
              {item.numero_chassis}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="text-[11px] uppercase tracking-wide text-violet-700 font-semibold mb-2">
                Ancien engin
              </div>
              <div className="space-y-2">
                <Field
                  label="Plaque"
                  value={item.ancien_plaque ?? "—"}
                />
                <Field
                  label="ID engin"
                  value={
                    item.ancien_engin_id ? `#${item.ancien_engin_id}` : "—"
                  }
                />
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold mb-2">
                Nouvel engin
              </div>
              <div className="space-y-2">
                <Field label="Plaque" value={item.nouveau_plaque ?? "—"} />
                <Field
                  label="ID engin"
                  value={`#${item.nouveau_engin_id}`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Source
              </div>
              <span
                className={`mt-1 inline-block text-[11px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_BADGE[item.source]}`}
              >
                {SOURCE_LABEL[item.source]}
              </span>
            </div>
            <Field
              label="Agent"
              value={
                item.utilisateur_prenom || item.utilisateur_nom
                  ? `${item.utilisateur_prenom ?? ""} ${item.utilisateur_nom ?? ""}`.trim()
                  : "—"
              }
            />
            <Field label="Site" value={item.site_nom ?? "—"} />
          </div>

          <Field
            label="Date d'enregistrement"
            value={new Date(item.date_creation).toLocaleString("fr-FR")}
          />
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
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
