"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStatistiques, getListeGlobale, getDossierContribuable, getRecettes, getRepartitionPaiement } from "@/services/patente/patenteService";
import { StatistiquesPatente } from "@/services/patente/types";
import {
  Building2,
  TrendingUp,
  DollarSign,
  FileText,
  Clock,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Printer,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Receipt,
  ShieldCheck,
  FolderOpen,
  CalendarDays,
  Wallet,
  ArrowRight,
  Coins,
} from "lucide-react";
import Link from "next/link";

const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function DashboardClient() {
  const { utilisateur } = useAuth();
  const [stats, setStats] = useState<StatistiquesPatente | null>(null);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  // Liste globale
  const [listeData, setListeData] = useState<{ contribuables: any[]; pagination: any; totaux: any } | null>(null);
  const [listeLoading, setListeLoading] = useState(false);
  const [listeFiltre, setListeFiltre] = useState("");
  const [listeSearch, setListeSearch] = useState("");
  const [listePage, setListePage] = useState(1);

  // Dossier contribuable
  const [showDossier, setShowDossier] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Recettes & Répartitions
  const [recettesData, setRecettesData] = useState<any>(null);
  const [recettesLoading, setRecettesLoading] = useState(false);
  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split("T")[0]);

  // Répartition par paiement (modal)
  const [showRepart, setShowRepart] = useState(false);
  const [repartPaiement, setRepartPaiement] = useState<any>(null);
  const [repartData, setRepartData] = useState<any[]>([]);
  const [repartLoading, setRepartLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    try {
      const result = await getStatistiques(utilisateur.site_id, annee);
      if (result.status === "success" && result.data) {
        setStats(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [utilisateur?.site_id, annee]);

  const listeSearchRef = useRef(listeSearch);
  listeSearchRef.current = listeSearch;

  const loadListe = useCallback(async (page = 1) => {
    if (!utilisateur?.site_id) return;
    setListeLoading(true);
    try {
      const res = await getListeGlobale(utilisateur.site_id, annee, listeFiltre, listeSearchRef.current, page, 15);
      if (res.status === "success" && res.data) {
        setListeData(res.data);
        setListePage(page);
      }
    } catch (e) { console.error(e); }
    setListeLoading(false);
  }, [utilisateur?.site_id, annee, listeFiltre]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadListe(1); }, [loadListe]);

  const openDossier = async (contribuableId: number) => {
    setDossierLoading(true);
    setShowDossier(true);
    setDossier(null);
    try {
      const res = await getDossierContribuable(contribuableId, annee);
      if (res.status === "success" && res.data) setDossier(res.data);
    } catch (e) { console.error(e); }
    setDossierLoading(false);
  };

  const loadRecettes = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setRecettesLoading(true);
    try {
      const res = await getRecettes(utilisateur.site_id, dateDebut, dateFin);
      if (res.status === "success" && res.data) setRecettesData(res.data);
    } catch (e) { console.error(e); }
    setRecettesLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin]);

  useEffect(() => { loadRecettes(); }, [loadRecettes]);

  const openRepartPaiement = async (paiement: any) => {
    setRepartPaiement(paiement);
    setRepartData([]);
    setShowRepart(true);
    setRepartLoading(true);
    try {
      const res = await getRepartitionPaiement(paiement.id);
      if (res.status === "success" && res.data) setRepartData(res.data);
    } catch (e) { console.error(e); }
    setRepartLoading(false);
  };

  const handlePrint = () => {
    const t = listeData?.totaux;
    const s = stats;
    const contribs = listeData?.contribuables || [];
    const now = new Date();
    const dateFr = now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const heureFr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const txRecouvrement = t && t.total_montant_du > 0 ? Math.round((t.total_montant_paye / t.total_montant_du) * 100) : 0;

    // Status helper
    const getStatus = (c: any) => {
      if (c.nb_declarations === 0) return { label: "Non déclaré", cls: "nd" };
      if (c.montant_du > 0 && c.montant_paye >= c.montant_du) return { label: "Soldé", cls: "ok" };
      if (c.montant_paye > 0 && c.montant_paye < c.montant_du) return { label: "Partiel", cls: "pt" };
      if (c.montant_du > 0) return { label: "Impayé", cls: "ko" };
      return { label: "En cours", cls: "nd" };
    };

    // Paiements by month for sparkline
    const moisData = moisNoms.map((nom, i) => {
      const val = Number(s?.paiements_par_mois?.find((p) => p.mois === i + 1)?.total || 0);
      return { nom, val };
    });
    const maxMoisVal = Math.max(...moisData.map(m => m.val), 1);

    // Build rows
    const rows = contribs.map((c: any, i: number) => {
      const st = getStatus(c);
      return `<tr>
        <td class="num">${i + 1}</td>
        <td><div class="ent-name">${c.raison_sociale || c.nom_complet}</div><div class="ent-sub">${c.secteur_activite || c.forme_juridique || ""}</div></td>
        <td class="mono">${c.numero_fiscal || "—"}</td>
        <td class="mono sm">${c.rccm || "—"}</td>
        <td class="center">${c.nb_declarations}</td>
        <td><span class="st st-${st.cls}">${st.label}</span></td>
        <td class="right amt">${c.montant_du > 0 ? formatMontant(c.montant_du) : "—"}</td>
        <td class="right amt green">${c.montant_paye > 0 ? formatMontant(c.montant_paye) : "—"}</td>
        <td class="right amt ${c.reste_a_payer > 0 ? "red" : ""}">${c.reste_a_payer > 0 ? formatMontant(c.reste_a_payer) : "—"}</td>
      </tr>`;
    }).join("");

    // Categories breakdown
    const catRows = (s?.par_categorie || []).map((cat) => {
      const pct = s?.total_patentes ? Math.round((cat.total / s.total_patentes) * 100) : 0;
      return `<tr><td class="cap">${cat.categorie}</td><td class="center">${cat.total}</td><td class="center">${pct}%</td><td class="right amt">${formatMontant(cat.montant_total)}</td></tr>`;
    }).join("");

    // Month bars
    const monthBars = moisData.map(m => {
      const pct = maxMoisVal > 0 ? Math.round((m.val / maxMoisVal) * 100) : 0;
      return `<div class="bar-col"><div class="bar-track"><div class="bar-fill" style="height:${Math.max(pct, 3)}%"></div></div><div class="bar-label">${m.nom}</div><div class="bar-val">${m.val > 0 ? formatMontant(m.val) : ""}</div></div>`;
    }).join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Rapport Fiscal Patente — Exercice ${annee}</title>
<style>
@page { size: A4; margin: 12mm 14mm 14mm 14mm; }
@media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size:10px; color:#1e293b; line-height:1.45; background:#fff; }

/* === COVER HEADER === */
.cover { background: linear-gradient(135deg, #153258 0%, #1e4d7b 60%, #23A974 100%); color:#fff; padding:22px 28px; border-radius:0 0 12px 12px; margin-bottom:18px; position:relative; overflow:hidden; }
.cover::before { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:rgba(255,255,255,.06); border-radius:50%; }
.cover::after { content:''; position:absolute; bottom:-30px; left:30%; width:200px; height:80px; background:rgba(255,255,255,.04); border-radius:50%; }
.cover-top { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1; }
.cover-brand { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; opacity:.7; margin-bottom:2px; }
.cover h1 { font-size:22px; font-weight:800; letter-spacing:-.3px; margin:2px 0 4px; }
.cover-sub { font-size:10.5px; opacity:.8; }
.cover-meta { text-align:right; font-size:9.5px; opacity:.75; line-height:1.6; }
.cover-meta strong { font-size:11px; opacity:1; display:block; margin-bottom:2px; }
.cover-badge { display:inline-block; background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.25); padding:3px 14px; border-radius:20px; font-size:10px; font-weight:600; letter-spacing:1px; margin-top:4px; }
.cover-line { height:1px; background:rgba(255,255,255,.15); margin:12px 0 0; position:relative; z-index:1; }

/* === SECTION TITLE === */
.sec-title { font-size:11px; font-weight:700; color:#153258; text-transform:uppercase; letter-spacing:1.2px; border-left:3px solid #23A974; padding-left:8px; margin:18px 0 10px; }

/* === KPI GRID === */
.kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:14px; }
.kpi { border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; text-align:center; position:relative; }
.kpi::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:8px 8px 0 0; }
.kpi.c1::after { background:#153258; } .kpi.c2::after { background:#23A974; } .kpi.c3::after { background:#f59e0b; } .kpi.c4::after { background:#ef4444; } .kpi.c5::after { background:#8b5cf6; }
.kpi .kv { font-size:20px; font-weight:800; color:#153258; line-height:1.2; }
.kpi .kl { font-size:8px; color:#64748b; text-transform:uppercase; letter-spacing:.8px; margin-top:2px; }
.kpi .ks { font-size:8.5px; color:#94a3b8; margin-top:1px; }
.kpi.c2 .kv { color:#166534; } .kpi.c4 .kv { color:#dc2626; }

/* === PROGRESS BAR === */
.progress-section { margin-bottom:14px; }
.progress-bar { background:#e5e7eb; border-radius:6px; height:10px; overflow:hidden; position:relative; }
.progress-fill { height:100%; border-radius:6px; background:linear-gradient(90deg,#23A974,#166534); transition:width .3s; }
.progress-labels { display:flex; justify-content:space-between; margin-top:3px; font-size:8.5px; color:#64748b; }

/* === CHART BARS === */
.chart-section { margin-bottom:16px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:8px; background:#fafbfc; }
.bars-wrap { display:flex; align-items:flex-end; gap:4px; height:80px; margin-top:8px; }
.bar-col { flex:1; display:flex; flex-direction:column; align-items:center; }
.bar-track { width:100%; height:65px; display:flex; align-items:flex-end; justify-content:center; }
.bar-fill { width:70%; max-width:22px; background:linear-gradient(180deg,#23A974,#1a8a60); border-radius:3px 3px 0 0; min-height:2px; }
.bar-label { font-size:7.5px; color:#64748b; margin-top:3px; text-transform:uppercase; letter-spacing:.3px; }
.bar-val { font-size:6.5px; color:#94a3b8; height:10px; }

/* === CATEGORIES MINI-TABLE === */
.cat-table { width:100%; border-collapse:collapse; font-size:9.5px; margin-bottom:12px; }
.cat-table th { background:#f1f5f9; color:#475569; font-weight:600; padding:5px 8px; text-align:left; font-size:8px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #e2e8f0; }
.cat-table td { padding:5px 8px; border-bottom:1px solid #f1f5f9; }
.cat-table .cap { text-transform:capitalize; font-weight:600; color:#153258; }

/* === MAIN TABLE === */
.data-table { width:100%; border-collapse:separate; border-spacing:0; font-size:9px; margin-bottom:10px; }
.data-table thead th { background:#153258; color:#fff; padding:7px 6px; text-align:left; font-weight:600; font-size:8px; text-transform:uppercase; letter-spacing:.5px; }
.data-table thead th:first-child { border-radius:6px 0 0 0; }
.data-table thead th:last-child { border-radius:0 6px 0 0; }
.data-table tbody td { padding:6px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
.data-table tbody tr:nth-child(even) { background:#f8fafc; }
.data-table tbody tr:hover { background:#eef6ff; }
.ent-name { font-weight:600; color:#1e293b; font-size:9.5px; }
.ent-sub { font-size:7.5px; color:#94a3b8; }
.mono { font-family:'Courier New',monospace; font-size:8.5px; color:#475569; }
.sm { font-size:8px; }
.num { color:#94a3b8; font-size:8.5px; text-align:center; width:28px; }
.center { text-align:center; }
.right { text-align:right; }
.amt { font-family:'Courier New',monospace; font-weight:700; font-size:9px; }
.green { color:#166534; }
.red { color:#dc2626; }

/* Status badges */
.st { display:inline-block; padding:2px 8px; border-radius:10px; font-size:8px; font-weight:700; letter-spacing:.2px; }
.st-ok { background:#dcfce7; color:#166534; }
.st-pt { background:#fef3c7; color:#92400e; }
.st-ko { background:#fee2e2; color:#dc2626; }
.st-nd { background:#f1f5f9; color:#64748b; }

/* Totals */
.totals-row td { font-weight:800 !important; background:#f1f5f9 !important; border-top:2px solid #153258; font-size:9.5px; }
.totals-row .tlabel { text-align:right; text-transform:uppercase; letter-spacing:1px; color:#153258; font-size:9px; }

/* === FOOTER === */
.doc-footer { margin-top:16px; padding:10px 0; border-top:2px solid #153258; display:flex; justify-content:space-between; align-items:center; }
.doc-footer-left { font-size:8.5px; color:#153258; font-weight:600; }
.doc-footer-right { font-size:8px; color:#94a3b8; text-align:right; line-height:1.5; }
.doc-footer-line { font-size:7px; color:#cbd5e1; text-align:center; margin-top:6px; }

/* === FILTER BOX === */
.filter-box { background:#eef6ff; border:1px solid #bfdbfe; border-radius:6px; padding:6px 12px; margin-bottom:10px; font-size:9px; color:#1e40af; display:flex; align-items:center; gap:6px; }
.filter-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; }

/* === PAGE BREAK === */
.page-break { page-break-before:always; margin-top:0; }

/* === CONFIDENTIAL === */
.confidential { text-align:center; margin:8px 0; font-size:8px; color:#94a3b8; letter-spacing:3px; text-transform:uppercase; }
</style></head><body>`);

    win.document.write(`
<!-- ======== COVER HEADER ======== -->
<div class="cover">
  <div class="cover-top">
    <div>
      <div class="cover-brand">PayFisc — Direction des Impôts</div>
      <h1>Rapport de Suivi Fiscal</h1>
      <div class="cover-sub">Taxe sur la Patente — Exercice ${annee}</div>
    </div>
    <div class="cover-meta">
      <strong>${utilisateur?.site_nom || "—"}</strong>
      ${dateFr}<br>${heureFr}
      <div class="cover-badge">CONFIDENTIEL</div>
    </div>
  </div>
  <div class="cover-line"></div>
</div>

<!-- ======== KPIs ======== -->
<div class="sec-title">Indicateurs clés de performance</div>
<div class="kpi-grid">
  <div class="kpi c1"><div class="kv">${t?.total_contribuables ?? 0}</div><div class="kl">Contribuables</div><div class="ks">enregistrés</div></div>
  <div class="kpi c2"><div class="kv">${formatMontant(t?.total_montant_paye ?? 0)}</div><div class="kl">Collecté</div><div class="ks">recettes effectives</div></div>
  <div class="kpi c1"><div class="kv">${formatMontant(t?.total_montant_du ?? 0)}</div><div class="kl">Attendu</div><div class="ks">droits constatés</div></div>
  <div class="kpi c4"><div class="kv">${formatMontant(t?.total_reste ?? 0)}</div><div class="kl">Reste</div><div class="ks">à recouvrer</div></div>
  <div class="kpi c5"><div class="kv">${s?.declarations_en_attente ?? 0}</div><div class="kl">En attente</div><div class="ks">à classifier</div></div>
</div>

<!-- ======== TAUX RECOUVREMENT ======== -->
<div class="progress-section">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
    <span style="font-size:9px;font-weight:700;color:#153258;">TAUX DE RECOUVREMENT</span>
    <span style="font-size:16px;font-weight:800;color:${txRecouvrement >= 60 ? "#166534" : txRecouvrement >= 30 ? "#92400e" : "#dc2626"};">${txRecouvrement}%</span>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="width:${txRecouvrement}%"></div></div>
  <div class="progress-labels"><span>0%</span><span>Objectif: 100%</span></div>
</div>

<!-- ======== SITUATION PAR STATUT ======== -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
  <div style="border:1px solid #f1f5f9;border-radius:6px;padding:8px 10px;text-align:center;border-top:3px solid #94a3b8;"><div style="font-size:18px;font-weight:800;color:#64748b;">${t?.non_declares ?? 0}</div><div style="font-size:7.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Non déclarés</div></div>
  <div style="border:1px solid #f1f5f9;border-radius:6px;padding:8px 10px;text-align:center;border-top:3px solid #dc2626;"><div style="font-size:18px;font-weight:800;color:#dc2626;">${t?.declare_non_payes ?? 0}</div><div style="font-size:7.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Déclarés impayés</div></div>
  <div style="border:1px solid #f1f5f9;border-radius:6px;padding:8px 10px;text-align:center;border-top:3px solid #f59e0b;"><div style="font-size:18px;font-weight:800;color:#92400e;">${t?.partiellement_payes ?? 0}</div><div style="font-size:7.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Partiellement payés</div></div>
  <div style="border:1px solid #f1f5f9;border-radius:6px;padding:8px 10px;text-align:center;border-top:3px solid #23A974;"><div style="font-size:18px;font-weight:800;color:#166534;">${t?.totalement_payes ?? 0}</div><div style="font-size:7.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Totalement payés</div></div>
</div>

<!-- ======== GRAPHIQUE MENSUEL + CATEGORIES ======== -->
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px;margin-bottom:12px;">
  <div class="chart-section">
    <div style="font-size:9px;font-weight:700;color:#153258;text-transform:uppercase;letter-spacing:.8px;">Recouvrements mensuels ${annee}</div>
    <div class="bars-wrap">${monthBars}</div>
  </div>
  <div>
    <table class="cat-table">
      <thead><tr><th>Catégorie</th><th style="text-align:center">Nombre</th><th style="text-align:center">%</th><th style="text-align:right">Montant</th></tr></thead>
      <tbody>${catRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">—</td></tr>'}</tbody>
    </table>
  </div>
</div>

${listeFiltre ? `<div class="filter-box"><div class="filter-dot"></div>Filtre appliqué : <strong>${listeFiltre.replace(/_/g, " ")}</strong>${listeSearch ? ` — Recherche : « ${listeSearch} »` : ""}</div>` : ""}

<!-- ======== TABLEAU DÉTAILLÉ ======== -->
<div class="sec-title">État détaillé des contribuables</div>
<table class="data-table">
  <thead>
    <tr>
      <th style="width:4%">N°</th>
      <th style="width:21%">Entreprise / Contribuable</th>
      <th style="width:12%">N° Fiscal</th>
      <th style="width:10%">RCCM</th>
      <th style="width:5%;text-align:center">Décl.</th>
      <th style="width:10%">Statut</th>
      <th style="width:12%;text-align:right">Montant dû</th>
      <th style="width:12%;text-align:right">Payé</th>
      <th style="width:12%;text-align:right">Reste</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    ${t ? `<tr class="totals-row">
      <td colspan="6" class="tlabel">Total général</td>
      <td class="right amt">${formatMontant(t.total_montant_du)}</td>
      <td class="right amt green">${formatMontant(t.total_montant_paye)}</td>
      <td class="right amt red">${formatMontant(t.total_reste)}</td>
    </tr>` : ""}
  </tbody>
</table>

<div class="confidential">— Document à usage interne uniquement —</div>

<!-- ======== FOOTER ======== -->
<div class="doc-footer">
  <div class="doc-footer-left">PayFisc — Système de Gestion Fiscale Intégrée</div>
  <div class="doc-footer-right">
    Rapport généré le ${dateFr} à ${heureFr}<br>
    Par : ${utilisateur?.nom_complet || "—"} • ${utilisateur?.site_nom || "—"}
  </div>
</div>
<div class="doc-footer-line">Réf: RPT-PAT-${annee}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}</div>
`);
    win.document.write("</body></html>");
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const formatMontant = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(v);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#153258]" />
      </div>
    );
  }

  const s = stats;
  const maxMois = Math.max(...(s?.paiements_par_mois?.map((p) => Number(p.total)) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="bg-[#153258] p-1.5 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            Tableau de bord — Patente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d&apos;ensemble des taxes commerciales (patente) — {utilisateur?.site_nom}
          </p>
        </div>
        <select
          value={annee}
          onChange={(e) => setAnnee(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#153258]/50"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={<FileText className="w-5 h-5" />} label="Patentes actives" value={String(s?.patentes_actives ?? 0)} sub={`/ ${s?.total_patentes ?? 0} total`} color="emerald" />
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Montant collecté" value={formatMontant(s?.montant_collecte ?? 0)} sub={`sur ${formatMontant(s?.montant_attendu ?? 0)} attendu`} color="blue" />
        <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Taux de recouvrement" value={`${s?.taux_recouvrement ?? 0}%`} sub={Number(s?.taux_recouvrement) >= 50 ? "Bon" : "À améliorer"} color={Number(s?.taux_recouvrement) >= 50 ? "emerald" : "amber"} trend={Number(s?.taux_recouvrement) >= 50 ? "up" : "down"} />
        <KPICard icon={<Clock className="w-5 h-5" />} label="Déclarations en attente" value={String(s?.declarations_en_attente ?? 0)} sub="À classifier" color="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#153258]" /> Recouvrements mensuels ({annee})
          </h3>
          <div className="flex items-end gap-2 h-48">
            {moisNoms.map((nom, i) => {
              const val = s?.paiements_par_mois?.find((p) => p.mois === i + 1)?.total || 0;
              const pct = maxMois > 0 ? (Number(val) / maxMois) * 100 : 0;
              return (
                <div key={nom} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "160px" }}>
                    <div className="w-full max-w-[28px] bg-[#23A974] dark:bg-[#23A974]/80 rounded-t-md transition-all hover:bg-[#23A974]/80" style={{ height: `${Math.max(pct, 2)}%` }} title={formatMontant(Number(val))} />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{nom}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" /> Répartition par catégorie
          </h3>
          <div className="space-y-4">
            {(s?.par_categorie ?? []).map((cat) => {
              const total = s?.total_patentes || 1;
              const pct = Math.round((cat.total / total) * 100);
              const colors: Record<string, string> = { petite: "bg-blue-500", moyenne: "bg-amber-500", grande: "bg-emerald-500" };
              return (
                <div key={cat.categorie}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{cat.categorie}</span>
                    <span className="text-gray-500 dark:text-gray-400">{cat.total} ({pct}%) — {formatMontant(cat.montant_total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`${colors[cat.categorie] || "bg-gray-400"} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!s?.par_categorie || s.par_categorie.length === 0) && <p className="text-sm text-gray-400 text-center py-8">Aucune donnée disponible</p>}
          </div>
        </div>
      </div>

      {/* Par secteur + Top contribuables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" /> Par secteur d&apos;activité
          </h3>
          <div className="space-y-3">
            {(s?.par_secteur ?? []).map((sec) => {
              const icons: Record<string, string> = { commerce: "🏪", service: "🔧", industrie: "🏭", artisanat: "🎨", transport: "🚚", restauration: "🍽️", autre: "📦" };
              return (
                <div key={sec.secteur_activite} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{icons[sec.secteur_activite] || "📦"}</span>
                    <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{sec.secteur_activite}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{sec.total}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatMontant(sec.montant_total)}</span>
                  </div>
                </div>
              );
            })}
            {(!s?.par_secteur || s.par_secteur.length === 0) && <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#23A974]" /> Top contribuables
          </h3>
          <div className="space-y-2">
            {(s?.top_contribuables ?? []).map((tc, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tc.nom_complet}</p>
                    <p className="text-xs text-gray-400">{tc.type_activite}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#23A974]">{formatMontant(tc.montant)}</span>
              </div>
            ))}
            {(!s?.top_contribuables || s.top_contribuables.length === 0) && <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Accès rapide</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/activity/patente/contribuables", icon: "👤", label: "Contribuables" },
            { href: "/activity/patente/declarations", icon: "📋", label: "Déclarations" },
            { href: "/activity/patente/classification", icon: "🔍", label: "Classification" },
            { href: "/activity/patente/gestion", icon: "📜", label: "Patentes" },
            { href: "/activity/patente/paiements", icon: "💳", label: "Paiements" },
            { href: "/activity/patente/controles", icon: "🔎", label: "Contrôles" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RECETTES & RÉPARTITIONS                                           */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#23A974]" />
              Recettes & Répartitions
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {recettesLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#153258]" /></div>
        ) : recettesData ? (
          <div className="p-5 space-y-5">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-[#153258] to-[#1e4d7b] rounded-xl p-4 text-white">
                <p className="text-xs opacity-70 uppercase tracking-wider">Total recettes</p>
                <p className="text-2xl font-bold mt-1">{formatMontant(Number(recettesData.recettes?.total_recettes ?? 0))}</p>
                <p className="text-xs opacity-60 mt-1">{recettesData.recettes?.nb_paiements ?? 0} paiement(s)</p>
              </div>
              <div className="bg-gradient-to-br from-[#23A974] to-[#1a8a60] rounded-xl p-4 text-white">
                <p className="text-xs opacity-70 uppercase tracking-wider">Total réparti</p>
                <p className="text-2xl font-bold mt-1">{formatMontant(Number(recettesData.total_reparti ?? 0))}</p>
                <p className="text-xs opacity-60 mt-1">{recettesData.repartitions?.length ?? 0} bénéficiaire(s)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Période</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {new Date(dateDebut).toLocaleDateString("fr-FR")} — {new Date(dateFin).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Taux: {Number(recettesData.recettes?.total_recettes) > 0 && Number(recettesData.total_reparti) > 0
                    ? Math.round((Number(recettesData.total_reparti) / Number(recettesData.recettes.total_recettes)) * 100) : 0}% réparti
                </p>
              </div>
            </div>

            {/* Répartitions par bénéficiaire */}
            {recettesData.repartitions?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  <PieChart className="w-4 h-4 text-[#153258]" /> Répartition par bénéficiaire
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {recettesData.repartitions.map((r: any, i: number) => {
                    const pct = Number(recettesData.recettes?.total_recettes) > 0
                      ? Math.round((Number(r.total_montant) / Number(recettesData.recettes.total_recettes)) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.beneficiaire_nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{r.type_part === "pourcentage" ? `${r.valeur_part_originale}%` : "Fixe"}</span>
                            {r.province_nom && <span className="text-[10px] text-gray-400">• {r.province_nom}</span>}
                            <span className="text-[10px] text-gray-400">• {r.nb_repartitions} op.</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1.5">
                            <div className="bg-[#23A974] h-1 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-bold text-[#23A974]">{formatMontant(Number(r.total_montant))}</p>
                          <p className="text-[10px] text-gray-400">{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paiements de la période */}
            {recettesData.paiements?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-[#153258]" /> Paiements sur la période ({recettesData.paiements.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Référence</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Contribuable</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">N° Patente</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Mode</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 text-xs">Montant</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Date</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 text-xs">Répartition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {recettesData.paiements.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.reference}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">{p.nom_complet}</td>
                          <td className="px-3 py-2 text-xs font-mono text-[#153258] dark:text-blue-300">{p.numero_patente}</td>
                          <td className="px-3 py-2 text-xs capitalize text-gray-500">{p.mode_paiement?.replace(/_/g, " ")}</td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-[#23A974]">{formatMontant(Number(p.montant_paye))}</td>
                          <td className="px-3 py-2 text-xs text-gray-400">{p.date_confirmation ? new Date(p.date_confirmation).toLocaleDateString("fr-FR") : "—"}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => openRepartPaiement(p)}
                              className="p-1.5 hover:bg-[#153258]/10 rounded-lg transition-colors" title="Voir répartition">
                              <Coins className="w-4 h-4 text-[#153258]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">Aucune donnée de recettes</div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SUIVI FISCAL — LISTE GLOBALE                                      */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#153258]" />
                Suivi Fiscal — Contribuables ({annee})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cliquez sur un contribuable pour voir son dossier complet
              </p>
            </div>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#153258] hover:bg-[#153258]/90 text-white rounded-lg text-sm font-medium transition-colors">
              <Printer className="w-4 h-4" /> Imprimer A4
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <form onSubmit={(e) => { e.preventDefault(); loadListe(1); }} className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={listeSearch} onChange={(e) => setListeSearch(e.target.value)} placeholder="Rechercher entreprise, NIF, RCCM..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-sm">Chercher</button>
            </form>
            <select value={listeFiltre} onChange={(e) => { setListeFiltre(e.target.value); }}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">Tous</option>
              <option value="non_declare">Non déclarés</option>
              <option value="declare_non_paye">Déclarés non payés</option>
              <option value="partiellement_paye">Partiellement payés</option>
              <option value="totalement_paye">Totalement payés</option>
              <option value="en_attente_classification">En attente classification</option>
            </select>
          </div>

          {/* Summary chips */}
          {listeData?.totaux && (
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: "Total", value: listeData.totaux.total_contribuables, color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
                { label: "Non déclarés", value: listeData.totaux.non_declares, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
                { label: "Impayés", value: listeData.totaux.declare_non_payes, color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
                { label: "Partiels", value: listeData.totaux.partiellement_payes, color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
                { label: "Payés", value: listeData.totaux.totalement_payes, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
              ].map((c) => (
                <span key={c.label} className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}: {c.value}</span>
              ))}
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#153258]/10 text-[#153258] dark:bg-[#153258]/30 dark:text-blue-300">
                Collecté: {formatMontant(listeData.totaux.total_montant_paye)} / {formatMontant(listeData.totaux.total_montant_du)}
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Entreprise</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">N° Fiscal</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Décl.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Montant dû</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Payé</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Reste</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {listeLoading ? (
                <tr><td colSpan={8} className="py-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#153258] mx-auto" /></td></tr>
              ) : !listeData?.contribuables?.length ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Aucun contribuable trouvé</td></tr>
              ) : (
                listeData.contribuables.map((c: any) => {
                  const getStatutInfo = () => {
                    if (c.nb_declarations === 0) return { label: "Non déclaré", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: XCircle };
                    if (c.montant_du > 0 && c.montant_paye >= c.montant_du) return { label: "Payé", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 };
                    if (c.montant_paye > 0 && c.montant_paye < c.montant_du) return { label: "Partiel", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: AlertTriangle };
                    if (c.montant_du > 0) return { label: "Impayé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: XCircle };
                    return { label: c.dernier_statut_declaration || "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock };
                  };
                  const si = getStatutInfo();
                  const SIcon = si.icon;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => openDossier(c.id)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{c.raison_sociale || c.nom_complet}</p>
                        <p className="text-xs text-gray-400">{c.rccm || c.forme_juridique || ""}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#153258] dark:text-blue-300">{c.numero_fiscal}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${c.nb_declarations > 0 ? "bg-[#23A974]/10 text-[#23A974]" : "bg-gray-100 text-gray-400"}`}>
                          {c.nb_declarations}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${si.color}`}>
                          <SIcon className="w-3 h-3" /> {si.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{c.montant_du > 0 ? formatMontant(c.montant_du) : "—"}</td>
                      <td className="px-4 py-3 text-right text-[#23A974] font-medium">{c.montant_paye > 0 ? formatMontant(c.montant_paye) : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={c.reste_a_payer > 0 ? "text-red-600" : "text-gray-400"}>{c.reste_a_payer > 0 ? formatMontant(c.reste_a_payer) : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); openDossier(c.id); }}
                          className="p-1.5 hover:bg-[#153258]/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-[#153258]" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {listeData?.pagination && listeData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">{listeData.pagination.total} contribuable(s) — Page {listeData.pagination.page}/{listeData.pagination.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={listePage <= 1} onClick={() => loadListe(listePage - 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={listePage >= listeData.pagination.totalPages} onClick={() => loadListe(listePage + 1)} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* DOSSIER CONTRIBUABLE MODAL                                        */}
      {/* ================================================================ */}
      {showDossier && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDossier(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-200">
            {dossierLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#153258]" />
              </div>
            ) : dossier ? (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#153258] p-2.5 rounded-xl">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{dossier.contribuable.raison_sociale || dossier.contribuable.nom_complet}</h2>
                      <p className="text-xs text-gray-500">{dossier.contribuable.numero_fiscal} • {dossier.contribuable.rccm || ""} • Dossier {annee}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDossier(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Resume KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-[#153258] dark:text-blue-300">{dossier.resume.nb_declarations}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Déclarations</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMontant(dossier.resume.montant_total)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Montant dû</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-[#23A974]">{formatMontant(dossier.resume.montant_paye)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Payé</p>
                    </div>
                    <div className={`${dossier.resume.reste_a_payer > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"} rounded-xl p-3 text-center`}>
                      <p className={`text-xl font-bold ${dossier.resume.reste_a_payer > 0 ? "text-red-600" : "text-[#23A974]"}`}>
                        {dossier.resume.reste_a_payer > 0 ? formatMontant(dossier.resume.reste_a_payer) : "Soldé"}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Reste à payer</p>
                    </div>
                  </div>

                  {/* Declarations */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[#153258]" /> Déclarations ({dossier.declarations.length})
                    </h3>
                    {dossier.declarations.length === 0 ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Aucune déclaration pour {annee}</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Ce contribuable n&apos;a pas encore fait de déclaration cette année</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dossier.declarations.map((d: any) => {
                          const stColor: Record<string, string> = {
                            soumise: "bg-blue-100 text-blue-700", classifiee: "bg-purple-100 text-purple-700",
                            validee: "bg-emerald-100 text-emerald-700", rejetee: "bg-red-100 text-red-700",
                            en_classification: "bg-amber-100 text-amber-700", brouillon: "bg-gray-100 text-gray-700",
                          };
                          return (
                            <div key={d.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{d.type_activite}</p>
                                <p className="text-xs text-gray-400">{d.secteur_activite} • {d.date_soumission_fmt || "—"}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMontant(d.chiffre_affaires_estime)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stColor[d.statut] || "bg-gray-100 text-gray-600"}`}>{d.statut}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Patentes */}
                  {dossier.patentes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-[#23A974]" /> Patentes ({dossier.patentes.length})
                      </h3>
                      <div className="space-y-2">
                        {dossier.patentes.map((p: any) => {
                          const pColor: Record<string, string> = {
                            active: "bg-emerald-100 text-emerald-700", en_attente_paiement: "bg-amber-100 text-amber-700",
                            expiree: "bg-red-100 text-red-700", suspendue: "bg-orange-100 text-orange-700", annulee: "bg-gray-100 text-gray-700",
                          };
                          return (
                            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                              <div>
                                <p className="text-sm font-medium font-mono text-[#153258] dark:text-blue-300">{p.numero_patente}</p>
                                <p className="text-xs text-gray-400">Valide jusqu&apos;au {p.fin_validite_fmt}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMontant(p.montant)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pColor[p.statut] || "bg-gray-100 text-gray-600"}`}>{p.statut?.replace(/_/g, " ")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Paiements */}
                  {dossier.paiements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-[#23A974]" /> Paiements ({dossier.paiements.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#153258]/5 dark:bg-gray-900/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Date</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Référence</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Mode</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-500 text-xs">Montant</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {dossier.paiements.map((p: any) => (
                              <tr key={p.id}>
                                <td className="px-3 py-2 text-xs text-gray-600">{p.date_paiement_fmt}</td>
                                <td className="px-3 py-2 text-xs font-mono text-gray-500">{p.reference}</td>
                                <td className="px-3 py-2 text-xs capitalize text-gray-600">{p.mode_paiement?.replace(/_/g, " ")}</td>
                                <td className="px-3 py-2 text-right text-sm font-semibold text-[#23A974]">{formatMontant(p.montant_paye)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Controles */}
                  {dossier.controles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" /> Contrôles ({dossier.controles.length})
                      </h3>
                      <div className="space-y-2">
                        {dossier.controles.map((ct: any) => (
                          <div key={ct.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{ct.adresse_commerce || "—"}</p>
                              <p className="text-xs text-gray-400">{ct.date_controle_fmt} • {ct.agent_nom}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ct.resultat === "conforme" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>{ct.resultat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-gray-400">Erreur de chargement du dossier</div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL — RÉPARTITION D'UN PAIEMENT                                */}
      {/* ================================================================ */}
      {showRepart && repartPaiement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowRepart(false); setRepartPaiement(null); setRepartData([]); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#153258] to-[#1e4d7b] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider">Répartition du paiement</p>
                  <p className="text-lg font-bold mt-1">{repartPaiement.reference}</p>
                  <p className="text-sm opacity-70 mt-0.5">{repartPaiement.nom_complet} — {formatMontant(Number(repartPaiement.montant_paye))}</p>
                </div>
                <button onClick={() => { setShowRepart(false); setRepartPaiement(null); setRepartData([]); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              {repartLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#153258]" /></div>
              ) : repartData.length > 0 ? (
                <div className="space-y-2">
                  {repartData.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{r.type_part === "pourcentage" ? `${r.valeur_part_originale}%` : "Fixe"}</span>
                          {r.province_nom && <span className="text-[10px] text-gray-400">• {r.province_nom}</span>}
                          {r.numero_compte && <span className="text-[10px] text-gray-400">• {r.numero_compte}</span>}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#23A974] ml-3">{formatMontant(Number(r.montant))}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total réparti</span>
                    <span className="text-base font-bold text-[#153258] dark:text-blue-300">
                      {formatMontant(repartData.reduce((s: number, r: any) => s + Number(r.montant), 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">Aucune répartition enregistrée pour ce paiement</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function KPICard({ icon, label, value, sub, color, trend }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; trend?: "up" | "down" }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/30", icon: "text-emerald-600 dark:text-emerald-400" },
    blue: { bg: "bg-blue-50 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/30", icon: "text-amber-600 dark:text-amber-400" },
    red: { bg: "bg-red-50 dark:bg-red-900/30", icon: "text-red-600 dark:text-red-400" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.bg}`}><span className={c.icon}>{icon}</span></div>
        {trend && (trend === "up" ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />)}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
