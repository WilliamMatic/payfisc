"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTarifs, addTarif, updateTarif, deleteTarif, getRangs, getTypesConcession, getAffectations } from "@/services/foncier/foncierService";
import { Tarif, RangFiscal, TypeConcession, Affectation } from "@/services/foncier/types";
import { formatMontant } from "../../_shared/format";

export default function TarifsClient() {
  const { utilisateur } = useAuth();
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [rangs, setRangs] = useState<RangFiscal[]>([]);
  const [types, setTypes] = useState<TypeConcession[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Tarif | null>(null);
  const [del, setDel] = useState<Tarif | null>(null);
  const [form, setForm] = useState({ rang_fiscal_id: "", type_concession_id: "", affectation_id: "", prix_m2: "", devise: "USD" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const [t, r, tc, a] = await Promise.all([
      getTarifs(utilisateur.site_id),
      getRangs(utilisateur.site_id),
      getTypesConcession(utilisateur.site_id),
      getAffectations(utilisateur.site_id),
    ]);
    if (t.status === "success" && t.data) setTarifs(t.data);
    if (r.status === "success" && r.data) setRangs(r.data);
    if (tc.status === "success" && tc.data) setTypes(tc.data);
    if (a.status === "success" && a.data) setAffectations(a.data);
    setLoading(false);
  }, [utilisateur?.site_id]);

  useEffect(() => { load(); }, [load]);

  const open = (t?: Tarif) => {
    setEdit(t || null);
    setForm({
      rang_fiscal_id: t ? String(t.rang_fiscal_id) : "",
      type_concession_id: t ? String(t.type_concession_id) : "",
      affectation_id: t ? String(t.affectation_id) : "",
      prix_m2: t ? String(t.prix_m2) : "",
      devise: t?.devise || "USD",
    });
    setShow(true); setError(null);
  };

  const save = async () => {
    if (!utilisateur?.site_id) return;
    if (!form.rang_fiscal_id || !form.type_concession_id || !form.affectation_id || !form.prix_m2) {
      setError("Tous les champs sont requis"); return;
    }
    setSaving(true); setError(null);
    const payload: Record<string, unknown> = {
      site_id: utilisateur.site_id,
      rang_fiscal_id: Number(form.rang_fiscal_id),
      type_concession_id: Number(form.type_concession_id),
      affectation_id: Number(form.affectation_id),
      prix_m2: Number(form.prix_m2),
      devise: form.devise,
    };
    const r = edit ? await updateTarif({ ...payload, id: edit.id }) : await addTarif(payload);
    if (r.status === "success") { setShow(false); await load(); } else setError(r.message || "Erreur");
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    setSaving(true);
    const r = await deleteTarif(del.id);
    if (r.status === "success") { setDel(null); await load(); } else setError(r.message || "Erreur");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">💰 Tarification (Prix/m²)</h1>
          <p className="text-sm text-gray-500">Par Rang fiscal × Type de concession × Affectation</p>
        </div>
        <button onClick={() => open()} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow">
          <Plus className="w-4 h-4" /> Nouveau tarif
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : tarifs.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun tarif. Définissez d&apos;abord rangs, types de concession et affectations.</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Rang fiscal</th>
              <th className="text-left px-4 py-3">Type concession</th>
              <th className="text-left px-4 py-3">Affectation</th>
              <th className="text-right px-4 py-3">Prix / m²</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {tarifs.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">{t.rang_nom}</td>
                  <td className="px-4 py-3">{t.type_nom}</td>
                  <td className="px-4 py-3">{t.affectation_nom}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#23A974]">{formatMontant(Number(t.prix_m2), t.devise)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => open(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDel(t)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="font-semibold">{edit ? "Modifier" : "Ajouter"} — Tarif</h3>
              <button onClick={() => setShow(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
              <div>
                <label className="block text-sm mb-1">Rang fiscal *</label>
                <select value={form.rang_fiscal_id} onChange={(e) => setForm({ ...form, rang_fiscal_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                  <option value="">— Choisir —</option>
                  {rangs.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Type de concession *</label>
                <select value={form.type_concession_id} onChange={(e) => setForm({ ...form, type_concession_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                  <option value="">— Choisir —</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Affectation *</label>
                <select value={form.affectation_id} onChange={(e) => setForm({ ...form, affectation_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                  <option value="">— Choisir —</option>
                  {affectations.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Prix / m² *</label>
                  <input type="number" step="0.01" value={form.prix_m2} onChange={(e) => setForm({ ...form, prix_m2: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Devise</label>
                  <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })}
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
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
            <h3 className="font-semibold mb-2">Supprimer le tarif ?</h3>
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
