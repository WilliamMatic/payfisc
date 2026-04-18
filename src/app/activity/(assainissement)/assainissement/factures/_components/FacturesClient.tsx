"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFactures, genererFactures, annulerFacture, getAxes,
} from "@/services/assainissement/assainissementService";
import { Facture, Axe, Pagination } from "@/services/assainissement/types";
import {
  Search, ChevronLeft, ChevronRight, Filter, Calendar, Printer,
  FileText, X, Zap, Ban, Eye,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const STATUT_LABELS: Record<string, string> = {
  impayee: "Impayée", payee: "Payée", annulee: "Annulée", en_retard: "En retard",
};
const STATUT_COLORS: Record<string, string> = {
  impayee: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  payee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  annulee: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  en_retard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function FacturesClient() {
  const { utilisateur } = useAuth();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [axes, setAxes] = useState<Axe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [showGenerer, setShowGenerer] = useState(false);
  const [genMois, setGenMois] = useState(() => String(new Date().getMonth() + 1));
  const [genAnnee, setGenAnnee] = useState(() => String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [showFacture, setShowFacture] = useState<Facture | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getFactures(utilisateur.site_id, page, 20, search, filterStatut, filterCommune, dateDebut, dateFin);
    if (res.status === "success" && res.data) {
      setFactures(res.data.factures);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterStatut, filterCommune, dateDebut, dateFin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getAxes(utilisateur.site_id, 1, 200).then((r) => { if (r.status === "success" && r.data) setAxes(r.data.communes); });
    }
  }, [utilisateur?.site_id]);

  const handleGenerer = async () => {
    if (!utilisateur?.site_id) return;
    setGenerating(true);
    setGenResult(null);
    const res = await genererFactures(utilisateur.site_id, utilisateur.id, genMois, genAnnee);
    setGenResult(res.message || (res.status === "success" ? `${res.count || 0} facture(s) générée(s)` : "Erreur"));
    if (res.status === "success") load();
    setGenerating(false);
  };

  const handleAnnuler = async (id: number) => {
    setSaving(true);
    const res = await annulerFacture(id);
    if (res.status === "success") load();
    setSaving(false);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank", "width=800,height=1100");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Facture</title><style>
      @page { size: A4; margin: 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
      body { padding: 20px; color: #1a1a1a; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #153258; padding-bottom: 20px; margin-bottom: 20px; }
      .title { font-size: 28px; font-weight: bold; color: #153258; }
      .subtitle { font-size: 12px; color: #666; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .info-box { background: #f8f9fa; border-radius: 8px; padding: 15px; }
      .info-box h4 { font-size: 11px; text-transform: uppercase; color: #999; margin-bottom: 8px; letter-spacing: 1px; }
      .info-box p { font-size: 13px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #153258; color: white; padding: 10px 12px; font-size: 12px; text-align: left; }
      td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
      .total-row { background: #f0fdf4; font-weight: bold; }
      .total-amount { font-size: 18px; color: #23A974; }
      .qr-section { text-align: center; margin-top: 20px; }
      .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
      .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      .status-impayee { background: #fef3c7; color: #92400e; }
      .status-payee { background: #d1fae5; color: #065f46; }
      .status-annulee { background: #f3f4f6; color: #4b5563; }
      .status-en_retard { background: #fee2e2; color: #991b1b; }
    </style></head><body>`);
    w.document.write(content.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Factures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion et génération des factures d&apos;assainissement</p>
        </div>
        <button onClick={() => setShowGenerer(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
          <Zap className="w-4 h-4" /> Générer les factures
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par référence, nom..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="">Tous statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
            <option value="">Tous les axes</option>
            {axes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
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
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type taxe</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Période</th>
                  <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
                  <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune facture trouvée</td></tr>
                ) : factures.map((f) => (
                  <tr key={f.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{f.contribuable_nom} {f.contribuable_prenom}</p>
                      <p className="text-xs text-gray-500">{f.commune_nom}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{f.type_taxe_nom}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatMontant(Number(f.montant))}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(f.periode_debut).toLocaleDateString("fr-FR")} — {new Date(f.periode_fin).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[f.statut] || ""}`}>
                        {STATUT_LABELS[f.statut] || f.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setShowFacture(f)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Voir / Imprimer"><Eye className="w-4 h-4 text-blue-500" /></button>
                        {f.statut === "impayee" && (
                          <button onClick={() => handleAnnuler(f.id)} disabled={saving} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Annuler"><Ban className="w-4 h-4 text-red-500" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} facture(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Zap className="w-5 h-5 text-[#23A974]" /> Générer les factures</h3>
              <button onClick={() => { setShowGenerer(false); setGenResult(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Génère automatiquement les factures pour tous les contribuables ayant un type de taxe assigné.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mois</label>
                  <select value={genMois} onChange={(e) => setGenMois(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString("fr-FR", { month: "long" })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Année</label>
                  <input type="number" value={genAnnee} onChange={(e) => setGenAnnee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              {genResult && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">{genResult}</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowGenerer(false); setGenResult(null); }} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Fermer</button>
              <button onClick={handleGenerer} disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {generating ? "Génération..." : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview & Print Modal */}
      {showFacture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-[#153258]" /> Facture {showFacture.reference}</h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#153258] text-white rounded-lg text-sm hover:bg-[#153258]/90"><Printer className="w-4 h-4" /> Imprimer A4</button>
                <button onClick={() => setShowFacture(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              {/* Printable content */}
              <div ref={printRef}>
                <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #153258", paddingBottom: 20, marginBottom: 20 }}>
                  <div>
                    <div className="title" style={{ fontSize: 28, fontWeight: "bold", color: "#153258" }}>FACTURE</div>
                    <div className="subtitle" style={{ fontSize: 12, color: "#666" }}>Taxe d&apos;assainissement</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: "#23A974" }}>{showFacture.reference}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: "bold", color: "#153258" }}>PayFisc</div>
                    <div style={{ fontSize: 11, color: "#999" }}>Système de gestion fiscale</div>
                    <div style={{ fontSize: 11, color: "#999" }}>Date: {new Date(showFacture.date_creation).toLocaleDateString("fr-FR")}</div>
                  </div>
                </div>

                <div className="info-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div className="info-box" style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}>
                    <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Contribuable</h4>
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <strong>{showFacture.contribuable_nom} {showFacture.contribuable_prenom}</strong><br />
                      {showFacture.nom_etablissement && <>{showFacture.nom_etablissement}<br /></>}
                      Réf: {showFacture.contribuable_ref}<br />
                      {showFacture.contribuable_tel && <>Tél: {showFacture.contribuable_tel}<br /></>}
                      Type: {showFacture.type_contribuable}
                    </p>
                  </div>
                  <div className="info-box" style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}>
                    <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Localisation</h4>
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {showFacture.commune_nom && <>Axe: {showFacture.commune_nom}<br /></>}
                      {showFacture.quartier_nom && <>Quartier: {showFacture.quartier_nom}<br /></>}
                      {showFacture.avenue_nom && <>Avenue: {showFacture.avenue_nom}<br /></>}
                      {showFacture.numero_avenue && <>N°: {showFacture.numero_avenue}<br /></>}
                      {showFacture.numero_parcelle && <>Parcelle: {showFacture.numero_parcelle}</>}
                    </p>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                  <thead>
                    <tr>
                      <th style={{ background: "#153258", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Description</th>
                      <th style={{ background: "#153258", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Période</th>
                      <th style={{ background: "#153258", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Échéance</th>
                      <th style={{ background: "#153258", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "right" }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>Taxe d&apos;assainissement — {showFacture.type_taxe_nom}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>{new Date(showFacture.periode_debut).toLocaleDateString("fr-FR")} — {new Date(showFacture.periode_fin).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>{new Date(showFacture.date_echeance).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, textAlign: "right", fontWeight: "bold" }}>{formatMontant(Number(showFacture.montant))}</td>
                    </tr>
                    <tr className="total-row" style={{ background: "#f0fdf4" }}>
                      <td colSpan={3} style={{ padding: "12px", fontSize: 14, fontWeight: "bold" }}>TOTAL À PAYER</td>
                      <td className="total-amount" style={{ padding: "12px", textAlign: "right", fontSize: 18, color: "#23A974", fontWeight: "bold" }}>{formatMontant(Number(showFacture.montant))}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                  <div>
                    <span className={`status status-${showFacture.statut}`} style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {STATUT_LABELS[showFacture.statut]}
                    </span>
                  </div>
                  <div className="qr-section" style={{ textAlign: "center" }}>
                    <QRCodeSVG value={`FACTURE:${showFacture.reference}|MONTANT:${showFacture.montant}|STATUT:${showFacture.statut}`} size={80} />
                    <p style={{ fontSize: 9, color: "#999", marginTop: 4 }}>{showFacture.reference}</p>
                  </div>
                </div>

                <div className="footer" style={{ textAlign: "center", marginTop: 30, paddingTop: 15, borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#999" }}>
                  PayFisc — Système de gestion fiscale · Taxe d&apos;assainissement · Document généré automatiquement
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
