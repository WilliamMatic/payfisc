"use client";

import { useState } from "react";
import {
  X,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { ControleTechnique, ResultatElement } from "./types";
import { modifierResultatsControle } from "@/app/services/controle-technique/controleTechniqueService";

interface ModificationResultatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controle: ControleTechnique;
  onSuccess: () => void;
}

type StatutValue = "bon" | "mauvais" | "non-commence";

export default function ModificationResultatsModal({
  isOpen,
  onClose,
  controle,
  onSuccess,
}: ModificationResultatsModalProps) {
  const [modifications, setModifications] = useState<Map<number, StatutValue>>(
    new Map(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getCurrentStatut = (resultat: ResultatElement): StatutValue => {
    return modifications.get(resultat.id) ?? resultat.statut;
  };

  const handleStatutChange = (id: number, newStatut: StatutValue) => {
    const original = controle.resultats.find((r) => r.id === id);
    const newMods = new Map(modifications);

    if (original && original.statut === newStatut) {
      newMods.delete(id);
    } else {
      newMods.set(id, newStatut);
    }

    setModifications(newMods);
  };

  const handleSave = async () => {
    if (modifications.size === 0) return;

    setIsSaving(true);
    setError(null);

    const resultats = Array.from(modifications.entries()).map(
      ([id, statut]) => ({
        id,
        statut,
      }),
    );

    const response = await modifierResultatsControle(controle.id, resultats);

    if (response.status === "success") {
      setIsSaving(false);
      onSuccess();
    } else {
      setError(response.message || "Erreur lors de la sauvegarde");
      setIsSaving(false);
    }
  };

  const getStatutIcon = (statut: StatutValue) => {
    switch (statut) {
      case "bon":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "mauvais":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "non-commence":
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatutBgClass = (statut: StatutValue) => {
    switch (statut) {
      case "bon":
        return "bg-green-50 border-green-200";
      case "mauvais":
        return "bg-red-50 border-red-200";
      case "non-commence":
        return "bg-gray-50 border-gray-200";
    }
  };

  // Grouper par catégorie
  const categories: Record<string, ResultatElement[]> = {};
  controle.resultats.forEach((r) => {
    const cat = r.nom_element.split(" - ")[0] || "Autres";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(r);
  });

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Modifier les résultats
                </h3>
                <p className="text-blue-100 text-sm">
                  {controle.reference} — {controle.engin.numero_plaque}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
              disabled={isSaving}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 max-h-[65vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {modifications.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                {modifications.size} modification(s) en attente
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(categories).map(([categorie, items]) => (
                <div key={categorie}>
                  <h4 className="font-medium text-gray-700 text-sm border-b border-gray-200 pb-2 mb-3">
                    {categorie}
                  </h4>
                  <div className="space-y-2">
                    {items.map((resultat) => {
                      const currentStatut = getCurrentStatut(resultat);
                      const isModified = modifications.has(resultat.id);

                      return (
                        <div
                          key={resultat.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${getStatutBgClass(currentStatut)} ${isModified ? "ring-2 ring-blue-300" : ""}`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getStatutIcon(currentStatut)}
                            <span className="text-sm font-medium text-gray-900">
                              {resultat.nom_element}
                            </span>
                            {isModified && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                modifié
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() =>
                                handleStatutChange(resultat.id, "bon")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                currentStatut === "bon"
                                  ? "bg-green-600 text-white shadow-sm"
                                  : "bg-white text-green-700 border border-green-300 hover:bg-green-50"
                              }`}
                            >
                              Bon
                            </button>
                            <button
                              onClick={() =>
                                handleStatutChange(resultat.id, "mauvais")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                currentStatut === "mauvais"
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "bg-white text-red-700 border border-red-300 hover:bg-red-50"
                              }`}
                            >
                              Mauvais
                            </button>
                            <button
                              onClick={() =>
                                handleStatutChange(resultat.id, "non-commence")
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                currentStatut === "non-commence"
                                  ? "bg-gray-600 text-white shadow-sm"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              Non commencé
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              La décision finale et le statut seront recalculés automatiquement
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || modifications.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder ({modifications.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
