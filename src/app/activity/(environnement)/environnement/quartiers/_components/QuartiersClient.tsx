"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getQuartiers, addQuartier, updateQuartier, deleteQuartier, getCommunes } from "@/services/environnement/environnementService";
import { Quartier, Commune, Pagination } from "@/services/environnement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function QuartiersClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<Quartier[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterCommune, setFilterCommune] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Quartier | null>(null);
  const [deleteItem, setDeleteItem] = useState<Quartier | null>(null);
  const [form, setForm] = useState({ nom: "", commune_id: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getQuartiers(utilisateur.site_id, filterCommune ? Number(filterCommune) : undefined, page, 20, search);
    if (res.status === "success" && res.data) { setItems(res.data.quartiers); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterCommune]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (utilisateur?.site_id) getCommunes(utilisateur.site_id, 1, 200).then(r => { if (r.status === "success" && r.data) setCommunes(r.data.communes); }); }, [utilisateur?.site_id]);

  const openAdd = () => { setEditItem(null); setForm({ nom: "", commune_id: "" }); setShowModal(true); };
  const openEdit = (q: Quartier) => { setEditItem(q); setForm({ nom: q.nom, commune_id: String(q.commune_id) }); setShowModal(true); };
  const handleSave = async () => {
    if (!form.nom.trim() || !form.commune_id || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, commune_id: Number(form.commune_id), site_id: utilisateur.site_id, province_id: utilisateur.province_id };
    const res = editItem ? await updateQuartier({ ...data, id: editItem.id }) : await addQuartier(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };
  const handleDelete = async () => { if (!deleteItem) return; setSaving(true); const res = await deleteQuartier(deleteItem.id); if (res.status === "success") { setDeleteItem(null); load(); } setSaving(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quartiers</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des quartiers</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Commune</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun quartier</td></tr> : items.map(q => (
            <tr key={q.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{q.nom}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{q.commune_nom}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(q.date_creation).toLocaleDateString("fr-FR")}</td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(q)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => setDeleteItem(q)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} quartier(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un quartier</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commune *</label><select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none"><option value="">Sélectionner...</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom.trim() || !form.commune_id} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : editItem ? "Modifier" : "Ajouter"}</button>
          </div>
        </div></div>
      )}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
          <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom}&quot; ?</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Supprimer"}</button>
          </div>
        </div></div>
      )}
    </div>
  );
}
