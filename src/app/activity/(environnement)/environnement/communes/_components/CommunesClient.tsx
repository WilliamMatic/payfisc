"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCommunes, addCommune, updateCommune, deleteCommune } from "@/services/environnement/environnementService";
import { Commune, Pagination } from "@/services/environnement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CommunesClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<Commune[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Commune | null>(null);
  const [deleteItem, setDeleteItem] = useState<Commune | null>(null);
  const [form, setForm] = useState({ nom: "", code: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getCommunes(utilisateur.site_id, page, 20, search);
    if (res.status === "success" && res.data) { setItems(res.data.communes); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm({ nom: "", code: "" }); setShowModal(true); };
  const openEdit = (c: Commune) => { setEditItem(c); setForm({ nom: c.nom, code: c.code || "" }); setShowModal(true); };
  const handleSave = async () => {
    if (!form.nom.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, site_id: utilisateur.site_id, province_id: utilisateur.province_id };
    const res = editItem ? await updateCommune({ ...data, id: editItem.id }) : await addCommune(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };
  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteCommune(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communes</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des communes</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" />
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Code</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Quartiers</th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune commune</td></tr> : items.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.code || "—"}</td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-bold">{c.nb_quartiers}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(c.date_creation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => setDeleteItem(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} commune(s)</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} une commune</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom.trim()} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : editItem ? "Modifier" : "Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom}&quot; ?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Supprimer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
