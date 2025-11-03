// ClientSimpleForm.tsx avec intégration de FactureA4
"use client";
import { useState } from "react";
import { Save, User, Car, Calculator, X } from "lucide-react";
import {
  soumettreCommandePlaques,
  verifierStockDisponible,
} from "@/services/client-simple/clientSimpleService";
import FactureA4 from "./FactureA4";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nombrePlaques: string;
}

interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule?: string;
}

interface ClientSimpleFormProps {
  impotId: string;
  utilisateur: Utilisateur | null;
}

interface PaiementData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
}

// Interface pour les données de facture compatibles avec FactureA4
interface FactureData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  montant: number;
  montant_initial: number;
  mode_paiement: string;
  operateur: string;
  numero_transaction: string;
  date_paiement: string;
  nombre_plaques: number;
  site_nom: string;
  caissier: string;
  numeros_plaques: string[];
  reduction_type?: string;
  reduction_valeur?: number;
}

export default function ClientSimpleForm({
  impotId,
  utilisateur,
}: ClientSimpleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    nombrePlaques: "1",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showFacture, setShowFacture] = useState(false);
  const [factureData, setFactureData] = useState<FactureData | null>(null);
  const [paiementData, setPaiementData] = useState<PaiementData>({
    modePaiement: "mobile_money",
  });

  // Calculs
  const montantUnitaire = utilisateur?.formule
    ? parseFloat(utilisateur.formule)
    : 32;
  const nombrePlaques = parseInt(formData.nombrePlaques) || 1;
  const montantTotal = montantUnitaire * nombrePlaques;

  const montantAPayer = `${montantTotal} $`;
  const formuleCalcul = utilisateur?.formule
    ? `Montant = ${utilisateur.formule} × ${nombrePlaques} plaque(s)`
    : `Montant = 32 × ${nombrePlaques} plaque(s)`;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le téléphone est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse est obligatoire";

    const nbPlaques = parseInt(formData.nombrePlaques);
    if (isNaN(nbPlaques) || nbPlaques < 1) {
      newErrors.nombrePlaques = "Le nombre de plaques doit être au moins 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Vérifier le stock avant de continuer
    const stockResult = await verifierStockDisponible(nombrePlaques);
    if (stockResult.status === "error" || !stockResult.data?.suffisant) {
      alert(
        `Stock insuffisant! Disponible: ${
          stockResult.data?.stock_disponible || 0
        }, Demandé: ${nombrePlaques}`
      );
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmation = () => {
    setShowConfirmation(false);
    setShowPaiement(true);
  };

  const handlePaiementSubmit = async () => {
    if (!utilisateur) {
      alert("Utilisateur non connecté");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await soumettreCommandePlaques(
        impotId,
        {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.adresse,
        },
        {
          nombrePlaques: nombrePlaques,
        },
        paiementData,
        utilisateur
      );

      if (result.status === "success") {
        setShowPaiement(false);

        // Préparer les données pour la facture A4
        const facture: FactureData = {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.adresse,
          montant: result.data?.reduction_appliquee?.montant_final || montantTotal,
          montant_initial: montantTotal,
          mode_paiement: paiementData.modePaiement,
          operateur: paiementData.operateur || "",
          numero_transaction: paiementData.numeroTransaction || "",
          date_paiement: new Date().toISOString(),
          nombre_plaques: nombrePlaques,
          site_nom: utilisateur.site_nom,
          caissier: utilisateur.nom_complet,
          numeros_plaques: result.data?.numeroPlaques || [],
          reduction_type: result.data?.reduction_appliquee?.type,
          reduction_valeur: result.data?.reduction_appliquee?.valeur,
        };

        setFactureData(facture);
        setShowFacture(true);
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Une erreur est survenue lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFacture = () => {
    setShowFacture(false);
    setFactureData(null);
    // Réinitialiser le formulaire après fermeture de la facture
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      nombrePlaques: "1",
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION ASSUJETTI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informations de l'Assujetti
              </h2>
              <p className="text-gray-600 text-sm">
                Renseignez les informations personnelles du propriétaire
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                placeholder="Entrez votre nom"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nom ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
              )}
            </div>

            {/* PRÉNOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                placeholder="Entrez votre prénom"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prenom ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.prenom && (
                <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
              )}
            </div>

            {/* TÉLÉPHONE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                placeholder="Entrez votre numéro de téléphone"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telephone ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.telephone && (
                <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Entrez votre adresse email"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* ADRESSE */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse physique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                placeholder="Entrez votre adresse complète"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.adresse ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.adresse && (
                <p className="text-red-600 text-sm mt-1">{errors.adresse}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION PLAQUES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Commande de Plaques
              </h2>
              <p className="text-gray-600 text-sm">
                Spécifiez le nombre de plaques à acheter
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de plaques à acheter{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.nombrePlaques}
                onChange={(e) =>
                  handleInputChange("nombrePlaques", e.target.value)
                }
                placeholder="Entrez le nombre de plaques"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nombrePlaques ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.nombrePlaques && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.nombrePlaques}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-2">
                Prix unitaire: {montantUnitaire} $ par plaque
              </p>
            </div>
          </div>
        </div>

        {/* CALCUL ET SOUMISSION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Calcul et Validation
              </h2>
              <p className="text-gray-600 text-sm">
                Montant à payer et soumission de la demande
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <div>
              <div className="text-sm text-gray-600">Détail du calcul</div>
              <div className="text-2xl font-bold text-gray-900">
                {montantAPayer}
              </div>
              <div className="text-xs text-gray-500 mt-1">{formuleCalcul}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Délai d'accord</div>
              <div className="text-lg font-semibold text-green-600">
                Immédiat
              </div>
              {utilisateur && (
                <div className="text-xs text-gray-500 mt-1">
                  Site: {utilisateur.site_nom}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Soumettre la demande</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirmation</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Récapitulatif de la commande
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <strong>Client:</strong> {formData.prenom} {formData.nom}
                  </div>
                  <div>
                    <strong>Téléphone:</strong> {formData.telephone}
                  </div>
                  <div>
                    <strong>Nombre de plaques:</strong> {nombrePlaques}
                  </div>
                  <div>
                    <strong>Montant total:</strong> {montantAPayer}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Êtes-vous sûr de vouloir procéder au paiement de cette commande
                ?
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmation}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
              >
                Confirmer et Payer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Paiement */}
      {showPaiement && (
        <ModalPaiement
          montant={montantAPayer}
          onClose={() => setShowPaiement(false)}
          onSubmit={handlePaiementSubmit}
          isLoading={isSubmitting}
          paiementData={paiementData}
          setPaiementData={setPaiementData}
        />
      )}

      {/* Modal Facture A4 */}
      {showFacture && factureData && (
        <FactureA4 
          factureData={factureData} 
          onClose={handleCloseFacture} 
        />
      )}
    </>
  );
}

// Composant Modal de Paiement
interface ModalPaiementProps {
  montant: string;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  paiementData: PaiementData;
  setPaiementData: (data: PaiementData) => void;
}

function ModalPaiement({
  montant,
  onClose,
  onSubmit,
  isLoading,
  paiementData,
  setPaiementData,
}: ModalPaiementProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Mode de Paiement</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mode de paiement *
            </label>
            <select
              value={paiementData.modePaiement}
              onChange={(e) =>
                setPaiementData({
                  ...paiementData,
                  modePaiement: e.target.value as any,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="banque">Banque</option>
              <option value="espece">Espèce</option>
            </select>
          </div>

          {/* Champs conditionnels */}
          {paiementData.modePaiement === "mobile_money" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Opérateur *
                </label>
                <select
                  value={paiementData.operateur || ""}
                  onChange={(e) =>
                    setPaiementData({
                      ...paiementData,
                      operateur: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Sélectionner un opérateur</option>
                  <option value="vodacom">Vodacom</option>
                  <option value="airtel">Airtel</option>
                  <option value="africel">Africel</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Numéro de transaction *
                </label>
                <input
                  type="text"
                  value={paiementData.numeroTransaction || ""}
                  onChange={(e) =>
                    setPaiementData({
                      ...paiementData,
                      numeroTransaction: e.target.value,
                    })
                  }
                  placeholder="Entrez le numéro de transaction"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </>
          )}

          {paiementData.modePaiement === "cheque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de chèque *
              </label>
              <input
                type="text"
                value={paiementData.numeroCheque || ""}
                onChange={(e) =>
                  setPaiementData({
                    ...paiementData,
                    numeroCheque: e.target.value,
                  })
                }
                placeholder="Entrez le numéro de chèque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {paiementData.modePaiement === "banque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Banque *
              </label>
              <input
                type="text"
                value={paiementData.banque || ""}
                onChange={(e) =>
                  setPaiementData({
                    ...paiementData,
                    banque: e.target.value,
                  })
                }
                placeholder="Entrez le nom de la banque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {/* Montant */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Montant à payer
            </div>
            <div className="text-3xl font-bold text-blue-800">{montant}</div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold border-2 border-transparent hover:border-gray-300"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}