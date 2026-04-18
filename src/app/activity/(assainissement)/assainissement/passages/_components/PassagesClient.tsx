"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Passage, Axe, TypeServiceItem } from "@/app/services/assainissement/types";
import { getPassages, addPassage, terminerPassage, getAxes, getTypesService, addTypeService } from "@/app/services/assainissement/assainissementService";

const FALLBACK_COLORS = ["bg-green-100 text-green-700", "bg-blue-100 text-blue-700", "bg-yellow-100 text-yellow-700", "bg-purple-100 text-purple-700", "bg-pink-100 text-pink-700", "bg-indigo-100 text-indigo-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700"];
const statutColors: Record<string, string> = { en_cours: "bg-orange-100 text-orange-700", termine: "bg-green-100 text-green-700", annule: "bg-red-100 text-red-700" };
const statutLabels: Record<string, string> = { en_cours: "En cours", termine: "Terminé", annule: "Annulé" };

export default function PassagesClient() {
  const { utilisateur } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const siteId = utilisateur?.site_id || 0;

  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [axes, setAxes] = useState<Axe[]>([]);
  const [typesService, setTypesService] = useState<TypeServiceItem[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showTerminer, setShowTerminer] = useState<Passage | null>(null);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [savingType, setSavingType] = useState(false);

  // Form
  const [form, setForm] = useState({
    commune_id: "",
    type_service: "collecte_ordures",
    vehicule_immatriculation: "", chauffeur_nom: "",
    latitude_depart: "", longitude_depart: "",
    observations: "",
  });

  // Terminer form
  const [termForm, setTermForm] = useState({ latitude_arrivee: "", longitude_arrivee: "" });

  const fetchData = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const res = await getPassages(siteId, page, 20, search, filterService, filterCommune, dateDebut, dateFin);
    if (res.status === "success" && res.data) {
      setPassages(res.data.passages);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [siteId, page, search, filterService, filterCommune, dateDebut, dateFin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!siteId) return;
    getAxes(siteId, 1, 200).then((r) => { if (r.status === "success" && r.data) setAxes(r.data.communes); });
    loadTypesService();
  }, [siteId]);

  const loadTypesService = async () => {
    if (!siteId) return;
    const res = await getTypesService(siteId);
    if (res.status === "success" && res.data) setTypesService(res.data);
  };

  const getServiceLabel = (code: string) => typesService.find((t) => t.code === code)?.nom || code;
  const getServiceColor = (code: string) => {
    const idx = typesService.findIndex((t) => t.code === code);
    return FALLBACK_COLORS[idx >= 0 ? idx % FALLBACK_COLORS.length : 0];
  };

  const handleAddType = async () => {
    if (!newTypeName.trim() || savingType) return;
    setSavingType(true);
    const res = await addTypeService({ nom: newTypeName.trim(), site_id: siteId });
    if (res.status === "success") {
      await loadTypesService();
      setNewTypeName("");
      setShowAddType(false);
    } else { alert(res.message || "Erreur lors de l'ajout du type."); }
    setSavingType(false);
  };



  const handleAdd = async () => {
    const res = await addPassage({
      commune_id: form.commune_id ? Number(form.commune_id) : null,
      quartier_id: null,
      avenue_id: null,
      type_service: form.type_service,
      vehicule_immatriculation: form.vehicule_immatriculation || null,
      chauffeur_nom: form.chauffeur_nom || null,
      latitude_depart: form.latitude_depart || null,
      longitude_depart: form.longitude_depart || null,
      observations: form.observations || null,
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

  const handleTerminer = async () => {
    if (!showTerminer) return;
    const res = await terminerPassage({
      id: showTerminer.id,
      latitude_arrivee: termForm.latitude_arrivee || null,
      longitude_arrivee: termForm.longitude_arrivee || null,
    });
    if (res.status === "success") {
      setShowTerminer(null);
      setTermForm({ latitude_arrivee: "", longitude_arrivee: "" });
      fetchData();
    }
  };

  const resetForm = () => {
    setForm({ commune_id: "", type_service: typesService[0]?.code || "collecte_ordures", vehicule_immatriculation: "", chauffeur_nom: "", latitude_depart: "", longitude_depart: "", observations: "" });
  };

  const geolocateDepart = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, latitude_depart: String(pos.coords.latitude), longitude_depart: String(pos.coords.longitude) }));
    });
  };

  const geolocateArrivee = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setTermForm((f) => ({ ...f, latitude_arrivee: String(pos.coords.latitude), longitude_arrivee: String(pos.coords.longitude) }));
    });
  };

  const card = isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";
  const input = isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🚛 Passages</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Suivi des passages de service d&apos;assainissement</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:opacity-90 transition font-medium">
          + Nouveau passage
        </button>
      </div>

      {/* Filters */}
      <div className={`${card} rounded-xl shadow p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
          <select value={filterService} onChange={(e) => { setFilterService(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`}>
            <option value="">Tous les services</option>
            {typesService.map((t) => <option key={t.id} value={t.code}>{t.nom}</option>)}
          </select>
          <select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`}>
            <option value="">Tous les axes</option>
            {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
          <input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPage(1); }} className={`${input} rounded-lg px-3 py-2 border text-sm`} />
        </div>
      </div>

      {/* Table */}
      <div className={`${card} rounded-xl shadow overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : passages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun passage trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Axe</th>
                  <th className="px-4 py-3 text-left">Véhicule</th>
                  <th className="px-4 py-3 text-left">Chauffeur</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Début</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {passages.map((p) => (
                  <tr key={p.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(p.type_service) || "bg-gray-100 text-gray-700"}`}>
                        {getServiceLabel(p.type_service)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.commune_nom || "—"}</td>
                    <td className="px-4 py-3">{p.vehicule_immatriculation || "—"}</td>
                    <td className="px-4 py-3">{p.chauffeur_nom || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutColors[p.statut] || "bg-gray-100 text-gray-700"}`}>
                        {statutLabels[p.statut] || p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.heure_debut ? new Date(p.date_passage + "T" + p.heure_debut).toLocaleString("fr-FR") : new Date(p.date_passage).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-xs">{p.heure_fin || "—"}</td>
                    <td className="px-4 py-3">
                      {p.statut === "en_cours" && (
                        <button onClick={() => { setShowTerminer(p); setTermForm({ latitude_arrivee: "", longitude_arrivee: "" }); }} className="text-sm text-[#23A974] hover:underline">Terminer</button>
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
              <h2 className="text-xl font-bold">Nouveau passage</h2>

              {/* Type service */}
              <div>
                <label className="block text-sm font-medium mb-1">Type de service *</label>
                <div className="flex gap-2">
                  <select value={form.type_service} onChange={(e) => setForm({ ...form, type_service: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm flex-1`}>
                    {typesService.map((t) => <option key={t.id} value={t.code}>{t.nom}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddType(!showAddType)} className="px-3 py-2 bg-[#23A974] text-white rounded-lg text-sm hover:opacity-90 transition" title="Ajouter un type">+</button>
                </div>
                {showAddType && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="Nom du nouveau type..." value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} className={`${input} rounded-lg px-3 py-2 border text-sm flex-1`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddType(); } }} />
                    <button type="button" onClick={handleAddType} disabled={savingType} className="px-3 py-2 bg-[#153258] text-white rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50">{savingType ? "..." : "Ajouter"}</button>
                  </div>
                )}
              </div>

              {/* Axe */}
              <div>
                <label className="block text-sm font-medium mb-1">Axe</label>
                <select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`}>
                  <option value="">— Sélectionner —</option>
                  {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>

              {/* Véhicule & Chauffeur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Immatriculation véhicule</label>
                  <input type="text" value={form.vehicule_immatriculation} onChange={(e) => setForm({ ...form, vehicule_immatriculation: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} placeholder="AB 1234 CD" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom chauffeur</label>
                  <input type="text" value={form.chauffeur_nom} onChange={(e) => setForm({ ...form, chauffeur_nom: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
              </div>

              {/* Geolocation départ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude départ</label>
                  <input type="text" value={form.latitude_depart} onChange={(e) => setForm({ ...form, latitude_depart: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude départ</label>
                  <input type="text" value={form.longitude_depart} onChange={(e) => setForm({ ...form, longitude_depart: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
              </div>
              <button type="button" onClick={geolocateDepart} className="text-sm text-[#23A974] hover:underline">📍 Utiliser ma position (départ)</button>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium mb-1">Observations</label>
                <textarea rows={2} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} placeholder="Notes..." />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Annuler</button>
                <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#153258] to-[#23A974] text-white text-sm">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminer Modal */}
      {showTerminer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-2xl shadow-xl w-full max-w-sm`}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Terminer le passage</h2>
              <p className="text-sm opacity-70">Passage : <strong>{showTerminer.reference}</strong></p>
              <p className="text-sm opacity-70">{getServiceLabel(showTerminer.type_service)} — {showTerminer.commune_nom}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude arrivée</label>
                  <input type="text" value={termForm.latitude_arrivee} onChange={(e) => setTermForm({ ...termForm, latitude_arrivee: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude arrivée</label>
                  <input type="text" value={termForm.longitude_arrivee} onChange={(e) => setTermForm({ ...termForm, longitude_arrivee: e.target.value })} className={`${input} rounded-lg px-3 py-2 border text-sm w-full`} />
                </div>
              </div>
              <button type="button" onClick={geolocateArrivee} className="text-sm text-[#23A974] hover:underline">📍 Utiliser ma position (arrivée)</button>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowTerminer(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Annuler</button>
                <button onClick={handleTerminer} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#153258] to-[#23A974] text-white text-sm">Terminer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
