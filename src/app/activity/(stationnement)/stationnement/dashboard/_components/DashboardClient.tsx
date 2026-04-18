"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStatistiques, getRepartitionGlobale, getZones,
} from "@/services/stationnement/stationnementService";
import {
  StatistiquesStationnement, RepartitionGlobale, ZoneStationnement,
} from "@/services/stationnement/types";
import {
  TrendingUp, DollarSign, Calendar, ArrowUpRight, Wallet, Coins,
  PieChart, BarChart3, Eye, X, Filter, Clock, Shield, AlertTriangle,
  Users, Car, MapPin,
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
  const [stats, setStats] = useState<StatistiquesStationnement | null>(null);
  const [repartition, setRepartition] = useState<RepartitionGlobale[]>([]);
  const [zones, setZones] = useState<ZoneStationnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [zoneId, setZoneId] = useState("");
  const [showRepartition, setShowRepartition] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, repRes] = await Promise.all([
        getStatistiques(utilisateur.site_id, dateDebut, dateFin, zoneId || undefined),
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
  }, [utilisateur?.site_id, dateDebut, dateFin, zoneId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (utilisateur?.site_id) {
      getZones(utilisateur.site_id, 1, 100).then((res) => {
        if (res.status === "success" && res.data) setZones(res.data.zones);
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
  const totalModes = (stats.par_mode_paiement?.reduce((s, m) => s + Number(m.total), 0)) || 1;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taxe de stationnement — Vue d&apos;ensemble</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.nom}</option>
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
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paiements</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_paiements}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sessions période</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_stationnements_periode}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Durée moy.</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.duree_moyenne ? `${Math.round(Number(stats.duree_moyenne))} min` : "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contrôles</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.nb_controles ?? 0}</p>
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
          {!stats.par_mode_paiement?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-4">
              {stats.par_mode_paiement.map((m) => {
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

      {/* Par Zone + Par Type Véhicule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#153258]" /> Collecte par zone
          </h3>
          {!stats.par_zone?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Zone</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.par_zone.map((z) => (
                    <tr key={z.zone_nom} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white">{z.zone_nom}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-gray-400">{z.nb}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatMontant(Number(z.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Par type véhicule */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-[#153258]" /> Collecte par type de véhicule
          </h3>
          {!stats.par_type_vehicule?.length ? (
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
                    <tr key={t.vehicule_type} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white capitalize">{t.vehicule_type}</td>
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

      {/* Heures de pointe + Contrôles/Fraude + Amendes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heures de pointe */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" /> Heures de pointe
          </h3>
          {!stats.heures_pointe?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {stats.heures_pointe.map((h) => {
                const maxH = Math.max(...stats.heures_pointe.map((x) => Number(x.nb)), 1);
                return (
                  <div key={h.heure} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-10 shrink-0">{h.heure}h</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(Number(h.nb) / maxH) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{h.nb}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contrôles & Fraude */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" /> Contrôles & Fraude
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total contrôles</span>
              <span className="font-bold text-gray-900 dark:text-white">{stats.nb_controles ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-400">Conformes</span>
              <span className="font-bold text-green-700 dark:text-green-400">{(stats.nb_controles ?? 0) - (stats.nb_infractions ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-400">Infractions</span>
              <span className="font-bold text-red-700 dark:text-red-400">{stats.nb_infractions ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-sm text-orange-700 dark:text-orange-400">Taux fraude</span>
              <span className="font-bold text-orange-700 dark:text-orange-400">{stats.taux_fraude ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Amendes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Amendes
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total amendes</span>
              <span className="font-bold text-gray-900 dark:text-white">{stats.nb_amendes ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm text-amber-700 dark:text-amber-400">Montant total</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{formatMontant(Number(stats.total_amendes ?? 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top agents + Bouton répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top agents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#153258]" /> Top agents collecteurs
          </h3>
          {!stats.top_agents?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {stats.top_agents.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#153258] to-[#23A974] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.agent_nom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.nb_paiements} paiement(s)</p>
                  </div>
                  <p className="text-sm font-bold text-[#23A974]">{formatMontant(Number(a.total_collecte))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition */}
        <div className="space-y-6">
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
