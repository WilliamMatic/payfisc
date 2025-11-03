import { X, Download, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { getRapportDeclaration } from "@/services/dashboard/dashboardService";

interface RapportModalProps {
  isOpen: boolean;
  onClose: () => void;
  declarationId: number;
}

interface Beneficiaire {
  id: number;
  nom: string;
  telephone: string;
  numero_compte: string;
  type_part: string;
  valeur_part_originale: number;
  valeur_part_calculee: number;
  montant: number;
}

interface RapportData {
  declaration: any;
  beneficiaires: Beneficiaire[];
  penalites: any;
  total_beneficiaires: number;
}

export default function RapportModal({
  isOpen,
  onClose,
  declarationId,
}: RapportModalProps) {
  const [rapport, setRapport] = useState<RapportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && declarationId) {
      loadRapport();
    }
  }, [isOpen, declarationId]);

  const loadRapport = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getRapportDeclaration(declarationId);

      if (result.status === "success") {
        setRapport(result.data);
      } else {
        setError(result.message || "Erreur lors du chargement du rapport");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors du chargement du rapport:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Rapport de Déclaration
              </h3>
              <p className="text-sm text-gray-500">
                Document officiel pour impression
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer size={16} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Génération du rapport en cours...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {rapport && (
            <div id="rapport-content" className="bg-white">
              {/* En-tête du rapport */}
              <div className="border-2 border-gray-800 p-8 mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="text-left">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </h1>
                    <h2 className="text-2xl font-semibold text-blue-600">
                      DIRECTION GÉNÉRALE DES IMPÔTS
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Service des Declarations Fiscales
                    </p>
                  </div>
                  <div className="text-right border-2 border-gray-400 p-4">
                    <p className="text-lg font-semibold">
                      RAPPORT DE DÉCLARATION
                    </p>
                    <p className="text-sm text-gray-600">
                      N° {rapport.declaration.reference}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="border border-gray-300 p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      INFORMATIONS CONTRIBUABLE
                    </h3>
                    <p>
                      <strong>Nom:</strong> {rapport.declaration.contribuable}
                    </p>
                    <p>
                      <strong>Type:</strong>{" "}
                      {rapport.declaration.type_contribuable}
                    </p>
                    <p>
                      <strong>NIF:</strong>{" "}
                      {rapport.declaration.nif_contribuable}
                    </p>
                  </div>

                  <div className="border border-gray-300 p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      INFORMATIONS DÉCLARATION
                    </h3>
                    <p>
                      <strong>Taxe:</strong> {rapport.declaration.nom_impot}
                    </p>
                    <p>
                      <strong>Date création:</strong>{" "}
                      {new Date(
                        rapport.declaration.date_creation
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Statut:</strong> {rapport.declaration.statut}
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails financiers */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-300 p-4 text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    MONTANT DÛ
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {rapport.declaration.montant_du?.toLocaleString()} $
                  </p>
                </div>

                <div className="border border-gray-300 p-4 text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    MONTANT PAYÉ
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    {rapport.declaration.montant_paye?.toLocaleString()} $
                  </p>
                </div>

                <div className="border border-gray-300 p-4 text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">SOLDE</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {rapport.declaration.solde?.toLocaleString()} $
                  </p>
                </div>
              </div>

              {/* Pénalités */}
              {rapport.penalites.montant_penalites > 0 && (
                <div className="border border-red-300 bg-red-50 p-4 mb-6">
                  <h3 className="font-semibold text-red-700 mb-2">
                    PÉNALITÉS APPLIQUÉES
                  </h3>
                  <p>
                    <strong>Montant pénalités:</strong>{" "}
                    {rapport.penalites.montant_penalites.toLocaleString()} $
                  </p>
                  <p>
                    <strong>Détails:</strong> {rapport.penalites.details}
                  </p>
                  <p>
                    <strong>Total avec pénalités:</strong>{" "}
                    {(
                      rapport.declaration.montant_du +
                      rapport.penalites.montant_penalites
                    ).toLocaleString()}{" "}
                    $
                  </p>
                </div>
              )}

              {/* Bénéficiaires */}
              {rapport.beneficiaires.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                    RÉPARTITION DES BÉNÉFICIAIRES
                  </h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left">
                          Bénéficiaire
                        </th>
                        <th className="border border-gray-300 p-3 text-left">
                          Téléphone
                        </th>
                        <th className="border border-gray-300 p-3 text-left">
                          Compte
                        </th>
                        <th className="border border-gray-300 p-3 text-center">
                          Type Part
                        </th>
                        <th className="border border-gray-300 p-3 text-right">
                          Montant ($)
                        </th>
                        <th className="border border-gray-300 p-3 text-right">
                          Pourcentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapport.beneficiaires.map((beneficiaire, index) => (
                        <tr
                          key={beneficiaire.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="border border-gray-300 p-3">
                            {beneficiaire.nom}
                          </td>
                          <td className="border border-gray-300 p-3">
                            {beneficiaire.telephone}
                          </td>
                          <td className="border border-gray-300 p-3">
                            {beneficiaire.numero_compte}
                          </td>
                          <td className="border border-gray-300 p-3 text-center capitalize">
                            {beneficiaire.type_part}
                          </td>
                          <td className="border border-gray-300 p-3 text-right font-semibold">
                            {beneficiaire.montant.toLocaleString()} $
                          </td>
                          <td className="border border-gray-300 p-3 text-right">
                            {(
                              (beneficiaire.montant /
                                rapport.total_beneficiaires) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-800 text-white font-bold">
                        <td
                          colSpan={4}
                          className="border border-gray-300 p-3 text-right"
                        >
                          TOTAL
                        </td>
                        <td className="border border-gray-300 p-3 text-right">
                          {rapport.total_beneficiaires.toLocaleString()} $
                        </td>
                        <td className="border border-gray-300 p-3 text-right">
                          100%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Détails des paiements */}
              {rapport.declaration.details_paiements &&
                rapport.declaration.details_paiements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                      DÉTAILS DES PAIEMENTS
                    </h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">
                            Date
                          </th>
                          <th className="border border-gray-300 p-3 text-left">
                            Méthode
                          </th>
                          <th className="border border-gray-300 p-3 text-left">
                            Lieu
                          </th>
                          <th className="border border-gray-300 p-3 text-right">
                            Montant ($)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapport.declaration.details_paiements.map(
                          (paiement: any, index: number) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="border border-gray-300 p-3">
                                {new Date(
                                  paiement.date_paiement
                                ).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 p-3 capitalize">
                                {paiement.methode_paiement}
                              </td>
                              <td className="border border-gray-300 p-3 capitalize">
                                {paiement.lieu_paiement}
                              </td>
                              <td className="border border-gray-300 p-3 text-right font-semibold">
                                {paiement.montant.toLocaleString()} $
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Signature */}
              <div className="mt-12 flex justify-end">
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 w-64 mt-16 mb-2"></div>
                  <p className="text-sm text-gray-600">Signature et cachet</p>
                  <p className="text-sm font-semibold">
                    Le Directeur des Impôts
                  </p>
                </div>
              </div>

              {/* Pied de page */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                <p>Document généré électroniquement - Valable sans signature</p>
                <p>
                  Date de génération: {new Date().toLocaleDateString()} à{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
