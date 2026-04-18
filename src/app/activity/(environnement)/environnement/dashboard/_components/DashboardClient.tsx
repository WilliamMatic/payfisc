"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStatistiques, getRepartitionGlobale, getCommunes } from "@/services/environnement/environnementService";
import { Statistiques, RepartitionGlobale, Commune } from "@/services/environnement/types";
import {
  TrendingUp, DollarSign, Calendar, ArrowUpRight, Wallet, Coins,
  PieChart, BarChart3, Eye, X, Filter, Shield, AlertTriangle,
  Users, FileText, CheckCircle, Leaf, Factory,
} from "lucide-react";

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "CDF" }).format(n);

const MODE_LABELS: Record<string, string> = { especes: "Espèces", mobile_money: "Mobile Money", banque: "Banque" };
const MODE_COLORS: Record<string, string> = { especes: "bg-green-500", mobile_money: "bg-blue-500", banque: "bg-purple-500" };

export default function DashboardClient() {
  const { utilisateur } = useAuth();
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [repartition, setRepartition] = useState<RepartitionGlobale[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [communeId, setCommuneId] = useState("");
  const [showRepartition, setShowRepartition] = useState(false);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, repRes] = await Promise.all([
        getStatistiques(utilisateur.site_id, dateDebut, dateFin, communeId || ""),
        getRepartitionGlobale(utilisateur.site_id, dateDebut, dateFin),
      ]);
      if (statsRes.status === "success" && statsRes.data) setStats(statsRes.data);
      else setError(statsRes.message || "Erreur lors du chargement.");
      if (repRes.status === "success" && repRes.data) setRepartition(repRes.data);
    } catch { setError("Impossible de contacter le serveur."); }
    setLoading(false);
  }, [utilisateur?.site_id, dateDebut, dateFin, communeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (utilisateur?.site_id) {
      getCommunes(utilisateur.site_id, 1, 200).then((res) => {
        if (res.status === "success" && res.data) setCommunes(res.data.communes);
      });
    }
  }, [utilisateur?.site_id]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-32" />)}
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{error || "Aucune donnée."}</p>
      <button onClick={load} className="px-4 py-2 bg-[#153258] text-white rounded-lg hover:bg-[#153258]/90 text-sm font-medium">Réessayer</button>
    </div>
  );

  const maxEvolution = Math.max(...(stats.evolution_journaliere?.map((e) => Number(e.total)) || [1]), 1);
  const totalModes = (stats.par_mode?.reduce((s, m) => s + Number(m.total), 0)) || 1;

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taxe d&apos;environnement — Vue d&apos;ensemble</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={communeId} onChange={(e) => setCommuneId(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer">
              <option value="">Toutes les communes</option>
              {communes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
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
              <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.color}`} /></div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contribuables", value: stats.nb_contribuables, icon: Users, iconColor: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Factures impayées", value: stats.factures_impayees, icon: FileText, iconColor: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "Taux conformité", value: `${stats.taux_conformite ?? 0}%`, icon: Leaf, iconColor: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Taux recouvrement", value: `${stats.taux_recouvrement ?? 0}%`, icon: CheckCircle, iconColor: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.iconColor}`} /></div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts: Évolution + Mode paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 text-right">{formatMontant(Number(e.total))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
                      <span className="text-gray-700 dark:text-gray-300">{MODE_LABELS[m.mode_paiement] || m.mode_paiement} <span className="text-xs text-gray-400">({m.nb})</span></span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatMontant(Number(m.total))} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-full ${MODE_COLORS[m.mode_paiement] || "bg-gray-500"} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Par Commune + Par Type Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#153258]" /> Collecte par commune
          </h3>
          {!stats.par_commune?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Commune</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                </tr></thead>
                <tbody>
                  {stats.par_commune.map((c) => (
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

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4 text-[#153258]" /> Collecte par type d&apos;activité
          </h3>
          {!stats.par_type_activite?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Activité</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Nb</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Montant</th>
                </tr></thead>
                <tbody>
                  {stats.par_type_activite.map((t) => (
                    <tr key={t.type_activite} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 font-medium text-gray-900 dark:text-white capitalize">{t.type_activite}</td>
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

      {/* Contrôles & Sanctions + Impayés + Répartition */}
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

        <div className="flex flex-col justify-center">
          <button onClick={() => setShowRepartition(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium">
            <Eye className="w-4 h-4" /> Voir répartition par bénéficiaire
          </button>
        </div>
      </div>

      {/* Niveau pollution + Niveau risque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-500" /> Par niveau de pollution
          </h3>
          {!stats.par_niveau_pollution?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {stats.par_niveau_pollution.map((p) => (
                <div key={p.classification} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{p.classification}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{p.nb} évaluation(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" /> Par niveau de risque
          </h3>
          {!stats.par_niveau_risque?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {stats.par_niveau_risque.map((r) => (
                <div key={r.niveau_risque} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize font-medium">{r.niveau_risque}</span>
                    <span className="text-xs text-gray-400 ml-2">({r.nb_contribuables} contribuables)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{formatMontant(Number(r.total))}</span>
                </div>
              ))}
            </div>
          )}
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
              <button onClick={() => setShowRepartition(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
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
                    <p className="text-lg font-bold text-[#153258]">{formatMontant(repartition.reduce((s, r) => s + Number(r.total_montant), 0))}</p>
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
