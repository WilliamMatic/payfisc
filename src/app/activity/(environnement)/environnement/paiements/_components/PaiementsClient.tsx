"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPaiements, enregistrerPaiement, getFactures, getRepartitionPaiement, getCommunes,
} from "@/services/environnement/environnementService";
import { Paiement, Facture, Repartition, Commune, Pagination } from "@/services/environnement/types";
import { Search, ChevronLeft, ChevronRight, Filter, Calendar, Printer, X, Plus, Eye, DollarSign } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);
const MODE_LABELS: Record<string, string> = { especes: "Espèces", mobile_money: "Mobile Money", banque: "Banque" };

export default function PaiementsClient() {
  const { utilisateur } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterMode, setFilterMode] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [facturesImpayees, setFacturesImpayees] = useState<Facture[]>([]);
  const [payForm, setPayForm] = useState({ facture_id: "", mode_paiement: "especes", numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" });
  const [saving, setSaving] = useState(false);

  const [showReceipt, setShowReceipt] = useState<Paiement | null>(null);
  const [repartitions, setRepartitions] = useState<Repartition[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getPaiements(utilisateur.site_id, page, 20, search, filterMode, filterCommune, dateDebut, dateFin);
    if (res.status === "success" && res.data) { setPaiements(res.data.paiements); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterMode, filterCommune, dateDebut, dateFin]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (utilisateur?.site_id) getCommunes(utilisateur.site_id, 1, 200).then(r => { if (r.status === "success" && r.data) setCommunes(r.data.communes); }); }, [utilisateur?.site_id]);

  const openPayModal = async () => {
    if (!utilisateur?.site_id) return;
    const res = await getFactures(utilisateur.site_id, 1, 200, "", "impayee");
    if (res.status === "success" && res.data) setFacturesImpayees(res.data.factures);
    setPayForm({ facture_id: "", mode_paiement: "especes", numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" });
    setShowPayModal(true);
  };

  const handlePay = async () => {
    if (!payForm.facture_id || !utilisateur?.site_id) return;
    const facture = facturesImpayees.find(f => f.id === Number(payForm.facture_id));
    if (!facture) return;
    setSaving(true);
    const res = await enregistrerPaiement({
      facture_id: Number(payForm.facture_id), contribuable_id: facture.contribuable_id,
      montant: facture.montant, mode_paiement: payForm.mode_paiement,
      numero_mobile: payForm.mode_paiement === "mobile_money" ? payForm.numero_mobile : null,
      nom_banque: payForm.mode_paiement === "banque" ? payForm.nom_banque : null,
      numero_carte: payForm.mode_paiement === "banque" ? payForm.numero_carte : null,
      titulaire_carte: payForm.mode_paiement === "banque" ? payForm.titulaire_carte : null,
      site_id: utilisateur.site_id, province_id: utilisateur.province_id, utilisateur_id: utilisateur.id,
    });
    if (res.status === "success") { setShowPayModal(false); load(); }
    setSaving(false);
  };

  const openReceipt = async (p: Paiement) => {
    setShowReceipt(p);
    const res = await getRepartitionPaiement(p.id);
    if (res.status === "success" && res.data) setRepartitions(res.data); else setRepartitions([]);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank", "width=800,height=1100");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Reçu</title><style>
      @page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}body{padding:20px;color:#1a1a1a}.header{display:flex;justify-content:space-between;border-bottom:3px solid #23A974;padding-bottom:20px;margin-bottom:20px}.title{font-size:28px;font-weight:bold;color:#23A974}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#23A974;color:white;padding:10px 12px;font-size:12px;text-align:left}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#999}
    </style></head><body>`);
    w.document.write(content.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  const selectedFacture = facturesImpayees.find(f => f.id === Number(payForm.facture_id));
  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enregistrement et suivi des paiements</p></div>
        <button onClick={openPayModal} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Enregistrer un paiement</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher par référence, nom..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterMode} onChange={(e) => { setFilterMode(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Tous modes</option>{Object.entries(MODE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Calendar className="w-4 h-4 text-gray-400" /><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" /><span className="text-gray-400">→</span><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" /></div>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Facture</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Mode</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{paiements.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun paiement trouvé</td></tr> : paiements.map(p => (
            <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.reference}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{p.contribuable_nom} {p.contribuable_prenom}</p><p className="text-xs text-gray-500">{p.commune_nom}</p></td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.facture_ref}</td>
              <td className="px-4 py-3 text-right font-bold text-[#23A974]">{formatMontant(Number(p.montant))}</td>
              <td className="px-4 py-3"><span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{MODE_LABELS[p.mode_paiement] || p.mode_paiement}</span></td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(p.date_paiement).toLocaleString("fr-FR")}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => openReceipt(p)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Reçu"><Eye className="w-4 h-4 text-blue-500" /></button></td>
            </tr>
          ))}</tbody></table></div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} paiement(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#23A974]" /> Enregistrer un paiement</h3><button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facture impayée *</label><select value={payForm.facture_id} onChange={(e) => setPayForm({ ...payForm, facture_id: e.target.value })} className={inputClass}><option value="">Sélectionner une facture...</option>{facturesImpayees.map(f => <option key={f.id} value={f.id}>{f.reference} — {f.contribuable_nom} {f.contribuable_prenom} — {formatMontant(Number(f.montant))}</option>)}</select></div>
            {selectedFacture && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm"><p className="font-medium text-blue-700 dark:text-blue-300">Montant: {formatMontant(Number(selectedFacture.montant))}</p><p className="text-xs text-blue-600 dark:text-blue-400">{selectedFacture.categorie_taxe_nom} · {selectedFacture.commune_nom}</p></div>}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement *</label><select value={payForm.mode_paiement} onChange={(e) => setPayForm({ ...payForm, mode_paiement: e.target.value })} className={inputClass}>{Object.entries(MODE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {payForm.mode_paiement === "mobile_money" && <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro mobile *</label><input type="tel" value={payForm.numero_mobile} onChange={(e) => setPayForm({ ...payForm, numero_mobile: e.target.value })} placeholder="+243..." className={inputClass} /></div>}
            {payForm.mode_paiement === "banque" && <>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la banque *</label><input type="text" value={payForm.nom_banque} onChange={(e) => setPayForm({ ...payForm, nom_banque: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° carte</label><input type="text" value={payForm.numero_carte} onChange={(e) => setPayForm({ ...payForm, numero_carte: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titulaire</label><input type="text" value={payForm.titulaire_carte} onChange={(e) => setPayForm({ ...payForm, titulaire_carte: e.target.value })} className={inputClass} /></div>
              </div>
            </>}
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handlePay} disabled={saving || !payForm.facture_id} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Enregistrer le paiement"}</button>
          </div>
        </div></div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Reçu de paiement</h3><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#23A974] text-white rounded-lg text-sm hover:bg-[#23A974]/90"><Printer className="w-4 h-4" /> Imprimer A4</button><button onClick={() => { setShowReceipt(null); setRepartitions([]); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div></div>
          <div className="p-5 overflow-y-auto max-h-[70vh]">
            <div ref={printRef}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #23A974", paddingBottom: 20, marginBottom: 20 }}>
                <div><div style={{ fontSize: 28, fontWeight: "bold", color: "#23A974" }}>REÇU DE PAIEMENT</div><div style={{ fontSize: 12, color: "#666" }}>Taxe d&apos;environnement</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: "#153258" }}>{showReceipt.reference}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: "bold", color: "#153258" }}>PayFisc</div><div style={{ fontSize: 11, color: "#999" }}>Date: {new Date(showReceipt.date_paiement).toLocaleString("fr-FR")}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Contribuable</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}><strong>{showReceipt.contribuable_nom} {showReceipt.contribuable_prenom}</strong><br />{showReceipt.nom_etablissement && <>{showReceipt.nom_etablissement}<br /></>}Réf: {showReceipt.contribuable_ref}<br />{showReceipt.contribuable_tel && <>Tél: {showReceipt.contribuable_tel}<br /></>}{showReceipt.commune_nom && <>Commune: {showReceipt.commune_nom}</>}</p></div>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Paiement</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}>Facture: {showReceipt.facture_ref}<br />Période: {showReceipt.periode_debut ? new Date(showReceipt.periode_debut).toLocaleDateString("fr-FR") : "—"} — {showReceipt.periode_fin ? new Date(showReceipt.periode_fin).toLocaleDateString("fr-FR") : "—"}<br />Mode: {MODE_LABELS[showReceipt.mode_paiement] || showReceipt.mode_paiement}<br />{showReceipt.numero_mobile && <>N° mobile: {showReceipt.numero_mobile}<br /></>}{showReceipt.nom_banque && <>Banque: {showReceipt.nom_banque}</>}</p></div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                <thead><tr><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Description</th><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "right" }}>Montant</th></tr></thead>
                <tbody>
                  <tr><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>Taxe d&apos;environnement — {showReceipt.categorie_taxe_nom}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, textAlign: "right" }}>{formatMontant(Number(showReceipt.montant))}</td></tr>
                  <tr style={{ background: "#f0fdf4" }}><td style={{ padding: 12, fontSize: 14, fontWeight: "bold" }}>TOTAL PAYÉ</td><td style={{ padding: 12, textAlign: "right", fontSize: 18, color: "#23A974", fontWeight: "bold" }}>{formatMontant(Number(showReceipt.montant))}</td></tr>
                </tbody>
              </table>
              {repartitions.length > 0 && <>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#153258", margin: "15px 0 8px" }}>Répartition du paiement</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>
                  <th style={{ background: "#153258", color: "white", padding: "8px 12px", fontSize: 11, textAlign: "left" }}>Bénéficiaire</th>
                  <th style={{ background: "#153258", color: "white", padding: "8px 12px", fontSize: 11, textAlign: "left" }}>Compte</th>
                  <th style={{ background: "#153258", color: "white", padding: "8px 12px", fontSize: 11, textAlign: "right" }}>Montant</th>
                </tr></thead><tbody>{repartitions.map(r => (
                  <tr key={r.id}><td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12 }}>{r.beneficiaire_nom}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12 }}>{r.numero_compte || "—"}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12, textAlign: "right", fontWeight: "bold" }}>{formatMontant(Number(r.montant))}</td></tr>
                ))}</tbody></table>
              </>}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}><div style={{ textAlign: "center" }}><QRCodeSVG value={`RECU:${showReceipt.reference}|MONTANT:${showReceipt.montant}|DATE:${showReceipt.date_paiement}`} size={80} /><p style={{ fontSize: 9, color: "#999", marginTop: 4 }}>{showReceipt.reference}</p></div></div>
              <div style={{ textAlign: "center", marginTop: 30, paddingTop: 15, borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#999" }}>PayFisc — Système de gestion fiscale · Reçu de paiement — Taxe d&apos;environnement · Document généré automatiquement</div>
            </div>
          </div>
        </div></div>
      )}
    </div>
  );
}
