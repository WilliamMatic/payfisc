"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContribuables, addContribuable, updateContribuable, deleteContribuable,
  getCommunes, getQuartiers, getAvenues, getTypesActivite, getNiveauxRisque, getCategoriesTaxe,
} from "@/services/environnement/environnementService";
import { Contribuable, Commune, Quartier, Avenue, TypeActivite, NiveauRisque, CategorieTaxe, Pagination } from "@/services/environnement/types";
import { Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Filter, Eye, MapPin } from "lucide-react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);

export default function ContribuablesClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<Contribuable[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [typesActivite, setTypesActivite] = useState<TypeActivite[]>([]);
  const [niveauxRisque, setNiveauxRisque] = useState<NiveauRisque[]>([]);
  const [categoriesTaxe, setCategoriesTaxe] = useState<CategorieTaxe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterCommune, setFilterCommune] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Contribuable | null>(null);
  const [editItem, setEditItem] = useState<Contribuable | null>(null);
  const [deleteItem, setDeleteItem] = useState<Contribuable | null>(null);
  const [formQuartiers, setFormQuartiers] = useState<Quartier[]>([]);
  const [formAvenues, setFormAvenues] = useState<Avenue[]>([]);
  const [form, setForm] = useState({
    nom: "", prenom: "", nom_etablissement: "", telephone: "", email: "",
    type_activite: "", description_activite: "", niveau_risque: "", categorie_taxe_id: "",
    commune_id: "", quartier_id: "", avenue_id: "", numero_avenue: "", numero_parcelle: "",
    latitude: "", longitude: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getContribuables(utilisateur.site_id, page, 20, search, filterCommune, filterType);
    if (res.status === "success" && res.data) { setItems(res.data.contribuables); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterCommune, filterType]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getCommunes(utilisateur.site_id, 1, 200).then(r => { if (r.status === "success" && r.data) setCommunes(r.data.communes); });
    getQuartiers(utilisateur.site_id, undefined, 1, 500).then(r => { if (r.status === "success" && r.data) setQuartiers(r.data.quartiers); });
    getAvenues(utilisateur.site_id, undefined, 1, 500).then(r => { if (r.status === "success" && r.data) setAvenues(r.data.avenues); });
    getTypesActivite(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setTypesActivite(r.data); });
    getNiveauxRisque(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setNiveauxRisque(r.data); });
    getCategoriesTaxe(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setCategoriesTaxe(r.data); });
  }, [utilisateur?.site_id]);

  // Cascading selects in form
  useEffect(() => {
    if (form.commune_id && utilisateur?.site_id) {
      getQuartiers(utilisateur.site_id, Number(form.commune_id), 1, 200).then(r => { if (r.status === "success" && r.data) setFormQuartiers(r.data.quartiers); else setFormQuartiers([]); });
    } else { setFormQuartiers([]); }
  }, [form.commune_id, utilisateur?.site_id]);
  useEffect(() => {
    if (form.quartier_id && utilisateur?.site_id) {
      getAvenues(utilisateur.site_id, Number(form.quartier_id), 1, 200).then(r => { if (r.status === "success" && r.data) setFormAvenues(r.data.avenues); else setFormAvenues([]); });
    } else { setFormAvenues([]); }
  }, [form.quartier_id, utilisateur?.site_id]);

  const resetForm = () => setForm({ nom: "", prenom: "", nom_etablissement: "", telephone: "", email: "", type_activite: "", description_activite: "", niveau_risque: "", categorie_taxe_id: "", commune_id: "", quartier_id: "", avenue_id: "", numero_avenue: "", numero_parcelle: "", latitude: "", longitude: "" });
  const openAdd = () => { setEditItem(null); resetForm(); setShowModal(true); };
  const openEdit = (c: Contribuable) => {
    setEditItem(c);
    setForm({
      nom: c.nom, prenom: c.prenom || "", nom_etablissement: c.nom_etablissement || "",
      telephone: c.telephone || "", email: c.email || "", type_activite: c.type_activite || "",
      description_activite: c.description_activite || "", niveau_risque: c.niveau_risque || "",
      categorie_taxe_id: c.categorie_taxe_id ? String(c.categorie_taxe_id) : "",
      commune_id: c.commune_id ? String(c.commune_id) : "", quartier_id: c.quartier_id ? String(c.quartier_id) : "",
      avenue_id: c.avenue_id ? String(c.avenue_id) : "", numero_avenue: c.numero_avenue || "",
      numero_parcelle: c.numero_parcelle || "", latitude: c.latitude || "", longitude: c.longitude || "",
    });
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!form.nom.trim() || !utilisateur?.site_id) return;
    setSaving(true);
    const data = {
      ...form, categorie_taxe_id: form.categorie_taxe_id ? Number(form.categorie_taxe_id) : null,
      commune_id: form.commune_id ? Number(form.commune_id) : null,
      quartier_id: form.quartier_id ? Number(form.quartier_id) : null,
      avenue_id: form.avenue_id ? Number(form.avenue_id) : null,
      site_id: utilisateur.site_id, province_id: utilisateur.province_id,
    };
    const res = editItem ? await updateContribuable({ ...data, id: editItem.id }) : await addContribuable(data);
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };
  const handleDelete = async () => { if (!deleteItem) return; setSaving(true); const res = await deleteContribuable(deleteItem.id); if (res.status === "success") { setDeleteItem(null); load(); } setSaving(false); };
  const geolocate = () => { navigator.geolocation.getCurrentPosition(pos => setForm(f => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }))); };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contribuables</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des contribuables environnement</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher par nom, référence..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes activités</option>{typesActivite.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}</select></div>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Nom / Établissement</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Activité</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Risque</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Commune</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Taxe</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun contribuable</td></tr> : items.map(c => (
            <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.reference}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{c.nom} {c.prenom}</p>{c.nom_etablissement && <p className="text-xs text-gray-500">{c.nom_etablissement}</p>}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-xs">{c.type_activite || "—"}</span></td>
              <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: niveauxRisque.find(n => n.nom === c.niveau_risque)?.couleur + "20" || "#f3f4f6", color: niveauxRisque.find(n => n.nom === c.niveau_risque)?.couleur || "#6b7280" }}>{c.niveau_risque || "—"}</span></td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{c.commune_nom || "—"}</td>
              <td className="px-4 py-3 text-right font-bold text-[#23A974] text-xs">{c.montant_taxe ? formatMontant(c.montant_taxe) : "—"}</td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                <button onClick={() => setShowDetail(c)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button>
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => setDeleteItem(c)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-[#153258] to-[#23A974] p-6 rounded-t-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">{showDetail.nom[0]}{showDetail.prenom?.[0] || ""}</div>
                <div><p className="text-lg font-bold">{showDetail.nom} {showDetail.prenom}</p>{showDetail.nom_etablissement && <p className="text-sm text-white/80">{showDetail.nom_etablissement}</p>}<p className="text-xs text-white/60 font-mono">{showDetail.reference}</p></div>
              </div>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {showDetail.categorie_taxe_nom && <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between"><span className="text-sm text-green-700 dark:text-green-300 font-medium">{showDetail.categorie_taxe_nom}</span><span className="font-bold text-green-700 dark:text-green-300">{showDetail.montant_taxe ? formatMontant(showDetail.montant_taxe) : "—"}</span></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500 mb-1">Activité</p><p className="text-sm font-medium text-gray-900 dark:text-white">{showDetail.type_activite || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Niveau de risque</p><p className="text-sm font-medium" style={{ color: niveauxRisque.find(n => n.nom === showDetail.niveau_risque)?.couleur || "#6b7280" }}>{showDetail.niveau_risque || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Téléphone</p><p className="text-sm text-gray-900 dark:text-white">{showDetail.telephone || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="text-sm text-gray-900 dark:text-white">{showDetail.email || "—"}</p></div>
            </div>
            <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Localisation</p><p className="text-sm text-gray-900 dark:text-white">{[showDetail.commune_nom, showDetail.quartier_nom, showDetail.avenue_nom].filter(Boolean).join(", ") || "—"}</p>{(showDetail.numero_avenue || showDetail.numero_parcelle) && <p className="text-xs text-gray-500">N° avenue: {showDetail.numero_avenue || "—"} · N° parcelle: {showDetail.numero_parcelle || "—"}</p>}</div>
          </div>
        </div></div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">{editItem ? "Modifier" : "Ajouter"} un contribuable</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label><input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={inputClass} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom établissement</label><input type="text" value={form.nom_etablissement} onChange={(e) => setForm({ ...form, nom_etablissement: e.target.value })} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label><input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Activité & Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d&apos;activité</label><select value={form.type_activite} onChange={(e) => setForm({ ...form, type_activite: e.target.value })} className={inputClass}><option value="">Sélectionner...</option>{typesActivite.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Niveau de risque</label><select value={form.niveau_risque} onChange={(e) => setForm({ ...form, niveau_risque: e.target.value })} className={inputClass}><option value="">Sélectionner...</option>{niveauxRisque.map(n => <option key={n.id} value={n.nom}>{n.nom} (x{n.coefficient})</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description de l&apos;activité</label><textarea rows={2} value={form.description_activite} onChange={(e) => setForm({ ...form, description_activite: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie de taxe</label><select value={form.categorie_taxe_id} onChange={(e) => setForm({ ...form, categorie_taxe_id: e.target.value })} className={inputClass}><option value="">Sélectionner...</option>{categoriesTaxe.map(c => <option key={c.id} value={c.id}>{c.nom} — {formatMontant(c.montant)}</option>)}</select></div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Localisation</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commune</label><select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value, quartier_id: "", avenue_id: "" })} className={inputClass}><option value="">Sélectionner...</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quartier</label><select value={form.quartier_id} onChange={(e) => setForm({ ...form, quartier_id: e.target.value, avenue_id: "" })} className={inputClass} disabled={!form.commune_id}><option value="">Sélectionner...</option>{formQuartiers.map(q => <option key={q.id} value={q.id}>{q.nom}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avenue</label><select value={form.avenue_id} onChange={(e) => setForm({ ...form, avenue_id: e.target.value })} className={inputClass} disabled={!form.quartier_id}><option value="">Sélectionner...</option>{formAvenues.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° avenue</label><input type="text" value={form.numero_avenue} onChange={(e) => setForm({ ...form, numero_avenue: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° parcelle</label><input type="text" value={form.numero_parcelle} onChange={(e) => setForm({ ...form, numero_parcelle: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label><input type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label><input type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={inputClass} /></div>
            </div>
            <button type="button" onClick={geolocate} className="text-sm text-[#23A974] hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> Utiliser ma position</button>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom.trim()} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : editItem ? "Modifier" : "Ajouter"}</button>
          </div>
        </div></div>
      )}

      {/* Delete Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
          <Trash2 className="w-12 h-12 text-red-500 mx-auto" /><p className="text-gray-900 dark:text-white font-medium">Supprimer &quot;{deleteItem.nom} {deleteItem.prenom}&quot; ?</p><p className="text-xs text-gray-500">{deleteItem.reference}</p>
          <div className="flex items-center justify-center gap-3"><button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button><button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Supprimer"}</button></div>
        </div></div>
      )}
    </div>
  );
}
