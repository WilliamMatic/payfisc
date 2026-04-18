"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAxes, addAxe, updateAxe, deleteAxe,
  getContribuables, addContribuable, updateContribuable, deleteContribuable,
  getTypesContribuable, getTypesTaxe, addTypeContribuable,
} from "@/services/assainissement/assainissementService";
import { Axe, Contribuable, TypeTaxe, TypeContribuableItem, Pagination } from "@/services/assainissement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, ArrowLeft, Eye, Users } from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

export default function CommunesClient() {
  const { utilisateur } = useAuth();
  const [axes, setAxes] = useState<Axe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Axe | null>(null);
  const [deleteItem, setDeleteItem] = useState<Axe | null>(null);
  const [form, setForm] = useState({ nom: "", code: "" });
  const [saving, setSaving] = useState(false);

  // --- Axe detail (contribuables inside an axe) ---
  const [selectedAxe, setSelectedAxe] = useState<Axe | null>(null);
  const [axeContribuables, setAxeContribuables] = useState<Contribuable[]>([]);
  const [axePagination, setAxePagination] = useState<Pagination | null>(null);
  const [axeLoading, setAxeLoading] = useState(false);
  const [axeSearch, setAxeSearch] = useState("");
  const deferredAxeSearch = useDeferredValue(axeSearch);
  const [axePage, setAxePage] = useState(1);
  const [showAddContribuable, setShowAddContribuable] = useState(false);
  const [typesTaxe, setTypesTaxe] = useState<TypeTaxe[]>([]);
  const [typesContribuable, setTypesContribuable] = useState<TypeContribuableItem[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [savingType, setSavingType] = useState(false);
  const [contribForm, setContribForm] = useState({ nom_etablissement: "", type_contribuable: "", type_taxe_id: "" });
  const [savingContrib, setSavingContrib] = useState(false);
  const [deleteContrib, setDeleteContrib] = useState<Contribuable | null>(null);
  const [editContrib, setEditContrib] = useState<Contribuable | null>(null);
  const [editContribForm, setEditContribForm] = useState({ nom_etablissement: "", type_contribuable: "", type_taxe_id: "" });

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getAxes(utilisateur.site_id, page, 20, deferredSearch);
    if (res.status === "success" && res.data) {
      setAxes(res.data.communes);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, deferredSearch]);

  useEffect(() => { load(); }, [load]);

  // Load reference data for contribuable form
  useEffect(() => {
    if (utilisateur?.site_id) {
      getTypesTaxe(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setTypesTaxe(r.data); });
      getTypesContribuable(utilisateur.site_id).then((r) => { if (r.status === "success" && r.data) setTypesContribuable(r.data); });
    }
  }, [utilisateur?.site_id]);

  const loadAxeContribuables = useCallback(async () => {
    if (!utilisateur?.site_id || !selectedAxe) return;
    setAxeLoading(true);
    const res = await getContribuables(utilisateur.site_id, axePage, 20, deferredAxeSearch, String(selectedAxe.id));
    if (res.status === "success" && res.data) {
      setAxeContribuables(res.data.contribuables);
      setAxePagination(res.data.pagination);
    }
    setAxeLoading(false);
  }, [utilisateur?.site_id, selectedAxe, axePage, deferredAxeSearch]);

  useEffect(() => { if (selectedAxe) loadAxeContribuables(); }, [loadAxeContribuables, selectedAxe]);

  const loadTypesContribuable = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    const r = await getTypesContribuable(utilisateur.site_id);
    if (r.status === "success" && r.data) setTypesContribuable(r.data);
  }, [utilisateur?.site_id]);

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

  const openAdd = () => { setEditItem(null); setForm({ nom: "", code: "" }); setShowModal(true); };
  const openEdit = (c: Axe) => { setEditItem(c); setForm({ nom: c.nom, code: c.code || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nom.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    const data = { ...form, site_id: utilisateur.site_id, province_id: utilisateur.province_id };
    const res = editItem ? await updateAxe({ ...data, id: editItem.id }) : await addAxe(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteAxe(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  const openAxe = (axe: Axe) => {
    setSelectedAxe(axe);
    setAxeSearch("");
    setAxePage(1);
    setShowAddContribuable(false);
  };

  const openAddContribuable = () => {
    setContribForm({ nom_etablissement: "", type_contribuable: typesContribuable[0]?.code || "", type_taxe_id: typesTaxe[0]?.id?.toString() || "" });
    setShowAddContribuable(true);
    setShowAddType(false);
  };

  const handleSaveContribuable = async () => {
    if (!contribForm.nom_etablissement.trim() || !utilisateur?.site_id || !selectedAxe) return;
    setSavingContrib(true);
    try {
      const data: Record<string, unknown> = {
        nom: contribForm.nom_etablissement,
        nom_etablissement: contribForm.nom_etablissement,
        type_contribuable: contribForm.type_contribuable,
        type_taxe_id: contribForm.type_taxe_id ? Number(contribForm.type_taxe_id) : null,
        commune_id: selectedAxe.id,
        site_id: utilisateur.site_id,
        province_id: utilisateur.province_id,
        utilisateur_id: utilisateur.id,
      };
      const res = await addContribuable(data);
      if (res.status === "success") { setShowAddContribuable(false); loadAxeContribuables(); load(); }
      else { alert(res.message || "Erreur lors de l'enregistrement"); }
    } catch { alert("Erreur de connexion au serveur"); }
    setSavingContrib(false);
  };

  const openEditContrib = (c: Contribuable) => {
    setEditContrib(c);
    setEditContribForm({
      nom_etablissement: c.nom_etablissement || c.nom || "",
      type_contribuable: c.type_contribuable || "",
      type_taxe_id: c.type_taxe_id ? String(c.type_taxe_id) : "",
    });
  };

  const handleEditContribuable = async () => {
    if (!editContrib || !editContribForm.nom_etablissement.trim()) return;
    setSavingContrib(true);
    try {
      const res = await updateContribuable({
        id: editContrib.id,
        nom: editContribForm.nom_etablissement,
        prenom: editContrib.prenom,
        telephone: editContrib.telephone,
        email: editContrib.email,
        nom_etablissement: editContribForm.nom_etablissement,
        type_contribuable: editContribForm.type_contribuable,
        numero_parcelle: editContrib.numero_parcelle,
        commune_id: editContrib.commune_id,
        quartier_id: editContrib.quartier_id,
        avenue_id: editContrib.avenue_id,
        numero_avenue: editContrib.numero_avenue,
        latitude: editContrib.latitude,
        longitude: editContrib.longitude,
        type_taxe_id: editContribForm.type_taxe_id ? Number(editContribForm.type_taxe_id) : null,
      });
      if (res.status === "success") { setEditContrib(null); loadAxeContribuables(); }
      else { alert(res.message || "Erreur lors de la modification"); }
    } catch { alert("Erreur de connexion au serveur"); }
    setSavingContrib(false);
  };

  const handleDeleteContrib = async () => {
    if (!deleteContrib) return;
    setSavingContrib(true);
    const res = await deleteContribuable(deleteContrib.id);
    if (res.status === "success") { setDeleteContrib(null); loadAxeContribuables(); load(); }
    setSavingContrib(false);
  };

  // ---------- AXE DETAIL VIEW ----------
  if (selectedAxe) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAxe(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Axe : {selectedAxe.nom}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Contribuables de cet axe</p>
            </div>
          </div>
          <button onClick={openAddContribuable} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
            <Plus className="w-4 h-4" /> Ajouter un contribuable
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un contribuable..." value={axeSearch}
            onChange={(e) => { setAxeSearch(e.target.value); setAxePage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" />
        </div>

        {/* Add contribuable inline form */}
        {showAddContribuable && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nouveau contribuable dans &quot;{selectedAxe.nom}&quot;</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom établissement *</label>
                <input type="text" value={contribForm.nom_etablissement} onChange={(e) => setContribForm({ ...contribForm, nom_etablissement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contribuable *</label>
                <div className="flex gap-2">
                  <select value={contribForm.type_contribuable} onChange={(e) => setContribForm({ ...contribForm, type_contribuable: e.target.value })}
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
                      {savingType ? "..." : "OK"}
                    </button>
                    <button type="button" onClick={() => { setShowAddType(false); setNewTypeName(""); }}
                      className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs">✕</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taxe à payer</label>
                <select value={contribForm.type_taxe_id} onChange={(e) => setContribForm({ ...contribForm, type_taxe_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                  <option value="">Aucune</option>
                  {typesTaxe.map((t) => <option key={t.id} value={t.id}>{t.nom} — {formatMontant(Number(t.montant))}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowAddContribuable(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSaveContribuable} disabled={savingContrib || !contribForm.nom_etablissement.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {savingContrib ? "..." : "Ajouter"}
              </button>
            </div>
          </div>
        )}

        {axeLoading ? (
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
                    <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Taxe</th>
                    <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {axeContribuables.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun contribuable dans cet axe</td></tr>
                  ) : axeContribuables.map((c) => (
                    <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.reference}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom_etablissement || c.nom}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{c.type_contribuable}</td>
                      <td className="px-4 py-3">
                        {c.type_taxe_nom ? (
                          <span className="text-xs">{c.type_taxe_nom} — <strong className="text-[#23A974]">{formatMontant(Number(c.montant_taxe || 0))}</strong></span>
                        ) : <span className="text-xs text-gray-400">Non assigné</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditContrib(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => setDeleteContrib(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {axePagination && axePagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">{axePagination.total} contribuable(s)</span>
                <div className="flex items-center gap-2">
                  <button disabled={axePage <= 1} onClick={() => setAxePage(axePage - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{axePage} / {axePagination.totalPages}</span>
                  <button disabled={axePage >= axePagination.totalPages} onClick={() => setAxePage(axePage + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Contribuable Modal */}
        {editContrib && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Modifier le contribuable</h3>
                <button onClick={() => setEditContrib(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom établissement *</label>
                  <input type="text" value={editContribForm.nom_etablissement} onChange={(e) => setEditContribForm({ ...editContribForm, nom_etablissement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contribuable</label>
                  <select value={editContribForm.type_contribuable} onChange={(e) => setEditContribForm({ ...editContribForm, type_contribuable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                    {typesContribuable.map((t) => <option key={t.id} value={t.code}>{t.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie (Taxe)</label>
                  <select value={editContribForm.type_taxe_id} onChange={(e) => setEditContribForm({ ...editContribForm, type_taxe_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none">
                    <option value="">Aucune</option>
                    {typesTaxe.map((t) => <option key={t.id} value={t.id}>{t.nom} — {formatMontant(Number(t.montant))}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setEditContrib(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
                <button onClick={handleEditContribuable} disabled={savingContrib || !editContribForm.nom_etablissement.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingContrib ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Contribuable Confirmation */}
        {deleteContrib && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteContrib.nom_etablissement || deleteContrib.nom}&quot; ?</p>
              <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setDeleteContrib(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
                <button onClick={handleDeleteContrib} disabled={savingContrib} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingContrib ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- AXES LIST VIEW ----------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Axes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des axes pour la taxe d&apos;assainissement</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher un axe..." value={search}
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
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Code</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuables</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date création</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {axes.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun axe trouvé</td></tr>
                ) : axes.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => openAxe(c)}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.code || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-xs font-bold">
                        <Users className="w-3.5 h-3.5" /> {c.nb_contribuables}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(c.date_creation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openAxe(c)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Voir contribuables"><Eye className="w-4 h-4 text-blue-500" /></button>
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
              <span className="text-sm text-gray-500">{pagination.total} axe(s)</span>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un axe</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom.trim()}
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
