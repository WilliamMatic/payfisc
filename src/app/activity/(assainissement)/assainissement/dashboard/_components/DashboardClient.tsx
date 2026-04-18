"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStatistiques, getRepartitionGlobale, getAxes, getTypesContribuable, getTypesTaxe,
  getRevenusMensuels,
} from "@/services/assainissement/assainissementService";
import {
  Statistiques, RepartitionGlobale, Axe, TypeContribuableItem, TypeTaxe, RevenuMensuel,
} from "@/services/assainissement/types";
import {
  TrendingUp, DollarSign, Calendar, ArrowUpRight, Wallet, Coins,
  PieChart, BarChart3, Eye, X, Filter, Shield, AlertTriangle,
  Users, Truck, FileText, CheckCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

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
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [repartition, setRepartition] = useState<RepartitionGlobale[]>([]);
  const [axes, setAxes] = useState<Axe[]>([]);
  const [typesContribuable, setTypesContribuable] = useState<TypeContribuableItem[]>([]);
  const [typesTaxe, setTypesTaxe] = useState<TypeTaxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [axeId, setAxeId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTaxe, setFilterTaxe] = useState("");
  const [showRepartition, setShowRepartition] = useState(false);
  const [revenusMensuels, setRevenusMensuels] = useState<RevenuMensuel[]>([]);
  const [anneeRevenus, setAnneeRevenus] = useState(() => new Date().getFullYear());

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, repRes] = await Promise.all([
        getStatistiques(utilisateur.site_id, dateDebut, dateFin, axeId || "", filterType || "", filterTaxe || ""),
        getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin),
      ]);
      if (statsRes.status === "success" && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setError(statsRes.message || "Erreur lors du chargement des statistiques.");
      }
      if (repRes.status === "success" && repRes.data) setRepartition(repRes.data);
    } catch (e) {
      console.error(e);
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin, axeId, filterType, filterTaxe]);

  useEffect(() => { load(); }, [load]);

  const loadRevenus = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    const res = await getRevenusMensuels(utilisateur.site_id, anneeRevenus);
    if (res.status === "success" && res.data) setRevenusMensuels(res.data);
  }, [utilisateur?.site_id, anneeRevenus]);

  useEffect(() => { loadRevenus(); }, [loadRevenus]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getAxes(utilisateur.site_id, 1, 200).then((res) => {
        if (res.status === "success" && res.data) setAxes(res.data.communes);
      });
      getTypesContribuable(utilisateur.site_id).then((res) => {
        if (res.status === "success" && res.data) setTypesContribuable(res.data);
      });
      getTypesTaxe(utilisateur.site_id).then((res) => {
        if (res.status === "success" && res.data) setTypesTaxe(res.data);
      });
    }
  }, [utilisateur?.site_id]);

  if (loading) {
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

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{error || "Aucune donnée disponible."}</p>
        <button onClick={load} className="px-4 py-2 bg-[#153258] text-white rounded-lg hover:bg-[#153258]/90 text-sm font-medium">Réessayer</button>
      </div>
    );
  }

  const maxEvolution = Math.max(...(stats.evolution_journaliere?.map((e) => Number(e.total)) || [1]), 1);
  const totalModes = (stats.par_mode?.reduce((s, m) => s + Number(m.total), 0)) || 1;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taxe d&apos;assainissement — Vue d&apos;ensemble</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={axeId} onChange={(e) => setAxeId(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Tous les axes</option>
              {axes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Tous types contribuable</option>
              {typesContribuable.map((t) => (
                <option key={t.id} value={t.code}>{t.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <select value={filterTaxe} onChange={(e) => setFilterTaxe(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Tous types de taxe</option>
              {typesTaxe.map((t) => (
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Collecte aujourd'hui", value: formatMontant(Number(stats.collecte_aujourdhui)), icon: DollarSign, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Collecte semaine", value: formatMontant(Number(stats.collecte_semaine)), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Collecte mois", value: formatMontant(Number(stats.collecte_mois)), icon: Wallet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Total période", value: formatMontant(Number(stats.total_collecte)), icon: Coins, color: "text-[#153258]", bg: "bg-[#153258]/5" },
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

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contribuables</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_contribuables}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Factures impayées</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.factures_impayees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Passages services</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_passages} <span className="text-xs text-green-500 font-normal">({stats.passages_termines} terminés)</span></p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Taux recouvrement</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.taux_recouvrement ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row: Évolution + Mode de paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution journalière */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#153258]" /> Évolution journalière
          </h3>
          {!stats.evolution_journaliere?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée pour cette période</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.evolution_journaliere.map((e) => (
                <div key={e.jour} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">
                    {new Date(e.jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#153258] to-[#23A974] rounded-full transition-all"
                      style={{ width: `${(Number(e.total) / maxEvolution) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 text-right">
                    {formatMontant(Number(e.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Par mode de paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#23A974]" /> Répartition par mode de paiement
          </h3>
          {!stats.par_mode?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {stats.par_mode.map((m) => {
                const pct = ((Number(m.total) / totalModes) * 100).toFixed(1);
                return (
                  <div key={m.mode_paiement}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{MODE_LABELS[m.mode_paiement] || m.mode_paiement} <span className="text-xs text-gray-400">({m.nb} paiements)</span></span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatMontant(Number(m.total))} ({pct}%)</span>
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

      {/* Revenus mensuels — facturé vs collecté */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#153258]" /> Recettes mensuelles — Facturé vs Collecté
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setAnneeRevenus(anneeRevenus - 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[4rem] text-center">{anneeRevenus}</span>
            <button onClick={() => setAnneeRevenus(anneeRevenus + 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {revenusMensuels.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune facture générée pour {anneeRevenus}</p>
        ) : (
          <>
            {/* Barres visuelles */}
            <div className="space-y-3 mb-4">
              {revenusMensuels.map((r) => {
                const pct = r.total_facture > 0 ? (r.total_paye / r.total_facture) * 100 : 0;
                return (
                  <div key={r.mois}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">{r.mois_nom}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">Facturé : <strong className="text-gray-900 dark:text-white">{formatMontant(r.total_facture)}</strong></span>
                        <span className="text-[#23A974]">Collecté : <strong>{formatMontant(r.total_paye)}</strong></span>
                        {r.reste > 0 && <span className="text-red-500">Reste : <strong>{formatMontant(r.reste)}</strong></span>}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#23A974' : pct >= 50 ? 'linear-gradient(90deg, #153258, #23A974)' : '#153258' }} />
                    </div>
                    <div className="text-right mt-0.5">
                      <span className={`text-xs font-bold ${pct >= 100 ? 'text-[#23A974]' : pct >= 50 ? 'text-blue-600' : 'text-red-500'}`}>{r.taux}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Totaux */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total facturé</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatMontant(revenusMensuels.reduce((s, r) => s + r.total_facture, 0))}</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-600" />
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total collecté</p>
                <p className="text-lg font-bold text-[#23A974] mt-1">{formatMontant(revenusMensuels.reduce((s, r) => s + r.total_paye, 0))}</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-600" />
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reste à collecter</p>
                <p className="text-lg font-bold text-red-500 mt-1">{formatMontant(revenusMensuels.reduce((s, r) => s + r.reste, 0))}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Par Commune + Par Type Contribuable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par Commune */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#153258]" /> Collecte par axe
          </h3>
          {!stats.par_axe?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Axe</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.par_axe.map((c) => (
                    <tr key={c.commune} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white">{c.commune}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-400">{c.nb}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatMontant(Number(c.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Par type contribuable */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#153258]" /> Collecte par type de contribuable
          </h3>
          {!stats.par_type_contribuable?.length ? (
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
                  {stats.par_type_contribuable.map((t) => (
                    <tr key={t.type_contribuable} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white capitalize">{t.type_contribuable}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-400">{t.nb}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatMontant(Number(t.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Collecte par utilisateur */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#23A974]" /> Récoltes par utilisateur
          </h3>
          {!stats.par_utilisateur?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Utilisateur</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb paiements</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.par_utilisateur.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white">{u.utilisateur || "Inconnu"}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-400">{u.nb}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatMontant(Number(u.total))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                    <td className="py-2 font-bold text-gray-900 dark:text-white">Total</td>
                    <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{stats.par_utilisateur.reduce((s, u) => s + Number(u.nb), 0)}</td>
                    <td className="py-2 text-right font-bold text-[#23A974]">{formatMontant(stats.par_utilisateur.reduce((s, u) => s + Number(u.total), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
      </div>

      {/* Contrôles & Sanctions + Montant impayé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" /> Contrôles & Infractions
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total contrôles</span>
              <span className="font-bold text-gray-900 dark:text-white">{stats.nb_controles ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-400">Infractions</span>
              <span className="font-bold text-red-700 dark:text-red-400">{stats.nb_infractions ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-sm text-orange-700 dark:text-orange-400">Sanctions actives</span>
              <span className="font-bold text-orange-700 dark:text-orange-400">{stats.sanctions_actives ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Impayés
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Factures impayées</span>
              <span className="font-bold text-gray-900 dark:text-white">{stats.factures_impayees ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm text-amber-700 dark:text-amber-400">Montant impayé</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{formatMontant(Number(stats.montant_impaye ?? 0))}</span>
            </div>
          </div>
        </div>

        {/* Répartition button */}
        <div className="flex flex-col justify-center">
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
    </div>
  );
}
