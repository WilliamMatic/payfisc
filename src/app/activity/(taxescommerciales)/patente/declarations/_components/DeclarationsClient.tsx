"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDeclarations,
  addDeclaration,
  getContribuables,
  getBaremes,
  getTypesActivite,
  getSecteursActivite,
  addTypeActivite,
  addSecteurActivite,
} from "@/services/patente/patenteService";
import { DeclarationPatente, ContribuablePatente, Pagination, TypeActivitePatente, SecteurActivitePatente } from "@/services/patente/types";
import {
  Search, Plus, Eye, X, FileText, ChevronLeft, ChevronRight, Check, AlertTriangle, Filter, Building2, Loader2,
} from "lucide-react";
import Link from "next/link";

const STATUTS_LABELS: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  soumise: { label: "Soumise", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  en_classification: { label: "En classification", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  classifiee: { label: "Classifiée", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  validee: { label: "Validée", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rejetee: { label: "Rejetée", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export default function DeclarationsClient() {
  const { utilisateur } = useAuth();
  const [declarations, setDeclarations] = useState<DeclarationPatente[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState<DeclarationPatente | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Contribuable autocomplete
  const [contribuables, setContribuables] = useState<ContribuablePatente[]>([]);
  const [contribSearch, setContribSearch] = useState("");
  const [contribDropdownOpen, setContribDropdownOpen] = useState(false);
  const [selectedContrib, setSelectedContrib] = useState<ContribuablePatente | null>(null);
  const contribRef = useRef<HTMLDivElement>(null);

  // Types & Secteurs dynamiques
  const [typesActivite, setTypesActivite] = useState<TypeActivitePatente[]>([]);
  const [secteursActivite, setSecteursActivite] = useState<SecteurActivitePatente[]>([]);
  const [showAddType, setShowAddType] = useState(false);
  const [showAddSecteur, setShowAddSecteur] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newSecteurCode, setNewSecteurCode] = useState("");
  const [newSecteurLabel, setNewSecteurLabel] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [addingSecteur, setAddingSecteur] = useState(false);

  const [form, setForm] = useState({
    contribuable_id: "", type_activite: "", secteur_activite: "",
    description_activite: "", adresse_activite: "", chiffre_affaires_estime: "",
    nombre_employes: "", surface_local_m2: "", annee_fiscale: String(new Date().getFullYear()),
  });

  const load = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getDeclarations(utilisateur.site_id, page, 20, filterStatut, search);
      if (res.status === "success" && res.data) {
        setDeclarations(res.data.declarations);
        setPagination(res.data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [utilisateur?.site_id, search, filterStatut]);

  useEffect(() => { load(); }, [load]);

  // Load contribuables with search for autocomplete
  const loadContribuables = useCallback(async (q: string) => {
    if (!utilisateur?.site_id) return;
    const res = await getContribuables(utilisateur.site_id, 1, 20, q);
    if (res.status === "success" && res.data) setContribuables(res.data.contribuables);
  }, [utilisateur?.site_id]);

  // Load types & secteurs from DB when modal opens
  const loadTypesEtSecteurs = useCallback(async () => {
    const [resTypes, resSecteurs] = await Promise.all([getTypesActivite(), getSecteursActivite()]);
    if (resTypes.status === "success" && resTypes.data) setTypesActivite(resTypes.data);
    if (resSecteurs.status === "success" && resSecteurs.data) setSecteursActivite(resSecteurs.data);
  }, []);

  useEffect(() => {
    if (showAdd) {
      loadTypesEtSecteurs();
      loadContribuables("");
    }
  }, [showAdd, loadTypesEtSecteurs, loadContribuables]);

  // Debounced contribuable search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contribDropdownOpen) loadContribuables(contribSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [contribSearch, contribDropdownOpen, loadContribuables]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contribRef.current && !contribRef.current.contains(e.target as Node)) {
        setContribDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectContrib = (c: ContribuablePatente) => {
    setSelectedContrib(c);
    setForm({ ...form, contribuable_id: String(c.id) });
    setContribSearch(c.raison_sociale || c.nom_complet);
    setContribDropdownOpen(false);
  };

  const handleAddType = async () => {
    if (!newTypeLabel.trim()) return;
    setAddingType(true);
    const res = await addTypeActivite(newTypeLabel.trim());
    if (res.status === "success" && res.data) {
      setTypesActivite((prev) => [...prev, res.data!].sort((a, b) => a.libelle.localeCompare(b.libelle)));
      setForm({ ...form, type_activite: res.data.libelle });
      setNewTypeLabel("");
      setShowAddType(false);
    }
    setAddingType(false);
  };

  const handleAddSecteur = async () => {
    if (!newSecteurCode.trim() || !newSecteurLabel.trim()) return;
    setAddingSecteur(true);
    const res = await addSecteurActivite(newSecteurCode.trim().toLowerCase(), newSecteurLabel.trim());
    if (res.status === "success" && res.data) {
      setSecteursActivite((prev) => [...prev, res.data!].sort((a, b) => a.libelle.localeCompare(b.libelle)));
      setForm({ ...form, secteur_activite: res.data.code });
      setNewSecteurCode("");
      setNewSecteurLabel("");
      setShowAddSecteur(false);
    }
    setAddingSecteur(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const res = await addDeclaration({
        ...form,
        contribuable_id: Number(form.contribuable_id),
        chiffre_affaires_estime: Number(form.chiffre_affaires_estime),
        nombre_employes: Number(form.nombre_employes || 0),
        surface_local_m2: form.surface_local_m2 ? Number(form.surface_local_m2) : null,
        annee_fiscale: Number(form.annee_fiscale),
        site_id: utilisateur?.site_id,
        soumise_par: utilisateur?.id,
      });
      if (res.status === "success") {
        setSuccess("Déclaration soumise avec succès.");
        setShowAdd(false);
        setSelectedContrib(null);
        setContribSearch("");
        setForm({
          contribuable_id: "", type_activite: "", secteur_activite: "",
          description_activite: "", adresse_activite: "", chiffre_affaires_estime: "",
          nombre_employes: "", surface_local_m2: "", annee_fiscale: String(new Date().getFullYear()),
        });
        load(1);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.message || "Erreur");
      }
    } catch { setError("Erreur serveur"); }
    setFormLoading(false);
  };

  const formatCA = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
          <Check className="w-4 h-4" />{success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-[#153258] p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Déclarations de patente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dépôt et suivi des déclarations d&apos;activité</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] hover:shadow-lg text-white rounded-lg text-sm font-medium transition-all duration-200">
          <Plus className="w-4 h-4" /> Nouvelle déclaration
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); load(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-sm">Rechercher</button>
        </form>
        <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); }}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Contribuable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Activité</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Secteur</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">CA estimé</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Année</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                </td></tr>
              ) : declarations.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Aucune déclaration</td></tr>
              ) : (
                declarations.map((d) => {
                  const st = STATUTS_LABELS[d.statut] || STATUTS_LABELS.brouillon;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{d.nom_complet}</p>
                        <p className="text-xs text-gray-400">{d.numero_fiscal}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{d.type_activite}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize">{d.secteur_activite}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCA(d.chiffre_affaires_estime)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.annee_fiscale}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{d.date_soumission_fmt || d.date_creation_fmt}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setSelected(d); setShowView(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">{pagination.total} résultat(s)</span>
            <div className="flex gap-1">
              <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 z-10">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nouvelle déclaration</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Soumettre une déclaration d'activité</p>
                </div>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

              {/* Contribuable autocomplete */}
              <div ref={contribRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribuable *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="text"
                    value={contribSearch}
                    onChange={(e) => {
                      setContribSearch(e.target.value);
                      setContribDropdownOpen(true);
                      if (selectedContrib) {
                        setSelectedContrib(null);
                        setForm({ ...form, contribuable_id: "" });
                      }
                    }}
                    onFocus={() => setContribDropdownOpen(true)}
                    placeholder="Saisir le nom de l'entreprise..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258]"
                  />
                  {selectedContrib && (
                    <button type="button" onClick={() => { setSelectedContrib(null); setContribSearch(""); setForm({ ...form, contribuable_id: "" }); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
                {/* Hidden required input for form validation */}
                <input type="hidden" required value={form.contribuable_id} />

                {contribDropdownOpen && !selectedContrib && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {contribuables.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400 text-center">
                        {contribSearch ? "Aucune entreprise trouvée" : "Saisissez un nom..."}
                      </p>
                    ) : (
                      contribuables.map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => handleSelectContrib(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#153258]/5 dark:hover:bg-gray-700 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <div className="w-8 h-8 bg-[#153258]/10 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-[#153258]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.raison_sociale || c.nom_complet}</p>
                            <p className="text-xs text-gray-400 truncate">{c.numero_fiscal}{c.rccm ? ` • RCCM: ${c.rccm}` : ""}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedContrib && (
                  <div className="mt-1.5 flex items-center gap-2 p-2 bg-[#153258]/5 dark:bg-[#153258]/20 rounded-lg">
                    <Check className="w-4 h-4 text-[#23A974]" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {selectedContrib.raison_sociale || selectedContrib.nom_complet} — {selectedContrib.numero_fiscal}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type d'activité with inline add */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d&apos;activité *</label>
                  {!showAddType ? (
                    <div className="flex gap-1.5">
                      <select required value={form.type_activite} onChange={(e) => setForm({ ...form, type_activite: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                        <option value="">Choisir...</option>
                        {typesActivite.map((t) => (<option key={t.id} value={t.libelle}>{t.libelle}</option>))}
                      </select>
                      <button type="button" onClick={() => setShowAddType(true)}
                        title="Ajouter un type"
                        className="px-2.5 py-2 bg-[#153258] hover:bg-[#153258]/90 text-white rounded-lg transition-colors shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input autoFocus value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)}
                        placeholder="Nouveau type d'activité..."
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddType(); } if (e.key === "Escape") setShowAddType(false); }}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#23A974] dark:border-[#23A974] bg-white dark:bg-gray-700 text-sm ring-2 ring-[#23A974]/20" />
                      <button type="button" onClick={handleAddType} disabled={addingType}
                        className="px-2.5 py-2 bg-[#23A974] hover:bg-[#23A974]/90 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50">
                        {addingType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => { setShowAddType(false); setNewTypeLabel(""); }}
                        className="px-2.5 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-lg transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Secteur with inline add */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secteur *</label>
                  {!showAddSecteur ? (
                    <div className="flex gap-1.5">
                      <select required value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                        <option value="">Choisir...</option>
                        {secteursActivite.map((s) => (<option key={s.id} value={s.code}>{s.icone} {s.libelle}</option>))}
                      </select>
                      <button type="button" onClick={() => setShowAddSecteur(true)}
                        title="Ajouter un secteur"
                        className="px-2.5 py-2 bg-[#153258] hover:bg-[#153258]/90 text-white rounded-lg transition-colors shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input autoFocus value={newSecteurLabel} onChange={(e) => {
                          setNewSecteurLabel(e.target.value);
                          if (!newSecteurCode) setNewSecteurCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                        }}
                          placeholder="Libellé du secteur..."
                          onKeyDown={(e) => { if (e.key === "Escape") { setShowAddSecteur(false); setNewSecteurCode(""); setNewSecteurLabel(""); } }}
                          className="flex-1 px-3 py-2 rounded-lg border border-[#23A974] dark:border-[#23A974] bg-white dark:bg-gray-700 text-sm ring-2 ring-[#23A974]/20" />
                      </div>
                      <div className="flex gap-1.5">
                        <input value={newSecteurCode} onChange={(e) => setNewSecteurCode(e.target.value)}
                          placeholder="Code (ex: commerce)"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSecteur(); } }}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-xs" />
                        <button type="button" onClick={handleAddSecteur} disabled={addingSecteur}
                          className="px-2.5 py-2 bg-[#23A974] hover:bg-[#23A974]/90 text-white rounded-lg transition-colors shrink-0 disabled:opacity-50">
                          {addingSecteur ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button type="button" onClick={() => { setShowAddSecteur(false); setNewSecteurCode(""); setNewSecteurLabel(""); }}
                          className="px-2.5 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-lg transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chiffre d&apos;affaires estimé ($) *</label>
                  <input required type="number" min="0" step="0.01" value={form.chiffre_affaires_estime}
                    onChange={(e) => setForm({ ...form, chiffre_affaires_estime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Année fiscale</label>
                  <input type="number" value={form.annee_fiscale} onChange={(e) => setForm({ ...form, annee_fiscale: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre d&apos;employés</label>
                  <input type="number" min="0" value={form.nombre_employes} onChange={(e) => setForm({ ...form, nombre_employes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Surface local (m²)</label>
                  <input type="number" min="0" value={form.surface_local_m2} onChange={(e) => setForm({ ...form, surface_local_m2: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse activité *</label>
                <input required value={form.adresse_activite} onChange={(e) => setForm({ ...form, adresse_activite: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={2} value={form.description_activite} onChange={(e) => setForm({ ...form, description_activite: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium">
                  {formLoading ? "..." : "Soumettre la déclaration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View */}
      {showView && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowView(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-[#153258] p-2 rounded-lg mr-3">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Détails déclaration</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Informations complètes</p>
                </div>
              </div>
              <button onClick={() => setShowView(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Contribuable</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selected.nom_complet}</p></div>
                <div><p className="text-xs text-gray-400">N° Fiscal</p><p className="text-sm text-gray-700 dark:text-gray-300">{selected.numero_fiscal}</p></div>
                <div><p className="text-xs text-gray-400">Activité</p><p className="text-sm text-gray-700 dark:text-gray-300">{selected.type_activite}</p></div>
                <div><p className="text-xs text-gray-400">Secteur</p><p className="text-sm capitalize text-gray-700 dark:text-gray-300">{selected.secteur_activite}</p></div>
                <div><p className="text-xs text-gray-400">CA estimé</p><p className="text-sm font-medium text-gray-900 dark:text-white">{formatCA(selected.chiffre_affaires_estime)}</p></div>
                <div><p className="text-xs text-gray-400">Année</p><p className="text-sm text-gray-700 dark:text-gray-300">{selected.annee_fiscale}</p></div>
                <div><p className="text-xs text-gray-400">Statut</p><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUTS_LABELS[selected.statut]?.color}`}>{STATUTS_LABELS[selected.statut]?.label}</span></div>
                <div><p className="text-xs text-gray-400">Soumise le</p><p className="text-sm text-gray-700 dark:text-gray-300">{selected.date_soumission_fmt || "—"}</p></div>
              </div>
              <div><p className="text-xs text-gray-400">Adresse activité</p><p className="text-sm text-gray-700 dark:text-gray-300">{selected.adresse_activite}</p></div>
              {selected.categorie && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Classification</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Catégorie: <strong className="capitalize">{selected.categorie}</strong> — Montant: <strong>{formatCA(selected.montant_final || 0)}</strong></p>
                  {selected.agent_classification && <p className="text-xs text-gray-400 mt-1">Par: {selected.agent_classification}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
