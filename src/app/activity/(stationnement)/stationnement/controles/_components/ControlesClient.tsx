"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getControles, enregistrerControle, searchVehiculeByPlaque, getZones } from "@/services/stationnement/stationnementService";
import { ControleStationnement, ZoneStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, X, Check, Save, Loader2,
  Calendar, AlertTriangle, ChevronLeft, ChevronRight, Shield,
} from "lucide-react";

const STATUT_BADGES: Record<string, string> = {
  ok: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  infraction: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
const STATUT_LABELS: Record<string, string> = { ok: "Conforme", infraction: "Infraction" };

export default function ControlesClient() {
  const { utilisateur } = useAuth();
  const [controles, setControles] = useState<ControleStationnement[]>([]);
  const [zones, setZones] = useState<ZoneStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm: { vehicule_plaque: string; zone_id: string; statut: "ok" | "infraction"; observation: string } = { vehicule_plaque: "", zone_id: "", statut: "ok", observation: "" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getControles(utilisateur.site_id, page, 20, search, filterStatut, dateDebut, dateFin);
      if (res.status === "success" && res.data) {
        setControles(res.data.controles);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search, filterStatut, dateDebut, dateFin]);

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
      // Search vehicle by plate to get vehicule_id
      let vehiculeId: number | null = null;
      if (form.vehicule_plaque && utilisateur?.site_id) {
        const vRes = await searchVehiculeByPlaque(utilisateur.site_id, form.vehicule_plaque);
        if (vRes.status === "success" && vRes.found && vRes.data && Array.isArray(vRes.data) && vRes.data.length > 0) {
          vehiculeId = vRes.data[0].id;
        } else {
          setError("Véhicule non trouvé avec cette plaque."); setFormLoading(false); return;
        }
      } else {
        setError("Plaque requise."); setFormLoading(false); return;
      }
      const res = await enregistrerControle({
        vehicule_id: vehiculeId,
        zone_id: form.zone_id ? parseInt(form.zone_id) : null,
        agent_id: utilisateur?.id,
        statut: form.statut,
        observation: form.observation,
        site_id: utilisateur?.site_id,
      });
      if (res.status === "success") {
        setSuccess("Contrôle enregistré."); setShowAdd(false); setForm(emptyForm); load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#153258]" /> Contrôles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Suivi des contrôles de stationnement</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau contrôle
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par plaque..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </form>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          <option value="">Tous statuts</option>
          <option value="ok">Conforme</option>
          <option value="infraction">Infraction</option>
        </select>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : controles.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun contrôle trouvé</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Zone</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Observations</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Agent</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {controles.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.plaque || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.zone_nom || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGES[c.statut] || "bg-gray-100 text-gray-700"}`}>
                        {STATUT_LABELS[c.statut] || c.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{c.observation || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.agent_nom || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {c.date_controle ? new Date(c.date_controle).toLocaleString("fr-FR") : "—"}
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau contrôle</h3>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plaque du véhicule <span className="text-red-500">*</span></label>
                  <input required value={form.vehicule_plaque} onChange={(e) => setForm({ ...form, vehicule_plaque: e.target.value })} className={inputClass} placeholder="KN-1234-AB" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Zone (optionnel)</label>
                  <select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} className={inputClass}>
                    <option value="">Sélectionner une zone</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Résultat du contrôle</label>
                  <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as "ok" | "infraction" })} className={inputClass}>
                    <option value="ok">Conforme</option>
                    <option value="infraction">Infraction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Observations</label>
                  <textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} className={inputClass} rows={3} placeholder="Détails du contrôle..." />
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
    </div>
  );
}
