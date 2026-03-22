"use client";

import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { ResultatElement } from "./types";

interface ResultatsControleProps {
  resultats: ResultatElement[];
}

export default function ResultatsControle({
  resultats,
}: ResultatsControleProps) {
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "bon":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "mauvais":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "non-commence":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatutClass = (statut: string) => {
    switch (statut) {
      case "bon":
        return "bg-green-50 border-green-200";
      case "mauvais":
        return "bg-red-50 border-red-200";
      case "non-commence":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case "bon":
        return "Bon";
      case "mauvais":
        return "Mauvais";
      case "non-commence":
        return "Non commencé";
      default:
        return statut;
    }
  };

  // Grouper les résultats par catégorie (à adapter selon vos besoins)
  const categories = {
    Moteur: resultats.filter(
      (r) =>
        r.nom_element.toLowerCase().includes("moteur") ||
        r.nom_element.toLowerCase().includes("huile"),
    ),
    Freinage: resultats.filter(
      (r) =>
        r.nom_element.toLowerCase().includes("frein") ||
        r.nom_element.toLowerCase().includes("plaquette"),
    ),
    Éclairage: resultats.filter(
      (r) =>
        r.nom_element.toLowerCase().includes("phare") ||
        r.nom_element.toLowerCase().includes("clignotant") ||
        r.nom_element.toLowerCase().includes("feu"),
    ),
    Direction: resultats.filter(
      (r) =>
        r.nom_element.toLowerCase().includes("direction") ||
        r.nom_element.toLowerCase().includes("volant"),
    ),
    Pneumatiques: resultats.filter(
      (r) =>
        r.nom_element.toLowerCase().includes("pneu") ||
        r.nom_element.toLowerCase().includes("roue"),
    ),
    Autres: resultats.filter(
      (r) =>
        !r.nom_element.toLowerCase().includes("moteur") &&
        !r.nom_element.toLowerCase().includes("frein") &&
        !r.nom_element.toLowerCase().includes("phare") &&
        !r.nom_element.toLowerCase().includes("clignotant") &&
        !r.nom_element.toLowerCase().includes("feu") &&
        !r.nom_element.toLowerCase().includes("direction") &&
        !r.nom_element.toLowerCase().includes("pneu"),
    ),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h4 className="font-bold text-gray-900 flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Résultats détaillés du contrôle
        </h4>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categories).map(([categorie, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={categorie} className="space-y-3">
                <h5 className="font-medium text-gray-700 text-sm border-b border-gray-200 pb-2">
                  {categorie}
                </h5>
                {items.map((resultat) => (
                  <div
                    key={resultat.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getStatutClass(resultat.statut)}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getStatutIcon(resultat.statut)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {resultat.nom_element}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vérifié le{" "}
                          {new Date(
                            resultat.date_verification,
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        resultat.statut === "bon"
                          ? "bg-green-100 text-green-800"
                          : resultat.statut === "mauvais"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {getStatutText(resultat.statut)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
