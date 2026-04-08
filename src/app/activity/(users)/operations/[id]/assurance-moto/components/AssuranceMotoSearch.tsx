"use client";

import { useState } from "react";
import { Search, AlertCircle, Loader2, ShieldCheck, RefreshCw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import AssujettiInfo from "./AssujettiInfo";
import EnginInfo from "./EnginInfo";
import PaiementModal from "../modals/PaiementModal";
import SuccessModal from "../modals/SuccessModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  verifierDGRK,
  rechercherToutesBasesExternes,
  verifierAssuranceExistante,
} from "@/services/assurance-moto/assuranceMotoService";
import { Assujetti, Engin } from "./types";

interface Impot {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  prix: number;
}

interface AssuranceMotoSearchProps {
  impot: Impot;
  prix: number;
  tauxCdf: number;
}

export default function AssuranceMotoSearch({ impot, prix, tauxCdf }: AssuranceMotoSearchProps) {
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [plaque, setPlaque] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchStep, setSearchStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{
    assujetti: Assujetti;
    engin: Engin;
  } | null>(null);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paiementData, setPaiementData] = useState<any>(null);
  const [assuranceExistante, setAssuranceExistante] = useState(false);
  const [assuranceExpiree, setAssuranceExpiree] = useState(false);

  const validatePlaque = (value: string): boolean => {
    const regex = /^[A-Za-z]{2}\d{3}$/;
    return regex.test(value);
  };

  const handleSearch = async () => {
    const plaqueUpper = plaque.toUpperCase();

    if (!validatePlaque(plaqueUpper)) {
      setError(
        "Format de plaque invalide. Utilisez le format: AA256 (2 lettres + 3 chiffres)",
      );
      return;
    }

    setError(null);
    setResultat(null);
    setAssuranceExistante(false);
    setAssuranceExpiree(false);
    setIsLoading(true);

    const mapResult = (data: any) => {
      const assujetti: Assujetti = {
        id: data.assujetti.id,
        nom_complet: data.assujetti.nom_complet,
        telephone: data.assujetti.telephone,
        adresse: data.assujetti.adresse,
        nif: data.assujetti.nif,
        email: data.assujetti.email,
        particulier_id: data.assujetti.particulier_id,
      };
      const engin: Engin = {
        id: data.engin.id,
        numero_plaque: data.engin.numero_plaque,
        marque: data.engin.marque,
        modele: data.engin.modele || "",
        couleur: data.engin.couleur,
        energie: data.engin.energie,
        usage_engin: data.engin.usage,
        puissance_fiscal: data.engin.puissance_fiscal,
        annee_fabrication: data.engin.annee_fabrication,
        annee_circulation: data.engin.annee_circulation,
        numero_chassis: data.engin.numero_chassis,
        numero_moteur: data.engin.numero_moteur,
        type_engin: data.engin.type_engin,
      };
      return { assujetti, engin };
    };

    try {
      // Étape 1 : Vérification locale (verifier_dgrk)
      setSearchStep("Vérification dans la base locale...");
      const siteCode = utilisateur?.site_code || "";
      const extensionSite = utilisateur?.extension_site ?? 0;
      const localResult = await verifierDGRK(plaqueUpper, siteCode, extensionSite);

      if (localResult.status === "success" && localResult.data) {
        setResultat(mapResult(localResult.data));
        const verifResult = await verifierAssuranceExistante(plaqueUpper);
        if (verifResult.status === "success" && verifResult.existe) {
          if (verifResult.assurance_active) {
            setAssuranceExistante(true);
            setError(verifResult.message || "Une assurance valide existe déjà pour cette plaque.");
          } else {
            setAssuranceExpiree(true);
            setError(verifResult.message || "L'assurance de cette plaque a expiré. Veuillez procéder au renouvellement.");
          }
        }
        setSearchStep(null);
        setIsLoading(false);
        return;
      }

      // Étape 2 : Recherche dans toutes les bases externes (TSC → HAOJUE → TVS)
      setSearchStep("Recherche dans les bases externes...");
      const externeResult = await rechercherToutesBasesExternes(
        plaqueUpper,
        (nomBase) => setSearchStep(`Recherche dans ${nomBase}...`)
      );

      if (externeResult.status === "success" && externeResult.data) {
        setResultat(mapResult(externeResult.data));
        const verifResult = await verifierAssuranceExistante(plaqueUpper);
        if (verifResult.status === "success" && verifResult.existe) {
          if (verifResult.assurance_active) {
            setAssuranceExistante(true);
            setError(verifResult.message || "Une assurance valide existe déjà pour cette plaque.");
          } else {
            setAssuranceExpiree(true);
            setError(verifResult.message || "L'assurance de cette plaque a expiré. Veuillez procéder au renouvellement.");
          }
        }
        setSearchStep(null);
        setIsLoading(false);
        return;
      }

      // Étape 3 : Plaque introuvable → redirection vers le formulaire d'inscription
      setSearchStep(null);
      setIsLoading(false);
      router.push(`/activity/operations/${impot.id}/assurance-moto/inscription?plaque=${encodeURIComponent(plaqueUpper)}`);
    } catch (err) {
      console.error("Erreur recherche plaque:", err);
      setError("Erreur lors de la recherche. Veuillez réessayer.");
      setSearchStep(null);
      setIsLoading(false);
    }
  };

  const handleSouscrireAssurance = () => {
    setShowPaiementModal(true);
  };

  const handlePaiementSuccess = (data: any) => {
    setPaiementData(data);
    setShowPaiementModal(false);
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 100);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setResultat(null);
    setPlaque("");
    setAssuranceExistante(false);
    setAssuranceExpiree(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={plaque}
              onChange={(e) => {
                setPlaque(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Entrez la plaque (ex: AA256)"
              className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              maxLength={5}
              disabled={isLoading}
            />
            {plaque && !validatePlaque(plaque) && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !plaque}
            className={`
              px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 
              text-white font-semibold rounded-xl
              hover:from-emerald-700 hover:to-emerald-600
              transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-emerald-200/50 hover:shadow-xl
              flex items-center justify-center min-w-[140px]
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Recherche...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </>
            )}
          </button>
        </div>

        {isLoading && searchStep && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3 flex-shrink-0" />
            <p className="text-blue-700 text-sm font-medium">{searchStep}</p>
          </div>
        )}

        {error && !assuranceExistante && !assuranceExpiree && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
          Format: 2 lettres suivies de 3 chiffres (ex: AA256, AR784, EC012)
        </div>
      </div>

      {resultat && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AssujettiInfo assujetti={resultat.assujetti} />
          </div>

          <div className="lg:col-span-2">
            <EnginInfo engin={resultat.engin} />

            <div className="mt-6 flex justify-end gap-3">
              {assuranceExistante && (
                <div className="flex-1 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-800 text-sm font-semibold">Assurance active</p>
                    <p className="text-emerald-600 text-xs">{error}</p>
                  </div>
                </div>
              )}
              {assuranceExpiree && (
                <div className="flex-1 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-amber-800 text-sm font-semibold">Assurance expirée</p>
                    <p className="text-amber-600 text-xs">{error}</p>
                  </div>
                </div>
              )}
              {assuranceExpiree ? (
                <button
                  onClick={() => router.push(`/activity/operations/${impot.id}/assurance-moto`)}
                  className="px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-lg shadow-amber-200/50 hover:shadow-xl"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Renouveler l&apos;assurance
                </button>
              ) : (
                <button
                  onClick={handleSouscrireAssurance}
                  disabled={assuranceExistante}
                  className={`
                    px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center
                    ${assuranceExistante 
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-60' 
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-200/50 hover:shadow-xl'}
                  `}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  {assuranceExistante ? "Assurance déjà souscrite" : `Souscrire l'assurance (${prix}$)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <PaiementModal
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        onSuccess={handlePaiementSuccess}
        montant={prix}
        assujetti={resultat?.assujetti}
        engin={resultat?.engin}
        impotId={impot.id}
        utilisateur={utilisateur}
        tauxCdf={tauxCdf}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        data={paiementData}
      />
    </>
  );
}
