"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sanction, Contribuable, Controle } from "@/app/services/assainissement/types";
import { getSanctions, addSanction, updateStatutSanction, getContribuables, getControles } from "@/app/services/assainissement/assainissementService";

const typeLabels: Record<string, string> = { amende: "Amende", fermeture: "Fermeture", saisie: "Saisie", avertissement: "Avertissement" };
const typeColors: Record<string, string> = { amende: "bg-red-100 text-red-700", fermeture: "bg-purple-100 text-purple-700", saisie: "bg-orange-100 text-orange-700", avertissement: "bg-yellow-100 text-yellow-700" };
const statutColors: Record<string, string> = { active: "bg-red-100 text-red-700", levee: "bg-green-100 text-green-700", payee: "bg-blue-100 text-blue-700" };
const statutLabels: Record<string, string> = { active: "Active", levee: "Levée", payee: "Payée" };

const fCDF = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);

export default function SanctionsClient() {
  const { utilisateur } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const siteId = utilisateur?.site_id || 0;

  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showStatut, setShowStatut] = useState<Sanction | null>(null);

  // Contribuable search
  const [ctbSearch, setCtbSearch] = useState("");
  const [ctbResults, setCtbResults] = useState<Contribuable[]>([]);
  const [selectedCtb, setSelectedCtb] = useState<Contribuable | null>(null);

  // Contrôle search (optional link)
  const [ctrlSearch, setCtrlSearch] = useState("");
  const [ctrlResults, setCtrlResults] = useState<Controle[]>([]);
  const [selectedCtrl, setSelectedCtrl] = useState<Controle | null>(null);

  // Form
  const [form, setForm] = useState({ type_sanction: "avertissement", montant_amende: "", motif: "", date_debut: "", date_fin: "" });

  const fetchData = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const res = await getSanctions(siteId, page, 20, search, filterStatut, filterType);
    if (res.status === "success" && res.data) {
      setSanctions(res.data.sanctions);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [siteId, page, search, filterStatut, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Contribuable search debounce
  useEffect(() => {
    if (ctbSearch.length < 2) { setCtbResults([]); return; }
    const t = setTimeout(async () => {
      const res = await getContribuables(siteId, 1, 10, ctbSearch);
      if (res.status === "success" && res.data) setCtbResults(res.data.contribuables);
    }, 300);
    return () => clearTimeout(t);
  }, [ctbSearch, siteId]);

  // Controle search debounce (for linking)
  useEffect(() => {
    if (ctrlSearch.length < 2) { setCtrlResults([]); return; }
    const t = setTimeout(async () => {
      const res = await getControles(siteId, 1, 10, ctrlSearch);
      if (res.status === "success" && res.data) setCtrlResults(res.data.controles);
    }, 300);
    return () => clearTimeout(t);
  }, [ctrlSearch, siteId]);

  const handleAdd = async () => {
    if (!selectedCtb) return;
    const res = await addSanction({
      contribuable_id: selectedCtb.id,
      controle_id: selectedCtrl?.id || null,
      type_sanction: form.type_sanction,
      montant_amende: form.type_sanction === "amende" && form.montant_amende ? Number(form.montant_amende) : null,
      motif: form.motif || null,
      date_debut: form.date_debut || null,
      date_fin: form.date_fin || null,
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

  const handleStatutUpdate = async (newStatut: string) => {
    if (!showStatut) return;
    const res = await updateStatutSanction(showStatut.id, newStatut);
    if (res.status === "success") {
      setShowStatut(null);
      fetchData();
    }
  };

  const resetForm = () => {
    setForm({ type_sanction: "avertissement", montant_amende: "", motif: "", date_debut: "", date_fin: "" });
    setSelectedCtb(null);
    setSelectedCtrl(null);
    setCtbSearch("");
    setCtrlSearch("");
    setCtbResults([]);
    setCtrlResults([]);
  };

  const card = isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";
  const input = isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">⚖️ Sanctions</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Gestion des sanctions d&apos;assainissement</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:opacity-90 transition font-medium">
          + Nouvelle sanction
        </button>
      </div>

      {/* Filters */}
      <div className={`${card} rounded-xl shadow p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`}>
            <option value="">Tous les statuts</option>
            <option value="active">Active</option>
            <option value="levee">Levée</option>
            <option value="payee">Payée</option>
          </select>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`}>
            <option value="">Tous les types</option>
            <option value="amende">Amende</option>
            <option value="fermeture">Fermeture</option>
            <option value="saisie">Saisie</option>
            <option value="avertissement">Avertissement</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${card} rounded-xl shadow overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : sanctions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune sanction trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Contribuable</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Montant amende</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Contrôle lié</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sanctions.map((s) => (
                  <tr key={s.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3 font-mono text-xs">{s.reference}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.contribuable_nom} {s.contribuable_prenom || ""}</div>
                      <div className="text-xs opacity-60">{s.contribuable_ref}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[s.type_sanction] || "bg-gray-100 text-gray-700"}`}>
                        {typeLabels[s.type_sanction] || s.type_sanction}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.montant_amende ? fCDF(s.montant_amende) : "—"}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{s.motif || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[s.statut] || "bg-gray-100 text-gray-700"}`}>
                        {statutLabels[s.statut] || s.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.controle_ref || "—"}</td>
                    <td className="px-4 py-3">{new Date(s.date_creation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      {s.statut === "active" && (
                        <button onClick={() => setShowStatut(s)} className="text-sm text-[#23A974] hover:underline">Modifier statut</button>
                      )}
                    </td>
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
              <h2 className="text-xl font-bold">Nouvelle sanction</h2>

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

              {/* Contrôle lié (optional) */}
              <div>
                <label className="block text-sm font-medium mb-1">Contrôle lié (optionnel)</label>
                {selectedCtrl ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                    <div>
                      <div className="font-medium">{selectedCtrl.reference}</div>
                      <div className="text-xs opacity-60">{selectedCtrl.contribuable_nom} — {new Date(selectedCtrl.date_controle).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <button onClick={() => { setSelectedCtrl(null); setCtrlSearch(""); }} className="text-red-500 text-sm">✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" placeholder="Rechercher un contrôle..." value={ctrlSearch} onChange={(e) => setCtrlSearch(e.target.value)} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                    {ctrlResults.length > 0 && (
                      <div className={`absolute top-full left-0 right-0 ${card} border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1`}>
                        {ctrlResults.map((c) => (
                          <button key={c.id} onClick={() => { setSelectedCtrl(c); setCtrlResults([]); setCtrlSearch(""); }} className={`w-full text-left px-3 py-2 text-sm ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                            <div className="font-medium">{c.reference}</div>
                            <div className="text-xs opacity-60">{c.contribuable_nom} — {new Date(c.date_controle).toLocaleDateString("fr-FR")}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Type de sanction</label>
                <select value={form.type_sanction} onChange={(e) => setForm({ ...form, type_sanction: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`}>
                  <option value="avertissement">Avertissement</option>
                  <option value="amende">Amende</option>
                  <option value="fermeture">Fermeture</option>
                  <option value="saisie">Saisie</option>
                </select>
              </div>

              {/* Montant amende (conditional) */}
              {form.type_sanction === "amende" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Montant de l&apos;amende (CDF)</label>
                  <input type="number" value={form.montant_amende} onChange={(e) => setForm({ ...form, montant_amende: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} placeholder="0" />
                </div>
              )}

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium mb-1">Motif</label>
                <textarea rows={3} value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} placeholder="Motif de la sanction..." />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date début</label>
                  <input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date fin</label>
                  <input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Annuler</button>
                <button onClick={handleAdd} disabled={!selectedCtb} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#153258] to-[#23A974] text-white text-sm disabled:opacity-50">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-2xl shadow-xl w-full max-w-sm`}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Modifier le statut</h2>
              <p className="text-sm opacity-70">Sanction : <strong>{showStatut.reference}</strong></p>
              <p className="text-sm opacity-70">{showStatut.contribuable_nom} {showStatut.contribuable_prenom || ""}</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleStatutUpdate("levee")} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">Marquer comme levée</button>
                {showStatut.type_sanction === "amende" && (
                  <button onClick={() => handleStatutUpdate("payee")} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Marquer comme payée</button>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setShowStatut(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
