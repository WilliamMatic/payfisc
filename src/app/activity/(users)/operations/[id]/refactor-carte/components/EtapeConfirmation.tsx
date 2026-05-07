"use client";
import { User, Car, Hash, ArrowLeft, RefreshCw, Loader } from "lucide-react";
import { type DonneesRefactor } from "@/services/refactor/refactorService";
import { type TypeEngin } from "@/services/type-engins/typeEnginService";
import { type RefactorFormData, type Etape } from "./types";

interface EtapeConfirmationProps {
  formData: RefactorFormData;
  handleInputChange: (field: keyof RefactorFormData, value: string) => void;
  donneesRefactor: DonneesRefactor | null;
  typeEngins: TypeEngin[];
  isLoading: boolean;
  traiterRefactorisation: () => void;
  setEtapeActuelle: (etape: Etape) => void;
  setErreurVerification: (v: string) => void;
  onChassisBlur?: () => void;
  verificationChassisLoading?: boolean;
}

export default function EtapeConfirmation({
  formData,
  handleInputChange,
  donneesRefactor,
  typeEngins,
  isLoading,
  traiterRefactorisation,
  setEtapeActuelle,
  setErreurVerification,
  onChassisBlur,
  verificationChassisLoading = false,
}: EtapeConfirmationProps) {
  const isExterne = donneesRefactor?.source === "externe";
  const isCarteReprint = donneesRefactor?.source === "carte_reprint";
  const isNouveau = isExterne || isCarteReprint;

  let badgeLabel = "✓ Données MPAKO";
  let badgeClass = "bg-green-100 text-green-800";
  if (isCarteReprint) {
    badgeLabel = "✓ Données carte_reprint";
    badgeClass = "bg-amber-100 text-amber-800";
  } else if (isExterne) {
    badgeLabel = "✓ Données externes";
    badgeClass = "bg-blue-100 text-blue-800";
  }

  let titreEntete = `Informations Récupérées - ID DGRK: ${formData.numeroPlaque}`;
  if (isCarteReprint) {
    titreEntete = `Données récupérées depuis carte_reprint - Plaque: ${formData.numeroPlaque}`;
  } else if (isExterne) {
    titreEntete = `Données récupérées depuis base externe - Plaque: ${formData.numeroPlaque}`;
  }

  return (
    <div className="space-y-8">
      {/* EN-TÊTE AVEC DONNÉES RÉCUPÉRÉES */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-700">
            {titreEntete}
          </h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>

        {isCarteReprint && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-[13px]">
              <strong>Note:</strong> Ces données proviennent de la table <code>carte_reprint</code>.
              Un nouveau paiement sera créé (avec la date d'origine) et l'<code>id_paiement</code>
              de la ligne carte_reprint sera mis à jour. Montant : <strong>0$</strong>.
            </p>
          </div>
        )}

        {isExterne && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-[13px]">
              <strong>Note:</strong> Ces données proviennent de la base externe.
              Un nouvel enregistrement sera créé avec un montant de{" "}
              <strong>0$</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div>
            <span className="text-gray-500">Numéro de Plaque:</span>
            <div className="text-gray-700 font-medium">{formData.numeroPlaque}</div>
          </div>
          <div>
            <span className="text-gray-500">Propriétaire:</span>
            <div className="text-gray-700 font-medium">
              {formData.prenom} {formData.nom}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Montant:</span>
            <div className="text-gray-700 font-medium">
              {isNouveau
                ? "0 $ (Nouvel enregistrement)"
                : `${donneesRefactor?.montant || 0} $`}
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS ASSUJETTI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
            <User className="w-5 h-5 text-[#2D5B7A]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              Informations de l&apos;Assujetti
            </h2>
            <p className="text-[13px] text-gray-600">
              {isNouveau
                ? "Vérifiez et complétez les informations personnelles du propriétaire"
                : "Corrigez les informations personnelles du propriétaire"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Entrez le nom"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => handleInputChange("prenom", e.target.value)}
              placeholder="Entrez le prénom"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleInputChange("telephone", e.target.value)}
              placeholder="Ex: +243 00 00 00 000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse physique <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => handleInputChange("adresse", e.target.value)}
              placeholder="Entrez l'adresse complète"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro d&apos;Identification Fiscale (NIF)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleInputChange("nif", e.target.value)}
                placeholder="NIF"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
                <Hash className="w-5 h-5 text-[#2D5B7A]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS VÉHICULE */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
            <Car className="w-5 h-5 text-[#2D5B7A]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              Informations de l&apos;Engin
            </h2>
            <p className="text-[13px] text-gray-600">
              {isNouveau
                ? "Vérifiez et complétez les caractéristiques techniques du véhicule"
                : "Corrigez les caractéristiques techniques du véhicule"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d&apos;engin <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.typeEngin}
              onChange={(e) => handleInputChange("typeEngin", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner le type d&apos;engin</option>
              {typeEngins.map((option) => (
                <option key={option.id} value={option.libelle}>
                  {option.libelle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => handleInputChange("marque", e.target.value)}
              placeholder="Entrez la marque du véhicule"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Énergie
            </label>
            <input
              type="text"
              value={formData.energie}
              onChange={(e) => handleInputChange("energie", e.target.value)}
              placeholder="Ex: Essence, Diesel, Electrique"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de fabrication
            </label>
            <input
              type="text"
              value={formData.anneeFabrication}
              onChange={(e) =>
                handleInputChange("anneeFabrication", e.target.value)
              }
              placeholder="Ex: 2023"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de circulation
            </label>
            <input
              type="text"
              value={formData.anneeCirculation}
              onChange={(e) =>
                handleInputChange("anneeCirculation", e.target.value)
              }
              placeholder="Ex: 2023"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <input
              type="text"
              value={formData.couleur}
              onChange={(e) => handleInputChange("couleur", e.target.value)}
              placeholder="Ex: Rouge, Noir, Blanc"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
            <input
              type="text"
              value={formData.puissanceFiscal}
              onChange={(e) =>
                handleInputChange("puissanceFiscal", e.target.value)
              }
              placeholder="Ex: 10 CV, 15 CV"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.usage}
              onChange={(e) => handleInputChange("usage", e.target.value)}
              placeholder="Ex: Personnel, Transport, Commerce"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de châssis
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.numeroChassis}
                onChange={(e) =>
                  handleInputChange("numeroChassis", e.target.value)
                }
                onBlur={onChassisBlur}
                placeholder="Entrez le numéro de châssis"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              {verificationChassisLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de moteur
            </label>
            <input
              type="text"
              value={formData.numeroMoteur}
              onChange={(e) =>
                handleInputChange("numeroMoteur", e.target.value)
              }
              placeholder="Entrez le numéro de moteur"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* VALIDATION */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between p-6 bg-[#2D5B7A]/5 rounded-xl border border-[#2D5B7A]/15 mb-6">
          <div>
            <h4 className="font-semibold text-[#2D5B7A] text-[13px]">
              Service de Correction
            </h4>
            <div className="text-[18px] font-semibold text-[#2D5B7A]">
              {isNouveau
                ? "Création d'un nouvel enregistrement"
                : "Refactorisation des données"}
            </div>
            <div className="text-[13px] font-medium text-[#2D5B7A]/80 mt-2">
              {isNouveau
                ? "Montant: 0$ (Nouvelle création)"
                : "Aucun frais supplémentaire"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-[#2D5B7A] font-medium">Statut</div>
            <div className="text-[15px] font-semibold text-green-600">
              {isCarteReprint
                ? "Refactor carte_reprint"
                : isExterne
                  ? "Nouvelle création"
                  : "Correction"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setEtapeActuelle("verification");
              setErreurVerification("");
            }}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium border-2 border-transparent hover:border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <button
            onClick={traiterRefactorisation}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-[#2D5B7A] text-white rounded-xl hover:bg-[#244D68] transition-all duration-200 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {isLoading
                ? "Traitement..."
                : isNouveau
                  ? "Créer l'enregistrement"
                  : "Corriger les données"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
