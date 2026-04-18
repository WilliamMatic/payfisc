"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStatistiques, getRepartitionGlobale, getEngins, getContribuables, getTypeEngins, getEnginsAvecContribuables } from "@/services/embarquement/embarquementService";
import { StatistiquesEmbarquement, RepartitionGlobale, EnginEmbarquement, ContribuableEmbarquement, TypeEnginEmbarquement } from "@/services/embarquement/types";
import {
  TrendingUp, DollarSign, Users, BarChart3, PieChart, Calendar,
  ArrowUpRight, Wallet, Coins, Car, Ship, X, Eye, Printer, Filter, Search,
} from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(n);

const MODE_LABELS: Record<string, string> = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  banque: "Banque",
};

const MODE_COLORS: Record<string, string> = {
  especes: "bg-green-500",
  mobile_money: "bg-blue-500",
  banque: "bg-purple-500",
};

export default function DashboardClient() {
  const { utilisateur } = useAuth();
  const [stats, setStats] = useState<StatistiquesEmbarquement | null>(null);
  const [repartition, setRepartition] = useState<RepartitionGlobale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateFin, setDateFin] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [showRepartition, setShowRepartition] = useState(false);
  const [typeEnginId, setTypeEnginId] = useState("");
  const [typeEngins, setTypeEngins] = useState<TypeEnginEmbarquement[]>([]);
  const [showEngins, setShowEngins] = useState(false);
  const [showContribuables, setShowContribuables] = useState(false);
  const [showPrintList, setShowPrintList] = useState(false);
  const [enginsList, setEnginsList] = useState<EnginEmbarquement[]>([]);
  const [contribuablesList, setContribuablesList] = useState<ContribuableEmbarquement[]>([]);
  const [enginsContribuables, setEnginsContribuables] = useState<Record<string, unknown>[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [searchEngins, setSearchEngins] = useState("");
  const [searchContribuables, setSearchContribuables] = useState("");

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    try {
      const [statsRes, repRes] = await Promise.all([
        getStatistiques(utilisateur.site_id, dateDebut, dateFin, typeEnginId || undefined),
        getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin),
      ]);
      if (statsRes.status === "success" && statsRes.data) setStats(statsRes.data);
      if (repRes.status === "success" && repRes.data) setRepartition(repRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin, typeEnginId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getTypeEngins(utilisateur.site_id, 1, 100).then(res => {
        if (res.status === "success" && res.data) setTypeEngins(res.data.type_engins);
      });
    }
  }, [utilisateur?.site_id]);

  const openEnginsList = async () => {
    if (!utilisateur?.site_id) return;
    setShowEngins(true);
    setLoadingModal(true);
    try {
      const res = await getEngins(utilisateur.site_id, 1, 500);
      if (res.status === "success" && res.data) {
        let engins = res.data.engins;
        if (typeEnginId) engins = engins.filter(e => String(e.type_engin_id) === typeEnginId);
        setEnginsList(engins);
      }
    } catch (e) { console.error(e); }
    setLoadingModal(false);
  };

  const openContribuablesList = async () => {
    if (!utilisateur?.site_id) return;
    setShowContribuables(true);
    setLoadingModal(true);
    try {
      const res = await getContribuables(utilisateur.site_id, 1, 500);
      if (res.status === "success" && res.data) setContribuablesList(res.data.contribuables);
    } catch (e) { console.error(e); }
    setLoadingModal(false);
  };

  const openPrintList = async () => {
    if (!utilisateur?.site_id) return;
    setShowPrintList(true);
    setLoadingModal(true);
    try {
      const res = await getEnginsAvecContribuables(utilisateur.site_id, dateDebut, dateFin, typeEnginId || undefined);
      if (res.status === "success" && res.data) setEnginsContribuables(res.data);
    } catch (e) { console.error(e); }
    setLoadingModal(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("print-engins-contribuables");
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const typeLabel = typeEnginId ? typeEngins.find(t => String(t.id) === typeEnginId)?.nom || "" : "Tous types";
    w.document.write(`<html><head><title>Liste Engins - Contribuables</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 15mm; font-size: 11px; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 3px 6px; }
        th { background: #153258; color: white; font-size: 10px; }
        td { font-size: 10px; }
        tr:nth-child(even) { background: #f5f5f5; }
        @media print { @page { size: A4 landscape; margin: 10mm; } }
      </style></head><body>
      <h1>Liste des Engins et Contribuables</h1>
      <div class="subtitle">Période: ${dateDebut} au ${dateFin} | Type: ${typeLabel}</div>
      ${printContent.innerHTML}
      </body></html>`);
    w.document.close();
    w.print();
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-32" />
          ))}
        </div>
      </div>
    );
  }

  const maxEvolution = Math.max(...stats.evolution_journaliere.map((e) => e.total), 1);
  const totalModesPaiement = stats.par_mode_paiement.reduce((s, m) => s + m.total, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taxe d&apos;embarquement — Vue d&apos;ensemble</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={typeEnginId} onChange={(e) => setTypeEnginId(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Tous les types</option>
              {typeEngins.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
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
          <button onClick={openPrintList}
            className="flex items-center gap-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg px-4 py-2 text-sm font-medium hover:shadow-lg transition-all">
            <Printer className="w-4 h-4" /> Imprimer liste
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Collecte aujourd'hui", value: formatMontant(stats.collecte_aujourdhui), icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Collecte semaine", value: formatMontant(stats.collecte_semaine), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Collecte mois", value: formatMontant(stats.collecte_mois), icon: Wallet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Total période", value: formatMontant(stats.total_collecte), icon: Coins, color: "text-[#153258]", bg: "bg-[#153258]/5" },
        ].map((c, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{c.label}</span>
              <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paiements période</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_paiements}</p>
            </div>
          </div>
        </div>
        <div onClick={openContribuablesList} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg hover:border-cyan-400 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Contribuables</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_contribuables}</p>
            </div>
            <Eye className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-colors" />
          </div>
        </div>
        <div onClick={openEnginsList} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg hover:border-red-400 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Engins enregistrés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_engins}</p>
            </div>
            <Eye className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution journalière */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#153258]" /> Évolution journalière
          </h3>
          {stats.evolution_journaliere.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée pour cette période</p>
          ) : (
            <div className="space-y-2">
              {stats.evolution_journaliere.map((e) => (
                <div key={e.jour} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">
                    {new Date(e.jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#153258] to-[#23A974] rounded-full transition-all"
                      style={{ width: `${(e.total / maxEvolution) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 text-right">
                    {formatMontant(e.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition par mode de paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#23A974]" /> Répartition par mode de paiement
          </h3>
          {stats.par_mode_paiement.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {stats.par_mode_paiement.map((m) => {
                const pct = ((m.total / totalModesPaiement) * 100).toFixed(1);
                return (
                  <div key={m.mode_paiement}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{MODE_LABELS[m.mode_paiement] || m.mode_paiement}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatMontant(m.total)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-full ${MODE_COLORS[m.mode_paiement] || "bg-gray-500"} rounded-full`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Par type de véhicule + Taux annulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Ship className="w-4 h-4 text-[#153258]" /> Collecte par type de véhicule
          </h3>
          {stats.par_type_vehicule.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.par_type_vehicule.map((t) => (
                    <tr key={t.type_nom} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white">{t.type_nom}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-400">{t.nb}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatMontant(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Taux annulation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Taux d&apos;annulation</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200 dark:text-gray-700" stroke="currentColor" strokeWidth="3" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-red-500" stroke="currentColor" strokeWidth="3" fill="none"
                    strokeDasharray={`${stats.taux_annulation}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                  {stats.taux_annulation}%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stats.nb_annulations} annulation(s)</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">sur la période sélectionnée</p>
              </div>
            </div>
          </div>

          {/* Bouton répartition */}
          <button onClick={() => setShowRepartition(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium">
            <Eye className="w-4 h-4" /> Voir répartition par bénéficiaire
          </button>
        </div>
      </div>

      {/* Modal Répartition */}
      {showRepartition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#23A974]" /> Répartition par bénéficiaire
              </h3>
              <button onClick={() => setShowRepartition(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {repartition.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune répartition trouvée pour cette période.</p>
              ) : (
                <div className="space-y-3">
                  {repartition.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{r.beneficiaire_nom}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.numero_compte || "—"} · {r.nb_repartitions} paiement(s)</p>
                      </div>
                      <p className="text-lg font-bold text-[#23A974]">{formatMontant(Number(r.total_montant))}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-[#153258]/5 dark:bg-[#153258]/20 rounded-xl border-2 border-[#153258]/20">
                    <p className="font-bold text-gray-900 dark:text-white">Total réparti</p>
                    <p className="text-lg font-bold text-[#153258]">
                      {formatMontant(repartition.reduce((s, r) => s + Number(r.total_montant), 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Engins */}
      {showEngins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-red-500" /> Engins enregistrés ({enginsList.length})
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Rechercher..." value={searchEngins} onChange={(e) => setSearchEngins(e.target.value)}
                    className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 w-40" />
                </div>
                <button onClick={() => { setShowEngins(false); setSearchEngins(""); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              {loadingModal ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#153258] rounded-full animate-spin" /></div>
              ) : enginsList.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun engin trouvé.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">N°</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Plaque</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Marque/Modèle</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Couleur</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Créé le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enginsList
                      .filter(e => !searchEngins ||
                        e.numero_plaque?.toLowerCase().includes(searchEngins.toLowerCase()) ||
                        e.marque_modele?.toLowerCase().includes(searchEngins.toLowerCase()) ||
                        e.type_engin_nom?.toLowerCase().includes(searchEngins.toLowerCase())
                      )
                      .map((e, i) => (
                      <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{e.numero_plaque}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{e.type_engin_nom || "—"}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{e.marque_modele || "—"}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{e.couleur || "—"}</td>
                        <td className="py-2 px-2 text-gray-500 dark:text-gray-400 text-xs">{new Date(e.date_creation).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Contribuables */}
      {showContribuables && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" /> Contribuables ({contribuablesList.length})
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Rechercher..." value={searchContribuables} onChange={(e) => setSearchContribuables(e.target.value)}
                    className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 w-40" />
                </div>
                <button onClick={() => { setShowContribuables(false); setSearchContribuables(""); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              {loadingModal ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#153258] rounded-full animate-spin" /></div>
              ) : contribuablesList.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun contribuable trouvé.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">N°</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Nom</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Postnom</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Prénom</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Rôle</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Téléphone</th>
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Sexe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contribuablesList
                      .filter(c => !searchContribuables ||
                        c.nom?.toLowerCase().includes(searchContribuables.toLowerCase()) ||
                        c.postnom?.toLowerCase().includes(searchContribuables.toLowerCase()) ||
                        c.prenom?.toLowerCase().includes(searchContribuables.toLowerCase()) ||
                        c.telephone?.includes(searchContribuables)
                      )
                      .map((c, i) => (
                      <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{c.nom}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{c.postnom || "—"}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{c.prenom || "—"}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.role === "proprietaire" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                            {c.role === "proprietaire" ? "Propriétaire" : "Chauffeur"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{c.telephone || "—"}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{c.sexe === "M" ? "Homme" : "Femme"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Impression A4 */}
      {showPrintList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#23A974]" /> Liste Engins &amp; Contribuables
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={handlePrint}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg px-4 py-2 text-sm font-medium hover:shadow-lg transition-all">
                  <Printer className="w-4 h-4" /> Imprimer (A4)
                </button>
                <button onClick={() => setShowPrintList(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[75vh]">
              {loadingModal ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#153258] rounded-full animate-spin" /></div>
              ) : enginsContribuables.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune donnée trouvée pour cette période.</p>
              ) : (
                <div id="print-engins-contribuables">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#153258] text-white">
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">N°</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Plaque</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Type</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Marque/Modèle</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Couleur</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Contribuable</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Téléphone</th>
                        <th className="py-2 px-3 text-left text-xs font-medium border border-gray-300">Rôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enginsContribuables.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/30"}>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-500 text-xs">{i + 1}</td>
                          <td className="py-1.5 px-3 border border-gray-200 font-medium text-gray-900 dark:text-white text-xs">{String(item.numero_plaque)}</td>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-600 dark:text-gray-400 text-xs">{String(item.type_engin_nom)}</td>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-600 dark:text-gray-400 text-xs">{String(item.marque_modele || "—")}</td>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-600 dark:text-gray-400 text-xs">{String(item.couleur || "—")}</td>
                          <td className="py-1.5 px-3 border border-gray-200 font-medium text-gray-900 dark:text-white text-xs">
                            {[item.contribuable_nom, item.contribuable_postnom, item.contribuable_prenom].filter(Boolean).join(" ")}
                          </td>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-600 dark:text-gray-400 text-xs">{String(item.contribuable_telephone || "—")}</td>
                          <td className="py-1.5 px-3 border border-gray-200 text-gray-600 dark:text-gray-400 text-xs">{item.contribuable_role === "proprietaire" ? "Propriétaire" : "Chauffeur"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-right text-xs text-gray-500">
                    Total: {enginsContribuables.length} enregistrement(s)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
