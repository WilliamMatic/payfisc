"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Controle, Contribuable } from "@/app/services/assainissement/types";
import { getControles, addControle, getContribuables } from "@/app/services/assainissement/assainissementService";

const typeLabels: Record<string, string> = { verification_paiement: "Vérification paiement", inspection_terrain: "Inspection terrain", audit: "Audit" };
const resultatColors: Record<string, string> = { conforme: "bg-green-100 text-green-700", non_conforme: "bg-yellow-100 text-yellow-700", en_infraction: "bg-red-100 text-red-700" };
const resultatLabels: Record<string, string> = { conforme: "Conforme", non_conforme: "Non conforme", en_infraction: "En infraction" };

export default function ControlesClient() {
  const { utilisateur } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const siteId = utilisateur?.site_id || 0;

  const [controles, setControles] = useState<Controle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterResultat, setFilterResultat] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Contribuable search
  const [ctbSearch, setCtbSearch] = useState("");
  const [ctbResults, setCtbResults] = useState<Contribuable[]>([]);
  const [selectedCtb, setSelectedCtb] = useState<Contribuable | null>(null);

  // Form
  const [form, setForm] = useState({ type_controle: "verification_paiement", resultat: "conforme", observations: "", latitude: "", longitude: "" });

  const fetchData = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const res = await getControles(siteId, page, 20, search, filterResultat, dateDebut, dateFin);
    if (res.status === "success" && res.data) {
      setControles(res.data.controles);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [siteId, page, search, filterResultat, dateDebut, dateFin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (ctbSearch.length < 2) { setCtbResults([]); return; }
    const t = setTimeout(async () => {
      const res = await getContribuables(siteId, 1, 10, ctbSearch);
      if (res.status === "success" && res.data) setCtbResults(res.data.contribuables);
    }, 300);
    return () => clearTimeout(t);
  }, [ctbSearch, siteId]);

  const handleAdd = async () => {
    if (!selectedCtb) return;
    const res = await addControle({
      contribuable_id: selectedCtb.id,
      type_controle: form.type_controle,
      resultat: form.resultat,
      observations: form.observations || null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      province_id: utilisateur?.province_id,
      site_id: siteId,
      utilisateur_id: utilisateur?.id,
    });
    if (res.status === "success") {
      setShowAdd(false);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setForm({ type_controle: "verification_paiement", resultat: "conforme", observations: "", latitude: "", longitude: "" });
    setSelectedCtb(null);
    setCtbSearch("");
    setCtbResults([]);
  };

  const geolocate = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
    });
  };

  const card = isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";
  const input = isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🔍 Contrôles</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Gestion des contrôles d&apos;assainissement</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:opacity-90 transition font-medium">
          + Nouveau contrôle
        </button>
      </div>

      {/* Filters */}
      <div className={`${card} rounded-xl shadow p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
          <select value={filterResultat} onChange={(e) => { setFilterResultat(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`}>
            <option value="">Tous les résultats</option>
            <option value="conforme">Conforme</option>
            <option value="non_conforme">Non conforme</option>
            <option value="en_infraction">En infraction</option>
          </select>
          <input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
          <input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
        </div>
      </div>

      {/* Table */}
      <div className={`${card} rounded-xl shadow overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : controles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun contrôle trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Contribuable</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Résultat</th>
                  <th className="px-4 py-3 text-left">Observations</th>
                  <th className="px-4 py-3 text-left">Commune</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {controles.map((c) => (
                  <tr key={c.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3 font-mono text-xs">{c.reference}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.contribuable_nom} {c.contribuable_prenom || ""}</div>
                      <div className="text-xs opacity-60">{c.contribuable_ref}</div>
                    </td>
                    <td className="px-4 py-3">{typeLabels[c.type_controle] || c.type_controle}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${resultatColors[c.resultat] || "bg-gray-100 text-gray-700"}`}>
                        {resultatLabels[c.resultat] || c.resultat}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{c.observations || "—"}</td>
                    <td className="px-4 py-3">{c.commune_nom || "—"}</td>
                    <td className="px-4 py-3">{new Date(c.date_controle).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-sm">Préc.</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-sm">Suiv.</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Nouveau contrôle</h2>

              {/* Contribuable search */}
              <div>
                <label className="block text-sm font-medium mb-1">Contribuable *</label>
                {selectedCtb ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
                    <div>
                      <div className="font-medium">{selectedCtb.nom} {selectedCtb.prenom || ""}</div>
                      <div className="text-xs opacity-60">{selectedCtb.reference} — {selectedCtb.commune_nom}</div>
                    </div>
                    <button onClick={() => { setSelectedCtb(null); setCtbSearch(""); }} className="text-red-500 text-sm">✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" placeholder="Rechercher un contribuable..." value={ctbSearch} onChange={(e) => setCtbSearch(e.target.value)} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                    {ctbResults.length > 0 && (
                      <div className={`absolute top-full left-0 right-0 ${card} border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1`}>
                        {ctbResults.map((c) => (
                          <button key={c.id} onClick={() => { setSelectedCtb(c); setCtbResults([]); setCtbSearch(""); }} className={`w-full text-left px-3 py-2 text-sm ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                            <div className="font-medium">{c.nom} {c.prenom || ""}</div>
                            <div className="text-xs opacity-60">{c.reference} — {c.commune_nom}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Type de contrôle</label>
                <select value={form.type_controle} onChange={(e) => setForm({ ...form, type_controle: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`}>
                  <option value="verification_paiement">Vérification paiement</option>
                  <option value="inspection_terrain">Inspection terrain</option>
                  <option value="audit">Audit</option>
                </select>
              </div>

              {/* Résultat */}
              <div>
                <label className="block text-sm font-medium mb-1">Résultat</label>
                <select value={form.resultat} onChange={(e) => setForm({ ...form, resultat: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`}>
                  <option value="conforme">Conforme</option>
                  <option value="non_conforme">Non conforme</option>
                  <option value="en_infraction">En infraction</option>
                </select>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium mb-1">Observations</label>
                <textarea rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} placeholder="Notes ou observations..." />
              </div>

              {/* Geolocation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
              </div>
              <button type="button" onClick={geolocate} className="text-sm text-[#23A974] hover:underline">📍 Utiliser ma position</button>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Annuler</button>
                <button onClick={handleAdd} disabled={!selectedCtb} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#153258] to-[#23A974] text-white text-sm disabled:opacity-50">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
