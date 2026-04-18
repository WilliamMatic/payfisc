"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFactures, addFacture, updateFacture, deleteFacture, getContribuables, getCategoriesTaxe, getCommunes,
} from "@/services/environnement/environnementService";
import { Facture, Contribuable, CategorieTaxe, Commune, Pagination } from "@/services/environnement/types";
import { Plus, Search, ChevronLeft, ChevronRight, Filter, X, Eye, Printer, Trash2, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);
const STATUT_LABELS: Record<string, string> = { impayee: "Impayée", payee: "Payée", annulee: "Annulée" };
const STATUT_COLORS: Record<string, string> = { impayee: "bg-red-100 text-red-700", payee: "bg-green-100 text-green-700", annulee: "bg-gray-100 text-gray-700" };

export default function FacturesClient() {
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<Facture[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [categoriesTaxe, setCategoriesTaxe] = useState<CategorieTaxe[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPreview, setShowPreview] = useState<Facture | null>(null);
  const [deleteItem, setDeleteItem] = useState<Facture | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Contribuable search
  const [ctbSearch, setCtbSearch] = useState("");
  const [ctbResults, setCtbResults] = useState<Contribuable[]>([]);
  const [selectedCtb, setSelectedCtb] = useState<Contribuable | null>(null);

  const [form, setForm] = useState({ categorie_taxe_id: "", montant: "", periodicite: "mensuelle", periode_debut: "", periode_fin: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getFactures(utilisateur.site_id, page, 20, search, filterStatut, filterCommune);
    if (res.status === "success" && res.data) { setItems(res.data.factures); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterStatut, filterCommune]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!utilisateur?.site_id) return;
    getCommunes(utilisateur.site_id, 1, 200).then(r => { if (r.status === "success" && r.data) setCommunes(r.data.communes); });
    getCategoriesTaxe(utilisateur.site_id).then(r => { if (r.status === "success" && r.data) setCategoriesTaxe(r.data); });
  }, [utilisateur?.site_id]);

  useEffect(() => {
    if (ctbSearch.length < 2) { setCtbResults([]); return; }
    const t = setTimeout(async () => {
      if (!utilisateur?.site_id) return;
      const res = await getContribuables(utilisateur.site_id, 1, 10, ctbSearch);
      if (res.status === "success" && res.data) setCtbResults(res.data.contribuables);
    }, 300);
    return () => clearTimeout(t);
  }, [ctbSearch, utilisateur?.site_id]);

  const resetForm = () => { setForm({ categorie_taxe_id: "", montant: "", periodicite: "mensuelle", periode_debut: "", periode_fin: "" }); setSelectedCtb(null); setCtbSearch(""); setCtbResults([]); };

  const handleAdd = async () => {
    if (!selectedCtb || !form.montant || !utilisateur?.site_id) return;
    setSaving(true);
    const res = await addFacture({
      contribuable_id: selectedCtb.id,
      categorie_taxe_id: form.categorie_taxe_id ? Number(form.categorie_taxe_id) : null,
      montant: Number(form.montant), periodicite: form.periodicite,
      periode_debut: form.periode_debut || null, periode_fin: form.periode_fin || null,
      province_id: utilisateur.province_id, site_id: utilisateur.site_id,
    });
    if (res.status === "success") { setShowAdd(false); resetForm(); load(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await deleteFacture(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); load(); }
    setSaving(false);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank", "width=800,height=1100");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Facture</title><style>
      @page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}body{padding:20px;color:#1a1a1a}.header{display:flex;justify-content:space-between;border-bottom:3px solid #23A974;padding-bottom:20px;margin-bottom:20px}.title{font-size:28px;font-weight:bold;color:#23A974}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}.info-box{background:#f8f9fa;border-radius:8px;padding:15px}.info-box h4{font-size:11px;text-transform:uppercase;color:#999;margin-bottom:8px;letter-spacing:1px}.info-box p{font-size:13px;line-height:1.6}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#23A974;color:white;padding:10px 12px;font-size:12px;text-align:left}td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}.total-row{background:#f0fdf4;font-weight:bold}.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#999}
    </style></head><body>`);
    w.document.write(content.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  // When category is selected, auto-fill montant
  const onCategoryChange = (catId: string) => {
    const cat = categoriesTaxe.find(c => c.id === Number(catId));
    setForm(f => ({ ...f, categorie_taxe_id: catId, montant: cat ? String(cat.montant) : f.montant, periodicite: cat ? cat.periodicite : f.periodicite }));
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Factures</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des factures environnement</p></div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Nouvelle facture</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><Filter className="w-4 h-4 text-gray-400" /><select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Tous statuts</option>{Object.entries(STATUT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"><select value={filterCommune} onChange={(e) => { setFilterCommune(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"><option value="">Toutes communes</option>{communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Catégorie</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Période</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune facture</td></tr> : items.map(f => (
            <tr key={f.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.reference}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{f.contribuable_nom} {f.contribuable_prenom}</p><p className="text-xs text-gray-500">{f.commune_nom}</p></td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{f.categorie_taxe_nom || "—"}</td>
              <td className="px-4 py-3 text-right font-bold text-[#23A974]">{formatMontant(Number(f.montant))}</td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{f.periode_debut ? new Date(f.periode_debut).toLocaleDateString("fr-FR") : "—"} → {f.periode_fin ? new Date(f.periode_fin).toLocaleDateString("fr-FR") : "—"}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[f.statut] || "bg-gray-100 text-gray-700"}`}>{STATUT_LABELS[f.statut] || f.statut}</span></td>
              <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                <button onClick={() => setShowPreview(f)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button>
                {f.statut === "impayee" && <button onClick={() => setDeleteItem(f)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Annuler"><Trash2 className="w-4 h-4 text-red-500" /></button>}
              </div></td>
            </tr>
          ))}</tbody></table></div>
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

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle facture</h3><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribuable *</label>
              {selectedCtb ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"><div><div className="font-medium text-sm">{selectedCtb.nom} {selectedCtb.prenom || ""}</div><div className="text-xs opacity-60">{selectedCtb.reference}</div></div><button onClick={() => { setSelectedCtb(null); setCtbSearch(""); }} className="text-red-500 text-sm">✕</button></div>
              ) : (
                <div className="relative"><input type="text" placeholder="Rechercher..." value={ctbSearch} onChange={(e) => setCtbSearch(e.target.value)} className={inputClass} />
                  {ctbResults.length > 0 && <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">{ctbResults.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCtb(c); setCtbResults([]); setCtbSearch(""); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"><div className="font-medium">{c.nom} {c.prenom || ""}</div><div className="text-xs opacity-60">{c.reference}</div></button>
                  ))}</div>}
                </div>
              )}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie de taxe</label><select value={form.categorie_taxe_id} onChange={(e) => onCategoryChange(e.target.value)} className={inputClass}><option value="">Sélectionner...</option>{categoriesTaxe.map(c => <option key={c.id} value={c.id}>{c.nom} — {formatMontant(c.montant)}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (CDF) *</label><input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Périodicité</label><select value={form.periodicite} onChange={(e) => setForm({ ...form, periodicite: e.target.value })} className={inputClass}><option value="mensuelle">Mensuelle</option><option value="trimestrielle">Trimestrielle</option><option value="semestrielle">Semestrielle</option><option value="annuelle">Annuelle</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période début</label><input type="date" value={form.periode_debut} onChange={(e) => setForm({ ...form, periode_debut: e.target.value })} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période fin</label><input type="date" value={form.periode_fin} onChange={(e) => setForm({ ...form, periode_fin: e.target.value })} className={inputClass} /></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !selectedCtb || !form.montant} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Créer la facture"}</button>
          </div>
        </div></div>
      )}

      {/* Invoice Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Aperçu facture</h3><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#23A974] text-white rounded-lg text-sm hover:bg-[#23A974]/90"><Printer className="w-4 h-4" /> Imprimer A4</button><button onClick={() => setShowPreview(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div></div>
          <div className="p-5 overflow-y-auto max-h-[70vh]">
            <div ref={printRef}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #23A974", paddingBottom: 20, marginBottom: 20 }}>
                <div><div style={{ fontSize: 28, fontWeight: "bold", color: "#23A974" }}>FACTURE</div><div style={{ fontSize: 12, color: "#666" }}>Taxe d&apos;environnement</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: "#153258" }}>{showPreview.reference}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: "bold", color: "#153258" }}>PayFisc</div><div style={{ fontSize: 11, color: "#999" }}>{new Date(showPreview.date_creation).toLocaleString("fr-FR")}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Contribuable</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}><strong>{showPreview.contribuable_nom} {showPreview.contribuable_prenom}</strong><br />{showPreview.nom_etablissement && <>{showPreview.nom_etablissement}<br /></>}Réf: {showPreview.contribuable_ref}<br />{showPreview.commune_nom && <>Commune: {showPreview.commune_nom}</>}</p></div>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Détails</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}>Catégorie: {showPreview.categorie_taxe_nom || "—"}<br />Périodicité: {showPreview.periodicite}<br />Période: {showPreview.periode_debut ? new Date(showPreview.periode_debut).toLocaleDateString("fr-FR") : "—"} — {showPreview.periode_fin ? new Date(showPreview.periode_fin).toLocaleDateString("fr-FR") : "—"}</p></div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                <thead><tr><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Description</th><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "right" }}>Montant</th></tr></thead>
                <tbody>
                  <tr><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>Taxe d&apos;environnement — {showPreview.categorie_taxe_nom || "Standard"}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, textAlign: "right" }}>{formatMontant(Number(showPreview.montant))}</td></tr>
                  <tr style={{ background: "#f0fdf4" }}><td style={{ padding: 12, fontSize: 14, fontWeight: "bold" }}>TOTAL</td><td style={{ padding: 12, textAlign: "right", fontSize: 18, color: "#23A974", fontWeight: "bold" }}>{formatMontant(Number(showPreview.montant))}</td></tr>
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div><span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, backgroundColor: showPreview.statut === "payee" ? "#dcfce7" : showPreview.statut === "annulee" ? "#f3f4f6" : "#fee2e2", color: showPreview.statut === "payee" ? "#16a34a" : showPreview.statut === "annulee" ? "#6b7280" : "#dc2626" }}>{STATUT_LABELS[showPreview.statut]}</span></div>
                <div style={{ textAlign: "center" }}><QRCodeSVG value={`FACTURE:${showPreview.reference}|MONTANT:${showPreview.montant}|STATUT:${showPreview.statut}`} size={80} /><p style={{ fontSize: 9, color: "#999", marginTop: 4 }}>{showPreview.reference}</p></div>
              </div>
              <div style={{ textAlign: "center", marginTop: 30, paddingTop: 15, borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#999" }}>PayFisc — Système de gestion fiscale · Facture — Taxe d&apos;environnement</div>
            </div>
          </div>
        </div></div>
      )}

      {/* Delete/Cancel Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
          <Trash2 className="w-12 h-12 text-red-500 mx-auto" /><p className="text-gray-900 dark:text-white font-medium">Annuler la facture {deleteItem.reference} ?</p>
          <div className="flex items-center justify-center gap-3"><button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Non</button><button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Oui, annuler"}</button></div>
        </div></div>
      )}
    </div>
  );
}
