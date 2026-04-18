"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContribuables, addContribuable, updateContribuable, deleteContribuable,
  getAxes, getTypesTaxe, getTypesContribuable, addTypeContribuable,
} from "@/services/assainissement/assainissementService";
import { Contribuable, Axe, TypeTaxe, TypeContribuableItem, Pagination } from "@/services/assainissement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Filter, Eye } from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const FALLBACK_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
];

export default function ContribuablesClient() {
  const { utilisateur } = useAuth();
  const [contribuables, setContribuables] = useState<Contribuable[]>([]);
  const [axes, setAxes] = useState<Axe[]>([]);
  const [typesTaxe, setTypesTaxe] = useState<TypeTaxe[]>([]);
  const [typesContribuable, setTypesContribuable] = useState<TypeContribuableItem[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterAxe, setFilterAxe] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Contribuable | null>(null);
  const [editItem, setEditItem] = useState<Contribuable | null>(null);
  const [deleteItem, setDeleteItem] = useState<Contribuable | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom_etablissement: "", type_contribuable: "", commune_id: "", type_taxe_id: "",
  });

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getContribuables(utilisateur.site_id, page, 20, search, filterAxe, filterType);
    if (res.status === "success" && res.data) {
      setContribuables(res.data.contribuables);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterAxe, filterType]);

  useEffect(() => { load(); }, [load]);

  const loadTypesContribuable = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    const r = await getTypesContribuable(utilisateur.site_id);
    if (r.status === "success" && r.data) setTypesContribuable(r.data);
  }, [utilisateur?.site_id]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getAxes(utilisateur.site_id, 1, 200).then((r) => { if (r.status === "success" && r.data) setAxes(r.data.communes); });
      getTypesTaxe(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setTypesTaxe(r.data); });
      loadTypesContribuable();
    }
  }, [utilisateur?.site_id, loadTypesContribuable]);

  const getTypeLabel = (code: string) => typesContribuable.find((t) => t.code === code)?.nom || code;
  const getTypeColor = (code: string) => {
    const idx = typesContribuable.findIndex((t) => t.code === code);
    return FALLBACK_COLORS[idx >= 0 ? idx % FALLBACK_COLORS.length : 0];
  };

  const handleAddType = async () => {
    if (!newTypeName.trim() || !utilisateur?.site_id) return;
    setSavingType(true);
    const res = await addTypeContribuable({ nom: newTypeName.trim(), site_id: utilisateur.site_id });
    if (res.status === "success") {
      await loadTypesContribuable();
      setNewTypeName("");
      setShowAddType(false);
    }
    setSavingType(false);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ nom_etablissement: "", type_contribuable: typesContribuable[0]?.code || "", commune_id: "", type_taxe_id: typesTaxe[0]?.id?.toString() || "" });
    setShowAddType(false);
    setShowModal(true);
  };

  const openEdit = (c: Contribuable) => {
    setEditItem(c);
    setForm({
      nom_etablissement: c.nom_etablissement || c.nom || "",
      type_contribuable: c.type_contribuable,
      commune_id: c.commune_id ? String(c.commune_id) : "",
      type_taxe_id: c.type_taxe_id ? String(c.type_taxe_id) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom_etablissement.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        nom: form.nom_etablissement,
        nom_etablissement: form.nom_etablissement,
        type_contribuable: form.type_contribuable,
        commune_id: form.commune_id ? Number(form.commune_id) : null,
        type_taxe_id: form.type_taxe_id ? Number(form.type_taxe_id) : null,
        site_id: utilisateur.site_id,
        province_id: utilisateur.province_id,
        utilisateur_id: utilisateur.id,
      };
      const res = editItem ? await updateContribuable({ ...data, id: editItem.id }) : await addContribuable(data);
      if (res.status === "success") { setShowModal(false); load(); }
      else { alert(res.message || "Erreur lors de l'enregistrement"); }
    } catch (err) {
      console.error("Erreur handleSave:", err);
      alert("Erreur de connexion au serveur");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteContribuable(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contribuables</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des contribuables assujettis à la taxe d&apos;assainissement</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom, référence..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterAxe} onChange={(e) => { setFilterAxe(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="">Tous les axes</option>
            {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="">Tous types</option>
            {typesContribuable.map((t) => <option key={t.id} value={t.code}>{t.nom}</option>)}
          </select>
        </div>
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
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom établissement</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Axe</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Taxe</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contribuables.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun contribuable trouvé</td></tr>
                ) : contribuables.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{c.nom_etablissement || c.nom}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(c.type_contribuable)}`}>
                        {getTypeLabel(c.type_contribuable)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.commune_nom || "—"}</td>
                    <td className="px-4 py-3">
                      {c.type_taxe_nom ? (
                        <span className="text-xs">{c.type_taxe_nom} — <strong className="text-[#23A974]">{formatMontant(Number(c.montant_taxe || 0))}</strong></span>
                      ) : <span className="text-xs text-gray-400">Non assigné</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowDetail(c)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button>
                        <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => setDeleteItem(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} contribuable(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Hero header */}
            <div className="relative bg-gradient-to-br from-[#153258] to-[#23A974] px-6 pt-6 pb-10">
              <button onClick={() => setShowDetail(null)} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full transition"><X className="w-4 h-4 text-white" /></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {(showDetail.nom_etablissement || showDetail.nom).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">{showDetail.nom_etablissement || showDetail.nom}</h3>
                  <p className="text-white/70 text-sm font-mono mt-0.5">{showDetail.reference}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium">{getTypeLabel(showDetail.type_contribuable)}</span>
                {showDetail.commune_nom && <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white/80 text-xs">🛣️ {showDetail.commune_nom}</span>}
              </div>
            </div>

            {/* Taxe banner */}
            {showDetail.type_taxe_nom && (
              <div className="mx-6 -mt-5 relative z-10">
                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Taxe assignée</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{showDetail.type_taxe_nom}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Montant</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-[#153258] to-[#23A974] bg-clip-text text-transparent">{formatMontant(Number(showDetail.montant_taxe || 0))}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className={`px-6 ${showDetail.type_taxe_nom ? "pt-4" : "pt-2"} pb-6`}>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Créé le {new Date(showDetail.date_creation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${showDetail.actif ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{showDetail.actif ? "Actif" : "Inactif"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un contribuable</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom établissement *</label>
                <input type="text" value={form.nom_etablissement} onChange={(e) => setForm({ ...form, nom_etablissement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contribuable *</label>
                <div className="flex gap-2">
                  <select value={form.type_contribuable} onChange={(e) => setForm({ ...form, type_contribuable: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                    {typesContribuable.map((t) => <option key={t.id} value={t.code}>{t.nom}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddType(true)}
                    className="px-2 py-2 bg-[#23A974] text-white rounded-lg hover:bg-[#1e9466] transition text-sm" title="Ajouter un type">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {showAddType && (
                  <div className="mt-2 flex gap-2">
                    <input type="text" placeholder="Nom du nouveau type..." value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddType(); }}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
                    <button type="button" onClick={handleAddType} disabled={savingType || !newTypeName.trim()}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-xs font-medium disabled:opacity-50">
                      {savingType ? "..." : "Ajouter"}
                    </button>
                    <button type="button" onClick={() => { setShowAddType(false); setNewTypeName(""); }}
                      className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs">✕</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Axe</label>
                <select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                  <option value="">Sélectionner un axe...</option>
                  {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taxe à payer</label>
                <select value={form.type_taxe_id} onChange={(e) => setForm({ ...form, type_taxe_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                  <option value="">Aucune</option>
                  {typesTaxe.map((t) => <option key={t.id} value={t.id}>{t.nom} — {formatMontant(Number(t.montant))}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom_etablissement.trim()}
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
            <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom_etablissement || deleteItem.nom}&quot; ?</p>
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
