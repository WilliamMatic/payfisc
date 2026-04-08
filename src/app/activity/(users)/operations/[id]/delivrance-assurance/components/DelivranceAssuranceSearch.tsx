"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, AlertCircle, Loader2, Ticket, CheckCircle,
  XCircle, ShieldCheck, RefreshCw, Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AssujettiInfo from "./AssujettiInfo";
import EnginInfo from "./EnginInfo";
import ConfirmationModal from "../modals/ConfirmationModal";
import SuccessDelivranceModal from "../modals/SuccessDelivranceModal";
import {
  verifierReferenceBancaire,
  verifierDGRK,
  rechercherToutesBasesExternes,
  verifierAssuranceExistante,
  delivrerAssuranceGroupee,
} from "@/services/assurance-moto/assuranceMotoService";
import { useAuth } from "@/contexts/AuthContext";
import { Assujetti, Engin } from "./types";

interface Impot {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  prix?: number;
}

interface ReferenceInfo {
  paiement_bancaire_id: number;
  reference_bancaire: string;
  id_paiement: number;
  nombre_declarations: number;
  livres: number;
  restant: number;
  impot_id: number | null;
  montant_total: number;
  date_creation: string;
}

interface DelivranceAssuranceSearchProps {
  impot: Impot;
  initialRef?: string;
  initialPlaque?: string;
}

export default function DelivranceAssuranceSearch({ impot, initialRef, initialPlaque }: DelivranceAssuranceSearchProps) {
  const { utilisateur } = useAuth();
  const router = useRouter();

  // Étape 1: Référence
  const [reference, setReference] = useState("");
  const [referenceVerifiee, setReferenceVerifiee] = useState(false);
  const [referenceInfo, setReferenceInfo] = useState<ReferenceInfo | null>(null);
  const [isLoadingRef, setIsLoadingRef] = useState(false);

  // Étape 2: Plaque
  const [plaque, setPlaque] = useState("");
  const [isLoadingPlaque, setIsLoadingPlaque] = useState(false);
  const [searchStep, setSearchStep] = useState<string | null>(null);
  const [resultat, setResultat] = useState<{ assujetti: Assujetti; engin: Engin } | null>(null);

  // Étape 3: Numéro assurance + vérification existante
  const [numeroAssurance, setNumeroAssurance] = useState("");
  const [assuranceExistante, setAssuranceExistante] = useState(false);
  const [assuranceExpiree, setAssuranceExpiree] = useState(false);
  const [assuranceMessage, setAssuranceMessage] = useState<string | null>(null);

  // Global
  const [error, setError] = useState<string | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  // Modaux
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [successData, setSuccessData] = useState<any>(null);

  const validatePlaque = (value: string): boolean => /^[A-Za-z]{2}\d{3}$/.test(value);
  const autoFillDone = useRef(false);

  // Auto-fill depuis URL params (retour inscription)
  useEffect(() => {
    if (autoFillDone.current) return;
    if (initialRef && !referenceVerifiee) {
      autoFillDone.current = true;
      setReference(initialRef);
      (async () => {
        setIsLoadingRef(true);
        try {
          const result = await verifierReferenceBancaire(initialRef, impot.id);
          if (result.status === "success" && result.data) {
            setReferenceVerifiee(true);
            setReferenceInfo(result.data);
            if (initialPlaque) setPlaque(initialPlaque);
          }
        } catch {
          setError("Erreur lors de la vérification de la référence");
        } finally {
          setIsLoadingRef(false);
        }
      })();
    }
  }, [initialRef, initialPlaque]); // eslint-disable-line react-hooks/exhaustive-deps

  // Étape 1: Vérifier la référence
  const handleVerifierReference = async () => {
    const ref = reference.toUpperCase().trim();
    if (!ref) { setError("Veuillez entrer un numéro de référence"); return; }
    setError(null);
    setIsLoadingRef(true);
    setReferenceVerifiee(false);
    setReferenceInfo(null);
    resetPlaqueState();

    try {
      const result = await verifierReferenceBancaire(ref, impot.id);
      if (result.status === "success" && result.data) {
        setReferenceVerifiee(true);
        setReferenceInfo(result.data);
      } else {
        setError(result.message || "Référence non trouvée");
      }
    } catch {
      setError("Erreur lors de la vérification de la référence");
    } finally {
      setIsLoadingRef(false);
    }
  };

  // Étape 2: Rechercher la plaque
  const handleSearchPlaque = async () => {
    const plaqueUpper = plaque.toUpperCase();
    if (!validatePlaque(plaqueUpper)) {
      setError("Format de plaque invalide. Utilisez: AA256 (2 lettres + 3 chiffres)");
      return;
    }
    setError(null);
    setResultat(null);
    setAssuranceExistante(false);
    setAssuranceExpiree(false);
    setAssuranceMessage(null);
    setNumeroAssurance("");
    setIsLoadingPlaque(true);

    const mapResult = (data: { assujetti: Record<string, string | number>; engin: Record<string, string | number> }) => ({
      assujetti: {
        id: Number(data.assujetti.id) || 0,
        nom_complet: String(data.assujetti.nom_complet || ""),
        telephone: String(data.assujetti.telephone || ""),
        adresse: String(data.assujetti.adresse || ""),
        nif: String(data.assujetti.nif || ""),
        email: String(data.assujetti.email || ""),
        particulier_id: Number(data.assujetti.particulier_id || data.assujetti.id || 0),
      } as Assujetti,
      engin: {
        id: Number(data.engin.id) || 0,
        numero_plaque: String(data.engin.numero_plaque || plaqueUpper),
        marque: String(data.engin.marque || ""),
        modele: String(data.engin.modele || ""),
        couleur: String(data.engin.couleur || ""),
        energie: String(data.engin.energie || ""),
        usage_engin: String(data.engin.usage || data.engin.usage_engin || ""),
        puissance_fiscal: String(data.engin.puissance_fiscal || ""),
        annee_fabrication: String(data.engin.annee_fabrication || ""),
        annee_circulation: String(data.engin.annee_circulation || ""),
        numero_chassis: String(data.engin.numero_chassis || ""),
        numero_moteur: String(data.engin.numero_moteur || ""),
        type_engin: String(data.engin.type_engin || ""),
      } as Engin,
    });

    try {
      setSearchStep("Vérification dans la base locale...");
      const siteCode = utilisateur?.site_code || "";
      const extensionSite = utilisateur?.extension_site ?? 0;
      const localResult = await verifierDGRK(plaqueUpper, siteCode, extensionSite);

      if (localResult.status === "success" && localResult.data) {
        const mapped = mapResult(localResult.data as unknown as { assujetti: Record<string, string | number>; engin: Record<string, string | number> });
        setResultat(mapped);
        await checkAssuranceStatus(plaqueUpper);
        setSearchStep(null);
        setIsLoadingPlaque(false);
        return;
      }

      setSearchStep("Recherche dans les bases externes...");
      const externeResult = await rechercherToutesBasesExternes(
        plaqueUpper,
        (nomBase) => setSearchStep(`Recherche dans ${nomBase}...`)
      );

      if (externeResult.status === "success" && externeResult.data) {
        const mapped = mapResult(externeResult.data as unknown as { assujetti: Record<string, string | number>; engin: Record<string, string | number> });
        setResultat(mapped);
        await checkAssuranceStatus(plaqueUpper);
        setSearchStep(null);
        setIsLoadingPlaque(false);
        return;
      }

      setSearchStep(null);
      setIsLoadingPlaque(false);
      router.push(
        `/activity/operations/${impot.id}/delivrance-assurance/inscription?plaque=${encodeURIComponent(plaque.toUpperCase())}&reference=${encodeURIComponent(reference)}`
      );
    } catch {
      setError("Erreur lors de la recherche de plaque");
      setSearchStep(null);
      setIsLoadingPlaque(false);
    }
  };

  const checkAssuranceStatus = async (plaqueUpper: string) => {
    const verifResult = await verifierAssuranceExistante(plaqueUpper);
    if (verifResult.status === "success" && verifResult.existe) {
      if (verifResult.assurance_active) {
        setAssuranceExistante(true);
        setAssuranceMessage(verifResult.message || "Une assurance valide existe déjà pour cette plaque.");
      } else {
        setAssuranceExpiree(true);
        setAssuranceMessage(verifResult.message || "L'assurance de cette plaque a expiré.");
      }
    }
  };

  // Étape 3: Délivrer
  const handleDelivrerClick = () => {
    if (!numeroAssurance.trim()) { setError("Veuillez entrer le numéro d'assurance physique"); return; }
    setError(null);
    setShowConfirmationModal(true);
  };

  const handleConfirmDelivrance = async () => {
    setShowConfirmationModal(false);
    if (!resultat || !referenceInfo) return;
    setIsDelivering(true);
    setError(null);

    try {
      const result = await delivrerAssuranceGroupee({
        reference_bancaire: referenceInfo.reference_bancaire,
        numero_assurance: numeroAssurance.trim(),
        engin_id: resultat.engin.id,
        particulier_id: resultat.assujetti.particulier_id || resultat.assujetti.id,
        utilisateur_id: utilisateur?.id || 0,
        utilisateur_name: utilisateur?.nom_complet || "",
        impot_id: referenceInfo.impot_id,
      });

      if (result.status === "success" && result.data) {
        setSuccessData({ ...result.data, assujetti: resultat.assujetti, engin: resultat.engin });
        setShowSuccessModal(true);
        setReferenceInfo((prev) =>
          prev ? { ...prev, livres: result.data!.compteur.livres, restant: result.data!.compteur.restant } : prev
        );
      } else {
        setError(result.message || "Erreur lors de la délivrance");
      }
    } catch {
      setError("Erreur réseau lors de la délivrance");
    } finally {
      setIsDelivering(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
    resetPlaqueState();
    if (referenceInfo && referenceInfo.restant <= 0) {
      setReference("");
      setReferenceVerifiee(false);
      setReferenceInfo(null);
    } else if (referenceInfo) {
      verifierReferenceBancaire(referenceInfo.reference_bancaire, impot.id).then((res) => {
        if (res.status === "success" && res.data) setReferenceInfo(res.data);
      });
    }
  };

  const resetPlaqueState = () => {
    setPlaque("");
    setResultat(null);
    setNumeroAssurance("");
    setAssuranceExistante(false);
    setAssuranceExpiree(false);
    setAssuranceMessage(null);
    setError(null);
  };

  const handleResetAll = () => {
    setReference("");
    setReferenceVerifiee(false);
    setReferenceInfo(null);
    resetPlaqueState();
  };

  return (
    <>
      {/* Étape 1: Référence bancaire */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">1</div>
          <h3 className="text-lg font-bold text-gray-900">Référence bancaire</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text" value={reference}
              onChange={(e) => { setReference(e.target.value.toUpperCase()); setError(null); if (referenceVerifiee) { setReferenceVerifiee(false); setReferenceInfo(null); resetPlaqueState(); } }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifierReference()}
              placeholder="Numéro de référence (ex: ASS-123456789-123)"
              className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              disabled={isLoadingRef}
            />
          </div>
          <button onClick={handleVerifierReference} disabled={isLoadingRef || !reference.trim()}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200/50 flex items-center justify-center min-w-[160px]">
            {isLoadingRef ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Vérification...</>) : (<><Search className="w-5 h-5 mr-2" />Vérifier</>)}
          </button>
        </div>

        {referenceVerifiee && referenceInfo && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
                <div>
                  <p className="text-emerald-800 font-semibold text-sm">Référence vérifiée: {referenceInfo.reference_bancaire}</p>
                  <p className="text-emerald-600 text-xs mt-1">Montant total: {referenceInfo.montant_total}$ &middot; Créée le {new Date(referenceInfo.date_creation).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white rounded-lg px-4 py-2 border border-emerald-200">
                  <Package className="w-4 h-4 text-emerald-600 mr-2" />
                  <span className="text-sm font-bold text-emerald-800">{referenceInfo.livres}/{referenceInfo.nombre_declarations}</span>
                  <span className="text-xs text-emerald-600 ml-1">livrées</span>
                </div>
                <div className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm font-bold">
                  {referenceInfo.restant} restante{referenceInfo.restant > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && !resultat && !isLoadingPlaque && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Étape 2: Recherche plaque */}
      {referenceVerifiee && referenceInfo && referenceInfo.restant > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">2</div>
            <h3 className="text-lg font-bold text-gray-900">Recherche plaque</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" value={plaque}
                onChange={(e) => { setPlaque(e.target.value.toUpperCase()); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && !isLoadingPlaque && handleSearchPlaque()}
                placeholder="Entrez la plaque (ex: AA256)"
                className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                maxLength={5} disabled={isLoadingPlaque}
              />
              {plaque && !validatePlaque(plaque) && (
                <div className="absolute inset-y-0 right-4 flex items-center"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
              )}
            </div>
            <button onClick={handleSearchPlaque} disabled={isLoadingPlaque || !plaque}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200/50 flex items-center justify-center min-w-[140px]">
              {isLoadingPlaque ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Recherche...</>) : (<><Search className="w-5 h-5 mr-2" />Rechercher</>)}
            </button>
          </div>
          {isLoadingPlaque && searchStep && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3 flex-shrink-0" />
              <p className="text-blue-700 text-sm font-medium">{searchStep}</p>
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
            Format: 2 lettres + 3 chiffres (ex: AA256, AR784, EC012)
          </div>
        </div>
      )}

      {/* Étape 3: Résultats + Délivrance */}
      {resultat && referenceVerifiee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1"><AssujettiInfo assujetti={resultat.assujetti} /></div>
          <div className="lg:col-span-2">
            <EnginInfo engin={resultat.engin} />

            {assuranceExistante && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-emerald-800 text-sm font-semibold">Assurance active</p>
                  <p className="text-emerald-600 text-xs">{assuranceMessage}</p>
                </div>
              </div>
            )}

            {assuranceExpiree && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 text-sm font-semibold">Assurance expirée</p>
                  <p className="text-amber-600 text-xs">{assuranceMessage}</p>
                </div>
              </div>
            )}

            {!assuranceExistante && (
              <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">3</div>
                  <h4 className="font-semibold text-gray-900 text-sm">Numéro d&apos;assurance physique</h4>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input type="text" value={numeroAssurance}
                      onChange={(e) => { setNumeroAssurance(e.target.value); setError(null); }}
                      placeholder="Entrez le N° d'assurance physique"
                      className="block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      disabled={isDelivering}
                    />
                    {error && resultat && <p className="text-red-600 text-xs mt-1">{error}</p>}
                  </div>
                  <button onClick={handleDelivrerClick} disabled={isDelivering || !numeroAssurance.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200/50 hover:shadow-xl flex items-center justify-center">
                    {isDelivering ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Délivrance...</>) : (<><Ticket className="w-5 h-5 mr-2" />Délivrer (0$)</>)}
                  </button>
                </div>
              </div>
            )}

            {assuranceExpiree && (
              <div className="mt-4 flex justify-end">
                <button onClick={() => router.push(`/activity/operations/${impot.id}/renouvellement-assurance`)}
                  className="px-8 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 shadow-lg shadow-amber-200/50 hover:shadow-xl">
                  <RefreshCw className="w-5 h-5 mr-2" />Renouveler l&apos;assurance
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {referenceVerifiee && (
        <div className="flex justify-center">
          <button onClick={handleResetAll} className="text-sm text-gray-500 hover:text-gray-700 underline">Nouvelle référence</button>
        </div>
      )}

      {/* Modaux */}
      <ConfirmationModal isOpen={showConfirmationModal} onClose={() => setShowConfirmationModal(false)} onSuccess={handleConfirmDelivrance}
        assujetti={resultat?.assujetti} engin={resultat?.engin} numeroAssurance={numeroAssurance} referenceInfo={referenceInfo} />
      <SuccessDelivranceModal isOpen={showSuccessModal} onClose={handleSuccessClose} data={successData} />
    </>
  );
}
