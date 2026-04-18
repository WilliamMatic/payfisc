"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEvaluations, addEvaluation, getContribuables, getTypesPollution, getNiveauxRisque, getCategoriesTaxe, getCommunes,
} from "@/services/environnement/environnementService";
import { Evaluation, Contribuable, TypePollution, NiveauRisque, CategorieTaxe, Commune, Pagination } from "@/services/environnement/types";
import { Plus, Search, ChevronLeft, ChevronRight, Filter, X, Eye, MapPin } from "lucide-react";

const CLASSIFICATION_COLORS: Record<string, string> = { conforme: "bg-green-100 text-green-700", non_conforme: "bg-yellow-100 text-yellow-700", critique: "bg-red-100 text-red-700" };
const CLASSIFICATION_LABELS: Record<string, string> = { conforme: "Conforme", non_conforme: "Non conforme", critique: "Critique" };
const IMPACT_LABELS: Record<string, string> = { faible: "Faible", moyen: "Moyen", eleve: "Élevé", critique: "Critique" };

export default function EvaluationsClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<Evaluation[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [typesPollution, setTypesPollution] = useState<TypePollution[]>([]);
  const [niveauxRisque, setNiveauxRisque] = useState<NiveauRisque[]>([]);
  const [categoriesTaxe, setCategoriesTaxe] = useState<CategorieTaxe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterClassification, setFilterClassification] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Evaluation | null>(null);

  // Contribuable search
  const [ctbSearch, setCtbSearch] = useState("");
  const [ctbResults, setCtbResults] = useState<Contribuable[]>([]);
  const [selectedCtb, setSelectedCtb] = useState<Contribuable | null>(null);

  const [form, setForm] = useState({
    pollution_visible: false, type_dechets: "", impact_voisinage: "faible",
    types_pollution: [] as string[], niveau_pollution: "faible",
    score_environnemental: 50, observations: "", classification: "conforme",
    categorie_taxe_recommandee_id: "", latitude: "", longitude: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getEvaluations(utilisateur.site_id, page, 20, search, filterClassification, filterCommune);
    if (res.status === "success" && res.data) { setItems(res.data.evaluations); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterClassification, filterCommune]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getCommunes(utilisateur.site_id, 1, 200).then(r => { if (r.status === "success" && r.data) setCommunes(r.data.communes); });
    getTypesPollution(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setTypesPollution(r.data); });
    getNiveauxRisque(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setNiveauxRisque(r.data); });
    getCategoriesTaxe(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setCategoriesTaxe(r.data); });
  }, [utilisateur?.site_id]);

  useEffect(() => {
    if (ctbSearch.length < 2) { setCtbResults([]); return; }
    const t = setTimeout(async () => {
      if (!utilisateur?.site_id) return;
      const res = await getContribuables(utilisateur.site_id, 1, 10, ctbSearch);
      if (res.status === "success" && res.data) setCtbResults(res.data.contribuables);
    }, 300);
    return () => clearTimeout(t);
  }, [ctbSearch, utilisateur?.site_id]);

  const resetForm = () => {
    setForm({ pollution_visible: false, type_dechets: "", impact_voisinage: "faible", types_pollution: [], niveau_pollution: "faible", score_environnemental: 50, observations: "", classification: "conforme", categorie_taxe_recommandee_id: "", latitude: "", longitude: "" });
    setSelectedCtb(null); setCtbSearch(""); setCtbResults([]);
  };

  const handleAdd = async () => {
    if (!selectedCtb || !utilisateur?.site_id) return;
    setSaving(true);
    const res = await addEvaluation({
      contribuable_id: selectedCtb.id,
      pollution_visible: form.pollution_visible ? 1 : 0,
      type_dechets: form.type_dechets || null,
      impact_voisinage: form.impact_voisinage,
      types_pollution: form.types_pollution.join(",") || null,
      niveau_pollution: form.niveau_pollution,
      score_environnemental: form.score_environnemental,
      observations: form.observations || null,
      classification: form.classification,
      categorie_taxe_recommandee_id: form.categorie_taxe_recommandee_id ? Number(form.categorie_taxe_recommandee_id) : null,
      latitude: form.latitude || null, longitude: form.longitude || null,
      province_id: utilisateur.province_id, site_id: utilisateur.site_id, agent_id: utilisateur.id,
    });
    if (res.status === "success") { setShowAdd(false); resetForm(); load(); }
    setSaving(false);
  };

  const geolocate = () => { navigator.geolocation.getCurrentPosition(pos => setForm(f => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }))); };
  const togglePollType = (nom: string) => setForm(f => ({ ...f, types_pollution: f.types_pollution.includes(nom) ? f.types_pollution.filter(t => t !== nom) : [...f.types_pollution, nom] }));

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Évaluations</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Évaluations environnementales des contribuables</p></div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Nouvelle évaluation</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterClassification} onChange={(e) => { setFilterClassification(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes classifications</option>{Object.entries(CLASSIFICATION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
            <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Score</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Classification</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Pollution</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune évaluation</td></tr> : items.map(e => (
            <tr key={e.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.reference}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{e.contribuable_nom} {e.contribuable_prenom}</p><p className="text-xs text-gray-500">{e.nom_etablissement || e.contribuable_ref}</p></td>
              <td className="px-4 py-3 text-center"><div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold" style={{ backgroundColor: e.score_environnemental >= 70 ? "#dcfce7" : e.score_environnemental >= 40 ? "#fef9c3" : "#fee2e2", color: e.score_environnemental >= 70 ? "#16a34a" : e.score_environnemental >= 40 ? "#ca8a04" : "#dc2626" }}>{e.score_environnemental}</div></td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${CLASSIFICATION_COLORS[e.classification] || "bg-gray-100 text-gray-700"}`}>{CLASSIFICATION_LABELS[e.classification] || e.classification}</span></td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{e.niveau_pollution}</td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(e.date_evaluation).toLocaleDateString("fr-FR")}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => setShowDetail(e)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button></td>
            </tr>
          ))}</tbody></table></div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} évaluation(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-[#153258] to-[#23A974] p-6 rounded-t-2xl text-white">
            <div className="flex items-center justify-between"><div><p className="text-lg font-bold">{showDetail.contribuable_nom} {showDetail.contribuable_prenom}</p><p className="text-xs text-white/60 font-mono">{showDetail.reference}</p></div><button onClick={() => setShowDetail(null)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button></div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center"><div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: showDetail.score_environnemental >= 70 ? "#dcfce7" : showDetail.score_environnemental >= 40 ? "#fef9c3" : "#fee2e2", color: showDetail.score_environnemental >= 70 ? "#16a34a" : showDetail.score_environnemental >= 40 ? "#ca8a04" : "#dc2626" }}>{showDetail.score_environnemental}</div><p className="text-xs text-gray-500 mt-1">Score</p></div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Classification</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${CLASSIFICATION_COLORS[showDetail.classification] || ""}`}>{CLASSIFICATION_LABELS[showDetail.classification] || showDetail.classification}</span></div>
                <div><p className="text-xs text-gray-500">Pollution visible</p><p className="text-sm font-medium">{showDetail.pollution_visible ? "Oui" : "Non"}</p></div>
                <div><p className="text-xs text-gray-500">Niveau pollution</p><p className="text-sm font-medium">{showDetail.niveau_pollution}</p></div>
                <div><p className="text-xs text-gray-500">Impact voisinage</p><p className="text-sm font-medium">{IMPACT_LABELS[showDetail.impact_voisinage] || showDetail.impact_voisinage}</p></div>
              </div>
            </div>
            {showDetail.types_pollution && <div><p className="text-xs text-gray-500 mb-1">Types de pollution</p><div className="flex flex-wrap gap-1">{showDetail.types_pollution.split(",").map(t => <span key={t} className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded text-xs">{t.trim()}</span>)}</div></div>}
            {showDetail.type_dechets && <div><p className="text-xs text-gray-500 mb-1">Types de déchets</p><p className="text-sm text-gray-900 dark:text-white">{showDetail.type_dechets}</p></div>}
            {showDetail.observations && <div><p className="text-xs text-gray-500 mb-1">Observations</p><p className="text-sm text-gray-900 dark:text-white">{showDetail.observations}</p></div>}
            {showDetail.categorie_recommandee_nom && <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><p className="text-xs text-green-600 mb-1">Catégorie de taxe recommandée</p><p className="font-medium text-green-700 dark:text-green-300">{showDetail.categorie_recommandee_nom}</p></div>}
          </div>
        </div></div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle évaluation</h3><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            {/* Contribuable search */}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribuable *</label>
              {selectedCtb ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"><div><div className="font-medium text-sm">{selectedCtb.nom} {selectedCtb.prenom || ""}</div><div className="text-xs opacity-60">{selectedCtb.reference} — {selectedCtb.commune_nom}</div></div><button onClick={() => { setSelectedCtb(null); setCtbSearch(""); }} className="text-red-500 text-sm">✕</button></div>
              ) : (
                <div className="relative"><input type="text" placeholder="Rechercher un contribuable..." value={ctbSearch} onChange={(e) => setCtbSearch(e.target.value)} className={inputClass} />
                  {ctbResults.length > 0 && <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">{ctbResults.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCtb(c); setCtbResults([]); setCtbSearch(""); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"><div className="font-medium">{c.nom} {c.prenom || ""}</div><div className="text-xs opacity-60">{c.reference} — {c.commune_nom}</div></button>
                  ))}</div>}
                </div>
              )}</div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">État environnemental</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.pollution_visible} onChange={(e) => setForm({ ...form, pollution_visible: e.target.checked })} className="rounded border-gray-300" /> Pollution visible</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impact voisinage</label><select value={form.impact_voisinage} onChange={(e) => setForm({ ...form, impact_voisinage: e.target.value })} className={inputClass}>{Object.entries(IMPACT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Niveau de pollution</label><select value={form.niveau_pollution} onChange={(e) => setForm({ ...form, niveau_pollution: e.target.value })} className={inputClass}><option value="faible">Faible</option><option value="moyen">Moyen</option><option value="eleve">Élevé</option><option value="critique">Critique</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Types de déchets</label><input type="text" value={form.type_dechets} onChange={(e) => setForm({ ...form, type_dechets: e.target.value })} placeholder="Ex: plastiques, organiques..." className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Types de pollution</label><div className="flex flex-wrap gap-2">{typesPollution.map(tp => (
              <button key={tp.id} type="button" onClick={() => togglePollType(tp.nom)} className={`px-3 py-1 rounded-full text-xs border transition-colors ${form.types_pollution.includes(tp.nom) ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-orange-400"}`}>{tp.nom}</button>
            ))}</div></div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Score & Classification</p>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score environnemental: <span className="font-bold text-[#23A974]">{form.score_environnemental}/100</span></label><input type="range" min={0} max={100} value={form.score_environnemental} onChange={(e) => setForm({ ...form, score_environnemental: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-[#23A974]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classification</label><select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} className={inputClass}>{Object.entries(CLASSIFICATION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie taxe recommandée</label><select value={form.categorie_taxe_recommandee_id} onChange={(e) => setForm({ ...form, categorie_taxe_recommandee_id: e.target.value })} className={inputClass}><option value="">Sélectionner...</option>{categoriesTaxe.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observations</label><textarea rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className={inputClass} /></div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Géolocalisation</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label><input type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label><input type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={inputClass} /></div>
            </div>
            <button type="button" onClick={geolocate} className="text-sm text-[#23A974] hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> Utiliser ma position</button>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !selectedCtb} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Enregistrer"}</button>
          </div>
        </div></div>
      )}
    </div>
  );
}
