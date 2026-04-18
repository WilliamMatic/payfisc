"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSanctions, addSanction, updateStatutSanction, getContribuables, getControles, payerSanctionAmende, getRepartitionPaiementSanction } from "@/services/environnement/environnementService";
import { Sanction, Contribuable, Controle, Repartition, Pagination } from "@/services/environnement/types";
import { Search, ChevronLeft, ChevronRight, Plus, X, ShieldAlert, Eye, RefreshCw, DollarSign, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const formatMontant = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF", maximumFractionDigits: 0 }).format(n);
const TYPE_LABELS: Record<string, string> = { amende: "Amende", fermeture: "Fermeture", saisie: "Saisie", avertissement: "Avertissement" };
const STATUT_LABELS: Record<string, string> = { active: "En cours", en_cours: "En cours", levee: "Levée", payee: "Payée" };
const STATUT_COLORS: Record<string, string> = { active: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", en_cours: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", levee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", payee: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };

export default function SanctionsClient() {
  const { utilisateur } = useAuth();
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contribuable_id: "", controle_id: "", type_sanction: "amende", montant_amende: "", motif: "" });
  const [contribSearch, setContribSearch] = useState("");
  const [contribResults, setContribResults] = useState<Contribuable[]>([]);
  const [selectedContrib, setSelectedContrib] = useState<Contribuable | null>(null);
  const [controles, setControles] = useState<Controle[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDetail, setShowDetail] = useState<Sanction | null>(null);
  const [showStatutModal, setShowStatutModal] = useState<Sanction | null>(null);
  const [newStatut, setNewStatut] = useState("");

  const [showPayModal, setShowPayModal] = useState<Sanction | null>(null);
  const [payForm, setPayForm] = useState({ mode_paiement: "especes", numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" });

  const [showReceipt, setShowReceipt] = useState<{ sanction: Sanction; paiementRef: string; paiementId: number } | null>(null);
  const [repartitions, setRepartitions] = useState<Repartition[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const MODE_LABELS: Record<string, string> = { especes: "Espèces", mobile_money: "Mobile Money", banque: "Banque" };

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await getSanctions(utilisateur.site_id, page, 20, search, filterType, filterStatut);
    if (res.status === "success" && res.data) { setSanctions(res.data.sanctions); setPagination(res.data.pagination); }
    setLoading(false);
  }, [utilisateur?.site_id, page, search, filterType, filterStatut]);
  useEffect(() => { load(); }, [load]);

  const searchContrib = (q: string) => {
    setContribSearch(q);
    setSelectedContrib(null);
    setForm(f => ({ ...f, contribuable_id: "", controle_id: "" }));
    setControles([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2 || !utilisateur?.site_id) { setContribResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await getContribuables(utilisateur!.site_id!, 1, 10, q);
      if (res.status === "success" && res.data) setContribResults(res.data.contribuables);
    }, 300);
  };

  const selectContrib = async (c: Contribuable) => {
    setSelectedContrib(c);
    setContribSearch(`${c.nom} ${c.prenom} — ${c.reference}`);
    setContribResults([]);
    setForm(f => ({ ...f, contribuable_id: String(c.id), controle_id: "" }));
    if (!utilisateur?.site_id) return;
    const res = await getControles(utilisateur.site_id, 1, 50, c.reference);
    if (res.status === "success" && res.data) setControles(res.data.controles);
  };

  const handleAdd = async () => {
    if (!form.contribuable_id || !utilisateur?.site_id) return;
    setSaving(true);
    const res = await addSanction({
      contribuable_id: Number(form.contribuable_id), controle_id: form.controle_id ? Number(form.controle_id) : null,
      type_sanction: form.type_sanction, montant_amende: form.type_sanction === "amende" && form.montant_amende ? Number(form.montant_amende) : null,
      motif: form.motif, site_id: utilisateur.site_id, province_id: utilisateur.province_id, utilisateur_id: utilisateur.id,
    });
    if (res.status === "success") { setShowModal(false); load(); }
    setSaving(false);
  };

  const handleStatut = async () => {
    if (!showStatutModal || !newStatut) return;
    setSaving(true);
    const res = await updateStatutSanction(showStatutModal.id, newStatut);
    if (res.status === "success") { setShowStatutModal(null); load(); }
    setSaving(false);
  };

  const handlePay = async () => {
    if (!showPayModal || !utilisateur?.site_id) return;
    setSaving(true);
    const res = await payerSanctionAmende({
      sanction_id: showPayModal.id, site_id: utilisateur.site_id,
      province_id: utilisateur.province_id, utilisateur_id: utilisateur.id,
      mode_paiement: payForm.mode_paiement,
      numero_mobile: payForm.mode_paiement === "mobile_money" ? payForm.numero_mobile : null,
      nom_banque: payForm.mode_paiement === "banque" ? payForm.nom_banque : null,
      numero_carte: payForm.mode_paiement === "banque" ? payForm.numero_carte : null,
      titulaire_carte: payForm.mode_paiement === "banque" ? payForm.titulaire_carte : null,
    });
    if (res.status === "success" && res.id) {
      const sanctionCopy = { ...showPayModal };
      setShowPayModal(null);
      load();
      // Open receipt
      setShowReceipt({ sanction: sanctionCopy, paiementRef: res.reference || "", paiementId: res.id });
      const rep = await getRepartitionPaiementSanction(res.id);
      if (rep.status === "success" && rep.data) setRepartitions(rep.data); else setRepartitions([]);
    }
    setSaving(false);
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

  const openAdd = () => {
    setForm({ contribuable_id: "", controle_id: "", type_sanction: "amende", montant_amende: "", motif: "" });
    setContribSearch(""); setSelectedContrib(null); setContribResults([]); setControles([]);
    setShowModal(true);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#153258] outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sanctions</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des sanctions et amendes</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"><Plus className="w-4 h-4" /> Nouvelle sanction</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md"><Search className="w-4 h-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none flex-1" /></div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300"><option value="">Tous types</option>{Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300"><option value="">Tous statuts</option><option value="active">En cours</option><option value="levee">Levée</option><option value="payee">Payée</option></select>
      </div>

      {loading ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700/50">
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Référence</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Contribuable</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Montant amende</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
            <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Date</th>
            <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
          </tr></thead>
          <tbody>{sanctions.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune sanction trouvée</td></tr> : sanctions.map(s => (
            <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.reference}</td>
              <td className="px-4 py-3"><p className="font-medium text-gray-900 dark:text-white">{s.contribuable_nom} {s.contribuable_prenom}</p><p className="text-xs text-gray-500">{s.contribuable_ref}</p></td>
              <td className="px-4 py-3 text-xs">{TYPE_LABELS[s.type_sanction] || s.type_sanction}</td>
              <td className="px-4 py-3 text-right font-bold text-red-500">{s.montant_amende ? formatMontant(Number(s.montant_amende)) : "—"}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[s.statut] || "bg-gray-100 text-gray-700"}`}>{STATUT_LABELS[s.statut] || s.statut}</span></td>
              <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{new Date(s.date_creation).toLocaleString("fr-FR")}</td>
              <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                <button onClick={() => setShowDetail(s)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-4 h-4 text-blue-500" /></button>
                {s.statut === "active" && s.type_sanction === "amende" && s.montant_amende && Number(s.montant_amende) > 0 && <button onClick={() => { setShowPayModal(s); setPayForm({ mode_paiement: "especes", numero_mobile: "", nom_banque: "", numero_carte: "", titulaire_carte: "" }); }} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Payer l'amende"><DollarSign className="w-4 h-4 text-green-500" /></button>}
                {s.statut === "active" && <button onClick={() => { setShowStatutModal(s); setNewStatut(""); }} className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Changer statut"><RefreshCw className="w-4 h-4 text-orange-500" /></button>}
              </td>
            </tr>
          ))}</tbody></table></div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{pagination.total} sanction(s)</span>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500" /> Nouvelle sanction</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribuable *</label>
              <input type="text" value={contribSearch} onChange={(e) => searchContrib(e.target.value)} placeholder="Rechercher un contribuable..." className={inputClass} />
              {contribResults.length > 0 && <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">{contribResults.map(c => (
                <button key={c.id} onClick={() => selectContrib(c)} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"><span className="font-medium text-gray-900 dark:text-white">{c.nom} {c.prenom}</span><span className="text-xs text-gray-500 ml-2">{c.reference}</span></button>
              ))}</div>}
              {selectedContrib && <p className="text-xs text-green-600 mt-1">{selectedContrib.nom} {selectedContrib.prenom}</p>}
            </div>
            {controles.length > 0 && (
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrôle associé</label><select value={form.controle_id} onChange={(e) => setForm({ ...form, controle_id: e.target.value })} className={inputClass}><option value="">Aucun contrôle</option>{controles.map(c => <option key={c.id} value={c.id}>{new Date(c.date_controle).toLocaleDateString("fr-FR")} — {c.type_controle} — {c.resultat}</option>)}</select></div>
            )}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de sanction *</label><select value={form.type_sanction} onChange={(e) => setForm({ ...form, type_sanction: e.target.value })} className={inputClass}>{Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {form.type_sanction === "amende" && <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant de l&apos;amende (CDF) *</label><input type="number" value={form.montant_amende} onChange={(e) => setForm({ ...form, montant_amende: e.target.value })} className={inputClass} /></div>}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motif *</label><textarea value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} rows={3} className={inputClass} /></div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleAdd} disabled={saving || !form.contribuable_id || !form.motif} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Enregistrer"}</button>
          </div>
        </div></div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="bg-gradient-to-r from-[#153258] to-[#23A974] rounded-t-2xl p-5 text-white">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Détail de la sanction</h3><button onClick={() => setShowDetail(null)} className="p-2 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button></div>
            <p className="text-sm opacity-80 mt-1">{showDetail.reference}</p>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Contribuable</span><span className="font-medium text-gray-900 dark:text-white">{showDetail.contribuable_nom} {showDetail.contribuable_prenom}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-900 dark:text-white">{TYPE_LABELS[showDetail.type_sanction]}</span></div>
            {showDetail.montant_amende && <div className="flex justify-between"><span className="text-gray-500">Montant amende</span><span className="font-bold text-red-500">{formatMontant(Number(showDetail.montant_amende))}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Statut</span><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[showDetail.statut]}`}>{STATUT_LABELS[showDetail.statut]}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-900 dark:text-white">{new Date(showDetail.date_creation).toLocaleString("fr-FR")}</span></div>
            {showDetail.motif && <div><span className="text-gray-500 block mb-1">Motif</span><p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{showDetail.motif}</p></div>}
          </div>
          <div className="p-5 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowDetail(null)} className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Fermer</button></div>
        </div></div>
      )}

      {/* Statut Update Modal */}
      {showStatutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Changer le statut</h3><p className="text-sm text-gray-500 mt-1">{showStatutModal.reference}</p></div>
          <div className="p-5 space-y-3">
            <button onClick={() => setNewStatut("levee")} className={`w-full p-3 rounded-lg border text-left text-sm ${newStatut === "levee" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}><span className="font-medium text-gray-900 dark:text-white">Levée</span><p className="text-xs text-gray-500 mt-0.5">La sanction est levée</p></button>
            <button onClick={() => setNewStatut("payee")} className={`w-full p-3 rounded-lg border text-left text-sm ${newStatut === "payee" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}><span className="font-medium text-gray-900 dark:text-white">Payée</span><p className="text-xs text-gray-500 mt-0.5">L&apos;amende a été payée</p></button>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowStatutModal(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handleStatut} disabled={saving || !newStatut} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Confirmer"}</button>
          </div>
        </div></div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#23A974]" /> Payer l&apos;amende</h3><button onClick={() => setShowPayModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
              <p className="font-medium text-red-700 dark:text-red-300">Sanction: {showPayModal.reference}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{showPayModal.contribuable_nom} {showPayModal.contribuable_prenom}</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{formatMontant(Number(showPayModal.montant_amende))}</p>
            </div>
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
            <button onClick={() => setShowPayModal(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Annuler</button>
            <button onClick={handlePay} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "..." : "Confirmer le paiement"}</button>
          </div>
        </div></div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Reçu de paiement — Amende</h3><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#23A974] text-white rounded-lg text-sm hover:bg-[#23A974]/90"><Printer className="w-4 h-4" /> Imprimer A4</button><button onClick={() => { setShowReceipt(null); setRepartitions([]); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button></div></div>
          <div className="p-5 overflow-y-auto max-h-[70vh]">
            <div ref={printRef}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #23A974", paddingBottom: 20, marginBottom: 20 }}>
                <div><div style={{ fontSize: 28, fontWeight: "bold", color: "#23A974" }}>REÇU DE PAIEMENT</div><div style={{ fontSize: 12, color: "#666" }}>Amende — Sanction environnementale</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: "#153258" }}>{showReceipt.paiementRef}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: "bold", color: "#153258" }}>PayFisc</div><div style={{ fontSize: 11, color: "#999" }}>Date: {new Date().toLocaleString("fr-FR")}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Contribuable</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}><strong>{showReceipt.sanction.contribuable_nom} {showReceipt.sanction.contribuable_prenom}</strong><br />{showReceipt.sanction.nom_etablissement && <>{showReceipt.sanction.nom_etablissement}<br /></>}Réf: {showReceipt.sanction.contribuable_ref}<br />{showReceipt.sanction.commune_nom && <>Commune: {showReceipt.sanction.commune_nom}</>}</p></div>
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 15 }}><h4 style={{ fontSize: 11, textTransform: "uppercase", color: "#999", marginBottom: 8, letterSpacing: 1 }}>Sanction</h4><p style={{ fontSize: 13, lineHeight: 1.6 }}>Réf sanction: {showReceipt.sanction.reference}<br />Type: {TYPE_LABELS[showReceipt.sanction.type_sanction]}<br />Motif: {showReceipt.sanction.motif || "—"}<br />Mode: {MODE_LABELS[payForm.mode_paiement] || payForm.mode_paiement}</p></div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                <thead><tr><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "left" }}>Description</th><th style={{ background: "#23A974", color: "white", padding: "10px 12px", fontSize: 12, textAlign: "right" }}>Montant</th></tr></thead>
                <tbody>
                  <tr><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>Amende — {showReceipt.sanction.reference}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 13, textAlign: "right" }}>{formatMontant(Number(showReceipt.sanction.montant_amende))}</td></tr>
                  <tr style={{ background: "#f0fdf4" }}><td style={{ padding: 12, fontSize: 14, fontWeight: "bold" }}>TOTAL PAYÉ</td><td style={{ padding: 12, textAlign: "right", fontSize: 18, color: "#23A974", fontWeight: "bold" }}>{formatMontant(Number(showReceipt.sanction.montant_amende))}</td></tr>
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
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}><div style={{ textAlign: "center" }}><QRCodeSVG value={`RECU:${showReceipt.paiementRef}|SANCTION:${showReceipt.sanction.reference}|MONTANT:${showReceipt.sanction.montant_amende}`} size={80} /><p style={{ fontSize: 9, color: "#999", marginTop: 4 }}>{showReceipt.paiementRef}</p></div></div>
              <div style={{ textAlign: "center", marginTop: 30, paddingTop: 15, borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#999" }}>PayFisc — Système de gestion fiscale · Reçu de paiement — Amende environnementale · Document généré automatiquement</div>
            </div>
          </div>
        </div></div>
      )}
    </div>
  );
}
