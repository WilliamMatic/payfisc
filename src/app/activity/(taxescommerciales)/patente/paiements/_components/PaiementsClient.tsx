"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPatentes, enregistrerPaiement, getPaiements, getPaiementById, getRepartitionPaiement } from "@/services/patente/patenteService";
import { PatenteDoc, PaiementPatente, Pagination } from "@/services/patente/types";
import {
  Banknote, Search, Eye, X, ChevronLeft, ChevronRight, Plus, CheckCircle2, Filter, Receipt, CreditCard, Smartphone, Building2, Coins, PieChart,
} from "lucide-react";

const MODE_ICONS: Record<string, { icon: typeof Coins; label: string; color: string }> = {
  especes: { icon: Coins, label: "Espèces", color: "text-green-600" },
  mobile_money: { icon: Smartphone, label: "Mobile Money", color: "text-blue-600" },
  banque: { icon: Building2, label: "Banque", color: "text-purple-600" },
  cheque: { icon: CreditCard, label: "Chèque", color: "text-amber-600" },
};

const STATUT_COLORS: Record<string, string> = {
  confirme: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  en_attente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  echoue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function PaiementsClient() {
  const { utilisateur } = useAuth();
  const [paiements, setPaiements] = useState<PaiementPatente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFil, setModeFil] = useState("");

  // Add payment
  const [showAdd, setShowAdd] = useState(false);
  const [patentes, setPatentes] = useState<PatenteDoc[]>([]);
  const [selectedPatente, setSelectedPatente] = useState<PatenteDoc | null>(null);
  const [patenteSearch, setPatenteSearch] = useState("");
  const [formData, setFormData] = useState({ montant: "", mode_paiement: "especes", reference_externe: "", telephone_paiement: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Receipt
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<PaiementPatente | null>(null);

  // Repartition
  const [repartition, setRepartition] = useState<any[]>([]);
  const [repartLoading, setRepartLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getPaiements(utilisateur.site_id, page, 20, modeFil || undefined);
      if (res.status === "success" && res.data) {
        setPaiements(res.data.paiements);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, modeFil]);

  useEffect(() => { load(); }, [load]);

  const openAdd = async () => {
    if (!utilisateur?.site_id) return;
    const res = await getPatentes(utilisateur.site_id, 1, 100, "en_attente_paiement");
    if (res.status === "success" && res.data) setPatentes(res.data.patentes);
    setSelectedPatente(null);
    setPatenteSearch("");
    setFormData({ montant: "", mode_paiement: "especes", reference_externe: "", telephone_paiement: "" });
    setError("");
    setShowAdd(true);
  };

  const selectPatente = (p: PatenteDoc) => {
    setSelectedPatente(p);
    const reste = (p.montant_total ?? p.montant) - (p.montant_paye ?? 0);
    setFormData((f) => ({ ...f, montant: String(reste) }));
  };

  const handlePay = async () => {
    if (!selectedPatente || !utilisateur) return;
    if (!formData.montant || Number(formData.montant) <= 0) { setError("Montant invalide"); return; }
    setFormLoading(true);
    setError("");
    try {
      const res = await enregistrerPaiement({
        patente_id: selectedPatente.id,
        montant: Number(formData.montant),
        mode_paiement: formData.mode_paiement,
        reference_externe: formData.reference_externe || null,
        telephone_paiement: formData.telephone_paiement || null,
        agent_id: utilisateur.id,
        agent_nom: utilisateur.nom_complet,
      });
      if (res.status === "success") {
        setShowAdd(false);
        setSuccess("Paiement enregistré !");
        load(1);
        // Show receipt
        if (res.data?.paiement_id) {
          const rRes = await getPaiementById(res.data.paiement_id);
          if (rRes.status === "success" && rRes.data) {
            setReceiptData(rRes.data);
            setShowReceipt(true);
            loadRepartition(res.data.paiement_id);
          }
        }
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.message || "Erreur");
      }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const openReceipt = async (id: number) => {
    const res = await getPaiementById(id);
    if (res.status === "success" && res.data) {
      setReceiptData(res.data);
      setShowReceipt(true);
      loadRepartition(id);
    }
  };

  const loadRepartition = async (paiementId: number) => {
    setRepartLoading(true);
    setRepartition([]);
    try {
      const res = await getRepartitionPaiement(paiementId);
      if (res.status === "success" && res.data) setRepartition(res.data);
    } catch (e) { console.error(e); }
    setRepartLoading(false);
  };

  const formatCA = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v);

  const filteredPatentes = patentes.filter(
    (p) => !patenteSearch || p.nom_complet?.toLowerCase().includes(patenteSearch.toLowerCase()) || p.numero_patente?.includes(patenteSearch)
  );

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4" />{success}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-[#153258] p-1.5 rounded-lg">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            Paiements Patente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enregistrement et suivi des paiements</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-sm font-medium transition-all duration-200">
          <Plus className="w-4 h-4" /> Nouveau paiement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher référence..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={modeFil} onChange={(e) => setModeFil(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm appearance-none min-w-[180px]">
            <option value="">Tous les modes</option>
            {Object.entries(MODE_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Référence</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Contribuable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">N° Patente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Montant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Mode</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#153258] mx-auto" />
                </td></tr>
              ) : paiements.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Aucun paiement trouvé</td></tr>
              ) : (
                paiements.map((p) => {
                  const mi = MODE_ICONS[p.mode_paiement];
                  const Icon = mi?.icon || Coins;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.reference}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.nom_complet}</td>
                      <td className="px-4 py-3 text-xs text-blue-600">{p.numero_patente}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCA(p.montant_paye)}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs ${mi?.color || "text-gray-600"}`}>
                          <Icon className="w-3.5 h-3.5" />{mi?.label || p.mode_paiement}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[p.statut] || "bg-gray-100 text-gray-600"}`}>
                          {p.statut === "confirme" ? "Confirmé" : p.statut === "en_attente" ? "En attente" : "Échoué"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openReceipt(p.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Reçu & répartition">
                            <Receipt className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">Page {pagination.page}/{pagination.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add payment modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enregistrer un paiement</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sélectionner la patente et le montant</p>
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

              {/* Patente selection */}
              {!selectedPatente ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sélectionner une patente en attente de paiement</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={patenteSearch} onChange={(e) => setPatenteSearch(e.target.value)} placeholder="Rechercher par nom ou N° patente..."
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredPatentes.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-4">Aucune patente en attente</p>
                    ) : (
                      filteredPatentes.map((p) => (
                        <button key={p.id} onClick={() => selectPatente(p)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{p.nom_complet}</p>
                            <p className="text-xs text-gray-400">{p.numero_patente}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">{formatCA((p.montant_total ?? p.montant) - (p.montant_paye ?? 0))}</p>
                            <p className="text-xs text-gray-400">restant</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPatente.nom_complet}</p>
                        <p className="text-xs text-gray-500">{selectedPatente.numero_patente}</p>
                      </div>
                      <button onClick={() => setSelectedPatente(null)} className="text-xs text-blue-600 hover:underline">Changer</button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span>Total: <strong>{formatCA(selectedPatente.montant_total ?? selectedPatente.montant)}</strong></span>
                      <span>Payé: <strong>{formatCA(selectedPatente.montant_paye ?? 0)}</strong></span>
                      <span className="text-emerald-700 font-bold">Reste: {formatCA((selectedPatente.montant_total ?? selectedPatente.montant) - (selectedPatente.montant_paye ?? 0))}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant ($)</label>
                    <input type="number" min="0" step="0.01" value={formData.montant}
                      max={(selectedPatente.montant_total ?? selectedPatente.montant) - (selectedPatente.montant_paye ?? 0)}
                      onChange={(e) => setFormData((f) => ({ ...f, montant: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-bold text-lg" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode de paiement</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(MODE_ICONS).map(([key, val]) => {
                        const Icon = val.icon;
                        return (
                          <button key={key} type="button"
                            onClick={() => setFormData((f) => ({ ...f, mode_paiement: key }))}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                              formData.mode_paiement === key
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}>
                            <Icon className="w-4 h-4" />{val.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formData.mode_paiement === "mobile_money" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone paiement</label>
                      <input type="tel" value={formData.telephone_paiement}
                        onChange={(e) => setFormData((f) => ({ ...f, telephone_paiement: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" placeholder="+243..." />
                    </div>
                  )}

                  {(formData.mode_paiement === "banque" || formData.mode_paiement === "cheque") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Référence externe</label>
                      <input type="text" value={formData.reference_externe}
                        onChange={(e) => setFormData((f) => ({ ...f, reference_externe: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" placeholder="N° transaction..." />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                    <button onClick={handlePay} disabled={formLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />{formLoading ? "..." : "Confirmer le paiement"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReceipt(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm" id="receipt">
            <div className="p-6 text-center space-y-4">
              {/* Header */}
              <div className="space-y-1">
                <div className="w-12 h-12 bg-[#23A974]/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-[#23A974]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reçu de paiement</h3>
                <p className="font-mono text-xs text-gray-400">{receiptData.recu_numero}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />

              <div className="text-3xl font-bold text-[#23A974]">{formatCA(receiptData.montant_paye)}</div>

              <div className="text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Contribuable</span><span className="font-medium text-gray-900 dark:text-white">{receiptData.nom_complet}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">N° Patente</span><span className="font-mono text-blue-600">{receiptData.numero_patente}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Mode</span><span>{MODE_ICONS[receiptData.mode_paiement]?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ref</span><span className="font-mono text-xs">{receiptData.reference}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Agent</span><span>{receiptData.encaisse_par_nom}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{new Date(receiptData.date_paiement).toLocaleString("fr-FR")}</span></div>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />

              {/* Répartition bénéficiaires */}
              <div className="text-left">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2">
                  <PieChart className="w-3.5 h-3.5 text-[#153258]" /> Répartition aux bénéficiaires
                </h4>
                {repartLoading ? (
                  <div className="flex justify-center py-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#153258]" /></div>
                ) : repartition.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Aucune répartition configurée</p>
                ) : (
                  <div className="space-y-1.5">
                    {repartition.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                          <p className="text-[10px] text-gray-400">
                            {r.type_part === "pourcentage" ? `${r.valeur_part_originale}%` : `Fixe: ${formatCA(Number(r.valeur_part_originale))}`}
                            {r.province_nom ? ` • ${r.province_nom}` : ""}
                            {r.numero_compte ? ` • ${r.numero_compte}` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#23A974]">{formatCA(Number(r.montant))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-500">Total réparti</span>
                      <span className="text-sm font-bold text-[#153258] dark:text-blue-300">
                        {formatCA(repartition.reduce((s: number, r: any) => s + Number(r.montant), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-600" />

              <p className="text-xs text-gray-400">Merci pour votre contribution fiscale</p>

              <button onClick={() => setShowReceipt(false)}
                className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
