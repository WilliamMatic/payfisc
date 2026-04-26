"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Search, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAgentsTerrain, addAgentTerrain, updateAgentTerrain, deleteAgentTerrain } from "@/services/foncier/foncierService";
import { AgentTerrain } from "@/services/foncier/types";
import { formatDate } from "../../_shared/format";

export default function AgentsTerrainClient() {
  const { utilisateur } = useAuth();
  const [agents, setAgents] = useState<AgentTerrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<AgentTerrain | null>(null);
  const [del, setDel] = useState<AgentTerrain | null>(null);
  const [form, setForm] = useState({ matricule: "", nom: "", prenom: "", telephone: "", email: "", password: "", actif: "1" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getAgentsTerrain(utilisateur.site_id, 1, 200, search);
    if (r.status === "success" && r.data) setAgents(r.data.agents);
    setLoading(false);
  }, [utilisateur?.site_id, search]);

  useEffect(() => { load(); }, [load]);

  const open = (a?: AgentTerrain) => {
    setEdit(a || null);
    setForm({
      matricule: a?.matricule || "",
      nom: a?.nom || "",
      prenom: a?.prenom || "",
      telephone: a?.telephone || "",
      email: a?.email || "",
      password: "",
      actif: a ? String(a.actif) : "1",
    });
    setShow(true); setError(null);
  };

  const save = async () => {
    if (!utilisateur?.site_id) return;
    if (!form.matricule || !form.nom) { setError("Matricule et nom sont requis"); return; }
    if (!edit && !form.password) { setError("Mot de passe requis à la création"); return; }
    setSaving(true); setError(null);
    const payload: Record<string, unknown> = {
      site_id: utilisateur.site_id,
      province_id: utilisateur.province_id,
      matricule: form.matricule, nom: form.nom, prenom: form.prenom,
      telephone: form.telephone, email: form.email, actif: Number(form.actif),
    };
    if (form.password) payload.password = form.password;
    const res = edit ? await updateAgentTerrain({ ...payload, id: edit.id }) : await addAgentTerrain(payload);
    if (res.status === "success") { setShow(false); await load(); }
    else setError(res.message || "Erreur");
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    setSaving(true);
    const r = await deleteAgentTerrain(del.id);
    if (r.status === "success") { setDel(null); await load(); } else setError(r.message || "Erreur");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">🧑‍💼 Agents terrain</h1>
          <p className="text-sm text-gray-500">{agents.length} agent(s) recenseur(s)</p>
        </div>
        <button onClick={() => open()} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow">
          <Plus className="w-4 h-4" /> Nouvel agent
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : agents.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun agent</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Matricule</th>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3">Prénom</th>
              <th className="text-left px-4 py-3">Téléphone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Créé le</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs">{a.matricule}</td>
                  <td className="px-4 py-3">{a.nom}</td>
                  <td className="px-4 py-3">{a.prenom || "—"}</td>
                  <td className="px-4 py-3">{a.telephone || "—"}</td>
                  <td className="px-4 py-3">{a.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${a.actif ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {a.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(a.date_creation)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => open(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDel(a)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between">
              <h3 className="font-semibold">{edit ? "Modifier" : "Ajouter"} — Agent terrain</h3>
              <button onClick={() => setShow(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Matricule *</label>
                  <input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Nom *</label>
                  <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Prénom</label>
                  <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm mb-1 flex items-center gap-1"><KeyRound className="w-3 h-3" />{edit ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Statut</label>
                  <select value={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="1">Actif</option>
                    <option value="0">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded disabled:opacity-60">
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-2">Supprimer l&apos;agent ?</h3>
            <p className="text-sm text-gray-600 mb-4">{del.nom} {del.prenom || ""} ({del.matricule})</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDel(null)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={remove} disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-60">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
