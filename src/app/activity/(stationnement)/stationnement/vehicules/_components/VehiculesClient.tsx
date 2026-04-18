"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getVehicules, addVehicule, updateVehicule, deleteVehicule } from "@/services/stationnement/stationnementService";
import { VehiculeStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, Edit3, Trash2, X, Check, Save, Loader2,
  Car, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";

export default function VehiculesClient() {
  const { utilisateur } = useAuth();
  const [vehicules, setVehicules] = useState<VehiculeStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<VehiculeStationnement | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm: { plaque: string; marque_modele: string; couleur: string; type: "taxi" | "bus" | "moto" | "voiture_privee" | "camion" } = { plaque: "", marque_modele: "", couleur: "", type: "voiture_privee" };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getVehicules(utilisateur.site_id, page, 20, search);
      if (res.status === "success" && res.data) {
        setVehicules(res.data.vehicules);
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
      const res = await addVehicule({ plaque: form.plaque, type: form.type, marque_modele: form.marque_modele || null, couleur: form.couleur || null, site_id: utilisateur?.site_id, utilisateur_id: utilisateur?.id });
      if (res.status === "success") {
        setSuccess("Véhicule ajouté."); setShowAdd(false); setForm(emptyForm); load(1);
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
      const res = await updateVehicule({ id: selected.id, plaque: form.plaque, type: form.type, marque_modele: form.marque_modele || null, couleur: form.couleur || null, actif: selected.actif });
      if (res.status === "success") {
        setSuccess("Véhicule modifié."); setShowEdit(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await deleteVehicule(selected.id);
      if (res.status === "success") {
        setSuccess("Véhicule supprimé."); setShowDelete(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const openEdit = (v: VehiculeStationnement) => {
    setSelected(v);
    setForm({
      plaque: v.plaque || "", marque_modele: v.marque_modele || "",
      couleur: v.couleur || "", type: v.type || "voiture_privee",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plaque <span className="text-red-500">*</span></label>
          <input required value={form.plaque} onChange={(e) => setForm({ ...form, plaque: e.target.value })} className={inputClass} placeholder="Ex: KN-1234-AB" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type <span className="text-red-500">*</span></label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "taxi" | "bus" | "moto" | "voiture_privee" | "camion" })} className={inputClass}>
            <option value="voiture_privee">Voiture privée</option>
            <option value="taxi">Taxi</option>
            <option value="bus">Bus</option>
            <option value="moto">Moto</option>
            <option value="camion">Camion</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marque / Modèle</label>
          <input value={form.marque_modele} onChange={(e) => setForm({ ...form, marque_modele: e.target.value })} className={inputClass} placeholder="Toyota Corolla, Honda Civic..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur</label>
          <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className={inputClass} placeholder="Noir, Blanc..." />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-[#153258]" /> Véhicules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des véhicules enregistrés</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau véhicule
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
        ) : vehicules.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Car className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun véhicule trouvé</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Marque/Modèle</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Couleur</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Propriétaire</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicules.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.plaque}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{v.type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.marque_modele || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.couleur || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.proprietaire_nom || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(v); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"><Trash2 className="w-4 h-4" /></button>
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} résultat(s)</span>
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
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau véhicule</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd}>{formFields()}
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
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modifier le véhicule</h3>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit}>{formFields()}
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
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer ce véhicule ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">&laquo; {selected.plaque} &raquo; sera définitivement supprimé.</p>
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
