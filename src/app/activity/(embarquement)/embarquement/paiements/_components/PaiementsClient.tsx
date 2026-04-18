"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTypeEngins, searchEnginByPlaque, enregistrerPaiement,
  getPaiements, getPaiementById, getRepartitionPaiement,
} from "@/services/embarquement/embarquementService";
import {
  TypeEnginEmbarquement, PaiementEmbarquement, RepartitionEmbarquement,
  EnginEmbarquement, Pagination,
} from "@/services/embarquement/types";
import {
  Search, Plus, Eye, X, Check, Loader2, DollarSign, AlertTriangle,
  ChevronLeft, ChevronRight, CreditCard, Banknote, Smartphone, FileText,
  Receipt, Car, User, Printer,
} from "lucide-react";

type Tab = "form" | "list";

export default function PaiementsClient() {
  const { utilisateur } = useAuth();
  const [tab, setTab] = useState<Tab>("form");

  // ======================= FORM STATE =======================
  const [typeEngins, setTypeEngins] = useState<TypeEnginEmbarquement[]>([]);
  const [formTypeId, setFormTypeId] = useState("");
  const [formMontant, setFormMontant] = useState(0);
  const [formModePaiement, setFormModePaiement] = useState("especes");
  const [formNote, setFormNote] = useState("");

  // Plaque search
  const [plaqueSearch, setPlaqueSearch] = useState("");
  const [plaqueLoading, setPlaqueLoading] = useState(false);
  const [enginTrouve, setEnginTrouve] = useState<EnginEmbarquement | null>(null);
  const [enginNotFound, setEnginNotFound] = useState(false);
  const plaqueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Engin fields (manual or auto-filled)
  const [enginMarque, setEnginMarque] = useState("");
  const [enginChassis, setEnginChassis] = useState("");
  const [enginMoteur, setEnginMoteur] = useState("");
  const [enginCouleur, setEnginCouleur] = useState("");

  // Contribuable fields
  const [contribNom, setContribNom] = useState("");
  const [contribPostnom, setContribPostnom] = useState("");
  const [contribPrenom, setContribPrenom] = useState("");
  const [contribSexe, setContribSexe] = useState("M");
  const [contribRole, setContribRole] = useState("chauffeur");
  const [contribTelephone, setContribTelephone] = useState("");
  const [contribAdresse, setContribAdresse] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState<{ reference: string; recu: string; montant: number } | null>(null);

  // ======================= LIST STATE =======================
  const [paiements, setPaiements] = useState<PaiementEmbarquement[]>([]);
  const [listPagination, setListPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [listSearch, setListSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailPaiement, setDetailPaiement] = useState<PaiementEmbarquement | null>(null);
  const [detailRepartition, setDetailRepartition] = useState<RepartitionEmbarquement[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ======================= LOAD TYPE ENGINS =======================
  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getTypeEngins(utilisateur.site_id, 1, 100, "").then((res) => {
      if (res.status === "success" && res.data) setTypeEngins(res.data.type_engins);
    });
  }, [utilisateur?.site_id]);

  // ======================= PLAQUE AUTO-SEARCH =======================
  const handlePlaqueChange = (val: string) => {
    setPlaqueSearch(val);
    setEnginTrouve(null);
    setEnginNotFound(false);
    if (plaqueTimer.current) clearTimeout(plaqueTimer.current);
    if (val.length >= 3 && utilisateur?.site_id) {
      setPlaqueLoading(true);
      plaqueTimer.current = setTimeout(async () => {
        try {
          const res = await searchEnginByPlaque(utilisateur.site_id!, val);
          if (res.status === "success" && res.found && res.data) {
            setEnginTrouve(res.data as EnginEmbarquement);
            setEnginMarque(res.data.marque_modele || "");
            setEnginChassis(res.data.numero_chassis || "");
            setEnginMoteur(res.data.numero_moteur || "");
            setEnginCouleur(res.data.couleur || "");
            // Auto-select type if engin has one
            if (res.data.type_engin_id) {
              setFormTypeId(String(res.data.type_engin_id));
              const typeE = typeEngins.find(t => t.id === res.data!.type_engin_id);
              if (typeE) setFormMontant(typeE.prix);
            }
          } else {
            setEnginNotFound(true);
            setEnginMarque(""); setEnginChassis(""); setEnginMoteur(""); setEnginCouleur("");
          }
        } catch { /* ignore */ }
        setPlaqueLoading(false);
      }, 600);
    }
  };

  // ======================= TYPE CHANGE → PRIX =======================
  const handleTypeChange = (typeId: string) => {
    setFormTypeId(typeId);
    const te = typeEngins.find(t => t.id === parseInt(typeId));
    setFormMontant(te ? te.prix : 0);
  };

  // ======================= SUBMIT PAYMENT =======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type_engin_id: parseInt(formTypeId),
        montant: formMontant,
        mode_paiement: formModePaiement,
        note: formNote || null,
        site_id: utilisateur?.site_id,
        province_id: utilisateur?.province_id,
        utilisateur_id: utilisateur?.id,
        encaisse_par: utilisateur?.id,
        encaisse_par_nom: utilisateur?.nom_complet || null,
        // Contribuable
        contribuable_nom: contribNom,
        contribuable_postnom: contribPostnom || null,
        contribuable_prenom: contribPrenom || null,
        contribuable_sexe: contribSexe,
        contribuable_role: contribRole,
        contribuable_telephone: contribTelephone || null,
        contribuable_adresse: contribAdresse || null,
        // Engin
        engin_plaque: plaqueSearch,
        engin_marque_modele: enginMarque || null,
        engin_chassis: enginChassis || null,
        engin_moteur: enginMoteur || null,
        engin_couleur: enginCouleur || null,
      };

      // If an existing engin was found, pass its id
      if (enginTrouve) payload.engin_id = enginTrouve.id;

      const res = await enregistrerPaiement(payload);
      if (res.status === "success" && res.data) {
        const d = res.data as { reference: string; recu_numero: string };
        setFormSuccess({
          reference: d.reference,
          recu: d.recu_numero,
          montant: formMontant,
        });
      } else {
        setFormError(res.message || "Erreur lors du paiement");
      }
    } catch { setFormError("Erreur serveur"); }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormTypeId(""); setFormMontant(0); setFormModePaiement("especes"); setFormNote("");
    setPlaqueSearch(""); setEnginTrouve(null); setEnginNotFound(false);
    setEnginMarque(""); setEnginChassis(""); setEnginMoteur(""); setEnginCouleur("");
    setContribNom(""); setContribPostnom(""); setContribPrenom("");
    setContribSexe("M"); setContribRole("chauffeur"); setContribTelephone(""); setContribAdresse("");
    setFormError(""); setFormSuccess(null);
  };

  // ======================= LIST LOAD =======================
  const loadList = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) return;
    setListLoading(true);
    try {
      const res = await getPaiements(utilisateur.site_id, page, 20, listSearch);
      if (res.status === "success" && res.data) {
        setPaiements(res.data.paiements);
        setListPagination(res.data.pagination);
      }
    } catch { /* ignore */ }
    setListLoading(false);
  }, [utilisateur?.site_id, listSearch]);

  useEffect(() => { if (tab === "list") loadList(); }, [tab, loadList]);

  const openDetail = async (p: PaiementEmbarquement) => {
    setDetailPaiement(p); setShowDetail(true); setDetailLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([getPaiementById(p.id), getRepartitionPaiement(p.id)]);
      if (pRes.status === "success" && pRes.data) setDetailPaiement(pRes.data);
      if (rRes.status === "success" && rRes.data) setDetailRepartition(rRes.data);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  const modePaiementIcons: Record<string, React.ReactNode> = {
    especes: <Banknote className="w-5 h-5" />,
    mobile_money: <Smartphone className="w-5 h-5" />,
    banque: <CreditCard className="w-5 h-5" />,
  };

  const statutColors: Record<string, string> = {
    confirme: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    en_attente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    annule: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  // ======================= SUCCESS VIEW =======================
  if (formSuccess) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Paiement enregistré !</h2>
          <div className="space-y-3 mt-6 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Référence</span>
              <span className="font-bold text-[#153258] dark:text-blue-300">{formSuccess.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">N° Reçu</span>
              <span className="font-bold text-gray-900 dark:text-white">{formSuccess.recu}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant</span>
              <span className="font-bold text-green-600">{fmt(formSuccess.montant)}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={resetForm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Nouveau paiement
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================= RENDER =======================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#153258]" /> Paiements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enregistrement et suivi des paiements</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("form")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === "form" ? "bg-white dark:bg-gray-800 text-[#153258] dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Receipt className="w-4 h-4" /> Nouveau paiement
        </button>
        <button onClick={() => setTab("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === "list" ? "bg-white dark:bg-gray-800 text-[#153258] dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <FileText className="w-4 h-4" /> Historique
        </button>
      </div>

      {/* ============ TAB FORM ============ */}
      {tab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4" />{formError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Type + Engin */}
            <div className="space-y-6">
              {/* Type d'engin + montant */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#153258]" /> Type de véhicule & Tarif
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type d&apos;engin <span className="text-red-500">*</span></label>
                    <select required value={formTypeId} onChange={(e) => handleTypeChange(e.target.value)} className={inputClass}>
                      <option value="">Sélectionner le type</option>
                      {typeEngins.filter(t => t.actif).map(t => (
                        <option key={t.id} value={t.id}>{t.nom}</option>
                      ))}
                    </select>
                  </div>
                  {formMontant > 0 && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#153258]/10 to-[#23A974]/10 dark:from-[#153258]/30 dark:to-[#23A974]/30 rounded-lg p-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Montant à payer</span>
                      <span className="text-2xl font-bold text-[#153258] dark:text-white">{fmt(formMontant)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Engin / Plaque */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#23A974]" /> Engin
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      N° Plaque <span className="text-red-500">*</span>
                      {plaqueLoading && <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2" />}
                    </label>
                    <input required value={plaqueSearch} onChange={(e) => handlePlaqueChange(e.target.value.toUpperCase())}
                      className={inputClass} placeholder="Ex: KIN-1234-AB" />
                    {enginTrouve && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Engin trouvé — {enginTrouve.type_engin_nom}
                      </p>
                    )}
                    {enginNotFound && plaqueSearch.length >= 3 && (
                      <p className="text-xs text-orange-500 mt-1">Nouvel engin — les champs seront créés automatiquement</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Marque/Modèle</label>
                      <input value={enginMarque} onChange={(e) => setEnginMarque(e.target.value)} className={inputClass} placeholder="Toyota" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Couleur</label>
                      <input value={enginCouleur} onChange={(e) => setEnginCouleur(e.target.value)} className={inputClass} placeholder="Blanc" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Contribuable + Mode */}
            <div className="space-y-6">
              {/* Contribuable */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#153258]" /> Contribuable
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom <span className="text-red-500">*</span></label>
                      <input required value={contribNom} onChange={(e) => setContribNom(e.target.value)} className={inputClass} placeholder="Nom" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Post-nom</label>
                      <input value={contribPostnom} onChange={(e) => setContribPostnom(e.target.value)} className={inputClass} placeholder="Post-nom" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prénom</label>
                      <input value={contribPrenom} onChange={(e) => setContribPrenom(e.target.value)} className={inputClass} placeholder="Prénom" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone</label>
                      <input value={contribTelephone} onChange={(e) => setContribTelephone(e.target.value)} className={inputClass} placeholder="0812345678" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sexe</label>
                      <select value={contribSexe} onChange={(e) => setContribSexe(e.target.value)} className={inputClass}>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rôle</label>
                      <select value={contribRole} onChange={(e) => setContribRole(e.target.value)} className={inputClass}>
                        <option value="chauffeur">Chauffeur</option>
                        <option value="proprietaire">Propriétaire</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#23A974]" /> Mode de paiement
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "especes", label: "Espèces" },
                    { value: "mobile_money", label: "Mobile Money" },
                    { value: "banque", label: "Banque" },
                  ].map((m) => (
                    <button key={m.value} type="button" onClick={() => setFormModePaiement(m.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                        formModePaiement === m.value
                          ? "border-[#153258] bg-[#153258]/5 dark:bg-[#153258]/20 text-[#153258] dark:text-white"
                          : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
                      }`}>
                      {modePaiementIcons[m.value]}
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note (optionnelle)</label>
                  <textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} rows={2} className={inputClass} placeholder="Remarque éventuelle..." />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || !formTypeId || !plaqueSearch || !contribNom}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg disabled:opacity-50 text-sm font-bold transition-all">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
              Enregistrer le paiement {formMontant > 0 && `— ${fmt(formMontant)}`}
            </button>
          </div>
        </form>
      )}

      {/* ============ TAB LIST ============ */}
      {tab === "list" && (
        <div className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); loadList(1); }} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Rechercher par référence, nom, plaque..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
            </div>
          </form>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {listLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
            ) : paiements.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun paiement trouvé</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                      <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                      <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                      <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                      <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-mono text-xs text-[#153258] dark:text-blue-300 font-bold">{p.reference}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{p.contribuable_nom} {p.contribuable_postnom || ""}</td>
                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{p.numero_plaque || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.type_engin_nom || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(p.montant)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[p.statut] || ""}`}>
                            {p.statut === "confirme" ? "Confirmé" : p.statut === "annule" ? "Annulé" : "En attente"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{fmtDate(p.date_paiement)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openDetail(p)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {listPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">{listPagination.total} résultat(s)</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => loadList(listPagination.page - 1)} disabled={listPagination.page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2">{listPagination.page} / {listPagination.totalPages}</span>
                  <button onClick={() => loadList(listPagination.page + 1)} disabled={listPagination.page >= listPagination.totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {showDetail && detailPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Détail du paiement</h3>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Référence</p>
                    <p className="font-bold text-[#153258] dark:text-blue-300 font-mono">{detailPaiement.reference}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">N° Reçu</p>
                    <p className="font-bold text-gray-900 dark:text-white">{detailPaiement.recu_numero}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Montant</p>
                    <p className="font-bold text-green-600 text-lg">{fmt(detailPaiement.montant)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Mode</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{detailPaiement.mode_paiement?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Contribuable</p>
                    <p className="font-medium text-gray-900 dark:text-white">{detailPaiement.contribuable_nom} {detailPaiement.contribuable_postnom || ""} {detailPaiement.contribuable_prenom || ""}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Plaque</p>
                    <p className="font-bold text-gray-900 dark:text-white">{detailPaiement.numero_plaque || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Type véhicule</p>
                    <p className="font-medium text-gray-900 dark:text-white">{detailPaiement.type_engin_nom || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Date</p>
                    <p className="text-gray-900 dark:text-white">{fmtDate(detailPaiement.date_paiement)}</p>
                  </div>
                </div>

                {/* Répartition */}
                {detailRepartition.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Répartition</h4>
                    <div className="space-y-2">
                      {detailRepartition.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                            <p className="text-xs text-gray-500">{r.valeur_part_originale}%</p>
                          </div>
                          <span className="font-bold text-sm text-[#153258] dark:text-blue-300">{fmt(r.montant)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
