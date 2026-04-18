"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTypesTaxe, addTypeTaxe, updateTypeTaxe, deleteTypeTaxe } from "@/services/assainissement/assainissementService";
import { TypeTaxe } from "@/services/assainissement/types";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const PERIODICITES = [
  { value: "mensuelle", label: "Mensuelle" },
  { value: "trimestrielle", label: "Trimestrielle" },
  { value: "semestrielle", label: "Semestrielle" },
  { value: "annuelle", label: "Annuelle" },
];

export default function TypesTaxeClient() {
  const { utilisateur } = useAuth();
  const [types, setTypes] = useState<TypeTaxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TypeTaxe | null>(null);
  const [deleteItem, setDeleteItem] = useState<TypeTaxe | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", montant: "", periodicite: "mensuelle" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getTypesTaxe(utilisateur.site_id);
    if (res.status === "success" && res.data) setTypes(res.data);
    setLoading(false);
  }, [utilisateur?.site_id]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm({ nom: "", description: "", montant: "", periodicite: "mensuelle" }); setShowModal(true); };
  const openEdit = (t: TypeTaxe) => { setEditItem(t); setForm({ nom: t.nom, description: t.description || "", montant: String(t.montant), periodicite: t.periodicite }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.montant || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, montant: Number(form.montant), site_id: utilisateur.site_id };
    const res = editItem ? await updateTypeTaxe({ ...data, id: editItem.id }) : await addTypeTaxe(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteTypeTaxe(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Types de taxe</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuration des types et montants de taxe d&apos;assainissement</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {types.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-8">Aucun type de taxe configuré</p>
          ) : types.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t.nom}</h3>
                  {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
                  <button onClick={() => setDeleteItem(t)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#23A974]">{formatMontant(Number(t.montant))}</span>
                <span className="text-xs bg-[#153258]/10 text-[#153258] dark:bg-[#153258]/30 dark:text-blue-300 px-2 py-1 rounded-full font-medium capitalize">{t.periodicite}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un type de taxe</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (CDF) *</label>
                  <input type="number" min="0" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Périodicité *</label>
                  <select value={form.periodicite} onChange={(e) => setForm({ ...form, periodicite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                    {PERIODICITES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom.trim() || !form.montant}
                className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "..." : editItem ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom}&quot; ?</p>
            <p className="text-sm text-gray-500">Cette action est irréversible.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
