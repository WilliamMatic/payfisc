"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPaiements, enregistrerPaiement, getRepartitionPaiement, getZones,
} from "@/services/stationnement/stationnementService";
import { PaiementStationnement, RepartitionStationnement, ZoneStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, X, Check, Save, Loader2, Eye,
  Calendar, Filter, AlertTriangle, ChevronLeft, ChevronRight,
  DollarSign, Wallet, ArrowUpRight,
} from "lucide-react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const STATUT_BADGES: Record<string, string> = {
  confirme: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  annule: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  en_attente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};
const MODE_LABELS: Record<string, string> = { especes: "Espèces", mobile_money: "Mobile Money", banque: "Banque" };

export default function PaiementsClient() {
  const { utilisateur } = useAuth();
  const [paiements, setPaiements] = useState<PaiementStationnement[]>([]);
  const [zones, setZones] = useState<ZoneStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRepartition, setShowRepartition] = useState(false);
  const [repartitionData, setRepartitionData] = useState<RepartitionStationnement[]>([]);
  const [repartitionLoading, setRepartitionLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm: { stationnement_id: string; montant: string; mode_paiement: "especes" | "mobile_money" | "banque"; note: string } = { stationnement_id: "", montant: "", mode_paiement: "especes", note: "" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getPaiements(utilisateur.site_id, page, 20, search, filterStatut, filterMode, dateDebut, dateFin);
      if (res.status === "success" && res.data) {
        setPaiements(res.data.paiements);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search, filterStatut, filterMode, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (utilisateur?.site_id) {
      getZones(utilisateur.site_id, 1, 100).then((res) => {
        if (res.status === "success" && res.data) setZones(res.data.zones);
      });
    }
  }, [utilisateur?.site_id]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError("");
    try {
      const res = await enregistrerPaiement({
        stationnement_id: form.stationnement_id ? parseInt(form.stationnement_id) : null,
        montant: parseFloat(form.montant),
        mode_paiement: form.mode_paiement,
        note: form.note,
        site_id: utilisateur?.site_id,
        utilisateur_id: utilisateur?.id,
      });
      if (res.status === "success") {
        setSuccess("Paiement enregistré."); setShowAdd(false); setForm(emptyForm); load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const openRepartition = async (paiementId: number) => {
    setShowRepartition(true); setRepartitionLoading(true);
    try {
      const res = await getRepartitionPaiement(paiementId);
      if (res.status === "success" && res.data) setRepartitionData(res.data);
      else setRepartitionData([]);
    } catch { setRepartitionData([]); }
    setRepartitionLoading(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#153258]" /> Paiements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des paiements de stationnement</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau paiement
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </form>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          <option value="">Tous statuts</option>
          <option value="confirme">Confirmé</option>
          <option value="annule">Annulé</option>
          <option value="en_attente">En attente</option>
        </select>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          <option value="">Tous modes</option>
          <option value="especes">Espèces</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="banque">Banque</option>
        </select>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : paiements.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun paiement trouvé</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Mode</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{p.reference || `#${p.id}`}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.plaque || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#23A974]">{formatMontant(Number(p.montant))}</td>
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      <div>{MODE_LABELS[p.mode_paiement] || p.mode_paiement}</div>
                      {p.numero_mobile && <div className="text-xs text-gray-400 mt-0.5">{p.numero_mobile}</div>}
                      {p.nom_banque && <div className="text-xs text-gray-400 mt-0.5">{p.nom_banque}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGES[p.statut] || "bg-gray-100 text-gray-700"}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {p.date_paiement ? new Date(p.date_paiement).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openRepartition(p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#153258]/10 hover:bg-[#153258]/20 text-[#153258] dark:text-blue-300 rounded-lg text-xs font-medium transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Répartition
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} résultat(s)</span>
            <div className="flex items-center gap-1">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau paiement</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 p-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />{error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Session (optionnel)</label>
                  <input value={form.stationnement_id} onChange={(e) => setForm({ ...form, stationnement_id: e.target.value })} className={inputClass} placeholder="ID du stationnement associé" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Montant (FC) <span className="text-red-500">*</span></label>
                  <input required type="number" step="0.01" min="0" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mode de paiement</label>
                  <select value={form.mode_paiement} onChange={(e) => setForm({ ...form, mode_paiement: e.target.value as "especes" | "mobile_money" | "banque" })} className={inputClass}>
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="banque">Banque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputClass} placeholder="Note optionnelle..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Répartition */}
      {showRepartition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#23A974]" /> Répartition du paiement
              </h3>
              <button onClick={() => setShowRepartition(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {repartitionLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
              ) : repartitionData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune répartition pour ce paiement.</p>
              ) : (
                <div className="space-y-3">
                  {repartitionData.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.numero_compte || "—"}</p>
                      </div>
                      <p className="text-lg font-bold text-[#23A974]">{formatMontant(Number(r.montant))}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-[#153258]/5 dark:bg-[#153258]/20 rounded-xl border-2 border-[#153258]/20">
                    <p className="font-bold text-gray-900 dark:text-white">Total</p>
                    <p className="text-lg font-bold text-[#153258]">
                      {formatMontant(repartitionData.reduce((s, r) => s + Number(r.montant), 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
