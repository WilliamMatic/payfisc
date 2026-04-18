"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getControles, addControle, getContribuables } from "@/services/environnement/environnementService";
import { Controle, Contribuable, Pagination } from "@/services/environnement/types";
import { Search, ChevronLeft, ChevronRight, Plus, X, MapPin, ClipboardCheck, Eye } from "lucide-react";

const TYPE_LABELS: Record<string, string> = { verification_paiement: "Vérification de paiement", inspection_terrain: "Inspection de terrain", audit: "Audit" };
const RESULTAT_LABELS: Record<string, string> = { conforme: "Conforme", non_conforme: "Non conforme", en_infraction: "En infraction" };
const RESULTAT_COLORS: Record<string, string> = { conforme: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", non_conforme: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", en_infraction: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };

export default function ControlesClient() {
  const { utilisateur } = useAuth();
  const [controles, setControles] = useState<Controle[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterResultat, setFilterResultat] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contribuable_id: "", type_controle: "verification_paiement", resultat: "conforme", observations: "", latitude: "", longitude: "" });
  const [contribSearch, setContribSearch] = useState("");
  const [contribResults, setContribResults] = useState<Contribuable[]>([]);
  const [selectedContrib, setSelectedContrib] = useState<Contribuable | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDetail, setShowDetail] = useState<Controle | null>(null);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getControles(utilisateur.site_id, page, 20, search, filterType, filterResultat);
    if (res.status === "success" && res.data) { setControles(res.data.controles); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterType, filterResultat]);
  useEffect(() => { load(); }, [load]);

  const searchContrib = (q: string) => {
    setContribSearch(q);
    setSelectedContrib(null);
    setForm(f => ({ ...f, contribuable_id: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2 || !utilisateur?.site_id) { setContribResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await getContribuables(utilisateur!.site_id!, 1, 10, q);
      if (res.status === "success" && res.data) setContribResults(res.data.contribuables);
    }, 300);
  };

  const selectContrib = (c: Contribuable) => {
    setSelectedContrib(c);
    setContribSearch(`${c.nom} ${c.prenom} — ${c.reference}`);
    setContribResults([]);
    setForm(f => ({ ...f, contribuable_id: String(c.id) }));
  };

  const getGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm(f => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
    });
  };

  const handleAdd = async () => {
    if (!form.contribuable_id || !utilisateur?.site_id) return;
    setSaving(true);
    const res = await addControle({
      contribuable_id: Number(form.contribuable_id), type_controle: form.type_controle, resultat: form.resultat, observations: form.observations,
      latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null,
      site_id: utilisateur.site_id, province_id: utilisateur.province_id, utilisateur_id: utilisateur.id,
    });
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };

  const openAdd = () => {
    setForm({ contribuable_id: "", type_controle: "verification_paiement", resultat: "conforme", observations: "", latitude: "", longitude: "" });
    setContribSearch(""); setSelectedContrib(null); setContribResults([]);
    setShowModal(true);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contrôles</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Contrôle et vérification des contribuables</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Nouveau contrôle</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300"><option value="">Tous types</option>{Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={filterResultat} onChange={(e) => { setFilterResultat(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300"><option value="">Tous résultats</option>{Object.entries(RESULTAT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>

      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white">
            <th className="text-left px-4 py-3 font-medium">Contribuable</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Résultat</th>
            <th className="text-left px-4 py-3 font-medium">Observations</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>{controles.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun contrôle trouvé</td></tr> : controles.map(c => (
            <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{c.contribuable_nom} {c.contribuable_prenom}</p><p className="text-xs text-gray-500">{c.contribuable_ref}</p></td>
              <td className="px-4 py-3 text-xs">{TYPE_LABELS[c.type_controle] || c.type_controle}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${RESULTAT_COLORS[c.resultat] || "bg-gray-100 text-gray-700"}`}>{RESULTAT_LABELS[c.resultat] || c.resultat}</span></td>
              <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{c.observations || "—"}</td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(c.date_controle).toLocaleString("fr-FR")}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => setShowDetail(c)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button></td>
            </tr>
          ))}</tbody></table></div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} contrôle(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-[#23A974]" /> Nouveau contrôle</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribuable *</label>
              <input type="text" value={contribSearch} onChange={(e) => searchContrib(e.target.value)} placeholder="Rechercher un contribuable..." className={inputClass} />
              {contribResults.length > 0 && <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">{contribResults.map(c => (
                <button key={c.id} onClick={() => selectContrib(c)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"><span className="font-medium text-gray-900 dark:text-white">{c.nom} {c.prenom}</span><span className="text-xs text-gray-500 ml-2">{c.reference}</span></button>
              ))}</div>}
              {selectedContrib && <p className="text-xs text-green-600 mt-1">{selectedContrib.nom} {selectedContrib.prenom} — {selectedContrib.nom_etablissement || ""}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contrôle *</label><select value={form.type_controle} onChange={(e) => setForm({ ...form, type_controle: e.target.value })} className={inputClass}>{Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résultat *</label><select value={form.resultat} onChange={(e) => setForm({ ...form, resultat: e.target.value })} className={inputClass}>{Object.entries(RESULTAT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observations</label><textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={3} className={inputClass} /></div>
            <div>
              <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Géolocalisation</label><button type="button" onClick={getGeolocation} className="text-xs text-[#23A974] hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> Position actuelle</button></div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Latitude" className={inputClass} />
                <input type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Longitude" className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !form.contribuable_id} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Enregistrer"}</button>
          </div>
        </div></div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="bg-gradient-to-r from-[#153258] to-[#23A974] rounded-t-2xl p-5 text-white">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Détail du contrôle</h3><button onClick={() => setShowDetail(null)} className="p-2 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button></div>
            <p className="text-sm opacity-80 mt-1">{showDetail.contribuable_nom} {showDetail.contribuable_prenom}</p>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Référence contrib.</span><span className="font-medium text-gray-900 dark:text-white">{showDetail.contribuable_ref}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-900 dark:text-white">{TYPE_LABELS[showDetail.type_controle]}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Résultat</span><span className={`text-xs px-2 py-1 rounded-full font-medium ${RESULTAT_COLORS[showDetail.resultat]}`}>{RESULTAT_LABELS[showDetail.resultat]}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-900 dark:text-white">{new Date(showDetail.date_controle).toLocaleString("fr-FR")}</span></div>
            {showDetail.observations && <div><span className="text-gray-500 block mb-1">Observations</span><p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{showDetail.observations}</p></div>}
            {showDetail.latitude && showDetail.longitude && <div className="flex justify-between"><span className="text-gray-500">Position GPS</span><span className="text-gray-900 dark:text-white font-mono text-xs">{showDetail.latitude}, {showDetail.longitude}</span></div>}
          </div>
          <div className="p-5 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowDetail(null)} className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Fermer</button></div>
        </div></div>
      )}
    </div>
  );
}
