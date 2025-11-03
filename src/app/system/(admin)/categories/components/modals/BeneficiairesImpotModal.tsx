import {
  X,
  Plus,
  Trash2,
  Users,
  Percent,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Impot as ImpotType } from "@/services/impots/impotService";
import { Beneficiaire as BeneficiaireType } from "@/services/beneficiaires/beneficiaireService";
import { useState, useEffect } from "react";

interface BeneficiaireImpot {
  id: number;
  impot_id: number;
  beneficiaire_id: number;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
  nom: string;
  telephone: string;
  numero_compte: string;
}

interface BeneficiairesImpotModalProps {
  impot: ImpotType;
  onClose: () => void;
}

export default function BeneficiairesImpotModal({
  impot,
  onClose,
}: BeneficiairesImpotModalProps) {
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireImpot[]>([]);
  const [allBeneficiaires, setAllBeneficiaires] = useState<BeneficiaireType[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<number>(0);
  const [typePart, setTypePart] = useState<"pourcentage" | "montant_fixe">(
    "pourcentage"
  );
  const [valeurPart, setValeurPart] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Charger les bénéficiaires de l'impôt
  const loadBeneficiairesImpot = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/beneficiaires/lister_beneficiaires_impot.php?impot_id=${impot.id}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setBeneficiaires(data.data || []);
      } else {
        setError(data.message || "Erreur lors du chargement des bénéficiaires");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Charger tous les bénéficiaires disponibles
  const loadAllBeneficiaires = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/beneficiaires/lister_beneficiaires.php`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setAllBeneficiaires(data.data || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des bénéficiaires:", err);
    }
  };

  useEffect(() => {
    loadBeneficiairesImpot();
    loadAllBeneficiaires();
  }, [impot.id]);

  // Ajouter un bénéficiaire à l'impôt
  const handleAddBeneficiaire = async () => {
    if (!selectedBeneficiaire || valeurPart <= 0) {
      setError(
        "Veuillez sélectionner un bénéficiaire et saisir une valeur valide"
      );
      return;
    }

    // Validation des pourcentages
    if (typePart === "pourcentage") {
      const totalPourcentages = beneficiaires
        .filter((b) => b.type_part === "pourcentage")
        .reduce((sum, b) => sum + b.valeur_part, 0);

      if (totalPourcentages + valeurPart > 100) {
        setError(
          `Le total des pourcentages ne peut pas dépasser 100%. Actuellement: ${totalPourcentages}%`
        );
        return;
      }
    }

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/beneficiaires/ajouter_beneficiaire_impot.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            impot_id: impot.id,
            beneficiaire_id: selectedBeneficiaire,
            type_part: typePart,
            valeur_part: valeurPart,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setSuccessMessage("Bénéficiaire ajouté avec succès");
        setShowAddForm(false);
        setSelectedBeneficiaire(0);
        setValeurPart(0);
        loadBeneficiairesImpot();
      } else {
        setError(data.message || "Erreur lors de l'ajout du bénéficiaire");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setAdding(false);
    }
  };

  // Supprimer un bénéficiaire de l'impôt
  const handleRemoveBeneficiaire = async (beneficiaireId: number) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir retirer ce bénéficiaire de cet impôt ?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/beneficiaires/supprimer_beneficiaire_impot.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            impot_id: impot.id,
            beneficiaire_id: beneficiaireId,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setSuccessMessage("Bénéficiaire retiré avec succès");
        loadBeneficiairesImpot();
      } else {
        setError(
          data.message || "Erreur lors de la suppression du bénéficiaire"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    }
  };

  // Calculer le total des pourcentages
  const totalPourcentages = beneficiaires
    .filter((b) => b.type_part === "pourcentage")
    .reduce((sum, b) => sum + b.valeur_part, 0);

  // Bénéficiaires disponibles (non déjà ajoutés)
  const availableBeneficiaires = allBeneficiaires.filter(
    (benef) => !beneficiaires.some((b) => b.beneficiaire_id === benef.id)
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Bénéficiaires de l'Impôt
              </h3>
              <p className="text-sm text-gray-600">{impot.nom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Messages d'alerte */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <div className="flex-1">
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bouton d'ajout */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">
                Liste des Bénéficiaires
              </h4>
              <p className="text-sm text-gray-600">
                {beneficiaires.length} bénéficiaire(s) associé(s) à cet impôt
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={availableBeneficiaires.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un bénéficiaire</span>
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-3">
                Nouveau bénéficiaire
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bénéficiaire *
                  </label>
                  <select
                    value={selectedBeneficiaire}
                    onChange={(e) =>
                      setSelectedBeneficiaire(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="0">Sélectionner un bénéficiaire</option>
                    {availableBeneficiaires.map((benef) => (
                      <option key={benef.id} value={benef.id}>
                        {benef.nom} - {benef.telephone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de part *
                  </label>
                  <select
                    value={typePart}
                    onChange={(e) =>
                      setTypePart(
                        e.target.value as "pourcentage" | "montant_fixe"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    <option value="pourcentage">Pourcentage</option>
                    <option value="montant_fixe">Montant fixe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur {typePart === "pourcentage" ? "(%) *" : "($) *"}
                  </label>
                  <div className="relative">
                    {typePart === "pourcentage" ? (
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    )}
                    <input
                      type="number"
                      value={valeurPart}
                      onChange={(e) => setValeurPart(Number(e.target.value))}
                      min="0"
                      max={typePart === "pourcentage" ? 100 : undefined}
                      step="0.01"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      placeholder={
                        typePart === "pourcentage" ? "0-100" : "0.00"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedBeneficiaire(0);
                    setValeurPart(0);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddBeneficiaire}
                  disabled={adding || !selectedBeneficiaire || valeurPart <= 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>{adding ? "Ajout..." : "Ajouter"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Indicateur de pourcentages */}
          {beneficiaires.some((b) => b.type_part === "pourcentage") && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">
                  Total des pourcentages:
                </span>
                <span
                  className={`text-sm font-bold ${
                    totalPourcentages === 100
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {totalPourcentages}%
                </span>
              </div>
              {totalPourcentages !== 100 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Le total des pourcentages n'est pas égal à 100%
                </p>
              )}
            </div>
          )}

          {/* Liste des bénéficiaires */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Chargement des bénéficiaires...
              </span>
            </div>
          ) : beneficiaires.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Aucun bénéficiaire associé
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Ajoutez des bénéficiaires pour définir la répartition des
                paiements
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaires.map((beneficiaire) => (
                <div
                  key={beneficiaire.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-800">
                          {beneficiaire.nom}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {beneficiaire.telephone}
                        </p>
                        <p className="text-xs text-gray-500">
                          Compte: {beneficiaire.numero_compte}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {beneficiaire.type_part === "pourcentage" ? (
                            <Percent className="w-4 h-4 text-blue-500" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-green-500" />
                          )}
                          <span className="font-semibold text-gray-800">
                            {beneficiaire.valeur_part}
                            {beneficiaire.type_part === "pourcentage"
                              ? "%"
                              : " $"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">
                          {beneficiaire.type_part.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleRemoveBeneficiaire(beneficiaire.beneficiaire_id)
                    }
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retirer de l'impôt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}