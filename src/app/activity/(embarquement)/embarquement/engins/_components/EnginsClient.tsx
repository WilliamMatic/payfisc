"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEngins, addEngin, updateEngin, deleteEngin, getTypeEngins } from "@/services/embarquement/embarquementService";
import { EnginEmbarquement, TypeEnginEmbarquement, Pagination } from "@/services/embarquement/types";
import {
  Search, Plus, Edit3, Trash2, X, Check, Save, Loader2,
  Car, AlertTriangle, ChevronLeft, ChevronRight, Bike,
} from "lucide-react";

export default function EnginsClient() {
  const { utilisateur } = useAuth();
  const [engins, setEngins] = useState<EnginEmbarquement[]>([]);
  const [typeEngins, setTypeEngins] = useState<TypeEnginEmbarquement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<EnginEmbarquement | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm = {
    type_engin_id: "", numero_plaque: "", marque_modele: "", numero_chassis: "",
    numero_moteur: "", annee_circulation: "", annee_fabrication: "", couleur: "", puissance_fiscale: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [enginsRes, typesRes] = await Promise.all([
        getEngins(utilisateur.site_id, page, 20, search),
        getTypeEngins(utilisateur.site_id, 1, 100, ""),
      ]);
      if (enginsRes.status === "success" && enginsRes.data) {
        setEngins(enginsRes.data.engins);
        setPagination(enginsRes.data.pagination);
      }
      if (typesRes.status === "success" && typesRes.data) {
        setTypeEngins(typesRes.data.type_engins);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true); setError("");
    try {
      const res = await addEngin({ ...form, type_engin_id: parseInt(form.type_engin_id), site_id: utilisateur?.site_id, utilisateur_id: utilisateur?.id, province_id: utilisateur?.province_id });
      if (res.status === "success") {
        setSuccess("Engin ajouté."); setShowAdd(false); setForm(emptyForm); load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return;
    setFormLoading(true); setError("");
    try {
      const res = await updateEngin({ id: selected.id, ...form, type_engin_id: parseInt(form.type_engin_id) });
      if (res.status === "success") {
        setSuccess("Engin modifié."); setShowEdit(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return; setFormLoading(true);
    try {
      const res = await deleteEngin(selected.id);
      if (res.status === "success") {
        setSuccess("Engin supprimé."); setShowDelete(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const openEdit = (e: EnginEmbarquement) => {
    setSelected(e);
    setForm({
      type_engin_id: String(e.type_engin_id), numero_plaque: e.numero_plaque,
      marque_modele: e.marque_modele || "", numero_chassis: e.numero_chassis || "",
      numero_moteur: e.numero_moteur || "", annee_circulation: e.annee_circulation ? String(e.annee_circulation) : "",
      annee_fabrication: e.annee_fabrication ? String(e.annee_fabrication) : "",
      couleur: e.couleur || "", puissance_fiscale: e.puissance_fiscale || "",
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type d&apos;engin <span className="text-red-500">*</span></label>
          <select required value={form.type_engin_id} onChange={(e) => setForm({ ...form, type_engin_id: e.target.value })} className={inputClass}>
            <option value="">Sélectionner un type</option>
            {typeEngins.filter(t => t.actif).map(t => (<option key={t.id} value={t.id}>{t.nom} — {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(t.prix)}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° Plaque <span className="text-red-500">*</span></label>
          <input required value={form.numero_plaque} onChange={(e) => setForm({ ...form, numero_plaque: e.target.value })} className={inputClass} placeholder="Ex: KIN-1234-AB" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marque / Modèle</label>
          <input value={form.marque_modele} onChange={(e) => setForm({ ...form, marque_modele: e.target.value })} className={inputClass} placeholder="Ex: Toyota Hilux" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° Châssis</label>
          <input value={form.numero_chassis} onChange={(e) => setForm({ ...form, numero_chassis: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° Moteur</label>
          <input value={form.numero_moteur} onChange={(e) => setForm({ ...form, numero_moteur: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Année circulation</label>
          <input type="number" value={form.annee_circulation} onChange={(e) => setForm({ ...form, annee_circulation: e.target.value })} className={inputClass} placeholder="2024" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Année fabrication</label>
          <input type="number" value={form.annee_fabrication} onChange={(e) => setForm({ ...form, annee_fabrication: e.target.value })} className={inputClass} placeholder="2023" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur</label>
          <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className={inputClass} placeholder="Ex: Blanc" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Puissance fiscale</label>
          <input value={form.puissance_fiscale} onChange={(e) => setForm({ ...form, puissance_fiscale: e.target.value })} className={inputClass} placeholder="Ex: 7 CV" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-[#153258]" /> Engins
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des engins enregistrés</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvel engin
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par plaque, marque..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : engins.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Car className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun engin trouvé</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Marque/Modèle</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Couleur</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {engins.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-bold text-[#153258] dark:text-blue-300">{e.numero_plaque}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{e.type_engin_nom || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{e.marque_modele || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{e.couleur || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(e); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">{pagination.total} résultat(s)</span>
            <div className="flex items-center gap-1">
              <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajouter */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvel engin</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>
              {formFields()}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modifier l&apos;engin</h3>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit}>
              {formFields()}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2.5 text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium" disabled={formLoading}>Annuler</button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium">
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
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer cet engin ?</h3>
            <p className="text-sm text-gray-500 mb-6">Plaque &laquo; {selected.numero_plaque} &raquo;</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleDelete} disabled={formLoading} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
