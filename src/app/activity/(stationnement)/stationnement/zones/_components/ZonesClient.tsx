"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { getZones, addZone, updateZone, deleteZone, getTypesZones, addTypeZone } from "@/services/stationnement/stationnementService";
import { ZoneStationnement, Pagination } from "@/services/stationnement/types";
import {
  Search, Plus, Edit3, Trash2, X, Check, Save, Loader2,
  MapPin, Map, DollarSign, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";

const ZoneMapModal = dynamic(() => import("./ZoneMapModal"), { ssr: false });

export default function ZonesClient() {
  const { utilisateur } = useAuth();
  const [zones, setZones] = useState<ZoneStationnement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ZoneStationnement | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [defaultCoords, setDefaultCoords] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  const emptyForm: { nom: string; description: string; type: string; capacite: string; tarif: string; mode_tarification: "horaire" | "journalier" | "forfait"; latitude: string; longitude: string } = { nom: "", description: "", type: "parking", capacite: "", tarif: "", mode_tarification: "journalier", latitude: defaultCoords.lat, longitude: defaultCoords.lng };
  const [form, setForm] = useState(emptyForm);
  const [typesZones, setTypesZones] = useState<{ id: number; nom: string }[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [mapZone, setMapZone] = useState<ZoneStationnement | null>(null);
  const [typeLoading, setTypeLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getZones(utilisateur.site_id, page, 20, search);
      if (res.status === "success" && res.data) {
        setZones(res.data.zones);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setDefaultCoords({ lat, lng });
          setForm((f) => ({ ...f, latitude: f.latitude || lat, longitude: f.longitude || lng }));
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getTypesZones(utilisateur.site_id).then((res) => {
        if (res.status === "success" && res.data) setTypesZones(res.data);
      });
    }
  }, [utilisateur?.site_id]);

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    setTypeLoading(true);
    try {
      const res = await addTypeZone({ nom: newTypeName.trim(), site_id: utilisateur?.site_id, utilisateur_id: utilisateur?.id });
      if (res.status === "success" && res.data) {
        setTypesZones(prev => [...prev, { id: res.data!.id, nom: res.data!.nom }]);
        setForm(f => ({ ...f, type: res.data!.nom }));
        setNewTypeName(""); setShowAddType(false);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setTypeLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setError("");
    try {
      const res = await addZone({
        nom: form.nom,
        type: form.type,
        description: form.description || null,
        tarif: form.tarif ? parseFloat(form.tarif) : 0,
        mode_tarification: form.mode_tarification,
        capacite: form.capacite ? parseInt(form.capacite) : null,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        site_id: utilisateur?.site_id,
        utilisateur_id: utilisateur?.id,
      });
      if (res.status === "success") {
        setSuccess("Zone ajoutée."); setShowAdd(false); setForm(emptyForm); load(1);
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
      const res = await updateZone({
        id: selected.id,
        nom: form.nom,
        type: form.type,
        description: form.description || null,
        tarif: form.tarif ? parseFloat(form.tarif) : 0,
        mode_tarification: form.mode_tarification,
        capacite: form.capacite ? parseInt(form.capacite) : null,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        actif: selected.actif,
      });
      if (res.status === "success") {
        setSuccess("Zone modifiée."); setShowEdit(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await deleteZone(selected.id);
      if (res.status === "success") {
        setSuccess("Zone supprimée."); setShowDelete(false); load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else { setError(res.message || "Erreur"); }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const openEdit = (z: ZoneStationnement) => {
    setSelected(z);
    setForm({
      nom: z.nom, description: z.description || "", type: z.type || "parking",
      capacite: z.capacite ? String(z.capacite) : "", tarif: z.tarif ? String(z.tarif) : "",
      mode_tarification: z.mode_tarification || "journalier",
      latitude: z.latitude != null ? String(z.latitude) : "",
      longitude: z.longitude != null ? String(z.longitude) : "",
    });
    setShowEdit(true);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";
  const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

  const formFields = () => (
    <div className="space-y-4 p-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom <span className="text-red-500">*</span></label>
          <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputClass} placeholder="Ex: Zone Centre-Ville" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de zone <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
              {typesZones.map((t) => (
                <option key={t.id} value={t.nom}>{t.nom.charAt(0).toUpperCase() + t.nom.slice(1)}</option>
              ))}
            </select>
            <button type="button" onClick={() => { setShowAddType(true); setNewTypeName(""); }}
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-[#153258] hover:bg-[#1a3d6d] text-white rounded-lg transition-colors"
              title="Ajouter un type">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showAddType && (
            <div className="mt-2 flex gap-2">
              <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)}
                className={inputClass} placeholder="Nouveau type..." autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddType(); } }} />
              <button type="button" onClick={handleAddType} disabled={typeLoading || !newTypeName.trim()}
                className="shrink-0 px-3 py-2 bg-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {typeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => setShowAddType(false)}
                className="shrink-0 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Description de la zone" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tarif (FC) <span className="text-red-500">*</span></label>
          <input type="number" step="0.01" min="0" required value={form.tarif} onChange={(e) => setForm({ ...form, tarif: e.target.value })} className={inputClass} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mode tarification</label>
          <select value={form.mode_tarification} onChange={(e) => setForm({ ...form, mode_tarification: e.target.value as "horaire" | "journalier" | "forfait" })} className={inputClass}>
            <option value="journalier">Journalier</option>
            <option value="horaire">Horaire</option>
            <option value="forfait">Forfait</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Capacité</label>
          <input type="number" min="0" value={form.capacite} onChange={(e) => setForm({ ...form, capacite: e.target.value })} className={inputClass} placeholder="Nb places" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Latitude</label>
          <input type="number" step="0.0000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={inputClass} placeholder="Ex: -4.3250000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Longitude</label>
          <input type="number" step="0.0000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={inputClass} placeholder="Ex: 15.3125000" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#153258]" /> Zones de stationnement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des zones et tarifs</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouvelle zone
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une zone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30" />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#153258]" /></div>
        ) : zones.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune zone trouvée</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Description</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Mode</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Capacité</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Tarif</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{z.nom}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{z.description || "—"}</td>
                    <td className="px-4 py-3 text-center capitalize">{z.type}</td>
                    <td className="px-4 py-3 text-center capitalize">{z.mode_tarification}</td>
                    <td className="px-4 py-3 text-center">{z.capacite || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-[#23A974]"><DollarSign className="w-3.5 h-3.5" />{formatMontant(Number(z.tarif))}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${z.actif ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                        {z.actif ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {z.latitude && z.longitude && (
                          <button onClick={() => { setMapZone(z); setShowMap(true); }} title="Voir sur la carte" className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-emerald-600"><Map className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => openEdit(z)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(z); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle zone</h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modifier la zone</h3>
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

      {/* Modal Carte */}
      {showMap && mapZone && (
        <ZoneMapModal
          zone={mapZone}
          onClose={() => { setShowMap(false); setMapZone(null); }}
          onSaved={() => load(pagination.page)}
        />
      )}

      {/* Modal Supprimer */}
      {showDelete && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer cette zone ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">&laquo; {selected.nom} &raquo; sera définitivement supprimée.</p>
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
