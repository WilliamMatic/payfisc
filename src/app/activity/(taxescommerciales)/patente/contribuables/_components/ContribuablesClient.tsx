"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContribuables,
  addContribuable,
  updateContribuable,
  deleteContribuable,
} from "@/services/patente/patenteService";
import { ContribuablePatente, Pagination } from "@/services/patente/types";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Save,
  Loader2,
  FileText,
  Briefcase,
  Shield,
  Calendar,
} from "lucide-react";

const TYPES_PERSONNE = [
  { value: "morale", label: "Personne morale (Entreprise)" },
  { value: "physique", label: "Personne physique" },
];

const FORMES_JURIDIQUES = [
  "SARL", "SA", "SAS", "SASU", "SNC", "SCS", "EI", "EURL", "GIE", "Coopérative", "Association", "ONG", "Autre",
];

const SECTEURS_ACTIVITE = [
  "Commerce général", "Commerce de détail", "Commerce de gros", "Import-Export",
  "Services", "Industrie", "Artisanat", "Transport", "Restauration", "Hôtellerie",
  "BTP", "Technologies", "Santé", "Éducation", "Agriculture", "Mines", "Autre",
];

export default function ContribuablesClient() {
  const { utilisateur } = useAuth();
  const [contribuables, setContribuables] = useState<ContribuablePatente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ContribuablePatente | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const emptyForm = {
    nom_complet: "", raison_sociale: "", type_personne: "morale",
    telephone: "", email: "", adresse: "", nif: "",
    rccm: "", id_nat: "", forme_juridique: "", representant_legal: "",
    cnss: "", secteur_activite: "",
    latitude: "", longitude: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getContribuables(utilisateur.site_id, page, 20, search);
      if (res.status === "success" && res.data) {
        setContribuables(res.data.contribuables);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const res = await addContribuable({ ...form, site_id: utilisateur?.site_id, cree_par: utilisateur?.id });
      if (res.status === "success") {
        setSuccess("Contribuable ajouté avec succès.");
        setShowAdd(false);
        setForm(emptyForm);
        load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message || "Erreur");
      }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setFormLoading(true);
    setError("");
    try {
      const res = await updateContribuable({ id: selected.id, ...form });
      if (res.status === "success") {
        setSuccess("Contribuable mis à jour.");
        setShowEdit(false);
        load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message || "Erreur");
      }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    try {
      const res = await deleteContribuable(selected.id);
      if (res.status === "success") {
        setSuccess("Contribuable supprimé.");
        setShowDelete(false);
        load(pagination.page);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch { setError("Erreur"); }
    setFormLoading(false);
  };

  const openEdit = (c: ContribuablePatente) => {
    setSelected(c);
    setForm({
      nom_complet: c.nom_complet, raison_sociale: c.raison_sociale || "",
      type_personne: c.type_personne, telephone: c.telephone,
      email: c.email || "", adresse: c.adresse, nif: c.nif || "",
      rccm: c.rccm || "", id_nat: c.id_nat || "",
      forme_juridique: c.forme_juridique || "", representant_legal: c.representant_legal || "",
      cnss: c.cnss || "", secteur_activite: c.secteur_activite || "",
      latitude: String(c.latitude || ""), longitude: String(c.longitude || ""),
    });
    setShowEdit(true);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors";

  const FormFields = () => (
    <div className="space-y-5">
      {/* Section: Type & Identification */}
      <div>
        <h4 className="text-sm font-semibold text-[#153258] dark:text-blue-300 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Identification de l&apos;entreprise
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de contribuable</label>
            <select value={form.type_personne} onChange={(e) => setForm({ ...form, type_personne: e.target.value })} className={inputClass}>
              {TYPES_PERSONNE.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Raison sociale / Nom de l&apos;entreprise <span className="text-red-500">*</span>
            </label>
            <input required value={form.raison_sociale} onChange={(e) => setForm({ ...form, raison_sociale: e.target.value })}
              className={inputClass} placeholder="Ex: SOCIETE EXEMPLE SARL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nom complet (représentant) <span className="text-red-500">*</span>
            </label>
            <input required value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
              className={inputClass} placeholder="Nom du responsable" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Forme juridique</label>
            <select value={form.forme_juridique} onChange={(e) => setForm({ ...form, forme_juridique: e.target.value })} className={inputClass}>
              <option value="">Sélectionner</option>
              {FORMES_JURIDIQUES.map(f => (<option key={f} value={f}>{f}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Représentant légal</label>
            <input value={form.representant_legal} onChange={(e) => setForm({ ...form, representant_legal: e.target.value })}
              className={inputClass} placeholder="Nom complet du représentant légal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Secteur d&apos;activité</label>
            <select value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })} className={inputClass}>
              <option value="">Sélectionner</option>
              {SECTEURS_ACTIVITE.map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Identifiants fiscaux */}
      <div>
        <h4 className="text-sm font-semibold text-[#23A974] dark:text-emerald-300 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Identifiants fiscaux & légaux
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">NIF</label>
            <input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })}
              className={inputClass} placeholder="Ex: A-1234567-X" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RCCM</label>
            <input value={form.rccm} onChange={(e) => setForm({ ...form, rccm: e.target.value })}
              className={inputClass} placeholder="Ex: CD/KIN/RCCM/12-A-34567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID National (IDNAT)</label>
            <input value={form.id_nat} onChange={(e) => setForm({ ...form, id_nat: e.target.value })}
              className={inputClass} placeholder="Ex: 01-234-N56789A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">N° CNSS</label>
            <input value={form.cnss} onChange={(e) => setForm({ ...form, cnss: e.target.value })}
              className={inputClass} placeholder="Numéro CNSS" />
          </div>
        </div>
      </div>

      {/* Section: Coordonnées */}
      <div>
        <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Coordonnées
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className={inputClass} placeholder="+243 81 234 5678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} placeholder="exemple@societe.cd" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Adresse du siège <span className="text-red-500">*</span>
            </label>
            <input required value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className={inputClass} placeholder="Adresse complète du siège social" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-[#153258] p-1.5 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            Contribuables — Patente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des entreprises assujetties à la patente</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-sm font-medium transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Nouvelle entreprise
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, RCCM, IDNAT, NIF, téléphone, n° fiscal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-[#153258] hover:bg-[#1a3d6b] text-white rounded-lg text-sm font-medium transition-colors">
          Rechercher
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">N° Fiscal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Entreprise</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">RCCM</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Forme jur.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Secteur</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#153258] mx-auto" />
                </td></tr>
              ) : contribuables.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Aucun contribuable trouvé</td></tr>
              ) : (
                contribuables.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#153258]/10 text-[#153258] dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-mono">
                        {c.numero_fiscal}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{c.raison_sociale || c.nom_complet}</p>
                        {c.raison_sociale && (
                          <p className="text-xs text-gray-400">{c.nom_complet}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs font-mono">{c.rccm || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.telephone}</td>
                    <td className="px-4 py-3">
                      {c.forme_juridique ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {c.forme_juridique}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[140px] truncate">{c.secteur_activite || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(c); setShowView(true); }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors" title="Voir">
                          <Eye className="w-4 h-4 text-[#153258] dark:text-blue-400" />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-gray-700 rounded-md transition-colors" title="Modifier">
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>
                        <button onClick={() => { setSelected(c); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">{pagination.total} résultat(s) — Page {pagination.page}/{pagination.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Nouvelle Entreprise</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ajouter un contribuable assujetti à la patente</p>
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" disabled={formLoading}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5">
              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />{error}
                </div>
              )}
              {FormFields()}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium" disabled={formLoading}>
                  Annuler
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {formLoading ? "Enregistrement..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center">
                <div className="bg-amber-500 p-2 rounded-lg mr-3">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Modifier l&apos;entreprise</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mise à jour des informations du contribuable</p>
                </div>
              </div>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" disabled={formLoading}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5">
              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />{error}
                </div>
              )}
              {FormFields()}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium" disabled={formLoading}>
                  Annuler
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {formLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View */}
      {showView && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Détails du contribuable</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Informations complètes</p>
                </div>
              </div>
              <button onClick={() => setShowView(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Identité */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Identité
                </h4>
                <div className="space-y-1.5 text-sm">
                  <InfoRow label="Raison sociale" value={selected.raison_sociale || "—"} />
                  <InfoRow label="Nom complet" value={selected.nom_complet} />
                  <InfoRow label="Forme juridique" value={selected.forme_juridique || "—"} />
                  <InfoRow label="Représentant légal" value={selected.representant_legal || "—"} />
                  <InfoRow label="N° Fiscal" value={selected.numero_fiscal} mono />
                  <InfoRow label="Type" value={selected.type_personne === "morale" ? "Personne morale" : "Personne physique"} />
                </div>
              </div>

              {/* Identifiants fiscaux */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Identifiants fiscaux
                </h4>
                <div className="space-y-1.5 text-sm">
                  <InfoRow label="NIF" value={selected.nif || "—"} mono />
                  <InfoRow label="RCCM" value={selected.rccm || "—"} mono />
                  <InfoRow label="IDNAT" value={selected.id_nat || "—"} mono />
                  <InfoRow label="N° CNSS" value={selected.cnss || "—"} mono />
                </div>
              </div>

              {/* Activité */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Activité
                </h4>
                <div className="space-y-1.5 text-sm">
                  <InfoRow label="Secteur" value={selected.secteur_activite || "—"} />
                </div>
              </div>

              {/* Coordonnées */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Coordonnées
                </h4>
                <div className="space-y-1.5 text-sm">
                  <InfoRow label="Téléphone" value={selected.telephone} />
                  <InfoRow label="Email" value={selected.email || "—"} />
                  <InfoRow label="Adresse" value={selected.adresse} />
                </div>
              </div>

              {/* Infos générales */}
              <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Informations générales
                </h4>
                <div className="space-y-1.5 text-sm">
                  <InfoRow label="Date de création" value={selected.date_creation} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end px-5 py-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <button onClick={() => setShowView(false)}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDelete && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-lg mr-3">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Confirmer la suppression</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible</p>
                </div>
              </div>
              <button onClick={() => setShowDelete(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Voulez-vous vraiment supprimer le contribuable <strong>{selected.raison_sociale || selected.nom_complet}</strong> ?
                </p>
                {selected.numero_fiscal && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-mono">N° Fiscal: {selected.numero_fiscal}</p>
                )}
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button onClick={() => setShowDelete(false)}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={formLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {formLoading ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-gray-900 dark:text-white font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
