"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Search, Eye, Check, XCircle, Trash2, MapPin, Calculator, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBiens, getBien, addBien, validerBien, rejeterBien, deleteBien, calculerImpot,
  getCommunes, getQuartiers, getAvenues, getTypesConcession, getAffectations, getAgentsTerrain,
  getVilles, genererFactureBien,
} from "@/services/foncier/foncierService";
import { Bien, Commune, Quartier, Avenue, TypeConcession, Affectation, AgentTerrain, Ville, CalculImpot } from "@/services/foncier/types";
import { formatDate, formatMontant, STATUT_BIEN_COLORS } from "../../_shared/format";

type Tab = "en_attente" | "valide" | "rejete" | "tous";

export default function BiensClient() {
  const { utilisateur } = useAuth();
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tous");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [avenues, setAvenues] = useState<Avenue[]>([]);
  const [types, setTypes] = useState<TypeConcession[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [agents, setAgents] = useState<AgentTerrain[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Bien | null>(null);
  const [calcul, setCalcul] = useState<CalculImpot | null>(null);
  const [showReject, setShowReject] = useState<Bien | null>(null);
  const [rejectMotif, setRejectMotif] = useState("");
  const [del, setDel] = useState<Bien | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    proprietaire_nom: "", proprietaire_telephone: "", proprietaire_email: "", proprietaire_inconnu: "0",
    ville_id: "", commune_id: "", quartier_id: "", avenue_id: "",
    numero_avenue: "", numero_parcelle: "",
    superficie: "", type_concession_id: "", affectation_id: "",
    latitude: "", longitude: "", photo_url: "",
    agent_terrain_id: "",
  });

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    Promise.all([
      getVilles(utilisateur.site_id, 1, 500, ""),
      getCommunes(utilisateur.site_id),
      getQuartiers(utilisateur.site_id),
      getAvenues(utilisateur.site_id),
      getTypesConcession(utilisateur.site_id),
      getAffectations(utilisateur.site_id),
      getAgentsTerrain(utilisateur.site_id, 1, 500, ""),
    ]).then(([v, c, q, a, tc, af, ag]) => {
      if (v.status === "success" && v.data) setVilles(v.data.villes);
      if (c.status === "success" && c.data) setCommunes(c.data);
      if (q.status === "success" && q.data) setQuartiers(q.data);
      if (a.status === "success" && a.data) setAvenues(a.data);
      if (tc.status === "success" && tc.data) setTypes(tc.data);
      if (af.status === "success" && af.data) setAffectations(af.data);
      if (ag.status === "success" && ag.data) setAgents(ag.data.agents);
    });
  }, [utilisateur?.site_id]);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getBiens(utilisateur.site_id, page, 20, search, tab === "tous" ? "" : tab);
    if (r.status === "success" && r.data) {
      setBiens(r.data.biens);
      setTotalPages(r.data.pagination.totalPages);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, tab]);

  useEffect(() => { load(); }, [load]);

  const filteredCommunes = useMemo(() => form.ville_id ? communes.filter(c => String(c.ville_id) === form.ville_id) : communes, [communes, form.ville_id]);
  const filteredQuartiers = useMemo(() => form.commune_id ? quartiers.filter(q => String(q.commune_id) === form.commune_id) : [], [quartiers, form.commune_id]);
  const filteredAvenues = useMemo(() => form.quartier_id ? avenues.filter(a => String(a.quartier_id) === form.quartier_id) : [], [avenues, form.quartier_id]);

  const openDetail = async (b: Bien) => {
    setShowDetail(b);
    setCalcul(null);
    const r = await calculerImpot(b.id);
    if (r.status === "success" && r.data) setCalcul(r.data);
  };

  const handleValider = async (id: number) => {
    if (!utilisateur?.id) return;
    setSaving(true);
    const r = await validerBien(id, utilisateur.id);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || (r.status === "success" ? "Bien validé" : "Erreur") });
    setSaving(false);
    if (r.status === "success") { setShowDetail(null); await load(); }
  };

  const handleRejeter = async () => {
    if (!showReject || !utilisateur?.id) return;
    if (!rejectMotif) { setMsg({ type: "err", text: "Motif requis" }); return; }
    setSaving(true);
    const r = await rejeterBien(showReject.id, rejectMotif, utilisateur.id);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || "OK" });
    setSaving(false);
    if (r.status === "success") { setShowReject(null); setRejectMotif(""); setShowDetail(null); await load(); }
  };

  const genererFacture = async (b: Bien) => {
    if (!utilisateur?.id) return;
    const annee = new Date().getFullYear();
    setSaving(true);
    const r = await genererFactureBien(b.id, annee, utilisateur.id);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || "OK" });
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!utilisateur?.site_id || !utilisateur.id) return;
    if (!form.quartier_id || !form.superficie) { setMsg({ type: "err", text: "Quartier et superficie requis" }); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      site_id: utilisateur.site_id,
      province_id: utilisateur.province_id,
      utilisateur_id: utilisateur.id,
      proprietaire_nom: form.proprietaire_nom || null,
      proprietaire_telephone: form.proprietaire_telephone || null,
      proprietaire_email: form.proprietaire_email || null,
      proprietaire_inconnu: Number(form.proprietaire_inconnu),
      ville_id: form.ville_id ? Number(form.ville_id) : null,
      commune_id: form.commune_id ? Number(form.commune_id) : null,
      quartier_id: Number(form.quartier_id),
      avenue_id: form.avenue_id ? Number(form.avenue_id) : null,
      numero_avenue: form.numero_avenue || null,
      numero_parcelle: form.numero_parcelle || null,
      superficie: Number(form.superficie),
      type_concession_id: form.type_concession_id ? Number(form.type_concession_id) : null,
      affectation_id: form.affectation_id ? Number(form.affectation_id) : null,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      photo_url: form.photo_url || null,
      agent_terrain_id: form.agent_terrain_id ? Number(form.agent_terrain_id) : null,
    };
    const r = await addBien(payload);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || "OK" });
    setSaving(false);
    if (r.status === "success") {
      setShowAdd(false);
      setForm({ proprietaire_nom: "", proprietaire_telephone: "", proprietaire_email: "", proprietaire_inconnu: "0",
        ville_id: "", commune_id: "", quartier_id: "", avenue_id: "", numero_avenue: "", numero_parcelle: "",
        superficie: "", type_concession_id: "", affectation_id: "", latitude: "", longitude: "", photo_url: "",
        agent_terrain_id: "" });
      await load();
    }
  };

  const handleDelete = async () => {
    if (!del) return;
    setSaving(true);
    const r = await deleteBien(del.id);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || "OK" });
    setSaving(false);
    if (r.status === "success") { setDel(null); await load(); }
  };

  const loadDetail = async (id: number) => {
    const r = await getBien(id);
    if (r.status === "success" && r.data) await openDetail(r.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🏠 Biens / Concessions</h1>
          <p className="text-sm text-gray-500">Recensement, validation et gestion du parc immobilier</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow">
          <Plus className="w-4 h-4" /> Nouveau bien
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
          <button className="float-right" onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["tous", "en_attente", "valide", "rejete"] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? "bg-[#153258] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
            {t === "tous" ? "Tous" : t === "en_attente" ? "En attente" : t === "valide" ? "Validés" : "Rejetés"}
          </button>
        ))}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher réf, propriétaire, parcelle..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-sm" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : biens.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun bien</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Référence</th>
              <th className="text-left px-4 py-3">Propriétaire</th>
              <th className="text-left px-4 py-3">Localisation</th>
              <th className="text-right px-4 py-3">Superficie</th>
              <th className="text-left px-4 py-3">Type / Affectation</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {biens.map(b => (
                <tr key={b.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                  <td className="px-4 py-3">
                    <div>{b.proprietaire_inconnu ? <span className="italic text-gray-500">Propriétaire inconnu</span> : b.proprietaire_nom || "—"}</div>
                    {b.proprietaire_telephone && <div className="text-xs text-gray-500">{b.proprietaire_telephone}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{b.quartier_nom || "—"}{b.commune_nom ? ` / ${b.commune_nom}` : ""}</div>
                    {b.numero_parcelle && <div className="text-gray-500">Parc. {b.numero_parcelle}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">{Number(b.superficie).toLocaleString("fr-FR")} m²</td>
                  <td className="px-4 py-3 text-xs">{b.type_concession_nom || "—"}<br/><span className="text-gray-500">{b.affectation_nom || ""}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUT_BIEN_COLORS[b.statut]}`}>
                      {b.statut === "en_attente" ? "En attente" : b.statut === "valide" ? "Validé" : "Rejeté"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => loadDetail(b.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Détails"><Eye className="w-4 h-4" /></button>
                      {b.statut === "en_attente" && (
                        <>
                          <button onClick={() => handleValider(b.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Valider"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setShowReject(b)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Rejeter"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      <button onClick={() => setDel(b)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Préc.</button>
          <span className="px-3 py-1">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Suiv.</button>
        </div>
      )}

      {/* Modal Ajout */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold">Nouveau bien foncier</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-sm">Propriétaire</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 col-span-2 text-sm">
                    <input type="checkbox" checked={form.proprietaire_inconnu === "1"}
                      onChange={(e) => setForm({ ...form, proprietaire_inconnu: e.target.checked ? "1" : "0" })} />
                    Propriétaire inconnu (recensement terrain)
                  </label>
                  <input placeholder="Nom" disabled={form.proprietaire_inconnu === "1"}
                    value={form.proprietaire_nom} onChange={(e) => setForm({ ...form, proprietaire_nom: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm disabled:opacity-50" />
                  <input placeholder="Téléphone" disabled={form.proprietaire_inconnu === "1"}
                    value={form.proprietaire_telephone} onChange={(e) => setForm({ ...form, proprietaire_telephone: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm disabled:opacity-50" />
                  <input placeholder="Email" disabled={form.proprietaire_inconnu === "1"}
                    value={form.proprietaire_email} onChange={(e) => setForm({ ...form, proprietaire_email: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm col-span-2 disabled:opacity-50" />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-sm">Localisation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.ville_id} onChange={(e) => setForm({ ...form, ville_id: e.target.value, commune_id: "", quartier_id: "", avenue_id: "" })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Ville</option>
                    {villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                  </select>
                  <select value={form.commune_id} onChange={(e) => setForm({ ...form, commune_id: e.target.value, quartier_id: "", avenue_id: "" })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Commune</option>
                    {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                  <select value={form.quartier_id} onChange={(e) => setForm({ ...form, quartier_id: e.target.value, avenue_id: "" })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Quartier *</option>
                    {filteredQuartiers.map(q => <option key={q.id} value={q.id}>{q.nom}{q.rang_fiscal_nom ? ` (${q.rang_fiscal_nom})` : ""}</option>)}
                  </select>
                  <select value={form.avenue_id} onChange={(e) => setForm({ ...form, avenue_id: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Avenue</option>
                    {filteredAvenues.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                  <input placeholder="N° avenue" value={form.numero_avenue} onChange={(e) => setForm({ ...form, numero_avenue: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  <input placeholder="N° parcelle" value={form.numero_parcelle} onChange={(e) => setForm({ ...form, numero_parcelle: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <input placeholder="Latitude (GPS)" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                    <input placeholder="Longitude (GPS)" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-sm">Caractéristiques</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" step="0.01" placeholder="Superficie (m²) *" value={form.superficie} onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  <select value={form.type_concession_id} onChange={(e) => setForm({ ...form, type_concession_id: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Type de concession</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                  <select value={form.affectation_id} onChange={(e) => setForm({ ...form, affectation_id: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Affectation</option>
                    {affectations.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-sm">Recensement</h4>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.agent_terrain_id} onChange={(e) => setForm({ ...form, agent_terrain_id: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="">Agent terrain (optionnel)</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.matricule} — {a.nom} {a.prenom || ""}</option>)}
                  </select>
                  <input placeholder="URL photo" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                    className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded disabled:opacity-60">
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <div>
                <h3 className="font-semibold">{showDetail.reference}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${STATUT_BIEN_COLORS[showDetail.statut]}`}>
                  {showDetail.statut === "en_attente" ? "En attente" : showDetail.statut === "valide" ? "Validé" : "Rejeté"}
                </span>
              </div>
              <button onClick={() => setShowDetail(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Propriétaire:</span> {showDetail.proprietaire_inconnu ? <em>Inconnu</em> : showDetail.proprietaire_nom || "—"}</div>
                <div><span className="text-gray-500">Téléphone:</span> {showDetail.proprietaire_telephone || "—"}</div>
                <div><span className="text-gray-500">Email:</span> {showDetail.proprietaire_email || "—"}</div>
                <div><span className="text-gray-500">N° parcelle:</span> {showDetail.numero_parcelle || "—"}</div>
                <div><span className="text-gray-500">Ville:</span> {showDetail.ville_nom || "—"}</div>
                <div><span className="text-gray-500">Commune:</span> {showDetail.commune_nom || "—"}</div>
                <div><span className="text-gray-500">Quartier:</span> {showDetail.quartier_nom || "—"}</div>
                <div><span className="text-gray-500">Avenue:</span> {showDetail.avenue_nom || "—"} {showDetail.numero_avenue}</div>
                <div><span className="text-gray-500">Superficie:</span> {Number(showDetail.superficie).toLocaleString("fr-FR")} m²</div>
                <div><span className="text-gray-500">Rang fiscal:</span> {showDetail.rang_fiscal_nom || "—"}</div>
                <div><span className="text-gray-500">Type:</span> {showDetail.type_concession_nom || "—"}</div>
                <div><span className="text-gray-500">Affectation:</span> {showDetail.affectation_nom || "—"}</div>
                {(showDetail.latitude || showDetail.longitude) && (
                  <div className="col-span-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {showDetail.latitude}, {showDetail.longitude}</div>
                )}
                {showDetail.motif_rejet && (
                  <div className="col-span-2 bg-red-50 text-red-700 p-2 rounded"><strong>Motif rejet:</strong> {showDetail.motif_rejet}</div>
                )}
                <div className="col-span-2"><span className="text-gray-500">Créé le:</span> {formatDate(showDetail.date_creation)}</div>
              </div>

              {calcul && (
                <div className="bg-gradient-to-r from-[#153258]/10 to-[#23A974]/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2"><Calculator className="w-4 h-4" /><strong>Calcul estimatif de l&apos;impôt</strong></div>
                  <div className="text-sm space-y-1">
                    <div>Superficie: <strong>{Number(calcul.superficie).toLocaleString("fr-FR")} m²</strong></div>
                    <div>Prix/m²: <strong>{formatMontant(Number(calcul.prix_m2), calcul.devise)}</strong></div>
                    <div className="text-lg text-[#23A974]">Impôt annuel: <strong>{formatMontant(Number(calcul.montant_base), calcul.devise)}</strong></div>
                  </div>
                </div>
              )}

              {showDetail.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={showDetail.photo_url} alt="bien" className="w-full max-h-64 object-cover rounded" />
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-between gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
              <div>
                {showDetail.statut === "valide" && (
                  <button onClick={() => genererFacture(showDetail)} disabled={saving}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-60">
                    Générer facture {new Date().getFullYear()}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {showDetail.statut === "en_attente" && (
                  <>
                    <button onClick={() => setShowReject(showDetail)} className="px-4 py-2 text-sm bg-orange-600 text-white rounded">
                      Rejeter
                    </button>
                    <button onClick={() => handleValider(showDetail.id)} disabled={saving}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded disabled:opacity-60">
                      Valider
                    </button>
                  </>
                )}
                <button onClick={() => setShowDetail(null)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejet modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-3">Rejeter ce bien</h3>
            <textarea value={rejectMotif} onChange={(e) => setRejectMotif(e.target.value)} rows={4} placeholder="Motif du rejet..."
              className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowReject(null); setRejectMotif(""); }} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={handleRejeter} disabled={saving} className="px-4 py-2 text-sm bg-orange-600 text-white rounded disabled:opacity-60">Rejeter</button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-2">Supprimer le bien ?</h3>
            <p className="text-sm text-gray-600 mb-4">{del.reference}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDel(null)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-60">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
