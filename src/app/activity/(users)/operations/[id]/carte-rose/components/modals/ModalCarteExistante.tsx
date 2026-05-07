"use client";
import { AlertTriangle, Car, MapPin, User, X } from "lucide-react";
import type { CarteExistanteDetails } from "@/services/carte-rose/carteRoseService";

interface ModalCarteExistanteProps {
  isOpen: boolean;
  details: CarteExistanteDetails | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "-" || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

export default function ModalCarteExistante({
  isOpen,
  details,
  onClose,
}: ModalCarteExistanteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">
                Carte Rose Déjà Délivrée
              </h3>
              {details?.numero_plaque && (
                <p className="text-red-100 text-sm font-mono tracking-widest">
                  {details.numero_plaque}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* Alerte */}
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Une carte rose a déjà été délivrée pour cette plaque dans cette province.
            Impossible de procéder à une nouvelle délivrance.
          </div>

          {details ? (
            <>
              {/* Assujetti */}
              <div className="rounded-xl border border-blue-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800 text-sm uppercase tracking-wide">
                    Propriétaire enregistré
                  </span>
                </div>
                <div className="px-4 py-3">
                  <Row label="Nom complet" value={details.nom_complet} />
                  <Row label="Téléphone"   value={details.telephone} />
                  <Row label="Adresse"     value={details.adresse} />
                  <Row label="Ville"       value={details.ville} />
                  <Row label="NIF"         value={details.nif} />
                  <Row label="Date enreg." value={details.date_attribution} />
                </div>
              </div>

              {/* Engin */}
              {details.engin_id && (
                <div className="rounded-xl border border-green-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50">
                    <Car className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm uppercase tracking-wide">
                      Engin associé
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <Row label="Type"              value={details.type_engin} />
                    <Row label="Marque / Modèle"   value={details.marque} />
                    <Row label="Énergie"           value={details.energie} />
                    <Row label="Couleur"           value={details.couleur} />
                    <Row label="Puissance fiscale" value={details.puissance_fiscal} />
                    <Row label="Usage"             value={details.usage_engin} />
                    <Row label="Année fabrication" value={details.annee_fabrication} />
                    <Row label="Année circulation" value={details.annee_circulation} />
                    <Row label="N° châssis"        value={details.numero_chassis} />
                    <Row label="N° moteur"         value={details.numero_moteur} />
                  </div>
                </div>
              )}

              {/* Site */}
              {details.site_nom && (
                <div className="rounded-xl border border-purple-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-800 text-sm uppercase tracking-wide">
                      Site d&apos;enregistrement
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <Row
                      label="Site"
                      value={
                        details.site_nom +
                        (details.site_code ? ` (${details.site_code})` : "")
                      }
                    />
                    <Row label="Province" value={details.province_nom} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun détail disponible.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Compris, recommencer
          </button>
        </div>
      </div>
    </div>
  );
}
