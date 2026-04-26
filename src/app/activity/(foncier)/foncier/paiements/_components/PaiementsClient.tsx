"use client";
import { useEffect, useState, useCallback } from "react";
import { CreditCard, Search, Eye, Plus, X, Smartphone, Landmark, Banknote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPaiements, enregistrerPaiement, getRepartitionPaiement, getFactures } from "@/services/foncier/foncierService";
import { Paiement, Repartition, Facture, ModePaiement } from "@/services/foncier/types";
import { formatMontant, formatDateTime } from "../../_shared/format";

export default function PaiementsClient() {
  const { utilisateur } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<Paiement | null>(null);
  const [detailRep, setDetailRep] = useState<Repartition[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [impayees, setImpayees] = useState<Facture[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    facture_id: "", montant: "", mode_paiement: "mobile_money" as ModePaiement,
    operateur_mobile: "mpesa", numero_mobile: "",
    nom_banque: "", numero_transaction: "", titulaire_compte: "",
  });

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getPaiements(utilisateur.site_id, page, 20, search, mode);
    if (r.status === "success" && r.data) {
      setPaiements(r.data.paiements);
      setTotalPages(r.data.pagination.totalPages);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, mode]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (p: Paiement) => {
    setDetail(p);
    setDetailRep([]);
    const r = await getRepartitionPaiement(p.id);
    if (r.status === "success" && r.data) setDetailRep(r.data);
  };

  const openNew = async () => {
    if (!utilisateur?.site_id) return;
    const r = await getFactures(utilisateur.site_id, 1, 500, "", "impayee");
    if (r.status === "success" && r.data) setImpayees(r.data.factures);
    setShowNew(true);
  };

  const handlePay = async () => {
    if (!utilisateur?.site_id || !utilisateur.id) return;
    if (!form.facture_id || !form.montant) { setMsg({ type: "err", text: "Facture et montant requis" }); return; }
    if (form.mode_paiement === "mobile_money" && !form.numero_mobile) { setMsg({ type: "err", text: "Numéro mobile requis" }); return; }
    if (form.mode_paiement === "banque" && !form.numero_transaction) { setMsg({ type: "err", text: "N° transaction bancaire requis" }); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      site_id: utilisateur.site_id,
      province_id: utilisateur.province_id,
      utilisateur_id: utilisateur.id,
      facture_id: Number(form.facture_id),
      montant: Number(form.montant),
      mode_paiement: form.mode_paiement,
      operateur_mobile: form.mode_paiement === "mobile_money" ? form.operateur_mobile : null,
      numero_mobile: form.mode_paiement === "mobile_money" ? form.numero_mobile : null,
      nom_banque: form.mode_paiement === "banque" ? form.nom_banque : null,
      numero_transaction: form.numero_transaction || null,
      titulaire_compte: form.titulaire_compte || null,
    };
    const r = await enregistrerPaiement(payload);
    setSaving(false);
    if (r.status === "success") {
      setMsg({ type: "ok", text: `Paiement enregistré: ${r.reference || ""}` });
      setShowNew(false);
      setForm({ facture_id: "", montant: "", mode_paiement: "mobile_money", operateur_mobile: "mpesa", numero_mobile: "", nom_banque: "", numero_transaction: "", titulaire_compte: "" });
      await load();
    } else setMsg({ type: "err", text: r.message || "Erreur" });
  };

  const selectedFacture = impayees.find(f => String(f.id) === form.facture_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">💳 Paiements foncier</h1>
          <p className="text-sm text-gray-500">100% digital — Mobile Money, Banque</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow">
          <Plus className="w-4 h-4" /> Nouveau paiement
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}<button className="float-right" onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <select value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
          <option value="">Tous modes</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="banque">Banque</option>
          <option value="especes">Espèces</option>
        </select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : paiements.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun paiement</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Référence</th>
              <th className="text-left px-4 py-3">Facture</th>
              <th className="text-left px-4 py-3">Propriétaire</th>
              <th className="text-right px-4 py-3">Montant</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {paiements.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-3 text-xs">{p.facture_ref}<br/><span className="text-gray-500">{p.numero_parcelle}</span></td>
                  <td className="px-4 py-3 text-xs">{p.proprietaire_nom || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#23A974]">{formatMontant(Number(p.montant))}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {p.mode_paiement === "mobile_money" ? <><Smartphone className="w-3 h-3" /> {p.operateur_mobile || "Mobile"}</>
                        : p.mode_paiement === "banque" ? <><Landmark className="w-3 h-3" /> {p.nom_banque || "Banque"}</>
                        : <><Banknote className="w-3 h-3" /> Espèces</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDateTime(p.date_paiement)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
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

      {/* Nouveau paiement */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold">Nouveau paiement</h3>
              <button onClick={() => setShowNew(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">Facture impayée *</label>
                <select value={form.facture_id} onChange={(e) => {
                    const f = impayees.find(x => String(x.id) === e.target.value);
                    setForm({ ...form, facture_id: e.target.value, montant: f ? String(f.montant_total) : "" });
                  }}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                  <option value="">— Choisir une facture —</option>
                  {impayees.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.reference} — {f.proprietaire_nom || "Inconnu"} — {formatMontant(Number(f.montant_total), f.devise)}
                    </option>
                  ))}
                </select>
              </div>
              {selectedFacture && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                  <div className="font-medium">{selectedFacture.bien_ref} — Parcelle {selectedFacture.numero_parcelle}</div>
                  <div>Échéance: {selectedFacture.date_echeance} · Année {selectedFacture.annee}</div>
                  <div className="font-bold mt-1 text-[#153258]">Total dû: {formatMontant(Number(selectedFacture.montant_total), selectedFacture.devise)}</div>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Montant *</label>
                <input type="number" step="0.01" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
              </div>
              <div>
                <label className="block text-sm mb-1">Mode de paiement *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["mobile_money", "banque", "especes"] as ModePaiement[]).map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, mode_paiement: m })}
                      className={`px-3 py-2 text-sm border rounded flex items-center justify-center gap-1 ${
                        form.mode_paiement === m ? "bg-[#153258] text-white border-[#153258]" : "bg-white dark:bg-gray-700"
                      }`}>
                      {m === "mobile_money" ? <><Smartphone className="w-4 h-4" /> Mobile</>
                        : m === "banque" ? <><Landmark className="w-4 h-4" /> Banque</>
                        : <><Banknote className="w-4 h-4" /> Espèces</>}
                    </button>
                  ))}
                </div>
              </div>

              {form.mode_paiement === "mobile_money" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Opérateur</label>
                    <select value={form.operateur_mobile} onChange={(e) => setForm({ ...form, operateur_mobile: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                      <option value="mpesa">M-PESA (Vodacom)</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="orange">Orange Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Numéro mobile *</label>
                    <input value={form.numero_mobile} onChange={(e) => setForm({ ...form, numero_mobile: e.target.value })}
                      placeholder="+243..." className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">N° transaction</label>
                    <input value={form.numero_transaction} onChange={(e) => setForm({ ...form, numero_transaction: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                </div>
              )}

              {form.mode_paiement === "banque" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Nom banque</label>
                    <input value={form.nom_banque} onChange={(e) => setForm({ ...form, nom_banque: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">N° transaction *</label>
                    <input value={form.numero_transaction} onChange={(e) => setForm({ ...form, numero_transaction: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">Titulaire du compte</label>
                    <input value={form.titulaire_compte} onChange={(e) => setForm({ ...form, titulaire_compte: e.target.value })}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={handlePay} disabled={saving} className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded disabled:opacity-60">
                {saving ? "Traitement..." : "Valider le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail paiement + repartition */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold">{detail.reference}</h3>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white p-4 rounded-lg">
                <div className="text-xs opacity-80">Montant payé</div>
                <div className="text-3xl font-bold">{formatMontant(Number(detail.montant))}</div>
                <div className="text-xs mt-1">{formatDateTime(detail.date_paiement)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Facture:</span> {detail.facture_ref}</div>
                <div><span className="text-gray-500">Année:</span> {detail.annee}</div>
                <div><span className="text-gray-500">Propriétaire:</span> {detail.proprietaire_nom || "—"}</div>
                <div><span className="text-gray-500">Parcelle:</span> {detail.numero_parcelle || "—"}</div>
                <div><span className="text-gray-500">Mode:</span> {detail.mode_paiement}</div>
                <div><span className="text-gray-500">Opérateur:</span> {detail.operateur_mobile || detail.nom_banque || "—"}</div>
                <div><span className="text-gray-500">Numéro:</span> {detail.numero_mobile || "—"}</div>
                <div><span className="text-gray-500">N° transaction:</span> {detail.numero_transaction || "—"}</div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 font-medium text-sm">💸 Répartition aux bénéficiaires</div>
                {detailRep.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Aucune répartition</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left px-4 py-2">Bénéficiaire</th>
                        <th className="text-left px-4 py-2">Type</th>
                        <th className="text-right px-4 py-2">Part</th>
                        <th className="text-right px-4 py-2">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRep.map(r => (
                        <tr key={r.id} className="border-t">
                          <td className="px-4 py-2">{r.beneficiaire_nom || "—"}</td>
                          <td className="px-4 py-2 text-xs">{r.type_part}</td>
                          <td className="px-4 py-2 text-right">{r.type_part === "pourcentage" ? `${r.valeur_part}%` : formatMontant(Number(r.valeur_part))}</td>
                          <td className="px-4 py-2 text-right font-semibold text-[#23A974]">{formatMontant(Number(r.montant))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end sticky bottom-0 bg-white dark:bg-gray-800">
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
