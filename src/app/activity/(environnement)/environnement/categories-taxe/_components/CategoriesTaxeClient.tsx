"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCategoriesTaxe, addCategorieTaxe, updateCategorieTaxe, deleteCategorieTaxe } from "@/services/environnement/environnementService";
import { CategorieTaxe } from "@/services/environnement/types";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);
const PERIODICITE_LABELS: Record<string, string> = { mensuelle: "Mensuelle", trimestrielle: "Trimestrielle", semestrielle: "Semestrielle", annuelle: "Annuelle" };

export default function CategoriesTaxeClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<CategorieTaxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CategorieTaxe | null>(null);
  const [deleteItem, setDeleteItem] = useState<CategorieTaxe | null>(null);
  const [form, setForm] = useState({ nom: "", code: "", montant: "", periodicite: "mensuelle", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getCategoriesTaxe(utilisateur.site_id);
    if (res.status === "success" && res.data) setItems(res.data);
    setLoading(false);
  }, [utilisateur?.site_id]);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => i.nom.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditItem(null); setForm({ nom: "", code: "", montant: "", periodicite: "mensuelle", description: "" }); setShowModal(true); };
  const openEdit = (c: CategorieTaxe) => { setEditItem(c); setForm({ nom: c.nom, code: c.code, montant: String(c.montant), periodicite: c.periodicite, description: c.description || "" }); setShowModal(true); };
  const handleSave = async () => {
    if (!form.nom.trim() || !form.code.trim() || !form.montant || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, montant: Number(form.montant), site_id: utilisateur.site_id };
    const res = editItem ? await updateCategorieTaxe({ ...data, id: editItem.id }) : await addCategorieTaxe(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };
  const handleDelete = async () => { if (!deleteItem) return; setSaving(true); const res = await deleteCategorieTaxe(deleteItem.id); if (res.status === "success") { setDeleteItem(null); load(); } setSaving(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories de taxe</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des catégories et tarifs de la taxe environnementale</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Code</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Périodicité</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Description</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune catégorie</td></tr> : filtered.map(c => (
            <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded text-xs font-mono">{c.code}</span></td>
              <td className="px-4 py-3 text-right font-bold text-[#23A974]">{formatMontant(c.montant)}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full text-xs">{PERIODICITE_LABELS[c.periodicite] || c.periodicite}</span></td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{c.description || "—"}</td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => setDeleteItem(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} une catégorie</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (CDF) *</label><input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Périodicité *</label><select value={form.periodicite} onChange={(e) => setForm({ ...form, periodicite: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">{Object.entries(PERIODICITE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" /></div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom.trim() || !form.code.trim() || !form.montant} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : editItem ? "Modifier" : "Ajouter"}</button>
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
