"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTypeEngins, addTypeEngin, updateTypeEngin, deleteTypeEngin } from "@/services/embarquement/embarquementService";
import { TypeEnginEmbarquement, Pagination } from "@/services/embarquement/types";
import {
  Search, Plus, Edit3, Trash2, X, Check, Save, Loader2,
  Car, DollarSign, AlertTriangle, ChevronLeft, ChevronRight, Settings,
} from "lucide-react";

export default function ConfigurationClient() {
  const { utilisateur } = useAuth();
  const [types, setTypes] = useState<TypeEnginEmbarquement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<TypeEnginEmbarquement | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm = { nom: "", description: "", prix: "" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getTypeEngins(utilisateur.site_id, page, 20, search);
      if (res.status === "success" && res.data) {
        setTypes(res.data.type_engins);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError("");
    try {
      const res = await addTypeEngin({ ...form, prix: parseFloat(form.prix), site_id: utilisateur?.site_id, utilisateur_id: utilisateur?.id, province_id: utilisateur?.province_id });
      if (res.status === "success") {
        setSuccess("Type d'engin ajouté."); setShowAdd(false); setForm(emptyForm); load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setFormLoading(true); setError("");
    try {
      const res = await updateTypeEngin({ id: selected.id, ...form, prix: parseFloat(form.prix) });
      if (res.status === "success") {
        setSuccess("Type d'engin modifié."); setShowEdit(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await deleteTypeEngin(selected.id);
      if (res.status === "success") {
        setSuccess("Type d'engin supprimé."); setShowDelete(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const openEdit = (t: TypeEnginEmbarquement) => {
    setSelected(t);
    setForm({ nom: t.nom, description: t.description || "", prix: String(t.prix) });
    setShowEdit(true);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  const formFields = () => (
    <div className="space-y-4 p-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom du type <span className="text-red-500">*</span></label>
        <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
          className={inputClass} placeholder="Ex: Moto, Bateau, Véhicule..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass} rows={2} placeholder="Description (optionnel)" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix (USD) <span className="text-red-500">*</span></label>
        <input required type="number" step="0.01" min="0" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })}
          className={inputClass} placeholder="Ex: 5.00" />
      </div>
    </div>
  );

  const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#153258]" /> Types d&apos;engins
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuration des types et tarifs</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau type
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un type..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#153258]" />
          </div>
        ) : types.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun type d&apos;engin trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Description</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Prix</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.nom}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.description || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-[#23A974]">
                        <DollarSign className="w-3.5 h-3.5" />{formatMontant(t.prix)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.actif ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                        {t.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setSelected(t); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} résultat(s)</span>
            <div className="flex items-center gap-1">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau type d&apos;engin</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>
              {formFields()}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modifier le type</h3>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit}>
              {formFields()}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer ce type ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">&laquo; {selected.nom} &raquo; sera définitivement supprimé.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleDelete} disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
