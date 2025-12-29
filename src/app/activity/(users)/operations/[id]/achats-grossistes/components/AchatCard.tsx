import { User, Phone, MapPin, Package, Eye } from "lucide-react";
import { AchatPlaques } from "../types";

interface AchatCardProps {
  achat: AchatPlaques;
  afficherToutesPlaques: (achat: AchatPlaques) => void;
  formaterSeriePlaques: (achat: AchatPlaques) => string;
}

export default function AchatCard({
  achat,
  afficherToutesPlaques,
  formaterSeriePlaques
}: AchatCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations de l'assujetti */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {achat.assujetti.prenom} {achat.assujetti.nom}
              </h4>
              <p className="text-sm text-gray-600">
                Assujetti
              </p>
            </div>
          </div>

          <div className="space-y-2 pl-11">
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {achat.assujetti.telephone}
              </span>
            </div>
            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-gray-700">
                {achat.assujetti.adresse}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                NIF:{" "}
              </span>
              <span className="text-gray-600">
                {achat.assujetti.nif}
              </span>
            </div>
            {achat.impot_id && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  ID Impôt:{" "}
                </span>
                <span className="text-gray-600">
                  {achat.impot_id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Détails de l'achat */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Détails de l'Achat
              </h4>
              <p className="text-sm text-gray-600">
                #{achat.id} • {achat.type_plaque}
              </p>
            </div>
          </div>

          <div className="space-y-2 pl-11">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Nombre de plaques:
              </span>
              <span className="font-medium text-gray-900">
                {achat.nombre_plaques}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Montant total:
              </span>
              <span className="font-medium text-gray-900">
                {achat.montant_total.toLocaleString("fr-FR")} $
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Mode paiement:
              </span>
              <span className="font-medium text-gray-900">
                {achat.mode_paiement}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Statut:
              </span>
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
            </div>
          </div>
        </div>

        {/* Séries de plaques */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Séries de Plaques
                </h4>
                <p className="text-sm text-gray-600">
                  {achat.nombre_plaques} plaque
                  {achat.nombre_plaques !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {achat.nombre_plaques > 5 && (
              <button
                onClick={() => afficherToutesPlaques(achat)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Voir toutes
              </button>
            )}
          </div>

          <div className="pl-11">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Série:
              </p>
              <p className="text-gray-900 font-mono">
                {formaterSeriePlaques(achat)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {achat.nombre_plaques <= 5
                  ? "Toutes les plaques affichées"
                  : "Première et dernière plaque affichées"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}