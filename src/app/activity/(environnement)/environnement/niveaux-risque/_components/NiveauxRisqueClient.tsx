"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNiveauxRisque, addNiveauRisque, updateNiveauRisque, deleteNiveauRisque } from "@/services/environnement/environnementService";
import { NiveauRisque } from "@/services/environnement/types";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";

export default function NiveauxRisqueClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<NiveauRisque[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<NiveauRisque | null>(null);
  const [deleteItem, setDeleteItem] = useState<NiveauRisque | null>(null);
  const [form, setForm] = useState({ nom: "", code: "", coefficient: "1", couleur: "#22c55e" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getNiveauxRisque(utilisateur.site_id);
    if (res.status === "success" && res.data) setItems(res.data);
    setLoading(false);
  }, [utilisateur?.site_id]);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => i.nom.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditItem(null); setForm({ nom: "", code: "", coefficient: "1", couleur: "#22c55e" }); setShowModal(true); };
  const openEdit = (n: NiveauRisque) => { setEditItem(n); setForm({ nom: n.nom, code: n.code, coefficient: String(n.coefficient), couleur: n.couleur || "#22c55e" }); setShowModal(true); };
  const handleSave = async () => {
    if (!form.nom.trim() || !form.code.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, coefficient: parseFloat(form.coefficient), site_id: utilisateur.site_id };
    const res = editItem ? await updateNiveauRisque({ ...data, id: editItem.id }) : await addNiveauRisque(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };
  const handleDelete = async () => { if (!deleteItem) return; setSaving(true); const res = await deleteNiveauRisque(deleteItem.id); if (res.status === "success") { setDeleteItem(null); load(); } setSaving(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Niveaux de risque</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des niveaux de risque environnemental</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Couleur</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Code</th>
            <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Coefficient</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun niveau</td></tr> : filtered.map(n => (
            <tr key={n.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3"><div className="w-8 h-8 rounded-lg border-2 border-gray-200" style={{ backgroundColor: n.couleur }} /></td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{n.nom}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">{n.code}</span></td>
              <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold" style={{ backgroundColor: n.couleur + "20", color: n.couleur }}>x{n.coefficient}</span></td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(n)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => setDeleteItem(n)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un niveau</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coefficient *</label><input type="number" step="0.1" min="0.1" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur *</label><div className="flex items-center gap-2"><input type="color" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer" /><span className="text-sm text-gray-500 font-mono">{form.couleur}</span></div></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom.trim() || !form.code.trim()} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : editItem ? "Modifier" : "Ajouter"}</button>
          </div>
        </div></div>
      )}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
          <Trash2 className="w-12 h-12 text-red-500 mx-auto" /><p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom}&quot; ?</p>
          <div className="flex items-center justify-center gap-3"><button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button><button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Supprimer"}</button></div>
        </div></div>
      )}
    </div>
  );
}
