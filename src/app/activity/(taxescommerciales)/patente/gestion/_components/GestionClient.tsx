"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPatentes, getPatenteById, actionPatente, getPatentesExpirant } from "@/services/patente/patenteService";
import { PatenteDoc, Pagination } from "@/services/patente/types";
import {
  FileText, Search, Eye, X, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, Ban, RotateCcw, QrCode, Calendar, Clock, Filter,
} from "lucide-react";

const STATUT_STYLES: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: "Attente paiement", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  suspendue: { label: "Suspendue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  annulee: { label: "Annulée", color: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
  expiree: { label: "Expirée", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

export default function GestionClient() {
  const { utilisateur } = useAuth();
  const [patentes, setPatentes] = useState<PatenteDoc[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<PatenteDoc | null>(null);
  const [expirations, setExpirations] = useState<PatenteDoc[]>([]);
  const [showAction, setShowAction] = useState<{ type: "suspendre" | "annuler" | "reactiver"; patente: PatenteDoc } | null>(null);
  const [motif, setMotif] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getPatentes(utilisateur.site_id, page, 20, statut || undefined, search || undefined);
      if (res.status === "success" && res.data) {
        setPatentes(res.data.patentes);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, statut, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getPatentesExpirant(utilisateur.site_id, 30).then((res) => {
      if (res.status === "success" && res.data) setExpirations(res.data);
    });
  }, [utilisateur?.site_id]);

  const openDetail = async (id: number) => {
    const res = await getPatenteById(id);
    if (res.status === "success" && res.data) { setDetail(res.data); setShowDetail(true); }
  };

  const handleAction = async () => {
    if (!showAction) return;
    setActionLoading(true);
    try {
      const res = await actionPatente({
        patente_id: showAction.patente.id,
        action: showAction.type,
        motif: motif || undefined,
        agent_id: utilisateur?.id || 0,
      });
      if (res.status === "success") {
        setSuccess(`Patente ${showAction.type === "suspendre" ? "suspendue" : showAction.type === "annuler" ? "annulée" : "réactivée"} !`);
        setShowAction(null);
        setMotif("");
        load(pagination.page);
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch { /* err */ }
    setActionLoading(false);
  };

  const formatCA = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
          <ShieldCheck className="w-4 h-4" />{success}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="bg-[#153258] p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          Gestion des Patentes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Consultez et gérez toutes les patentes émises</p>
      </div>

      {/* Expirations alert */}
      {expirations.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              {expirations.length} patente(s) expirent dans les 30 jours
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {expirations.slice(0, 3).map((p) => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-orange-200 dark:border-orange-700 text-sm cursor-pointer hover:shadow" onClick={() => openDetail(p.id)}>
                <p className="font-medium text-gray-900 dark:text-white truncate">{p.nom_complet}</p>
                <p className="text-xs text-orange-600">{p.numero_patente} — expire {new Date(p.date_fin_validite).toLocaleDateString("fr-FR")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (N° patente, nom)..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={statut} onChange={(e) => setStatut(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm appearance-none min-w-[180px]">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">N° Patente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Contribuable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Catégorie</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Montant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Validité</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                </td></tr>
              ) : patentes.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Aucune patente trouvée</td></tr>
              ) : (
                patentes.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">{p.numero_patente}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{p.nom_complet}</p>
                      <p className="text-xs text-gray-400">{p.type_activite}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{p.categorie}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCA(p.montant_total ?? p.montant)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLES[p.statut]?.color || "bg-gray-100 text-gray-600"}`}>
                        {STATUT_STYLES[p.statut]?.label || p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(p.date_emission).toLocaleDateString("fr-FR")} — {new Date(p.date_fin_validite).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openDetail(p.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Voir"><Eye className="w-4 h-4 text-gray-500" /></button>
                        {p.statut === "active" && (
                          <button onClick={() => { setShowAction({ type: "suspendre", patente: p }); setMotif(""); }} className="p-1.5 hover:bg-red-50 rounded-md" title="Suspendre"><Ban className="w-4 h-4 text-red-500" /></button>
                        )}
                        {p.statut === "suspendue" && (
                          <button onClick={() => { setShowAction({ type: "reactiver", patente: p }); setMotif(""); }} className="p-1.5 hover:bg-green-50 rounded-md" title="Réactiver"><RotateCcw className="w-4 h-4 text-green-500" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Detail modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Détails Patente</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{detail.numero_patente}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* QR code section */}
              <div className="bg-gradient-to-br from-[#153258]/10 to-[#23A974]/10 dark:from-[#153258]/20 dark:to-[#23A974]/20 rounded-lg p-4 text-center border border-[#153258]/20 dark:border-[#153258]/40">
                <QrCode className="w-16 h-16 mx-auto text-[#153258] dark:text-blue-400 mb-2" />
                <p className="font-mono text-lg font-bold text-[#153258] dark:text-blue-300">{detail.numero_patente}</p>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLES[detail.statut]?.color}`}>
                  {STATUT_STYLES[detail.statut]?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Contribuable</span><p className="font-medium text-gray-900 dark:text-white">{detail.nom_complet}</p></div>
                <div><span className="text-gray-400">Catégorie</span><p className="font-medium capitalize text-gray-900 dark:text-white">{detail.categorie}</p></div>
                <div><span className="text-gray-400">Activité</span><p className="font-medium text-gray-900 dark:text-white">{detail.type_activite}</p></div>
                <div><span className="text-gray-400">Secteur</span><p className="font-medium capitalize text-gray-900 dark:text-white">{detail.secteur_activite}</p></div>
                <div><span className="text-gray-400">Montant total</span><p className="font-bold text-lg text-[#23A974]">{formatCA(detail.montant_total ?? detail.montant)}</p></div>
                <div><span className="text-gray-400">Montant payé</span><p className="font-bold text-lg text-[#153258] dark:text-blue-400">{formatCA(detail.montant_paye ?? 0)}</p></div>
                <div><span className="text-gray-400">Émission</span><p className="text-gray-900 dark:text-white">{new Date(detail.date_emission).toLocaleDateString("fr-FR")}</p></div>
                <div><span className="text-gray-400">Expiration</span><p className="text-gray-900 dark:text-white">{new Date(detail.date_fin_validite).toLocaleDateString("fr-FR")}</p></div>
              </div>

              {/* Payment bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Paiement</span>
                  <span>{(detail.montant_total ?? detail.montant) > 0 ? Math.round(((detail.montant_paye ?? 0) / (detail.montant_total ?? detail.montant)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-[#23A974] h-2 rounded-full transition-all" style={{ width: `${(detail.montant_total ?? detail.montant) > 0 ? Math.min(100, ((detail.montant_paye ?? 0) / (detail.montant_total ?? detail.montant)) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action modal (suspend/annul) */}
      {showAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAction(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {showAction.type === "suspendre" ? "Suspendre" : showAction.type === "annuler" ? "Annuler" : "Réactiver"} la patente
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {showAction.type !== "reactiver" && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 text-xs">
                  <AlertTriangle className="w-4 h-4" /> Cette action est réversible
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">Patente: <strong>{showAction.patente.numero_patente}</strong></p>
              <textarea rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (optionnel)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button onClick={handleAction} disabled={actionLoading}
                  className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                    showAction.type === "reactiver" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}>
                  {actionLoading ? "..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
