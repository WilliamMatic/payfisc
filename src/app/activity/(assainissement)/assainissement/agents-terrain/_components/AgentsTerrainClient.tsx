"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAgentsTerrain, addAgentTerrain, updateAgentTerrain, deleteAgentTerrain, toggleAgentTerrain, getAxes,
} from "@/services/assainissement/assainissementService";
import { AgentTerrain, Axe, Pagination } from "@/services/assainissement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, MapPin, Phone, KeyRound } from "lucide-react";

export default function AgentsTerrainClient() {
  const { utilisateur } = useAuth();
  const [agents, setAgents] = useState<AgentTerrain[]>([]);
  const [axes, setAxes] = useState<Axe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AgentTerrain | null>(null);
  const [deleteItem, setDeleteItem] = useState<AgentTerrain | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom_complet: "", adresse: "", telephone: "", password: "123456", commune_id: "" });

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getAgentsTerrain(utilisateur.site_id, page, 20, deferredSearch);
    if (res.status === "success" && res.data) {
      setAgents(res.data.agents);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, deferredSearch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getAxes(utilisateur.site_id, 1, 200).then((r) => {
        if (r.status === "success" && r.data) setAxes(r.data.communes);
      });
    }
  }, [utilisateur?.site_id]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ nom_complet: "", adresse: "", telephone: "", password: "123456", commune_id: "" });
    setShowModal(true);
  };

  const openEdit = (a: AgentTerrain) => {
    setEditItem(a);
    setForm({
      nom_complet: a.nom_complet,
      adresse: a.adresse || "",
      telephone: a.telephone || "",
      password: "",
      commune_id: a.commune_id ? String(a.commune_id) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom_complet.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      nom_complet: form.nom_complet,
      adresse: form.adresse || null,
      telephone: form.telephone || null,
      commune_id: form.commune_id ? Number(form.commune_id) : null,
      site_id: utilisateur.site_id,
    };
    if (editItem) {
      payload.id = editItem.id;
      if (form.password) payload.password = form.password;
      const res = await updateAgentTerrain(payload);
      if (res.status === "success") { setShowModal(false); load(); }
      else alert(res.message || "Erreur");
    } else {
      payload.password = form.password || "123456";
      const res = await addAgentTerrain(payload);
      if (res.status === "success") { setShowModal(false); load(); }
      else alert(res.message || "Erreur");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteAgentTerrain(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  const handleToggle = async (a: AgentTerrain) => {
    const res = await toggleAgentTerrain(a.id);
    if (res.status === "success") load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agents Terrain</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des agents terrain affectés aux axes</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher un agent..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom complet</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Téléphone</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Adresse</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Axe affecté</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun agent terrain trouvé</td></tr>
                ) : agents.map((a) => (
                  <tr key={a.id} className={`border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!a.actif ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.nom_complet}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {a.telephone ? (
                        <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" />{a.telephone}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.adresse || "—"}</td>
                    <td className="px-4 py-3">
                      {a.commune_nom ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium">
                          <MapPin className="w-3 h-3" />{a.commune_nom}
                        </span>
                      ) : <span className="text-xs text-gray-400">Non affecté</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(a)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          a.actif ? 'bg-[#23A974]' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          a.actif ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{new Date(a.date_creation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => setDeleteItem(a)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} agent(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un agent terrain</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet *</label>
                <input type="text" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none"
                  placeholder="Ex: Jean Mukeba" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                <input type="text" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none"
                  placeholder="Ex: 0812345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none"
                  placeholder="Ex: Av. Batetela, n°12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <span className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Mot de passe {editItem ? "(laisser vide pour ne pas changer)" : ""}</span>
                </label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none font-mono"
                  placeholder={editItem ? "Nouveau mot de passe..." : "123456"} />
                {!editItem && <p className="text-xs text-gray-400 mt-1">Par défaut : 123456</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Axe affecté</label>
                <select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                  <option value="">Aucun axe</option>
                  {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom_complet.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "..." : editItem ? "Enregistrer" : "Ajouter"}
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
            <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom_complet}&quot; ?</p>
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
