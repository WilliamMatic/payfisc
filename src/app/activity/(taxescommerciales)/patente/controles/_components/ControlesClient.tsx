"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getControles, ajouterControle, verifierQR } from "@/services/patente/patenteService";
import { ControlePatente, Pagination } from "@/services/patente/types";
import {
  ShieldCheck, Search, Eye, X, ChevronLeft, ChevronRight, Plus, CheckCircle2, QrCode, AlertTriangle, XCircle, MapPin, Camera,
} from "lucide-react";

const RESULTAT_STYLES: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  conforme: { label: "Conforme", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  non_conforme: { label: "Non conforme", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
  fraude: { label: "Fraude", color: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200", icon: AlertTriangle },
};

export default function ControlesClient() {
  const { utilisateur } = useAuth();
  const [controles, setControles] = useState<ControlePatente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // QR verify
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrResult, setQrResult] = useState<Record<string, unknown> | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Add control
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    patente_id: "",
    resultat: "conforme" as "conforme" | "non_conforme" | "fraude",
    observations: "",
    lieu_controle: "",
    latitude: "",
    longitude: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Detail
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<ControlePatente | null>(null);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getControles(utilisateur.site_id, page, 20);
      if (res.status === "success" && res.data) {
        setControles(res.data.controles);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id]);

  useEffect(() => { load(); }, [load]);

  const handleVerifyQR = async () => {
    if (!qrCode.trim()) return;
    setQrLoading(true);
    setQrResult(null);
    try {
      const res = await verifierQR(qrCode);
      if (res.status === "success" && res.data) {
        setQrResult(res.data);
      } else {
        setQrResult({ error: true, message: res.message || "Patente non trouvée" });
      }
    } catch { setQrResult({ error: true, message: "Erreur de vérification" }); }
    setQrLoading(false);
  };

  const geolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setAddForm((f) => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) })),
        () => { /* ignore error */ }
      );
    }
  };

  const handleAdd = async () => {
    if (addLoading) return;
    if (!addForm.patente_id || !utilisateur) { setError("Veuillez renseigner l'ID patente"); return; }
    setAddLoading(true);
    setError("");
    try {
      const res = await ajouterControle({
        patente_id: Number(addForm.patente_id),
        agent_id: utilisateur.id,
        agent_nom: utilisateur.nom_complet,
        resultat: addForm.resultat,
        observations: addForm.observations || null,
        lieu_controle: addForm.lieu_controle || null,
        latitude: addForm.latitude ? Number(addForm.latitude) : null,
        longitude: addForm.longitude ? Number(addForm.longitude) : null,
      });
      if (res.status === "success") {
        setShowAdd(false);
        setSuccess("Contrôle enregistré !");
        load(1);
        setTimeout(() => setSuccess(""), 4000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setAddLoading(false);
  };

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
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            Contrôle & Conformité
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Vérification et contrôle terrain des patentes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowQR(true); setQrCode(""); setQrResult(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#153258] hover:bg-[#1a3d6b] text-white rounded-lg text-sm font-medium transition-colors">
            <QrCode className="w-4 h-4" /> Vérifier QR
          </button>
          <button onClick={() => { setShowAdd(true); setAddForm({ patente_id: "", resultat: "conforme", observations: "", lieu_controle: "", latitude: "", longitude: "" }); setError(""); geolocate(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-sm font-medium transition-all duration-200">
            <Plus className="w-4 h-4" /> Nouveau contrôle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["conforme", "non_conforme", "fraude"] as const).map((r) => {
          const s = RESULTAT_STYLES[r];
          const Icon = s.icon;
          const count = controles.filter((c) => c.resultat === r).length;
          return (
            <div key={r} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">N° Patente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Contribuable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Résultat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Lieu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Agent</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
                </td></tr>
              ) : controles.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Aucun contrôle enregistré</td></tr>
              ) : (
                controles.map((c) => {
                  const rs = RESULTAT_STYLES[c.resultat];
                  const Icon = rs?.icon || CheckCircle2;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.numero_patente}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom_complet}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rs?.color}`}>
                          <Icon className="w-3 h-3" />{rs?.label || c.resultat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.adresse_commerce || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{c.agent_nom}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.date_controle).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setDetail(c); setShowDetail(true); }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
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

      {/* QR Verify modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vérification QR</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scanner ou saisir le code</p>
                </div>
              </div>
              <button onClick={() => setShowQR(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code QR / N° Patente</label>
                <input value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="PAT-2026-000001"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono" />
              </div>
              <button onClick={handleVerifyQR} disabled={qrLoading}
                className="w-full py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all duration-200">
                {qrLoading ? "Vérification..." : "Vérifier"}
              </button>

              {qrResult && (
                <div className={`rounded-lg p-4 ${(qrResult as Record<string, unknown>).error
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-200"
                  : (qrResult as Record<string, unknown>).valide
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200"
                    : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200"}`}>
                  {(qrResult as Record<string, unknown>).error ? (
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <XCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">{(qrResult as Record<string, unknown>).message as string}</p>
                    </div>
                  ) : (() => {
                    const r = qrResult as Record<string, unknown>;
                    const p = r.patente as Record<string, unknown> | undefined;
                    const isValide = r.valide as boolean;
                    const STATUT_MAP: Record<string, { label: string; color: string }> = {
                      active: { label: "Active", color: "text-emerald-700 bg-emerald-100" },
                      en_attente_paiement: { label: "En attente de paiement", color: "text-amber-700 bg-amber-100" },
                      expiree: { label: "Expirée", color: "text-red-700 bg-red-100" },
                      suspendue: { label: "Suspendue", color: "text-orange-700 bg-orange-100" },
                      annulee: { label: "Annulée", color: "text-gray-700 bg-gray-100" },
                    };
                    const statut = r.statut_paiement as string;
                    const st = STATUT_MAP[statut] || { label: statut, color: "text-gray-700 bg-gray-100" };
                    return (
                      <div className="space-y-3 text-sm">
                        <div className={`flex items-center gap-2 ${isValide ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                          {isValide ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          <span className="font-semibold">{isValide ? "Patente valide" : "Patente non valide"}</span>
                        </div>
                        {p && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">N° Patente</span>
                              <span className="font-mono font-medium text-[#153258] dark:text-blue-300">{p.numero_patente as string}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Contribuable</span>
                              <span className="font-medium text-gray-900 dark:text-white">{p.nom_complet as string || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Année fiscale</span>
                              <span className="font-medium text-gray-900 dark:text-white">{p.annee_fiscale as string}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Statut</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Fin de validité</span>
                              <span className="font-medium text-gray-900 dark:text-white">{r.date_fin_validite as string || "—"}</span>
                            </div>
                            {(p.montant as number) ? (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Montant</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(p.montant as number)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add control modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nouveau contrôle</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enregistrer un contrôle terrain</p>
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Patente *</label>
                <input type="number" value={addForm.patente_id} onChange={(e) => setAddForm((f) => ({ ...f, patente_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Résultat *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["conforme", "non_conforme", "fraude"] as const).map((r) => {
                    const rs = RESULTAT_STYLES[r];
                    const Icon = rs.icon;
                    return (
                      <button key={r} type="button" onClick={() => setAddForm((f) => ({ ...f, resultat: r }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                          addForm.resultat === r ? `${rs.color} border-current ring-1 ring-current` : "border-gray-200 dark:border-gray-700 text-gray-600"
                        }`}>
                        <Icon className="w-5 h-5" />{rs.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu du contrôle</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={addForm.lieu_controle} onChange={(e) => setAddForm((f) => ({ ...f, lieu_controle: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" placeholder="Ex: Av. de la Paix, Goma" />
                </div>
              </div>

              {addForm.latitude && (
                <p className="text-xs text-gray-400">GPS: {addForm.latitude}, {addForm.longitude}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observations</label>
                <textarea rows={3} value={addForm.observations} onChange={(e) => setAddForm((f) => ({ ...f, observations: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button onClick={handleAdd} disabled={addLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium">
                  {addLoading ? "..." : "Enregistrer le contrôle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Détails du contrôle</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Informations complètes</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Patente</span><span className="font-mono text-blue-600">{detail.numero_patente}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Contribuable</span><span className="font-medium">{detail.nom_complet}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Résultat</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULTAT_STYLES[detail.resultat]?.color}`}>{RESULTAT_STYLES[detail.resultat]?.label}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400">Lieu</span><span>{detail.adresse_commerce || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Agent</span><span>{detail.agent_nom}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{new Date(detail.date_controle).toLocaleString("fr-FR")}</span></div>
              {detail.observations && (
                <div><span className="text-gray-400 block mb-1">Observations</span><p className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-gray-700 dark:text-gray-300">{detail.observations}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
