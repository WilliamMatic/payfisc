"use client";
import { useEffect, useState, useCallback } from "react";
import { FileText, Search, Eye, Ban, Sparkles, X, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFactures, getFacture, genererFacturesAnnuelles, annulerFacture } from "@/services/foncier/foncierService";
import { Facture } from "@/services/foncier/types";
import { formatDate, formatMontant, STATUT_FACTURE_COLORS } from "../../_shared/format";

export default function FacturesClient() {
  const { utilisateur } = useAuth();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState(String(currentYear));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<Facture | null>(null);
  const [showGen, setShowGen] = useState(false);
  const [genAnnee, setGenAnnee] = useState(String(currentYear));
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const r = await getFactures(utilisateur.site_id, page, 20, search, statut, annee);
    if (r.status === "success" && r.data) {
      setFactures(r.data.factures);
      setTotalPages(r.data.pagination.totalPages);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, statut, annee]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (f: Facture) => {
    const r = await getFacture(f.id);
    if (r.status === "success" && r.data) setDetail(r.data);
  };

  const handleGenerer = async () => {
    if (!utilisateur?.site_id || !utilisateur.id) return;
    setSaving(true);
    const r = await genererFacturesAnnuelles(utilisateur.site_id, Number(genAnnee), utilisateur.id);
    setSaving(false);
    if (r.status === "success") {
      setMsg({ type: "ok", text: `${r.count ?? 0} facture(s) générée(s). ${r.skipped ?? 0} ignorée(s).` });
      setShowGen(false);
      await load();
    } else {
      setMsg({ type: "err", text: r.message || "Erreur" });
    }
  };

  const handleAnnuler = async (id: number) => {
    setSaving(true);
    const r = await annulerFacture(id);
    setMsg({ type: r.status === "success" ? "ok" : "err", text: r.message || "OK" });
    setSaving(false);
    if (r.status === "success") { setDetail(null); await load(); }
  };

  const qrSrc = (code?: string | null) => code ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(code)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">📄 Factures foncières</h1>
          <p className="text-sm text-gray-500">Avis d&apos;imposition annuels avec QR code</p>
        </div>
        <button onClick={() => setShowGen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow">
          <Sparkles className="w-4 h-4" /> Générer factures annuelles
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
          <button className="float-right" onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <select value={annee} onChange={(e) => { setAnnee(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
          <option value="">Toutes années</option>
          {Array.from({ length: 6 }, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
          <option value="">Tous statuts</option>
          <option value="impayee">Impayée</option>
          <option value="payee">Payée</option>
          <option value="en_retard">En retard</option>
          <option value="annulee">Annulée</option>
        </select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher réf, propriétaire, parcelle..."
            className="w-full pl-10 pr-4 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
        : factures.length === 0 ? <div className="p-8 text-center text-gray-500">Aucune facture</div>
        : <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900"><tr>
              <th className="text-left px-4 py-3">Référence</th>
              <th className="text-left px-4 py-3">Bien</th>
              <th className="text-left px-4 py-3">Propriétaire</th>
              <th className="text-center px-4 py-3">Année</th>
              <th className="text-right px-4 py-3">Base</th>
              <th className="text-right px-4 py-3">Pénalité</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Échéance</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {factures.map(f => (
                <tr key={f.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 font-mono text-xs">{f.reference}</td>
                  <td className="px-4 py-3 text-xs">{f.bien_ref}<br/><span className="text-gray-500">{f.numero_parcelle}</span></td>
                  <td className="px-4 py-3 text-xs">{f.proprietaire_nom || "—"}</td>
                  <td className="px-4 py-3 text-center">{f.annee}</td>
                  <td className="px-4 py-3 text-right">{formatMontant(Number(f.montant_base), f.devise)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatMontant(Number(f.montant_penalite), f.devise)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMontant(Number(f.montant_total), f.devise)}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(f.date_echeance)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUT_FACTURE_COLORS[f.statut]}`}>
                      {f.statut === "impayee" ? "Impayée" : f.statut === "payee" ? "Payée" : f.statut === "en_retard" ? "En retard" : "Annulée"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(f)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                    {f.statut === "impayee" && (
                      <button onClick={() => handleAnnuler(f.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Ban className="w-4 h-4" /></button>
                    )}
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

      {/* Générer factures annuelles */}
      {showGen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#23A974]" /> Générer factures annuelles</h3>
            <p className="text-sm text-gray-500 mb-4">Génère une facture pour chaque bien validé sans facture pour l&apos;année choisie. Les biens sans tarif configuré sont ignorés.</p>
            <label className="block text-sm mb-1">Année</label>
            <input type="number" value={genAnnee} onChange={(e) => setGenAnnee(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowGen(false)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Annuler</button>
              <button onClick={handleGenerer} disabled={saving}
                className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded disabled:opacity-60">
                {saving ? "Génération..." : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b flex justify-between sticky top-0 bg-white dark:bg-gray-800">
              <div>
                <h3 className="font-semibold text-lg">{detail.reference}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${STATUT_FACTURE_COLORS[detail.statut]}`}>
                  {detail.statut === "impayee" ? "Impayée" : detail.statut === "payee" ? "Payée" : detail.statut === "en_retard" ? "En retard" : "Annulée"}
                </span>
              </div>
              <button onClick={() => setDetail(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-3 text-sm">
                <div className="bg-gradient-to-r from-[#153258] to-[#23A974] text-white p-4 rounded-lg">
                  <div className="text-xs opacity-80">Montant total à payer</div>
                  <div className="text-3xl font-bold">{formatMontant(Number(detail.montant_total), detail.devise)}</div>
                  <div className="text-xs mt-2">Échéance: {formatDate(detail.date_echeance)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Année:</span> {detail.annee}</div>
                  <div><span className="text-gray-500">Émise le:</span> {formatDate(detail.date_emission)}</div>
                  <div><span className="text-gray-500">Bien:</span> {detail.bien_ref}</div>
                  <div><span className="text-gray-500">Parcelle:</span> {detail.numero_parcelle || "—"}</div>
                  <div><span className="text-gray-500">Propriétaire:</span> {detail.proprietaire_nom || "—"}</div>
                  <div><span className="text-gray-500">Téléphone:</span> {detail.proprietaire_telephone || "—"}</div>
                  <div><span className="text-gray-500">Commune:</span> {detail.commune_nom || "—"}</div>
                  <div><span className="text-gray-500">Quartier:</span> {detail.quartier_nom || "—"}</div>
                  <div><span className="text-gray-500">Superficie:</span> {Number(detail.superficie).toLocaleString("fr-FR")} m²</div>
                  <div><span className="text-gray-500">Prix/m²:</span> {formatMontant(Number(detail.prix_m2), detail.devise)}</div>
                </div>
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between"><span>Montant de base</span><span>{formatMontant(Number(detail.montant_base), detail.devise)}</span></div>
                  <div className="flex justify-between text-orange-600"><span>Pénalité</span><span>{formatMontant(Number(detail.montant_penalite), detail.devise)}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-1"><span>Total</span><span>{formatMontant(Number(detail.montant_total), detail.devise)}</span></div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                {detail.qr_code && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrSrc(detail.qr_code)} alt="QR" className="w-40 h-40 border rounded" />
                    <div className="text-xs font-mono break-all text-center">{detail.qr_code}</div>
                    <a href={qrSrc(detail.qr_code)} download={`${detail.reference}.png`}
                      className="text-xs text-blue-600 inline-flex items-center gap-1"><Download className="w-3 h-3" /> QR</a>
                  </>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
              {detail.statut === "impayee" && (
                <button onClick={() => handleAnnuler(detail.id)} disabled={saving}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-60">Annuler facture</button>
              )}
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm hover:bg-gray-100 rounded">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
